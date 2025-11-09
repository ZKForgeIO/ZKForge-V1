/*
  # Emergency Spam Cleanup - Clear All Lounge Messages

  1. Purpose
    - Clear all spam messages from bot attacks (20,000+ messages)
    - Reset lounge to clean state
    - Maintain table structure and policies
  
  2. Actions
    - Temporarily disable RLS
    - Truncate all messages
    - Re-enable RLS
    - Verify cleanup
  
  3. Security
    - Rate limit policy remains active (1 msg/min)
    - All RLS policies remain in place
    - Only message data is deleted, not table structure
*/

-- Disable RLS temporarily for cleanup
ALTER TABLE lounge_messages DISABLE ROW LEVEL SECURITY;

-- Clear all messages
TRUNCATE TABLE lounge_messages RESTART IDENTITY CASCADE;

-- Re-enable RLS
ALTER TABLE lounge_messages ENABLE ROW LEVEL SECURITY;

-- Verify cleanup
DO $$
DECLARE
  msg_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO msg_count FROM lounge_messages;
  RAISE NOTICE 'Lounge messages remaining: %', msg_count;
END $$;
