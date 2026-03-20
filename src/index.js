const express = require('express');
const { initSchemas } = require('./db.js');
const { BankAccount } = require('./events.js');
const { loadEvents, saveEvents } = require('./eventstore.js');

const app = express();
const port = process.env.APIPORT || 8080;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Bank Event Vault API - ES/CQRS Ready' });
});

// FIXED COMMAND: Create Account
app.post('/api/accounts', async (req, res) => {
  try {
    const { accountId, ownerName, initialBalance = 0, currency = 'USD' } = req.body;
    
    if (!accountId || !ownerName) {
      return res.status(400).json({ error: 'Missing accountId or ownerName' });
    }

    // Load existing events to check if account exists
    const existingEvents = await loadEvents(accountId);
    
    // If ANY events exist = account already created
    if (existingEvents.length > 0) {
      return res.status(409).json({ error: 'Account already exists' });
    }

    // Create NEW account (no history)
    const account = new BankAccount();
    account.accountId = accountId;
    account.ownerName = ownerName;
    
    // Execute create command
    const newEvents = account.create(initialBalance);
    
    // Save to event store
    await saveEvents(accountId, newEvents);
    
    res.status(202).json({ 
      message: 'Account created successfully',
      accountId,
      events: newEvents.length 
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: error.message });
  }
});

const startServer = async () => {
  try {
    await initSchemas();
    console.log('✅ All schemas created');
    
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start:', error.message);
    process.exit(1);
  }
};

startServer();