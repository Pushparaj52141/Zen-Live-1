const db = require('../config/db');
const moment = require('moment');

class LeaveService {
    async getLeaveTypes() {
        const { rows } = await db.query("SELECT * FROM leave_types");
        if (rows.length === 0) {
            // Highly unlikely but let's initialize if empty
            await db.query("INSERT INTO leave_types (name, code, annual_allocation) VALUES ('Permission', 'PERM', 0)");
            const retry = await db.query("SELECT * FROM leave_types");
            return retry.rows;
        }
        return rows;
    }

    async getBalances(userId, year) {
        const leaveTypes = await this.getLeaveTypes();
        const balances = [];

        for (const type of leaveTypes) {
            const { rows } = await db.query(
                "SELECT * FROM leave_balances WHERE user_id = $1 AND leave_type_id = $2 AND year = $3",
                [userId, type.id, year]
            );

            if (rows.length === 0) {
                // Initialize balance
                await db.query(
                    "INSERT INTO leave_balances (user_id, leave_type_id, year, allocated) VALUES ($1, $2, $3, $4)",
                    [userId, type.id, year, type.annual_allocation]
                );
                balances.push({
                    leave_type: type.name,
                    code: type.code,
                    allocated: type.annual_allocation,
                    used: 0,
                    pending: 0,
                    remaining: type.annual_allocation
                });
            } else {
                const b = rows[0];
                balances.push({
                    leave_type: type.name,
                    code: type.code,
                    allocated: b.allocated,
                    used: b.used,
                    pending: b.pending,
                    remaining: b.allocated - b.used - b.pending
                });
            }
        }
        return balances;
    }

    async applyLeave(userId, data) {
        let { leave_type_id, from_date, to_date, reason, attachment_url, is_half_day, half_day_period, start_time, end_time } = data;

        // 1. Detect if this is a Permission
        // We consider it a permission if it has times OR if the type name being passed is 'Permission'
        let isPermissionRequest = !!(start_time || end_time);

        // Peek at the type info to be sure
        const { rows: initialTypes } = await db.query("SELECT * FROM leave_types WHERE id = $1", [leave_type_id]);
        if (initialTypes.length > 0) {
            const name = initialTypes[0].name.toLowerCase();
            if (name.includes('permission')) isPermissionRequest = true;
        }

        // 2. If it is a permission, ensure we use the 'Permission' leave_type_id
        if (isPermissionRequest) {
            const { rows: pType } = await db.query("SELECT id FROM leave_types WHERE name ILIKE 'Permission' OR code = 'PERM' LIMIT 1");
            if (pType.length > 0) {
                leave_type_id = pType[0].id;
            } else {
                // If permission type missing, we'll proceed but it will be labeled as whatever was sent
                // Ideally we should create it, but let's at least ensure duration is 0
            }
        }

        const year = moment(from_date).year();

        // 3. Calculate duration (Force 0 for permissions)
        let duration = 0;
        if (isPermissionRequest) {
            duration = 0;
        } else if (is_half_day) {
            duration = 0.5;
        } else {
            const start = moment(from_date);
            const end = moment(to_date);
            const { rows: holidays } = await db.query("SELECT holiday_date FROM holidays WHERE holiday_date BETWEEN $1 AND $2", [from_date, to_date]);
            const totalDays = end.diff(start, 'days') + 1;
            duration = Math.max(0, totalDays - holidays.length);
        }

        // 4. Check/Initialize Balance
        const { rows: balanceRow } = await db.query(
            "SELECT * FROM leave_balances WHERE user_id = $1 AND leave_type_id = $2 AND year = $3",
            [userId, leave_type_id, year]
        );

        let balance = balanceRow[0];
        if (!balance) {
            // Get allocation from typeInfo
            const { rows: currentTypes } = await db.query("SELECT * FROM leave_types WHERE id = $1", [leave_type_id]);
            const allocation = currentTypes[0]?.annual_allocation || 0;
            await db.query(
                "INSERT INTO leave_balances (user_id, leave_type_id, year, allocated) VALUES ($1, $2, $3, $4)",
                [userId, leave_type_id, year, allocation]
            );
            balance = { allocated: allocation, used: 0, pending: 0 };
        }

        if (balance.allocated - balance.used - balance.pending < duration) {
            throw new Error('Insufficient leave balance');
        }

        // 5. Create Request
        let result;
        try {
            const { rows } = await db.query(
                `INSERT INTO leave_requests (user_id, leave_type_id, from_date, to_date, is_half_day, half_day_period, reason, attachment_url, status, start_time, end_time)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', $9, $10) RETURNING id`,
                [userId, leave_type_id, from_date, to_date, is_half_day, half_day_period, reason, attachment_url, start_time, end_time]
            );
            result = rows;
        } catch (err) {
            // Handle missing columns error (Postgres code 42703)
            if (err.code === '42703' || err.message.includes('start_time') || err.message.includes('end_time')) {
                // Last resort: Try to repair the table structure on the fly
                try {
                    await db.query(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS start_time TIME, ADD COLUMN IF NOT EXISTS end_time TIME`);
                    const { rows } = await db.query(
                        `INSERT INTO leave_requests (user_id, leave_type_id, from_date, to_date, is_half_day, half_day_period, reason, attachment_url, status, start_time, end_time)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending', $9, $10) RETURNING id`,
                        [userId, leave_type_id, from_date, to_date, is_half_day, half_day_period, reason, attachment_url, start_time, end_time]
                    );
                    result = rows;
                } catch (repairErr) {
                    const { rows } = await db.query(
                        `INSERT INTO leave_requests (user_id, leave_type_id, from_date, to_date, is_half_day, half_day_period, reason, attachment_url, status)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending') RETURNING id`,
                        [userId, leave_type_id, from_date, to_date, is_half_day, half_day_period, reason, attachment_url]
                    );
                    result = rows;
                }
            } else {
                throw err;
            }
        }

        // 6. Update Pending Balance
        if (duration > 0) {
            await db.query(
                "UPDATE leave_balances SET pending = pending + $1 WHERE user_id = $2 AND leave_type_id = $3 AND year = $4",
                [duration, userId, leave_type_id, year]
            );
        }

        return { id: result[0].id };
    }

