const db = require('../config/db');

class AttendanceService {
    // Get today's attendance for a user
    async getTodayAttendance(userId) {
        const today = new Date().toISOString().split('T')[0];

        const { rows } = await db.query(
            `SELECT * FROM attendance 
       WHERE user_id = $1 AND attendance_date = $2`,
            [userId, today]
        );

        return rows[0] || null;
    }

    // Check in
    async checkIn(userId, data) {
        const { photo, method, lat, lng, address } = data;
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        // Check if already checked in today
        const existing = await this.getTodayAttendance(userId);
        if (existing && existing.check_in_time) {
            throw new Error('Already checked in today');
        }

        const checkInHour = now.getHours();
        const checkInMinute = now.getMinutes();
        let status = 'on_time';

        if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 40)) {
            status = 'late';
        }

        // Postgres upsert syntax
        const query = `
            INSERT INTO attendance 
            (user_id, check_in_time, check_in_photo, attendance_date, status, check_in_lat, check_in_lng, check_in_address, method) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id, attendance_date) DO UPDATE SET
            check_in_time = EXCLUDED.check_in_time,
            check_in_photo = EXCLUDED.check_in_photo,
            status = EXCLUDED.status,
            check_in_lat = EXCLUDED.check_in_lat,
            check_in_lng = EXCLUDED.check_in_lng,
            check_in_address = EXCLUDED.check_in_address,
            method = EXCLUDED.method
        `;

        await db.query(query, [userId, now, photo, today, status, lat, lng, address, method || 'manual']);

        return await this.getTodayAttendance(userId);
    }

    // Check out
    async checkOut(userId, data) {
        const { photo, lat, lng, address } = data;
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        const existing = await this.getTodayAttendance(userId);
        if (!existing) {
            throw new Error('No check-in record found for today');
        }

        if (existing.check_out_time) {
            throw new Error('Already checked out today');
        }

        const checkInTime = new Date(existing.check_in_time);
        const totalHours = ((now - checkInTime) / (1000 * 60 * 60)) - ((existing.break_duration || 0) / 60);

        await db.query(
            `UPDATE attendance 
       SET check_out_time = $1, check_out_photo = $2, total_hours = $3, check_out_lat = $4, check_out_lng = $5, check_out_address = $6
       WHERE user_id = $7 AND attendance_date = $8`,
            [now, photo, totalHours.toFixed(2), lat, lng, address, userId, today]
        );

        return await this.getTodayAttendance(userId);
    }

    // Start break
    async startBreak(userId) {
        const existing = await this.getTodayAttendance(userId);
        if (!existing) {
            throw new Error('No check-in record found for today');
        }

        const { rows } = await db.query(
            `INSERT INTO break_logs (attendance_id, break_start) VALUES ($1, $2) RETURNING id, break_start`,
            [existing.id, new Date()]
        );

        return rows[0];
    }

    // End break
    async endBreak(userId, breakId) {
        const now = new Date();

        const { rows: breakLogs } = await db.query(
            `SELECT * FROM break_logs WHERE id = $1`,
            [breakId]
        );

        if (!breakLogs[0]) {
            throw new Error('Break log not found');
        }

        const breakStart = new Date(breakLogs[0].break_start);
        const duration = Math.floor((now - breakStart) / (1000 * 60)); // in minutes

        await db.query(
            `UPDATE break_logs SET break_end = $1, duration = $2 WHERE id = $3`,
            [now, duration, breakId]
        );

        // Update total break duration
        const { rows: total } = await db.query(
            `SELECT SUM(duration) as total FROM break_logs WHERE attendance_id = $1`,
            [breakLogs[0].attendance_id]
        );

        await db.query(
            `UPDATE attendance SET break_duration = $1 WHERE id = $2`,
            [total[0].total || 0, breakLogs[0].attendance_id]
        );

        return { break_end: now, duration };
    }

    // Get user attendance history
    async getAttendanceHistory(userId, startDate, endDate, limit = 30) {
        let query = `
            SELECT 
                id, user_id, check_in_time, check_in_photo, check_out_time, check_out_photo, 
                TO_CHAR(attendance_date, 'YYYY-MM-DD') as attendance_date, 
                status, break_duration, total_hours, notes, created_at, updated_at,
                check_in_lat, check_in_lng, check_in_address, check_out_lat, check_out_lng, check_out_address, method
            FROM attendance 
            WHERE user_id = $1
        `;
        const params = [userId];

        if (startDate && endDate) {
            query += ` AND attendance_date BETWEEN $${params.length + 1} AND $${params.length + 2}`;
            params.push(startDate, endDate);
        }

        query += ` ORDER BY attendance_date DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const { rows } = await db.query(query, params);
        return rows;
    }

    async getMonthlyAttendance(userId, month, year) {
        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        // Format last day as YYYY-MM-DD
        const lastDay = new Date(year, month, 0).getDate();
        const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

        const query = `
            SELECT 
                id, user_id, check_in_time, check_in_photo, check_out_time, check_out_photo, 
                TO_CHAR(attendance_date, 'YYYY-MM-DD') as attendance_date, 
                status, break_duration, total_hours, notes, created_at, updated_at,
                check_in_lat, check_in_lng, check_in_address, check_out_lat, check_out_lng, check_out_address, method
            FROM attendance 
            WHERE user_id = $1 AND attendance_date BETWEEN $2 AND $3
        `;
        const { rows } = await db.query(query, [userId, start, end]);
        return rows;
    }

    // Get attendance statistics
    async getAttendanceStats(userId, startDate, endDate) {
        const { rows } = await db.query(
            `SELECT 
         COUNT(*) as total_days,
         SUM(CASE WHEN status = 'on_time' THEN 1 ELSE 0 END) as present_days,
         SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
         SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial_days,
         SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
         AVG(break_duration) as avg_break_time,
         AVG(total_hours) as avg_working_hours
       FROM attendance 
       WHERE user_id = $1 AND attendance_date BETWEEN $2 AND $3`,
            [userId, startDate, endDate]
        );

        return rows[0];
    }

    // Get all users' attendance for admin
    async getAllUsersAttendance(date) {
        const { rows } = await db.query(
            `SELECT a.*, u.username as name, u.email, u.role 
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.attendance_date = $1
       ORDER BY a.check_in_time`,
            [date]
        );

        return rows;
    }
}

module.exports = new AttendanceService();
