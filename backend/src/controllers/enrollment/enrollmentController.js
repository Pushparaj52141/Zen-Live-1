const pool = require('../../config/db');
const { generateEnrollmentID } = require('../../utils/generateEnrollmentID');
const { sendEmail } = require('../../services/gmailService');

/** JWT payload uses `id` (DB user_id); keep fallbacks for older tokens */
const actorUserId = (req) => req.user?.user_id ?? req.user?.id ?? req.user?.userId ?? null;

/* ─────────────────────────── Email Helpers ─────────────────────────── */

/**
 * Build a clean HTML email wrapper
 */
function buildEmailHtml({ title, preheader, bodyHtml, branding = 'Student Registration', accentColor = '#4f46e5' }) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header bar -->
        <tr><td style="background:${accentColor};padding:24px 32px;">
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">
            ${branding}
          </h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:12px;letter-spacing:0.05em;text-transform:uppercase;">${preheader}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#1e293b;font-size:18px;font-weight:700;">${title}</h2>
          ${bodyHtml}
          <p style="margin:24px 0 0;color:#94a3b8;font-size:11px;text-align:center;border-top:1px solid #f1f5f9;padding-top:16px;">
            ${branding} · Enrollment Management System<br/>
            This is an automated message — please do not reply.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function infoRow(label, value) {
    return `<tr>
      <td style="padding:6px 0;color:#64748b;font-size:13px;width:130px;vertical-align:top;">${label}</td>
      <td style="padding:6px 0;color:#1e293b;font-size:13px;font-weight:600;">${value || '—'}</td>
    </tr>`;
}

/* ─────────────────────── PUBLIC: Submit student ────────────────────── */

exports.submitStudentEnrollment = async (req, res) => {
    try {
        const {
            name, email, country_code = '+91', mobile_number, role,
            college, school_college_id, location, course_id,
            additional_info, unit_id, language
        } = req.body;

        const resumeFile = req.files?.['resume']?.[0];
        const aadharFile = req.files?.['aadhar_card']?.[0];
        const photoFile = req.files?.['photo']?.[0];

        if (!name || !mobile_number || !course_id)
            return res.status(400).json({ error: 'Name, mobile number, and course are required.' });

        if (!/^\d{5,15}$/.test(mobile_number))
            return res.status(400).json({ error: 'Invalid mobile number format. Should be 5-15 digits.' });

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            return res.status(400).json({ error: 'Invalid email format.' });

        // Duplicate check - check for submitted/accepted/approved (active) applications
        const dup = await pool.query(
            `SELECT enrollment_id FROM student_enrollment_requests
             WHERE mobile_number = $1 AND course_id = $2 AND status IN ('submitted','accepted','approved')`,
            [mobile_number, course_id]
        );
        if (dup.rowCount > 0)
            return res.status(409).json({ error: 'You already have an active or approved enrollment for this course.' });

        const result = await pool.query(
            `INSERT INTO student_enrollment_requests
             (name, email, country_code, mobile_number, role, college, school_college_id,
              location, course_id, additional_info, unit_id, language,
              resume_url, aadhar_card_url, photo_url, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'submitted')
             RETURNING *`,
            [
                name, email || null, country_code, mobile_number, role || null,
                college || null, school_college_id || null, location || null,
                course_id, additional_info || null, unit_id || null, language || null,
                resumeFile?.filename || null, aadharFile?.filename || null, photoFile?.filename || null
            ]
        );

        // Send acknowledgement email if they provided one
        if (email) {
            try {
                await sendEmail({
                    to: email,
                    subject: '✅ Enrollment Request Received — Student Registration',
                    message: buildEmailHtml({
                        title: `Hi ${name},`,
                        preheader: 'Enrollment Request Received',
                        accentColor: '#4f46e5',
                        bodyHtml: `
                            <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px;">
                                Thank you for submitting your enrollment request to <strong>Student Registration</strong>.
                                Your application has been received and is currently under review.
                            </p>
                            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
                                ${infoRow('Course', result.rows[0].course_id)}
                                ${infoRow('Status', '📋 Submitted')}
                            </table>
                            <p style="color:#475569;font-size:13px;margin:0;">
                                We will notify you once your application moves to the next stage.
                            </p>`
                    })
                });
            } catch (emailErr) {
                console.warn('Acknowledgement email failed:', emailErr.message);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Enrollment request submitted successfully! We will review and contact you soon.',
            enrollment: result.rows[0]
        });
    } catch (error) {
        console.error('Error submitting student enrollment:', error);
        res.status(500).json({ error: 'Failed to submit enrollment request. Please try again.' });
    }
};

