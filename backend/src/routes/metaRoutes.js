// Meta Campaign Routes
const express = require("express");
const router = express.Router();
const metaCampaignController = require("../controllers/meta/metaCampaignController");
const { authenticateToken, authorizeRoles } = require("../middlewares/authMiddleware");

/** Admin (1), Consultant (3), Support/Digital Marketing (5) — matches Frontend Sidebar */
const META_CAMPAIGN_ALLOWED_ROLES = [1, 3, 5];

router.use(authenticateToken, authorizeRoles(...META_CAMPAIGN_ALLOWED_ROLES));

// CRUD routes
router.get("/", metaCampaignController.getAllMetaCampaigns);
router.get("/:id", metaCampaignController.getMetaCampaignById);
router.post("/", metaCampaignController.createMetaCampaign);
router.put("/:id", metaCampaignController.updateMetaCampaign);
router.delete("/:id", metaCampaignController.deleteMetaCampaign);

module.exports = router;
