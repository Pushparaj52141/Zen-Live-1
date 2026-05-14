const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance/attendanceController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

// Get today's attendance
router.get('/today', attendanceController.getTodayAttendance);

// Check in
router.post('/check-in', attendanceController.checkIn);

// Check out
router.post('/check-out', attendanceController.checkOut);

// Break management
router.post('/break/start', attendanceController.startBreak);
router.post('/break/end', attendanceController.endBreak);

// Get attendance history
router.get('/history', attendanceController.getAttendanceHistory);
router.get('/monthly', attendanceController.getMonthlyAttendance);

// Get attendance statistics
router.get('/stats', attendanceController.getAttendanceStats);

// Admin route: Get all users' attendance for a specific date
router.get('/all', attendanceController.getAllUsersAttendance);

module.exports = router;
