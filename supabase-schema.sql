-- Supabase SQL Schema for Student Question Tracker

-- Enable Row Level Security
ALTER DATABASE postgres SET timezone TO 'UTC';

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student')) DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Subject weights table
CREATE TABLE subject_weights (
  id SERIAL PRIMARY KEY,
  subject TEXT UNIQUE NOT NULL,
  weight INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Daily entries table
CREATE TABLE daily_entries (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  math INTEGER DEFAULT 0,
  physics INTEGER DEFAULT 0,
  chemistry INTEGER DEFAULT 0,
  biology INTEGER DEFAULT 0,
  turkish INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Insert default subject weights
INSERT INTO subject_weights (subject, weight) VALUES
  ('math', 2),
  ('physics', 5),
  ('chemistry', 3),
  ('biology', 3),
  ('turkish', 1);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Subject weights policies (read-only for all authenticated users)
CREATE POLICY "Everyone can view subject weights"
  ON subject_weights FOR SELECT
  TO authenticated
  USING (true);

-- Daily entries policies
CREATE POLICY "Users can view their own entries"
  ON daily_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all entries"
  ON daily_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own entries"
  ON daily_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON daily_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON daily_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate total points
CREATE OR REPLACE FUNCTION calculate_total_points(
  p_math INTEGER,
  p_physics INTEGER,
  p_chemistry INTEGER,
  p_biology INTEGER,
  p_turkish INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT 
    (p_math * (SELECT weight FROM subject_weights WHERE subject = 'math')) +
    (p_physics * (SELECT weight FROM subject_weights WHERE subject = 'physics')) +
    (p_chemistry * (SELECT weight FROM subject_weights WHERE subject = 'chemistry')) +
    (p_biology * (SELECT weight FROM subject_weights WHERE subject = 'biology')) +
    (p_turkish * (SELECT weight FROM subject_weights WHERE subject = 'turkish'))
  INTO v_total;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate total points
CREATE OR REPLACE FUNCTION update_total_points()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_points := calculate_total_points(
    NEW.math,
    NEW.physics,
    NEW.chemistry,
    NEW.biology,
    NEW.turkish
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_points_on_insert_update
  BEFORE INSERT OR UPDATE ON daily_entries
  FOR EACH ROW EXECUTE FUNCTION update_total_points();

-- Create indexes for better performance
CREATE INDEX idx_daily_entries_user_id ON daily_entries(user_id);
CREATE INDEX idx_daily_entries_date ON daily_entries(date);
CREATE INDEX idx_daily_entries_user_date ON daily_entries(user_id, date);
CREATE INDEX idx_profiles_role ON profiles(role);
