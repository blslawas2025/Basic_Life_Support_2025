-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_records_participant_id ON attendance_records(participant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_course_session_id ON attendance_records(course_session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_created_at ON attendance_records(created_at);

-- Create unique constraint to prevent duplicate attendance records
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_records_unique 
ON attendance_records(participant_id, course_session_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attendance_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_attendance_records_updated_at
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_records_updated_at();

-- Add comments for documentation
COMMENT ON TABLE attendance_records IS 'Tracks participant attendance for course sessions';
COMMENT ON COLUMN attendance_records.id IS 'Unique identifier for attendance record';
COMMENT ON COLUMN attendance_records.participant_id IS 'Reference to participant profile';
COMMENT ON COLUMN attendance_records.course_session_id IS 'Reference to course session';
COMMENT ON COLUMN attendance_records.check_in_time IS 'When participant checked in (null if absent)';
COMMENT ON COLUMN attendance_records.check_out_time IS 'When participant checked out (optional)';
COMMENT ON COLUMN attendance_records.status IS 'Attendance status: present, absent, or late';
COMMENT ON COLUMN attendance_records.created_at IS 'When record was created';
COMMENT ON COLUMN attendance_records.updated_at IS 'When record was last updated';
