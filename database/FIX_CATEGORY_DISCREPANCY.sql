-- FIX CATEGORY DISCREPANCY
-- This script fixes the category mismatch between profiles and jobs tables
-- Based on the results showing profiles have Non-Clinical but jobs have Clinical

-- Step 1: Show current discrepancy
SELECT 'CURRENT DISCREPANCY' as status;
SELECT 
    p.job_position_name,
    p.category as profile_category,
    j.job_position,
    j.category as jobs_category,
    COUNT(*) as count
FROM profiles p
JOIN jobs j ON UPPER(TRIM(REGEXP_REPLACE(p.job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g'))) = UPPER(j.job_position)
WHERE p.job_position_name IS NOT NULL
  AND j.is_active = true
  AND p.category != j.category
GROUP BY p.job_position_name, p.category, j.job_position, j.category
ORDER BY p.job_position_name;

-- Step 2: Update profiles category to match jobs category
UPDATE profiles 
SET category = j.category,
    updated_at = NOW()
FROM jobs j
WHERE profiles.job_position_name IS NOT NULL
  AND j.is_active = true
  AND UPPER(TRIM(REGEXP_REPLACE(profiles.job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g'))) = UPPER(j.job_position);

-- Step 3: Show results after update
SELECT 'RESULTS AFTER UPDATE' as status;
SELECT 
    category,
    COUNT(*) as profile_count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category
ORDER BY category;

-- Step 4: Show some examples of corrected matches
SELECT 'CORRECTED MATCHES' as status;
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
LIMIT 10;
