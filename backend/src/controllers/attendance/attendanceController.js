const pool = require("../../config/db");
const imageHandler = require("../../utils/imageHandler");
const locationService = require("../../utils/locationService");

class AttendanceController {
    // Get today's attendance
    async getTodayAttendance(req, res) {
        try {
            const userId = req.user.id;
            const today = new Date().toISOString().split('T')[0];

            const result = await pool.query(
                `SELECT 
                    id, user_id, check_in_time, check_in_photo, check_out_time, check_out_photo, 
                    TO_CHAR(attendance_date, 'YYYY-MM-DD') as attendance_date, 
                    status, break_duration, total_hours, notes, created_at, updated_at,
                    check_in_latitude, check_in_longitude, is_in_office, office_location,
                    check_out_latitude, check_out_longitude, check_out_is_in_office, check_out_office_location
                 FROM attendance 
                 WHERE user_id = $1 AND attendance_date = $2`,
                [userId, today]
            );

            res.json({
                success: true,
                data: result.rows[0] || null
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
            const { photo, latitude, longitude, attendance_date } = req.body;
            // Use provided date or fallback to server UTC date (which was the bug source, but fallback is needed)
            const today = attendance_date || new Date().toISOString().split('T')[0];
            const now = new Date();

            if (!photo) {
                return res.status(400).json({
                    success: false,
                    message: 'Photo is required for check-in'
                });
            }

            // Validate location if provided
            let locationData = {
                latitude: latitude || null,
                longitude: longitude || null,
                isInOffice: false,
                officeName: 'Location not provided'
            };

            if (latitude && longitude) {
                const validation = locationService.validateLocation(latitude, longitude);
                locationData = {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    isInOffice: validation.isInOffice,
                    officeName: validation.officeName
                };
            }

            // Check if already checked in today
            const existing = await pool.query(
                `SELECT * FROM attendance WHERE user_id = $1 AND attendance_date = $2`,
                [userId, today]
            );

            if (existing.rows.length > 0 && existing.rows[0].check_in_time) {
                return res.status(400).json({
                    success: false,
                    message: 'Already checked in today'
                });
            }

            // Save image to file system
            const imageSaveResult = await imageHandler.saveImage(photo, userId, 'checkin');

            if (!imageSaveResult.success) {
                throw new Error('Failed to save check-in photo');
            }

            // Determine status based on check-in time (before 10:00 is on_time)
            const checkInHour = now.getHours();
            const status = checkInHour < 10 ? 'on_time' : 'late';

            const result = await pool.query(
                `INSERT INTO attendance 
         (user_id, check_in_time, check_in_photo, attendance_date, status, 
          check_in_latitude, check_in_longitude, is_in_office, office_location) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (user_id, attendance_date) 
         DO UPDATE SET 
           check_in_time = EXCLUDED.check_in_time,
           check_in_photo = EXCLUDED.check_in_photo,
           status = EXCLUDED.status,
           check_in_latitude = EXCLUDED.check_in_latitude,
           check_in_longitude = EXCLUDED.check_in_longitude,
           is_in_office = EXCLUDED.is_in_office,
           office_location = EXCLUDED.office_location
         RETURNING *`,
                [userId, now, imageSaveResult.path, today, status,
                    locationData.latitude, locationData.longitude,
                    locationData.isInOffice, locationData.officeName]
            );

            res.json({
                success: true,
                message: 'Checked in successfully',
                data: result.rows[0],
                location: locationData
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
            const { photo, latitude, longitude, attendance_date } = req.body;
            const today = attendance_date || new Date().toISOString().split('T')[0];
            const now = new Date();

            if (!photo) {
                return res.status(400).json({
                    success: false,
                    message: 'Photo is required for check-out'
                });
            }

            // Validate location if provided
            let locationData = {
                latitude: latitude || null,
                longitude: longitude || null,
                isInOffice: false,
                officeName: 'Location not provided'
            };

            if (latitude && longitude) {
                const validation = locationService.validateLocation(latitude, longitude);
                locationData = {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    isInOffice: validation.isInOffice,
                    officeName: validation.officeName
                };
            }

            const existing = await pool.query(
                `SELECT * FROM attendance WHERE user_id = $1 AND attendance_date = $2`,
                [userId, today]
            );

            if (existing.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No check-in record found for today'
                });
            }

            if (existing.rows[0].check_out_time) {
                return res.status(400).json({
                    success: false,
                    message: 'Already checked out today'
                });
            }

            // Save image to file system
            const imageSaveResult = await imageHandler.saveImage(photo, userId, 'checkout');

            if (!imageSaveResult.success) {
                throw new Error('Failed to save check-out photo');
            }

            // Calculate total hours
            const checkInTime = new Date(existing.rows[0].check_in_time);
            const breakDuration = existing.rows[0].break_duration || 0;
            const totalHours = ((now - checkInTime) / (1000 * 60 * 60)) - (breakDuration / 60);

            const result = await pool.query(
                `UPDATE attendance 
         SET check_out_time = $1, check_out_photo = $2, total_hours = $3,
             check_out_latitude = $4, check_out_longitude = $5, 
             check_out_is_in_office = $6, check_out_office_location = $7
         WHERE user_id = $8 AND attendance_date = $9
         RETURNING *`,
                [now, imageSaveResult.path, totalHours.toFixed(2),
                    locationData.latitude, locationData.longitude,
                    locationData.isInOffice, locationData.officeName,
                    userId, today]
            );

            res.json({
                success: true,
                message: 'Checked out successfully',
                data: result.rows[0]
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
            const today = new Date().toISOString().split('T')[0];

            const existing = await pool.query(
                `SELECT * FROM attendance WHERE user_id = $1 AND attendance_date = $2`,
                [userId, today]
            );

            if (existing.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No check-in record found for today'
                });
            }

            const result = await pool.query(
                `INSERT INTO break_logs (attendance_id, break_start) 
         VALUES ($1, $2) 
         RETURNING *`,
                [existing.rows[0].id, new Date()]
            );

            res.json({
                success: true,
                message: 'Break started',
                data: result.rows[0]
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
            const { breakId } = req.body;
            const now = new Date();

            const breakLog = await pool.query(
                `SELECT * FROM break_logs WHERE id = $1`,
                [breakId]
            );

            if (breakLog.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Break log not found'
                });
            }

            const breakStart = new Date(breakLog.rows[0].break_start);
            const duration = Math.floor((now - breakStart) / (1000 * 60)); // in minutes

            await pool.query(
                `UPDATE break_logs SET break_end = $1, duration = $2 WHERE id = $3`,
                [now, duration, breakId]
            );

            // Update total break duration in attendance
            const totalBreak = await pool.query(
                `SELECT SUM(duration) as total FROM break_logs WHERE attendance_id = $1`,
                [breakLog.rows[0].attendance_id]
            );

            await pool.query(
                `UPDATE attendance SET break_duration = $1 WHERE id = $2`,
                [totalBreak.rows[0].total || 0, breakLog.rows[0].attendance_id]
            );

            res.json({
                success: true,
                message: 'Break ended',
                data: { break_end: now, duration }
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
            const { startDate, endDate, limit = 30 } = req.query;

            let query = `
                SELECT 
                    id, user_id, check_in_time, check_in_photo, check_out_time, check_out_photo, 
                    TO_CHAR(attendance_date, 'YYYY-MM-DD') as attendance_date, 
                    status, break_duration, total_hours, notes, created_at, updated_at,
                    check_in_latitude, check_in_longitude, is_in_office, office_location,
                    check_out_latitude, check_out_longitude, check_out_is_in_office, check_out_office_location
                FROM attendance 
                WHERE user_id = $1`;
            const params = [userId];

            if (startDate && endDate) {
                query += ` AND attendance_date BETWEEN $2 AND $3`;
                params.push(startDate, endDate);
            }

            query += ` ORDER BY attendance_date DESC LIMIT $${params.length + 1}`;
            params.push(parseInt(limit));

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error getting attendance history:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
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

            const result = await pool.query(
                `SELECT 
           COUNT(CASE WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL THEN 1 END) as total_days,
           SUM(CASE WHEN status = 'on_time' AND check_in_time IS NOT NULL AND check_out_time IS NOT NULL THEN 1 ELSE 0 END) as present_days,
           SUM(CASE WHEN status = 'late' AND check_in_time IS NOT NULL AND check_out_time IS NOT NULL THEN 1 ELSE 0 END) as late_days,
           SUM(CASE WHEN check_in_time IS NOT NULL AND check_out_time IS NULL THEN 1 ELSE 0 END) as partial_days,
           SUM(CASE WHEN check_in_time IS NULL AND check_out_time IS NULL THEN 1 ELSE 0 END) as absent_days,
           AVG(break_duration) as avg_break_time,
           AVG(total_hours) as avg_working_hours
         FROM attendance 
         WHERE user_id = $1 AND attendance_date BETWEEN $2 AND $3`,
                [userId, startDate, endDate]
            );

            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error getting attendance stats:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get monthly attendance
    async getMonthlyAttendance(req, res) {
        try {
            const userId = req.user.id;
            const { month, year } = req.query;

            if (!month || !year) {
                return res.status(400).json({
                    success: false,
                    message: 'Month and Year are required'
                });
            }

            // Calculate start and end date
            const start = `${year}-${String(month).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month, 0).getDate();
            const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

            const result = await pool.query(
                `SELECT 
                    id, user_id, check_in_time, check_in_photo, check_out_time, check_out_photo, 
                    TO_CHAR(attendance_date, 'YYYY-MM-DD') as attendance_date, 
                    status, break_duration, total_hours, notes, created_at, updated_at,
                    check_in_latitude, check_in_longitude, is_in_office, office_location,
                    check_out_latitude, check_out_longitude, check_out_is_in_office, check_out_office_location
                 FROM attendance 
                 WHERE user_id = $1 AND attendance_date BETWEEN $2 AND $3`,
                [userId, start, end]
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error getting monthly attendance:', error);
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

            const result = await pool.query(
                `SELECT a.*, u.username AS name, u.email, ur.role_name AS role 
         FROM attendance a
         JOIN users u ON a.user_id = u.user_id
         LEFT JOIN user_roles ur ON u.role_id = ur.role_id
         WHERE a.attendance_date = $1
         ORDER BY a.check_in_time`,
                [date]
            );

            res.json({
                success: true,
                data: result.rows
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