/* ─────────────────────── PUBLIC: Submit trainer ────────────────────── */

exports.submitTrainerEnrollment = async (req, res) => {
    try {
        const {
            trainer_name, trainer_email, trainer_mobile, specialization,
            experience_years, bio, certifications, language, role, employee_id
        } = req.body;

        const resumeFile = req.files?.['resume']?.[0];
        const aadharFile = req.files?.['aadhar_card']?.[0];
        const photoFile = req.files?.['photo']?.[0];

        if (!trainer_name || !trainer_email || !trainer_mobile)
            return res.status(400).json({ error: 'Name, email, and mobile number are required.' });

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trainer_email))
            return res.status(400).json({ error: 'Invalid email format.' });

        if (!/^\d{5,15}$/.test(trainer_mobile))
            return res.status(400).json({ error: 'Invalid mobile number format. Should be 5-15 digits.' });

        // Duplicate check — block if already active or approved
        const dup = await pool.query(
            `SELECT enrollment_id FROM trainer_enrollment_requests
             WHERE (trainer_email = $1 OR trainer_mobile = $2) AND status IN ('submitted','accepted','approved')`,
            [trainer_email, trainer_mobile]
        );
        if (dup.rowCount > 0)
            return res.status(409).json({ error: 'You already have an active or approved instructor application.' });

        const result = await pool.query(
            `INSERT INTO trainer_enrollment_requests
             (trainer_name, trainer_email, trainer_mobile, specialization, experience_years,
              bio, certifications, language, resume_url, aadhar_card_url, role, photo_url, employee_id, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'submitted')
             RETURNING *`,
            [
                trainer_name, trainer_email, trainer_mobile, specialization || null,
                experience_years || null, bio || null, certifications || null,
                language || null, resumeFile?.filename || null, aadharFile?.filename || null,
                role || null, photoFile?.filename || null, employee_id || null
            ]
        );

        // Acknowledgement email
        try {
            await sendEmail({
                to: trainer_email,
                subject: '✅ Application Received — Instructor Enrollment',
                message: buildEmailHtml({
                    title: `Hi ${trainer_name},`,
                    preheader: 'Application Received',
                    accentColor: '#ea580c',
                    branding: 'Instructor Enrollment',
                    bodyHtml: `
                        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px;">
                            Thank you for applying as an instructor at <strong>Instructor Enrollment</strong>.
                            Your application has been received and is currently under initial review.
                        </p>
                        <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
                            ${infoRow('Specialization', specialization)}
                            ${infoRow('Status', '📋 Submitted')}
                        </table>
                        <p style="color:#475569;font-size:13px;margin:0;">
                            We will notify you as your application progresses. Thank you for your interest!
                        </p>`
                })
            });
        } catch (emailErr) {
            console.warn('Trainer acknowledgement email failed:', emailErr.message);
        }

        res.status(201).json({
            success: true,
            message: 'Instructor enrollment request submitted successfully! We will review and contact you soon.',
            enrollment: result.rows[0]
        });
    } catch (error) {
        console.error('Error submitting instructor enrollment:', error);
        res.status(500).json({ error: 'Failed to submit enrollment request. Please try again.' });
    }
};

/* ─────────────────────── ADMIN: Get students ───────────────────────── */

exports.getStudentEnrollments = async (req, res) => {
    try {
        const { status } = req.query;
        const validStatuses = ['submitted', 'accepted', 'approved', 'rejected'];

        let query = `
            SELECT
                ser.*,
                c.course_name,
                u.username AS processed_by_name
            FROM student_enrollment_requests ser
            LEFT JOIN course c ON ser.course_id = c.course_id
            LEFT JOIN users u ON ser.processed_by = u.user_id
        `;
        const params = [];

        if (status && validStatuses.includes(status)) {
            query += ' WHERE ser.status = $1';
            params.push(status);
        }
        query += ' ORDER BY ser.created_at DESC';

        const result = await pool.query(query, params);
        res.json({ success: true, enrollments: result.rows });
    } catch (error) {
        console.error('Error fetching student enrollments:', error);
        res.status(500).json({ error: 'Failed to fetch enrollment requests.' });
    }
};

/* ─────────────────────── ADMIN: Get trainers ───────────────────────── */

