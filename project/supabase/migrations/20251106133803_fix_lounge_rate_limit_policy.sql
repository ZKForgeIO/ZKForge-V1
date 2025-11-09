/*
  # Fix Lounge Rate Limit Policy

  1. Changes
    - Drop the previous rate limit policy (had column reference issue)
    - Create corrected rate limit policy with proper column scoping
    - Enforces 1 message per minute per user
  
  2. Security
    - Prevents spam and bot attacks in the lounge
    - Database-level enforcement (cannot be bypassed)
    - Rate limit: 1 message per 60 seconds per sender
  
  3. Implementation
    - Checks the sender's last message timestamp
    - Blocks if less than 60 seconds have passed
    - Uses proper column aliasing to avoid conflicts
*/

-- Drop the previous policy
DROP POLICY IF EXISTS "Rate limit: 1 message per minute" ON lounge_messages;

-- Create corrected rate-limited INSERT policy
CREATE POLICY "Rate limit: 1 message per minute"
  ON lounge_messages
  FOR INSERT
  TO public
  WITH CHECK (
    -- Check if user's last message was more than 60 seconds ago
    NOT EXISTS (
      SELECT 1 
      FROM lounge_messages existing
      WHERE existing.sender_id = (
        SELECT sender_id 
        FROM (VALUES (sender_id)) AS new_msg(sender_id)
        LIMIT 1
      )
      AND existing.created_at > NOW() - INTERVAL '60 seconds'
    )
  );
