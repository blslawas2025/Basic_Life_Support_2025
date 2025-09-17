-- SIMPLE MATCHING TEST
-- Let's try different approaches to match profiles with jobs

-- Step 1: Show what we have in both tables
SELECT 'PROFILES JOB POSITIONS' as info;
SELECT DISTINCT job_position_name FROM profiles WHERE job_position_name IS NOT NULL ORDER BY job_position_name;

SELECT 'JOBS TABLE POSITIONS' as info;
SELECT job_position FROM jobs WHERE is_active = true ORDER BY job_position;

-- Step 2: Try simple word matching
SELECT 'SIMPLE WORD MATCHING' as info;
SELECT 
    p.job_position_name,
    j.job_position,
    j.category
FROM profiles p
CROSS JOIN jobs j
WHERE p.job_position_name IS NOT NULL
  AND j.is_active = true
  AND (
    -- Try matching first word
    UPPER(SPLIT_PART(p.job_position_name, ' ', 1)) = UPPER(SPLIT_PART(j.job_position, ' ', 1))
    OR
    -- Try matching first two words
    UPPER(SPLIT_PART(p.job_position_name, ' ', 1) || ' ' || SPLIT_PART(p.job_position_name, ' ', 2)) = 
    UPPER(SPLIT_PART(j.job_position, ' ', 1) || ' ' || SPLIT_PART(j.job_position, ' ', 2))
    OR
    -- Try matching first three words
    UPPER(SPLIT_PART(p.job_position_name, ' ', 1) || ' ' || SPLIT_PART(p.job_position_name, ' ', 2) || ' ' || SPLIT_PART(p.job_position_name, ' ', 3)) = 
    UPPER(SPLIT_PART(j.job_position, ' ', 1) || ' ' || SPLIT_PART(j.job_position, ' ', 2) || ' ' || SPLIT_PART(j.job_position, ' ', 3))
  )
LIMIT 20;
