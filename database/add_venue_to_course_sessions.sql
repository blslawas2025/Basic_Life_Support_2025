-- Add venue field to course_sessions table
-- This migration adds the venue column to store training venue/location information

-- Add venue column to course_sessions table
ALTER TABLE course_sessions 
ADD COLUMN IF NOT EXISTS venue VARCHAR(200);

-- Add comment for documentation
COMMENT ON COLUMN course_sessions.venue IS 'Training venue/location where the course will be conducted';

-- Update existing records with default venue (optional)
-- You can modify these or leave them NULL
UPDATE course_sessions 
SET venue = 'Training Room A' 
WHERE venue IS NULL AND full_name = 'BLS Siri 1 2025';

UPDATE course_sessions 
SET venue = 'Training Room B' 
WHERE venue IS NULL AND full_name = 'BLS Siri 2 2025';

UPDATE course_sessions 
SET venue = 'Conference Hall' 
WHERE venue IS NULL AND full_name = 'BLS Siri 3 2025';
