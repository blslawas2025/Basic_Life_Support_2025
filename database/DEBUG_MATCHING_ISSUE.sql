-- DEBUG MATCHING ISSUE
-- This script will help us understand why the matching isn't working

-- Step 1: Check what's in the jobs table
SELECT 'JOBS TABLE CONTENT' as status;
SELECT 
    job_position,
    category,
    code_prefix
FROM jobs 
WHERE is_active = true
ORDER BY job_position;

-- Step 2: Check what's in the profiles table
SELECT 'PROFILES TABLE CONTENT' as status;
SELECT DISTINCT
    job_position_name,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY job_position_name
ORDER BY job_position_name;

-- Step 3: Test the regex extraction on sample data
SELECT 'REGEX EXTRACTION TEST' as status;
SELECT 
    job_position_name,
    TRIM(REGEXP_REPLACE(job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g')) as extracted_name
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY job_position_name
ORDER BY job_position_name;

-- Step 4: Try different regex patterns
SELECT 'ALTERNATIVE REGEX PATTERNS' as status;
SELECT 
    job_position_name,
    -- Original pattern
    TRIM(REGEXP_REPLACE(job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g')) as pattern1,
    -- Pattern with spaces
    TRIM(REGEXP_REPLACE(job_position_name, '\s+[A-Z]+\s*\d+$', '', 'g')) as pattern2,
    -- Pattern without space requirement
    TRIM(REGEXP_REPLACE(job_position_name, '[A-Z]+\s*\d+$', '', 'g')) as pattern3,
    -- Simple pattern - remove last word if it's a grade
    TRIM(REGEXP_REPLACE(job_position_name, '\s+[A-Z]+\d+$', '', 'g')) as pattern4
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY job_position_name
ORDER BY job_position_name
LIMIT 10;

-- Step 5: Check if there are any exact matches
SELECT 'EXACT MATCHES CHECK' as status;
SELECT 
    p.job_position_name,
    j.job_position,
    CASE 
        WHEN UPPER(p.job_position_name) = UPPER(j.job_position) THEN 'EXACT MATCH'
        ELSE 'NO EXACT MATCH'
    END as match_type
FROM profiles p
CROSS JOIN jobs j
WHERE p.job_position_name IS NOT NULL
  AND j.is_active = true
  AND UPPER(p.job_position_name) = UPPER(j.job_position)
LIMIT 10;

-- Step 6: Check for partial matches
SELECT 'PARTIAL MATCHES CHECK' as status;
SELECT 
    p.job_position_name,
    j.job_position,
    CASE 
        WHEN UPPER(p.job_position_name) LIKE '%' || UPPER(j.job_position) || '%' THEN 'CONTAINS'
        WHEN UPPER(j.job_position) LIKE '%' || UPPER(p.job_position_name) || '%' THEN 'REVERSE CONTAINS'
        ELSE 'NO MATCH'
    END as match_type
FROM profiles p
CROSS JOIN jobs j
WHERE p.job_position_name IS NOT NULL
  AND j.is_active = true
  AND (UPPER(p.job_position_name) LIKE '%' || UPPER(j.job_position) || '%' 
       OR UPPER(j.job_position) LIKE '%' || UPPER(p.job_position_name) || '%')
LIMIT 10;
