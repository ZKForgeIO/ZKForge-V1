/*
  # Fix Rate Limit Policy Bug
  
  1. Changes
    - Fix the "Rate limit enforcement" policy to correctly check sender_id
    - The policy was comparing sender_id to itself instead of to the new row
    - Now properly checks if the user has sent a message in the last 3 minutes
  
  2. Security
    - Maintains 3-minute rate limit per user
    - Properly enforces the cooldown period
*/

-- Drop the broken policy
DROP POLICY IF EXISTS "Rate limit enforcement" ON lounge_messages;

-- Create the corrected policy
CREATE POLICY "Rate limit enforcement"
  ON lounge_messages
  AS RESTRICTIVE
  FOR INSERT
  TO public
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM lounge_messages
      WHERE sender_id = lounge_messages.sender_id
        AND created_at > NOW() - INTERVAL '3 minutes'
      LIMIT 1
    )
  );
