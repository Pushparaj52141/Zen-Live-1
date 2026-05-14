require('dotenv').config();
const { Client } = require('pg');

async function dropConstraints() {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT) || 5432,
        connectionTimeoutMillis: 10000,
    });

    try {
        await client.connect();
        console.log('Connected to DB. Dropping status constraints to avoid PG cache/version conflict...');

        await client.query(`
            ALTER TABLE student_enrollment_requests
            DROP CONSTRAINT IF EXISTS student_enrollment_requests_status_check;
        `);
        console.log('✓ Dropped student_enrollment_requests_status_check');

        await client.query(`
            ALTER TABLE trainer_enrollment_requests
            DROP CONSTRAINT IF EXISTS trainer_enrollment_requests_status_check;
        `);
        console.log('✓ Dropped trainer_enrollment_requests_status_check');

        console.log('Done!');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}

dropConstraints();
