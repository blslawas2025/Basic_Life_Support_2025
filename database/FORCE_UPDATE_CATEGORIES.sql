-- FORCE UPDATE CATEGORIES
-- This script will forcefully update all profiles categories based on jobs table
-- It handles the case where the previous updates didn't work

-- Step 1: First, let's see what we're working with
SELECT 'BEFORE UPDATE - CURRENT PROFILES' as status;
SELECT 
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category;

-- Step 2: Show the jobs table for reference
SELECT 'JOBS TABLE REFERENCE' as status;
SELECT 
    job_position,
    category,
    code_prefix
FROM jobs 
WHERE is_active = true
ORDER BY job_position;

-- Step 3: Show what the matching should look like
SELECT 'EXPECTED MATCHES' as status;
SELECT 
    p.job_position_name,
    TRIM(REGEXP_REPLACE(p.job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g')) as extracted_name,
    j.job_position,
    j.category as expected_category,
    COUNT(*) as profile_count
FROM profiles p
JOIN jobs j ON UPPER(TRIM(REGEXP_REPLACE(p.job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g'))) = UPPER(j.job_position)
WHERE p.job_position_name IS NOT NULL
  AND j.is_active = true
GROUP BY p.job_position_name, extracted_name, j.job_position, j.category
ORDER BY p.job_position_name;

-- Step 4: FORCE UPDATE - This will update ALL profiles regardless of current category
UPDATE profiles 
SET category = j.category,
    updated_at = NOW()
FROM jobs j
WHERE profiles.job_position_name IS NOT NULL
  AND j.is_active = true
  AND UPPER(TRIM(REGEXP_REPLACE(profiles.job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g'))) = UPPER(j.job_position);

-- Step 5: Show results after update
SELECT 'AFTER UPDATE - RESULTS' as status;
SELECT 
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category
ORDER BY category;

-- Step 6: Show detailed verification
SELECT 'VERIFICATION - SAMPLE RESULTS' as status;
SELECT 
    p.name,
    p.job_position_name,
    p.category as profile_category,
    j.job_position,
    j.category as jobs_category,
    CASE 
        WHEN p.category = j.category THEN 'CORRECT'
        ELSE 'MISMATCH'
    END as status
FROM profiles p
JOIN jobs j ON UPPER(TRIM(REGEXP_REPLACE(p.job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g'))) = UPPER(j.job_position)
WHERE p.job_position_name IS NOT NULL
  AND j.is_active = true
ORDER BY p.job_position_name
LIMIT 15;

-- Step 7: Show any profiles that couldn't be matched
SELECT 'UNMATCHED PROFILES' as status;
SELECT 
    job_position_name,
    TRIM(REGEXP_REPLACE(job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g')) as extracted_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
  AND id NOT IN (
    SELECT p.id
    FROM profiles p
    JOIN jobs j ON UPPER(TRIM(REGEXP_REPLACE(p.job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g'))) = UPPER(j.job_position)
    WHERE j.is_active = true
  )
GROUP BY job_position_name, extracted_name, category
ORDER BY job_position_name;
