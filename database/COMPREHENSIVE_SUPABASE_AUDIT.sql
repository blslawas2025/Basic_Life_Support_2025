-- COMPREHENSIVE SUPABASE DATA AUDIT
-- This script checks ALL tables for data inconsistencies and anomalies
-- Run this in Supabase SQL Editor

-- ============================================================================
-- SECTION 1: DISCOVER ALL TABLES AND THEIR STRUCTURE
-- ============================================================================

SELECT '=== ALL TABLES IN DATABASE ===' as section;

SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_name IN ('profiles', 'jobs', 'test_submissions', 'questions', 'question_answers', 'checklists', 'checklist_items', 'attendance_records', 'course_sessions') 
        THEN '✅ MAIN TABLE'
        ELSE '📋 OTHER TABLE'
    END as table_importance
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_importance DESC, table_name;

-- ============================================================================
-- SECTION 2: DETAILED TABLE STRUCTURE ANALYSIS
-- ============================================================================

SELECT '=== PROFILES TABLE STRUCTURE ===' as section;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 3: DATA QUALITY CHECKS
-- ============================================================================

SELECT '=== PROFILES DATA QUALITY ===' as section;

-- Check total profiles
SELECT 
    'TOTAL PROFILES' as metric,
    COUNT(*) as count
FROM profiles;

-- Check user types distribution
SELECT 
    'USER TYPES DISTRIBUTION' as metric,
    COALESCE(user_type, 'NULL') as user_type,
    COUNT(*) as count
FROM profiles 
GROUP BY user_type
ORDER BY count DESC;

-- Check status distribution
SELECT 
    'STATUS DISTRIBUTION' as metric,
    COALESCE(status, 'NULL') as status,
    COUNT(*) as count
FROM profiles 
GROUP BY status
ORDER BY count DESC;

-- Check payment status distribution
SELECT 
    'PAYMENT STATUS DISTRIBUTION' as metric,
    COALESCE(payment_status, 'NULL') as payment_status,
    COUNT(*) as count
FROM profiles 
GROUP BY payment_status
ORDER BY count DESC;

-- Check category distribution
SELECT 
    'CATEGORY DISTRIBUTION' as metric,
    COALESCE(category, 'NULL') as category,
    COUNT(*) as count
FROM profiles 
GROUP BY category
ORDER BY count DESC;

-- ============================================================================
-- SECTION 4: DATA INCONSISTENCIES
-- ============================================================================

SELECT '=== DATA INCONSISTENCIES ===' as section;

-- Check for NULL values in critical fields
SELECT 
    'NULL VALUES IN CRITICAL FIELDS' as issue,
    'name' as field,
    COUNT(*) as null_count
FROM profiles 
WHERE name IS NULL
UNION ALL
SELECT 
    'NULL VALUES IN CRITICAL FIELDS' as issue,
    'email' as field,
    COUNT(*) as null_count
FROM profiles 
WHERE email IS NULL
UNION ALL
SELECT 
    'NULL VALUES IN CRITICAL FIELDS' as issue,
    'user_type' as field,
    COUNT(*) as null_count
FROM profiles 
WHERE user_type IS NULL;

-- Check for invalid email formats
SELECT 
    'INVALID EMAIL FORMATS' as issue,
    email,
    name
FROM profiles 
WHERE email IS NOT NULL 
  AND email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
LIMIT 10;

-- Check for invalid IC numbers
SELECT 
    'INVALID IC NUMBERS' as issue,
    ic_number,
    name
FROM profiles 
WHERE ic_number IS NOT NULL 
  AND ic_number !~* '^[0-9]{12}$' 
  AND ic_number !~* '^[0-9]{6}-[0-9]{2}-[0-9]{4}$'
LIMIT 10;

-- Check for duplicate emails
SELECT 
    'DUPLICATE EMAILS' as issue,
    email,
    COUNT(*) as duplicate_count
FROM profiles 
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Check for duplicate IC numbers
SELECT 
    'DUPLICATE IC NUMBERS' as issue,
    ic_number,
    COUNT(*) as duplicate_count
FROM profiles 
WHERE ic_number IS NOT NULL
GROUP BY ic_number
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- ============================================================================
-- SECTION 5: TEST_SUBMISSIONS ANALYSIS
-- ============================================================================

SELECT '=== TEST_SUBMISSIONS DATA QUALITY ===' as section;

