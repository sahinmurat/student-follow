-- Add gunluk_kk column to daily_entries
ALTER TABLE public.daily_entries
ADD COLUMN IF NOT EXISTS gunluk_kk integer NOT NULL DEFAULT 0;
