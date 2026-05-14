const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware");
const { authenticateToken } = require("../middlewares/authMiddleware");
const bulkUploadController = require("../controllers/bulk/bulkUploadController");

// Download Sample CSV Route
router.get(
  "/sample-csv",
  authenticateToken,
  bulkUploadController.downloadSampleCsv
);

//Bulk Lead Upload Route
router.post(
  "/",
  authenticateToken,
  upload.single("file"),
  bulkUploadController.bulkUploadLeads
);

module.exports = router;
