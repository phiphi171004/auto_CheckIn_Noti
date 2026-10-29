-- Fix phone_number unique constraint to allow multiple NULL values
-- This is needed for Google login accounts that may not have phone numbers

-- Step 1: Drop existing unique constraint
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_phone_number_key;

-- Step 2: Make phone_number nullable
ALTER TABLE accounts ALTER COLUMN phone_number DROP NOT NULL;

-- Step 3: Create partial unique index (only for non-NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS accounts_phone_number_unique 
  ON accounts(phone_number) 
  WHERE phone_number IS NOT NULL;

-- Now multiple accounts can have phone_number = NULL without conflict
