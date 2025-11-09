/*
  # Enable Realtime for Lounge Messages

  1. Changes
    - Enable realtime replication for lounge_messages table
    - This allows instant updates via Supabase realtime subscriptions
*/

ALTER PUBLICATION supabase_realtime ADD TABLE lounge_messages;