    async updateRequestStatus(requestId, status, approverId, rejection_reason = null) {
        const { rows: reqRows } = await db.query(
            "SELECT lr.*, lt.name as type_name FROM leave_requests lr JOIN leave_types lt ON lr.leave_type_id = lt.id WHERE lr.id = $1",
            [requestId]
        );
        if (reqRows.length === 0) throw new Error("Request not found");
        const request = reqRows[0];

        if (request.status !== 'Pending') throw new Error("Request already processed");

        const isPermission = request.type_name?.toLowerCase().trim() === 'permission' || !!(request.start_time || request.end_time);

        let duration = 0;
        if (isPermission) {
            duration = 0;
        } else {
            duration = request.is_half_day ? 0.5 : (moment(request.to_date).diff(moment(request.from_date), 'days') + 1);
        }
        const year = moment(request.from_date).year();

        if (status === 'Approved') {
            await db.query(
                "UPDATE leave_balances SET pending = pending - $1, used = used + $2 WHERE user_id = $3 AND leave_type_id = $4 AND year = $5",
                [duration, duration, request.user_id, request.leave_type_id, year]
            );
        } else if (status === 'Rejected') {
            await db.query(
                "UPDATE leave_balances SET pending = pending - $1 WHERE user_id = $2 AND leave_type_id = $3 AND year = $4",
                [duration, request.user_id, request.leave_type_id, year]
            );
        }

        await db.query(
            "UPDATE leave_requests SET status = $1, approved_by = $2, rejection_reason = $3 WHERE id = $4",
            [status, approverId, rejection_reason, requestId]
        );

        return { id: requestId, status };
    }

    async getMyRequests(userId) {
        const { rows } = await db.query(
            `SELECT lr.*, lt.name as leave_type_name, u.username, u.email, u.profile_image 
              FROM leave_requests lr 
              JOIN leave_types lt ON lr.leave_type_id = lt.id 
              JOIN users u ON lr.user_id = u.user_id
              WHERE lr.user_id = $1 ORDER BY lr.created_at DESC`,
            [userId]
        );
        return rows;
    }

    async updateLeaveType(id, data) {
        const { name, code, annual_allocation, gender_rule } = data;

        try {
            // Try updating with gender_rule first
            const { rows } = await db.query(
                "UPDATE leave_types SET name = $1, code = $2, annual_allocation = $3, gender_rule = $4 WHERE id = $5 RETURNING *",
                [name, code, annual_allocation || 0, gender_rule || 'All', id]
            );
            return rows[0];
        } catch (err) {
            // If gender_rule column is missing (code 42703), try updating without it
            if (err.code === '42703' || err.message.includes('gender_rule')) {
                const { rows } = await db.query(
                    "UPDATE leave_types SET name = $1, code = $2, annual_allocation = $3 WHERE id = $4 RETURNING *",
                    [name, code, annual_allocation || 0, id]
                );
                return rows[0];
            }
            throw err;
        }
    }
}

module.exports = new LeaveService();
