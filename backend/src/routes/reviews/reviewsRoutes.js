// Reviews Routes
// Routes for both manual reviews and Google reviews management

const express = require('express');
const router = express.Router();
const reviewsController = require('../../controllers/reviews/reviewsController');
const { authenticateToken, authorizeRoles } = require('../../middlewares/authMiddleware');

// Public/Protected routes (all authenticated users can view)
router.get('/all', authenticateToken, reviewsController.getAllReviews);
router.get('/google', authenticateToken, reviewsController.getGoogleReviews);
router.get('/stats', authenticateToken, reviewsController.getReviewStats);
router.get('/sync-status', authenticateToken, reviewsController.getSyncStatus);
router.get('/:id', authenticateToken, reviewsController.getReviewById);
router.get('/', authenticateToken, reviewsController.getManualReviews);

// Admin-only routes (manual review CRUD)
router.post('/', authenticateToken, authorizeRoles(1), reviewsController.createReview);
router.put('/:id', authenticateToken, authorizeRoles(1), reviewsController.updateReview);
router.delete('/:id', authenticateToken, authorizeRoles(1), reviewsController.deleteReview);

// Admin-only sync trigger
router.post('/sync-google', authenticateToken, authorizeRoles(1), reviewsController.syncGoogleReviews);

module.exports = router;
