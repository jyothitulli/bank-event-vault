CREATE TABLE account_summaries (
  account_id VARCHAR(255) PRIMARY KEY,
  owner_name VARCHAR(255),
  balance DECIMAL(19,4),
  currency VARCHAR(3),
  status VARCHAR(50),
  version BIGINT
);