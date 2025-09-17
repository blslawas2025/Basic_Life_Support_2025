-- Quick fix: Update all NULL categories in one command
-- Run this in Supabase SQL Editor

UPDATE profiles 
SET category = j.category
FROM jobs j
WHERE profiles.job_position_id = j.id 
  AND profiles.category IS NULL;
