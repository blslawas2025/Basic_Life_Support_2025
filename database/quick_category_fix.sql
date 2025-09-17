-- Quick fix for NULL categories based on specific job positions found in the codebase
-- This script targets the exact job positions used in the application

-- Step 1: Check current state
SELECT 
    'BEFORE' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 2: Update Clinical positions (based on job positions found in RegisterParticipantScreen.tsx)
UPDATE profiles 
SET category = 'Clinical'
WHERE category IS NULL 
  AND job_position_name IN (
    'Jurupulih Fisioterapi',
    'Jururawat', 
    'Pegawai Perubatan',
    'Pegawai Farmasi',
    'Pegawai Pergigian',
    'Penolong Pegawai Perubatan',
    'Penolong Pegawai Farmasi',
    'Juruteknologi Makmal Perubatan',
    'Jurupulih Perubatan Carakerja',
    'Juru-Xray',
    'Pembantu Perawatan Kesihatan',
    'Jururawat Masyarakat',
    'Pembantu Pemberdahan Pergigian'
  );

-- Step 3: Update Non-Clinical positions
UPDATE profiles 
SET category = 'Non-Clinical'
WHERE category IS NULL 
  AND job_position_name IN (
    'Penolong Pegawai Tadbir',
    'Pembantu Khidmat Am',
    'Pembantu Tadbir',
    'Penolong Jurutera',
    'Pembantu Penyediaan Makanan'
  );

-- Step 4: Handle job positions with grades (e.g., "Jururawat U5", "Pegawai Perubatan UD41")
UPDATE profiles 
SET category = 'Clinical'
WHERE category IS NULL 
  AND (
    job_position_name LIKE 'Jururawat%' OR
    job_position_name LIKE 'Pegawai Perubatan%' OR
    job_position_name LIKE 'Pegawai Farmasi%' OR
    job_position_name LIKE 'Pegawai Pergigian%' OR
    job_position_name LIKE 'Penolong Pegawai Perubatan%' OR
    job_position_name LIKE 'Penolong Pegawai Farmasi%' OR
    job_position_name LIKE 'Juruteknologi%' OR
    job_position_name LIKE 'Jurupulih%' OR
    job_position_name LIKE 'Juru-Xray%' OR
    job_position_name LIKE 'Pembantu Perawatan%' OR
    job_position_name LIKE 'Jururawat Masyarakat%' OR
    job_position_name LIKE 'Pembantu Pemberdahan%'
  );

UPDATE profiles 
SET category = 'Non-Clinical'
WHERE category IS NULL 
  AND (
    job_position_name LIKE 'Penolong Pegawai Tadbir%' OR
    job_position_name LIKE 'Pembantu Khidmat Am%' OR
    job_position_name LIKE 'Pembantu Tadbir%' OR
    job_position_name LIKE 'Penolong Jurutera%' OR
    job_position_name LIKE 'Pembantu Penyediaan%'
  );

-- Step 5: Set any remaining NULL as Non-Clinical (fallback)
UPDATE profiles 
SET category = 'Non-Clinical'
WHERE category IS NULL;

-- Step 6: Verify results
SELECT 
    'AFTER' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 7: Show sample results
SELECT 
    name,
    job_position_name,
    category,
    created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;
