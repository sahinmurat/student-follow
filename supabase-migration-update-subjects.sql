-- Update subject_weights table structure to support decimals
ALTER TABLE subject_weights ALTER COLUMN weight TYPE NUMERIC(4, 2);

-- Clear existing weights
TRUNCATE TABLE subject_weights;

-- Insert new weights
INSERT INTO subject_weights (subject, weight) VALUES
  ('kk', 1),
  ('rsl', 1),
  ('prt', 1),
  ('cvs', 0.5),
  ('orc', 3),
  ('thc', 2),
  ('alm', 1),
  ('trk', 1);

-- Update daily_entries table
-- Dropping old columns
ALTER TABLE daily_entries 
  DROP COLUMN math,
  DROP COLUMN physics,
  DROP COLUMN chemistry,
  DROP COLUMN biology,
  DROP COLUMN turkish;

-- Adding new columns
ALTER TABLE daily_entries
  ADD COLUMN kk INTEGER DEFAULT 0,
  ADD COLUMN rsl INTEGER DEFAULT 0,
  ADD COLUMN prt INTEGER DEFAULT 0,
  ADD COLUMN cvs INTEGER DEFAULT 0,
  ADD COLUMN orc INTEGER DEFAULT 0,
  ADD COLUMN thc INTEGER DEFAULT 0,
  ADD COLUMN alm INTEGER DEFAULT 0,
  ADD COLUMN trk INTEGER DEFAULT 0;

-- Update total_points to support decimals
ALTER TABLE daily_entries ALTER COLUMN total_points TYPE NUMERIC(10, 2);

-- Update calculate_total_points function
CREATE OR REPLACE FUNCTION calculate_total_points(
  p_kk INTEGER,
  p_rsl INTEGER,
  p_prt INTEGER,
  p_cvs INTEGER,
  p_orc INTEGER,
  p_thc INTEGER,
  p_alm INTEGER,
  p_trk INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  SELECT 
    (p_kk * (SELECT weight FROM subject_weights WHERE subject = 'kk')) +
    (p_rsl * (SELECT weight FROM subject_weights WHERE subject = 'rsl')) +
    (p_prt * (SELECT weight FROM subject_weights WHERE subject = 'prt')) +
    (p_cvs * (SELECT weight FROM subject_weights WHERE subject = 'cvs')) +
    (p_orc * (SELECT weight FROM subject_weights WHERE subject = 'orc')) +
    (p_thc * (SELECT weight FROM subject_weights WHERE subject = 'thc')) +
    (p_alm * (SELECT weight FROM subject_weights WHERE subject = 'alm')) +
    (p_trk * (SELECT weight FROM subject_weights WHERE subject = 'trk'))
  INTO v_total;
  
  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql;

-- Update update_total_points trigger function
CREATE OR REPLACE FUNCTION update_total_points()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_points := calculate_total_points(
    NEW.kk,
    NEW.rsl,
    NEW.prt,
    NEW.cvs,
    NEW.orc,
    NEW.thc,
    NEW.alm,
    NEW.trk
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
