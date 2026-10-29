-- Set database timezone to Vietnam (UTC+7)
-- Run this once to set timezone for the database session

SET timezone = 'Asia/Ho_Chi_Minh';

-- Verify timezone
SHOW timezone;

-- This affects all timestamp columns going forward
-- Existing timestamps remain in UTC but will be displayed in VN time
