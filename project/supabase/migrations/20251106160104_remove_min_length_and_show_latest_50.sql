/*
  # Remove Minimum Character Limit and Show Latest 50 Messages

  1. Changes
    - Remove the 3-character minimum requirement from validation function
    - Update RLS policy to show all messages (not just last 3 minutes)
    - Keep messages visible permanently instead of auto-deleting
    - Allow any non-empty message (1+ characters)

  2. Security
    - Still validate max 300 characters
    - Still prevent empty messages
    - Still trim whitespace
    - Keep all other spam protections
*/

-- Update the validation function to remove 3-char minimum
CREATE OR REPLACE FUNCTION validate_lounge_message()
RETURNS TRIGGER AS $$
DECLARE
  last_message_time TIMESTAMPTZ;
  time_since_last INTERVAL;
  messages_last_hour INTEGER;
  duplicate_count INTEGER;
  repeated_char_ratio NUMERIC;
  url_count INTEGER;
  consecutive_messages INTEGER;
BEGIN
  -- Trim whitespace
  NEW.content := TRIM(NEW.content);
  
  -- Reject empty messages (minimum 1 character)
  IF LENGTH(NEW.content) < 1 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  
  -- Reject messages over 300 characters
  IF LENGTH(NEW.content) > 300 THEN
    RAISE EXCEPTION 'Message cannot exceed 300 characters';
  END IF;
  
  -- Check for duplicate messages within last minute
  SELECT COUNT(*) INTO duplicate_count
  FROM lounge_messages
  WHERE sender_id = NEW.sender_id
    AND content = NEW.content
    AND created_at > NOW() - INTERVAL '1 minute';
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Duplicate message detected. Please send a different message.';
  END IF;
  
  -- Check for repeated character spam
  WITH char_counts AS (
    SELECT 
      substring(NEW.content, i, 1) as char,
      COUNT(*) as count
    FROM generate_series(1, LENGTH(NEW.content)) i
    GROUP BY substring(NEW.content, i, 1)
    ORDER BY count DESC
    LIMIT 1
  )
  SELECT count::NUMERIC / NULLIF(LENGTH(NEW.content), 0) INTO repeated_char_ratio
  FROM char_counts;
  
  IF repeated_char_ratio > 0.4 AND LENGTH(NEW.content) > 10 THEN
    RAISE EXCEPTION 'Message contains too many repeated characters';
  END IF;
  
  -- Count URLs in message
  url_count := (LENGTH(NEW.content) - LENGTH(REPLACE(LOWER(NEW.content), 'http://', ''))) / 7 +
               (LENGTH(NEW.content) - LENGTH(REPLACE(LOWER(NEW.content), 'https://', ''))) / 8;
  
  IF url_count > 2 THEN
    RAISE EXCEPTION 'Message contains too many links';
  END IF;
  
  -- Check consecutive messages
  SELECT COUNT(*) INTO consecutive_messages
  FROM (
    SELECT sender_id
    FROM lounge_messages
    WHERE created_at > NOW() - INTERVAL '5 minutes'
    ORDER BY created_at DESC
    LIMIT 3
  ) recent
  WHERE sender_id = NEW.sender_id;
  
  IF consecutive_messages >= 3 THEN
    IF NOT EXISTS (
      SELECT 1 FROM lounge_messages
      WHERE sender_id != NEW.sender_id
        AND created_at > (
          SELECT created_at FROM lounge_messages
          WHERE sender_id = NEW.sender_id
          ORDER BY created_at DESC
          LIMIT 1
        )
    ) THEN
      RAISE EXCEPTION 'Please wait for others to respond before sending more messages';
    END IF;
  END IF;
  
  -- Check hourly message limit
  SELECT COUNT(*) INTO messages_last_hour
  FROM lounge_messages
  WHERE sender_id = NEW.sender_id
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF messages_last_hour >= 100 THEN
    RAISE EXCEPTION 'Message limit reached. Please wait before sending more messages.';
  END IF;
  
  -- Rate limiting: 3 MINUTE COOLDOWN
  SELECT created_at INTO last_message_time
  FROM lounge_messages
  WHERE sender_id = NEW.sender_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF last_message_time IS NOT NULL THEN
    time_since_last := NOW() - last_message_time;
    
    IF time_since_last < INTERVAL '3 minutes' THEN
      RAISE EXCEPTION 'Please wait % minutes before sending another message', 
        CEIL(EXTRACT(EPOCH FROM (INTERVAL '3 minutes' - time_since_last)) / 60);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policy to show ALL messages (not just last 3 minutes)
DROP POLICY IF EXISTS "Anyone can read lounge messages" ON lounge_messages;
DROP POLICY IF EXISTS "Anyone can read recent lounge messages" ON lounge_messages;

CREATE POLICY "Anyone can read lounge messages"
  ON lounge_messages
  FOR SELECT
  TO public
  USING (is_deleted = false);

-- Update the CHECK constraint to allow 1+ characters
ALTER TABLE lounge_messages
DROP CONSTRAINT IF EXISTS lounge_messages_content_length_check;

ALTER TABLE lounge_messages
ADD CONSTRAINT lounge_messages_content_length_check 
CHECK (LENGTH(TRIM(content)) >= 1 AND LENGTH(content) <= 300);
