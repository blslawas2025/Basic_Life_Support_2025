-- Test script to verify automatic category filling
-- This script tests both existing data and new insertions

-- Test 1: Check current state of profiles and their categories
SELECT 
    'Current profiles with categories' as test_name,
    COUNT(*) as total_profiles,
    COUNT(category) as profiles_with_category,
    COUNT(*) - COUNT(category) as profiles_without_category
FROM profiles;

-- Test 2: Show sample profiles and their job information
SELECT 
    'Sample profiles and job data' as test_name,
    p.name,
    p.job_position_name,
    p.category as current_category,
    j.category as job_category,
    CASE 
        WHEN p.category = j.category THEN 'MATCH'
        WHEN p.category IS NULL AND j.category IS NOT NULL THEN 'MISSING'
        WHEN p.category IS NOT NULL AND j.category IS NULL THEN 'EXTRA'
        ELSE 'MISMATCH'
    END as status
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.job_position_id IS NOT NULL
LIMIT 10;

-- Test 3: Check if triggers exist
SELECT 
    'Trigger check' as test_name,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'profiles' 
AND trigger_name LIKE '%category%';

-- Test 4: Test the update function
SELECT 
    'Update test' as test_name,
    update_all_profiles_categories_simple() as updated_count;

-- Test 5: Check results after update
SELECT 
    'Results after update' as test_name,
    p.name,
    p.job_position_name,
    p.category as current_category,
    j.category as job_category,
    CASE 
        WHEN p.category = j.category THEN 'MATCH'
        WHEN p.category IS NULL AND j.category IS NOT NULL THEN 'MISSING'
        WHEN p.category IS NOT NULL AND j.category IS NULL THEN 'EXTRA'
        ELSE 'MISMATCH'
    END as status
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.job_position_id IS NOT NULL
LIMIT 10;

-- Test 6: Test category distribution
SELECT 
    'Category distribution' as test_name,
    category,
    COUNT(*) as profile_count
FROM profiles
WHERE category IS NOT NULL
GROUP BY category
ORDER BY category;

-- Test 7: Test inserting a new profile (simulation)
-- This would test if the trigger works on new inserts
SELECT 
    'Trigger simulation' as test_name,
    'To test new inserts, create a test profile with a job_position_id' as instruction;
