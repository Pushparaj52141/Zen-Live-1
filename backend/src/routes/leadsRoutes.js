// Import necessary modules
const express = require("express");
const router = express.Router();
const multer = require("multer");
const apiKeyMiddleware = require("../middlewares/apikey");

// Import controllers for lead-related operations
const {
  leadController,
  archiveController,
  onHoldController,
  batchController,
  cardTypesController,
  unitController,
  sourceController,
  roleController,
  paymentsController,
  placementPaymentsController,
} = require("../controllers/leads");

// Import middleware for authentication (protects routes from unauthorized access)
const { authenticateToken } = require("../middlewares/authMiddleware");

// Configure Multer for file uploads, storing files in the "uploads/" directory
const upload = multer({ dest: "uploads/" });

/* ====================================================================================
   LEAD MANAGEMENT ROUTES
   ==================================================================================== */

// GET: All trainer shares for a lead
router.get(
  "/:lead_id/trainer-shares",
  authenticateToken,
  paymentsController.getTrainerSharesForLead
);
// GET: All installments for a lead
router.get(
  "/:lead_id/installments",
  authenticateToken,
  paymentsController.getInstallmentsForLead
);

// POST: Add a new lead
// This route accepts lead details (e.g., name, contact info, course) and creates a new lead in the database
router.post("/", authenticateToken, leadController.addLead);

// GET: Fetch all leads with optional filters
// This route retrieves leads, optionally filtered by course, status, trainer, etc.
router.get("/", authenticateToken, leadController.getLeads);

// GET: Check duplicate lead by name + mobile_number
router.get(
  "/check-duplicate",
  authenticateToken,
  leadController.checkLeadDuplicate
);

// PUT: Update an existing lead by ID
// This route updates the details of an existing lead using their unique lead ID
router.put("/:id", authenticateToken, leadController.updateLead);

// DELETE: Delete a lead by ID
// This route removes a lead from the system (logical deletion or archival, depending on implementation)
router.delete("/:id", authenticateToken, leadController.deleteLead);

//Drag and Drop Updating only status
router.patch("/status/:id", authenticateToken, leadController.updateStatusLead);

// New API: Get all leads with status = 'trainingprogress'
router.get(
  "/trainingprogress",
  apiKeyMiddleware,
  leadController.getTrainingProgressLeads
);

// POST: Generate and send certificate for a lead
router.post(
  "/:lead_id/generate-certificate",
  authenticateToken,
  async (req, res) => {
    try {
      const { lead_id } = req.params;
      const { generateAndSaveCertificate } = require("../services/certificateService");
      const { sendCertificateEmail } = require("../services/emailservice");

      // Generate certificate
      const certificateData = await generateAndSaveCertificate(lead_id);

      // Send via email
      await sendCertificateEmail(certificateData);

      res.status(200).json({
        success: true,
        message: "Certificate generated and sent successfully",
        data: {
          name: certificateData.name,
          email: certificateData.email,
          enrollmentId: certificateData.enrollmentId,
          certificatePath: certificateData.certificatePath
        }
      });
    } catch (error) {
      console.error("Error generating certificate:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate certificate"
      });
    }
  }
);

