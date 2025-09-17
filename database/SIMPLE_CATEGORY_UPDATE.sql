-- SIMPLE CATEGORY UPDATE SCRIPT
-- This script directly updates the category column in profiles table
-- by matching job_position_name (without grades) with jobs.job_position

-- Step 1: Update profiles category by matching with jobs table
-- This removes grade information (U6, UD9, etc.) and matches with jobs.job_position
UPDATE profiles 
SET category = j.category,
    updated_at = NOW()
FROM jobs j
WHERE profiles.job_position_name IS NOT NULL
  AND j.is_active = true
  AND UPPER(TRIM(REGEXP_REPLACE(profiles.job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g'))) = UPPER(j.job_position);

-- Step 2: Show the results
SELECT 
    'UPDATED RESULTS' as status,
    category,
    COUNT(*) as profile_count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category
ORDER BY category;

-- Step 3: Show some examples of the matching
SELECT 
    'MATCHING EXAMPLES' as status,
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY job_position_name, category
ORDER BY job_position_name
LIMIT 15;
