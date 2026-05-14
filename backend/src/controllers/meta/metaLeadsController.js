/**
 * Meta Leads Controller
 * Handles CRUD operations and Facebook webhook events for Meta Lead Ads
 */

const db = require("../../config/db");
const facebookLeadsService = require("../../services/facebookLeadsService");

/**
 * Get all meta leads
 */
exports.getAllMetaLeads = async (req, res) => {
    try {
        const { form_id } = req.query;
        let query = `SELECT id, lead_name, email, phone, campaign_source, form_id, form_name, form_status, lead_id, 
                      ad_id, ad_name, page_id, status, notes, created_date, updated_at 
               FROM meta_leads`;
        let params = [];

        if (form_id && form_id !== 'all') {
            query += ` WHERE form_id = $1`;
            params.push(form_id);
        }

        query += ` ORDER BY 
                    CASE WHEN form_status = 'ACTIVE' THEN 0 ELSE 1 END ASC,
                    CASE WHEN status = 'new' THEN 0 ELSE 1 END ASC,
                    created_date DESC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching meta leads:", err);
        res.status(500).json({
            error: "Failed to fetch meta leads",
            details: err.message
        });
    }
};

/**
 * Get summary of leads per form
 */
exports.getFormsSummary = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
                COALESCE(form_id, 'messaging') as form_id, 
                COALESCE(form_name, 'Messenger/Instagram') as form_name, 
                COUNT(*) as lead_count
             FROM meta_leads 
             GROUP BY form_id, form_name
             ORDER BY lead_count DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching forms summary:", err);
        res.status(500).json({ error: "Failed to fetch forms summary" });
    }
};

/**
 * Sync all past leads from all forms for a page
 */
exports.syncAllLeads = async (req, res) => {
    try {
        const { pageId } = req.body;
        if (!pageId) {
            return res.status(400).json({ error: 'pageId is required' });
        }

        console.log(`🚀 Starting DUAL SYNC (Forms + Messaging) for page: ${pageId}`);

        let totalNew = 0;
        let totalUpdated = 0;
        let totalFoundAcrossAll = 0;

        // --- STEP 1: FORM SYNC ---
        const forms = await facebookLeadsService.getPageForms(pageId);
        console.log(`📋 Found ${forms.length} lead forms. Syncing form data...`);

        for (const form of forms) {
            try {
                const leads = await facebookLeadsService.getLeadsByForm(form.id, pageId);
                totalFoundAcrossAll += leads.length;

                for (const lead of leads) {
                    const result = await saveOrUpdateLead(lead, pageId, form.name, form.status);
                    if (result === 'new') totalNew++;
                    if (result === 'updated') totalUpdated++;
                }
            } catch (err) {
                console.warn(`   ⚠️ Skip form ${form.id}: ${err.message}`);
            }
        }

        // --- STEP 2: MESSAGING SYNC (For Messenger/Instagram) ---
        console.log(`📡 Starting Messaging lead discovery...`);
        const msgLeads = await facebookLeadsService.getPageMessagingLeads(pageId);
        console.log(`📥 Found ${msgLeads.length} messaging leads.`);
        totalFoundAcrossAll += msgLeads.length;

        for (const lead of msgLeads) {
            const result = await saveOrUpdateLead(lead, pageId, 'Facebook Messaging', 'ACTIVE');
            if (result === 'new') totalNew++;
            if (result === 'updated') totalUpdated++;
        }

        console.log(`✅ Final Sync Results: ${totalFoundAcrossAll} total found across all channels.`);
        res.json({
            message: 'Multi-channel sync completed',
            summary: {
                total_found: totalFoundAcrossAll,
                new_leads: totalNew,
                updated_leads: totalUpdated
            }
        });
    } catch (err) {
        console.error('❌ Error in syncAllLeads:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Helper to save or update lead in DB
 */
async function saveOrUpdateLead(lead, pageId, formName, formStatus = 'ACTIVE') {
    try {
        const existing = await db.query(
            'SELECT id FROM meta_leads WHERE lead_id = $1',
            [lead.lead_id]
        );

        if (existing.rows.length > 0) {
            await db.query(
                `UPDATE meta_leads 
                 SET lead_name = $1, email = $2, phone = $3, campaign_source = $4, 
                     ad_name = $5, raw_data = $6, form_name = $7, form_status = $8, updated_at = CURRENT_TIMESTAMP 
                 WHERE lead_id = $9`,
                [
                    lead.lead_name,
                    lead.email,
                    lead.phone,
                    lead.campaign_source,
                    lead.ad_name,
                    JSON.stringify(lead.raw_data),
                    formName,
                    formStatus,
                    lead.lead_id
                ]
            );
            return 'updated';
        } else {
            await db.query(
                `INSERT INTO meta_leads 
                (lead_name, email, phone, campaign_source, form_id, form_name, form_status, lead_id, ad_id, ad_name, page_id, status, raw_data, created_date) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'new', $12, $13)`,
                [
                    lead.lead_name,
                    lead.email,
                    lead.phone,
                    lead.campaign_source,
                    lead.form_id,
                    formName,
                    formStatus,
                    lead.lead_id,
                    lead.ad_id,
                    lead.ad_name,
                    pageId,
                    JSON.stringify(lead.raw_data),
                    lead.created_date ? new Date(lead.created_date) : new Date()
                ]
            );
            return 'new';
        }
    } catch (err) {
        console.error(`Error saving lead ${lead.lead_id}:`, err.message);
        return 'error';
    }
}

/**
 * Get a single meta lead by ID
 */
exports.getMetaLeadById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `SELECT id, lead_name, email, phone, campaign_source, form_id, lead_id, 
              ad_id, ad_name, page_id, status, notes, raw_data, created_date, updated_at 
       FROM meta_leads 
       WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Meta lead not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching meta lead:", err);
        res.status(500).json({
            error: "Failed to fetch meta lead",
            details: err.message
        });
    }
};

