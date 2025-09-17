-- CORRECTED CATEGORY FIX
-- This script correctly categorizes positions based on the provided data

-- Step 1: Show current state
SELECT 'BEFORE UPDATE' as status;
SELECT 
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category;

-- Step 2: Update all JURURAWAT positions to Clinical (all nurses)
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'JURURAWAT%'
  AND job_position_name IS NOT NULL;

-- Step 3: Update all PEGAWAI PERGIGIAN positions to Clinical (dental officers)
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEGAWAI PERGIGIAN%'
  AND job_position_name IS NOT NULL;

-- Step 4: Update all PEGAWAI PERUBATAN positions to Clinical (medical officers)
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEGAWAI PERUBATAN%'
  AND job_position_name IS NOT NULL;

-- Step 5: Update all PENOLONG PEGAWAI PERUBATAN positions to Clinical (assistant medical officers)
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PENOLONG PEGAWAI PERUBATAN%'
  AND job_position_name IS NOT NULL;

-- Step 6: Update all PEMBANTU PERAWATAN KESIHATAN positions to Clinical (health care assistants)
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEMBANTU PERAWATAN KESIHATAN%'
  AND job_position_name IS NOT NULL;

-- Step 7: Keep JURUPULIH positions as Non-Clinical (rehabilitation officers - part-time)
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'JURUPULIH%'
  AND job_position_name IS NOT NULL;

-- Step 8: Keep JURUTEKNOLOGI positions as Non-Clinical (medical technologists)
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'JURUTEKNOLOGI%'
  AND job_position_name IS NOT NULL;

-- Step 9: Keep PEGAWAI FARMASI positions as Non-Clinical (pharmacy officers)
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEGAWAI FARMASI%'
  AND job_position_name IS NOT NULL;

-- Step 10: Keep PENOLONG PEGAWAI FARMASI positions as Non-Clinical (assistant pharmacy officers)
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PENOLONG PEGAWAI FARMASI%'
  AND job_position_name IS NOT NULL;

-- Step 11: Keep PENOLONG PEGAWAI TADBIR positions as Non-Clinical (administrative officers)
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PENOLONG PEGAWAI TADBIR%'
  AND job_position_name IS NOT NULL;

-- Step 12: Keep PEMBANTU KHIDMAT positions as Non-Clinical (service assistants)
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEMBANTU KHIDMAT%'
  AND job_position_name IS NOT NULL;

-- Step 13: Show results after update
SELECT 'AFTER UPDATE - RESULTS' as status;
SELECT 
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category
ORDER BY category;

-- Step 14: Show detailed breakdown by job position
SELECT 'DETAILED BREAKDOWN' as status;
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY job_position_name, category
ORDER BY job_position_name;

-- Step 15: Show summary of changes made
SELECT 'SUMMARY OF EXPECTED CHANGES' as status;
SELECT 
    'Clinical positions that should be updated:' as description,
    'JURURAWAT MASYARAKAT U 1, JURURAWAT U 5/6/7, PEGAWAI PERGIGIAN UG 9/10, PEGAWAI PERUBATAN UD 9/10, PEMBANTU PERAWATAN KESIHATAN U 1, PENOLONG PEGAWAI PERUBATAN U 5/6' as positions
UNION ALL
SELECT 
    'Non-Clinical positions that should remain unchanged:' as description,
    'JURUPULIH PERUBATAN CARAKERJA U 5, JURUTEKNOLOGI MAKMAL PERUBATAN U 6, PEGAWAI FARMASI UF 9, PENOLONG PEGAWAI FARMASI U 5, PENOLONG PEGAWAI TADBIR N 5, PEMBANTU KHIDMAT AM H 1' as positions;
