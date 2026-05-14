const pool = require("../../config/db");
const { sendLeadNotifications } = require("../../services/emailservice");

// Helper to find ID by name (case-insensitive)
const findIdByName = async (table, colName, value) => {
    if (!value) return null;
    const result = await pool.query(
        `SELECT id, ${colName} FROM ${table} WHERE LOWER(${colName}) = LOWER($1) LIMIT 1`,
        [value.trim()]
    );
    return result.rows[0] ? result.rows[0].id : null;
};

// Map Business Unit (uc/jz) to Unit Name Search Term
const mapBusinessUnit = (bu) => {
    if (!bu) return null;
    const lower = bu.toLowerCase().trim();
    if (lower === 'uc' || lower === 'urbancode') return 'Urban';
    if (lower === 'jz' || lower === 'justzen' || lower === 'zen') return 'Zen';
    return null;
};

exports.handleExternalEnrollment = async (req, res) => {
    console.log("=== EXTERNAL ENROLLMENT REQUEST ===");
    console.log("Body:", req.body);

    const {
        name,
        mobile_number,
        email,
        course,
        source,
        businessunit,
        card_type
    } = req.body;

    // 1. Validation
    const missing = [];
    if (!name) missing.push("name");
    if (!mobile_number) missing.push("mobile_number");
    if (missing.length) {
        return res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(", ")}` });
    }

    const client = await pool.connect();

    try {
        // 2. Lookups
        // Unit
        let unit_id = null;
        const unitTerm = mapBusinessUnit(businessunit);
        if (unitTerm) {
            const uRes = await pool.query("SELECT unit_id FROM unit WHERE LOWER(unit_name) LIKE $1 LIMIT 1", [`%${unitTerm.toLowerCase()}%`]);
            if (uRes.rowCount) unit_id = uRes.rows[0].unit_id;
        }

        // Source (website)
        let source_id = null;
        const sourceVal = source || 'Website';
        const sRes = await pool.query("SELECT id FROM sources WHERE LOWER(name) LIKE $1 LIMIT 1", [`%${sourceVal.toLowerCase()}%`]);
        if (sRes.rowCount) source_id = sRes.rows[0].id;

        // Card Type (training only)
        let card_type_id = null;
        const cardVal = card_type || 'Training';
        const cRes = await pool.query("SELECT card_type_id FROM card_type WHERE LOWER(card_type_name) LIKE $1 LIMIT 1", [`%${cardVal.toLowerCase()}%`]);
        if (cRes.rowCount) card_type_id = cRes.rows[0].card_type_id;

        // Course
        let course_id = null;
        let course_name_db = null;

        console.log("Searching for course:", course);
        if (course) {
            const coRes = await pool.query("SELECT course_id, course_name FROM course WHERE LOWER(course_name) = LOWER($1) OR LOWER(course_name) LIKE $2 LIMIT 1", [course.trim(), `%${course.trim().toLowerCase()}%`]);
            console.log("Course Lookup Result:", coRes.rows);
            if (coRes.rowCount) {
                course_id = coRes.rows[0].course_id;
                course_name_db = coRes.rows[0].course_name;
            }
        }
        console.log("Resolved course_id:", course_id);

        // --- VALIDATE LOOKUPS ---
        const lookupErrors = [];
        if (!course) lookupErrors.push(`Course is required`);
        if (course && !course_id) lookupErrors.push(`Course '${course}' not found in database`);

        if (lookupErrors.length > 0) {
            console.log("Validation Failed:", lookupErrors);
            client.release();
            return res.status(400).json({ success: false, error: lookupErrors.join(", ") });
        }

        // 3. Insert Lead
        const status = 'enquiry';

        console.log("Attempting Insert with values:", {
            name,
            mobile_number,
            course_id,
            source_id,
            unit_id,
            card_type_id
        });

        await client.query("BEGIN");

        const insertQuery = `
      INSERT INTO leads (
        name, 
        mobile_number, 
        email, 
        course_id, 
        source_id, 
        unit_id, 
        card_type_id, 
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;

        const values = [
            name,
            mobile_number,
            email || null,
            course_id,
            source_id,
            unit_id,
            card_type_id,
            status
        ];

        const resIns = await client.query(insertQuery, values);
        await client.query("COMMIT");

        const lead = resIns.rows[0];
        console.log("External lead created:", lead.lead_id);

        // 4. Send Notification
        try {
            await sendLeadNotifications({
                name,
                mobile_number: mobile_number,
                email,
                course_id: course_id,
                course_name: course_name_db
            });
        } catch (notifErr) {
            console.error("Notification failed for external lead:", notifErr.message);
        }

        res.status(201).json({
            success: true,
            message: "Lead submitted successfully",
            lead_id: lead.lead_id
        });

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error in external enrollment:", err);
        res.status(500).json({ success: false, error: err.message, stack: err.stack });
    } finally {
        if (client) client.release();
    }
};
