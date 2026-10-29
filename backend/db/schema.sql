-- Piggi Auto Check-in Database Schema

-- Table: accounts
-- Stores user accounts with credentials and tokens
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  device_id VARCHAR(50) NOT NULL,
  
  -- Tokens
  jwt_token TEXT,
  firebase_token TEXT,
  
  -- Settings
  cron_schedule VARCHAR(50) DEFAULT '0 6 * * *',
  is_active BOOLEAN DEFAULT true,
  
  -- User info from API
  user_id INTEGER,
  user_name VARCHAR(255),
  current_coin INTEGER DEFAULT 0,
  pending_coin INTEGER DEFAULT 0,
  accumulated_coin INTEGER DEFAULT 0,
  current_checkin INTEGER DEFAULT 0,
  rank_name VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  last_checkin_at TIMESTAMP
);

-- Table: checkin_history
-- Stores all check-in attempts
CREATE TABLE IF NOT EXISTS checkin_history (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  
  -- Check-in result
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  -- Snapshot of user data at time of check-in
  coin_before INTEGER,
  coin_after INTEGER,
  checkin_streak INTEGER,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  is_scheduled BOOLEAN DEFAULT false
);

-- Table: api_logs
-- Stores API call logs for debugging
CREATE TABLE IF NOT EXISTS api_logs (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
  
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER,
  response_time INTEGER, -- milliseconds
  
  error TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_phone ON accounts(phone_number);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_checkin_history_account ON checkin_history(account_id);
CREATE INDEX IF NOT EXISTS idx_checkin_history_created ON checkin_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_account ON api_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at DESC);

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto update updated_at
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default account from .env (if exists)
-- This will be handled by the migration script
