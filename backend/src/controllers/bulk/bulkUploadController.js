const fs = require("fs");
const csv = require("csv-parser");
const pool = require("../../config/db");
const format = require("pg-format");
const { generateEnrollmentID } = require("../../utils/generateEnrollmentID");
const { feeBalanceFromBaseDiscounted } = require("../../utils/feeGst");

// Helper to normalized strings for comparison
const normalize = (str) => (str ? str.trim().toLowerCase() : "");

exports.bulkUploadLeads = async (req, res) => {
  const filePath = req.file.path;
  const leads = [];
  const errors = [];

  // Allowed Statuses
  const allowedStatuses = new Set([
    "enquiry", "prospect", "enrollment", "trainingprogress", "handsonproject",
    "certification", "cvbuild", "mockinterviews", "liveinterviews",
    "placement", "placementdue", "placementpaid", "finishers",
    "onhold", "archived", "completed",
  ]);

  const statusesWithoutEnrollmentID = new Set([
    "enquiry", "prospect", "onhold", "archived",
  ]);

  // Maps for ID lookups
  const sourcesMap = new Map();
  const rolesMap = new Map();
  const unitsMap = new Map();
  const cardTypesMap = new Map();
  const coursesMap = new Map();
  const batchesMap = new Map();
  const trainersMap = new Map();
  const usersMap = new Map();

  try {
    // 1. Fetch all lookup data
    const [
      sourcesRes,
      rolesRes,
      unitsRes,
      cardTypesRes,
      coursesRes,
      batchesRes,
      trainersRes,
      usersRes
    ] = await Promise.all([
      pool.query("SELECT id, name FROM sources"),
      pool.query("SELECT id, name FROM roles"),
      pool.query("SELECT unit_id, unit_name FROM unit"),
      pool.query("SELECT card_type_id, card_type_name FROM card_type"),
      pool.query("SELECT course_id, course_name FROM course"),
      pool.query("SELECT batch_id, batch_name FROM batch"),
      pool.query("SELECT trainer_id, trainer_name FROM trainer"),
      pool.query("SELECT user_id, username FROM users"),
    ]);

    // Populate Maps (Name -> ID)
    sourcesRes.rows.forEach(r => sourcesMap.set(normalize(r.name), r.id));
    rolesRes.rows.forEach(r => rolesMap.set(normalize(r.name), r.id));
    unitsRes.rows.forEach(r => unitsMap.set(normalize(r.unit_name), r.unit_id));
    cardTypesRes.rows.forEach(r => cardTypesMap.set(normalize(r.card_type_name), r.card_type_id));
    const validCourseIds = new Set();
    coursesRes.rows.forEach(r => validCourseIds.add(r.course_id));

    batchesRes.rows.forEach(r => batchesMap.set(normalize(r.batch_name), r.batch_id));
    trainersRes.rows.forEach(r => trainersMap.set(normalize(r.trainer_name), r.trainer_id));
    usersRes.rows.forEach(r => usersMap.set(normalize(r.username), r.user_id));


    // 2. Process CSV
    let data = fs.readFileSync(filePath, "utf8");
    if (data.charCodeAt(0) === 0xfeff) data = data.slice(1); // Remove BOM

    const stream = require("stream");
    const readableStream = new stream.Readable();
    readableStream.push(data);
    readableStream.push(null);

    let rowNumber = 1;
    const rows = [];
    let responseSent = false;
    let parser;

    parser = readableStream
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim().toLowerCase(),
          mapValues: ({ value }) => value.trim(),
        })
      )
      .on("headers", (headers) => {
        // Updated required fields (using names instead of IDs where appropriate)
        const requiredFields = [
          "name",
          "mobile_number",
          "course_id", // Reverted back to course_id
          "status",
          "unit", // was unit_id
          "card_type", // was card_type_id
        ];

        // Check for aliases or allow fallback to _id
        const missing = requiredFields.filter(field => {
          const hasField = headers.includes(field);
          const hasIdVariant = headers.includes(field + "_id") || headers.includes(field + "_name");
          // Special handling for legacy headers support
          if (field === 'unit' && headers.includes('unit_id')) return false;
          if (field === 'card_type' && headers.includes('card_type_id')) return false;

          return !hasField;
        });

        if (missing.length > 0) {
          const errMsg = `Missing required fields: ${missing.join(", ")}`;
          console.error("Header Error:", errMsg);
          responseSent = true;
          parser.destroy();
          try { fs.unlinkSync(filePath); } catch (e) { }
          return res.status(400).json({ error: errMsg });
        }
      })
      .on("data", (row) => {
        if (!responseSent) {
          rowNumber++;
          rows.push({ ...row, rowNumber });
        }
      })
      .on("end", async () => {
        if (responseSent) return;

        const processedLeads = []; // Renamed from leads to avoid confusion

        for (const rowObj of rows) {
          // Destructure with fallbacks for different column naming conventions
          const name = rowObj.name;
          const country_code = rowObj.country_code || "+91";
          const mobile_number = rowObj.mobile_number;
          const email = rowObj.email;
          const roleRaw = rowObj.role || rowObj.role_id;
          const college_company = rowObj.college_company || rowObj.college;
          const location = rowObj.location;
          const sourceRaw = rowObj.source || rowObj.source_id;
          const courseIdRaw = rowObj.course_id;
          const batchRaw = rowObj.batch || rowObj.batch_id || rowObj.batch_name;
          const trainerRaw = rowObj.trainer || rowObj.trainer_id || rowObj.trainer_name;
          const actual_fee = rowObj.actual_fee;
          const discounted_fee = rowObj.discounted_fee;
          const fee_paid = rowObj.fee_paid;
          const status = rowObj.status || "enquiry";
          const paid_status = rowObj.paid_status;
          const counselorRaw = rowObj.counselor || rowObj.user || rowObj.user_id || rowObj.username || rowObj.assignee;
          const unitRaw = rowObj.unit || rowObj.unit_id || rowObj.unit_name;
          const cardTypeRaw = rowObj.card_type || rowObj.card_type_id || rowObj.card_type_name;
          const rowNum = rowObj.rowNumber;

          let rowErrors = [];

          // Basic Validations
          if (!name) rowErrors.push("'name' is required.");
          if (!mobile_number) rowErrors.push("'mobile_number' is required.");
          if (!status) rowErrors.push("'status' is required.");

          const normalizedStatus = normalize(status).replace(/\s+/g, "");
          if (!allowedStatuses.has(normalizedStatus))
            rowErrors.push(`Invalid status '${status}'`);

          // Lookup Logic
          // Unit
          const unitId = unitsMap.get(normalize(unitRaw));
          if (!unitId) rowErrors.push(`Invalid Unit '${unitRaw}'`);

          // Card Type
          const cardTypeId = cardTypesMap.get(normalize(cardTypeRaw));
          if (!cardTypeId) rowErrors.push(`Invalid Card Type '${cardTypeRaw}'`);

          // Course (Strict ID Check)
          if (!courseIdRaw) {
            rowErrors.push("'course_id' is required.");
          } else if (!validCourseIds.has(courseIdRaw)) {
            rowErrors.push(`Invalid Course ID '${courseIdRaw}'`);
          }

          // Optional Lookups
          let sourceId = null;
          if (sourceRaw) {
            sourceId = sourcesMap.get(normalize(sourceRaw));
            if (!sourceId && sourceRaw) rowErrors.push(`Invalid Source '${sourceRaw}'`);
          }

          let roleId = null;
          if (roleRaw) {
            roleId = rolesMap.get(normalize(roleRaw));
            if (!roleId && roleRaw) rowErrors.push(`Invalid Role '${roleRaw}'`);
          }

          let batchId = null;
          if (batchRaw) {
            batchId = batchesMap.get(normalize(batchRaw));
            if (!batchId) rowErrors.push(`batch '${batchRaw}' not found`);
          }

          let trainerId = null;
          if (trainerRaw) {
            trainerId = trainersMap.get(normalize(trainerRaw));
            if (!trainerId) rowErrors.push(`trainer '${trainerRaw}' not found`);
          }

          let userId = null; // Counselor
          if (counselorRaw) {
            userId = usersMap.get(normalize(counselorRaw));
            if (!userId) rowErrors.push(`counselor/user '${counselorRaw}' not found`);
          }


          if (rowErrors.length > 0) {
            errors.push(`Line ${rowNum}: ${rowErrors.join(", ")}`);
            continue;
          }

          // Fees Calculation
          const f_actual_fee = actual_fee ? parseFloat(actual_fee) : 0;
          const f_discounted_fee = discounted_fee ? parseFloat(discounted_fee) : 0;
          const f_fee_paid = fee_paid ? parseFloat(fee_paid) : 0;
          const balance = feeBalanceFromBaseDiscounted(
            f_discounted_fee,
            f_fee_paid
          );

          let final_paid_status = paid_status ||
            (f_fee_paid === 0 ? "not paid" : balance <= 0 ? "paid" : "partially paid"); // balance <= 0 covers overpaid too

          const enrollment_id = !statusesWithoutEnrollmentID.has(normalizedStatus)
            ? generateEnrollmentID()
            : null;

          processedLeads.push([
            name,
            country_code,
            mobile_number,
            email || null,
            roleId,
            college_company || null,
            location || null,
            sourceId,
            courseIdRaw,
            batchId,
            trainerId,
            f_actual_fee,
            f_discounted_fee,
            f_fee_paid,
            normalizedStatus,
            final_paid_status,
            userId,
            unitId,
            cardTypeId,
            enrollment_id,
            new Date(),
          ]);
        }

        // Clean up file
        try { fs.unlinkSync(filePath); } catch (e) {
          console.error("Error deleting file:", e);
        }

        if (errors.length > 0) {
          responseSent = true;
          return res.status(400).json({
            error: "Validation errors in CSV",
            issues: errors,
          });
        }

        if (!processedLeads.length) {
          responseSent = true;
          return res.status(400).json({ error: "No valid leads to upload." });
        }

        const insertQuery = format(
          `
          INSERT INTO leads (
            name, country_code, mobile_number, email, role_id,
            college_company, location, source_id, course_id,
            batch_id, trainer_id, actual_fee, discounted_fee, fee_paid,
            status, paid_status, user_id, unit_id, card_type_id,
            enrollment_id, created_at
          ) VALUES %L RETURNING *
        `,
          processedLeads
        );

        try {
          const result = await pool.query(insertQuery);
          responseSent = true;
          return res.status(200).json({
            message: `${result.rowCount} leads uploaded successfully.`,
          });
        } catch (dbErr) {
          console.error("Database Insertion Error:", dbErr.message);
          responseSent = true;
          return res.status(500).json({
            error: "Failed to insert leads into database",
            details: dbErr.message,
          });
        }
      })
      .on("error", (err) => {
        if (!responseSent) {
          console.error("CSV Parser Error:", err);
          responseSent = true;
          try { fs.unlinkSync(filePath); } catch (e) { }
          return res.status(500).json({
            error: "Error parsing CSV file",
            details: err.message,
          });
        }
      });

  } catch (err) {
    console.error("Unexpected Server Error:", err.message);
    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (e) { }
    return res.status(500).json({
      error: "Unexpected server error during bulk upload setup.",
      details: err.message
    });
  }
};

exports.downloadSampleCsv = async (req, res) => {
  try {
    const csvHeaders = [
      "name",
      "mobile_number",
      "course_id",
      "status",
      "unit",
      "card_type",
      "email",
      "role",
      "college_company",
      "location",
      "source",
      "batch",
      "trainer",
      "actual_fee",
      "discounted_fee",
      "fee_paid",
      "paid_status",
      "assignee"
    ];

    const sampleRow = [
      "John Doe",
      "9876543210",
      "CRS-MERN-001",
      "enquiry",
      "Urbancode",
      "Training only",
      "john@example.com",
      "Student",
      "Example College",
      "New York",
      "Instagram",
      "Batch 101",
      "John Trainer",
      "10000",
      "9000",
      "5000",
      "partially paid",
      "Atchaya"
    ];

    const csvContent = [
      csvHeaders.join(","),
      sampleRow.join(",")
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=leads_sample_v2.csv");
    res.status(200).send(csvContent);

  } catch (error) {
    console.error("Error generating sample CSV:", error);
    res.status(500).json({ error: "Failed to generate sample CSV" });
  }
};