-- Check if test_submissions table exists and get count
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_submissions') 
        THEN 'TEST_SUBMISSIONS EXISTS'
        ELSE 'TEST_SUBMISSIONS NOT FOUND'
    END as table_status;

-- If test_submissions exists, analyze it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_submissions') THEN
        -- This will be executed if table exists
        NULL; -- Placeholder for dynamic analysis
    END IF;
END $$;

-- Get test_submissions count and basic stats
SELECT 
    'TOTAL TEST SUBMISSIONS' as metric,
    COUNT(*) as count
FROM test_submissions;

-- Check test type distribution
SELECT 
    'TEST TYPE DISTRIBUTION' as metric,
    COALESCE(test_type, 'NULL') as test_type,
    COUNT(*) as count
FROM test_submissions 
GROUP BY test_type
ORDER BY count DESC;

-- Check job category distribution in test_submissions
SELECT 
    'JOB CATEGORY DISTRIBUTION IN TEST_SUBMISSIONS' as metric,
    COALESCE(job_category, 'NULL') as job_category,
    COUNT(*) as count
FROM test_submissions 
GROUP BY job_category
ORDER BY count DESC;

-- Check for NULL job categories
SELECT 
    'NULL JOB CATEGORIES IN TEST_SUBMISSIONS' as issue,
    COUNT(*) as null_count
FROM test_submissions 
WHERE job_category IS NULL;

-- ============================================================================
-- SECTION 6: JOBS TABLE ANALYSIS
-- ============================================================================

SELECT '=== JOBS TABLE ANALYSIS ===' as section;

-- Check if jobs table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
        THEN 'JOBS TABLE EXISTS'
        ELSE 'JOBS TABLE NOT FOUND'
    END as table_status;

-- If jobs table exists, analyze it
SELECT 
    'TOTAL JOBS' as metric,
    COUNT(*) as count
FROM jobs;

-- Check job categories in jobs table
SELECT 
    'JOB CATEGORIES IN JOBS TABLE' as metric,
    COALESCE(category, 'NULL') as category,
    COUNT(*) as count
FROM jobs 
GROUP BY category
ORDER BY count DESC;

-- Check active vs inactive jobs
SELECT 
    'ACTIVE VS INACTIVE JOBS' as metric,
    COALESCE(is_active::text, 'NULL') as is_active,
    COUNT(*) as count
FROM jobs 
GROUP BY is_active
ORDER BY count DESC;

-- ============================================================================
-- SECTION 7: CROSS-TABLE CONSISTENCY CHECKS
-- ============================================================================

SELECT '=== CROSS-TABLE CONSISTENCY ===' as section;

-- Check profiles vs test_submissions category consistency
SELECT 
    'CATEGORY CONSISTENCY CHECK' as check_type,
    COUNT(*) as total_matches,
    COUNT(CASE WHEN p.category = ts.job_category THEN 1 END) as consistent_matches,
    COUNT(CASE WHEN p.category != ts.job_category THEN 1 END) as inconsistent_matches
FROM profiles p
JOIN test_submissions ts ON p.id = ts.user_id
WHERE p.category IS NOT NULL AND ts.job_category IS NOT NULL;

-- Show specific category mismatches
SELECT 
    'CATEGORY MISMATCHES' as issue,
    p.name,
    p.ic_number,
    p.category as profile_category,
    ts.job_category as test_submission_category,
    ts.test_type,
    ts.submitted_at
FROM profiles p
JOIN test_submissions ts ON p.id = ts.user_id
WHERE p.category IS DISTINCT FROM ts.job_category
ORDER BY ts.submitted_at DESC
LIMIT 20;

-- Check job position name consistency between profiles and jobs
SELECT 
    'JOB POSITION NAME CONSISTENCY' as check_type,
    COUNT(DISTINCT p.job_position_name) as unique_job_names_in_profiles,
    COUNT(DISTINCT j.name) as unique_job_names_in_jobs,
    COUNT(DISTINCT CASE WHEN p.job_position_name = j.name THEN p.job_position_name END) as matching_names
FROM profiles p
CROSS JOIN jobs j
WHERE p.job_position_name IS NOT NULL;

-- Find job position names in profiles that don't exist in jobs table
SELECT 
    'ORPHANED JOB POSITION NAMES' as issue,
    p.job_position_name,
    COUNT(*) as profile_count
