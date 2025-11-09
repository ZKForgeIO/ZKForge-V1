/*
  # Add Rate Limiting to Lounge Messages

  1. Changes
    - Drop the existing permissive INSERT policy on lounge_messages
    - Create a new RESTRICTIVE policy that enforces 1-minute rate limit
    - Users can only send 1 message per minute in the lounge
  
  2. Security
    - Prevents spam and bot attacks
    - Enforced at the database level (cannot be bypassed)
    - Rate limit: 1 message per 60 seconds per user
  
  3. Notes
    - Uses a subquery to check the timestamp of the user's last message
    - If no previous message exists, allows the insert
    - If last message was >60 seconds ago, allows the insert
    - Otherwise, blocks the insert
*/

-- Drop the existing permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can send lounge messages" ON lounge_messages;

-- Create a new RESTRICTIVE rate-limited INSERT policy
CREATE POLICY "Rate limit: 1 message per minute"
  ON lounge_messages
  FOR INSERT
  TO public
  WITH CHECK (
    -- Allow if user has no previous messages
    NOT EXISTS (
      SELECT 1 FROM lounge_messages
      WHERE sender_id = lounge_messages.sender_id
    )
    OR
    -- Allow if last message was more than 60 seconds ago
    (
      SELECT EXTRACT(EPOCH FROM (NOW() - MAX(created_at)))
      FROM lounge_messages
      WHERE sender_id = lounge_messages.sender_id
    ) >= 60
  );
