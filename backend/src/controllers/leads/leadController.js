const pool = require("../../config/db");
const {
  sendLeadNotifications,
  sendDeleteNotification,
  sendStatusUpdateEmail,
  sendEnrollmentEmail,
} = require("../../services/emailservice");
const { generateEnrollmentID } = require("../../utils/generateEnrollmentID");
const { sanitizeLeadDisplayText } = require("../../utils/sanitizeLeadDisplayText");
const {
  discountedTotalWithGst,
  feeBalanceFromBaseDiscounted,
  placementBaseAmount,
  placementBalanceAfterGst,
} = require("../../utils/feeGst");
const leadsCache = require("../../services/leadsCache");

/** Cached `information_schema.columns.data_type` for `leads.follow_up_at` (TIME vs TIMESTAMPTZ). */
let leadsFollowUpAtColumnDataTypeCache = null;
async function getLeadsFollowUpAtColumnDataType() {
  if (leadsFollowUpAtColumnDataTypeCache != null) {
    return leadsFollowUpAtColumnDataTypeCache;
  }
  try {
    const r = await pool.query(
      `SELECT data_type FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'follow_up_at'`
    );
    leadsFollowUpAtColumnDataTypeCache = r.rowCount
      ? String(r.rows[0].data_type)
      : "timestamp with time zone";
  } catch {
    leadsFollowUpAtColumnDataTypeCache = "timestamp with time zone";
  }
  return leadsFollowUpAtColumnDataTypeCache;
}

/** SQL fragment: fee balance = (discounted_fee * 1.06) - fee_paid — keep in sync with feeGst.js */
const SQL_FEE_BALANCE_EXPR = `(
  CASE
    WHEN leads.discounted_fee IS NOT NULL THEN GREATEST(
      0::numeric,
      ROUND((leads.discounted_fee * 1.06)::numeric, 2) - COALESCE(leads.fee_paid, 0)
    )
    ELSE NULL
  END
)`;
const SQL_PLACEMENT_BALANCE_EXPR = `(
  CASE
    WHEN COALESCE(leads.placement_discounted_fee, leads.placement_fee) IS NULL THEN NULL
    ELSE GREATEST(
      0::numeric,
      ROUND((COALESCE(leads.placement_discounted_fee, leads.placement_fee, 0) * 1.06)::numeric, 2)
      - COALESCE(leads.placement_paid, 0)
    )
  END
)`;

const bufferToBase64 = (value) => {
  if (!value) return null;
  if (Buffer.isBuffer(value)) {
    return value.toString("base64");
  }
  if (typeof value === "string") {
    // If it's already a string, check if it's base64 or needs conversion
    return value.trim() !== "" ? value : null;
  }
  return null;
};

const normalizeTrainingStatus = (value) => {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return null;
  const mapping = {
    nottaken: "nottaken",
    not_taken: "nottaken",
    "not taken": "nottaken",
    scheduled: "scheduled",
    inprogress: "in_progress",
    in_progress: "in_progress",
    "in progress": "in_progress",
    "in-progress": "in_progress",
    onhold: "onhold",
    on_hold: "onhold",
    "on hold": "onhold",
    "on-hold": "onhold",
    completed: "completed",
  };
  return mapping[raw] || raw;
};

/** Parse batch_ids from DB row (jsonb / legacy batch_id only). */
function parseExistingBatchIds(existingRow) {
  if (!existingRow) return [];
  const raw = existingRow.batch_ids;
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((x) => parseInt(String(x), 10)).filter((n) => !isNaN(n)))];
  }
  if (raw != null && typeof raw === "object") {
    try {
      const arr = Array.isArray(raw) ? raw : Object.values(raw);
      if (Array.isArray(arr)) {
        return [...new Set(arr.map((x) => parseInt(String(x), 10)).filter((n) => !isNaN(n)))];
      }
    } catch {
      /* ignore */
    }
  }
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) {
        return [...new Set(p.map((x) => parseInt(String(x), 10)).filter((n) => !isNaN(n)))];
      }
    } catch {
      return [];
    }
  }
  if (existingRow.batch_id != null && existingRow.batch_id !== "") {
    const id = parseInt(String(existingRow.batch_id), 10);
    return !isNaN(id) ? [id] : [];
  }
  return [];
}

/**
 * Multi-batch: batch_ids array + batch_id = first id (primary) for legacy joins.
 * @param {object} body - req.body
 * @param {object|null} existingRow - existing DB row or null on create
 */
function normalizeBatchIdsFromBody(body, existingRow) {
  const existingIds = parseExistingBatchIds(existingRow);
  const hasBatchIdsKey = Object.prototype.hasOwnProperty.call(body, "batch_ids");
  const hasBatchIdKey = Object.prototype.hasOwnProperty.call(body, "batch_id");

    if (hasBatchIdsKey) {
    let arr = body.batch_ids;
    if (arr === null || arr === undefined) arr = [];
    if (typeof arr === "string") {
      try {
        arr = JSON.parse(arr);
      } catch {
        arr = [];
      }
    }
    if (!Array.isArray(arr)) {
      if (arr && typeof arr === "object") arr = Object.values(arr);
      else arr = [];
    }
    const ids = [...new Set(arr.map((x) => parseInt(String(x), 10)).filter((n) => !isNaN(n)))];
    return { batch_ids: ids, batch_id: ids[0] ?? null };
  }
  if (hasBatchIdKey) {
    if (body.batch_id === null || body.batch_id === "" || body.batch_id === undefined) {
      return { batch_ids: [], batch_id: null };
    }
    const id = parseInt(String(body.batch_id), 10);
    if (!isNaN(id)) return { batch_ids: [id], batch_id: id };
    return { batch_ids: existingIds, batch_id: existingRow?.batch_id != null ? parseInt(String(existingRow.batch_id), 10) : null };
  }
  return {
    batch_ids: existingIds,
    batch_id: existingRow?.batch_id != null ? parseInt(String(existingRow.batch_id), 10) : null,
  };
}

/** pg can mis-serialize JS arrays as Postgres array text `{1,2}`; jsonb needs JSON `[1,2]`. */
function batchIdsToJsonbValue(ids) {
  const arr = Array.isArray(ids)
    ? ids.map((x) => parseInt(String(x), 10)).filter((n) => !Number.isNaN(n))
    : [];
  return JSON.stringify(arr);
}

// ======================= Add New Lead =======================
// src/controllers/leads/leadController.js

