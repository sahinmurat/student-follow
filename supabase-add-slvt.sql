-- Add slvt column to daily_entries
ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS slvt INTEGER DEFAULT 0;

-- Change weight column type in subject_weights to allow decimals
ALTER TABLE subject_weights ALTER COLUMN weight TYPE NUMERIC(10, 2);

-- Insert slvt weight
INSERT INTO subject_weights (subject, weight) VALUES ('slvt', 0.05)
ON CONFLICT (subject) DO UPDATE SET weight = 0.05;

-- Change total_points column type in daily_entries to allow decimals
ALTER TABLE daily_entries ALTER COLUMN total_points TYPE NUMERIC(10, 2);

-- Update trigger function to include slvt and use new weights
CREATE OR REPLACE FUNCTION update_total_points()
RETURNS TRIGGER AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT 
    COALESCE((NEW.kk * (SELECT weight FROM subject_weights WHERE subject = 'kk')), 0) +
    COALESCE((NEW.rsl * (SELECT weight FROM subject_weights WHERE subject = 'rsl')), 0) +
    COALESCE((NEW.prt * (SELECT weight FROM subject_weights WHERE subject = 'prt')), 0) +
    COALESCE((NEW.cvs * (SELECT weight FROM subject_weights WHERE subject = 'cvs')), 0) +
    COALESCE((NEW.orc * (SELECT weight FROM subject_weights WHERE subject = 'orc')), 0) +
    COALESCE((NEW.thc * (SELECT weight FROM subject_weights WHERE subject = 'thc')), 0) +
    COALESCE((NEW.alm * (SELECT weight FROM subject_weights WHERE subject = 'alm')), 0) +
    COALESCE((NEW.trk * (SELECT weight FROM subject_weights WHERE subject = 'trk')), 0) +
    COALESCE((NEW.slvt * (SELECT weight FROM subject_weights WHERE subject = 'slvt')), 0)
  INTO v_total;
  
  NEW.total_points := v_total;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