// GET: Download certificate for a lead
router.get(
  "/:lead_id/download-certificate",
  authenticateToken,
  async (req, res) => {
    try {
      const { lead_id } = req.params;
      const pool = require("../config/db");
      const path = require("path");
      const fs = require("fs").promises;

      // Get the most recent certificate for this lead
      let query = `
        SELECT certificate_path, file_name, student_name, enrollment_id
        FROM certificates
        WHERE lead_id = $1
        ORDER BY generated_at DESC
        LIMIT 1
      `;

      let result = await pool.query(query, [lead_id]);
      let certificate = null;
      let filePath = null;

      // If no certificate exists, generate one first
      if (result.rows.length === 0) {
        console.log(`No certificate found for lead ${lead_id}, generating now...`);
        const { generateAndSaveCertificate } = require("../services/certificateService");

        try {
          const certificateData = await generateAndSaveCertificate(lead_id);

          // Query again after generation
          result = await pool.query(query, [lead_id]);

          if (result.rows.length === 0) {
            return res.status(500).json({
              success: false,
              error: "Failed to generate certificate"
            });
          }

          certificate = result.rows[0];
          filePath = certificate.certificate_path;
        } catch (genError) {
          console.error("Error generating certificate for download:", genError);
          return res.status(500).json({
            success: false,
            error: `Certificate generation failed: ${genError.message}`
          });
        }
      } else {
        certificate = result.rows[0];
        filePath = certificate.certificate_path;
      }

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (err) {
        console.error("Certificate file not found:", filePath);
        return res.status(404).json({
          success: false,
          error: "Certificate file not found on server. Please try generating again."
        });
      }

      // Set headers for download
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${certificate.file_name}"`);

      // Send file
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      console.error("Error downloading certificate:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to download certificate"
      });
    }
  }
);


// GET: Certificate statistics (processed today count, etc.)
router.get(
  "/certificate-stats",
  authenticateToken,
  async (req, res) => {
    try {
      const pool = require("../config/db");

      // Get count of certificates processed today
      const todayQuery = `
        SELECT COUNT(*) as count
        FROM certificates
        WHERE DATE(generated_at) = CURRENT_DATE
      `;

      const todayResult = await pool.query(todayQuery);
      const processedToday = parseInt(todayResult.rows[0]?.count || 0);

      // Get total certificates count
      const totalQuery = `SELECT COUNT(*) as count FROM certificates`;
      const totalResult = await pool.query(totalQuery);
      const totalCertificates = parseInt(totalResult.rows[0]?.count || 0);

      res.status(200).json({
        success: true,
        data: {
          processedToday,
          totalCertificates
        }
      });
    } catch (error) {
      console.error("Error fetching certificate stats:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch certificate statistics"
      });
    }
  }
);



/* ====================================================================================
   ARCHIVE AND RESTORE ROUTES
   ==================================================================================== */

// POST: Not applicable for archiving leads

// GET: Retrieve all archived leads
// This route fetches leads that have been marked as archived
router.get("/archived", authenticateToken, archiveController.getArchivedLeads);

// PUT: Archive a lead by ID
// This route updates a lead's status to "Archived" using their unique lead ID
router.put("/archive/:id", authenticateToken, archiveController.archiveLead);

// PUT: Restore an archived lead by ID
// This route changes the status of an archived lead back to "Active" or a specified status
router.put("/restore/:id", authenticateToken, archiveController.restoreLead);

// DELETE: Not applicable for archiving leads

/* ====================================================================================
   ON-HOLD LEAD MANAGEMENT ROUTES
   ==================================================================================== */

// Fetch on-hold leads
router.get("/onhold", authenticateToken, onHoldController.getOnHoldLeads);

// PUT: Move a lead to on-hold status by ID
router.put("/onhold/:id", authenticateToken, onHoldController.moveToOnHold);

// PUT: Restore a lead from on-hold status by ID
router.put(
  "/restore-onhold/:id",
  authenticateToken,
  onHoldController.restoreFromOnHold
);

/* ====================================================================================
   BATCH MANAGEMENT ROUTES
   ==================================================================================== */

// ========== BATCH MANAGEMENT ROUTES ==========
router.get("/batches", authenticateToken, batchController.getBatches);
router.post("/batches", authenticateToken, batchController.createBatch);
router.put(
  "/batches/:batch_id",
  authenticateToken,
  batchController.updateBatch
);
router.delete(
  "/batches/:batch_id",
  authenticateToken,
  batchController.deleteBatch
);
router.get(
  "/batches/distinct",
  authenticateToken,
  batchController.getDistinctBatches
);

//Batch_trainers

