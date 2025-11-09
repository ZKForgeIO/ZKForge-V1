/*
  # Add Backend Validation for Lounge Messages
  
  1. Security Improvements
    - Add CHECK constraint to enforce 300 character limit at database level
    - Add trigger to validate message content before insert
    - Prevent empty messages
    - Trim whitespace automatically
    
  2. Changes
    - Add CHECK constraint on content column (1-300 chars)
    - Create validation trigger function
    - Ensure no bypass possible from frontend
    
  3. Safety
    - Existing valid messages remain unchanged
    - Only new inserts are validated
*/

-- Add CHECK constraint to enforce character limit
ALTER TABLE lounge_messages
DROP CONSTRAINT IF EXISTS lounge_messages_content_length_check;

ALTER TABLE lounge_messages
ADD CONSTRAINT lounge_messages_content_length_check 
CHECK (LENGTH(TRIM(content)) >= 1 AND LENGTH(content) <= 300);

-- Create validation function
CREATE OR REPLACE FUNCTION validate_lounge_message()
RETURNS TRIGGER AS $$
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run validation before insert
DROP TRIGGER IF EXISTS validate_lounge_message_trigger ON lounge_messages;

CREATE TRIGGER validate_lounge_message_trigger
  BEFORE INSERT ON lounge_messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_lounge_message();
