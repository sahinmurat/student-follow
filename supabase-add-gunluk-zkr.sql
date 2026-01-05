ALTER TABLE public.daily_entries
ADD COLUMN IF NOT EXISTS gunluk_zkr integer NOT NULL DEFAULT 0;
