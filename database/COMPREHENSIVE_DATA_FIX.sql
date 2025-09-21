-- COMPREHENSIVE DATA FIX FOR SUPABASE
-- This script fixes ALL identified data issues in the database
-- Run this in Supabase SQL Editor with service key access

-- ============================================================================
-- SECTION 1: BACKUP AND PREPARATION
-- ============================================================================

-- Create backup tables before making changes
CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM profiles;
CREATE TABLE IF NOT EXISTS test_submissions_backup AS SELECT * FROM test_submissions;
CREATE TABLE IF NOT EXISTS jobs_backup AS SELECT * FROM jobs;

-- ============================================================================
-- SECTION 2: FIX CATEGORY MISMATCHES
-- ============================================================================

-- Step 1: Fix NULL categories in profiles table
UPDATE profiles 
SET category = j.category
FROM jobs j
WHERE profiles.job_position_id = j.id 
  AND profiles.category IS NULL;

-- Step 2: Fix categories based on job position names (for cases where job_position_id is NULL)
UPDATE profiles 
SET category = 'Clinical'
WHERE category IS NULL 
  AND (
    job_position_name ILIKE '%JURURAWAT%' OR
    job_position_name ILIKE '%PEGAWAI PERGIGIAN%' OR
    job_position_name ILIKE '%PEGAWAI PERUBATAN%' OR
    job_position_name ILIKE '%PENOLONG PEGAWAI PERUBATAN%' OR
    job_position_name ILIKE '%PEMBANTU PERAWATAN%' OR
    job_position_name ILIKE '%PEGAWAI PERUBATAN KESIHATAN%' OR
    job_position_name ILIKE '%PENOLONG PEGAWAI PERUBATAN KESIHATAN%' OR
    job_position_name ILIKE '%PEGAWAI PERUBATAN UD%' OR
    job_position_name ILIKE '%PEMBANTU PEGAWAI PERUBATAN%' OR
    job_position_name ILIKE '%JURU X-RAY%' OR
    job_position_name ILIKE '%JURU RADIOLOGI%'
  );

UPDATE profiles 
SET category = 'Non-Clinical'
WHERE category IS NULL 
  AND (
    job_position_name ILIKE '%PEGAWAI FARMASI%' OR
    job_position_name ILIKE '%PENOLONG PEGAWAI FARMASI%' OR
    job_position_name ILIKE '%JURUTEKNOLOGI%' OR
    job_position_name ILIKE '%JURUPULIH%' OR
    job_position_name ILIKE '%PENOLONG PEGAWAI TADBIR%' OR
    job_position_name ILIKE '%PEMBANTU KHIDMAT%' OR
    job_position_name ILIKE '%PEGAWAI TADBIR%' OR
    job_position_name ILIKE '%PEGAWAI KHIDMAT%' OR
    job_position_name ILIKE '%PEGAWAI TEKNIKAL%' OR
    job_position_name ILIKE '%PEGAWAI PENYELIDIKAN%' OR
    job_position_name ILIKE '%PEGAWAI MAKMAL%'
  );

-- Step 3: Fix job categories in jobs table to match profiles
UPDATE jobs 
SET category = 'Clinical'
WHERE (
    job_position ILIKE '%JURURAWAT%' OR
    job_position ILIKE '%PEGAWAI PERGIGIAN%' OR
    job_position ILIKE '%PEGAWAI PERUBATAN%' OR
    job_position ILIKE '%PENOLONG PEGAWAI PERUBATAN%' OR
    job_position ILIKE '%PEMBANTU PERAWATAN%'
) AND category != 'Clinical';

UPDATE jobs 
SET category = 'Non-Clinical'
WHERE (
    job_position ILIKE '%PEGAWAI FARMASI%' OR
    job_position ILIKE '%PENOLONG PEGAWAI FARMASI%' OR
    job_position ILIKE '%JURUTEKNOLOGI%' OR
    job_position ILIKE '%JURUPULIH%' OR
    job_position ILIKE '%PENOLONG PEGAWAI TADBIR%' OR
    job_position ILIKE '%PEMBANTU KHIDMAT%'
) AND category != 'Non-Clinical';

-- ============================================================================
-- SECTION 3: FIX TEST_SUBMISSIONS CATEGORY MISMATCHES
-- ============================================================================

-- Update test_submissions job_category to match profiles category
UPDATE test_submissions 
SET job_category = p.category
FROM profiles p
WHERE test_submissions.user_id = p.id 
  AND test_submissions.job_category IS DISTINCT FROM p.category
  AND p.category IS NOT NULL;

-- ============================================================================
-- SECTION 4: FIX DATA QUALITY ISSUES
-- ============================================================================

-- Fix invalid test scores
UPDATE test_submissions 
SET score = GREATEST(0, LEAST(score, total_questions))
WHERE score < 0 OR score > total_questions;

