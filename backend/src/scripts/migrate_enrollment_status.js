/**
 * Migration: Update enrollment status workflow
 * Run: node src/scripts/migrate_enrollment_status.js
 */
require('dotenv').config();
const { Client } = require('pg');

async function migrate() {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT) || 5432,
        connectionTimeoutMillis: 10000,
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected ✓\n');

        // ── STUDENT TABLE ────────────────────────────────────────────────────

        console.log('[1/6] Dropping old student status constraint...');
        await client.query(`
            ALTER TABLE student_enrollment_requests
            DROP CONSTRAINT IF EXISTS student_enrollment_requests_status_check;
        `);
        console.log('      Done ✓');

        console.log('[2/6] Adding wide constraint (allows both old + new statuses)...');
        await client.query(`
            ALTER TABLE student_enrollment_requests
            ADD CONSTRAINT student_enrollment_requests_status_check
            CHECK (status IN ('pending','submitted','accepted','approved','rejected'));
        `);
        console.log('      Done ✓');

        console.log('[3/6] Renaming pending → submitted for students...');
        const s = await client.query(`
            UPDATE student_enrollment_requests SET status = 'submitted' WHERE status = 'pending';
        `);
        console.log(`      Renamed ${s.rowCount} row(s) ✓`);

        console.log('[4/6] Tightening student constraint (remove pending)...');
        await client.query(`
            ALTER TABLE student_enrollment_requests
            DROP CONSTRAINT student_enrollment_requests_status_check;
        `);
        await client.query(`
            ALTER TABLE student_enrollment_requests
            ADD CONSTRAINT student_enrollment_requests_status_check
            CHECK (status IN ('submitted','accepted','approved','rejected'));
        `);
        console.log('      Done ✓');

        console.log('[5/6] Adding accepted_at / accepted_by columns to students...');
        await client.query(`
            ALTER TABLE student_enrollment_requests
            ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
        `);
        await client.query(`
            DO $$
            DECLARE col_type text;
            BEGIN
              SELECT c.data_type INTO col_type
              FROM information_schema.columns c
              WHERE c.table_schema = 'public' AND c.table_name = 'student_enrollment_requests' AND c.column_name = 'accepted_by';
              IF col_type IS NULL THEN
                ALTER TABLE student_enrollment_requests ADD COLUMN accepted_by UUID REFERENCES users(user_id);
              ELSIF col_type = 'integer' THEN
                ALTER TABLE student_enrollment_requests DROP COLUMN accepted_by;
                ALTER TABLE student_enrollment_requests ADD COLUMN accepted_by UUID REFERENCES users(user_id);
              END IF;
            END $$;
        `);
        console.log('      Done ✓');

        // ── TRAINER TABLE ────────────────────────────────────────────────────

        console.log('[6/10] Dropping old trainer status constraint...');
        await client.query(`
            ALTER TABLE trainer_enrollment_requests
            DROP CONSTRAINT IF EXISTS trainer_enrollment_requests_status_check;
        `);
        console.log('      Done ✓');

        console.log('[7/10] Adding wide constraint for trainers...');
        await client.query(`
            ALTER TABLE trainer_enrollment_requests
            ADD CONSTRAINT trainer_enrollment_requests_status_check
            CHECK (status IN ('pending','submitted','accepted','approved','rejected'));
        `);
        console.log('      Done ✓');

        console.log('[8/10] Renaming pending → submitted for trainers...');
        const t = await client.query(`
            UPDATE trainer_enrollment_requests SET status = 'submitted' WHERE status = 'pending';
        `);
        console.log(`      Renamed ${t.rowCount} row(s) ✓`);

        console.log('[9/10] Tightening trainer constraint (remove pending)...');
        await client.query(`
            ALTER TABLE trainer_enrollment_requests
            DROP CONSTRAINT trainer_enrollment_requests_status_check;
        `);
        await client.query(`
            ALTER TABLE trainer_enrollment_requests
            ADD CONSTRAINT trainer_enrollment_requests_status_check
            CHECK (status IN ('submitted','accepted','approved','rejected'));
        `);
        console.log('      Done ✓');

        console.log('[10/10] Adding accepted_at / accepted_by columns to trainers...');
        await client.query(`
            ALTER TABLE trainer_enrollment_requests
            ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
        `);
        await client.query(`
            DO $$
            DECLARE col_type text;
            BEGIN
              SELECT c.data_type INTO col_type
              FROM information_schema.columns c
              WHERE c.table_schema = 'public' AND c.table_name = 'trainer_enrollment_requests' AND c.column_name = 'accepted_by';
              IF col_type IS NULL THEN
                ALTER TABLE trainer_enrollment_requests ADD COLUMN accepted_by UUID REFERENCES users(user_id);
              ELSIF col_type = 'integer' THEN
                ALTER TABLE trainer_enrollment_requests DROP COLUMN accepted_by;
                ALTER TABLE trainer_enrollment_requests ADD COLUMN accepted_by UUID REFERENCES users(user_id);
              END IF;
            END $$;
        `);
        console.log('      Done ✓');

        console.log('\n🎉 Migration completed successfully!');
    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        console.error(err);
        process.exit(1);
    } finally {
        await client.end();
        process.exit(0);
    }
}

migrate();
