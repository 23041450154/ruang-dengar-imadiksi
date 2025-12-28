-- Add status column to chat_sessions table
-- Run this in Supabase SQL Editor

ALTER TABLE chat_sessions 
ADD COLUMN status TEXT DEFAULT 'active';

-- Add index for status queries
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);

-- Update RLS policy if needed
-- (No changes needed as user_id is already used for RLS)
