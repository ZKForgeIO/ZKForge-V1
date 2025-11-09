/*
  # Drop Foreign Key Constraint from Profiles Table

  ## Overview
  Removes the foreign key constraint profiles_id_fkey that references auth.users.
  This is required for custom ZK authentication without Supabase Auth.

  ## Changes
  - Drop profiles_id_fkey constraint
  - Profiles table will now use standalone UUIDs
*/

-- Drop the foreign key constraint directly
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Verify the constraint is gone
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_id_fkey'
  ) THEN
    RAISE EXCEPTION 'Failed to drop profiles_id_fkey constraint';
  END IF;
END $$;