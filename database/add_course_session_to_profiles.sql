-- Add course_session_id column to profiles table
-- This links participants to specific course sessions

-- Add the course_session_id column
ALTER TABLE profiles ADD COLUMN course_session_id UUID REFERENCES course_sessions(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_course_session_id ON profiles(course_session_id);

-- Add comment for documentation
COMMENT ON COLUMN profiles.course_session_id IS 'Reference to the course session this participant is registered for';

-- Update existing profiles to have a default course session (optional)
-- You can uncomment this if you want to assign existing participants to a default session
-- UPDATE profiles 
-- SET course_session_id = (SELECT id FROM course_sessions WHERE full_name = 'BLS Siri 1 2025' LIMIT 1)
-- WHERE course_session_id IS NULL AND user_type = 'participant';
