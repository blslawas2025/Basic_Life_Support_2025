-- Fix Non-Clinical Positions Incorrectly Marked as Clinical
-- This script specifically targets positions that should be Non-Clinical but are showing as Clinical

-- Step 1: Show current state of non-clinical positions
SELECT 
    '=== NON-CLINICAL POSITIONS CURRENTLY MARKED AS CLINICAL ===' as info;

SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE category = 'Clinical'
  AND (
    job_position_name ILIKE '%FARMASI%' OR
    job_position_name ILIKE '%JURUTEKNOLOGI%' OR
    job_position_name ILIKE '%JURUPULIH%' OR
    job_position_name ILIKE '%PENOLONG PEGAWAI TADBIR%' OR
    job_position_name ILIKE '%PEMBANTU KHIDMAT%' OR
    job_position_name ILIKE '%PEGAWAI TADBIR%' OR
    job_position_name ILIKE '%PEGAWAI KHIDMAT%' OR
    job_position_name ILIKE '%PEGAWAI TEKNIKAL%' OR
    job_position_name ILIKE '%PEGAWAI PENYELIDIKAN%' OR
    job_position_name ILIKE '%PEGAWAI MAKMAL%' OR
    job_position_name ILIKE '%JURU X-RAY%' OR
    job_position_name ILIKE '%JURU RADIOLOGI%'
  )
GROUP BY job_position_name, category
ORDER BY job_position_name;

-- Step 2: Fix PEGAWAI FARMASI positions (Pharmacy Officers - Non-Clinical)
UPDATE profiles 
SET 
    category = 'Non-Clinical',
    updated_at = NOW()
WHERE category = 'Clinical'
  AND job_position_name ILIKE '%PEGAWAI FARMASI%';

-- Step 3: Fix PENOLONG PEGAWAI FARMASI positions (Assistant Pharmacy Officers - Non-Clinical)
UPDATE profiles 
SET 
    category = 'Non-Clinical',
    updated_at = NOW()
WHERE category = 'Clinical'
  AND job_position_name ILIKE '%PENOLONG PEGAWAI FARMASI%';

-- Step 4: Fix JURUTEKNOLOGI positions (Medical Technologists - Non-Clinical)
UPDATE profiles 
SET 
    category = 'Non-Clinical',
    updated_at = NOW()
WHERE category = 'Clinical'
  AND job_position_name ILIKE '%JURUTEKNOLOGI%';

-- Step 5: Fix JURUPULIH positions (Rehabilitation Officers - Non-Clinical)
UPDATE profiles 
SET 
    category = 'Non-Clinical',
    updated_at = NOW()
WHERE category = 'Clinical'
  AND job_position_name ILIKE '%JURUPULIH%';

-- Step 6: Fix PENOLONG PEGAWAI TADBIR positions (Administrative Officers - Non-Clinical)
UPDATE profiles 
SET 
    category = 'Non-Clinical',
    updated_at = NOW()
WHERE category = 'Clinical'
  AND job_position_name ILIKE '%PENOLONG PEGAWAI TADBIR%';

-- Step 7: Fix PEMBANTU KHIDMAT positions (Service Assistants - Non-Clinical)
UPDATE profiles 
SET 
    category = 'Non-Clinical',
    updated_at = NOW()
WHERE category = 'Clinical'
  AND job_position_name ILIKE '%PEMBANTU KHIDMAT%';

-- Step 8: Fix other administrative/technical positions
UPDATE profiles 
SET 
    category = 'Non-Clinical',
    updated_at = NOW()
WHERE category = 'Clinical'
  AND (
    job_position_name ILIKE '%PEGAWAI TADBIR%' OR
    job_position_name ILIKE '%PEGAWAI KHIDMAT%' OR
    job_position_name ILIKE '%PEGAWAI TEKNIKAL%' OR
    job_position_name ILIKE '%PEGAWAI PENYELIDIKAN%' OR
    job_position_name ILIKE '%PEGAWAI MAKMAL%' OR
    job_position_name ILIKE '%JURU X-RAY%' OR
    job_position_name ILIKE '%JURU RADIOLOGI%'
  );

-- Step 9: Update corresponding jobs table entries
UPDATE jobs 
SET 
    category = 'Non-Clinical',
    updated_at = NOW()
WHERE category = 'Clinical'
  AND (
    job_position ILIKE '%PEGAWAI FARMASI%' OR
    job_position ILIKE '%PENOLONG PEGAWAI FARMASI%' OR
    job_position ILIKE '%JURUTEKNOLOGI%' OR
    job_position ILIKE '%JURUPULIH%' OR
    job_position ILIKE '%PENOLONG PEGAWAI TADBIR%' OR
    job_position ILIKE '%PEMBANTU KHIDMAT%'
  );

-- Step 10: Verification - Show the fix results
SELECT 
    '=== AFTER FIX - NON-CLINICAL POSITIONS ===' as info;

SELECT 
    'Non-Clinical positions now correctly categorized:' as section,
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE category = 'Non-Clinical'
  AND (
    job_position_name ILIKE '%FARMASI%' OR
    job_position_name ILIKE '%JURUTEKNOLOGI%' OR
    job_position_name ILIKE '%JURUPULIH%' OR
    job_position_name ILIKE '%PENOLONG PEGAWAI TADBIR%' OR
    job_position_name ILIKE '%PEMBANTU KHIDMAT%'
  )
GROUP BY job_position_name, category
ORDER BY job_position_name;

-- Step 11: Final category distribution
SELECT 
    '=== FINAL CATEGORY DISTRIBUTION ===' as info;

SELECT 
    category,
    COUNT(*) as count
FROM profiles 
GROUP BY category
ORDER BY category;

-- Step 12: Check for any remaining incorrect categorizations
SELECT 
    '=== REMAINING ISSUES (should be empty) ===' as info;

SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE category = 'Clinical'
  AND (
    job_position_name ILIKE '%FARMASI%' OR
    job_position_name ILIKE '%JURUTEKNOLOGI%' OR
    job_position_name ILIKE '%JURUPULIH%' OR
    job_position_name ILIKE '%PENOLONG PEGAWAI TADBIR%' OR
    job_position_name ILIKE '%PEMBANTU KHIDMAT%'
  )
GROUP BY job_position_name, category;

SELECT '✅ Non-Clinical positions should now be correctly categorized!' as result;