FROM profiles p
LEFT JOIN jobs j ON p.job_position_name = j.name
WHERE p.job_position_name IS NOT NULL 
  AND j.name IS NULL
GROUP BY p.job_position_name
ORDER BY profile_count DESC;

-- ============================================================================
-- SECTION 8: FOREIGN KEY RELATIONSHIPS
-- ============================================================================

SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as section;

-- Check foreign key constraints
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- SECTION 9: DATA ANOMALIES AND EDGE CASES
-- ============================================================================

SELECT '=== DATA ANOMALIES ===' as section;

-- Check for profiles with test submissions but no category
SELECT 
    'PROFILES WITH TEST SUBMISSIONS BUT NO CATEGORY' as issue,
    p.name,
    p.email,
    p.category,
    COUNT(ts.id) as test_submission_count
FROM profiles p
JOIN test_submissions ts ON p.id = ts.user_id
WHERE p.category IS NULL
GROUP BY p.id, p.name, p.email, p.category
ORDER BY test_submission_count DESC;

-- Check for test submissions with no corresponding profile
SELECT 
    'TEST SUBMISSIONS WITH NO PROFILE' as issue,
    ts.user_name,
    ts.user_email,
    ts.user_id,
    ts.submitted_at
FROM test_submissions ts
LEFT JOIN profiles p ON ts.user_id = p.id
WHERE p.id IS NULL
ORDER BY ts.submitted_at DESC;

-- Check for unusual score patterns
SELECT 
    'UNUSUAL SCORE PATTERNS' as issue,
    'Scores > 30' as pattern,
    COUNT(*) as count
FROM test_submissions 
WHERE score > 30
UNION ALL
SELECT 
    'UNUSUAL SCORE PATTERNS' as issue,
    'Scores < 0' as pattern,
    COUNT(*) as count
FROM test_submissions 
WHERE score < 0
UNION ALL
SELECT 
    'UNUSUAL SCORE PATTERNS' as issue,
    'Correct answers > total questions' as pattern,
    COUNT(*) as count
FROM test_submissions 
WHERE correct_answers > total_questions;

-- Check for duplicate test submissions (same user, same test type, same day)
SELECT 
    'POTENTIAL DUPLICATE TEST SUBMISSIONS' as issue,
    user_name,
    user_email,
    test_type,
    DATE(submitted_at) as submission_date,
    COUNT(*) as submission_count
FROM test_submissions 
GROUP BY user_name, user_email, test_type, DATE(submitted_at)
HAVING COUNT(*) > 1
ORDER BY submission_count DESC, submission_date DESC;

-- ============================================================================
-- SECTION 10: SUMMARY AND RECOMMENDATIONS
-- ============================================================================

SELECT '=== AUDIT SUMMARY ===' as section;

-- Overall data summary
SELECT 
    'DATA SUMMARY' as summary_type,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'participant') as total_participants,
    (SELECT COUNT(*) FROM test_submissions) as total_test_submissions,
    (SELECT COUNT(*) FROM jobs) as total_jobs,
    (SELECT COUNT(*) FROM profiles WHERE category = 'Clinical') as clinical_profiles,
    (SELECT COUNT(*) FROM profiles WHERE category = 'Non-Clinical') as non_clinical_profiles,
    (SELECT COUNT(*) FROM test_submissions WHERE job_category = 'Clinical') as clinical_test_submissions,
    (SELECT COUNT(*) FROM test_submissions WHERE job_category = 'Non-Clinical') as non_clinical_test_submissions;

-- Data quality score
WITH quality_metrics AS (
    SELECT 
        (SELECT COUNT(*) FROM profiles WHERE name IS NOT NULL AND email IS NOT NULL) as valid_profiles,
        (SELECT COUNT(*) FROM profiles) as total_profiles,
        (SELECT COUNT(*) FROM test_submissions WHERE job_category IS NOT NULL) as valid_test_submissions,
        (SELECT COUNT(*) FROM test_submissions) as total_test_submissions
)
SELECT 
    'DATA QUALITY SCORE' as metric,
    ROUND(
        (valid_profiles::float / NULLIF(total_profiles, 0) * 0.5 + 
         valid_test_submissions::float / NULLIF(total_test_submissions, 0) * 0.5) * 100, 
        2
    ) as quality_percentage
FROM quality_metrics;

SELECT '✅ Comprehensive audit completed! Review all sections above for data issues.' as result;
