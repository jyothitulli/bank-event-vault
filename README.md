# Bank Account Management System with Event Sourcing and CQRS

This is a backend API implementing Event Sourcing (ES) and Command Query Responsibility Segregation (CQRS) for managing bank accounts. It uses Docker, PostgreSQL, and Node.js.

## Quick Start

1. Copy `.env.example` to `.env` and update values.
2. Run `docker-compose up --build`.
3. API available at `http://localhost:8080`.

## Endpoints

- Commands: POST /api/accounts (create), /api/accounts/:id/deposit, etc.
- Queries: GET /api/accounts/:id, /api/accounts/:id/transactions, etc.

See project spec for full details.