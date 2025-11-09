/*
  # Emergency Clear Stuck Connections
  
  Terminates idle and stuck database connections to recover database responsiveness
*/

-- Terminate idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND NOW() - state_change > INTERVAL '2 minutes'
  AND pid != pg_backend_pid()
  AND datname = current_database();

-- Terminate idle in transaction
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND NOW() - state_change > INTERVAL '30 seconds'
  AND pid != pg_backend_pid()
  AND datname = current_database();
