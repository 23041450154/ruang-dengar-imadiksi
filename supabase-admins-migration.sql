-- Migration: Create Admins Table
-- This migration creates the admins table for administrator login system
-- Run this SQL in Supabase SQL Editor

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

-- Insert default admin user
-- Username: admin
-- Password: admin123
-- Password hash generated with bcryptjs, 10 salt rounds
INSERT INTO admins (username, password_hash, name, role, is_active)
VALUES (
  'admin',
  '$2b$10$7p6Z0hrrV2hI6quE9EMoV.1kycz5vis/vJytMLo/FrQer3X6b1mZC',
  'Administrator',
  'admin',
  true
) ON CONFLICT (username) DO NOTHING;

-- You can add more admin users here
-- Example:
-- INSERT INTO admins (username, password_hash, name, role, is_active)
-- VALUES (
--   'naufal',
--   '$2b$10$YOUR_HASHED_PASSWORD_HERE',
--   'Naufal',
--   'super_admin',
--   true
-- ) ON CONFLICT (username) DO NOTHING;

-- Optional: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admins_updated_at 
  BEFORE UPDATE ON admins 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Admins table created successfully!';
  RAISE NOTICE 'Default admin credentials:';
  RAISE NOTICE '  Username: admin';
  RAISE NOTICE '  Password: admin123';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Change the default password immediately!';
END $$;
