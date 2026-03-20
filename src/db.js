const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initSchemas() {
  const client = await pool.connect();
  try {
    // Events table (Event Store)
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        eventid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        aggregateid VARCHAR(255) NOT NULL,
        aggregatetype VARCHAR(255) NOT NULL,
        eventtype VARCHAR(255) NOT NULL,
        eventdata JSONB NOT NULL,
        eventnumber INTEGER NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        version INTEGER NOT NULL DEFAULT 1,
        UNIQUE(aggregateid, eventnumber)
      );
      CREATE INDEX IF NOT EXISTS idx_events_aggregateid ON events(aggregateid);
    `);

    // Snapshots table
    await client.query(`
      CREATE TABLE IF NOT EXISTS snapshots (
        snapshotid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        aggregateid VARCHAR(255) NOT NULL UNIQUE,
        snapshotdata JSONB NOT NULL,
        lasteventnumber INTEGER NOT NULL,
        createdat TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_snapshots_aggregateid ON snapshots(aggregateid);
    `);

    // Account summaries (read model)
    await client.query(`
      CREATE TABLE IF NOT EXISTS accountsummaries (
        accountid VARCHAR(255) PRIMARY KEY,
        ownername VARCHAR(255) NOT NULL,
        balance DECIMAL(19,4) NOT NULL DEFAULT 0,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
        version BIGINT NOT NULL DEFAULT 0
      );
    `);

    // Transaction history (read model)
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactionhistory (
        transactionid VARCHAR(255) PRIMARY KEY,
        accountid VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(19,4) NOT NULL,
        description TEXT,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tx_accountid ON transactionhistory(accountid);
    `);

    console.log('✅ All schemas created');
  } finally {
    client.release();
  }
}

module.exports = { pool, initSchemas };