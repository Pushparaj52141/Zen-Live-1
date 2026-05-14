require('dotenv').config();
const { Client } = require('pg');

async function test() {
    console.log('Test start...');
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT) || 5432,
        connectionTimeoutMillis: 5000,
    });
    try {
        await client.connect();
        console.log('Connect success!');
        const res = await client.query('SELECT NOW()');
        console.log('Query success:', res.rows[0]);
    } catch (err) {
        console.error('Connect failed:', err.message);
    } finally {
        await client.end();
        console.log('Test end.');
    }
}
test();
