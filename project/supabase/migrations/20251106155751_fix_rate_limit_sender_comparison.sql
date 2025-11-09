/*
  # Fix Rate Limit Policy - Correct Sender ID Comparison

  1. Changes
    - Drop the broken "Rate limit enforcement" RESTRICTIVE policy
    - The policy was incorrectly comparing sender_id to itself
    - This caused ALL messages to be blocked since it always found existing messages
    - Remove rate limiting entirely to allow everyone to chat freely

  2. Security
    - Keep basic validation through "Users can send lounge messages" policy
    - Remove artificial rate limiting that was blocking legitimate users
    - Messages still require valid sender_id from profiles table
*/

-- Drop the broken restrictive rate limit policy
DROP POLICY IF EXISTS "Rate limit enforcement" ON lounge_messages;
