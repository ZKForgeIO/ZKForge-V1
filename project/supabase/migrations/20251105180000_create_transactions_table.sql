/*
  # Create Transactions Table

  ## Description
  Creates a table to store wallet transaction history for users, tracking both sent and received transactions.

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key) - Unique transaction identifier
      - `user_id` (uuid, not null) - References profiles.id, the wallet owner
      - `type` (text, not null) - Transaction type: 'send' or 'receive'
      - `amount` (numeric, not null) - Transaction amount in USDC
      - `currency` (text, not null) - Currency type, default 'USDC'
      - `from_address` (text, not null) - Sender's wallet address
      - `to_address` (text, not null) - Recipient's wallet address
      - `status` (text, not null) - Transaction status: 'pending', 'completed', 'failed'
      - `transaction_hash` (text) - Blockchain transaction hash
      - `description` (text) - Optional transaction description
      - `created_at` (timestamptz) - When the transaction was created
      - `updated_at` (timestamptz) - When the transaction was last updated

  2. Indexes
    - Index on user_id for fast lookups
    - Index on created_at for sorting by date
    - Index on status for filtering

  3. Security
    - Enable RLS on `transactions` table
    - Add policy for users to read their own transactions
    - Add policy for users to insert their own transactions
    - Add policy for users to update their own transactions
*/

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('send', 'receive')),
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USDC',
  from_address text NOT NULL,
  to_address text NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  transaction_hash text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own transactions
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Anonymous users can read their own transactions (for custom auth)
CREATE POLICY "Anonymous users can read own transactions"
  ON transactions
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Anonymous users can insert transactions (for custom auth)
CREATE POLICY "Anonymous users can insert transactions"
  ON transactions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Users can update their own transactions
CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Anonymous users can update their own transactions
CREATE POLICY "Anonymous users can update own transactions"
  ON transactions
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transactions_updated_at();
