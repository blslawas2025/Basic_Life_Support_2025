-- Remove grade column from profiles table
-- This script combines job_position_name and grade into a single field
-- and removes the separate grade column

-- First, update existing records to combine job_position_name and grade
UPDATE profiles 
SET job_position_name = CONCAT(job_position_name, ' ', grade)
WHERE job_position_name IS NOT NULL 
  AND grade IS NOT NULL 
  AND grade != '';

-- Now drop the grade column
ALTER TABLE profiles DROP COLUMN IF EXISTS grade;

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
