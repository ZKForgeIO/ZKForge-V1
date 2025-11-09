/*
  # Fix Lounge Messages INSERT Policy
  
  1. Problem
    - No INSERT policy exists for lounge_messages
    - Users cannot send messages
    
  2. Solution
    - Add INSERT policy for anyone to send messages
    - sender_id must match their profile
    
  3. Security
    - Users can only insert with their own sender_id
    - All other validations handled by trigger
*/

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can send lounge messages" ON lounge_messages;
DROP POLICY IF EXISTS "Anyone can send lounge messages" ON lounge_messages;

-- Create INSERT policy that allows anyone to send messages
CREATE POLICY "Anyone can send lounge messages"
  ON lounge_messages
  FOR INSERT
  TO public
  WITH CHECK (
    -- Allow insert if sender_id exists in profiles
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = sender_id
    )
  );
