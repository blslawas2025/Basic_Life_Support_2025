-- FIXED SQL: Update all NULL categories in profiles table
-- This will match profiles to jobs and populate categories

-- Method 1: Update using job_position_name matching
UPDATE profiles 
SET category = (
    SELECT j.category 
    FROM jobs j 
    WHERE profiles.job_position_name ILIKE '%' || j.job_position || '%'
    LIMIT 1
)
WHERE profiles.category IS NULL;

-- Method 2: If job_position_id exists, use that instead
UPDATE profiles 
SET category = (
    SELECT j.category 
    FROM jobs j 
    WHERE j.id = profiles.job_position_id
)
WHERE profiles.category IS NULL 
  AND profiles.job_position_id IS NOT NULL;

-- Verify the fix
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;