exports.getTrainerEnrollments = async (req, res) => {
    try {
        const { status } = req.query;
        const validStatuses = ['submitted', 'accepted', 'approved', 'rejected'];

        let query = `
            SELECT
                ter.*,
                u.username AS processed_by_name
            FROM trainer_enrollment_requests ter
            LEFT JOIN users u ON ter.processed_by = u.user_id
        `;
        const params = [];

        if (status && validStatuses.includes(status)) {
            query += ' WHERE ter.status = $1';
            params.push(status);
        }
        query += ' ORDER BY ter.created_at DESC';

        const result = await pool.query(query, params);
        res.json({ success: true, enrollments: result.rows });
    } catch (error) {
        console.error('Error fetching trainer enrollments:', error);
        res.status(500).json({ error: 'Failed to fetch enrollment requests.' });
    }
};

/* ─────────────── ADMIN: Accept student (SUBMITTED → ACCEPTED) ──────── */

exports.acceptStudentEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = actorUserId(req);

        const enrollment = await pool.query(
            'SELECT * FROM student_enrollment_requests WHERE enrollment_id = $1',
            [id]
        );

        if (enrollment.rowCount === 0)
            return res.status(404).json({ error: 'Enrollment request not found.' });

        const data = enrollment.rows[0];

        if (data.status !== 'submitted')
            return res.status(400).json({
                error: `Cannot accept — application is currently '${data.status}'. Only 'submitted' applications can be accepted.`
            });

        await pool.query(
            `UPDATE student_enrollment_requests
             SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP, accepted_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE enrollment_id = $2`,
            [userId, id]
        );

        // Email notification
        if (data.email) {
            try {
                await sendEmail({
                    to: data.email,
                    subject: '🔍 Application Update: Initial Screening Passed — Student Registration',
                    message: buildEmailHtml({
                        title: `Good news, ${data.name}!`,
                        preheader: 'Initial Screening Passed',
                        accentColor: '#0891b2',
                        bodyHtml: `
                            <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px;">
                                Your enrollment application has passed our <strong>initial screening</strong> and
                                is now under <strong>final review</strong> by our admissions team.
                            </p>
                            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;background:#f0f9ff;border-radius:10px;padding:16px;">
                                ${infoRow('Applicant', data.name)}
                                ${infoRow('Course Applied', data.course_id)}
                                ${infoRow('Current Status', '🔍 Accepted — Awaiting Final Decision')}
                            </table>
                            <p style="color:#475569;font-size:13px;margin:0;">
                                We will send you a final decision email shortly. Thank you for your patience!
                            </p>`
                    })
                });
            } catch (emailErr) {
                console.warn('Accept email failed:', emailErr.message);
            }
        }

        res.json({ success: true, message: 'Application accepted and moved to final review.' });
    } catch (error) {
        console.error('Error accepting student enrollment:', error);
        res.status(500).json({ error: 'Failed to accept enrollment request.' });
    }
};

/* ─────────────── ADMIN: Accept trainer (SUBMITTED → ACCEPTED) ──────── */

exports.acceptTrainerEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = actorUserId(req);

        const enrollment = await pool.query(
            'SELECT * FROM trainer_enrollment_requests WHERE enrollment_id = $1',
            [id]
        );

        if (enrollment.rowCount === 0)
            return res.status(404).json({ error: 'Enrollment request not found.' });

        const data = enrollment.rows[0];

        if (data.status !== 'submitted')
            return res.status(400).json({
                error: `Cannot accept — application is currently '${data.status}'. Only 'submitted' applications can be accepted.`
            });

        await pool.query(
            `UPDATE trainer_enrollment_requests
             SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP, accepted_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE enrollment_id = $2`,
            [userId, id]
        );

        // Email notification
        try {
            await sendEmail({
                to: data.trainer_email,
                subject: '🔍 Application Update: Initial Screening Passed — Instructor Enrollment',
                message: buildEmailHtml({
                    title: `Great news, ${data.trainer_name}!`,
                    preheader: 'Initial Screening Passed',
                    accentColor: '#0891b2',
                    branding: 'Instructor Enrollment',
                    bodyHtml: `
                        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px;">
                            Your instructor application has successfully passed our <strong>initial screening</strong>
                            and is now under <strong>final review</strong>.
                        </p>
                        <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;background:#f0f9ff;border-radius:10px;padding:16px;">
                            ${infoRow('Applicant', data.trainer_name)}
                            ${infoRow('Specialization', data.specialization)}
                            ${infoRow('Current Status', '🔍 Accepted — Awaiting Final Decision')}
                        </table>
                        <p style="color:#475569;font-size:13px;margin:0;">
                            Our team will reach out with a final decision shortly. Thank you!
                        </p>`
                })
            });
        } catch (emailErr) {
            console.warn('Trainer accept email failed:', emailErr.message);
        }

        res.json({ success: true, message: 'Instructor application accepted and moved to final review.' });
    } catch (error) {
        console.error('Error accepting instructor enrollment:', error);
        res.status(500).json({ error: 'Failed to accept enrollment request.' });
    }
};

