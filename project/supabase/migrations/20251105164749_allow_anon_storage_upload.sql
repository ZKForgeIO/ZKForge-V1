/*
  # Allow Anonymous Storage Uploads for Custom Auth

  1. Changes
    - Update storage policies to allow anon role (since we use custom auth)
    - Application layer ensures users only upload to their own folders
    - Maintain public read access
  
  2. Security
    - Public read access maintained
    - Anonymous users can upload (app handles authorization)
    - File paths include user_id for organization
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access for profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete profile pictures" ON storage.objects;

-- Allow anyone to view profile pictures (public bucket)
CREATE POLICY "Public read access for profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Allow anon users to upload profile pictures (app handles auth)
CREATE POLICY "Allow profile picture uploads"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow anon users to update profile pictures
CREATE POLICY "Allow profile picture updates"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'profile-pictures')
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow anon users to delete profile pictures
CREATE POLICY "Allow profile picture deletes"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'profile-pictures');