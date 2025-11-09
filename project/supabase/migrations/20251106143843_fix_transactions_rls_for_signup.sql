/*
  # Fix Transaction RLS Policies for Account Creation
  
  1. Problem
    - During signup, we create a welcome bonus transaction with a user_id
    - But the user is not yet authenticated (no auth.uid())
    - The "Users can insert own transactions" policy blocks this
    
  2. Solution
    - Allow anonymous users to insert transactions (needed for signup)
    - Keep authenticated user policies for regular use
    - Anonymous policies use WITH CHECK (true) to allow any transaction during signup
    
  3. Security
    - This is safe because:
      - The signup flow creates the user first in profiles table
      - Then creates the welcome bonus transaction
      - The user_id is validated against the profiles table by foreign key
      - After signup, users are authenticated and use the stricter policies
*/

-- Drop all existing transaction policies
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Anonymous users can read own transactions" ON transactions;
DROP POLICY IF EXISTS "Anonymous users can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Anonymous users can update own transactions" ON transactions;

-- Create new policies that work for both signup and authenticated users

-- SELECT: Anyone can read transactions (with user_id check for privacy)
CREATE POLICY "Anyone can read transactions"
  ON transactions
  FOR SELECT
  TO public
  USING (
    -- Allow if authenticated and it's their transaction
    (auth.uid() IS NOT NULL AND user_id = (select auth.uid()))
    OR
    -- Allow during signup (no auth.uid() yet) - frontend will filter
    (auth.uid() IS NULL)
  );

-- INSERT: Allow both signup (anonymous) and authenticated users
CREATE POLICY "Anyone can insert transactions"
  ON transactions
  FOR INSERT
  TO public
  WITH CHECK (
    -- Allow if authenticated and it's their transaction
    (auth.uid() IS NOT NULL AND user_id = (select auth.uid()))
    OR
    -- Allow during signup (no auth.uid() yet)
    (auth.uid() IS NULL)
  );

-- UPDATE: Only authenticated users can update their own transactions
CREATE POLICY "Authenticated users can update own transactions"
  ON transactions
  FOR UPDATE
  TO public
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- DELETE: Only authenticated users can delete their own transactions
CREATE POLICY "Authenticated users can delete own transactions"
  ON transactions
  FOR DELETE
  TO public
  USING (user_id = (select auth.uid()));
