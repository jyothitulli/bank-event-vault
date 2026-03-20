// const { pool } = require('../db');

// async function loadEvents(aggregateId, aggregateType = 'BankAccount') {
//   const client = await pool.connect();
//   try {
//     const res = await client.query(
//       'SELECT eventtype, eventdata, eventnumber FROM events WHERE aggregateid = $1 ORDER BY eventnumber',
//       [aggregateId]
//     );
//     return res.rows;
//   } finally {
//     client.release();
//   }
// }

// async function saveEvents(aggregateId, events, expectedVersion = -1) {
//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');
    
//     // Get current version
//     const countRes = await client.query(
//       'SELECT COALESCE(MAX(eventnumber), 0) as current_version FROM events WHERE aggregateid = $1',
//       [aggregateId]
//     );
//     const currentVersion = parseInt(countRes.rows[0].current_version);
    
//     if (expectedVersion !== -1 && currentVersion !== expectedVersion) {
//       throw new Error(`Concurrency conflict: expected version ${expectedVersion}, got ${currentVersion}`);
//     }

//     // Save new events
//     const newEvents = events.map((event, index) => ({
//       aggregateid: aggregateId,
//       aggregatetype: 'BankAccount',
//       eventtype: event.eventType,
//       eventdata: event.data,
//       eventnumber: currentVersion + index + 1
//     }));

//     for (const event of newEvents) {
//       await client.query(
//         `INSERT INTO events (aggregateid, aggregatetype, eventtype, eventdata, eventnumber) 
//          VALUES ($1, $2, $3, $4, $5)`,
//         [event.aggregateid, event.aggregatetype, event.eventtype, event.eventdata, event.eventnumber]
//       );
//     }
    
//     await client.query('COMMIT');
//   } catch (error) {
//     await client.query('ROLLBACK');
//     throw error;
//   } finally {
//     client.release();
//   }
// }
// async function updateReadModel(client, event) {
//   const { aggregateid, eventtype, eventdata } = event;

//   if (eventtype === "AccountCreated") {
//     await client.query(
//       `INSERT INTO accounts_view (accountid, ownername, balance)
//        VALUES ($1, $2, $3)
//        ON CONFLICT (accountid) DO NOTHING`,
//       [aggregateid, eventdata.ownerName, eventdata.balance]
//     );
//   }

//   if (eventtype === "MoneyDeposited") {
//     await client.query(
//       `UPDATE accounts_view 
//        SET balance = balance + $1, updated_at = NOW()
//        WHERE accountid = $2`,
//       [eventdata.amount, aggregateid]
//     );
//   }

//   if (eventtype === "MoneyWithdrawn") {
//     await client.query(
//       `UPDATE accounts_view 
//        SET balance = balance - $1, updated_at = NOW()
//        WHERE accountid = $2`,
//       [eventdata.amount, aggregateid]
//     );
//   }
// }

// module.exports = { loadEvents, saveEvents };
const { pool } = require('../db');

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

    // Prepare events
    const newEvents = events.map((event, index) => ({
      aggregateid: aggregateId,
      aggregatetype: 'BankAccount',
      eventtype: event.eventType,
      eventdata: event.data,
      eventnumber: currentVersion + index + 1
    }));

    // Insert + update read model
    for (const event of newEvents) {
      await client.query(
        `INSERT INTO events (aggregateid, aggregatetype, eventtype, eventdata, eventnumber) 
         VALUES ($1, $2, $3, $4, $5)`,
        [event.aggregateid, event.aggregatetype, event.eventtype, event.eventdata, event.eventnumber]
      );

      // ✅ CRITICAL: update read model
      await updateReadModel(client, event);
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ✅ READ MODEL HANDLER
async function updateReadModel(client, event) {
  const { aggregateid, eventtype, eventdata } = event;

  if (eventtype === "AccountCreated") {
    await client.query(
      `INSERT INTO accounts_view (accountid, ownername, balance)
       VALUES ($1, $2, $3)
       ON CONFLICT (accountid) DO NOTHING`,
      [aggregateid, eventdata.ownerName, eventdata.balance]
    );
  }

  if (eventtype === "MoneyDeposited") {
    await client.query(
      `UPDATE accounts_view 
       SET balance = balance + $1, updated_at = NOW()
       WHERE accountid = $2`,
      [eventdata.amount, aggregateid]
    );
  }

  if (eventtype === "MoneyWithdrawn") {
    await client.query(
      `UPDATE accounts_view 
       SET balance = balance - $1, updated_at = NOW()
       WHERE accountid = $2`,
      [eventdata.amount, aggregateid]
    );
  }
}

module.exports = { loadEvents, saveEvents };