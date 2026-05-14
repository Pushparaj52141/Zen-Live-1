/**
 * Facebook Leads Service
 * Handles communication with Facebook Graph API for Lead Ads
 */

const crypto = require('crypto');

// Facebook Graph API base URL
const FB_GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Get a Page Access Token using the System User Token
 * This ensures we have the correct context for Lead Ads APIs
 * @param {string} pageId - The Facebook page ID
 */
async function getPageAccessToken(pageId) {
    const systemToken = process.env.META_SYSTEM_USER_TOKEN;
    if (!systemToken) throw new Error('META_SYSTEM_USER_TOKEN is not configured');

    try {
        const response = await fetch(`${FB_GRAPH_API_URL}/${pageId}?fields=access_token&access_token=${systemToken}`);
        const data = await response.json();

        if (!response.ok || !data.access_token) {
            console.error('❌ Failed to upgrade token for Page:', pageId, data.error);
            // Fallback to the env variable if provided, but prioritize the dynamic one
            return process.env.FB_PAGE_ACCESS_TOKEN || systemToken;
        }

        return data.access_token;
    } catch (err) {
        console.warn('⚠️ Token upgrade failed, falling back:', err.message);
        return process.env.FB_PAGE_ACCESS_TOKEN || systemToken;
    }
}

/**
 * @param {string} leadId - The Facebook lead ID
 */
async function getLeadDetails(leadId, pageId) {
    const accessToken = await getPageAccessToken(pageId || 'me');

    try {
        const fields = 'id,created_time,full_name,email,phone_number,platform,is_organic,field_data,form_id,campaign_id,campaign_name,ad_id,ad_name,adset_id,adset_name';
        const response = await fetch(
            `${FB_GRAPH_API_URL}/${leadId}?access_token=${accessToken}&fields=${fields}`
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to fetch lead from Facebook');
        }

        let leadData = await response.json();

        // Enrichment: If campaign_name is missing but campaign_id exists, fetch it
        if (!leadData.campaign_name && leadData.campaign_id) {
            try {
                const campRes = await fetch(`${FB_GRAPH_API_URL}/${leadData.campaign_id}?fields=name&access_token=${accessToken}`);
                const campData = await campRes.json();
                if (campData.name) leadData.campaign_name = campData.name;
            } catch (e) { console.warn('Failed to enrich campaign name:', e.message); }
        }

        // Enrichment: If ad_name is missing but ad_id exists
        if (!leadData.ad_name && leadData.ad_id) {
            try {
                const adRes = await fetch(`${FB_GRAPH_API_URL}/${leadData.ad_id}?fields=name&access_token=${accessToken}`);
                const adData = await adRes.json();
                if (adData.name) leadData.ad_name = adData.name;
            } catch (e) { console.warn('Failed to enrich ad name:', e.message); }
        }

        console.log(`[DEBUG] Enriched Lead Data for ${leadId}:`, JSON.stringify(leadData));
        return parseLeadData(leadData);
    } catch (error) {
        console.error('Error fetching lead from Facebook:', error);
        throw error;
    }
}

/**
 * Parse Facebook lead data into a normalized format
 * Handles both Form leads and Messaging leads
 * @param {Object} leadData - Raw lead data from Facebook
 * @returns {Object} Normalized lead data
 */
function parseLeadData(leadData) {
    const fieldData = leadData.field_data || [];

    // Convert field_data array to object for easier access
    const fields = {};
    fieldData.forEach(field => {
        fields[field.name.toLowerCase()] = field.values?.[0] || '';
    });

    // Detect channel (Messenger, Instagram, or Facebook)
    let channel = 'Facebook Lead Ad';
    if (leadData.platform === 'ig') channel = 'Instagram';
    if (leadData.platform === 'messenger') channel = 'Messenger';

    // For Messenger leads, the name is often in 'full_name' or 'name' directly in the root
    let name = fields.full_name || fields.name || leadData.full_name || leadData.name;

    // If name is still empty (test leads), use a placeholder
    if (!name || name === 'undefined undefined') {
        name = `${fields.first_name || ''} ${fields.last_name || ''}`.trim() || 'Potential Lead';
    }

    // Priority: Campaign Name > Ad Name > Form ID > Platform
    const campaignSource = leadData.campaign_name ||
        leadData.ad?.campaign?.name ||
        leadData.ad?.name ||
        leadData.form_id ||
        channel;

    return {
        lead_id: leadData.id,
        form_id: leadData.form_id || 'N/A',
        ad_id: leadData.ad?.id || leadData.ad_id || 'N/A',
        ad_name: leadData.ad?.name || leadData.ad_name || 'N/A',
        campaign_source: campaignSource,
        lead_name: name,
        email: fields.email || leadData.email || '',
        phone: fields.phone_number || fields.phone || leadData.phone_number || '',
        created_date: leadData.created_time,
        raw_data: leadData
    };
}

/**
 * Get leads from Messenger and Instagram (Conversations)
 * These leads aren't in forms, they are in the Messaging list
 */
