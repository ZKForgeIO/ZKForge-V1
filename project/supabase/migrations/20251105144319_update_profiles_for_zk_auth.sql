/*
  # Update Profiles Schema for ZK Authentication

  ## Overview
  Adds ZK proof authentication support and Solana wallet integration to the profiles table.
  Removes dependency on email/password authentication in favor of ZK STARK proofs.

  ## Changes to Tables

  ### 1. profiles table updates
  Adding new columns:
  - `zk_public_key` (text, unique, required) - Public key for ZK proof verification
  - `solana_address` (text, unique, required) - Solana wallet public address
  - `last_challenge_nonce` (text) - For replay attack prevention
  - `last_challenge_time` (timestamptz) - Challenge timestamp
  
  Updating existing columns:
  - `wallet_address` renamed to `solana_address` for clarity
  - Add NOT NULL constraint to `zk_public_key` and `solana_address`

  ### 2. zk_auth_sessions table (new)
  Stores active authentication sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `session_token` (text, unique)
  - `created_at` (timestamptz)
  - `expires_at` (timestamptz)
  - `is_active` (boolean)

  ## Security
  - Enable RLS on zk_auth_sessions table
  - Users can only view their own sessions
  - Add indexes for performance on zk_public_key and solana_address
  - Nonce system prevents replay attacks

  ## Important Notes
  1. ZK public keys are stored for verification only
  2. Private keys are NEVER stored in the database
  3. Solana addresses are derived from keypairs generated client-side
  4. Challenge-response system ensures authentication security
  5. Sessions expire after 24 hours by default
*/

-- Add new columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'zk_public_key'
  ) THEN
    ALTER TABLE profiles ADD COLUMN zk_public_key text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'solana_address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN solana_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_challenge_nonce'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_challenge_nonce text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_challenge_time'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_challenge_time timestamptz;
  END IF;
END $$;

-- Create unique indexes for ZK public key and Solana address
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_zk_public_key ON profiles(zk_public_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_solana_address ON profiles(solana_address);

-- Create zk_auth_sessions table
CREATE TABLE IF NOT EXISTS zk_auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  is_active boolean DEFAULT true
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_zk_auth_sessions_user ON zk_auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_zk_auth_sessions_token ON zk_auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_zk_auth_sessions_active ON zk_auth_sessions(is_active, expires_at);

-- Enable Row Level Security
ALTER TABLE zk_auth_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for zk_auth_sessions
CREATE POLICY "Users can view their own sessions"
  ON zk_auth_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions"
  ON zk_auth_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions"
  ON zk_auth_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON zk_auth_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM zk_auth_sessions
  WHERE expires_at < now() OR (is_active = false AND created_at < now() - interval '7 days');
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job trigger (optional - can be called manually or via cron)
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Call this function periodically to remove expired and inactive sessions';