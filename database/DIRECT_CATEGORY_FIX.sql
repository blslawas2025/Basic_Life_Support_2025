-- DIRECT CATEGORY FIX
-- This script directly updates categories based on the exact matches we can see

-- Step 1: Show current state
SELECT 'BEFORE UPDATE' as status;
SELECT 
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category;

-- Step 2: Update JURURAWAT positions to Clinical
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'JURURAWAT%'
  AND job_position_name IS NOT NULL;

-- Step 3: Update PEGAWAI PERGIGIAN positions to Clinical  
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEGAWAI PERGIGIAN%'
  AND job_position_name IS NOT NULL;

-- Step 3b: Update PEGAWAI PERUBATAN positions to Clinical
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEGAWAI PERUBATAN%'
  AND job_position_name IS NOT NULL;

-- Step 3c: Update PENOLONG PEGAWAI PERUBATAN positions to Clinical
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PENOLONG PEGAWAI PERUBATAN%'
  AND job_position_name IS NOT NULL;

-- Step 4: Update JURUPULIH positions to Non-Clinical
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'JURUPULIH%'
  AND job_position_name IS NOT NULL;

-- Step 5: Update JURUTEKNOLOGI positions to Non-Clinical
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'JURUTEKNOLOGI%'
  AND job_position_name IS NOT NULL;

-- Step 6: Update JURU-XRAY positions to Non-Clinical
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'JURU-XRAY%'
  AND job_position_name IS NOT NULL;

-- Step 7: Update PEMBANTU PERAWATAN positions to Clinical
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEMBANTU PERAWATAN%'
  AND job_position_name IS NOT NULL;

-- Step 7b: Update PEGAWAI FARMASI positions to Non-Clinical
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEGAWAI FARMASI%'
  AND job_position_name IS NOT NULL;

-- Step 8: Update PEMBANTU PEMBERDAHAN positions to Clinical
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEMBANTU PEMBERDAHAN%'
  AND job_position_name IS NOT NULL;

-- Step 9: Keep PENOLONG PEGAWAI FARMASI as Non-Clinical (already correct)
-- No update needed for this

-- Step 10: Keep PENOLONG PEGAWAI TADBIR as Non-Clinical
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PENOLONG PEGAWAI TADBIR%'
  AND job_position_name IS NOT NULL;

-- Step 11: Update PEMBANTU TADBIR to Non-Clinical
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEMBANTU TADBIR%'
  AND job_position_name IS NOT NULL;

-- Step 12: Update PEMBANTU KHIDMAT to Non-Clinical
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEMBANTU KHIDMAT%'
  AND job_position_name IS NOT NULL;

-- Step 13: Update PENOLONG JURUTERA to Non-Clinical
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PENOLONG JURUTERA%'
  AND job_position_name IS NOT NULL;

-- Step 14: Update PEMBANTU PENYEDIAAN MAKANAN to Non-Clinical
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEMBANTU PENYEDIAAN MAKANAN%'
  AND job_position_name IS NOT NULL;

-- Step 15: Show results after update
SELECT 'AFTER UPDATE - RESULTS' as status;
SELECT 
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category
ORDER BY category;

-- Step 16: Show detailed breakdown by job position
SELECT 'DETAILED BREAKDOWN' as status;
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY job_position_name, category
ORDER BY job_position_name;
