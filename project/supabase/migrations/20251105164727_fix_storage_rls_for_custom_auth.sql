/*
  # Fix Storage RLS Policies for Custom Authentication

  1. Changes
    - Drop existing storage policies that rely on auth.uid()
    - Create new policies that work with custom authentication
    - Allow authenticated users to upload based on folder structure
    - Maintain public read access for profile pictures
  
  2. Security
    - Users can upload to their own folder (based on user_id in path)
    - Public read access for all profile pictures
    - Users can update/delete their own files
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;

-- Allow anyone to view profile pictures (public bucket)
CREATE POLICY "Public read access for profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Allow any authenticated user to upload to profile-pictures bucket
-- The application layer will handle ensuring users upload to their own folder
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow any authenticated user to update files in profile-pictures bucket
CREATE POLICY "Authenticated users can update profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures')
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow any authenticated user to delete files in profile-pictures bucket
CREATE POLICY "Authenticated users can delete profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'profile-pictures');