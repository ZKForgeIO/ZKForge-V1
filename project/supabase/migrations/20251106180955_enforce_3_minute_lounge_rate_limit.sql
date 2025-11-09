/*
  # Enforce 3-Minute Rate Limit for Lounge Messages

  1. Changes
    - Add database-level 3-minute (180 second) rate limit between lounge messages
    - Update validation function to enforce 3-minute cooldown
    - Ensure frontend and backend are synchronized
  
  2. Security
    - Cannot be bypassed from frontend
    - Clear error messages for users
    - Matches frontend cooldown timer
  
  3. Important Notes
    - This replaces the 5-second cooldown with a 3-minute cooldown
    - Anti-spam measures remain in place (duplicate detection, spam filters, etc.)
*/

-- Update validation function to enforce 3-minute rate limit
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
  
  -- Check hourly message limit (100 messages per hour)
  SELECT COUNT(*) INTO messages_last_hour
  FROM lounge_messages
  WHERE sender_id = NEW.sender_id
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF messages_last_hour >= 100 THEN
    RAISE EXCEPTION 'Message limit reached. Please wait before sending more messages.';
  END IF;
  
  -- Rate limiting: Check last message from this user (3 MINUTE cooldown)
  SELECT created_at INTO last_message_time
  FROM lounge_messages
  WHERE sender_id = NEW.sender_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF last_message_time IS NOT NULL THEN
    time_since_last := NOW() - last_message_time;
    
    IF time_since_last < INTERVAL '3 minutes' THEN
      RAISE EXCEPTION 'Please wait % minute(s) before sending another message', 
        CEIL(EXTRACT(EPOCH FROM (INTERVAL '3 minutes' - time_since_last)) / 60.0);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;