/**
 * Create a new meta lead (manual entry)
 */
exports.createMetaLead = async (req, res) => {
    try {
        const {
            lead_name,
            email,
            phone,
            campaign_source,
            form_id,
            lead_id,
            ad_id,
            ad_name,
            page_id,
            status = 'new',
            notes,
            created_date
        } = req.body;

        const result = await db.query(
            `INSERT INTO meta_leads 
        (lead_name, email, phone, campaign_source, form_id, lead_id, ad_id, ad_name, page_id, status, notes, created_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING *`,
            [lead_name, email, phone, campaign_source, form_id, lead_id, ad_id, ad_name, page_id, status, notes, created_date || new Date()]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error creating meta lead:", err);
        res.status(500).json({
            error: "Failed to create meta lead",
            details: err.message
        });
    }
};

/**
 * Update a meta lead
 */
exports.updateMetaLead = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            lead_name,
            email,
            phone,
            campaign_source,
            status,
            notes,
            created_date
        } = req.body;

        const result = await db.query(
            `UPDATE meta_leads 
       SET lead_name = COALESCE($1, lead_name), 
           email = COALESCE($2, email), 
           phone = COALESCE($3, phone), 
           campaign_source = COALESCE($4, campaign_source), 
           status = COALESCE($5, status), 
           notes = COALESCE($6, notes), 
           created_date = COALESCE($7, created_date), 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $8 
       RETURNING *`,
            [lead_name, email, phone, campaign_source, status, notes, created_date, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Meta lead not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating meta lead:", err);
        res.status(500).json({
            error: "Failed to update meta lead",
            details: err.message
        });
    }
};

/**
 * Update only the status of a meta lead (for drag and drop)
 */
exports.updateMetaLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: "Status is required" });
        }

        const result = await db.query(
            `UPDATE meta_leads 
             SET status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 
             RETURNING *`,
            [status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Meta lead not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating meta lead status:", err);
        res.status(500).json({ error: "Failed to update meta lead status" });
    }
};

/**
 * Convert a meta lead into a real lead in the leads table
 */
