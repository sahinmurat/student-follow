-- Update trigger to include gunluk_kk and gunluk_zkr in total_points

-- Ensure weights exist for gunluk_kk and gunluk_zkr (default weight 1)
INSERT INTO subject_weights (subject, weight) VALUES ('gunluk_kk', 1)
ON CONFLICT (subject) DO UPDATE SET weight = EXCLUDED.weight;

INSERT INTO subject_weights (subject, weight) VALUES ('gunluk_zkr', 1)
ON CONFLICT (subject) DO UPDATE SET weight = EXCLUDED.weight;

-- Replace update_total_points to include new subjects
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
    COALESCE((NEW.gunluk_kk * (SELECT weight FROM subject_weights WHERE subject = 'gunluk_kk')), 0) +
    COALESCE((NEW.gunluk_zkr * (SELECT weight FROM subject_weights WHERE subject = 'gunluk_zkr')), 0) +
    COALESCE((NEW.alm * (SELECT weight FROM subject_weights WHERE subject = 'alm')), 0) +
    COALESCE((NEW.trk * (SELECT weight FROM subject_weights WHERE subject = 'trk')), 0) +
    COALESCE((NEW.slvt * (SELECT weight FROM subject_weights WHERE subject = 'slvt')), 0)
  INTO v_total;
  
  NEW.total_points := v_total;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
