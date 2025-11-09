/*
  # Emergency: Clear Spam Transactions

  1. Issue
    - Database has been spammed with 40k+ transactions from bot attacks
    - Need to clear all spam transactions to restore normal operation

  2. Action
    - Truncate all transactions from the transactions table
    - Reset the database to clean state

  3. Security
    - Rate limiting has been implemented to prevent future spam
    - This is a one-time cleanup operation
*/

-- Clear all transactions
TRUNCATE TABLE transactions RESTART IDENTITY CASCADE;
