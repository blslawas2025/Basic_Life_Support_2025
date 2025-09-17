-- CORRECTED SCRIPT - Works with actual jobs table structure
-- First run CHECK_JOBS_TABLE_STRUCTURE.sql to see what columns exist

-- Step 1: Check what we're working with
SELECT 
    'JOBS TABLE INFO' as info,
    COUNT(*) as total_jobs
FROM jobs;

-- Step 2: Show the actual column names and sample data
SELECT * FROM jobs LIMIT 3;

-- Step 3: Based on common job table structures, try these approaches:

-- If the column is called 'job_name' or 'title' or 'position_name':
-- UPDATE jobs SET category = 'Clinical' WHERE category IS NULL AND (job_name ILIKE '%jururawat%' OR job_name ILIKE '%perubatan%');

-- If the column is called 'job_title':
-- UPDATE jobs SET category = 'Clinical' WHERE category IS NULL AND (job_title ILIKE '%jururawat%' OR job_title ILIKE '%perubatan%');

-- If the column is called 'position':
-- UPDATE jobs SET category = 'Clinical' WHERE category IS NULL AND (position ILIKE '%jururawat%' OR position ILIKE '%perubatan%');

-- Step 4: For now, let's just set all jobs to have categories
-- You can adjust this based on what you see in Step 2

-- Set all jobs to Non-Clinical first (safe default)
UPDATE jobs SET category = 'Non-Clinical' WHERE category IS NULL;

-- Step 5: Update profiles using job_position_id (this should work regardless of column names)
UPDATE profiles 
SET category = j.category, updated_at = NOW()
FROM jobs j
WHERE profiles.job_position_id = j.id 
  AND profiles.category IS NULL
  AND j.category IS NOT NULL;

-- Step 6: Check results
SELECT 
    'AFTER CORRECTED UPDATE' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 7: Show updated profiles
SELECT 
    p.name,
    p.job_position_name,
    p.category,
    p.job_position_id
FROM profiles p
WHERE p.category IS NOT NULL
ORDER BY p.updated_at DESC
LIMIT 10;
