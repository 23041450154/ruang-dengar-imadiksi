-- ============================================
-- Teman Ngobrol (Companions) Feature Migration
-- Companions = Real users who can login and respond
-- ============================================

-- 1. Create companions table OR add missing columns if exists
CREATE TABLE IF NOT EXISTS companions (
  companion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  description TEXT,
  specialty VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1b. Add login columns if table already exists
ALTER TABLE companions ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
ALTER TABLE companions ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. Add companion_id to chat_sessions
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS companion_id UUID REFERENCES companions(companion_id);

-- 3. Update existing companions with login credentials OR insert new ones
-- First, update existing rows if they exist (Password: teman123)
UPDATE companions SET 
  username = 'naufal',
  password_hash = '$2b$10$o7wkoqoPd/Yp6wiDCvZGoOp1NeklDFonXpOGdXWQRB21b21V4vTJ6'
WHERE companion_id = '11111111-1111-1111-1111-111111111111' AND username IS NULL;

UPDATE companions SET 
  username = 'justang',
  password_hash = '$2b$10$o7wkoqoPd/Yp6wiDCvZGoOp1NeklDFonXpOGdXWQRB21b21V4vTJ6'
WHERE companion_id = '22222222-2222-2222-2222-222222222222' AND username IS NULL;

UPDATE companions SET 
  username = 'erlin',
  password_hash = '$2b$10$o7wkoqoPd/Yp6wiDCvZGoOp1NeklDFonXpOGdXWQRB21b21V4vTJ6'
WHERE companion_id = '33333333-3333-3333-3333-333333333333' AND username IS NULL;

-- 3b. Insert if not exists
INSERT INTO companions (companion_id, username, password_hash, name, description, specialty) VALUES
  ('11111111-1111-1111-1111-111111111111', 'naufal', '$2b$10$o7wkoqoPd/Yp6wiDCvZGoOp1NeklDFonXpOGdXWQRB21b21V4vTJ6', 'Naufal', 'Halo! Aku Naufal. Aku suka mendengarkan cerita dan berbagi pengalaman.', 'Pendengar Aktif'),
  ('22222222-2222-2222-2222-222222222222', 'justang', '$2b$10$o7wkoqoPd/Yp6wiDCvZGoOp1NeklDFonXpOGdXWQRB21b21V4vTJ6', 'Justang', 'Hai, aku Justang. Kalau kamu butuh teman ngobrol, aku ada di sini.', 'Teman Berbagi'),
  ('33333333-3333-3333-3333-333333333333', 'erlin', '$2b$10$o7wkoqoPd/Yp6wiDCvZGoOp1NeklDFonXpOGdXWQRB21b21V4vTJ6', 'Erlin', 'Halo! Aku Erlin, senang bisa jadi teman ceritamu.', 'Pendengar Baik')
ON CONFLICT (companion_id) DO UPDATE SET
  username = EXCLUDED.username,
  password_hash = EXCLUDED.password_hash;

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_sessions_companion ON chat_sessions(companion_id);
CREATE INDEX IF NOT EXISTS idx_companions_username ON companions(username);

-- 5. Add is_companion column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_companion BOOLEAN DEFAULT false;

-- 6. Add sender_id to messages (for companion identification)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_id UUID;