exports.addLead = async (req, res) => {
  try {
    console.log("=== ADD LEAD REQUEST ===");
    console.log("Full request body:", JSON.stringify(req.body, null, 2));

    let {
      name,
      country_code = "+91",
      mobile_number,
      email,
      role_id,
      college_company,
      location,
      source_id,
      referred_by, // manual text field
      course_id,
      batch_id,
      batch_ids,
      trainer_id,
      actual_fee,
      discounted_fee,
      fee_paid,
      placement_fee,
      placement_discounted_fee,
      placement_paid,
      status,
      paid_status,
      placement_paid_status,
      user_id,
      unit_id,
      card_type_id,
      meta_campaign_id,
      sub_courses = [],
      trainer_share,
      trainer_share_amount,
      amount_paid_trainer,
      pending_amount,
      training_status,
      training_start_date,
      training_end_date,
      trainer_paid,
      course_structure,
      placement_trainer,
      placement_status,
      placement_start_date,
      placement_end_date,
      priority = "normal",
      allow_duplicate = false,
    } = req.body;

    name = await sanitizeLeadDisplayText(name);

    // Debug placement trainer data
    console.log('=== PLACEMENT TRAINER DEBUG (addLead) ===');
    console.log('placement_trainer:', placement_trainer, 'type:', typeof placement_trainer);
    console.log('placement_status:', placement_status);
    console.log('placement_start_date:', placement_start_date);
    console.log('placement_end_date:', placement_end_date);
    console.log('cardType:', card_type_id);
    console.log('==========================================');

    // Invalidate cache to ensure fresh data with new placement_trainer_name field
    leadsCache.invalidate();


    // Parse sub_courses if it's a JSON string
    if (typeof sub_courses === "string") {
      try {
        sub_courses = JSON.parse(sub_courses);
      } catch (e) {
        console.error("Error parsing sub_courses JSON in addLead:", e);
        sub_courses = [];
      }
    }

    // Ensure sub_courses is an array
    if (!Array.isArray(sub_courses)) {
      sub_courses = [];
    }

    training_status = normalizeTrainingStatus(training_status) || "nottaken";
    sub_courses = sub_courses.map((sub) => ({
      ...sub,
      training_status:
        normalizeTrainingStatus(sub?.training_status) || "nottaken",
    }));

    training_status = normalizeTrainingStatus(training_status) || "nottaken";
    sub_courses = sub_courses.map((sub) => ({
      ...sub,
      training_status:
        normalizeTrainingStatus(sub?.training_status) || "nottaken",
    }));

    console.log("Parsed sub_courses in addLead:", sub_courses);

    // Auto-set course_structure based on sub_courses
    if (!course_structure) {
      course_structure = sub_courses.length > 0 ? "multiple" : "single";
      console.log("Auto-set course_structure to:", course_structure);
    }

    // Validate meta_campaign_id if provided
    if (meta_campaign_id) {
      const metaRes = await pool.query(
        "SELECT id FROM meta_campaigns WHERE id = $1",
        [meta_campaign_id]
      );
      if (!metaRes.rowCount)
        return res.status(400).json({ error: "Invalid meta_campaign_id" });
    }

    // 1) Validate required fields
    const missingFields = [];
    if (!name) missingFields.push("Name");
    if (!mobile_number) missingFields.push("Mobile Number");
    if (!course_id) missingFields.push("Course");
    if (!status) missingFields.push("Status");
    if (!unit_id) missingFields.push("Unit");
    if (!card_type_id) missingFields.push("Card Type");
    if (missingFields.length) {
      return res.status(400).json({
        error: `The following fields are required: ${missingFields.join(
          ", "
        )}.`,
      });
    }

    // 2) Validate references
    if (role_id) {
      const roleRes = await pool.query("SELECT id FROM roles WHERE id = $1", [
        role_id,
      ]);
      if (!roleRes.rowCount)
        return res.status(400).json({ error: "Invalid role_id" });
    }

    if (source_id) {
      const sourceRes = await pool.query(
        "SELECT id FROM sources WHERE id = $1",
        [source_id]
      );
      if (!sourceRes.rowCount)
        return res.status(400).json({ error: "Invalid source_id" });
    }

    if (user_id) {
      const userRes = await pool.query(
        "SELECT user_id FROM users WHERE user_id = $1",
        [user_id]
      );
      if (!userRes.rowCount)
        return res.status(400).json({ error: "Invalid user_id" });
    }

    // No validation needed for referred_by (manual text)

    // 3) Format numeric fields
    console.log("Trainer ID debugging:", {
      trainer_id,
      type: typeof trainer_id,
      length: trainer_id?.toString().length,
      trimmed: trainer_id?.toString().trim(),
    });

    const formatted_trainer_id =
      trainer_id &&
        trainer_id !== "undefined" &&
        trainer_id.toString().trim() !== ""
        ? parseInt(trainer_id.toString().trim(), 10)
        : null;

    console.log("Formatted trainer_id:", formatted_trainer_id);

    const f_actual_fee =
      actual_fee && actual_fee.toString().trim() !== ""
        ? parseFloat(actual_fee.toString().trim())
        : null;
    const f_discounted_fee =
      discounted_fee && discounted_fee.toString().trim() !== ""
        ? parseFloat(discounted_fee.toString().trim())
        : null;
    const f_fee_paid =
      fee_paid && fee_paid.toString().trim() !== ""
        ? parseFloat(fee_paid.toString().trim())
        : 0;

    // Fix placement fee parsing - handle numeric strings properly
    const f_placement_fee =
      placement_fee &&
        placement_fee.toString().trim() !== "" &&
        !isNaN(parseFloat(placement_fee))
        ? parseFloat(placement_fee)
        : null;
    const f_placement_discounted_fee =
      placement_discounted_fee &&
        placement_discounted_fee.toString().trim() !== "" &&
        !isNaN(parseFloat(placement_discounted_fee))
        ? parseFloat(placement_discounted_fee)
        : null;
    const f_placement_paid =
      placement_paid &&
        placement_paid.toString().trim() !== "" &&
        !isNaN(parseFloat(placement_paid))
        ? parseFloat(placement_paid)
        : null;

    // Debug logging for fee fields
    console.log("Fee field debugging:", {
      original: {
        actual_fee,
        discounted_fee,
        fee_paid,
        placement_fee,
        placement_discounted_fee,
        placement_paid,
        trainer_id,
        placement_fee_type: typeof placement_fee,
        placement_paid_type: typeof placement_paid,
        placement_fee_string: placement_fee?.toString(),
        placement_paid_string: placement_paid?.toString(),
      },
      parsed: {
        f_actual_fee,
        f_discounted_fee,
        f_fee_paid,
        f_placement_fee,
        f_placement_discounted_fee,
        f_placement_paid,
        formatted_trainer_id,
      },
    });

    const fee_balance = feeBalanceFromBaseDiscounted(
      f_discounted_fee,
      f_fee_paid
    );

    const placementFeeBase = placementBaseAmount(
      f_placement_discounted_fee,
      f_placement_fee
    );
    const placementTotalWithGst = discountedTotalWithGst(placementFeeBase);

    // Placement Paid Status logic - based on placement base fee (incl. GST)
    if (!placement_paid_status) {
      if (placementFeeBase == null || placementFeeBase === 0) {
        placement_paid_status = "not paid";
      } else if (f_placement_paid === null || f_placement_paid <= 0) {
        placement_paid_status = "not paid";
      } else if (
        placementTotalWithGst != null &&
        f_placement_paid > 0 &&
        f_placement_paid < placementTotalWithGst
      ) {
        placement_paid_status = "partially paid";
      } else if (
        placementTotalWithGst != null &&
        f_placement_paid >= placementTotalWithGst
      ) {
        placement_paid_status = "paid";
      } else {
        placement_paid_status = "not paid";
      }
    }

    if (!paid_status) {
      if (f_fee_paid === 0) paid_status = "not paid";
      else if (fee_balance === 0) paid_status = "paid";
      else paid_status = "partially paid";
    }

    if (!/^\+\d{1,4}$/.test(country_code))
      return res.status(400).json({ error: "Invalid country code format." });
    if (!/^\d{5,15}$/.test(mobile_number))
      return res.status(400).json({ error: "Invalid mobile number format." });

    // 4) Prevent duplicates unless explicitly overridden by user confirmation.
    const duplicateRes = await pool.query(
      `SELECT lead_id, name, mobile_number
       FROM leads
       WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
         AND mobile_number = $2
       LIMIT 1`,
      [name, mobile_number]
    );
    if (duplicateRes.rowCount && !allow_duplicate) {
      return res.status(409).json({
        error: "A user already exists with the same name and mobile number.",
        code: "DUPLICATE_LEAD",
      });
    }

    // 5) Get course name
    const courseRes = await pool.query(
      "SELECT course_name FROM course WHERE course_id=$1",
      [course_id]
    );
    if (!courseRes.rowCount)
      return res.status(400).json({ error: "Invalid course_id" });
    const course_name = courseRes.rows[0].course_name;

    // 6) Generate enrollment ID if applicable
    const excluded = ["enquiry", "prospect", "onhold", "archived"];
    const enrollment_id = excluded.includes(status.toLowerCase())
      ? null
      : generateEnrollmentID();

    const batchNorm = normalizeBatchIdsFromBody({ batch_ids, batch_id }, null);

    // --- Transaction for lead and sub-courses ---
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Insert lead
      const result = await client.query(
        `INSERT INTO leads (
          name, country_code, mobile_number, email,
          role_id, college_company, location, source_id,
          referred_by,
          course_id, batch_id, batch_ids, trainer_id,
          actual_fee, discounted_fee, fee_paid, fee_balance,
          placement_fee, placement_discounted_fee, placement_paid, placement_paid_status,
          status, paid_status, user_id,
          unit_id, card_type_id, enrollment_id, created_at,
          meta_campaign_id,
          trainer_share, trainer_share_amount, amount_paid_trainer, pending_amount, training_status, training_start_date, training_end_date, trainer_paid,
          course_structure,
          placement_trainer, placement_status, placement_start_date, placement_end_date,
          priority
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          $10,$11,$12::jsonb,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,
          $25,$26,$27,$28,$29,
          $30,$31,$32,$33,$34,$35,$36,$37,$38,
          $39,$40,$41,$42,$43
        ) RETURNING *`,
        [
          name,
          country_code,
          mobile_number,
          email || null,
          role_id || null,
          college_company || null,
          location || null,
          source_id || null,
          referred_by || null,
          course_id,
          batchNorm.batch_id,
          batchIdsToJsonbValue(batchNorm.batch_ids),
          formatted_trainer_id,
          f_actual_fee,
          f_discounted_fee,
          f_fee_paid,
          fee_balance,
          f_placement_fee,
          f_placement_discounted_fee,
          f_placement_paid,
          placement_paid_status,
          status,
          paid_status,
          user_id || null,
          unit_id,
          card_type_id,
          enrollment_id,
          new Date(),
          meta_campaign_id || null,
          trainer_share || 0,
          trainer_share_amount || 0,
          amount_paid_trainer || 0,
          pending_amount || 0,
          training_status,
          training_start_date || null,
          training_end_date || null,
          trainer_paid || false,
          course_structure === "NA" ? "NA" : (course_structure || "single"),
          placement_trainer && placement_trainer.toString().trim() !== ""
            ? parseInt(placement_trainer, 10) || null
            : null,
          placement_status || null,
          placement_start_date || null,
          placement_end_date || null,
          priority || "normal",
        ]
      );
      const lead = result.rows[0];

      console.log("Lead inserted successfully:", {
        lead_id: lead.lead_id,
        fee_paid: lead.fee_paid,
        placement_fee: lead.placement_fee,
        placement_paid: lead.placement_paid,
      });

      // Insert sub-courses only if present
      if (Array.isArray(sub_courses) && sub_courses.length > 0) {
        for (const sub of sub_courses) {
          await client.query(
            `INSERT INTO lead_sub_courses
              (lead_id, course_id, sub_course_id, trainer_id, trainer_share, trainer_share_amount, amount_paid_trainer, pending_amount, training_status, training_start_date, training_end_date, trainer_paid)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              lead.lead_id,
              course_id,
              sub.sub_course_id,
              sub.trainer_id,
              sub.trainer_share || 0,
              sub.trainer_share_amount || 0,
              sub.amount_paid_trainer || 0,
              sub.pending_amount || 0,
              sub.training_status || "nottaken",
              sub.training_start_date || null,
              sub.training_end_date || null,
              sub.trainer_paid || false,
            ]
          );
        }
      }
      await client.query("COMMIT");

      // Invalidate cache since data has changed
      leadsCache.invalidate();

      // 8) Send Notifications
      // Fetch assignee email if user_id is provided
      let assigneeEmail = null;
      if (user_id) {
        try {
          const userRes = await pool.query(
            "SELECT email FROM users WHERE user_id = $1",
            [user_id]
          );
          if (userRes.rowCount > 0 && userRes.rows[0].email) {
            assigneeEmail = userRes.rows[0].email;
          }
        } catch (err) {
          console.error("Error fetching assignee email:", err.message);
        }
      }

      await sendLeadNotifications({
        name,
        mobile_number: `${lead.country_code}${lead.mobile_number}`,
        email,
        course_id,
        course_name,
      }, assigneeEmail);

      if (enrollment_id) {
        await sendEnrollmentEmail({
          name,
          email,
          mobile_number: `${lead.country_code}${lead.mobile_number}`,
          course_id,
          course_name,
          enrollment_id,
        });
      }
      return res.status(201).json(lead);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    if (err?.code === "23505") {
      const isLeadDuplicate =
        err?.table === "leads" &&
        (err?.constraint === "leads_pkey" ||
          String(err?.detail || "").includes("(name, mobile_number, course_id)"));

      if (isLeadDuplicate) {
        return res.status(409).json({
          error:
            "Lead already exists with the same name, mobile number, and course.",
          code: "DUPLICATE_LEAD",
        });
      }
    }

    console.error("Error adding lead:", err);
    console.error("Error stack:", err.stack);
    return res.status(500).json({
      error: err.message || "Failed to add lead",
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

exports.checkLeadDuplicate = async (req, res) => {
  try {
    const rawName = req.query.name ?? req.body?.name;
    const rawMobile = req.query.mobile_number ?? req.body?.mobile_number;
    const rawCourseId = req.query.course_id ?? req.body?.course_id;

    const name = rawName ? String(rawName).trim() : "";
    const mobile_number = rawMobile ? String(rawMobile).trim() : "";
    const course_id =
      rawCourseId !== null && rawCourseId !== undefined && String(rawCourseId).trim() !== ""
        ? String(rawCourseId).trim()
        : null;

    if (!name || !mobile_number) {
      return res.status(400).json({
        error: "name and mobile_number are required.",
      });
    }

    const duplicateRes = await pool.query(
      `SELECT lead_id, name, mobile_number, status, course_id
       FROM leads
       WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
         AND mobile_number = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [name, mobile_number]
    );

    if (!duplicateRes.rowCount) {
      return res.status(200).json({ isDuplicate: false });
    }

    let isExactCourseDuplicate = false;
    if (course_id) {
      const exactDuplicateRes = await pool.query(
        `SELECT lead_id
         FROM leads
         WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
           AND mobile_number = $2
           AND course_id::text = $3::text
         LIMIT 1`,
        [name, mobile_number, course_id]
      );
      isExactCourseDuplicate = exactDuplicateRes.rowCount > 0;
    }

    return res.status(200).json({
      isDuplicate: true,
      isExactCourseDuplicate,
      lead: duplicateRes.rows[0],
    });
  } catch (error) {
    console.error("Error checking duplicate lead:", error);
    return res.status(500).json({ error: "Failed to check duplicate lead." });
  }
};

// ======================= Update Lead =======================
exports.updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      name,
      country_code = "+91",
      mobile_number,
      email,
      role_id,
      college_company,
      location,
      source_id,
      referred_by, // manual text field
      course_id,
      batch_id,
      batch_ids,
      trainer_id,
      actual_fee,
      discounted_fee,
      fee_paid,
      placement_fee,
      placement_discounted_fee,
      placement_paid,
      placement_balance,

      status,
      paid_status,
      placement_paid_status,
      user_id,
      unit_id,
      card_type_id,
      meta_campaign_id,
      sub_courses = [],
      trainer_share,
      trainer_share_amount,
      amount_paid_trainer,
      pending_amount,
      training_status,
      training_start_date,
      training_end_date,
      trainer_paid,
      course_structure,
      placement_trainer,
      placement_status,
      placement_start_date,
      placement_end_date,
      requirements,
      inquired_course,
      priority,
      follow_up_date,
      follow_up_note,
      follow_up_at,
    } = req.body;

    // Parse sub_courses if it's a JSON string
    if (typeof sub_courses === "string") {
      try {
        sub_courses = JSON.parse(sub_courses);
      } catch (e) {
        console.error("Error parsing sub_courses JSON:", e);
        sub_courses = [];
      }
    }

    // Ensure sub_courses is an array
    if (!Array.isArray(sub_courses)) {
      sub_courses = [];
    }

    console.log("Parsed sub_courses:", sub_courses);

    // Auto-set course_structure based on sub_courses if not explicitly set
    if (!course_structure) {
      course_structure = sub_courses.length > 0 ? "multiple" : "single";
      console.log("Auto-set course_structure to:", course_structure);
    }

    // Validate meta_campaign_id if provided
    if (meta_campaign_id) {
      const metaRes = await pool.query(
        "SELECT id FROM meta_campaigns WHERE id = $1",
        [meta_campaign_id]
      );
      if (!metaRes.rowCount)
        return res.status(400).json({ error: "Invalid meta_campaign_id" });
    }

    // 1) Fetch existing lead
    const existing = await pool.query(
      "SELECT * FROM leads WHERE lead_id = $1",
      [id]
    );
    if (!existing.rowCount) {
      return res.status(404).json({ error: "Lead not found." });
    }
    const oldStatus = existing.rows[0].status || "";

    // 2) Validation (Logging only for updates to avoid blocking old leads with missing data)
    const missing = [];
    if (!name && !existing.rows[0].name) missing.push("Name");
    if (!mobile_number && !existing.rows[0].mobile_number) missing.push("Mobile Number");
    if (!status && !existing.rows[0].status) missing.push("Status");
    if (!course_id && !existing.rows[0].course_id && !inquired_course && !existing.rows[0].inquired_course) missing.push("Course");
    // We allow unit_id and card_type_id to be missing if they were already missing, but they are technically required for new leads.

    if (missing.length) {
      console.log("[updateLead] Validation failed for lead", id, ". Missing fields:", missing);
      // For now, we only block if NAME or MOBILE are missing even in the database
      if (missing.includes("Name") || missing.includes("Mobile Number")) {
        return res.status(400).json({
          error: `The following fields are required: ${missing.join(", ")}.`,
        });
      }
    }

    // 3) Validate phone formats
    if (country_code && !/^\+\d{1,4}$/.test(country_code))
      return res.status(400).json({ error: "Invalid country code format." });
    if (mobile_number && !/^\d{5,15}$/.test(mobile_number))
      return res.status(400).json({ error: "Invalid mobile number format." });

    // 4) Validate references
    if (role_id) {
      const roleRes = await pool.query("SELECT id FROM roles WHERE id = $1", [
        role_id,
      ]);
      if (!roleRes.rowCount)
        return res.status(400).json({ error: "Invalid role_id" });
    }

    if (source_id) {
      const sourceRes = await pool.query(
        "SELECT id FROM sources WHERE id = $1",
        [source_id]
      );
      if (!sourceRes.rowCount)
        return res.status(400).json({ error: "Invalid source_id" });
    }

    // No validation needed for referred_by (manual text)

    // 5) Format numeric fields
    const formatted_trainer_id =
      trainer_id &&
        trainer_id !== "undefined" &&
        trainer_id.toString().trim() !== ""
        ? parseInt(trainer_id.toString().trim(), 10)
        : null;
    const f_actual_fee =
      actual_fee && actual_fee.toString().trim() !== ""
        ? parseFloat(actual_fee.toString().trim())
        : null;
    const f_discounted_fee =
      discounted_fee && discounted_fee.toString().trim() !== ""
        ? parseFloat(discounted_fee.toString().trim())
        : null;
    const f_fee_paid =
      fee_paid && fee_paid.toString().trim() !== ""
        ? parseFloat(fee_paid.toString().trim())
        : 0;

    // Fix placement fee parsing - handle numeric strings properly (same as addLead)
    const f_placement_fee =
      placement_fee &&
        placement_fee.toString().trim() !== "" &&
        !isNaN(parseFloat(placement_fee))
        ? parseFloat(placement_fee)
        : null;
    const f_placement_discounted_fee =
      placement_discounted_fee &&
        placement_discounted_fee.toString().trim() !== "" &&
        !isNaN(parseFloat(placement_discounted_fee))
        ? parseFloat(placement_discounted_fee)
        : null;
    const f_placement_paid =
      placement_paid &&
        placement_paid.toString().trim() !== "" &&
        !isNaN(parseFloat(placement_paid))
        ? parseFloat(placement_paid)
        : null;

    const fee_balance = feeBalanceFromBaseDiscounted(
      f_discounted_fee,
      f_fee_paid
    );

    const placementFeeBaseUpd = placementBaseAmount(
      f_placement_discounted_fee,
      f_placement_fee
    );
    const placementTotalWithGstUpd = discountedTotalWithGst(placementFeeBaseUpd);

    // 6) Derive paid_status if missing
    if (!paid_status) {
      if (f_fee_paid === 0) paid_status = "not paid";
      else if (fee_balance === 0) paid_status = "paid";
      else paid_status = "partially paid";
    }

    // Placement Paid Status logic - based on placement base fee (incl. GST)
    if (!placement_paid_status) {
      if (placementFeeBaseUpd == null || placementFeeBaseUpd === 0) {
        placement_paid_status = "not paid";
      } else if (f_placement_paid === null || f_placement_paid <= 0) {
        placement_paid_status = "not paid";
      } else if (
        placementTotalWithGstUpd != null &&
        f_placement_paid > 0 &&
        f_placement_paid < placementTotalWithGstUpd
      ) {
        placement_paid_status = "partially paid";
      } else if (
        placementTotalWithGstUpd != null &&
        f_placement_paid >= placementTotalWithGstUpd
      ) {
        placement_paid_status = "paid";
      } else {
        placement_paid_status = "not paid";
      }
    }

    const batchNorm = normalizeBatchIdsFromBody(req.body, existing.rows[0]);

    const sanitizedName = await sanitizeLeadDisplayText(
      name || existing.rows[0].name
    );

    const normalizeSqlTime = (value) => {
      if (value == null || value === "") return null;

      // Handle Date objects from pg (timestamp columns)
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const hh = String(value.getHours()).padStart(2, "0");
        const mm = String(value.getMinutes()).padStart(2, "0");
        const ss = String(value.getSeconds()).padStart(2, "0");
        return `${hh}:${mm}:${ss}`;
      }

      const raw = String(value).trim();
      if (!raw) return null;

      // Accept explicit 24h time strings
      const m = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
      if (m) {
        const hh = String(m[1]).padStart(2, "0");
        const mm = m[2];
        const ss = m[3] || "00";
        return `${hh}:${mm}:${ss}`;
      }

      // Fallback: parse datetime-like strings and extract time
      const parsed = new Date(raw);
      if (Number.isNaN(parsed.getTime())) return null;
      const hh = String(parsed.getHours()).padStart(2, "0");
      const mm = String(parsed.getMinutes()).padStart(2, "0");
      const ss = String(parsed.getSeconds()).padStart(2, "0");
      return `${hh}:${mm}:${ss}`;
    };

    const parseSqlDate = (value) => {
      if (value == null || value === "") return null;
      const s = String(value).trim().slice(0, 10);
      return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
    };

    const exRow = existing.rows[0];
    let nextFollowUpDate = parseSqlDate(exRow.follow_up_date);
    let followUpTimeStr = normalizeSqlTime(exRow.follow_up_at);
    let nextFollowUpNote = exRow.follow_up_note;

    const hasFollowUpAtKey = Object.prototype.hasOwnProperty.call(
      req.body,
      "follow_up_at"
    );
    const hasFollowUpDateKey = Object.prototype.hasOwnProperty.call(
      req.body,
      "follow_up_date"
    );

    if (hasFollowUpAtKey) {
      const v = follow_up_at;
      if (v === null || v === undefined || v === "") {
        followUpTimeStr = null;
        nextFollowUpDate = null;
      } else {
        const normalizedTime = normalizeSqlTime(v);
        if (normalizedTime) {
          const parsedDateFromAt = new Date(v);
          if (hasFollowUpDateKey) {
            const dv = follow_up_date;
            if (dv === null || dv === undefined || dv === "") {
              nextFollowUpDate = !Number.isNaN(parsedDateFromAt.getTime())
                ? parsedDateFromAt.toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10);
            } else {
              const s = String(dv).trim().slice(0, 10);
              nextFollowUpDate = /^\d{4}-\d{2}-\d{2}$/.test(s)
                ? s
                : (!Number.isNaN(parsedDateFromAt.getTime())
                  ? parsedDateFromAt.toISOString().slice(0, 10)
                  : new Date().toISOString().slice(0, 10));
            }
          } else {
            nextFollowUpDate = !Number.isNaN(parsedDateFromAt.getTime())
              ? parsedDateFromAt.toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10);
          }
          followUpTimeStr = normalizedTime;
        } else {
          followUpTimeStr = null;
          nextFollowUpDate = null;
        }
      }
    } else if (hasFollowUpDateKey) {
      const v = follow_up_date;
      if (v === null || v === undefined || v === "") {
        nextFollowUpDate = null;
        followUpTimeStr = null;
      } else {
        nextFollowUpDate = parseSqlDate(v);
        if (nextFollowUpDate) {
          followUpTimeStr =
            normalizeSqlTime(exRow.follow_up_at) || "12:00:00";
        } else {
          followUpTimeStr = null;
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "follow_up_note")) {
      const v = follow_up_note;
      nextFollowUpNote =
        v == null || String(v).trim() === ""
          ? null
          : String(v).trim().slice(0, 2000);
    }

    const followUpAtPgType = await getLeadsFollowUpAtColumnDataType();
    const followUpAtColumnIsPlainTime =
      /^time\b/i.test(followUpAtPgType) && !/timestamp/i.test(followUpAtPgType);

    let followUpAtForDb = null;
    if (nextFollowUpDate && followUpTimeStr) {
      followUpAtForDb = followUpAtColumnIsPlainTime
        ? followUpTimeStr
        : new Date(`${nextFollowUpDate}T${followUpTimeStr}`);
    }

    // 7) Build update fields
    const fields = {
      name: sanitizedName,
      country_code: country_code || existing.rows[0].country_code,
      mobile_number: mobile_number || existing.rows[0].mobile_number,
      email: email || null,
      role_id: role_id || null,
      college_company: college_company || null,
      location: location || null,
      source_id: source_id || null,
      referred_by: referred_by || null,
      course_id: course_id || existing.rows[0].course_id,
      batch_id: batchNorm.batch_id,
      batch_ids: batchIdsToJsonbValue(batchNorm.batch_ids),
      trainer_id: formatted_trainer_id,
      actual_fee: f_actual_fee,
      discounted_fee: f_discounted_fee,
      fee_paid: f_fee_paid,
      fee_balance,
      placement_fee: f_placement_fee,
      placement_discounted_fee: f_placement_discounted_fee,
      placement_paid: f_placement_paid,
      placement_paid_status,
      status: status || existing.rows[0].status,
      paid_status,
      user_id: user_id || null,
      unit_id: unit_id || existing.rows[0].unit_id,
      card_type_id: card_type_id || existing.rows[0].card_type_id,
      meta_campaign_id: meta_campaign_id || null,
      trainer_share: trainer_share || 0,
      trainer_share_amount: trainer_share_amount || 0,
      amount_paid_trainer: amount_paid_trainer || 0,
      pending_amount: pending_amount || 0,
      training_status,
      training_start_date: training_start_date || null,
      training_end_date: training_end_date || null,
      trainer_paid: trainer_paid || false,
      course_structure: course_structure === "N/A" ? "N/A" : (course_structure || "single"),
      placement_trainer: placement_trainer && placement_trainer.toString().trim() !== ""
        ? parseInt(placement_trainer, 10) || null
        : null,
      placement_status: placement_status || null,
      placement_start_date: placement_start_date || null,
      placement_end_date: placement_end_date || null,
      requirements: requirements || null,
      inquired_course: inquired_course || existing.rows[0].inquired_course,
      priority: priority || existing.rows[0].priority || 'normal',
      follow_up_date: nextFollowUpDate,
      follow_up_at: followUpAtForDb,
      follow_up_note: nextFollowUpNote,
      updated_at: new Date(),
    };

    const entries = Object.entries(fields);
    const setClauses = entries
      .map(([key], i) =>
        key === "batch_ids"
          ? `batch_ids = $${i + 1}::jsonb`
          : `${key} = $${i + 1}`
      )
      .join(", ");
    const values = entries.map(([, val]) => val);

    // --- Transaction for lead and sub-courses ---
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Update lead
      const updateQuery = `
        UPDATE leads
        SET ${setClauses}
        WHERE lead_id = $${values.length + 1}
        RETURNING *`;
      const { rows } = await client.query(updateQuery, [...values, id]);
      const updatedLead = rows[0];
      // Remove all old sub-courses for this lead
      await client.query("DELETE FROM lead_sub_courses WHERE lead_id = $1", [
        id,
      ]);
      console.log(`Deleted existing sub-courses for lead ${id}`);

      // Insert new sub-courses only if present
      console.log(
        `Processing ${sub_courses.length} sub-courses for lead ${id}`
      );
      if (Array.isArray(sub_courses) && sub_courses.length > 0) {
        for (const sub of sub_courses) {
          console.log("Inserting sub-course:", sub);
          try {
            await client.query(
              `INSERT INTO lead_sub_courses
                (lead_id, course_id, sub_course_id, trainer_id, trainer_share, trainer_share_amount, amount_paid_trainer, pending_amount, training_status, training_start_date, training_end_date, trainer_paid)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [
                id,
                course_id,
                sub.sub_course_id,
                sub.trainer_id,
                sub.trainer_share || 0,
                sub.trainer_share_amount || 0,
                sub.amount_paid_trainer || 0,
                sub.pending_amount || 0,
                sub.training_status || "nottaken",
                sub.training_start_date || sub.start_date || null,
                sub.training_end_date || sub.end_date || null,
                sub.trainer_paid || false,
              ]
            );
            console.log("Successfully inserted sub-course:", sub.sub_course_id);
          } catch (subError) {
            console.error("Error inserting sub-course:", subError);
            console.error("Failed sub-course data:", sub);
            throw subError; // Re-throw to trigger rollback
          }
        }
      } else {
        console.log("No sub-courses to insert");
      }
      // 9) Notify if status changed
      if (oldStatus !== status) {
        await sendStatusUpdateEmail(
          {
            name,
            email,
            mobile_number: `${country_code}${mobile_number}`,
            course_id,
          },
          status
        );
      }
      // 10) Generate enrollment ID if status reaches Enrollment and doesn't have one yet
      const enrollmentStatuses = ["enrollment", "completed", "placed"];
      const safstatus = status || "";
      const shouldHaveEnrollmentId = enrollmentStatuses.includes(
        safstatus.toLowerCase()
      );
      const isMovingToEnrollment = (oldStatus || "").toLowerCase() !== "enrollment" && safstatus.toLowerCase() === "enrollment";

      // Get course name for notifications
      let course_name = "your course";
      if (shouldHaveEnrollmentId || isMovingToEnrollment) {
        const courseRes = await client.query(
          "SELECT course_name FROM course WHERE course_id = $1",
          [course_id]
        );
        course_name = courseRes.rows[0]?.course_name || "your course";
      }

      if (shouldHaveEnrollmentId && !updatedLead.enrollment_id) {
        const enrollment_id = generateEnrollmentID();

        await client.query(
          "UPDATE leads SET enrollment_id = $1 WHERE lead_id = $2",
          [enrollment_id, id]
        );

        // Update the returned object with the new enrollment_id
        updatedLead.enrollment_id = enrollment_id;

        await sendEnrollmentEmail({
          name,
          email,
          mobile_number: `${country_code}${mobile_number}`,
          course_id,
          course_name,
          enrollment_id,
        });
      }

      // Send notification to assigned user when lead is moved to enrollment status
      // This triggers even if the lead already had an enrollment ID
      if (isMovingToEnrollment && user_id) {
        try {
          const userRes = await client.query(
            "SELECT email FROM users WHERE user_id = $1",
            [user_id]
          );
          if (userRes.rowCount > 0 && userRes.rows[0].email) {
            const assigneeEmail = userRes.rows[0].email;

            // Import and use the sendAssigneeNotification function for enrollment
            const { sendAssigneeNotification } = require("../../services/emailservice");
            await sendAssigneeNotification(
              {
                name,
                email,
                mobile_number: `${country_code}${mobile_number}`,
                course_name,
                status: "Enrollment",
                enrollment_id: updatedLead.enrollment_id,
              },
              assigneeEmail
            );
            console.log(`âœ… Assignee enrollment notification sent to: ${assigneeEmail}`);
          }
        } catch (notifyErr) {
          console.error("Error sending assignee enrollment notification:", notifyErr.message);
        }
      }
      await client.query("COMMIT");

      // Invalidate cache since data has changed
      leadsCache.invalidate();

      return res.status(200).json(updatedLead);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error updating lead:", err);
    return res.status(500).json({ error: "Failed to update lead" });
  }
};

// ======================= Get Leads with Filters =======================
exports.getLeads = async (req, res) => {
  const {
    courseType,
    course,
    status,
    trainer,
    batch,
    feeStatus,
    source,
    role,
    user_id,
    unit,
    cardType,
    referred_by,
    meta_campaign_id,
    priority,
    include_images = "false", // Optional: only include images if explicitly requested
    limit,
    offset = "0",
  } = req.query;

  // Parse pagination - allow fetching all leads for dashboard pipeline
  // Images are excluded by default to prevent OOM (frontend fetches them separately)
  const hasPagination = limit !== undefined && limit !== null && limit !== "";
  let limitNum;
  if (hasPagination) {
    limitNum = Math.min(Math.max(parseInt(limit, 10) || 10000, 1), 10000); // Between 1-10000
  } else {
    // No limit provided - allow fetching all leads (for dashboard pipeline view)
    // Images are excluded by default, so this is safe
    limitNum = 10000; // High limit to allow all leads
  }
  const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);

  // CRITICAL: Never include images by default - they cause massive payloads (60k+ chars each)
  // Images are fetched separately by frontend, so we don't need them here
  // Only include if explicitly requested AND limit is reasonable for a list view (e.g. Dashboard)
  const includeImages =
    (include_images === "true" || include_images === true) && limitNum <= 50;

  // Try to get cached data first (if images not requested)
  if (!includeImages) {
    const cacheKey = leadsCache.generateKey({
      courseType,
      course,
      status,
      trainer,
      batch,
      feeStatus,
      source,
      role,
      user_id,
      unit,
      cardType,
      referred_by,
      meta_campaign_id,
      priority,
      limit,
      offset,
    });

    const cachedData = leadsCache.get(cacheKey);
    if (cachedData) {
      console.log('[getLeads] Returning cached data');
      return res.status(200).json(cachedData);
    }
  }

  // Optimize query: Only fetch profile_image if explicitly requested
  // This dramatically reduces payload size
  const imageSelect = includeImages
    ? `CASE WHEN usr.profile_image IS NOT NULL THEN 'data:image/png;base64,' || encode(usr.profile_image, 'base64') ELSE NULL END AS assignee_profile_image`
    : `NULL AS assignee_profile_image`;

  let query = `
    SELECT
      leads.*,
      ${SQL_FEE_BALANCE_EXPR} AS fee_balance,
      ${SQL_PLACEMENT_BALANCE_EXPR} AS placement_balance,
      roles.name AS role,
      sources.name AS source,
      batch.batch_name,
      (SELECT string_agg(bx.batch_name, ', ' ORDER BY bx.batch_name)
       FROM batch bx
       WHERE bx.batch_id IN (
         SELECT (jsonb_array_elements_text(
           COALESCE(NULLIF(leads.batch_ids, '[]'::jsonb),
             CASE WHEN leads.batch_id IS NOT NULL THEN jsonb_build_array(leads.batch_id) ELSE '[]'::jsonb END
           )
         ))::int
       )
      ) AS all_batch_names,
      trainer.trainer_name,
      trainer.trainer_mobile,
      trainer.trainer_email,
      placement_trainer.trainer_name AS placement_trainer_name,
      course.course_name,
      course.course_type,
      unit.unit_name,
      card_type.card_type_name,
      usr.username AS assignee_name,
      usr.mobile AS assignee_mobile,
      usr.email AS assignee_email,
      ${imageSelect},
      meta_campaigns.name AS meta_campaign_name
    FROM leads
    LEFT JOIN roles     ON leads.role_id      = roles.id
    LEFT JOIN sources   ON leads.source_id    = sources.id
    LEFT JOIN batch     ON leads.batch_id     = batch.batch_id
    LEFT JOIN trainer   ON leads.trainer_id   = trainer.trainer_id
    LEFT JOIN trainer placement_trainer ON leads.placement_trainer::integer = placement_trainer.trainer_id
    LEFT JOIN course    ON leads.course_id    = course.course_id
    LEFT JOIN unit      ON leads.unit_id      = unit.unit_id
    LEFT JOIN card_type ON leads.card_type_id = card_type.card_type_id
    LEFT JOIN users usr ON leads.user_id      = usr.user_id
    LEFT JOIN meta_campaigns ON leads.meta_campaign_id = meta_campaigns.id
    WHERE 1=1
  `;

  const params = [];
  let idx = 1;

  // Do not exclude any status; fetch all leads

  // Dynamic filters
  // Helper to handle multi-select filters (comma-separated strings)
  const addFilter = (field, param, idxRef, isArray = false) => {
    let condition = "";
    let value = null;

    if (param) {
      if (param.includes(',')) {
        // Multi-select: use ANY
        const values = param.split(',').map(s => s.trim());
        condition = ` AND ${field} = ANY($${idxRef.current++})`;
        value = values;
      } else {
        // Single value
        condition = ` AND ${field} = $${idxRef.current++}`;
        value = param;
      }
    }
    return { condition, value };
  };

  // Helper object to manage index incrementing
  const idxRef = { current: idx };

  if (courseType) {
    const { condition, value } = addFilter("course.course_type", courseType, idxRef);
    if (condition) {
      query += condition;
      params.push(value);
    }
  }
  if (course) {
    const { condition, value } = addFilter("leads.course_id", course, idxRef);
    if (condition) {
      query += condition;
      params.push(value);
    }
  }
  if (status) {
    if (status.includes(',')) {
      const statuses = status.split(',').map(s => s.trim());
      query += ` AND leads.status = ANY($${idxRef.current++})`;
      params.push(statuses);
    } else {
      query += ` AND leads.status = $${idxRef.current++}`;
      params.push(status);
    }
  }
  if (trainer) {
    const { condition, value } = addFilter("trainer.trainer_name", trainer, idxRef);
    if (condition) {
      query += condition;
      params.push(value);
    }
  }
  if (batch) {
    if (batch.includes(",")) {
      const values = batch.split(",").map((s) => s.trim());
      query += ` AND EXISTS (
        SELECT 1 FROM batch bf
        WHERE bf.batch_name = ANY($${idxRef.current}::text[])
        AND (
          bf.batch_id = leads.batch_id
          OR (leads.batch_ids IS NOT NULL AND leads.batch_ids @> jsonb_build_array(bf.batch_id))
        )
      )`;
      params.push(values);
      idxRef.current++;
    } else {
      query += ` AND EXISTS (
        SELECT 1 FROM batch bf
        WHERE bf.batch_name = $${idxRef.current}
        AND (
          bf.batch_id = leads.batch_id
          OR (leads.batch_ids IS NOT NULL AND leads.batch_ids @> jsonb_build_array(bf.batch_id))
        )
      )`;
      params.push(batch);
      idxRef.current++;
    }
  }
  if (feeStatus) {
    const { condition, value } = addFilter("leads.paid_status", feeStatus, idxRef);
    if (condition) {
      query += condition;
      params.push(value);
    }
  }
  if (source) {
    const { condition, value } = addFilter("leads.source_id", source, idxRef);
    if (condition) {
      query += condition;
      params.push(value);
    }
  }
  if (role) {
    const { condition, value } = addFilter("leads.role_id", role, idxRef);
    if (condition) {
      query += condition;
      params.push(value);
    }
  }
  if (user_id) {
    const { condition, value } = addFilter("leads.user_id", user_id, idxRef);
    if (condition) {
      query += condition;
      params.push(value);
    }
  }
  if (unit) {
    const { condition, value } = addFilter("unit.unit_name", unit, idxRef);
    if (condition) {
      query += condition;
      params.push(value);
    }
  }
  if (cardType) {
    const { condition, value } = addFilter("card_type.card_type_name", cardType, idxRef);
    if (condition) {
      query += condition;
      params.push(value);
    }
  }
  if (referred_by) {
    // ILIKE doesn't work directly with ANY for pattern matching in this way easily
    // So we keep single pattern match for now, or could use simplified logic
    query += ` AND leads.referred_by ILIKE $${idxRef.current++}`;
    params.push(`%${referred_by}%`);
  }
  if (meta_campaign_id) {
    const { condition, value } = addFilter("leads.meta_campaign_id", meta_campaign_id, idxRef);
    if (condition) {
      query += condition;
      params.push(value);
    }
  }
  if (priority) {
    const { condition, value } = addFilter("leads.priority", priority, idxRef);
    if (condition) {
      query += condition;
      params.push(value);
    }
  }

  // Update the simple variable for subsequent use
  idx = idxRef.current;

  // Sort by priority (HOT first) then by newest leads first
  // CRITICAL: Always enforce LIMIT to prevent OOM errors
  query += ` ORDER BY 
    CASE 
      WHEN leads.priority = 'hot' THEN 1 
      WHEN leads.priority = 'warm' THEN 2 
      WHEN leads.priority = 'normal' THEN 3 
      ELSE 4 
    END ASC, 
    leads.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limitNum, offsetNum);

  // Safety check: Log if limit seems too high
  if (limitNum > 200) {
    console.warn(
      `[getLeads] WARNING: High limit requested (${limitNum}). This may cause performance issues.`
    );
  }

  try {
    // Optimize count query: only join what's needed for filters
    let countQuery = `SELECT COUNT(*) as total FROM leads`;
    const countParams = [];
    let cIdx = 1;
    let countJoins = "";

    if (courseType || course) {
      countJoins += ` LEFT JOIN course ON leads.course_id = course.course_id`;
    }
    if (trainer) {
      countJoins += ` LEFT JOIN trainer ON leads.trainer_id = trainer.trainer_id`;
    }
    if (unit) {
      countJoins += ` LEFT JOIN unit ON leads.unit_id = unit.unit_id`;
    }
    if (cardType) {
      countJoins += ` LEFT JOIN card_type ON leads.card_type_id = card_type.card_type_id`;
    }
    if (meta_campaign_id) {
      countJoins += ` LEFT JOIN meta_campaigns ON leads.meta_campaign_id = meta_campaigns.id`;
    }

    countQuery += countJoins + " WHERE 1=1";

    // Use the same idxRef logic for count query
    let cIdxRef = { current: 1 };

    // Count query filters
    if (courseType) {
      const { condition, value } = addFilter("course.course_type", courseType, cIdxRef);
      if (condition) {
        countQuery += condition;
        countParams.push(value);
      }
    }
    if (course) {
      const { condition, value } = addFilter("leads.course_id", course, cIdxRef);
      if (condition) {
        countQuery += condition;
        countParams.push(value);
      }
    }
    if (status) {
      if (status.includes(',')) {
        countQuery += ` AND leads.status = ANY($${cIdxRef.current++})`;
        countParams.push(status.split(',').map(s => s.trim()));
      } else {
        countQuery += ` AND leads.status = $${cIdxRef.current++}`;
        countParams.push(status);
      }
    }
    if (trainer) {
      const { condition, value } = addFilter("trainer.trainer_name", trainer, cIdxRef);
      if (condition) {
        countQuery += condition;
        countParams.push(value);
      }
    }
    if (batch) {
      if (batch.includes(",")) {
        const values = batch.split(",").map((s) => s.trim());
        countQuery += ` AND EXISTS (
        SELECT 1 FROM batch bf
        WHERE bf.batch_name = ANY($${cIdxRef.current}::text[])
        AND (
          bf.batch_id = leads.batch_id
          OR (leads.batch_ids IS NOT NULL AND leads.batch_ids @> jsonb_build_array(bf.batch_id))
        )
      )`;
        countParams.push(values);
        cIdxRef.current++;
      } else {
        countQuery += ` AND EXISTS (
        SELECT 1 FROM batch bf
        WHERE bf.batch_name = $${cIdxRef.current}
        AND (
          bf.batch_id = leads.batch_id
          OR (leads.batch_ids IS NOT NULL AND leads.batch_ids @> jsonb_build_array(bf.batch_id))
        )
      )`;
        countParams.push(batch);
        cIdxRef.current++;
      }
    }
    if (feeStatus) {
      const { condition, value } = addFilter("leads.paid_status", feeStatus, cIdxRef);
      if (condition) {
        countQuery += condition;
        countParams.push(value);
      }
    }
    if (source) {
      const { condition, value } = addFilter("leads.source_id", source, cIdxRef);
      if (condition) {
        countQuery += condition;
        countParams.push(value);
      }
    }
    if (role) {
      const { condition, value } = addFilter("leads.role_id", role, cIdxRef);
      if (condition) {
        countQuery += condition;
        countParams.push(value);
      }
    }
    if (user_id) {
      const { condition, value } = addFilter("leads.user_id", user_id, cIdxRef);
      if (condition) {
        countQuery += condition;
        countParams.push(value);
      }
    }
    if (unit) {
      const { condition, value } = addFilter("unit.unit_name", unit, cIdxRef);
      if (condition) {
        countQuery += condition;
        countParams.push(value);
      }
    }
    if (cardType) {
      const { condition, value } = addFilter("card_type.card_type_name", cardType, cIdxRef);
      if (condition) {
        countQuery += condition;
        countParams.push(value);
      }
    }
    if (referred_by) {
      countQuery += ` AND leads.referred_by ILIKE $${cIdxRef.current++}`;
      countParams.push(`%${referred_by}%`);
    }
    if (meta_campaign_id) {
      const { condition, value } = addFilter("leads.meta_campaign_id", meta_campaign_id, cIdxRef);
      if (condition) {
        countQuery += condition;
        countParams.push(value);
      }
    }
    if (priority) {
      const { condition, value } = addFilter("leads.priority", priority, cIdxRef);
      if (condition) {
        countQuery += condition;
        countParams.push(value);
      }
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalLeads = parseInt(countResult.rows[0]?.total || 0, 10);

    const { rows } = await pool.query(query, params);

    // CRITICAL SAFETY CHECK: If we got more rows than expected, truncate to prevent OOM
    if (rows.length > limitNum) {
      console.error(
        `[getLeads] CRITICAL: Query returned ${rows.length} rows but limit was ${limitNum}. Truncating to prevent OOM.`
      );
      rows.splice(limitNum); // Truncate to limit
    }

    // CRITICAL: Never include images unless explicitly requested AND limit is small
    // Images cause massive payloads (60k+ chars each) and OOM errors
    // Frontend fetches user images separately, so this is safe
    if (!includeImages) {
      // Set all to null explicitly - don't even process them
      rows.forEach((lead) => {
        lead.assignee_profile_image = null;
      });
    } else {
      // Even if images are requested, warn if limit is high
      if (limitNum > 100) {
        console.warn(
          `[getLeads] WARNING: Including images with limit=${limitNum} may cause performance issues.`
        );
      }
    }

    if (rows.length === 0) {
      // Return backward-compatible format if no pagination was requested
      if (!hasPagination) {
        return res.status(200).json([]);
      }
      return res.status(200).json({
        leads: [],
        pagination: {
          total: totalLeads,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < totalLeads,
        },
      });
    }
    // Fetch sub-courses for each lead with details
    const leadIds = rows.map((lead) => lead.lead_id);
    let subCoursesMap = {};
    if (leadIds.length > 0) {
      const subCoursesRes = await pool.query(
        `SELECT lsc.*, sc.sub_course_name, t.trainer_name
         FROM lead_sub_courses lsc
         LEFT JOIN sub_courses sc ON lsc.sub_course_id = sc.sub_course_id
         LEFT JOIN trainer t ON lsc.trainer_id = t.trainer_id
         WHERE lsc.lead_id = ANY($1)`,
        [leadIds]
      );
      // Group sub-courses by lead_id
      subCoursesRes.rows.forEach((sub) => {
        if (!subCoursesMap[sub.lead_id]) subCoursesMap[sub.lead_id] = [];
        subCoursesMap[sub.lead_id].push({
          id: sub.id,
          sub_course_id: sub.sub_course_id,
          sub_course_name: sub.sub_course_name,
          trainer_id: sub.trainer_id,
          trainer_name: sub.trainer_name,
          trainer_share: sub.trainer_share,
          trainer_share_amount: sub.trainer_share_amount,
          amount_paid_trainer: sub.amount_paid_trainer,
          pending_amount: sub.pending_amount,
          training_status: sub.training_status,
          training_start_date: sub.training_start_date,
          training_end_date: sub.training_end_date,
          trainer_paid: sub.trainer_paid,
        });
      });
    }
    // Attach sub_courses to each lead
    const leadsWithSubCourses = rows.map((lead) => ({
      ...lead,
      assignee_profile_image: lead.assignee_profile_image || null,
      sub_courses: subCoursesMap[lead.lead_id] || [],
    }));

    // Prepare response data
    const responseData = hasPagination
      ? {
        leads: leadsWithSubCourses,
        pagination: {
          total: totalLeads,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < totalLeads,
        },
      }
      : leadsWithSubCourses;

    // Cache the response if images were not requested
    if (!includeImages) {
      const cacheKey = leadsCache.generateKey({
        courseType,
        course,
        status,
        trainer,
        batch,
        feeStatus,
        source,
        role,
        user_id,
        unit,
        cardType,
        referred_by,
        meta_campaign_id,
        priority,
        limit,
        offset,
      });
      leadsCache.set(cacheKey, responseData);
    }

    // Return response
    return res.status(200).json(responseData);
  } catch (err) {
    console.error("âŒ Error fetching leads with filters:", err);
    return res
      .status(500)
      .json({ error: "Failed to fetch leads with filters." });
  }
};

// GET /api/leads/trainingprogress
exports.getTrainingProgressLeads = async (req, res) => {
  try {
    const query = `
      SELECT
        l.*,
        (
          CASE
            WHEN l.discounted_fee IS NOT NULL THEN GREATEST(
              0::numeric,
              ROUND((l.discounted_fee * 1.06)::numeric, 2) - COALESCE(l.fee_paid, 0)
            )
            ELSE NULL
          END
        ) AS fee_balance,
        c.course_name,
        c.course_type,
        json_build_object(
          'batch_id', b.batch_id,
          'batch_name', b.batch_name,
          'start_date', b.start_date,
          'end_date', b.end_date,
          'class_timing', b.class_timing,
          'days_of_week', b.days_of_week,
          'trainer_id', b.trainer_id
        ) AS batch,
        json_build_object(
          'trainer_id', t.trainer_id,
          'trainer_name', t.trainer_name,
          'trainer_mobile', t.trainer_mobile,
          'trainer_email', t.trainer_email
        ) AS trainer
      FROM leads l
      LEFT JOIN batch b ON l.batch_id = b.batch_id
      LEFT JOIN course c ON l.course_id = c.course_id
      LEFT JOIN trainer t ON l.trainer_id = t.trainer_id
      WHERE l.status = $1
      ORDER BY l.lead_id DESC
    `;

    const { rows } = await pool.query(query, ["trainingprogress"]);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to fetch." });
  }
};

// ======================= Delete Lead =======================
exports.deleteLead = async (req, res) => {
  const { id } = req.params;
  let { reason } = req.body ?? {};

  if (!reason || String(reason).trim() === "") {
    reason = "Deleted via API";
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const leadRes = await client.query(
      "SELECT * FROM leads WHERE lead_id = $1",
      [id]
    );
    if (!leadRes.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Lead not found." });
    }
    const lead = leadRes.rows[0];

    // Delete dependent records first to satisfy FK constraints
    await client.query("DELETE FROM trainer_payouts WHERE lead_id = $1", [id]);
    await client.query("DELETE FROM lead_sub_courses WHERE lead_id = $1", [id]);

    await client.query("DELETE FROM leads WHERE lead_id = $1", [id]);

    await client.query("COMMIT");

    try {
      await sendDeleteNotification(lead, reason);
    } catch (notifyError) {
      console.error("Failed to send delete notification:", notifyError);
      // Notification failures should not block successful deletion.
    }

    res.status(200).json({ message: "Lead deleted successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting lead:", err);
    // Provide a user-friendly message if FK constraints fail
    if (err.code === "23503") {
      return res.status(400).json({
        error:
          "Unable to delete lead because related trainer payouts or sub-course records still exist.",
      });
    }
    res.status(500).json({ error: "Failed to delete lead." });
  } finally {
    client.release();
  }
};

// ======================= Update Status Only (For Drag & Drop) =======================
exports.updateStatusLead = async (req, res) => {
  const { id } = req.params;
  const { status, generateCertificate: generateCertificateFlag } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required." });
  }

  try {
    // Fetch old lead data (for notifications and enrollment logic)
    const { rowCount: existCount, rows: existRows } = await pool.query(
      "SELECT lead_id, name, email, mobile_number, country_code, course_id, status, enrollment_id, user_id FROM leads WHERE lead_id = $1",
      [id]
    );
    if (!existCount) {
      return res.status(404).json({ error: "Lead not found." });
    }
    const lead = existRows[0];
    const oldStatus = lead.status;

    const normalizeLeadStatus = (s) =>
      s != null && String(s).trim() !== ""
        ? String(s).trim().toLowerCase()
        : "";
    const wantsCertificateEmail =
      generateCertificateFlag === true ||
      generateCertificateFlag === "true";

    // Check if moving to enrollment status (with null safety)
    const enrollmentStatuses = ["enrollment", "completed", "placed"];
    const isMovingToEnrollment =
      oldStatus &&
      oldStatus.toLowerCase() !== "enrollment" &&
      status.toLowerCase() === "enrollment";
    const shouldHaveEnrollmentId = enrollmentStatuses.includes(status.toLowerCase());

    // Generate enrollment ID if needed
    let enrollment_id = lead.enrollment_id;
    if (shouldHaveEnrollmentId && !lead.enrollment_id) {
      enrollment_id = generateEnrollmentID();
    }

    // Update status (and enrollment_id if generated)
    let updateQuery, updateParams;
    if (enrollment_id && !lead.enrollment_id) {
      updateQuery = "UPDATE leads SET status = $1, enrollment_id = $2, updated_at = NOW() WHERE lead_id = $3 RETURNING *";
      updateParams = [status, enrollment_id, id];
    } else {
      updateQuery = "UPDATE leads SET status = $1, updated_at = NOW() WHERE lead_id = $2 RETURNING *";
      updateParams = [status, id];
    }

    const { rowCount, rows } = await pool.query(updateQuery, updateParams);
    if (!rowCount) {
      return res.status(404).json({ error: "Failed to update status." });
    }
    const updatedLead = rows[0];

    // Send notification email if status changed
    if (oldStatus !== status) {
      const { name, email, mobile_number, country_code, course_id } = lead;
      await sendStatusUpdateEmail(
        {
          name,
          email,
          mobile_number: `${country_code}${mobile_number}`,
          course_id,
        },
        status
      );

      // If moving to enrollment, send additional emails
      if (isMovingToEnrollment) {
        // Get course name
        const courseRes = await pool.query(
          "SELECT course_name FROM course WHERE course_id = $1",
          [course_id]
        );
        const course_name = courseRes.rows[0]?.course_name || "your course";

        // Send enrollment email to lead (if enrollment_id was just generated)
        if (enrollment_id && !lead.enrollment_id) {
          await sendEnrollmentEmail({
            name,
            email,
            mobile_number: `${country_code}${mobile_number}`,
            course_id,
            course_name,
            enrollment_id,
          });
        }

        // Send notification to assigned user
        if (lead.user_id) {
          try {
            const userRes = await pool.query(
              "SELECT email FROM users WHERE user_id = $1",
              [lead.user_id]
            );
            if (userRes.rowCount > 0 && userRes.rows[0].email) {
              const assigneeEmail = userRes.rows[0].email;
              const { sendAssigneeNotification } = require("../../services/emailservice");
              await sendAssigneeNotification(
                {
                  name,
                  email,
                  mobile_number: `${country_code}${mobile_number}`,
                  course_name,
                  status: "Enrollment",
                  enrollment_id: updatedLead.enrollment_id,
                },
                assigneeEmail
              );
              console.log(`âœ… Assignee enrollment notification sent to: ${assigneeEmail}`);
            }
          } catch (notifyErr) {
            console.error("Error sending assignee enrollment notification:", notifyErr.message);
          }
        }
      }

      // If moving to certification status, generate and send certificate only when user confirmed
      // Do not use `oldStatus &&`: null/empty previous status must still allow first move to Certification
      const isMovingToCertification =
        normalizeLeadStatus(oldStatus) !== "certification" &&
        String(status).trim().toLowerCase() === "certification";

      if (isMovingToCertification && wantsCertificateEmail) {
        try {
          console.log(`ðŸŽ“ Lead moved to Certification status. Generating certificate for lead ${id}...`);
          console.log(`ðŸ“‹ Lead details: Name=${name}, Email=${email}, Course ID=${course_id}`);

          // Import certificate service
          const { generateAndSaveCertificate } = require("../../services/certificateService");
          const { sendCertificateEmail } = require("../../services/emailservice");

          // Generate certificate
          console.log(`ðŸ“„ Calling generateAndSaveCertificate for lead ${id}...`);
          const certificateData = await generateAndSaveCertificate(id);
          console.log(`âœ… Certificate generated:`, certificateData.fileName);

          // Send certificate via email
          console.log(`ðŸ“§ Sending certificate email to ${email}...`);
          await sendCertificateEmail(certificateData);

          console.log(`âœ… Certificate generated and sent successfully for ${name} (${email})`);
        } catch (certErr) {
          console.error("âŒ Error generating/sending certificate:", certErr);
          console.error("Certificate Error Stack:", certErr.stack);
          // Don't fail the status update if certificate generation fails
          // Just log the error and continue
        }
      }
    }

    // Invalidate cache since data has changed
    leadsCache.invalidate();

    res.status(200).json(updatedLead);
  } catch (err) {
    console.error("Error updating lead status:", err);
    res.status(500).json({ error: "Failed to update status." });
  }
};

// ======================= Get Lead by ID =======================
exports.getLeadById = async (req, res) => {
  const { lead_id } = req.params;
  try {
    // Main lead query with joins for course, batch, trainer, etc.
    const leadQuery = `
      SELECT
        leads.*,
        ${SQL_FEE_BALANCE_EXPR} AS fee_balance,
        ${SQL_PLACEMENT_BALANCE_EXPR} AS placement_balance,
        roles.name AS role,
        sources.name AS source,
        batch.batch_name,
        (SELECT string_agg(bx.batch_name, ', ' ORDER BY bx.batch_name)
         FROM batch bx
         WHERE bx.batch_id IN (
           SELECT (jsonb_array_elements_text(
             COALESCE(NULLIF(leads.batch_ids, '[]'::jsonb),
               CASE WHEN leads.batch_id IS NOT NULL THEN jsonb_build_array(leads.batch_id) ELSE '[]'::jsonb END
             )
           ))::int
         )
        ) AS all_batch_names,
        trainer.trainer_name,
        trainer.trainer_mobile,
        trainer.trainer_email,
        placement_trainer.trainer_name AS placement_trainer_name,
        course.course_name,
        course.course_type,
        unit.unit_name,
        card_type.card_type_name,
        usr.username AS assignee_name,
        usr.mobile AS assignee_mobile,
        usr.email AS assignee_email,
        usr.profile_image AS assignee_profile_image,
        meta_campaigns.name AS meta_campaign_name
      FROM leads
      LEFT JOIN roles     ON leads.role_id      = roles.id
      LEFT JOIN sources   ON leads.source_id    = sources.id
      LEFT JOIN batch     ON leads.batch_id     = batch.batch_id
      LEFT JOIN trainer   ON leads.trainer_id   = trainer.trainer_id
      LEFT JOIN trainer placement_trainer ON leads.placement_trainer::integer = placement_trainer.trainer_id
      LEFT JOIN course    ON leads.course_id    = course.course_id
      LEFT JOIN unit      ON leads.unit_id      = unit.unit_id
      LEFT JOIN card_type ON leads.card_type_id = card_type.card_type_id
      LEFT JOIN users usr ON leads.user_id      = usr.user_id
      LEFT JOIN meta_campaigns ON leads.meta_campaign_id = meta_campaigns.id
      WHERE leads.lead_id = $1
      LIMIT 1
    `;
    const { rowCount, rows } = await pool.query(leadQuery, [lead_id]);
    if (!rowCount) {
      return res.status(404).json({ error: "Lead not found." });
    }
    const lead = rows[0];
    lead.assignee_profile_image = bufferToBase64(lead.assignee_profile_image);

    // Fetch sub-courses for this lead
    const subCoursesRes = await pool.query(
      `SELECT lsc.*, sc.sub_course_name, t.trainer_name
       FROM lead_sub_courses lsc
       LEFT JOIN sub_courses sc ON lsc.sub_course_id = sc.sub_course_id
       LEFT JOIN trainer t ON lsc.trainer_id = t.trainer_id
       WHERE lsc.lead_id = $1`,
      [lead_id]
    );
    lead.sub_courses = subCoursesRes.rows || [];

    // Add all important fee/payment details explicitly
    lead.actual_fee =
      lead.actual_fee !== undefined ? Number(lead.actual_fee) : null;
    lead.discounted_fee =
      lead.discounted_fee !== undefined ? Number(lead.discounted_fee) : null;
    lead.fee_paid = lead.fee_paid !== undefined ? Number(lead.fee_paid) : null;
    lead.fee_balance =
      lead.fee_balance !== undefined ? Number(lead.fee_balance) : null;
    lead.placement_fee =
      lead.placement_fee !== undefined ? Number(lead.placement_fee) : null;
    lead.placement_discounted_fee =
      lead.placement_discounted_fee !== undefined ? Number(lead.placement_discounted_fee) : null;
    lead.placement_paid =
      lead.placement_paid !== undefined ? Number(lead.placement_paid) : null;
    lead.placement_balance =
      lead.placement_balance !== undefined ? Number(lead.placement_balance) : null;
    lead.paid_status =
      lead.paid_status ||
      (lead.fee_paid === 0
        ? "not paid"
        : lead.fee_balance === 0
          ? "paid"
          : "partially paid");
    lead.placement_paid_status =
      lead.placement_paid_status ||
      (lead.placement_paid === 0
        ? "not paid"
        : lead.placement_balance === 0
          ? "paid"
          : "partially paid");

    // Add any other important fields for admin validation
    lead.college_company = lead.college_company || null;
    lead.location = lead.location || null;
    lead.email = lead.email || null;
    lead.status = lead.status || null;
    lead.batch_name = lead.batch_name || null;
    lead.all_batch_names = lead.all_batch_names || lead.batch_name || null;
    lead.trainer_name = lead.trainer_name || null;
    lead.trainer_mobile = lead.trainer_mobile || null;
    lead.trainer_email = lead.trainer_email || null;
    lead.placement_trainer_name = lead.placement_trainer_name || null;
    lead.course_name = lead.course_name || null;
    lead.course_type = lead.course_type || null;
    lead.unit_name = lead.unit_name || null;
    lead.card_type_name = lead.card_type_name || null;
    lead.assignee_name = lead.assignee_name || null;
    lead.assignee_mobile = lead.assignee_mobile || null;
    lead.assignee_email = lead.assignee_email || null;
    lead.meta_campaign_name = lead.meta_campaign_name || null;

    return res.status(200).json(lead);
  } catch (err) {
    console.error("âŒ Error fetching lead by ID:", err);
    return res.status(500).json({ error: "Failed to fetch lead by ID." });
  }
};