async function getPageMessagingLeads(pageId) {
    const accessToken = await getPageAccessToken(pageId);

    try {
        const fields = 'id,created_time,full_name,email,phone_number,platform,is_organic,form_id,campaign_id,campaign_name,ad_id,ad_name';
        const response = await fetch(
            `${FB_GRAPH_API_URL}/${pageId}/leads?access_token=${accessToken}&fields=${fields}`
        );

        if (!response.ok) return [];

        const data = await response.json();
        return (data.data || []).map(lead => parseLeadData(lead));
    } catch (err) {
        return [];
    }
}

/**
 * Get form fields for a lead form
 * @param {string} formId - The Facebook form ID
 * @returns {Promise<Object>} Form fields
 */
async function getFormFields(formId, pageId) {
    const accessToken = await getPageAccessToken(pageId || 'me');

    try {
        const response = await fetch(
            `${FB_GRAPH_API_URL}/${formId}?fields=name,questions&access_token=${accessToken}`
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to fetch form from Facebook');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching form from Facebook:', error);
        throw error;
    }
}

/**
 * Verify the webhook signature from Facebook
 * @param {Object} req - Express request object
 * @returns {boolean} Whether the signature is valid
 */
function verifyWebhookSignature(req) {
    const signature = req.headers['x-hub-signature-256'];
    const appSecret = process.env.FB_APP_SECRET;

    if (!signature || !appSecret) {
        console.warn('Missing in our application only we use access token but we need integrate refresh token ...access token had expired 15mins refresh will expire in 7days..after access token expired automatically refresh token works signature or app secret for webhook verification');
        return false;
    }

    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

/**
 * Get all lead forms for a page
 * @param {string} pageId - The Facebook page ID
 * @returns {Promise<Array>} List of forms
 */
async function getPageForms(pageId) {
    const accessToken = await getPageAccessToken(pageId);

    try {
        console.log(`📡 Fetching forms for Page ID: ${pageId}...`);
        const tokenPreview = accessToken ? `${accessToken.substring(0, 10)}...[len: ${accessToken.length}]` : 'NULL';
        console.log(`🔑 Using Token: ${tokenPreview}`);
        // We include ARCHIVED forms just in case leads are sitting in old forms
        const response = await fetch(`${FB_GRAPH_API_URL}/${pageId}/leadgen_forms?access_token=${accessToken}&fields=name,id,status&filtering=[{"field":"status","operator":"IN","value":["ACTIVE","ARCHIVED"]}]`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to fetch forms from Facebook');
        }

        const data = await response.json();
        const forms = data.data || [];

        console.log(`📋 API returned ${forms.length} forms:`);
        forms.forEach(f => console.log(`   - [${f.status}] ${f.name} (ID: ${f.id})`));

        return forms;
    } catch (error) {
        console.error('Error fetching forms:', error);
        throw error;
    }
}

/**
 * Get all leads for a specific form
 * @param {string} formId - The Facebook form ID
 * @returns {Promise<Array>} List of leads
 */
async function getLeadsByForm(formId, pageId) {
    const accessToken = await getPageAccessToken(pageId);

    try {
        let allLeads = [];
        // Added date_preset=maximum to reach back as far as Facebook allows (90 days)
        const fields = 'id,created_time,full_name,email,phone_number,platform,is_organic,field_data,campaign_id,campaign_name,ad_id,ad_name';
        let nextUrl = `${FB_GRAPH_API_URL}/${formId}/leads?access_token=${accessToken}&limit=100&date_preset=maximum&fields=${fields}`;

        while (nextUrl) {
            const response = await fetch(nextUrl);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Failed to fetch leads from Facebook');
            }
            const data = await response.json();
            const leads = data.data || [];

            if (leads.length > 0) {
                console.log(`[DEBUG] First Lead from Form ${formId}:`, JSON.stringify(leads[0]));
            }

            allLeads = [...allLeads, ...leads];
            nextUrl = data.paging?.next || null;
        }

        if (allLeads.length > 0) {
            console.log(`      📥 Form ${formId} returned ${allLeads.length} leads (Total history checked)`);
        }
        return allLeads.map(lead => parseLeadData(lead));
    } catch (error) {
        console.error('Error fetching leads by form:', error);
        throw error;
    }
}

/**
 * Subscribe page to leadgen webhook
 * @param {string} pageId - Facebook page ID
 * @returns {Promise<Object>} Subscription result
 */
async function subscribePageToLeadgen(pageId) {
    const accessToken = await getPageAccessToken(pageId);

    try {
        const response = await fetch(
            `${FB_GRAPH_API_URL}/${pageId}/subscribed_apps?subscribed_fields=leadgen&access_token=${accessToken}`,
            { method: 'POST' }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to subscribe page to leadgen');
        }

        return await response.json();
    } catch (error) {
        console.error('Error subscribing page to leadgen:', error);
        throw error;
    }
}

module.exports = {
    getLeadDetails,
    getFormFields,
    getPageForms,
    getLeadsByForm,
    getPageMessagingLeads,
    verifyWebhookSignature,
    parseLeadData,
    subscribePageToLeadgen
};
