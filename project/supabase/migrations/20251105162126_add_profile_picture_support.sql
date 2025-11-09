/*
  # Add Profile Picture Support

  1. Changes
    - Add `profile_picture_url` column to `profiles` table
      - Stores the URL of the user's profile picture
      - Nullable (users can have no profile picture)
      - Text type for flexibility with various storage solutions
    
  2. Security
    - Update existing RLS policies to include profile_picture_url in select operations
    - Users can view all profile pictures (public data)
    - Users can only update their own profile picture
*/

-- Add profile_picture_url column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_picture_url text;
  END IF;
END $$;

-- RLS policies are already in place from previous migrations
-- The existing policies will automatically include the new column
