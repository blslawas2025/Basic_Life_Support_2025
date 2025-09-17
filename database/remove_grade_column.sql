-- Remove grade column from profiles table
-- This script removes the separate grade column since job and grade are now combined

-- First, update existing records to combine job_position_name and grade
UPDATE profiles 
SET job_position_name = CONCAT(job_position_name, ' ', grade)
WHERE grade IS NOT NULL AND grade != '';

-- Remove the grade column
ALTER TABLE profiles DROP COLUMN IF EXISTS grade;

-- Add a comment to document the change
COMMENT ON COLUMN profiles.job_position_name IS 'Combined job position and grade (e.g., "JURURAWAT U6", "Penolong Pegawai Farmasi U5")';
