-- UPDATE PROFILES CATEGORY FROM JOBS TABLE
-- This script updates the category column in profiles table by matching job_position_name with jobs table
-- It extracts the job name part (removing grades) and matches with jobs.job_position

-- Step 1: First, let's see what we're working with
SELECT 'CURRENT PROFILES DATA' as info;
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY job_position_name, category
ORDER BY job_position_name;

-- Step 2: Show jobs table data for reference
SELECT 'JOBS TABLE DATA' as info;
SELECT 
    job_position,
    category,
    code_prefix
FROM jobs 
WHERE is_active = true
ORDER BY job_position;

-- Step 3: Create a function to extract job name from job_position_name
-- This function removes grades like "U6", "UD9", etc. from job position names
CREATE OR REPLACE FUNCTION extract_job_name(full_job_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Remove common grade patterns at the end of the string
    -- Patterns: U followed by digits, UD/UG/UF followed by digits, H/N followed by digits, JA followed by digits
    RETURN TRIM(REGEXP_REPLACE(
        full_job_name, 
        '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', 
        '', 
        'g'
    ));
END;
$$ LANGUAGE plpgsql;

-- Step 4: Test the function with some sample data
SELECT 'TESTING JOB NAME EXTRACTION' as info;
SELECT 
    job_position_name,
    extract_job_name(job_position_name) as extracted_job_name
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY job_position_name
ORDER BY job_position_name
LIMIT 10;

-- Step 5: Show potential matches between profiles and jobs
SELECT 'POTENTIAL MATCHES' as info;
SELECT DISTINCT
    p.job_position_name,
    extract_job_name(p.job_position_name) as extracted_name,
    j.job_position as jobs_name,
    j.category as jobs_category
FROM profiles p
CROSS JOIN jobs j
WHERE p.job_position_name IS NOT NULL
  AND j.is_active = true
  AND UPPER(extract_job_name(p.job_position_name)) = UPPER(j.job_position)
ORDER BY p.job_position_name;

-- Step 6: Update profiles category based on job matching
-- This will match the extracted job name with jobs.job_position and update the category
UPDATE profiles 
SET category = j.category,
    updated_at = NOW()
FROM jobs j
WHERE profiles.job_position_name IS NOT NULL
  AND j.is_active = true
  AND UPPER(extract_job_name(profiles.job_position_name)) = UPPER(j.job_position);

-- Step 7: Show the results after update
SELECT 'RESULTS AFTER UPDATE' as info;
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY job_position_name, category
ORDER BY job_position_name;

-- Step 8: Show summary statistics
SELECT 'SUMMARY STATISTICS' as info;
SELECT 
    category,
    COUNT(*) as profile_count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category
ORDER BY category;

-- Step 9: Show any profiles that couldn't be matched
SELECT 'UNMATCHED PROFILES' as info;
SELECT 
    job_position_name,
    extract_job_name(job_position_name) as extracted_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
  AND category IS NULL
GROUP BY job_position_name, extract_job_name(job_position_name), category
ORDER BY job_position_name;

-- Step 10: Create a view for easy monitoring
CREATE OR REPLACE VIEW profiles_with_job_info AS
SELECT 
    p.id,
    p.name,
    p.email,
    p.job_position_name,
    extract_job_name(p.job_position_name) as extracted_job_name,
    p.category as profile_category,
    j.job_position as jobs_name,
    j.category as jobs_category,
    j.code_prefix,
    CASE 
        WHEN p.category IS NULL THEN 'No Match'
        WHEN UPPER(extract_job_name(p.job_position_name)) = UPPER(j.job_position) THEN 'Matched'
        ELSE 'Mismatch'
    END as match_status
FROM profiles p
LEFT JOIN jobs j ON UPPER(extract_job_name(p.job_position_name)) = UPPER(j.job_position) AND j.is_active = true
WHERE p.job_position_name IS NOT NULL;

-- Step 11: Show the view results
SELECT 'PROFILES WITH JOB INFO VIEW' as info;
SELECT * FROM profiles_with_job_info LIMIT 10;

-- Clean up: Drop the function if you don't want to keep it
-- DROP FUNCTION IF EXISTS extract_job_name(TEXT);
