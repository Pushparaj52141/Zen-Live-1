const pool = require('../config/db');

async function updateSchema() {
    try {
        console.log('Updating schema for enrollment requests...');

        // Update student_enrollment_requests
        await pool.query(`
      ALTER TABLE student_enrollment_requests 
      ADD COLUMN IF NOT EXISTS school_college_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS photo_url TEXT;
    `);
        console.log('Updated student_enrollment_requests table.');

        // Update trainer_enrollment_requests
        await pool.query(`
      ALTER TABLE trainer_enrollment_requests 
      ADD COLUMN IF NOT EXISTS employee_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS photo_url TEXT;
    `);
        console.log('Updated trainer_enrollment_requests table.');

        console.log('Schema update completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating schema:', err);
        process.exit(1);
    }
}

updateSchema();