exports.convertMetaLead = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get Meta Lead details
        const metaLeadRes = await db.query("SELECT * FROM meta_leads WHERE id = $1", [id]);
        if (metaLeadRes.rows.length === 0) {
            return res.status(404).json({ error: "Meta lead not found" });
        }
        const metaLead = metaLeadRes.rows[0];

        // 2. Resolve Fallback IDs (Required for the leads table)
        // a) Source ID (Try to find 'Meta Ad' or similar)
        const sourceRes = await db.query("SELECT id FROM sources WHERE name ILIKE '%meta%' OR name ILIKE '%facebook%' LIMIT 1");
        const source_id = sourceRes.rows[0]?.id || 1;

        // b) Business Unit ID
        const unitRes = await db.query("SELECT unit_id FROM unit LIMIT 1");
        const unit_id = unitRes.rows[0]?.unit_id || 1;

        // c) Card Type ID (Try to find 'Both' or first available)
        const cardRes = await db.query("SELECT card_type_id FROM card_type WHERE card_type_name ILIKE '%both%' LIMIT 1");
        const card_type_id = cardRes.rows[0]?.card_type_id || (await db.query("SELECT card_type_id FROM card_type LIMIT 1")).rows[0]?.card_type_id || 1;

        // d) Course ID (Try matching name or first available with a course_type)
        const courseRes = await db.query("SELECT course_id FROM course WHERE (course_name ILIKE $1 OR course_name ILIKE $2) AND course_type IS NOT NULL AND course_type != '' LIMIT 1", [
            `%${metaLead.campaign_source}%`,
            '%unknown%'
        ]);
        const course_id = courseRes.rows[0]?.course_id || (await db.query("SELECT course_id FROM course WHERE course_type IS NOT NULL AND course_type != '' LIMIT 1")).rows[0]?.course_id || (await db.query("SELECT course_id FROM course LIMIT 1")).rows[0]?.course_id || 1;

        // e) Meta Campaign ID (Try matching campaign name)
        let meta_campaign_id = null;
        if (metaLead.campaign_source) {
            const campaignRes = await db.query("SELECT id FROM meta_campaigns WHERE campaign_name ILIKE $1 LIMIT 1", [`%${metaLead.campaign_source}%`]);
            meta_campaign_id = campaignRes.rows[0]?.id;
        }
        // Fallback to first available campaign if still null (to pass frontend validation)
        if (!meta_campaign_id) {
            const fallbackCampaign = await db.query("SELECT id FROM meta_campaigns LIMIT 1");
            meta_campaign_id = fallbackCampaign.rows[0]?.id || 1;
        }

        // f) Default User ID (Assign to first available admin/consultant)
        const userRes = await db.query("SELECT user_id FROM users LIMIT 1");
        const user_id = userRes.rows[0]?.user_id || 1;

        // 3. Insert into the main leads table
        // Map available info. Fields like course/unit/card_type are mandatory in DB, 
        // so we use the resolved fallbacks from previous steps.
        const insertQuery = `
            INSERT INTO leads (
                name, mobile_number, email, 
                source_id, status, unit_id, 
                card_type_id, course_id, meta_campaign_id, 
                user_id, course_structure,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
            RETURNING *
        `;

        const newLeadRes = await db.query(insertQuery, [
            metaLead.lead_name,
            metaLead.phone,
            metaLead.email,
            source_id,
            metaLead.status === 'new' ? 'enquiry' : metaLead.status,
            unit_id,
            card_type_id,
            course_id,
            meta_campaign_id,
            user_id,
            'single'
        ]);

        // 4. Update the Meta Lead status so it's marked as converted
        await db.query("UPDATE meta_leads SET status = 'converted' WHERE id = $1", [id]);

        res.json({
            success: true,
            message: "Lead converted successfully",
            lead: newLeadRes.rows[0],
            lead_id: newLeadRes.rows[0].lead_id
        });
    } catch (err) {
        console.error("Error converting meta lead:", err);
        res.status(500).json({ error: "Failed to convert lead", details: err.message });
    }
};

/**
 * Delete a meta lead
 */
exports.deleteMetaLead = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            "DELETE FROM meta_leads WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Meta lead not found" });
        }

        res.json({ message: "Meta lead deleted successfully" });
    } catch (err) {
        console.error("Error deleting meta lead:", err);
        res.status(500).json({
            error: "Failed to delete meta lead",
            details: err.message
        });
    }
};

/**
 * Handle Facebook webhook verification (GET request)
 * Facebook sends a GET request to verify the webhook URL
 */
exports.handleWebhookVerification = (req, res) => {
    // Force no-cache to avoid 304 errors
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = process.env.FB_WEBHOOK_VERIFY_TOKEN;

    // Detect if this is just a manual browser visit
    if (!mode && !token) {
        console.log('--- Manual Browser Visit Detected ---');
        return res.send("<h1>Webhook is Active</h1><p>Waiting for Facebook verification request...</p>");
    }

    console.log('========================================');
    console.log('🔔 FACEBOOK WEBHOOK VERIFICATION REQUEST');
    console.log('========================================');
    console.log('Mode:', mode);
    console.log('Token received:', token);
    console.log('Token expected:', verifyToken);
    console.log('Token match:', token === verifyToken);

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('✅ Facebook webhook VERIFIED successfully!');
        console.log('========================================');
        res.status(200).send(challenge);
    } else {
        console.log('❌ Facebook webhook verification FAILED');
        console.log('========================================');
        res.status(403).send('Verification failed');
    }
};

/**
 * Handle Facebook webhook events (POST request)
 * Facebook sends lead events here when someone submits a lead form
 */
