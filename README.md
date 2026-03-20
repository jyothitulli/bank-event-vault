# 🏦 Bank Event Vault (Event Sourcing + CQRS)

## 🚀 Overview

This project is a simple banking system built using **Event Sourcing and CQRS architecture**.

Instead of storing just the current state (like traditional CRUD apps), this system stores every action as an **event**.  
This makes the system more transparent, auditable, and flexible.

---

## 💡 Why this project?

Most beginner projects use basic CRUD operations.  
I wanted to go beyond that and implement something closer to **real-world backend systems**.

This project demonstrates:
- How to design an event-driven system
- How to separate read and write models (CQRS)
- How to handle concurrency safely

---

## 🧠 Key Concepts Used

### 1. Event Sourcing
All changes are stored as events:
- `AccountCreated`
- `MoneyDeposited`
- `MoneyWithdrawn`

Instead of updating a row, we append a new event.

---

### 2. CQRS (Command Query Responsibility Segregation)

The system is split into:

- **Command side (Write)**  
  Handles actions like create, deposit, withdraw

- **Query side (Read)**  
  Uses a separate table (`accounts_view`) for fast reads

---

### 3. Optimistic Concurrency Control

To prevent conflicts (like double deposits),  
we track event versions and validate before saving.

---

## ⚙️ Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Docker

---

## 📂 Project Structure
src/
├── domain/
│ └── BankAccount.js
├── events/
│ └── eventstore.js
├── db.js
├── index.js

## 🧪 Example Flow
# Create account
curl -X POST http://localhost:8080/api/accounts \
-H "Content-Type: application/json" \
-d '{"accountId":"acc-1","ownerName":"Pandoo","initialBalance":100}'

# Deposit
curl -X POST http://localhost:8080/api/accounts/acc-1/deposit \
-H "Content-Type: application/json" \
-d '{"amount":50}'

# Withdraw
curl -X POST http://localhost:8080/api/accounts/acc-1/withdraw \
-H "Content-Type: application/json" \
-d '{"amount":30}'

# View events
curl http://localhost:8080/api/events/acc-1

# View balance
curl http://localhost:8080/api/accounts/acc-1

Running with Docker
docker-compose up --build

Final Thoughts
This project helped me understand how real systems are designed beyond simple CRUD operations.
It gave me hands-on experience with scalable backend patterns used in production systems.