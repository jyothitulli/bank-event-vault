CREATE TABLE snapshots (
  snapshot_id UUID PRIMARY KEY,
  aggregate_id VARCHAR(255) UNIQUE NOT NULL,
  snapshot_data JSONB NOT NULL,
  last_event_number INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);