router.post(
  "/batch/:batch_id/trainers",
  authenticateToken,
  batchController.addOrUpdateBatchTrainer
);
router.put(
  "/batch/:batch_id/trainers",
  authenticateToken,
  batchController.updateAllBatchTrainers
);
router.delete(
  "/batch/:batch_id/trainers/:trainer_id",
  authenticateToken,
  batchController.removeBatchTrainer
);
router.get(
  "/batch/:batch_id/trainers",
  authenticateToken,
  batchController.getBatchTrainers
);
router.get(
  "/trainer/:trainer_id/batches",
  authenticateToken,
  batchController.getTrainerBatches
);
// Get students (leads) in a batch
router.get(
  "/batches/:batch_id/leads",
  authenticateToken,
  batchController.getBatchLeads
);

//installments


// GET: Payment info for a lead
router.get(
  "/:lead_id/payment-info",
  authenticateToken,
  paymentsController.getPaymentInfo
);

// Placement payments
router.get(
  "/:lead_id/placement-payments",
  authenticateToken,
  placementPaymentsController.getPlacementPaymentInfo
);
router.post(
  "/:lead_id/placement-payments",
  authenticateToken,
  placementPaymentsController.recordPlacementPayment
);
router.put(
  "/placement-payments/:placement_installment_id",
  authenticateToken,
  placementPaymentsController.updatePlacementPayment
);
router.delete(
  "/placement-payments/:placement_installment_id",
  authenticateToken,
  placementPaymentsController.deletePlacementPayment
);

// GET: Lead details by lead_id (must be after more specific routes)
// Restrict to numeric lead_id only to avoid conflict with services, leads/sources, etc.
router.get(
  "/:lead_id(\\d+)",
  authenticateToken,
  leadController.getLeadById
);

// POST: Record installment and split shares
router.post(
  "/:lead_id/installments",
  authenticateToken,
  paymentsController.recordInstallmentAndSplitShares
);
router.put(
  "/installments/:installment_id",
  authenticateToken,
  paymentsController.updateInstallment
);
router.delete(
  "/installments/:installment_id",
  authenticateToken,
  paymentsController.deleteInstallment
);

// GET: All installments across all leads
router.get(
  "/all-installments",
  authenticateToken,
  paymentsController.getAllInstallments
);

// GET: All placement installments (for dashboards / payment insights)
router.get(
  "/all-placement-installments",
  authenticateToken,
  placementPaymentsController.getAllPlacementInstallments
);

/* ====================================================================================
   Unit and CardType Feilds
   ==================================================================================== */
router.get("/units", authenticateToken, unitController.getUnits);
router.get("/card-types", authenticateToken, cardTypesController.getCardTypes);

/* ======= Role Management ======== */

// GET
router.get("/roles", authenticateToken, roleController.getRoles);

// POST
router.post("/roles", authenticateToken, roleController.createRole);

// PUT
router.put("/roles/:id", authenticateToken, roleController.updateRole);

// DELETE
router.delete("/roles/:id", authenticateToken, roleController.deleteRole);

/* ======= Source Management ======== */

// GET
router.get("/sources", authenticateToken, sourceController.getSources);

// POST
router.post("/sources", authenticateToken, sourceController.createSource);

// PUT
router.put("/sources/:id", authenticateToken, sourceController.updateSource);

// DELETE
router.delete("/sources/:id", authenticateToken, sourceController.deleteSource);

/* ====================================================================================
   Progz API Endpoints 
   ==================================================================================== */
router.get(
  "/progztrainingprogress",
  apiKeyMiddleware,
  leadController.getTrainingProgressLeads
);

// POST: External Enrollment from Website
const externalLeadController = require("../controllers/leads/externalLeadController");
router.post(
  "/external-enrollment",
  apiKeyMiddleware,
  externalLeadController.handleExternalEnrollment
);

router.get("/batches/progz", apiKeyMiddleware, batchController.getBatches);


/* ====================================================================================
   EXPORT ROUTER
   ==================================================================================== */



module.exports = router;
