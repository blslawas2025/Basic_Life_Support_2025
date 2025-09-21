-- COMPREHENSIVE DATA AUDIT FOR SUPABASE
-- This script will check for any data mismatches or wrong data

-- ============================================================================
-- STEP 1: CHECK TABLE STRUCTURES
-- ============================================================================

SELECT '=== TABLE STRUCTURES ===' as section;

-- Check profiles table structure
SELECT 
    'PROFILES TABLE COLUMNS' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('category', 'job_position_name', 'job_position_id', 'user_type', 'name', 'ic_number')
ORDER BY ordinal_position;

-- Check if jobs table exists
SELECT 
    'JOBS TABLE STATUS' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as jobs_table_status;

-- Check test_submissions table structure
SELECT 
    'TEST_SUBMISSIONS TABLE COLUMNS' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'test_submissions' 
  AND column_name IN ('job_category', 'user_name', 'user_id', 'test_type')
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 2: CHECK ALVIN DULAMIT SPECIFICALLY
-- ============================================================================

SELECT '=== ALVIN DULAMIT DATA CHECK ===' as section;

-- Check ALVIN DULAMIT in profiles table
SELECT 
    'ALVIN IN PROFILES' as info,
    id,
    name,
    email,
    ic_number,
    job_position_name,
    job_position_id,
    category,
    user_type
FROM profiles 
WHERE name ILIKE '%ALVIN DULAMIT%'
   OR name ILIKE '%ALVIN%DULAMIT%';

-- Check ALVIN DULAMIT in test_submissions table
SELECT 
    'ALVIN IN TEST_SUBMISSIONS' as info,
    id,
    user_id,
    user_name,
    ic_number,
    job_position_name,
    job_category,
    test_type,
    submitted_at
FROM test_submissions 
WHERE user_name ILIKE '%ALVIN DULAMIT%'
   OR user_name ILIKE '%ALVIN%DULAMIT%'
ORDER BY submitted_at DESC;

-- ============================================================================
-- STEP 3: CHECK CATEGORY DISTRIBUTION
-- ============================================================================

SELECT '=== CATEGORY DISTRIBUTION ===' as section;

-- Profiles table category distribution
SELECT 
    'PROFILES CATEGORIES' as info,
    COALESCE(category, 'NULL') as category,
    COUNT(*) as count
FROM profiles 
WHERE user_type = 'participant'
GROUP BY category
ORDER BY category;

-- Test submissions category distribution
SELECT 
    'TEST_SUBMISSIONS CATEGORIES' as info,
    COALESCE(job_category, 'NULL') as job_category,
    COUNT(*) as count
FROM test_submissions 
GROUP BY job_category
ORDER BY job_category;

-- ============================================================================
-- STEP 4: CHECK FOR MISMATCHES
-- ============================================================================

SELECT '=== DATA MISMATCHES ===' as section;

-- Check profiles vs test_submissions category mismatches
SELECT 
    'CATEGORY MISMATCHES' as info,
    p.name,
    p.ic_number,
    p.category as profile_category,
    ts.job_category as test_submission_category,
    ts.test_type,
    ts.submitted_at
FROM profiles p
JOIN test_submissions ts ON p.id = ts.user_id
WHERE p.category IS DISTINCT FROM ts.job_category
  AND p.name ILIKE '%ALVIN DULAMIT%'
ORDER BY ts.submitted_at DESC;

-- Check all category mismatches (not just ALVIN)
SELECT 
    'ALL CATEGORY MISMATCHES' as info,
    COUNT(*) as mismatch_count
FROM profiles p
JOIN test_submissions ts ON p.id = ts.user_id
WHERE p.category IS DISTINCT FROM ts.job_category;

-- ============================================================================
-- STEP 5: CHECK JOB POSITION DATA
-- ============================================================================

SELECT '=== JOB POSITION ANALYSIS ===' as section;

-- Check unique job positions in profiles
SELECT 
    'UNIQUE JOB POSITIONS IN PROFILES' as info,
    job_position_name,
    category,
    COUNT(*) as participant_count
FROM profiles 
WHERE job_position_name IS NOT NULL
  AND user_type = 'participant'
GROUP BY job_position_name, category
ORDER BY participant_count DESC;

-- If jobs table exists, check it
SELECT 
    'JOBS TABLE CONTENT' as info,
    job_position,
    category,
    COUNT(*) as count
FROM jobs 
WHERE is_active = true
GROUP BY job_position, category
ORDER BY job_position;

-- ============================================================================
-- STEP 6: CHECK TEST SUBMISSION DATA QUALITY
-- ============================================================================

SELECT '=== TEST SUBMISSION DATA QUALITY ===' as section;

-- Check for NULL job_categories in test_submissions
SELECT 
    'NULL JOB_CATEGORIES IN TEST_SUBMISSIONS' as info,
    COUNT(*) as null_count
FROM test_submissions 
WHERE job_category IS NULL;

-- Check for inconsistent job_categories for same user
SELECT 
    'INCONSISTENT JOB_CATEGORIES' as info,
    user_id,
    user_name,
    COUNT(DISTINCT job_category) as category_count,
    STRING_AGG(DISTINCT job_category, ', ') as categories
FROM test_submissions 
GROUP BY user_id, user_name
HAVING COUNT(DISTINCT job_category) > 1
ORDER BY category_count DESC;

-- ============================================================================
-- STEP 7: SUMMARY
-- ============================================================================

SELECT '=== SUMMARY ===' as section;

SELECT 
    'DATA SUMMARY' as info,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'participant') as total_participants,
    (SELECT COUNT(*) FROM test_submissions) as total_test_submissions,
    (SELECT COUNT(*) FROM profiles WHERE category = 'Clinical') as clinical_profiles,
    (SELECT COUNT(*) FROM profiles WHERE category = 'Non-Clinical') as non_clinical_profiles,
    (SELECT COUNT(*) FROM test_submissions WHERE job_category = 'Clinical') as clinical_test_submissions,
    (SELECT COUNT(*) FROM test_submissions WHERE job_category = 'Non-Clinical') as non_clinical_test_submissions;

SELECT '✅ Data audit completed! Check results above for any issues.' as result;
