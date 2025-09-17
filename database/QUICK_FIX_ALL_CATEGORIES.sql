-- QUICK FIX: Fix All Category Issues in One Go
-- Run this directly in your Supabase SQL Editor

-- Step 1: Fix all Non-Clinical positions that are incorrectly marked as Clinical
UPDATE profiles 
SET 
    category = 'Non-Clinical',
    updated_at = NOW()
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
  );

-- Step 2: Update corresponding jobs table
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

-- Step 3: Ensure all Clinical positions are correctly marked
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

-- Step 4: Update jobs table for Clinical positions
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

-- Step 5: Show the results
SELECT 
    'Category distribution after fix:' as info,
    category,
    COUNT(*) as count
FROM profiles 
GROUP BY category
ORDER BY category;
