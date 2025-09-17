-- Comprehensive Category Audit and Fix
-- This script will identify and fix all category mismatches between jobs and profiles

-- Step 1: Audit current state - Show mismatches between jobs and profiles
SELECT 
    '=== CATEGORY MISMATCH ANALYSIS ===' as info;

SELECT 
    'Profiles vs Jobs Category Comparison:' as section,
    p.job_position_name,
    p.category as profile_category,
    j.job_position as job_name,
    j.category as job_category,
    COUNT(*) as count
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.job_position_name IS NOT NULL
GROUP BY p.job_position_name, p.category, j.job_position, j.category
ORDER BY p.job_position_name, p.category;

-- Step 2: Show profiles that should be Non-Clinical but are showing as Clinical
SELECT 
    '=== PROFILES INCORRECTLY MARKED AS CLINICAL ===' as info;

SELECT 
    'Non-Clinical positions marked as Clinical:' as section,
    p.name,
    p.job_position_name,
    p.category as current_category,
    COUNT(*) as count
FROM profiles p
WHERE p.category = 'Clinical'
  AND (
    p.job_position_name ILIKE '%FARMASI%' OR
    p.job_position_name ILIKE '%JURUTEKNOLOGI%' OR
    p.job_position_name ILIKE '%JURUPULIH%' OR
    p.job_position_name ILIKE '%PENOLONG PEGAWAI TADBIR%' OR
    p.job_position_name ILIKE '%PEMBANTU KHIDMAT%' OR
    p.job_position_name ILIKE '%PEGAWAI TADBIR%' OR
    p.job_position_name ILIKE '%PEGAWAI KHIDMAT%' OR
    p.job_position_name ILIKE '%PEGAWAI TEKNIKAL%' OR
    p.job_position_name ILIKE '%PEGAWAI PENYELIDIKAN%' OR
    p.job_position_name ILIKE '%PEGAWAI MAKMAL%'
  )
GROUP BY p.name, p.job_position_name, p.category
ORDER BY p.job_position_name;

-- Step 3: Show all unique job positions and their current categories
SELECT 
    '=== ALL JOB POSITIONS AND CATEGORIES ===' as info;

SELECT 
    'Job positions in profiles table:' as section,
    job_position_name,
    category,
    COUNT(*) as participant_count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY job_position_name, category
ORDER BY job_position_name, category;

-- Step 4: Show jobs table categories
SELECT 
    'Job positions in jobs table:' as section,
    job_position,
    category,
    COUNT(*) as job_count
FROM jobs 
GROUP BY job_position, category
ORDER BY job_position, category;

-- Step 5: Comprehensive fix - Update all profiles based on job position names
-- This will fix all mismatches regardless of jobs table
SELECT 
    '=== APPLYING COMPREHENSIVE FIX ===' as info;

-- Fix all Clinical positions
UPDATE profiles 
SET 
    category = 'Clinical',
    updated_at = NOW()
WHERE (
    job_position_name ILIKE '%JURURAWAT%' OR
    job_position_name ILIKE '%PEGAWAI PERGIGIAN%' OR
    job_position_name ILIKE '%PEGAWAI PERUBATAN%' OR
    job_position_name ILIKE '%PENOLONG PEGAWAI PERUBATAN%' OR
    job_position_name ILIKE '%PEMBANTU PERAWATAN%' OR
    job_position_name ILIKE '%PEGAWAI PERUBATAN KESIHATAN%' OR
    job_position_name ILIKE '%PENOLONG PEGAWAI PERUBATAN KESIHATAN%' OR
    job_position_name ILIKE '%PEGAWAI PERUBATAN UD%' OR
    job_position_name ILIKE '%PEMBANTU PEGAWAI PERUBATAN%'
) AND category != 'Clinical';

-- Fix all Non-Clinical positions
UPDATE profiles 
SET 
    category = 'Non-Clinical',
    updated_at = NOW()
WHERE (
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
    job_position_name ILIKE '%PEGAWAI MAKMAL%' OR
    job_position_name ILIKE '%PEGAWAI FARMASI%' OR
    job_position_name ILIKE '%JURU X-RAY%' OR
    job_position_name ILIKE '%JURU RADIOLOGI%' OR
    job_position_name ILIKE '%PEGAWAI FARMASI UF%'
) AND category != 'Non-Clinical';

-- Step 6: Update jobs table to match the corrected categories
UPDATE jobs 
SET 
    category = 'Clinical',
    updated_at = NOW()
WHERE (
    job_position ILIKE '%JURURAWAT%' OR
    job_position ILIKE '%PEGAWAI PERGIGIAN%' OR
    job_position ILIKE '%PEGAWAI PERUBATAN%' OR
    job_position ILIKE '%PENOLONG PEGAWAI PERUBATAN%' OR
    job_position ILIKE '%PEMBANTU PERAWATAN%'
) AND category != 'Clinical';

UPDATE jobs 
SET 
    category = 'Non-Clinical',
    updated_at = NOW()
WHERE (
    job_position ILIKE '%PEGAWAI FARMASI%' OR
    job_position ILIKE '%PENOLONG PEGAWAI FARMASI%' OR
    job_position_name ILIKE '%JURUTEKNOLOGI%' OR
    job_position_name ILIKE '%JURUPULIH%' OR
    job_position_name ILIKE '%PENOLONG PEGAWAI TADBIR%' OR
    job_position_name ILIKE '%PEMBANTU KHIDMAT%'
) AND category != 'Non-Clinical';

-- Step 7: Final verification
SELECT 
    '=== FINAL VERIFICATION ===' as info;

SELECT 
    'Category distribution after fix:' as section,
    category,
    COUNT(*) as count
FROM profiles 
GROUP BY category
ORDER BY category;

-- Step 8: Show remaining mismatches (should be none)
SELECT 
    'Remaining mismatches between profiles and jobs:' as section,
    p.job_position_name,
    p.category as profile_category,
    j.job_position,
    j.category as job_category,
    COUNT(*) as count
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.job_position_name IS NOT NULL
  AND p.category IS DISTINCT FROM j.category
GROUP BY p.job_position_name, p.category, j.job_position, j.category
ORDER BY p.job_position_name;

SELECT '✅ Comprehensive category fix completed!' as result;
