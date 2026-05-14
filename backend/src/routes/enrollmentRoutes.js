const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const enrollmentController = require('../controllers/enrollment/enrollmentController');
const upload = require('../middlewares/uploadMiddleware');

// ==================== PUBLIC ROUTES ====================

/**
 * POST /api/enrollment/student
 * Submit student enrollment request (public) — status set to 'submitted'
 */
router.post('/student', upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'aadhar_card', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
]), enrollmentController.submitStudentEnrollment);

/**
 * POST /api/enrollment/trainer
 * Submit trainer enrollment request (public) — status set to 'submitted'
 */
router.post('/trainer', upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'aadhar_card', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
]), enrollmentController.submitTrainerEnrollment);

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/enrollment/students
 * Get all student enrollments (admin only)
 * Query: ?status=submitted|accepted|approved|rejected
 */
router.get('/students', authenticateToken, enrollmentController.getStudentEnrollments);

/**
 * GET /api/enrollment/trainers
 * Get all trainer enrollments (admin only)
 * Query: ?status=submitted|accepted|approved|rejected
 */
router.get('/trainers', authenticateToken, enrollmentController.getTrainerEnrollments);

// ── Student workflow ─────────────────────────────────────────────────────────

/**
 * POST /api/enrollment/students/:id/accept
 * Stage 1 action: submitted → accepted
 * Sends screening-passed email
 */
router.post('/students/:id/accept', authenticateToken, enrollmentController.acceptStudentEnrollment);

/**
 * POST /api/enrollment/students/:id/approve
 * Stage 2 action: accepted → approved
 * Creates CRM lead + sends approval email
 */
router.post('/students/:id/approve', authenticateToken, enrollmentController.approveStudentEnrollment);

/**
 * POST /api/enrollment/students/:id/reject
 * Can reject from submitted or accepted stage → rejected (final)
 * Sends rejection email
 */
router.post('/students/:id/reject', authenticateToken, enrollmentController.rejectStudentEnrollment);

// ── Trainer workflow ─────────────────────────────────────────────────────────

/**
 * POST /api/enrollment/trainers/:id/accept
 * Stage 1 action: submitted → accepted
 * Sends screening-passed email
 */
router.post('/trainers/:id/accept', authenticateToken, enrollmentController.acceptTrainerEnrollment);

/**
 * POST /api/enrollment/trainers/:id/approve
 * Stage 2 action: accepted → approved
 * Adds trainer to trainer table + sends approval email
 */
router.post('/trainers/:id/approve', authenticateToken, enrollmentController.approveTrainerEnrollment);

/**
 * POST /api/enrollment/trainers/:id/reject
 * Can reject from submitted or accepted stage → rejected (final)
 * Sends rejection email
 */
router.post('/trainers/:id/reject', authenticateToken, enrollmentController.rejectTrainerEnrollment);

module.exports = router;
