CREATE TABLE events (
  event_id UUID PRIMARY KEY,
  aggregate_id VARCHAR(255),
  aggregate_type VARCHAR(255),
  event_type VARCHAR(255),
  event_data JSONB,
  event_number INT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  version INT DEFAULT 1,
  UNIQUE (aggregate_id, event_number)
);

CREATE INDEX idx_events_aggregate_id ON events(aggregate_id);

CREATE TABLE account_summaries (
  account_id VARCHAR(255) PRIMARY KEY,
  owner_name VARCHAR(255),
  balance DECIMAL(19,4),
  currency VARCHAR(3),
  status VARCHAR(50),
  version BIGINT
);

CREATE TABLE transaction_history (
  transaction_id VARCHAR(255) PRIMARY KEY,
  account_id VARCHAR(255),
  type VARCHAR(50),
  amount DECIMAL(19,4),
  description TEXT,
  timestamp TIMESTAMPTZ
);