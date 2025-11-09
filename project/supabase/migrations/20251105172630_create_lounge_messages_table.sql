/*
  # Create Global Lounge Chat Table

  1. New Tables
    - `lounge_messages`
      - `id` (uuid, primary key) - Unique message identifier
      - `sender_id` (uuid, not null) - User who sent the message
      - `content` (text, not null) - Message content
      - `created_at` (timestamptz) - When message was created
      - `is_deleted` (boolean) - Soft delete flag
  
  2. Security
    - Enable RLS on `lounge_messages` table
    - Add policy for authenticated users to read all lounge messages
    - Add policy for authenticated users to insert their own messages
    - Add policy for users to delete only their own messages

  3. Indexes
    - Index on created_at for efficient sorting and pagination
    - Index on sender_id for sender lookups
*/

CREATE TABLE IF NOT EXISTS lounge_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_deleted boolean DEFAULT false
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_lounge_messages_created_at ON lounge_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lounge_messages_sender_id ON lounge_messages(sender_id);

-- Enable RLS
ALTER TABLE lounge_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all non-deleted lounge messages
CREATE POLICY "Authenticated users can read lounge messages"
  ON lounge_messages
  FOR SELECT
  TO authenticated
  USING (is_deleted = false);

-- Policy: Authenticated users can insert their own messages
CREATE POLICY "Authenticated users can send lounge messages"
  ON lounge_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Policy: Users can soft-delete their own messages
CREATE POLICY "Users can delete own lounge messages"
  ON lounge_messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());