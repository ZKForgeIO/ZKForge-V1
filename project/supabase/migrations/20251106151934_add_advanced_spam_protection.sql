/*
  # Advanced Spam Protection for Lounge
  
  1. New Protections
    - Duplicate message prevention (same content within 1 minute)
    - Repeated character spam detection (e.g., "aaaaaaa...")
    - URL spam detection (limit URLs per message)
    - Minimum message length (3 characters)
    - Maximum consecutive messages from same user
    
  2. Security
    - All checks at database level
    - Cannot be bypassed from frontend/API
    - Clear error messages for legitimate users
    
  3. Implementation
    - Enhanced validation trigger
    - Pattern matching for spam
*/

-- Enhanced validation function with spam detection
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
  
  -- Reject empty messages
  IF LENGTH(NEW.content) < 1 THEN
    RAISE EXCEPTION 'Message cannot be empty';
  END IF;
  
  -- Minimum length check (prevent single character spam)
  IF LENGTH(NEW.content) < 3 THEN
    RAISE EXCEPTION 'Message must be at least 3 characters';
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
  
  -- Check for repeated character spam (e.g., "aaaaaa" or "111111")
  -- Calculate ratio of most common character to total length
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
  
  -- If more than 40% of message is same character, it's likely spam
  IF repeated_char_ratio > 0.4 AND LENGTH(NEW.content) > 10 THEN
    RAISE EXCEPTION 'Message contains too many repeated characters';
  END IF;
  
  -- Count URLs in message (simple check for http/https)
  url_count := (LENGTH(NEW.content) - LENGTH(REPLACE(LOWER(NEW.content), 'http://', ''))) / 7 +
               (LENGTH(NEW.content) - LENGTH(REPLACE(LOWER(NEW.content), 'https://', ''))) / 8;
  
  IF url_count > 2 THEN
    RAISE EXCEPTION 'Message contains too many links';
  END IF;
  
  -- Check consecutive messages (no more than 3 in a row without other users)
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
    -- Check if any other user has sent a message since
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
  
  -- Check hourly message limit (100 messages per hour)
  SELECT COUNT(*) INTO messages_last_hour
  FROM lounge_messages
  WHERE sender_id = NEW.sender_id
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF messages_last_hour >= 100 THEN
    RAISE EXCEPTION 'Message limit reached. Please wait before sending more messages.';
  END IF;
  
  -- Rate limiting: Check last message from this user (5 second cooldown)
  SELECT created_at INTO last_message_time
  FROM lounge_messages
  WHERE sender_id = NEW.sender_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF last_message_time IS NOT NULL THEN
    time_since_last := NOW() - last_message_time;
    
    IF time_since_last < INTERVAL '5 seconds' THEN
      RAISE EXCEPTION 'Please wait % seconds before sending another message', 
        CEIL(EXTRACT(EPOCH FROM (INTERVAL '5 seconds' - time_since_last)));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add index for faster duplicate detection
CREATE INDEX IF NOT EXISTS idx_lounge_messages_sender_content 
ON lounge_messages(sender_id, content, created_at DESC);

-- Add index for faster rate limit checks
CREATE INDEX IF NOT EXISTS idx_lounge_messages_sender_time 
ON lounge_messages(sender_id, created_at DESC);
