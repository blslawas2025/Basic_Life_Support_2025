-- Check both jobs table and job_grades_view
-- This will help us understand your job data structure

-- Step 1: Check jobs table structure
SELECT 
    'JOBS TABLE STRUCTURE' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'jobs'
ORDER BY ordinal_position;

-- Step 2: Check job_grades_view structure
SELECT 
    'JOB_GRADES_VIEW STRUCTURE' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'job_grades_view'
ORDER BY ordinal_position;

-- Step 3: Check jobs table data
SELECT 
    'JOBS TABLE DATA' as info,
    COUNT(*) as total_rows
FROM jobs;

SELECT * FROM jobs LIMIT 5;

-- Step 4: Check job_grades_view data
SELECT 
    'JOB_GRADES_VIEW DATA' as info,
    COUNT(*) as total_rows
FROM job_grades_view;

SELECT * FROM job_grades_view LIMIT 5;

-- Step 5: Check if there are any relationships between profiles and these tables
SELECT 
    'PROFILES WITH JOB POSITION IDS' as info,
    p.id,
    p.name,
    p.job_position_name,
    p.job_position_id,
    p.category
FROM profiles p
WHERE p.job_position_id IS NOT NULL
LIMIT 5;
