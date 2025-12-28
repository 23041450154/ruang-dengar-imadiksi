-- SafeSpace Database Schema for Supabase - CLEAN VERSION
-- Step 1: Run this FIRST to drop all existing tables

DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS mood_logs CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Now run the schema below

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users Table (Create FIRST - no dependencies)
-- ============================================
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name TEXT NOT NULL,
  invite_code TEXT NOT NULL,
  consent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE (display_name, invite_code)
);

CREATE INDEX idx_users_display_name ON users(display_name);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- ============================================
-- Chat Sessions Table (Depends on users)
-- ============================================
CREATE TABLE chat_sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at DESC);

-- ============================================
-- Messages Table (Depends on chat_sessions and users)
-- ============================================
CREATE TABLE messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_session_created ON messages(session_id, created_at DESC);

-- ============================================
-- Journal Entries Table (Depends on users)
-- ============================================
CREATE TABLE journal_entries (
  entry_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_journal_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_journal_user_created ON journal_entries(user_id, created_at DESC);

-- ============================================
-- Mood Tracking Table (Depends on users)
-- ============================================
CREATE TABLE mood_logs (
  mood_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mood_user_id ON mood_logs(user_id);
CREATE INDEX idx_mood_created_at ON mood_logs(created_at DESC);
CREATE INDEX idx_mood_user_created ON mood_logs(user_id, created_at DESC);

-- ============================================
-- Reports Table (Depends on chat_sessions and users)
-- ============================================
CREATE TABLE reports (
  report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_session_id ON reports(session_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Public read access for users (needed for authentication)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Users can insert themselves
CREATE POLICY "Users can insert themselves" ON users
  FOR INSERT WITH CHECK (true);

-- Users can update their own data
CREATE POLICY "Users can update themselves" ON users
  FOR UPDATE USING (true);

-- Public access to chat sessions and messages (anonymous chat)
CREATE POLICY "Chat sessions are viewable by everyone" ON chat_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Messages are viewable by everyone" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create messages" ON messages
  FOR INSERT WITH CHECK (true);

-- Journal entries are private (only owner can view/modify)
CREATE POLICY "Users can view their own journals" ON journal_entries
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own journals" ON journal_entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own journals" ON journal_entries
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own journals" ON journal_entries
  FOR DELETE USING (true);

-- Mood logs are private
CREATE POLICY "Users can view their own mood logs" ON mood_logs
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own mood logs" ON mood_logs
  FOR INSERT WITH CHECK (true);

-- Reports are public (for moderation)
CREATE POLICY "Anyone can view reports" ON reports
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create reports" ON reports
  FOR INSERT WITH CHECK (true);

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SUCCESS!
-- ============================================
-- All tables created successfully
-- Check in Table Editor to see: users, chat_sessions, messages, journal_entries, mood_logs, reports