exports.handleWebhookEvent = async (req, res) => {
    console.log('========================================');
    console.log('📥 FACEBOOK WEBHOOK EVENT RECEIVED');
    console.log('========================================');
    console.log('Time:', new Date().toISOString());
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    try {
        // Verify the webhook signature (optional but recommended for security)
        const isValid = facebookLeadsService.verifyWebhookSignature(req);
        console.log('Signature valid:', isValid);

        if (!isValid && process.env.FB_APP_SECRET) {
            console.warn('⚠️ Invalid webhook signature, but processing anyway');
        }

        const body = req.body;
        console.log('📦 RAW DATA FROM FACEBOOK:', JSON.stringify(body, null, 2));

        // Check if this is a page event
        if (body.object !== 'page') {
            console.log('❌ Not a page event, object type:', body.object);
            return res.status(400).send('Not a page event');
        }

        console.log('✅ This is a page event');
        console.log('Number of entries:', body.entry?.length || 0);

        // Process each entry
        for (const entry of body.entry || []) {
            const pageId = entry.id;
            console.log('Processing entry for page:', pageId);
            console.log('Number of changes:', entry.changes?.length || 0);

            // Process each change (lead event)
            for (const change of entry.changes || []) {
                console.log('Change field:', change.field);
                console.log('Change value:', JSON.stringify(change.value, null, 2));

                if (change.field === 'leadgen') {
                    const leadgenId = change.value.leadgen_id;
                    const formId = change.value.form_id;
                    const adId = change.value.ad_id;
                    const createdTime = change.value.created_time;

                    try {
                        // Fetch full lead details from Facebook
                        const leadDetails = await facebookLeadsService.getLeadDetails(leadgenId, pageId);

                        // Fetch form details to get the name
                        const formDetails = await facebookLeadsService.getFormFields(formId, pageId);
                        const formName = formDetails.name || 'Facebook Form';

                        // Use the helper to save/update centralized logic
                        const result = await saveOrUpdateLead({
                            ...leadDetails,
                            lead_id: leadgenId,
                            form_id: formId,
                            ad_id: adId,
                            created_time: createdTime ? new Date(createdTime * 1000) : new Date()
                        }, pageId, formName, 'ACTIVE');

                        console.log(`✅ Lead ${result} successfully!: ${leadDetails.lead_name}`);
                    } catch (saveErr) {
                        console.error('❌ Error saving webhook lead:', saveErr.message);
                    }
                }
            }
        }

        // Always respond with 200 OK to acknowledge receipt
        console.log('✅ Webhook processed successfully, sending EVENT_RECEIVED');
        console.log('========================================');
        res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
        console.error('❌ Error processing webhook event:', err);
        // Still respond with 200 to prevent Facebook from retrying
        res.status(200).send('EVENT_RECEIVED');
    }
};

/**
 * Sync a single lead from Facebook (manual sync)
 */
exports.syncLeadFromFacebook = async (req, res) => {
    try {
        const { leadId } = req.params;

        // Fetch lead details from Facebook
        const leadDetails = await facebookLeadsService.getLeadDetails(leadId);

        // Check if lead already exists
        const existing = await db.query(
            'SELECT id FROM meta_leads WHERE lead_id = $1',
            [leadId]
        );

        if (existing.rows.length > 0) {
            // Update existing lead
            const result = await db.query(
                `UPDATE meta_leads 
         SET lead_name = $1, email = $2, phone = $3, campaign_source = $4, 
             ad_name = $5, raw_data = $6, updated_at = CURRENT_TIMESTAMP 
         WHERE lead_id = $7 
         RETURNING *`,
                [
                    leadDetails.lead_name,
                    leadDetails.email,
                    leadDetails.phone,
                    leadDetails.campaign_source,
                    leadDetails.ad_name,
                    JSON.stringify(leadDetails.raw_data),
                    leadId
                ]
            );
            return res.json({ message: 'Lead updated', lead: result.rows[0] });
        }

        // Insert new lead
        const result = await db.query(
            `INSERT INTO meta_leads 
        (lead_name, email, phone, campaign_source, form_id, lead_id, ad_id, ad_name, status, raw_data, created_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new', $9, $10) 
       RETURNING *`,
            [
                leadDetails.lead_name,
                leadDetails.email,
                leadDetails.phone,
                leadDetails.campaign_source,
                leadDetails.form_id,
                leadId,
                leadDetails.ad_id,
                leadDetails.ad_name,
                JSON.stringify(leadDetails.raw_data),
                leadDetails.created_date || new Date()
            ]
        );

        res.status(201).json({ message: 'Lead synced', lead: result.rows[0] });
    } catch (err) {
        console.error('Error syncing lead from Facebook:', err);
        res.status(500).json({
            error: 'Failed to sync lead from Facebook',
            details: err.message
        });
    }
};
