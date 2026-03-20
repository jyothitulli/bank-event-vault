// Event classes
class AccountCreated {
  constructor(accountId, ownerName, initialBalance, currency) {
    this.accountId = accountId;
    this.ownerName = ownerName;
    this.initialBalance = initialBalance || 0;
    this.currency = currency || 'USD';
  }
}

class MoneyDeposited {
  constructor(transactionId, amount, description) {
    this.transactionId = transactionId;
    this.amount = amount;
    this.description = description;
  }
}

class MoneyWithdrawn {
  constructor(transactionId, amount, description) {
    this.transactionId = transactionId;
    this.amount = amount;
    this.description = description;
  }
}

class AccountClosed {
  constructor(reason) {
    this.reason = reason;
  }
}

// BankAccount Aggregate - reconstructs state from events
class BankAccount {
  constructor() {
    this.accountId = null;
    this.ownerName = '';
    this.balance = 0;
    this.currency = 'USD';
    this.status = 'OPEN';
    this.transactionIds = new Set(); // Prevent duplicate transactions
    this.version = 0;
  }

  // Apply event to current state
  apply(event) {
    switch (event.eventType) {
      case 'AccountCreated':
        this.accountId = event.data.accountId;
        this.ownerName = event.data.ownerName;
        this.balance = event.data.initialBalance;
        this.currency = event.data.currency;
        break;
      case 'MoneyDeposited':
        this.balance += event.data.amount;
        this.transactionIds.add(event.data.transactionId);
        break;
      case 'MoneyWithdrawn':
        this.balance -= event.data.amount;
        this.transactionIds.add(event.data.transactionId);
        break;
      case 'AccountClosed':
        this.status = 'CLOSED';
        break;
    }
    this.version++;
  }

  // Validate + produce new events (Command handling)
  create(initialBalance = 0) {
    if (this.accountId) throw new Error('Account already exists');
    return [{
      eventType: 'AccountCreated',
      data: new AccountCreated(this.accountId, this.ownerName, initialBalance)
    }];
  }

  deposit(amount, description, transactionId) {
    if (this.status !== 'OPEN') throw new Error('Account closed');
    if (amount <= 0) throw new Error('Amount must be positive');
    if (this.transactionIds.has(transactionId)) throw new Error('Duplicate transaction');
    
    return [{
      eventType: 'MoneyDeposited',
      data: new MoneyDeposited(transactionId, amount, description)
    }];
  }

  withdraw(amount, description, transactionId) {
    if (this.status !== 'OPEN') throw new Error('Account closed');
    if (amount <= 0) throw new Error('Amount must be positive');
    if (this.balance - amount < 0) throw new Error('Insufficient funds');
    if (this.transactionIds.has(transactionId)) throw new Error('Duplicate transaction');
    
    return [{
      eventType: 'MoneyWithdrawn',
      data: new MoneyWithdrawn(transactionId, amount, description)
    }];
  }

  close(reason) {
    if (this.status !== 'OPEN') throw new Error('Account already closed');
    if (this.balance !== 0) throw new Error('Cannot close account with balance');
    
    return [{
      eventType: 'AccountClosed',
      data: new AccountClosed(reason)
    }];
  }
}

module.exports = { BankAccount };