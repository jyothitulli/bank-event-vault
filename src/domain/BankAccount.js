class BankAccount {
  constructor() {
    this.accountId = null;
    this.ownerName = null;
    this.balance = 0;
  }

  create(initialBalance) {
    return [
      {
        eventType: "AccountCreated",
        data: {
          accountId: this.accountId,
          ownerName: this.ownerName,
          balance: initialBalance
        }
      }
    ];
  }

  deposit(amount) {
    if (amount <= 0) {
      throw new Error("Invalid deposit amount");
    }

    return [
      {
        eventType: "MoneyDeposited",
        data: { amount }
      }
    ];
  }

  withdraw(amount) {
    if (amount <= 0) {
      throw new Error("Invalid withdraw amount");
    }

    if (this.balance < amount) {
      throw new Error("Insufficient balance");
    }

    return [
      {
        eventType: "MoneyWithdrawn",
        data: { amount }
      }
    ];
  }
  apply(event) {
  switch (event.eventtype) {
    case "AccountCreated":
      this.accountId = event.eventdata.accountId;
      this.ownerName = event.eventdata.ownerName;
      this.balance = event.eventdata.balance;
      break;

    case "MoneyDeposited":
      this.balance += event.eventdata.amount;
      break;

    case "MoneyWithdrawn":
      this.balance -= event.eventdata.amount;
      break;
  }
}
replay(events) {
  for (const event of events) {
    this.apply(event);
  }
}
}

module.exports = { BankAccount };