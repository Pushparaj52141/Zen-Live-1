const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave/leaveController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// User routes
// User routes
router.get('/config/types', leaveController.getLeaveTypes);
router.get('/my-balances', leaveController.getBalances);
router.post('/apply', leaveController.applyLeave);
router.get('/my-leaves', leaveController.getMyLeaves);

// Admin routes
router.get('/all', leaveController.getAllLeaveRequests);
router.put('/:id/status', leaveController.updateLeaveStatus);
router.put('/config/types/:id', leaveController.updateLeaveType);

module.exports = router;
