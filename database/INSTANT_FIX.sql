-- INSTANT FIX: Update all NULL categories in profiles table
-- This will match profiles to jobs and populate categories

-- Step 1: Update categories by matching job_position_name to jobs table
UPDATE profiles 
SET category = j.category
FROM jobs j
WHERE profiles.job_position_name ILIKE '%' || j.job_position || '%'
  AND profiles.category IS NULL;

-- Step 2: If job_position_id exists, use that instead
UPDATE profiles 
SET category = j.category
FROM jobs j
WHERE profiles.job_position_id = j.id
  AND profiles.category IS NULL;

-- Step 3: Verify the fix
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;
