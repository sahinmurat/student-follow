-- Add dashboard_note column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dashboard_note TEXT;
