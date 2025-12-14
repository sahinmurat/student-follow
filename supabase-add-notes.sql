-- Add notes column to daily_entries
ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS notes TEXT;
