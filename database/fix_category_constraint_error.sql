-- Fix category constraint error and corrupted data
-- The error shows category value "ClinicalNon-Clinical" which violates the check constraint

-- Step 1: First, let's see what's causing this issue
SELECT 
    'Checking for corrupted category values:' as info,
    category,
    COUNT(*) as count
FROM profiles 
WHERE category IS NOT NULL
GROUP BY category
ORDER BY category;

-- Step 2: Check for invalid category values
SELECT 
    'Invalid category values found:' as info,
    id,
    name,
    job_position_name,
    category,
    job_position_id
FROM profiles 
WHERE category IS NOT NULL 
  AND category NOT IN ('Clinical', 'Non-Clinical')
ORDER BY category;

-- Step 3: Check the jobs table for similar issues
SELECT 
    'Jobs table category values:' as info,
    job_position,
    category,
    id
FROM jobs 
WHERE category IS NOT NULL
ORDER BY job_position;

-- Step 4: Find the specific problematic record
SELECT 
    'Problematic record details:' as info,
    p.id,
    p.name,
    p.job_position_name,
    p.category,
    p.job_position_id,
    j.job_position as job_name,
    j.category as job_category
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.id = '4aa1f82a-eacb-4c9f-8740-ce28da0dc5ab';

-- Step 5: Fix the corrupted data
-- First, let's fix any profiles with invalid category values
UPDATE profiles 
SET 
    category = CASE 
        WHEN category LIKE '%Clinical%' AND category LIKE '%Non-Clinical%' THEN 'Clinical'
        WHEN category LIKE '%Clinical%' THEN 'Clinical'
        WHEN category LIKE '%Non-Clinical%' THEN 'Non-Clinical'
        ELSE NULL
    END,
    updated_at = NOW()
WHERE category IS NOT NULL 
  AND category NOT IN ('Clinical', 'Non-Clinical');

-- Step 6: Fix the specific problematic record
UPDATE profiles 
SET 
    category = 'Non-Clinical',  -- PEGAWAI FARMASI should be Non-Clinical
    updated_at = NOW()
WHERE id = '4aa1f82a-eacb-4c9f-8740-ce28da0dc5ab';

-- Step 7: Ensure all profiles have valid categories based on their jobs
UPDATE profiles 
SET 
    category = j.category,
    updated_at = NOW()
FROM jobs j
WHERE profiles.job_position_id = j.id 
  AND j.category IS NOT NULL
  AND (profiles.category IS NULL OR profiles.category != j.category);

-- Step 8: Fix any profiles without job_position_id but with job_position_name
UPDATE profiles 
SET 
    category = CASE 
        WHEN job_position_name ILIKE '%JURURAWAT%' THEN 'Clinical'
        WHEN job_position_name ILIKE '%PEGAWAI PERGIGIAN%' THEN 'Clinical'
        WHEN job_position_name ILIKE '%PEGAWAI PERUBATAN%' THEN 'Clinical'
        WHEN job_position_name ILIKE '%PENOLONG PEGAWAI PERUBATAN%' THEN 'Clinical'
        WHEN job_position_name ILIKE '%PEMBANTU PERAWATAN%' THEN 'Clinical'
        WHEN job_position_name ILIKE '%PEGAWAI FARMASI%' THEN 'Non-Clinical'
        WHEN job_position_name ILIKE '%JURUTEKNOLOGI%' THEN 'Non-Clinical'
        WHEN job_position_name ILIKE '%JURUPULIH%' THEN 'Non-Clinical'
        WHEN job_position_name ILIKE '%PENOLONG PEGAWAI TADBIR%' THEN 'Non-Clinical'
        WHEN job_position_name ILIKE '%PEMBANTU KHIDMAT%' THEN 'Non-Clinical'
        ELSE 'Non-Clinical'
    END,
    updated_at = NOW()
WHERE category IS NULL 
  AND job_position_name IS NOT NULL;

-- Step 9: Verify the fix
SELECT 
    'After fix - category distribution:' as info,
    category,
    COUNT(*) as count
FROM profiles 
GROUP BY category
ORDER BY category;

-- Step 10: Check for any remaining constraint violations
SELECT 
    'Remaining invalid categories:' as info,
    COUNT(*) as invalid_count
FROM profiles 
WHERE category IS NOT NULL 
  AND category NOT IN ('Clinical', 'Non-Clinical');

-- Step 11: Show the fixed record
SELECT 
    'Fixed record:' as info,
    id,
    name,
    job_position_name,
    category
FROM profiles 
WHERE id = '4aa1f82a-eacb-4c9f-8740-ce28da0dc5ab';

SELECT '✅ Category constraint errors should now be fixed!' as result;
