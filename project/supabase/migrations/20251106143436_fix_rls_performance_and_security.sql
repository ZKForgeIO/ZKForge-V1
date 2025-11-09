/*
  # Fix RLS Performance and Security Issues
  
  1. Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in all policies
    - This prevents re-evaluation for each row, improving performance at scale
    
  2. Security Fixes
    - Add search_path to all functions to prevent search path manipulation
    - Remove unused indexes to reduce maintenance overhead
  
  3. Tables Updated
    - zk_auth_sessions: 4 policies optimized
    - transactions: 3 policies optimized
    - Functions: 3 functions secured with search_path
    - Indexes: Unused indexes removed
  
  4. Impact
    - Better query performance on large datasets
    - Protected against search path attacks
    - Reduced database maintenance overhead
*/

-- ==================================================================
-- FIX RLS POLICIES FOR zk_auth_sessions
-- ==================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own sessions" ON zk_auth_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON zk_auth_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON zk_auth_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON zk_auth_sessions;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view their own sessions"
  ON zk_auth_sessions
  FOR SELECT
  TO public
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create their own sessions"
  ON zk_auth_sessions
  FOR INSERT
  TO public
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own sessions"
  ON zk_auth_sessions
  FOR UPDATE
  TO public
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own sessions"
  ON zk_auth_sessions
  FOR DELETE
  TO public
  USING (user_id = (select auth.uid()));

-- ==================================================================
-- FIX RLS POLICIES FOR transactions
-- ==================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can read own transactions"
  ON transactions
  FOR SELECT
  TO public
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own transactions"
  ON transactions
  FOR INSERT
  TO public
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  TO public
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ==================================================================
-- FIX FUNCTION SEARCH PATHS
-- ==================================================================

-- Fix update_updated_at_column function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix cleanup_expired_sessions function
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM zk_auth_sessions
  WHERE expires_at < NOW();
END;
$$;

-- Fix update_transactions_updated_at function
DROP FUNCTION IF EXISTS update_transactions_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers that were dropped with CASCADE
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at_trigger ON transactions;
CREATE TRIGGER update_transactions_updated_at_trigger
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transactions_updated_at();

-- ==================================================================
-- REMOVE UNUSED INDEXES
-- ==================================================================

-- Remove unused conversation and message indexes
DROP INDEX IF EXISTS idx_conversation_participants_conversation;
DROP INDEX IF EXISTS idx_conversation_participants_user;
DROP INDEX IF EXISTS idx_messages_conversation;
DROP INDEX IF EXISTS idx_messages_sender;

-- Remove unused zk_auth_sessions indexes
DROP INDEX IF EXISTS idx_zk_auth_sessions_user;
DROP INDEX IF EXISTS idx_zk_auth_sessions_token;
DROP INDEX IF EXISTS idx_zk_auth_sessions_active;

-- Remove unused lounge indexes (lounge is temporarily disabled)
DROP INDEX IF EXISTS idx_lounge_messages_created_at;
DROP INDEX IF EXISTS idx_lounge_messages_sender_id;

-- Remove unused transaction indexes
DROP INDEX IF EXISTS idx_transactions_status;
DROP INDEX IF EXISTS idx_transactions_type;

-- Note: If these tables grow and queries become slow, we can re-add 
-- indexes based on actual query patterns in production

-- ==================================================================
-- SUMMARY
-- ==================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies optimized for performance';
  RAISE NOTICE '✅ Function search paths secured';
  RAISE NOTICE '✅ Unused indexes removed';
  RAISE NOTICE '✅ All security issues resolved';
END $$;
