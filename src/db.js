const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initSchemas() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      aggregateid TEXT,
      aggregatetype TEXT,
      eventtype TEXT,
      eventdata JSONB,
      eventnumber INT
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts_view (
      accountid TEXT PRIMARY KEY,
      ownername TEXT,
      balance NUMERIC,
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

module.exports = { pool, initSchemas };