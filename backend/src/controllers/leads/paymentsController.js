const pool = require("../../config/db");
const {
  discountedTotalWithGst,
  feeBalanceFromBaseDiscounted,
} = require("../../utils/feeGst");

// ========================== RECORD INSTALLMENT ==========================

async function recordInstallmentAndSplitShares(req, res) {
  const { lead_id } = req.params;
  const { amount, payment_date, payment_mode, remarks } = req.body;

  if (!lead_id || !amount || !payment_date) {
    return res
      .status(400)
      .json({ error: "lead_id, amount, and payment_date are required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Get student fee details
    const leadRes = await client.query(
      `SELECT actual_fee, discounted_fee, fee_paid FROM leads WHERE lead_id = $1`,
      [lead_id]
    );
    if (leadRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Lead not found." });
    }

    const { actual_fee, discounted_fee, fee_paid } = leadRes.rows[0];

    const paidSoFar = parseFloat(fee_paid || 0);
    const totalTrainingDue =
      discountedTotalWithGst(discounted_fee) ?? 0;
    const remaining = totalTrainingDue - paidSoFar;

    if (amount > remaining) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `Installment exceeds remaining fee. Remaining: ₹${remaining}`,
      });
    }

    // 2. Get current installment count for this lead
    const countRes = await client.query(
      `SELECT COUNT(*) FROM installments WHERE lead_id = $1`,
      [lead_id]
    );
    const currentInstallmentCount = parseInt(countRes.rows[0].count) + 1;

    // 3. Insert new installment with new count
    const installmentResult = await client.query(
      `INSERT INTO installments (
         lead_id, amount, paid_amount, payment_date,
         payment_mode, remarks, installment_count
       )
       VALUES ($1, $2, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        lead_id,
        amount,
        payment_date,
        payment_mode || null,
        remarks || null,
        currentInstallmentCount,
      ]
    );
    const installment = installmentResult.rows[0];

    // 4. Update fee_paid, fee_balance, and paid_status in leads
    const updatedFeePaid = paidSoFar + parseFloat(amount);
    const updatedFeeBalance = feeBalanceFromBaseDiscounted(
      discounted_fee,
      updatedFeePaid
    );

    let newStatus = 'unpaid';
    if (updatedFeePaid >= totalTrainingDue) {
      newStatus = 'paid';
    } else if (updatedFeePaid > 0) {
      newStatus = 'partially paid';
    }

    await client.query(
      `UPDATE leads SET fee_paid = $1, fee_balance = $2, paid_status = $3 WHERE lead_id = $4`,
      [updatedFeePaid, updatedFeeBalance, newStatus, lead_id]
    );

    // 5. Get all lead_sub_courses for this lead (single or multi-course)
    const subCoursesRes = await client.query(
      `SELECT lsc.sub_course_id, lsc.trainer_id, lsc.trainer_share, sc.sub_course_name, t.trainer_name
       FROM lead_sub_courses lsc
       JOIN sub_courses sc ON lsc.sub_course_id = sc.sub_course_id
       JOIN trainer t ON lsc.trainer_id = t.trainer_id
       WHERE lsc.lead_id = $1`,
      [lead_id]
    );
    let subCourses = subCoursesRes.rows;
    let trainerShares = [];
    let totalTrainerShare = 0;

    if (subCourses.length > 0) {
      // Multi/sub-course case
      for (const subCourse of subCourses) {
        const share = (amount * (parseFloat(subCourse.trainer_share) || 0)) / 100;
        totalTrainerShare += share;
        trainerShares.push({
          trainer_id: subCourse.trainer_id,
          trainer_name: subCourse.trainer_name,
          sub_course_id: subCourse.sub_course_id,
          sub_course_name: subCourse.sub_course_name,
          share_percentage: subCourse.trainer_share,
          share_amount: share,
        });
      }
    } else {
      // Single course fallback: get trainer from leads table
      const singleTrainerRes = await client.query(
        `SELECT l.trainer_id, t.trainer_name, l.batch_id FROM leads l JOIN trainer t ON l.trainer_id = t.trainer_id WHERE l.lead_id = $1`,
        [lead_id]
      );
      if (singleTrainerRes.rowCount === 0 || !singleTrainerRes.rows[0].trainer_id) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "No trainers found for this lead. Please assign a trainer." });
      }
      const { trainer_id, trainer_name, batch_id } = singleTrainerRes.rows[0];
      // Get share % from batch_trainers if available, else default to 100
      let share_percentage = 100;
      if (batch_id) {
        const batchShareRes = await client.query(
          `SELECT share_percentage FROM batch_trainers WHERE batch_id = $1 AND trainer_id = $2`,
          [batch_id, trainer_id]
        );
        if (batchShareRes.rowCount > 0) {
          share_percentage = parseFloat(batchShareRes.rows[0].share_percentage) || 100;
        }
      }
      const share = (amount * share_percentage) / 100;
      totalTrainerShare = share;
      trainerShares.push({
        trainer_id,
        trainer_name,
        sub_course_id: null,
        sub_course_name: null,
        share_percentage,
        share_amount: share,
      });
    }

    // Insert trainer payouts (per sub-course/trainer or single trainer)
    for (const ts of trainerShares) {
      await client.query(
        `INSERT INTO trainer_payouts (trainer_id, lead_id, installment_id, amount, paid_on, status)
         VALUES ($1, $2, $3, $4, NULL, 'Pending')`,
        [ts.trainer_id, lead_id, installment.installment_id, ts.share_amount]
      );
    }

    const instituteShare = amount - totalTrainerShare;

    await client.query("COMMIT");

    // Generate and send payment tax invoice automatically
    try {
      console.log(`💳 Payment recorded successfully. Generating invoice for lead ${lead_id}...`);

      const { generateAndSaveReceipt } = require("../../services/receiptService");
      const { sendPaymentReceiptEmail } = require("../../services/emailservice");

      // Generate invoice image
      const receiptData = await generateAndSaveReceipt(lead_id, installment.installment_id);

      // Send invoice via email
      await sendPaymentReceiptEmail(receiptData);

      console.log(`✅ Payment invoice generated and sent successfully`);
    } catch (receiptErr) {
      console.error("❌ Error generating/sending payment invoice:", receiptErr);
      console.error("Receipt Error Stack:", receiptErr.stack);
      // Don't fail the payment recording if receipt generation fails
      // Just log the error and continue
    }

    return res.status(201).json({
      success: true,
      installment,
      trainerShares,
      totalTrainerShare,
      instituteShare,
      fees: {
        actual_fee,
        discounted_fee,
        fee_paid: updatedFeePaid,
        fee_balance: updatedFeeBalance,
        installment_number: currentInstallmentCount,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error recording payment and calculating shares:", err);
    return res
      .status(500)
      .json({ error: "Failed to record payment and split shares." });
  } finally {
    client.release();
  }
}

// ========================== GET PAYMENT INFO ==========================

async function getPaymentInfo(req, res) {
  const { lead_id } = req.params;
  const client = await pool.connect();
  try {
    // Get lead info
    const leadRes = await client.query(
      `SELECT actual_fee, discounted_fee, fee_paid, fee_balance, batch_id 
       FROM leads WHERE lead_id = $1`,
      [lead_id]
    );
    if (leadRes.rowCount === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }
    const {
      actual_fee,
      discounted_fee,
      fee_paid,
      fee_balance,
      batch_id,
    } = leadRes.rows[0];

    // Count installments for this lead
    const countRes = await client.query(
      `SELECT COUNT(*) FROM installments WHERE lead_id = $1`,
      [lead_id]
    );
    const installment_number = parseInt(countRes.rows[0].count, 10) + 1;

    // Get trainers for this batch
    const trainerRes = await client.query(
      `SELECT t.trainer_id, t.trainer_name, bt.share_percentage
       FROM batch_trainers bt
       JOIN trainer t ON t.trainer_id = bt.trainer_id
       WHERE bt.batch_id = $1`,
      [batch_id]
    );
    const trainers = trainerRes.rows;
    const totalTrainerPercentage = trainers.reduce(
      (acc, tr) => acc + parseFloat(tr.share_percentage),
      0
    );
    const institute_percentage = 100 - totalTrainerPercentage;

    return res.json({
      actual_fee,
      discounted_fee,
      fee_paid,
      fee_balance,
      installment_number,
      trainers,
      institute_percentage,
    });
  } catch (err) {
    console.error("Error fetching payment info:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// ========================== GET ALL INSTALLMENTS FOR LEAD ==========================
async function getInstallmentsForLead(req, res) {
  const { lead_id } = req.params;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT i.*,
        (SELECT reason FROM payment_audit_logs pal 
         WHERE pal.payment_id = i.installment_id 
         AND pal.payment_type = 'course'
         ORDER BY pal.updated_at DESC LIMIT 1) as edit_reason
       FROM installments i WHERE lead_id = $1 ORDER BY installment_count ASC`,
      [lead_id]
    );
    return res.json({ installments: result.rows });
  } catch (err) {
    console.error("Error fetching installments for lead:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// ========================== GET ALL TRAINER SHARES FOR LEAD ==========================
async function getTrainerSharesForLead(req, res) {
  const { lead_id } = req.params;
  const client = await pool.connect();
  try {
    // Aggregate trainer shares for this lead
    const breakdownRes = await client.query(
      `SELECT 
         tp.trainer_id,
         t.trainer_name,
         SUM(tp.amount) AS total_share,
         SUM(CASE WHEN tp.status = 'Paid' THEN tp.amount ELSE 0 END) AS paid_share,
         SUM(CASE WHEN tp.status != 'Paid' THEN tp.amount ELSE 0 END) AS pending_share
       FROM trainer_payouts tp
       JOIN trainer t ON tp.trainer_id = t.trainer_id
       WHERE tp.lead_id = $1
       GROUP BY tp.trainer_id, t.trainer_name
       ORDER BY t.trainer_name ASC`
      , [lead_id]
    );
    return res.json({ trainerShares: breakdownRes.rows });
  } catch (err) {
    console.error("Error fetching trainer shares for lead:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// ========================== GET ALL INSTALLMENTS ==========================
async function getAllInstallments(req, res) {
  const client = await pool.connect();
  try {
    const result = await pool.query(`
      SELECT 
        i.installment_id,
        i.lead_id,
        i.amount,
        i.paid_amount,
        i.payment_date,
        i.payment_mode,
        i.remarks,
        i.installment_count,
        l.name AS student_name,
        l.mobile_number AS mobile,
        l.course_id,
        c.course_name,
        b.batch_name,
        t.trainer_name,
        (SELECT reason FROM payment_audit_logs pal 
         WHERE pal.payment_id = i.installment_id 
         AND pal.payment_type = 'course'
         ORDER BY pal.updated_at DESC LIMIT 1) as edit_reason
      FROM installments i
      JOIN leads l ON i.lead_id = l.lead_id
      LEFT JOIN course c ON l.course_id = c.course_id
      LEFT JOIN batch b ON l.batch_id = b.batch_id
      LEFT JOIN trainer t ON l.trainer_id = t.trainer_id
      ORDER BY i.payment_date DESC, i.installment_id DESC
    `);

    return res.json({ success: true, installments: result.rows });
  } catch (err) {
    console.error("Error fetching all installments:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
}

// ========================== UPDATE INSTALLMENT ==========================
async function updateInstallment(req, res) {
  const { installment_id } = req.params;
  const { amount, payment_date, payment_mode, remarks, reason } = req.body;
  const userId = req.user?.userId || null; // Assuming authMiddleware populates this

  if (!installment_id || !amount || !payment_date || !reason) {
    return res.status(400).json({ error: "Amount, Date, and Reason are required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Ensure audit log table exists (Migration fallback)
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_audit_logs (
        log_id SERIAL PRIMARY KEY,
        payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('course', 'placement')),
        payment_id INTEGER NOT NULL,
        old_amount DECIMAL(10, 2),
        new_amount DECIMAL(10, 2),
        old_mode VARCHAR(50),
        new_mode VARCHAR(50),
        old_date DATE,
        new_date DATE,
        reason TEXT NOT NULL,
        updated_by_user_id INTEGER,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 1. Fetch original installment
    const oldRes = await client.query(`SELECT * FROM installments WHERE installment_id = $1`, [installment_id]);
    if (oldRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Payment record not found." });
    }
    const oldInstallment = oldRes.rows[0];
    const lead_id = oldInstallment.lead_id;

    // 2. Audit Log
    await client.query(
      `INSERT INTO payment_audit_logs (
        payment_type, payment_id, old_amount, new_amount, 
        old_mode, new_mode, old_date, new_date, reason, updated_by_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        'course', installment_id, oldInstallment.amount, amount,
        oldInstallment.payment_mode, payment_mode, oldInstallment.payment_date, payment_date, reason, userId
      ]
    );

    // 3. Update Installment
    const updatedRes = await client.query(
      `UPDATE installments 
       SET amount = $1, payment_date = $2, payment_mode = $3, remarks = $4 
       WHERE installment_id = $5 RETURNING *`,
      [amount, payment_date, payment_mode, remarks, installment_id]
    );
    const updatedInstallment = updatedRes.rows[0];

    // 4. Update Leads Table (Recalculate totals)
    // We fetch fresh totals from installments table to be safe, or do diff math.
    // Diff math is faster:
    const diffAmount = parseFloat(amount) - parseFloat(oldInstallment.amount);

    // Fetch current lead state to update from
    const leadRes = await client.query(`SELECT actual_fee, discounted_fee, fee_paid FROM leads WHERE lead_id = $1`, [lead_id]);
    const leadData = leadRes.rows[0];

    const newFeePaid = parseFloat(leadData.fee_paid || 0) + diffAmount;
    const totalDue =
      discountedTotalWithGst(leadData.discounted_fee) ?? 0;
    const newFeeBalance = feeBalanceFromBaseDiscounted(
      leadData.discounted_fee,
      newFeePaid
    );

    let newStatus = 'unpaid';
    if (newFeePaid >= totalDue) {
      newStatus = 'paid';
    } else if (newFeePaid > 0) {
      newStatus = 'partially paid';
    }

    await client.query(
      `UPDATE leads SET fee_paid = $1, fee_balance = $2, paid_status = $3 WHERE lead_id = $4`,
      [newFeePaid, newFeeBalance, newStatus, lead_id]
    );

    // 5. Recalculate Trainer Payouts
    // Delete old payouts
    await client.query(`DELETE FROM trainer_payouts WHERE installment_id = $1`, [installment_id]);

    // Re-insert payouts (Logic copied from recordInstallmentAndSplitShares)
    // Get all lead_sub_courses for this lead (single or multi-course)
    const subCoursesRes = await client.query(
      `SELECT lsc.sub_course_id, lsc.trainer_id, lsc.trainer_share, sc.sub_course_name, t.trainer_name
       FROM lead_sub_courses lsc
       JOIN sub_courses sc ON lsc.sub_course_id = sc.sub_course_id
       JOIN trainer t ON lsc.trainer_id = t.trainer_id
       WHERE lsc.lead_id = $1`,
      [lead_id]
    );
    let subCourses = subCoursesRes.rows;
    let trainerShares = [];

    if (subCourses.length > 0) {
      // Multi/sub-course case
      for (const subCourse of subCourses) {
        const share = (amount * (parseFloat(subCourse.trainer_share) || 0)) / 100;
        trainerShares.push({
          trainer_id: subCourse.trainer_id,
          share_amount: share,
        });
      }
    } else {
      // Single course fallback
      const singleTrainerRes = await client.query(
        `SELECT l.trainer_id, t.trainer_name, l.batch_id FROM leads l JOIN trainer t ON l.trainer_id = t.trainer_id WHERE l.lead_id = $1`,
        [lead_id]
      );
      if (singleTrainerRes.rowCount > 0 && singleTrainerRes.rows[0].trainer_id) {
        const { trainer_id, batch_id } = singleTrainerRes.rows[0];
        let share_percentage = 100;
        if (batch_id) {
          const batchShareRes = await client.query(
            `SELECT share_percentage FROM batch_trainers WHERE batch_id = $1 AND trainer_id = $2`,
            [batch_id, trainer_id]
          );
          if (batchShareRes.rowCount > 0) {
            share_percentage = parseFloat(batchShareRes.rows[0].share_percentage) || 100;
          }
        }
        const share = (amount * share_percentage) / 100;
        trainerShares.push({
          trainer_id,
          share_amount: share,
        });
      }
    }

    for (const ts of trainerShares) {
      await client.query(
        `INSERT INTO trainer_payouts (trainer_id, lead_id, installment_id, amount, paid_on, status)
         VALUES ($1, $2, $3, $4, NULL, 'Pending')`,
        [ts.trainer_id, lead_id, installment_id, ts.share_amount]
      );
    }

    await client.query("COMMIT");
    return res.json({ success: true, message: "Payment updated successfully" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating payment:", err);
    return res.status(500).json({ error: "Failed to update payment." });
  } finally {
    client.release();
  }
}

// ========================== DELETE INSTALLMENT ==========================
async function deleteInstallment(req, res) {
  const { installment_id } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Get the installment details
    const installmentRes = await client.query(
      `SELECT lead_id, amount FROM installments 
       WHERE installment_id = $1`,
      [installment_id]
    );

    if (installmentRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Payment not found" });
    }

    const { lead_id, amount } = installmentRes.rows[0];

    // 2. Get current lead fee info
    const leadRes = await client.query(
      `SELECT discounted_fee, fee_paid FROM leads WHERE lead_id = $1`,
      [lead_id]
    );

    const { discounted_fee, fee_paid } = leadRes.rows[0];

    // 3. Delete the installment
    // Note: trainer_payouts should cascade delete if foreign key is set up correctly, 
    // but we'll manually delete just in case or if constraints are strict.
    await client.query(`DELETE FROM trainer_payouts WHERE installment_id = $1`, [installment_id]);
    await client.query(`DELETE FROM installments WHERE installment_id = $1`, [installment_id]);

    // 4. Update lead's fee_paid
    const updatedFeePaid = parseFloat(fee_paid || 0) - parseFloat(amount);
    const totalDueDel =
      discountedTotalWithGst(discounted_fee) ?? 0;
    const updatedFeeBalance = feeBalanceFromBaseDiscounted(
      discounted_fee,
      updatedFeePaid
    );

    // 5. Recalculate paid_status
    let paid_status;
    if (updatedFeePaid <= 0) {
      paid_status = "unpaid";
    } else if (updatedFeePaid >= totalDueDel) {
      paid_status = "paid";
    } else {
      paid_status = "partially paid";
    }

    // 6. Update leads table
    await client.query(
      `UPDATE leads 
       SET fee_paid = $1,
           fee_balance = $2,
           paid_status = $3
       WHERE lead_id = $4`,
      [Math.max(0, updatedFeePaid), updatedFeeBalance, paid_status, lead_id]
    );

    // 7. Renumber remaining installments
    await client.query(
      `WITH numbered AS (
        SELECT installment_id,
               ROW_NUMBER() OVER (ORDER BY payment_date, installment_id) as new_count
        FROM installments
        WHERE lead_id = $1
      )
      UPDATE installments i
      SET installment_count = numbered.new_count
      FROM numbered
      WHERE i.installment_id = numbered.installment_id`,
      [lead_id]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting payment:", err);
    return res.status(500).json({
      error: "Failed to delete payment",
      details: err.message,
    });
  } finally {
    client.release();
  }
}

module.exports = {
  recordInstallmentAndSplitShares,
  getPaymentInfo,
  getInstallmentsForLead,
  getTrainerSharesForLead,
  getAllInstallments,
  updateInstallment,
  deleteInstallment,
};
