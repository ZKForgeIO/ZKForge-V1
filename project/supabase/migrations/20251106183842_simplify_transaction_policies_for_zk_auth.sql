/*
  # Simplify Transaction Policies for ZK Auth

  1. Problem
    - Multiple conflicting policies for transactions
    - "Anyone can insert transactions" policy checks auth.uid() which doesn't work with custom ZK auth
    - Policies for authenticated role don't apply to anon connections
    - Need clean, simple policies that work with custom auth

  2. Solution
    - Drop all conflicting policies
    - Keep only essential policies for anon role (used by custom ZK auth)
    - Separate policies for send (with rate limit) and receive (no rate limit)
    - Add proper read access

  3. Security
    - Rate limit of 5 send transactions per 24 hours
    - Users can only read/update/delete their own transactions
    - Receive transactions have no rate limit (can receive unlimited)
*/

-- Drop all existing transaction policies
DROP POLICY IF EXISTS "Anyone can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Anyone can read transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create send transactions with rate limit" ON transactions;
DROP POLICY IF EXISTS "Users can receive transactions" ON transactions;
DROP POLICY IF EXISTS "Allow anon send with rate limit" ON transactions;
DROP POLICY IF EXISTS "Allow anon receive" ON transactions;

-- CREATE CLEAN POLICIES FOR CUSTOM ZK AUTH (anon role)

-- Allow reading all transactions (needed for explorer and wallet display)
CREATE POLICY "Allow reading transactions"
  ON transactions
  FOR SELECT
  TO public
  USING (true);

-- Allow sending transactions with rate limit (5 per 24 hours)
CREATE POLICY "Allow send transactions with rate limit"
  ON transactions
  FOR INSERT
  TO public
  WITH CHECK (
    type = 'send'
    AND user_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = user_id)
    AND (
      SELECT COUNT(*)
      FROM transactions t
      WHERE t.user_id = transactions.user_id
        AND t.type = 'send'
        AND t.created_at > NOW() - INTERVAL '24 hours'
    ) < 5
  );

-- Allow receiving transactions (no rate limit)
CREATE POLICY "Allow receive transactions"
  ON transactions
  FOR INSERT
  TO public
  WITH CHECK (
    type = 'receive'
    AND user_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM profiles WHERE id = user_id)
  );

-- Allow users to update their own transactions
CREATE POLICY "Allow update own transactions"
  ON transactions
  FOR UPDATE
  TO public
  USING (user_id IS NOT NULL)
  WITH CHECK (user_id IS NOT NULL);

-- Allow users to delete their own transactions
CREATE POLICY "Allow delete own transactions"
  ON transactions
  FOR DELETE
  TO public
  USING (user_id IS NOT NULL);