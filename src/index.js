// console.log("DB URL =>", process.env.DATABASE_URL);
// const express = require('express');
// const { initSchemas } = require('./db.js');
// // const { BankAccount } = require('./events/eventstore.js');
// const { BankAccount } = require('./domain/BankAccount.js');
// const { loadEvents, saveEvents } = require('./events/eventstore.js');
// const { pool } = require('./db');
// const app = express();
// const port = process.env.API_PORT || 8080;

// app.use(express.json());

// app.get('/health', (req, res) => {
//   res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
// });

// app.get('/api', (req, res) => {
//   res.json({ message: 'Bank Event Vault API - ES/CQRS Ready' });
// });

// // FIXED COMMAND: Create Account
// app.post('/api/accounts', async (req, res) => {
//   try {
//     const { accountId, ownerName, initialBalance = 0, currency = 'USD' } = req.body;
    
//     if (!accountId || !ownerName) {
//       return res.status(400).json({ error: 'Missing accountId or ownerName' });
//     }

//     // Load existing events to check if account exists
//     const existingEvents = await loadEvents(accountId);
    
//     // If ANY events exist = account already created
//     if (existingEvents.length > 0) {
//       return res.status(409).json({ error: 'Account already exists' });
//     }

//     // Create NEW account (no history)
//     const account = new BankAccount();
//     account.accountId = accountId;
//     account.ownerName = ownerName;
    
//     // Execute create command
//     const newEvents = account.create(initialBalance);
    
//     // Save to event store
//     await saveEvents(accountId, newEvents);
    
//     res.status(202).json({ 
//       message: 'Account created successfully',
//       accountId,
//       events: newEvents.length 
//     });
//   } catch (error) {
//     console.error('Create account error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });
// app.get('/api/events/:id', async (req, res) => {
//   const events = await loadEvents(req.params.id);
//   res.json(events);
// });
// app.get('/api/accounts/:id', async (req, res) => {
//   try {
//     const result = await pool.query(
//       'SELECT * FROM accounts_view WHERE accountid = $1',
//       [req.params.id]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: "Account not found" });
//     }

//     res.json(result.rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
// app.post('/api/accounts/:id/deposit', async (req, res) => {
//   try {
//     const { amount } = req.body;
//     const accountId = req.params.id;

//     const events = await loadEvents(accountId);

//     if (events.length === 0) {
//       return res.status(404).json({ error: "Account not found" });
//     }

//     const account = new BankAccount();
//     account.replay(events);   // ✅ CRITICAL LINE

//     const newEvents = account.deposit(amount);

//     await saveEvents(accountId, newEvents, events.length);

//     res.json({ 
//       message: "Deposit successful",
//       balance: account.balance + amount   // optional preview
//     });

//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });
// app.post('/api/accounts/:id/withdraw', async (req, res) => {
//   try {
//     const { amount } = req.body;
//     const accountId = req.params.id;

//     const events = await loadEvents(accountId);

//     if (events.length === 0) {
//       return res.status(404).json({ error: "Account not found" });
//     }

//     const account = new BankAccount();
//     account.replay(events);   // ✅ CRITICAL

//     const newEvents = account.withdraw(amount);

//     await saveEvents(accountId, newEvents, events.length);

//     res.json({ 
//       message: "Withdraw successful",
//       balance: account.balance - amount
//     });

//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });
// const startServer = async () => {
//   try {
//     await initSchemas();
//     console.log('✅ All schemas created');
    
//     app.listen(port, '0.0.0.0', () => {
//       console.log(`🚀 Server running on port ${port}`);
//     });
//   } catch (error) {
//     console.error('❌ Failed to start:', error.message);
//     process.exit(1);
//   }
// };

// startServer();
const express = require('express');
const { pool, initSchemas } = require('./db');
const { BankAccount } = require('./domain/BankAccount');
const { loadEvents, saveEvents } = require('./events/eventstore');

console.log("DB URL =>", process.env.DATABASE_URL);

const app = express();
const port = process.env.API_PORT || 8080;

app.use(express.json());

/* ---------------- HEALTH ---------------- */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Bank Event Vault API - ES/CQRS Ready' });
});

/* ---------------- CREATE ACCOUNT ---------------- */
app.post('/api/accounts', async (req, res) => {
  try {
    const { accountId, ownerName, initialBalance = 0 } = req.body;

    if (!accountId || !ownerName) {
      return res.status(400).json({ error: 'Missing accountId or ownerName' });
    }

    const existingEvents = await loadEvents(accountId);
    if (existingEvents.length > 0) {
      return res.status(409).json({ error: 'Account already exists' });
    }

    const account = new BankAccount();
    account.accountId = accountId;
    account.ownerName = ownerName;

    const newEvents = account.create(initialBalance);

    await saveEvents(accountId, newEvents);

    res.status(201).json({
      message: 'Account created successfully',
      accountId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- EVENTS ---------------- */
app.get('/api/events/:id', async (req, res) => {
  try {
    const events = await loadEvents(req.params.id);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- READ MODEL ---------------- */
app.get('/api/accounts/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM accounts_view WHERE accountid = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- DEPOSIT ---------------- */
app.post('/api/accounts/:id/deposit', async (req, res) => {
  try {
    const { amount } = req.body;
    const accountId = req.params.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const events = await loadEvents(accountId);
    if (events.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    const account = new BankAccount();
    account.replay(events);

    const newEvents = account.deposit(amount);

    await saveEvents(accountId, newEvents, events.length);

    res.json({ message: "Deposit successful" });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ---------------- WITHDRAW ---------------- */
app.post('/api/accounts/:id/withdraw', async (req, res) => {
  try {
    const { amount } = req.body;
    const accountId = req.params.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const events = await loadEvents(accountId);
    if (events.length === 0) {
      return res.status(404).json({ error: "Account not found" });
    }

    const account = new BankAccount();
    account.replay(events);

    const newEvents = account.withdraw(amount);

    await saveEvents(accountId, newEvents, events.length);

    res.json({ message: "Withdraw successful" });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* ---------------- START SERVER ---------------- */
const startServer = async () => {
  try {
    await initSchemas();
    console.log('✅ DB Ready');

    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${port}`);
    });

  } catch (error) {
    console.error('❌ Failed to start:', error.message);
    process.exit(1);
  }
};

startServer();