const pool = require("../../config/db");
const {
  discountedTotalWithGst,
  placementBaseAmount,
  placementBalanceAfterGst,
} = require("../../utils/feeGst");

// ========================== RECORD PLACEMENT PAYMENT ==========================

async function recordPlacementPayment(req, res) {
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

    // 1. Get lead placement fee details (use placement_discounted_fee for remaining balance)
    const leadRes = await client.query(
      `SELECT placement_fee, placement_discounted_fee, placement_paid, name 
       FROM leads WHERE lead_id = $1`,
      [lead_id]
    );

    if (leadRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Lead not found." });
    }

    const { placement_fee, placement_discounted_fee, placement_paid, name } = leadRes.rows[0];
    const placementBase = placementBaseAmount(
      placement_discounted_fee,
      placement_fee
    );
    const totalPlacementDue =
      discountedTotalWithGst(placementBase) ?? 0;

    // Check if placement fee is set
    if (!totalPlacementDue || totalPlacementDue <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "No placement fee set for this lead.",
      });
    }

    const paidSoFar = parseFloat(placement_paid || 0);
    const remaining = totalPlacementDue - paidSoFar;

    // Check if payment exceeds remaining
    if (parseFloat(amount) > remaining) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `Payment exceeds remaining placement fee. Remaining: ₹${remaining.toFixed(
          2
        )}`,
      });
    }

    // 2. Get current placement installment count for this lead
    const countRes = await client.query(
      `SELECT COUNT(*) FROM placement_installments WHERE lead_id = $1`,
      [lead_id]
    );
    const currentInstallmentCount = parseInt(countRes.rows[0].count) + 1;

    // 3. Insert new placement installment
    const installmentResult = await client.query(
      `INSERT INTO placement_installments (
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

    // 4. Update placement_paid in leads
    const updatedPlacementPaid = paidSoFar + parseFloat(amount);
    const updatedPlacementBalance = placementBalanceAfterGst(
      placement_discounted_fee,
      placement_fee,
      updatedPlacementPaid
    );

    // 5. Calculate new placement_paid_status (based on discounted fee incl. GST)
    let placement_paid_status;
    if (updatedPlacementPaid <= 0) {
      placement_paid_status = "not paid";
    } else if (updatedPlacementPaid >= totalPlacementDue) {
      placement_paid_status = "paid";
    } else {
      placement_paid_status = "partially paid";
    }

    // 6. Update leads table
    await client.query(
      `UPDATE leads 
       SET placement_paid = $1, 
           placement_paid_status = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE lead_id = $3`,
      [updatedPlacementPaid, placement_paid_status, lead_id]
    );

    await client.query("COMMIT");

    // Generate and send placement payment tax invoice automatically
    try {
      console.log(
        `💳 Placement payment recorded successfully. Generating invoice for lead ${lead_id}...`
      );
      const {
        generateAndSavePlacementReceipt,
      } = require("../../services/receiptService");
      const { sendPaymentReceiptEmail } = require("../../services/emailservice");

      const receiptData = await generateAndSavePlacementReceipt(
        lead_id,
        installment.placement_installment_id
      );
      await sendPaymentReceiptEmail(receiptData);
      console.log(`✅ Placement payment invoice generated and sent successfully`);
    } catch (invoiceErr) {
      console.error(
        "❌ Error generating/sending placement payment invoice:",
        invoiceErr
      );
      console.error("Placement invoice error stack:", invoiceErr.stack);
      // Do not fail the payment transaction for email/invoice issues
    }

    return res.status(201).json({
      success: true,
      message: "Placement payment recorded successfully",
      installment,
      placement_info: {
        placement_fee: totalPlacementDue,
        placement_paid: updatedPlacementPaid,
        placement_balance: updatedPlacementBalance,
        placement_paid_status,
        installment_number: currentInstallmentCount,
      },
      student_name: name,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error recording placement payment:", err);
    return res.status(500).json({
      error: "Failed to record placement payment.",
      details: err.message,
    });
  } finally {
    client.release();
  }
}

// ========================== GET PLACEMENT PAYMENT INFO ==========================

async function getPlacementPaymentInfo(req, res) {
  const { lead_id } = req.params;

  try {
    // Get placement info from leads
    const leadRes = await pool.query(
      `SELECT 
        lead_id,
        name,
        mobile_number,
        placement_fee,
        placement_paid,
        placement_balance,
        placement_paid_status
       FROM leads 
       WHERE lead_id = $1`,
      [lead_id]
    );

    if (leadRes.rowCount === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const leadInfo = leadRes.rows[0];

    // Get all placement installments
    const installmentsRes = await pool.query(
      `SELECT 
        placement_installment_id,
        amount,
        paid_amount,
        payment_date,
        payment_mode,
        remarks,
        installment_count,
        created_at
       FROM placement_installments
       WHERE lead_id = $1
       ORDER BY payment_date DESC, installment_count DESC`,
      [lead_id]
    );

    return res.json({
      success: true,
      lead_info: leadInfo,
      installments: installmentsRes.rows,
      total_installments: installmentsRes.rowCount,
    });
  } catch (err) {
    console.error("Error fetching placement payment info:", err);
    return res.status(500).json({
      error: "Failed to fetch placement payment info",
      details: err.message,
    });
  }
}

// ========================== GET ALL PLACEMENT INSTALLMENTS ==========================

async function getAllPlacementInstallments(req, res) {
  try {
    const result = await pool.query(
      `SELECT 
        pi.placement_installment_id,
        pi.lead_id,
        pi.amount,
        pi.paid_amount,
        pi.payment_date,
        pi.payment_mode,
        pi.remarks,
        pi.installment_count,
        l.name as student_name,
        l.mobile_number as mobile,
        l.course_id,
        c.course_name,
        b.batch_name,
        t.trainer_name
      FROM placement_installments pi
      LEFT JOIN leads l ON pi.lead_id = l.lead_id
      LEFT JOIN course c ON l.course_id = c.course_id
      LEFT JOIN batch b ON l.batch_id = b.batch_id
      LEFT JOIN trainer t ON l.trainer_id = t.trainer_id
      ORDER BY pi.payment_date DESC, pi.placement_installment_id DESC`
    );

    return res.json({
      success: true,
      installments: result.rows,
      total_count: result.rowCount,
    });
  } catch (err) {
    console.error("Error fetching all placement installments:", err);
    return res.status(500).json({
      error: "Failed to fetch placement installments",
      details: err.message,
    });
  }
}

// ========================== DELETE PLACEMENT PAYMENT ==========================

async function deletePlacementPayment(req, res) {
  const { placement_installment_id } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Get the placement installment details
    const installmentRes = await client.query(
      `SELECT lead_id, amount FROM placement_installments 
       WHERE placement_installment_id = $1`,
      [placement_installment_id]
    );

    if (installmentRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Placement payment not found" });
    }

    const { lead_id, amount } = installmentRes.rows[0];

    // 2. Get current lead placement info (use placement_discounted_fee for balance)
    const leadRes = await client.query(
      `SELECT placement_fee, placement_discounted_fee, placement_paid FROM leads WHERE lead_id = $1`,
      [lead_id]
    );

    const { placement_fee, placement_discounted_fee, placement_paid } = leadRes.rows[0];
    const placementBaseDel = placementBaseAmount(
      placement_discounted_fee,
      placement_fee
    );
    const totalPlacementDueDel =
      discountedTotalWithGst(placementBaseDel) ?? 0;

    // 3. Delete the placement installment
    await client.query(
      `DELETE FROM placement_installments WHERE placement_installment_id = $1`,
      [placement_installment_id]
    );

    // 4. Update lead's placement_paid
    const updatedPlacementPaid = parseFloat(placement_paid || 0) - parseFloat(amount);
    const updatedPlacementBalance = placementBalanceAfterGst(
      placement_discounted_fee,
      placement_fee,
      updatedPlacementPaid
    );

    // 5. Recalculate placement_paid_status
    let placement_paid_status;
    if (updatedPlacementPaid <= 0) {
      placement_paid_status = "not paid";
    } else if (updatedPlacementPaid >= totalPlacementDueDel) {
      placement_paid_status = "paid";
    } else {
      placement_paid_status = "partially paid";
    }

    // 6. Update leads table
    await client.query(
      `UPDATE leads 
       SET placement_paid = $1,
           placement_paid_status = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE lead_id = $3`,
      [Math.max(0, updatedPlacementPaid), placement_paid_status, lead_id]
    );

    // 7. Renumber remaining installments
    await client.query(
      `WITH numbered AS (
        SELECT placement_installment_id,
               ROW_NUMBER() OVER (ORDER BY payment_date, placement_installment_id) as new_count
        FROM placement_installments
        WHERE lead_id = $1
      )
      UPDATE placement_installments pi
      SET installment_count = numbered.new_count
      FROM numbered
      WHERE pi.placement_installment_id = numbered.placement_installment_id`,
      [lead_id]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Placement payment deleted successfully",
      updated_placement_info: {
        placement_paid: Math.max(0, updatedPlacementPaid),
        placement_balance: updatedPlacementBalance,
        placement_paid_status,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting placement payment:", err);
    return res.status(500).json({
      error: "Failed to delete placement payment",
      details: err.message,
    });
  } finally {
    client.release();
  }
}

// ========================== UPDATE PLACEMENT PAYMENT ==========================
async function updatePlacementPayment(req, res) {
  const { placement_installment_id } = req.params;
  const { amount, payment_date, payment_mode, remarks, reason } = req.body;
  const userId = req.user?.userId;

  if (!placement_installment_id || !amount || !payment_date || !reason) {
    return res.status(400).json({ error: "Amount, Date, and Reason are required." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Fetch original installment
    const oldRes = await client.query(`SELECT * FROM placement_installments WHERE placement_installment_id = $1`, [placement_installment_id]);
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
        'placement', placement_installment_id, oldInstallment.amount, amount,
        oldInstallment.payment_mode, payment_mode, oldInstallment.payment_date, payment_date, reason, userId
      ]
    );

    // 3. Update Installment
    const updatedRes = await client.query(
      `UPDATE placement_installments 
       SET amount = $1, payment_date = $2, payment_mode = $3, remarks = $4 
       WHERE placement_installment_id = $5 RETURNING *`,
      [amount, payment_date, payment_mode, remarks, placement_installment_id]
    );

    // 4. Update Leads Table (Recalculate totals)
    const diffAmount = parseFloat(amount) - parseFloat(oldInstallment.amount);

    // Fetch current lead state (use placement_discounted_fee for balance)
    const leadRes = await client.query(`SELECT placement_fee, placement_discounted_fee, placement_paid FROM leads WHERE lead_id = $1`, [lead_id]);
    const leadData = leadRes.rows[0];
    const placementBaseUpd = placementBaseAmount(
      leadData.placement_discounted_fee,
      leadData.placement_fee
    );
    const totalPlacementDueUpd =
      discountedTotalWithGst(placementBaseUpd) ?? 0;

    const newPlacementPaid = parseFloat(leadData.placement_paid || 0) + diffAmount;

    // Recalculate status
    let newStatus = 'not paid';
    if (newPlacementPaid >= totalPlacementDueUpd) {
      newStatus = 'paid';
    } else if (newPlacementPaid > 0) {
      newStatus = 'partially paid';
    }
    const newPlacementBalance = placementBalanceAfterGst(
      leadData.placement_discounted_fee,
      leadData.placement_fee,
      newPlacementPaid
    );


    await client.query(
      `UPDATE leads SET placement_paid = $1, placement_paid_status = $2 WHERE lead_id = $3`,
      [newPlacementPaid, newStatus, lead_id]
    );

    await client.query("COMMIT");
    return res.json({ success: true, message: "Placement payment updated successfully" });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error updating placement payment:", err);
    return res.status(500).json({ error: "Failed to update placement payment." });
  } finally {
    client.release();
  }
}

module.exports = {
  recordPlacementPayment,
  getPlacementPaymentInfo,
  getAllPlacementInstallments,
  deletePlacementPayment,
  updatePlacementPayment,
};


