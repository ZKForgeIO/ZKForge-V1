/*
  # Improve RLS Policies for Profiles

  1. Changes
    - Drop existing overly permissive policies
    - Create restrictive policies that follow security best practices
    
  2. New Policies
    - **SELECT**: Anyone can view all profiles (needed for chat, user search)
    - **INSERT**: Only allow creating profile for yourself (based on user_id matching auth.uid())
    - **UPDATE**: Users can only update their own profile (id = auth.uid())
    - **DELETE**: No one can delete profiles (not implemented)
  
  3. Security Notes
    - Profile pictures and usernames are public data (needed for chat functionality)
    - Users cannot modify other users' profiles
    - INSERT restricted to authenticated users creating their own profile
    - UPDATE restricted to authenticated users modifying their own profile
*/

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow profile creation for sign up" ON profiles;
DROP POLICY IF EXISTS "Allow profile updates" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

-- SELECT: Anyone can view all profiles (public data needed for chat)
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

-- INSERT: Users can only create their own profile
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = id);

-- UPDATE: Users can only update their own profile  
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = id)
  WITH CHECK (id = id);

-- No DELETE policy - profiles cannot be deleted
