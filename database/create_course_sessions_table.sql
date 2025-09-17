-- Create course_sessions table for managing different BLS course sessions
-- This table will store information about each course session (e.g., BLS Siri 1 2025, BLS Siri 2 2025)

CREATE TABLE IF NOT EXISTS course_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Course Information
  course_name VARCHAR(100) NOT NULL, -- "BLS", "ACLS", "PALS", etc.
  series_name VARCHAR(50) NOT NULL, -- "Siri 1", "Siri 2", "Siri 3"
  year INTEGER NOT NULL, -- 2025, 2026, etc.
  full_name VARCHAR(150) NOT NULL, -- "BLS Siri 1 2025", "BLS Siri 2 2025"
  
  -- Session Details
  description TEXT,
  start_date DATE,
  end_date DATE,
  registration_start_date DATE,
  registration_end_date DATE,
  
  -- Capacity Management
  max_participants INTEGER DEFAULT 50,
  current_participants INTEGER DEFAULT 0,
  
  -- Status and Management
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'draft')),
  is_registration_open BOOLEAN DEFAULT TRUE,
  
  -- System Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  
  -- Constraints
  CONSTRAINT unique_course_session UNIQUE (course_name, series_name, year),
  CONSTRAINT valid_year CHECK (year >= 2020 AND year <= 2030),
  CONSTRAINT valid_participants CHECK (current_participants >= 0 AND current_participants <= max_participants),
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CONSTRAINT valid_registration_dates CHECK (
    registration_end_date IS NULL OR 
    registration_start_date IS NULL OR 
    registration_end_date >= registration_start_date
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_course_sessions_course_name ON course_sessions(course_name);
CREATE INDEX IF NOT EXISTS idx_course_sessions_year ON course_sessions(year);
CREATE INDEX IF NOT EXISTS idx_course_sessions_status ON course_sessions(status);
CREATE INDEX IF NOT EXISTS idx_course_sessions_is_registration_open ON course_sessions(is_registration_open);
CREATE INDEX IF NOT EXISTS idx_course_sessions_created_at ON course_sessions(created_at);

-- Create updated_at trigger
CREATE TRIGGER update_course_sessions_updated_at 
    BEFORE UPDATE ON course_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE course_sessions IS 'Stores information about different course sessions (e.g., BLS Siri 1 2025, BLS Siri 2 2025)';
COMMENT ON COLUMN course_sessions.course_name IS 'Type of course: BLS, ACLS, PALS, etc.';
COMMENT ON COLUMN course_sessions.series_name IS 'Series identifier: Siri 1, Siri 2, Siri 3, etc.';
COMMENT ON COLUMN course_sessions.year IS 'Year the course is conducted';
COMMENT ON COLUMN course_sessions.full_name IS 'Complete course session name for display';
COMMENT ON COLUMN course_sessions.max_participants IS 'Maximum number of participants allowed';
COMMENT ON COLUMN course_sessions.current_participants IS 'Current number of registered participants';
COMMENT ON COLUMN course_sessions.status IS 'Course session status: active, completed, cancelled, draft';
COMMENT ON COLUMN course_sessions.is_registration_open IS 'Whether registration is currently open for this session';

-- Insert some sample course sessions for 2025
INSERT INTO course_sessions (course_name, series_name, year, full_name, description, start_date, end_date, registration_start_date, registration_end_date, max_participants, status, is_registration_open) VALUES
('BLS', 'Siri 1', 2025, 'BLS Siri 1 2025', 'Basic Life Support Training - Series 1 2025', '2025-07-15', '2025-07-16', '2025-06-01', '2025-07-10', 30, 'active', true),
('BLS', 'Siri 2', 2025, 'BLS Siri 2 2025', 'Basic Life Support Training - Series 2 2025', '2025-10-15', '2025-10-16', '2025-09-01', '2025-10-10', 30, 'active', true),
('BLS', 'Siri 3', 2025, 'BLS Siri 3 2025', 'Basic Life Support Training - Series 3 2025', '2025-12-15', '2025-12-16', '2025-11-01', '2025-12-10', 30, 'active', true);

-- Create a function to automatically update current_participants count
CREATE OR REPLACE FUNCTION update_course_session_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the course session participant count
    UPDATE course_sessions 
    SET current_participants = (
        SELECT COUNT(*) 
        FROM profiles 
        WHERE course_session_id = COALESCE(NEW.course_session_id, OLD.course_session_id)
        AND status IN ('pending', 'approved', 'active')
    )
    WHERE id = COALESCE(NEW.course_session_id, OLD.course_session_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger to automatically update participant count
CREATE TRIGGER update_course_session_participant_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_course_session_participant_count();
