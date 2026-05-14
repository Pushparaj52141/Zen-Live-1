const attendanceService = require('../services/attendanceService');

class AttendanceController {
    // Get today's attendance
    async getTodayAttendance(req, res) {
        try {
            const userId = req.user.id;
            const attendance = await attendanceService.getTodayAttendance(userId);

            res.json({
                success: true,
                data: attendance
            });
        } catch (error) {
            console.error('Error getting today attendance:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Check in
    async checkIn(req, res) {
        try {
            const userId = req.user.id;
            const { photo } = req.body;

            // Photo still required
            if (!photo) {
                return res.status(400).json({
                    success: false,
                    message: 'Photo is required for check-in'
                });
            }

            const attendance = await attendanceService.checkIn(userId, req.body);

            res.json({
                success: true,
                message: 'Checked in successfully',
                data: attendance
            });
        } catch (error) {
            console.error('Error checking in:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Check out
    async checkOut(req, res) {
        try {
            const userId = req.user.id;
            const { photo } = req.body;

            if (!photo) {
                return res.status(400).json({
                    success: false,
                    message: 'Photo is required for check-out'
                });
            }

            const attendance = await attendanceService.checkOut(userId, req.body);

            res.json({
                success: true,
                message: 'Checked out successfully',
                data: attendance
            });
        } catch (error) {
            console.error('Error checking out:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Start break
    async startBreak(req, res) {
        try {
            const userId = req.user.id;
            const breakLog = await attendanceService.startBreak(userId);

            res.json({
                success: true,
                message: 'Break started',
                data: breakLog
            });
        } catch (error) {
            console.error('Error starting break:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // End break
    async endBreak(req, res) {
        try {
            const userId = req.user.id;
            const { breakId } = req.body;

            const breakLog = await attendanceService.endBreak(userId, breakId);

            res.json({
                success: true,
                message: 'Break ended',
                data: breakLog
            });
        } catch (error) {
            console.error('Error ending break:', error);
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get attendance history
    async getAttendanceHistory(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate, limit } = req.query;

            const history = await attendanceService.getAttendanceHistory(
                userId,
                startDate,
                endDate,
                limit ? parseInt(limit) : 30
            );

            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            console.error('Error getting attendance history:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getMonthlyAttendance(req, res) {
        try {
            const userId = req.user.id;
            const { month, year } = req.query;
            if (!month || !year) throw new Error("Month and Year required");
            const data = await attendanceService.getMonthlyAttendance(userId, month, year);
            res.json({ success: true, data });
        } catch (error) {
            console.error('Error getting monthly attendance:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Get attendance statistics
    async getAttendanceStats(req, res) {
        try {
            const userId = req.user.id;
            const { startDate, endDate } = req.query;

            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Start date and end date are required'
                });
            }

            const stats = await attendanceService.getAttendanceStats(userId, startDate, endDate);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error getting attendance stats:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Admin: Get all users' attendance for a specific date
    async getAllUsersAttendance(req, res) {
        try {
            const { date } = req.query;

            if (!date) {
                return res.status(400).json({
                    success: false,
                    message: 'Date is required'
                });
            }

            const attendance = await attendanceService.getAllUsersAttendance(date);

            res.json({
                success: true,
                data: attendance
            });
        } catch (error) {
            console.error('Error getting all users attendance:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new AttendanceController();
