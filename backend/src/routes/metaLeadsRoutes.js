/**
 * Meta Leads Routes
 * API endpoints for Meta Lead Ads integration
 */

const express = require("express");
const router = express.Router();
const metaLeadsController = require("../controllers/meta/metaLeadsController");
const { authenticateToken, authorizeRoles } = require("../middlewares/authMiddleware");

/** Admin (1), Consultant (3), Support/Digital Marketing (5) — matches Frontend Sidebar ROLE_PERMISSIONS */
const META_LEADS_ALLOWED_ROLES = [1, 3, 5];

// Facebook Webhook endpoints (no auth required - Facebook needs to access these)
// GET - Webhook verification
router.get("/webhook", metaLeadsController.handleWebhookVerification);
// POST - Receive lead events
router.post("/webhook", metaLeadsController.handleWebhookEvent);

// Operational routes: authenticated users with roles allowed to use Meta Leads in the app (not admin-only).
router.use(authenticateToken, authorizeRoles(...META_LEADS_ALLOWED_ROLES));

// CRUD routes for meta leads
router.get("/", metaLeadsController.getAllMetaLeads);
router.get("/forms-summary", metaLeadsController.getFormsSummary);
router.get("/:id", metaLeadsController.getMetaLeadById);
router.put("/:id", metaLeadsController.updateMetaLead);
router.patch("/status/:id", metaLeadsController.updateMetaLeadStatus);
router.post("/convert/:id", metaLeadsController.convertMetaLead);
router.delete("/:id", metaLeadsController.deleteMetaLead);

// Manual sync from Facebook
router.post("/sync-all", metaLeadsController.syncAllLeads);
router.post("/sync/:leadId", metaLeadsController.syncLeadFromFacebook);

module.exports = router;
