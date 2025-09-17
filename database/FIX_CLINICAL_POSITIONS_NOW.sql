-- DIRECT FIX FOR CLINICAL POSITIONS
-- This will fix the medical positions that are incorrectly marked as Non-Clinical

-- Step 1: Show what we're fixing
SELECT 
    'BEFORE FIX' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 2: Fix ALL medical positions to Clinical
UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
WHERE job_position_name ILIKE '%PERUBATAN%' OR
      job_position_name ILIKE '%JURURAWAT%' OR
      job_position_name ILIKE '%JURUTEKNOLOGI%' OR
      job_position_name ILIKE '%PEGAWAI PERGIGIAN%' OR
      job_position_name ILIKE '%FARMASI%' OR
      job_position_name ILIKE '%KESIHATAN%' OR
      job_position_name ILIKE '%DOKTOR%' OR
      job_position_name ILIKE '%JURUPULIH%' OR
      job_position_name ILIKE '%XRAY%' OR
      job_position_name ILIKE '%PERAWATAN%' OR
      job_position_name ILIKE '%PEMBERDAHAN%' OR
      job_position_name ILIKE '%MAKMAL%' OR
      job_position_name ILIKE '%CARAKERJA%' OR
      job_position_name ILIKE '%FISIOTERAPI%' OR
      job_position_name ILIKE '%PEMBANTU PERUBATAN%' OR
      job_position_name ILIKE '%PEMBANTU KESIHATAN%';

-- Step 3: Fix specific patterns that are definitely clinical
UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
WHERE job_position_name LIKE '%PENOLONG PEGAWAI PERUBATAN%' OR
      job_position_name LIKE '%JURUTEKNOLOGI MAKMAL%' OR
      job_position_name LIKE '%JURURAWAT%' OR
      job_position_name LIKE '%PEGAWAI PERUBATAN%' OR
      job_position_name LIKE '%PEGAWAI PERGIGIAN%' OR
      job_position_name LIKE '%PEGAWAI FARMASI%' OR
      job_position_name LIKE '%JURUPULIH%' OR
      job_position_name LIKE '%JURU-XRAY%' OR
      job_position_name LIKE '%PEMBANTU PERAWATAN%' OR
      job_position_name LIKE '%PEMBANTU PEMBERDAHAN%';

-- Step 4: Show results
SELECT 
    'AFTER FIX' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 5: Show the fixed profiles
SELECT 
    name,
    job_position_name,
    category
FROM profiles 
WHERE category = 'Clinical'
ORDER BY updated_at DESC
LIMIT 10;
