-- CHECK ALVIN DULAMIT SPECIFIC DATA
-- Run this to see exactly what's happening with ALVIN DULAMIT's data

-- Step 1: Find ALVIN DULAMIT in profiles table
SELECT 'ALVIN DULAMIT IN PROFILES TABLE:' as info;
SELECT 
    id,
    name,
    email,
    ic_number,
    job_position_name,
    job_position_id,
    category as profile_category,
    user_type,
    created_at,
    updated_at
FROM profiles 
WHERE name ILIKE '%ALVIN%DULAMIT%'
   OR name ILIKE '%ALVIN DULAMIT%'
   OR ic_number = '910522-12-5429';

-- Step 2: Find ALVIN DULAMIT in test_submissions table
SELECT 'ALVIN DULAMIT IN TEST_SUBMISSIONS TABLE:' as info;
SELECT 
    id,
    user_id,
    user_name,
    ic_number,
    job_position_name,
    job_category,
    test_type,
    score,
    correct_answers,
    total_questions,
    submitted_at
FROM test_submissions 
WHERE user_name ILIKE '%ALVIN%DULAMIT%'
   OR user_name ILIKE '%ALVIN DULAMIT%'
   OR ic_number = '910522-12-5429'
ORDER BY submitted_at DESC;

-- Step 3: Check if ALVIN has a job_position_id that links to jobs table
SELECT 'ALVIN DULAMIT JOB POSITION LINK:' as info;
SELECT 
    p.name,
    p.job_position_name,
    p.job_position_id,
    p.category as profile_category,
    j.job_position as job_name,
    j.category as job_category
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%ALVIN%DULAMIT%'
   OR p.name ILIKE '%ALVIN DULAMIT%'
   OR p.ic_number = '910522-12-5429';

-- Step 4: Check for any data inconsistencies
SELECT 'DATA CONSISTENCY CHECK:' as info;
SELECT 
    'Profile Category' as source,
    p.category as category_value,
    'N/A' as test_type
FROM profiles p
WHERE p.name ILIKE '%ALVIN%DULAMIT%'
   OR p.name ILIKE '%ALVIN DULAMIT%'
   OR p.ic_number = '910522-12-5429'

UNION ALL

SELECT 
    'Test Submission Job Category' as source,
    ts.job_category as category_value,
    ts.test_type
FROM test_submissions ts
WHERE ts.user_name ILIKE '%ALVIN%DULAMIT%'
   OR ts.user_name ILIKE '%ALVIN DULAMIT%'
   OR ts.ic_number = '910522-12-5429'

ORDER BY source, test_type;

-- Step 5: Check if there are multiple ALVIN DULAMIT entries
SELECT 'MULTIPLE ENTRIES CHECK:' as info;
SELECT 
    'Profiles' as table_name,
    COUNT(*) as count
FROM profiles 
WHERE name ILIKE '%ALVIN%DULAMIT%'
   OR name ILIKE '%ALVIN DULAMIT%'
   OR ic_number = '910522-12-5429'

UNION ALL

SELECT 
    'Test Submissions' as table_name,
    COUNT(*) as count
FROM test_submissions 
WHERE user_name ILIKE '%ALVIN%DULAMIT%'
   OR user_name ILIKE '%ALVIN DULAMIT%'
   OR ic_number = '910522-12-5429';

SELECT '✅ ALVIN DULAMIT data check completed!' as result;
