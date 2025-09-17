-- Create attendance_records table for tracking participant attendance
-- This table stores attendance records for each course session

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Course Session Reference
  course_session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  
  -- Participant Information
  participant_id UUID NOT NULL,
  participant_name VARCHAR(255) NOT NULL,
  participant_ic VARCHAR(20) NOT NULL,
  
  -- Attendance Details
  arrival_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  
  -- Staff Information
  checked_in_by UUID, -- References staff member who checked them in
  
  -- Additional Information
  notes TEXT,
  
  -- System Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_participant_per_session UNIQUE (course_session_id, participant_id),
  CONSTRAINT valid_ic_format CHECK (participant_ic ~ '^[0-9]{6}-[0-9]{2}-[0-9]{4}$')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_course_session ON attendance_records(course_session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_participant ON attendance_records(participant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_arrival_time ON attendance_records(arrival_time);
CREATE INDEX IF NOT EXISTS idx_attendance_records_created_at ON attendance_records(created_at);

-- Create updated_at trigger
CREATE TRIGGER update_attendance_records_updated_at 
    BEFORE UPDATE ON attendance_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE attendance_records IS 'Stores attendance records for course sessions';
COMMENT ON COLUMN attendance_records.course_session_id IS 'Reference to the course session';
COMMENT ON COLUMN attendance_records.participant_id IS 'Reference to the participant profile';
COMMENT ON COLUMN attendance_records.participant_name IS 'Participant name for quick reference';
COMMENT ON COLUMN attendance_records.participant_ic IS 'Participant IC number for identification';
COMMENT ON COLUMN attendance_records.arrival_time IS 'When the participant arrived/checked in';
COMMENT ON COLUMN attendance_records.status IS 'Attendance status: present, absent, late';
COMMENT ON COLUMN attendance_records.checked_in_by IS 'Staff member who checked in the participant';
COMMENT ON COLUMN attendance_records.notes IS 'Additional notes about attendance';
