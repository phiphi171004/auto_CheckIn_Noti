-- Migration: Add email column to accounts table
-- Date: 2026-10-28

-- Add email column if not exists
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create index for email lookup (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);

COMMENT ON COLUMN accounts.email IS 'Email address from Google OAuth or user profile';