-- Fix invalid correct_answers
UPDATE test_submissions 
SET correct_answers = GREATEST(0, LEAST(correct_answers, total_questions))
WHERE correct_answers < 0 OR correct_answers > total_questions;

-- Fix invalid time_taken_seconds
UPDATE test_submissions 
SET time_taken_seconds = GREATEST(0, time_taken_seconds)
WHERE time_taken_seconds < 0;

-- ============================================================================
-- SECTION 5: FIX JOB POSITION NAME MISMATCHES
-- ============================================================================

-- Update job_position_name in profiles to match jobs table
UPDATE profiles 
SET job_position_name = j.job_position
FROM jobs j
WHERE profiles.job_position_id = j.id 
  AND profiles.job_position_name != j.job_position;

-- ============================================================================
-- SECTION 6: FIX ORPHANED RECORDS
-- ============================================================================

-- Delete test_submissions that don't have corresponding profiles
DELETE FROM test_submissions 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- ============================================================================
-- SECTION 7: FIX DUPLICATE RECORDS
-- ============================================================================

-- Remove duplicate profiles (keep the latest one)
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM profiles
    WHERE email IS NOT NULL
)
DELETE FROM profiles 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- Remove duplicate test_submissions (keep the latest one)
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, test_type ORDER BY submitted_at DESC) as rn
    FROM test_submissions
)
DELETE FROM test_submissions 
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- ============================================================================
-- SECTION 8: FIX NULL VALUES IN CRITICAL FIELDS
-- ============================================================================

-- Set default user_type for NULL values
UPDATE profiles 
SET user_type = 'participant'
WHERE user_type IS NULL;

-- Set default status for NULL values
UPDATE profiles 
SET status = 'pending'
WHERE status IS NULL;

-- Set default payment_status for NULL values
UPDATE profiles 
SET payment_status = 'pending'
WHERE payment_status IS NULL;

-- ============================================================================
-- SECTION 9: FIX CHECKLIST DATA ISSUES
-- ============================================================================

-- Fix choking checklist items that have invalid sections
UPDATE checklist_item 
SET section = 'danger'
WHERE checklist_type IN ('adult choking', 'infant choking') 
  AND section IN ('shout for help', 'circulation', 'defribillation');

-- ============================================================================
-- SECTION 10: VALIDATION AND VERIFICATION
-- ============================================================================

-- Check for remaining NULL categories
SELECT 
    'REMAINING NULL CATEGORIES' as issue,
    COUNT(*) as count
FROM profiles 
WHERE category IS NULL;

-- Check for category mismatches between profiles and test_submissions
SELECT 
    'REMAINING CATEGORY MISMATCHES' as issue,
    COUNT(*) as count
FROM profiles p
JOIN test_submissions ts ON p.id = ts.user_id
WHERE p.category IS DISTINCT FROM ts.job_category;

-- Check for invalid test scores
SELECT 
    'REMAINING INVALID TEST SCORES' as issue,
    COUNT(*) as count
FROM test_submissions 
WHERE score < 0 OR score > total_questions OR correct_answers < 0 OR correct_answers > total_questions;

-- Check for orphaned test_submissions
SELECT 
    'REMAINING ORPHANED TEST_SUBMISSIONS' as issue,
    COUNT(*) as count
FROM test_submissions 
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Check for duplicate emails
SELECT 
    'REMAINING DUPLICATE EMAILS' as issue,
    COUNT(*) as count
FROM (
    SELECT email, COUNT(*) as cnt
    FROM profiles 
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
) duplicates;

-- ============================================================================
-- SECTION 11: FINAL SUMMARY
-- ============================================================================

-- Show final data summary
SELECT 
    'FINAL DATA SUMMARY' as summary_type,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles WHERE user_type = 'participant') as total_participants,
    (SELECT COUNT(*) FROM test_submissions) as total_test_submissions,
    (SELECT COUNT(*) FROM jobs) as total_jobs,
    (SELECT COUNT(*) FROM profiles WHERE category = 'Clinical') as clinical_profiles,
    (SELECT COUNT(*) FROM profiles WHERE category = 'Non-Clinical') as non_clinical_profiles,
    (SELECT COUNT(*) FROM test_submissions WHERE job_category = 'Clinical') as clinical_test_submissions,
    (SELECT COUNT(*) FROM test_submissions WHERE job_category = 'Non-Clinical') as non_clinical_test_submissions;

-- Show category distribution
SELECT 
    'CATEGORY DISTRIBUTION' as info,
    COALESCE(category, 'NULL') as category,
    COUNT(*) as count
FROM profiles 
GROUP BY category
ORDER BY category;

-- Show test submission category distribution
SELECT 
    'TEST_SUBMISSIONS CATEGORY DISTRIBUTION' as info,
    COALESCE(job_category, 'NULL') as job_category,
    COUNT(*) as count
FROM test_submissions 
GROUP BY job_category
ORDER BY job_category;

SELECT '✅ Comprehensive data fix completed! All major issues have been addressed.' as result;
