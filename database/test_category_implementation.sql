-- Test script to verify category column implementation
-- This script tests the automatic category filling functionality

-- Test 1: Check if category column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'category';

-- Test 2: Check if triggers exist
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'profiles' 
AND trigger_name LIKE '%category%';

-- Test 2.5: Check if jobs table exists and is ready
SELECT is_jobs_table_ready() as jobs_table_ready;

-- Test 3: Test the trigger functionality with a sample insert
-- First, let's see what jobs are available (only if table exists)
SELECT 
    CASE 
        WHEN is_jobs_table_ready() THEN 'Jobs table is ready'
        ELSE 'Jobs table not ready'
    END as status;

-- If jobs table exists, show available jobs
SELECT id, name, category FROM jobs WHERE is_active = true LIMIT 5;

-- Test 4: Check existing profiles and their categories
SELECT 
    p.id, 
    p.name, 
    p.job_position_name,
    p.category,
    CASE 
        WHEN is_jobs_table_ready() THEN j.name
        ELSE 'Jobs table not available'
    END as job_name,
    CASE 
        WHEN is_jobs_table_ready() THEN j.category
        ELSE 'Jobs table not available'
    END as job_category
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id AND is_jobs_table_ready()
LIMIT 10;

-- Test 5: Test the update function
-- This will update all profiles' categories based on their job positions
SELECT 
    CASE 
        WHEN is_jobs_table_ready() THEN update_all_profiles_categories()
        ELSE 0
    END as updated_count;

-- Test 6: Verify the results after update
SELECT 
    p.id, 
    p.name, 
    p.job_position_name,
    p.category,
    CASE 
        WHEN is_jobs_table_ready() THEN j.name
        ELSE 'Jobs table not available'
    END as job_name,
    CASE 
        WHEN is_jobs_table_ready() THEN j.category
        ELSE 'Jobs table not available'
    END as job_category
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id AND is_jobs_table_ready()
WHERE p.category IS NOT NULL
LIMIT 10;

-- Test 7: Test the view (only if it exists)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'profiles_with_categories') THEN 'View exists'
        ELSE 'View does not exist (jobs table not ready)'
    END as view_status;

-- If view exists, show data
SELECT 
    id,
    name,
    job_name,
    job_category,
    category
FROM profiles_with_categories
LIMIT 10;

-- Test 8: Test category distribution
SELECT 
    category,
    COUNT(*) as profile_count
FROM profiles
WHERE category IS NOT NULL
GROUP BY category
ORDER BY category;