/* ─────────────── ADMIN: Approve student (ACCEPTED → APPROVED) ──────── */

exports.approveStudentEnrollment = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = actorUserId(req);

        await client.query('BEGIN');

        const enrollment = await client.query(
            'SELECT * FROM student_enrollment_requests WHERE enrollment_id = $1',
            [id]
        );

        if (enrollment.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Enrollment request not found.' });
        }

        const enrollmentData = enrollment.rows[0];

        // ⚠️ MUST be 'accepted' — cannot skip stages
        if (enrollmentData.status !== 'accepted') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: `Cannot approve — application is currently '${enrollmentData.status}'. Application must be in 'accepted' stage before approving.`
            });
        }

        // Resolve course
        let actualCourseId = null;
        const courseMatch = await client.query(
            `SELECT course_id FROM course
             WHERE LOWER(course_name) = LOWER($1) OR course_id = $1 LIMIT 1`,
            [enrollmentData.course_id]
        );
        if (courseMatch.rowCount > 0) {
            actualCourseId = courseMatch.rows[0].course_id;
        } else {
            const defaultCourse = await client.query('SELECT course_id FROM course LIMIT 1');
            actualCourseId = defaultCourse.rows[0]?.course_id;
        }

        // Card type
        const cardTypeResult = await client.query('SELECT card_type_id FROM card_type LIMIT 1');
        const card_type_id = cardTypeResult.rows[0]?.card_type_id;

        // Role ID
        let roleId = null;
        if (enrollmentData.role) {
            const roleRes = await client.query(
                "SELECT id FROM roles WHERE LOWER(name) = LOWER($1) LIMIT 1",
                [enrollmentData.role]
            );
            if (roleRes.rowCount > 0) roleId = roleRes.rows[0].id;
        }

        // Check if lead already exists for this student/course
        const existingLead = await client.query(
            `SELECT lead_id FROM leads WHERE (email = $1 OR mobile_number = $2) AND course_id = $3`,
            [enrollmentData.email, enrollmentData.mobile_number, actualCourseId]
        );

        let leadResult;
        if (existingLead.rowCount === 0) {
            // Create CRM lead
            leadResult = await client.query(
                `INSERT INTO leads
                 (name, email, country_code, mobile_number, role_id, college_company, location,
                  course_id, status, paid_status, unit_id, card_type_id, enrollment_id, created_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'enquiry','not paid',$9,$10,$11,CURRENT_TIMESTAMP)
                 RETURNING *`,
                [
                    enrollmentData.name, enrollmentData.email, enrollmentData.country_code,
                    enrollmentData.mobile_number, roleId, enrollmentData.college,
                    enrollmentData.location, actualCourseId, enrollmentData.unit_id,
                    card_type_id, id
                ]
            );
        }

        // Update status
        await client.query(
            `UPDATE student_enrollment_requests
             SET status = 'approved', processed_at = CURRENT_TIMESTAMP,
                 processed_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE enrollment_id = $2`,
            [userId, id]
        );

        await client.query('COMMIT');

        // Final approval email
        if (enrollmentData.email) {
            try {
                await sendEmail({
                    to: enrollmentData.email,
                    subject: '🎉 Congratulations! Enrollment Approved — Student Registration',
                    message: buildEmailHtml({
                        title: `Welcome to Student Registration, ${enrollmentData.name}!`,
                        preheader: 'Enrollment Officially Approved',
                        accentColor: '#16a34a',
                        bodyHtml: `
                            <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px;">
                                We are thrilled to inform you that your enrollment application has been
                                <strong style="color:#16a34a;">officially approved</strong>! 🎊
                            </p>
                            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;background:#f0fdf4;border-radius:10px;padding:16px;">
                                ${infoRow('Student', enrollmentData.name)}
                                ${infoRow('Course', enrollmentData.course_id)}
                                ${infoRow('Status', '✅ Approved')}
                            </table>
                            <p style="color:#475569;font-size:13px;margin:0;">
                                Our team will be in touch shortly with your onboarding details. We look forward to
                                seeing you grow with us!
                            </p>`
                    })
                });
            } catch (emailErr) {
                console.warn('Approval email failed:', emailErr.message);
            }
        }

        res.json({
            success: true,
            message: existingLead.rowCount > 0
                ? 'Student enrollment approved (lead already exists in CRM).'
                : 'Student enrollment approved and lead created successfully.',
            lead: existingLead.rowCount > 0 ? existingLead.rows[0] : leadResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving student enrollment:', error);
        res.status(500).json({ error: 'Failed to approve enrollment request.' });
    } finally {
        client.release();
    }
};

