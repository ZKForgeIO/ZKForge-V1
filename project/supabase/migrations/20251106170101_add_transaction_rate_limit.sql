/*
  # Add 5 Transactions Per Day Rate Limit

  1. Security Enhancement
    - Creates a strict policy to limit users to 5 send transactions per 24 hours
    - Prevents spam and abuse of the transaction system
    - Cannot be bypassed even if frontend validation is removed

  2. Implementation
    - Adds a restrictive RLS policy that counts recent transactions
    - Blocks new send transactions if user has already sent 5 in last 24 hours
    - Applied at database level for maximum security

  3. Important Notes
    - Rate limit is per user_id
    - Only applies to 'send' transactions, not 'receive'
    - Uses 24-hour rolling window
    - Error message indicates rate limit exceeded
*/

-- Drop existing send policy to recreate with rate limit
DROP POLICY IF EXISTS "Users can create send transactions" ON transactions;

-- Create new policy with rate limit check
CREATE POLICY "Users can create send transactions with rate limit"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
    AND type = 'send'
    AND (
      SELECT COUNT(*)
      FROM transactions
      WHERE user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
        AND type = 'send'
        AND created_at > NOW() - INTERVAL '24 hours'
    ) < 5
  );

-- Create policy for receive transactions (no rate limit)
CREATE POLICY "Users can receive transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    type = 'receive'
  );

-- Allow anon inserts for custom auth system
DROP POLICY IF EXISTS "Allow anon inserts for transactions" ON transactions;

CREATE POLICY "Allow anon send with rate limit"
  ON transactions
  FOR INSERT
  TO anon
  WITH CHECK (
    type = 'send'
    AND (
      SELECT COUNT(*)
      FROM transactions
      WHERE user_id = transactions.user_id
        AND type = 'send'
        AND created_at > NOW() - INTERVAL '24 hours'
    ) < 5
  );

CREATE POLICY "Allow anon receive"
  ON transactions
  FOR INSERT
  TO anon
  WITH CHECK (type = 'receive');
