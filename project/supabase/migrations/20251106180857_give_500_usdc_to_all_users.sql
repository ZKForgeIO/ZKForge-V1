/*
  # Give 500 USDC Testnet to All Users

  1. Changes
    - Give 500 USDC to all existing users by creating a receive transaction
    - Set up trigger to automatically give 500 USDC to new users on signup
  
  2. Security
    - Transaction records are created with proper RLS
    - Trigger only runs on profile creation
  
  3. Important Notes
    - This is testnet USDC for testing purposes
    - Each user receives exactly 500 USDC once
    - New users automatically receive 500 USDC on first profile creation
*/

-- Give 500 USDC to all existing users who don't already have it
INSERT INTO transactions (user_id, type, amount, currency, from_address, to_address, status, transaction_hash, description)
SELECT 
  p.id,
  'receive',
  500,
  'USDC',
  'SYSTEM_FAUCET_' || gen_random_uuid()::text,
  COALESCE(p.solana_address, 'PENDING_ADDRESS'),
  'completed',
  '0x' || encode(gen_random_bytes(32), 'hex'),
  'Welcome bonus: 500 USDC testnet tokens'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM transactions t
  WHERE t.user_id = p.id
  AND t.description = 'Welcome bonus: 500 USDC testnet tokens'
);

-- Create function to give 500 USDC to new users
CREATE OR REPLACE FUNCTION give_welcome_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- Give 500 USDC to the new user
  INSERT INTO transactions (
    user_id,
    type,
    amount,
    currency,
    from_address,
    to_address,
    status,
    transaction_hash,
    description
  ) VALUES (
    NEW.id,
    'receive',
    500,
    'USDC',
    'SYSTEM_FAUCET_' || gen_random_uuid()::text,
    COALESCE(NEW.solana_address, 'PENDING_ADDRESS'),
    'completed',
    '0x' || encode(gen_random_bytes(32), 'hex'),
    'Welcome bonus: 500 USDC testnet tokens'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically give bonus on profile creation
DROP TRIGGER IF EXISTS trigger_give_welcome_bonus ON profiles;
CREATE TRIGGER trigger_give_welcome_bonus
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION give_welcome_bonus();