/* ─────────────── ADMIN: Approve trainer (ACCEPTED → APPROVED) ──────── */

exports.approveTrainerEnrollment = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = actorUserId(req);

        await client.query('BEGIN');

        const enrollment = await client.query(
            'SELECT * FROM trainer_enrollment_requests WHERE enrollment_id = $1',
            [id]
        );

        if (enrollment.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Enrollment request not found.' });
        }

        const enrollmentData = enrollment.rows[0];

        if (enrollmentData.status !== 'accepted') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                error: `Cannot approve — application is currently '${enrollmentData.status}'. Application must be in 'accepted' stage before approving.`
            });
        }

        // Check duplicate trainer
        const existingTrainer = await client.query(
            'SELECT trainer_id FROM trainer WHERE trainer_email = $1 OR trainer_mobile = $2',
            [enrollmentData.trainer_email, enrollmentData.trainer_mobile]
        );

        let trainerResult;
        if (existingTrainer.rowCount === 0) {
            // Add to trainer table
            trainerResult = await client.query(
                `INSERT INTO trainer (trainer_name, trainer_email, trainer_mobile, is_active)
                 VALUES ($1,$2,$3,true) RETURNING *`,
                [enrollmentData.trainer_name, enrollmentData.trainer_email, enrollmentData.trainer_mobile]
            );
        }

        await client.query(
            `UPDATE trainer_enrollment_requests
             SET status = 'approved', processed_at = CURRENT_TIMESTAMP,
                 processed_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE enrollment_id = $2`,
            [userId, id]
        );

        await client.query('COMMIT');

        // Final approval email
        try {
            await sendEmail({
                to: enrollmentData.trainer_email,
                subject: '🎉 Congratulations! Application Approved — Instructor Enrollment',
                message: buildEmailHtml({
                    title: `Welcome aboard, ${enrollmentData.trainer_name}!`,
                    preheader: 'Application Officially Approved',
                    accentColor: '#ea580c',
                    branding: 'Instructor Enrollment',
                    bodyHtml: `
                        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px;">
                            We are excited to inform you that your instructor application has been
                            <strong style="color:#16a34a;">officially approved</strong>! 🎊
                        </p>
                        <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;background:#fff7ed;border-radius:10px;padding:16px;">
                            ${infoRow('Name', enrollmentData.trainer_name)}
                            ${infoRow('Specialization', enrollmentData.specialization)}
                            ${infoRow('Status', '✅ Approved')}
                        </table>
                        <p style="color:#475569;font-size:13px;margin:0;">
                            You have been added to our faculty. Our coordinator will reach out with next steps. Welcome to the team!
                        </p>`
                })
            });
        } catch (emailErr) {
            console.warn('Trainer approval email failed:', emailErr.message);
        }

        res.json({
            success: true,
            message: existingTrainer.rowCount > 0
                ? 'Instructor enrollment approved (already exists in faculty).'
                : 'Instructor enrollment approved and added to the system.',
            trainer: existingTrainer.rowCount > 0 ? existingTrainer.rows[0] : trainerResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving instructor enrollment:', error);
        res.status(500).json({ error: 'Failed to approve enrollment request.' });
    } finally {
        client.release();
    }
};

/* ────── ADMIN: Reject student (SUBMITTED or ACCEPTED → REJECTED) ───── */

