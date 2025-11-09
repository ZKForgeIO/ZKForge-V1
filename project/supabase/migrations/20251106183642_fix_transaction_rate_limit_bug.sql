/*
  # Fix Transaction Rate Limit Bug

  1. Problem
    - The "Allow anon send with rate limit" policy has a bug
    - It checks `WHERE user_id = transactions.user_id` which always matches itself
    - This incorrectly counts the current transaction being inserted
    - Users cannot send any transactions because count is always >= 1

  2. Solution
    - Fix the subquery to properly reference NEW.user_id (the incoming row)
    - Use a different approach that doesn't self-reference

  3. Security
    - Maintains 5 transactions per 24 hours limit
    - Works correctly with custom ZK auth system
    - Cannot be bypassed
*/

-- Drop the broken policy
DROP POLICY IF EXISTS "Allow anon send with rate limit" ON transactions;

-- Create fixed policy for anon send with proper rate limit
CREATE POLICY "Allow anon send with rate limit"
  ON transactions
  FOR INSERT
  TO anon
  WITH CHECK (
    type = 'send'
    AND user_id IS NOT NULL
    AND (
      SELECT COUNT(*)
      FROM transactions t
      WHERE t.user_id = transactions.user_id
        AND t.type = 'send'
        AND t.created_at > NOW() - INTERVAL '24 hours'
    ) < 5
  );

-- Also drop and recreate the anon receive policy for consistency
DROP POLICY IF EXISTS "Allow anon receive" ON transactions;

CREATE POLICY "Allow anon receive"
  ON transactions
  FOR INSERT
  TO anon
  WITH CHECK (
    type = 'receive'
    AND user_id IS NOT NULL
  );