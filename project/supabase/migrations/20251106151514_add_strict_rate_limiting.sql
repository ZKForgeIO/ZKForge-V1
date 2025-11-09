/*
  # Add Strict Rate Limiting for Lounge Messages
  
  1. Purpose
    - Prevent spam by enforcing 5-second cooldown at database level
    - Cannot be bypassed from frontend or API
    
  2. Implementation
    - Check last message timestamp before allowing insert
    - Reject if user sent message within last 5 seconds
    
  3. Security
    - Database-level enforcement
    - Frontend validation is secondary
*/

-- Update validation function to include rate limiting
CREATE OR REPLACE FUNCTION validate_lounge_message()
RETURNS TRIGGER AS $$
DECLARE
  last_message_time TIMESTAMPTZ;
  time_since_last INTERVAL;
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
