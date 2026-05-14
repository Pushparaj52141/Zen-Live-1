const pool = require("../config/db");

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Starting migration: Add priority column to leads table");

        // Check if column exists
        const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='leads' AND column_name='priority';
    `);

        if (checkColumn.rowCount === 0) {
            console.log("Adding priority column...");
            await client.query(`
        ALTER TABLE leads 
        ADD COLUMN priority character varying(20) DEFAULT 'normal' 
        CHECK (priority IN ('normal', 'warm', 'hot'));
      `);
            console.log("Priority column added successfully.");
        } else {
            console.log("Priority column already exists.");
        }

    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
