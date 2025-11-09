/*
  # Add Hourly Message Limit
  
  1. Purpose
    - Prevent sustained spam attacks
    - Limit users to 100 messages per hour
    
  2. Implementation
    - Count messages from user in last hour
    - Reject if over limit
    
  3. Rationale
    - 100 messages/hour = 1.67 messages/minute
    - Reasonable for normal chat
    - Prevents spam bots
*/

-- Update validation function to include hourly limit
CREATE OR REPLACE FUNCTION validate_lounge_message()
RETURNS TRIGGER AS $$
DECLARE
  last_message_time TIMESTAMPTZ;
  time_since_last INTERVAL;
  messages_last_hour INTEGER;
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
  
  -- Check hourly message limit (100 messages per hour)
  SELECT COUNT(*) INTO messages_last_hour
  FROM lounge_messages
  WHERE sender_id = NEW.sender_id
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF messages_last_hour >= 100 THEN
    RAISE EXCEPTION 'Message limit reached. Please wait before sending more messages.';
  END IF;
  
  -- Rate limiting: Check last message from this user
  SELECT created_at INTO last_message_time
  FROM lounge_messages
  WHERE sender_id = NEW.sender_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF last_message_time IS NOT NULL THEN
    time_since_last := NOW() - last_message_time;
    
    -- Enforce 5 second cooldown
    IF time_since_last < INTERVAL '5 seconds' THEN
      RAISE EXCEPTION 'Please wait % seconds before sending another message', 
        CEIL(EXTRACT(EPOCH FROM (INTERVAL '5 seconds' - time_since_last)));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
