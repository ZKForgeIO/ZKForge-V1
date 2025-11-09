/*
  # Simplify Lounge Rate Limit Policy

  1. Changes
    - Drop the previous complex rate limit policy
    - Create a simpler, more efficient rate limit policy
    - Enforces 1 message per minute per user
  
  2. Security
    - Prevents spam and bot attacks in the lounge
    - Database-level enforcement (cannot be bypassed)
    - Rate limit: 1 message per 60 seconds per sender
  
  3. Implementation
    - Uses a straightforward subquery approach
    - Checks if any messages from the same sender exist within the last 60 seconds
    - If yes, blocks the insert; if no, allows it
*/

-- Drop the previous policy
DROP POLICY IF EXISTS "Rate limit: 1 message per minute" ON lounge_messages;

-- Create simplified rate-limited INSERT policy
CREATE POLICY "Rate limit: 1 message per minute"
  ON lounge_messages
  FOR INSERT
  TO public
  WITH CHECK (
    -- Block if user has sent a message in the last 60 seconds
    (
      SELECT COUNT(*) 
      FROM lounge_messages lm
      WHERE lm.sender_id = lounge_messages.sender_id
      AND lm.created_at > NOW() - INTERVAL '60 seconds'
    ) = 0
  );
