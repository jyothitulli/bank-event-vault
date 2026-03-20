const { pool } = require('./db.js');

async function loadEvents(aggregateId, aggregateType = 'BankAccount') {
  const client = await pool.connect();
  try {
    const res = await client.query(
      'SELECT eventtype, eventdata, eventnumber FROM events WHERE aggregateid = $1 ORDER BY eventnumber',
      [aggregateId]
    );
    return res.rows;
  } finally {
    client.release();
  }
}

async function saveEvents(aggregateId, events, expectedVersion = -1) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get current version
    const countRes = await client.query(
      'SELECT COALESCE(MAX(eventnumber), 0) as current_version FROM events WHERE aggregateid = $1',
      [aggregateId]
    );
    const currentVersion = parseInt(countRes.rows[0].current_version);
    
    if (expectedVersion !== -1 && currentVersion !== expectedVersion) {
      throw new Error(`Concurrency conflict: expected version ${expectedVersion}, got ${currentVersion}`);
    }

    // Save new events
    const newEvents = events.map((event, index) => ({
      aggregateid: aggregateId,
      aggregatetype: 'BankAccount',
      eventtype: event.eventType,
      eventdata: event.data,
      eventnumber: currentVersion + index + 1
    }));

    for (const event of newEvents) {
      await client.query(
        `INSERT INTO events (aggregateid, aggregatetype, eventtype, eventdata, eventnumber) 
         VALUES ($1, $2, $3, $4, $5)`,
        [event.aggregateid, event.aggregatetype, event.eventtype, event.eventdata, event.eventnumber]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { loadEvents, saveEvents };