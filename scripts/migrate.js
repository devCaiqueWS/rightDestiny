const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'migrations.sql'), 'utf-8');
  const pool = new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await pool.query('begin');
    await pool.query(sql);
    await pool.query('commit');
    console.log('Migrations applied successfully.');
  } catch (e) {
    await pool.query('rollback');
    console.error('Migration failed:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();

