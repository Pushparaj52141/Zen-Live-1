const leaveService = require('../../services/leaveService');
const { sendEmail } = require('../../services/gmailService');
const pool = require('../../config/db');

const leaveController = {
    getBalances: async (req, res) => {
        try {
            const userId = req.user.id;
            const year = req.query.year || new Date().getFullYear();
            const balances = await leaveService.getBalances(userId, year);
            res.json({ success: true, data: balances });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    getLeaveTypes: async (req, res) => {
        try {
            let types = await leaveService.getLeaveTypes();

            // Self-healing: Ensure Permission exists
            const hasPermission = types.some(t =>
                t.name.toLowerCase().trim().includes('permission') ||
                t.code?.toUpperCase() === 'PERM'
            );

            if (!hasPermission) {
                try {
                    await pool.query("INSERT INTO leave_types (name, code, annual_allocation) VALUES ('Permission', 'PERM', 0) ON CONFLICT DO NOTHING");
                    // Refresh types after insert
                    types = await leaveService.getLeaveTypes();
                } catch (dbErr) {
                    // Silently fail if self-healing fails
                }
            }

            res.json({ success: true, data: types });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    applyLeave: async (req, res) => {
        try {
            const userId = req.user.id;
            const { from_date, to_date, reason } = req.body; // Use correct snake_case from body if frontend sends snake_case, or map it. 
            // Note: Service expects snake_case for leave_type_id etc. 
            // Let's assume frontend sends matching keys to DB columns or Service method arguments.

            const result = await leaveService.applyLeave(userId, req.body);

            // Fetch user for email
            const userResult = await pool.query('SELECT username, email FROM users WHERE user_id = $1', [userId]);
            const user = userResult.rows[0];

            if (user) {
                const days = Math.ceil((new Date(to_date) - new Date(from_date)) / (1000 * 60 * 60 * 24)) + 1;

                const mailOptions = {
                    to: process.env.ADMIN_EMAIL || 'admin@urbancode.in',
                    subject: 'New Leave Request Submitted 🌴',
                    message: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                          <h2 style="color: #1d4ed8;">New Leave Request</h2>
                          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Employee:</strong> ${user.username}</p>
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>Dates:</strong> ${new Date(from_date).toLocaleDateString()} to ${new Date(to_date).toLocaleDateString()} (${days} days)</p>
                            <p><strong>Reason:</strong> ${reason}</p>
                          </div>
                          <p>Please review in admin panel.</p>
                        </div>
                    `
                };
                sendEmail(mailOptions).catch(err => console.error("❌ Failed to send admin leave notification:", err.message));
            }

            res.status(201).json({ success: true, data: result, message: 'Leave request submitted' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    },

    getMyLeaves: async (req, res) => {
        try {
            const userId = req.user.id;
            const leaves = await leaveService.getMyRequests(userId);

            const processedLeaves = leaves.map(leave => {
                let img = leave.profile_image;
                if (img && Buffer.isBuffer(img)) {
                    img = `data:image/jpeg;base64,${img.toString('base64')}`;
                }
                return { ...leave, profile_image: img };
            });

            res.json({ success: true, data: processedLeaves });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    // Admin: Get all (not implemented in service yet, adding quick query here or in service)
    getAllLeaveRequests: async (req, res) => {
        // Assuming logic similar to before but better joins
        // For now reuse existing logic or call service if I add it.
        // Let's add simple direct query here to save time on service update
        const pool = require("../../config/db");
        try {
            const result = await pool.query(
                `SELECT lr.*, 
                        COALESCE(u.username, 'Unknown User') as username, 
                        COALESCE(u.email, 'No Email') as email, 
                        u.profile_image,
                        COALESCE(lt.name, 'Unknown Type') as leave_type_name
                  FROM leave_requests lr
                  LEFT JOIN users u ON lr.user_id = u.user_id
                  LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
                  ORDER BY lr.created_at DESC`
            );
            const processedRows = result.rows.map(row => {
                let img = row.profile_image;
                if (img && Buffer.isBuffer(img)) {
                    img = `data:image/jpeg;base64,${img.toString('base64')}`;
                }
                return { ...row, profile_image: img };
            });

            res.json({ success: true, data: processedRows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    updateLeaveStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, rejection_reason } = req.body;
            const approverId = req.user.id;

            const result = await leaveService.updateRequestStatus(id, status, approverId, rejection_reason);
            res.json({ success: true, data: result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    },

    updateLeaveType: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await leaveService.updateLeaveType(id, req.body);
            if (!result) {
                return res.status(404).json({ success: false, error: "Leave type not found" });
            }
            res.json({ success: true, data: result });
        } catch (err) {
            console.error("UPDATE LEAVE TYPE ERROR:", err);
            res.status(500).json({ error: err.message });
        }
    }
};

module.exports = leaveController;