exports.rejectStudentEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;
        const userId = actorUserId(req);

        const enrollment = await pool.query(
            'SELECT * FROM student_enrollment_requests WHERE enrollment_id = $1',
            [id]
        );

        if (enrollment.rowCount === 0)
            return res.status(404).json({ error: 'Enrollment request not found.' });

        const data = enrollment.rows[0];

        // Can only reject submitted or accepted — not already approved/rejected
        if (!['submitted', 'accepted'].includes(data.status))
            return res.status(400).json({
                error: `Cannot reject — application is already '${data.status}' and cannot be changed.`
            });

        await pool.query(
            `UPDATE student_enrollment_requests
             SET status = 'rejected', rejection_reason = $1,
                 processed_at = CURRENT_TIMESTAMP, processed_by = $2, updated_at = CURRENT_TIMESTAMP
             WHERE enrollment_id = $3`,
            [rejection_reason || null, userId, id]
        );

        // Rejection email
        if (data.email) {
            try {
                await sendEmail({
                    to: data.email,
                    subject: 'Update on Your Enrollment Application — Student Registration',
                    message: buildEmailHtml({
                        title: `Hi ${data.name},`,
                        preheader: 'Application Status Update',
                        accentColor: '#dc2626',
                        bodyHtml: `
                            <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px;">
                                Thank you for your interest in <strong>Student Registration</strong>.
                                After careful review, we regret to inform you that your enrollment application
                                has not been approved at this time.
                            </p>
                            ${rejection_reason ? `
                            <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:6px;padding:14px 16px;margin-bottom:16px;">
                                <p style="margin:0;color:#7f1d1d;font-size:13px;font-weight:600;">Reason:</p>
                                <p style="margin:6px 0 0;color:#991b1b;font-size:13px;">${rejection_reason}</p>
                            </div>` : ''}
                            <p style="color:#475569;font-size:13px;margin:0;">
                                We encourage you to apply again in the future. If you have any questions, please
                                reach out to our admissions team.
                            </p>`
                    })
                });
            } catch (emailErr) {
                console.warn('Rejection email failed:', emailErr.message);
            }
        }

        res.json({ success: true, message: 'Student enrollment rejected.' });
    } catch (error) {
        console.error('Error rejecting student enrollment:', error);
        res.status(500).json({ error: 'Failed to reject enrollment request.' });
    }
};

/* ────── ADMIN: Reject trainer (SUBMITTED or ACCEPTED → REJECTED) ───── */

exports.rejectTrainerEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;
        const userId = actorUserId(req);

        const enrollment = await pool.query(
            'SELECT * FROM trainer_enrollment_requests WHERE enrollment_id = $1',
            [id]
        );

        if (enrollment.rowCount === 0)
            return res.status(404).json({ error: 'Enrollment request not found.' });

        const data = enrollment.rows[0];

        if (!['submitted', 'accepted'].includes(data.status))
            return res.status(400).json({
                error: `Cannot reject — application is already '${data.status}' and cannot be changed.`
            });

        await pool.query(
            `UPDATE trainer_enrollment_requests
             SET status = 'rejected', rejection_reason = $1,
                 processed_at = CURRENT_TIMESTAMP, processed_by = $2, updated_at = CURRENT_TIMESTAMP
             WHERE enrollment_id = $3`,
            [rejection_reason || null, userId, id]
        );

        try {
            await sendEmail({
                to: data.trainer_email,
                subject: 'Update on Your Instructor Application — Instructor Enrollment',
                message: buildEmailHtml({
                    title: `Hi ${data.trainer_name},`,
                    preheader: 'Application Status Update',
                    accentColor: '#dc2626',
                    branding: 'Instructor Enrollment',
                    bodyHtml: `
                        <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 16px;">
                            Thank you for your interest in joining as an instructor.
                            After careful review, we are unable to proceed with your application at this time.
                        </p>
                        ${rejection_reason ? `
                        <div style="background:#fef2f2;border-left:4px solid #dc2626;border-radius:6px;padding:14px 16px;margin-bottom:16px;">
                            <p style="margin:0;color:#7f1d1d;font-size:13px;font-weight:600;">Reason:</p>
                            <p style="margin:6px 0 0;color:#991b1b;font-size:13px;">${rejection_reason}</p>
                        </div>` : ''}
                        <p style="color:#475569;font-size:13px;margin:0;">
                            We appreciate your time and encourage you to apply again in the future.
                        </p>`
                })
            });
        } catch (emailErr) {
            console.warn('Trainer rejection email failed:', emailErr.message);
        }

        res.json({ success: true, message: 'Instructor enrollment rejected.' });
    } catch (error) {
        console.error('Error rejecting instructor enrollment:', error);
        res.status(500).json({ error: 'Failed to reject enrollment request.' });
    }
};
