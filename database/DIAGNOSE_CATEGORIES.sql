-- Diagnostic script to check what's in your profiles table
-- Run this first to see the current state

-- Step 1: Check overall table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('category', 'job_position_name', 'job_position_id')
ORDER BY ordinal_position;

-- Step 2: Check current category distribution
SELECT 
    'CURRENT STATE' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 3: Show all unique job_position_name values
SELECT 
    'UNIQUE JOB POSITIONS' as info,
    job_position_name,
    COUNT(*) as count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_categories
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY job_position_name
ORDER BY count DESC;

-- Step 4: Show profiles with NULL categories and their job positions
SELECT 
    'PROFILES WITH NULL CATEGORIES' as info,
    id,
    name,
    job_position_name,
    job_position_id,
    category,
    created_at
FROM profiles 
WHERE category IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- Step 5: Check if there are any job_position_id values that might link to a jobs table
SELECT 
    'JOB POSITION IDS' as info,
    job_position_id,
    COUNT(*) as count
FROM profiles 
WHERE job_position_id IS NOT NULL
GROUP BY job_position_id
ORDER BY count DESC
LIMIT 10;

-- Step 6: Check if jobs table exists and has data
SELECT 
    'JOBS TABLE CHECK' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as jobs_table_status;

-- If jobs table exists, show its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'jobs'
ORDER BY ordinal_position;
