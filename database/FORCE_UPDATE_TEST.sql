-- FORCE UPDATE TEST - Let's see if we can update ANYTHING in profiles table

-- Step 1: Try updating a different column first
UPDATE profiles 
SET updated_at = NOW()
WHERE job_position_name = 'JURURAWAT U 5';

-- Step 2: Check if that worked
SELECT 
    job_position_name,
    updated_at,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name = 'JURURAWAT U 5'
GROUP BY job_position_name, updated_at;

-- Step 3: Try updating category with a simple value
UPDATE profiles 
SET category = 'Clinical'
WHERE job_position_name = 'JURURAWAT U 5';

-- Step 4: Check if that worked
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name = 'JURURAWAT U 5'
GROUP BY job_position_name, category;

-- Step 5: If that worked, update all medical positions directly
UPDATE profiles 
SET category = 'Clinical'
WHERE job_position_name IN (
    'JURUPULIH PERUBATAN CARAKERJA U 5',
    'JURURAWAT MASYARAKAT U 1',
    'JURURAWAT U 5',
    'JURURAWAT U 6',
    'JURURAWAT U 7',
    'JURUTEKNOLOGI MAKMAL PERUBATAN U 6',
    'PEGAWAI FARMASI UF 9',
    'PEGAWAI PERGIGIAN UG 10',
    'PEGAWAI PERGIGIAN UG 9',
    'PEGAWAI PERUBATAN UD 10',
    'PEGAWAI PERUBATAN UD 9',
    'PEMBANTU PEGAWAI PERUBATAN U 5',
    'PEMBANTU PEGAWAI PERUBATAN U 6',
    'PEMBANTU PERAWATAN KESIHATAN U 1',
    'PENOLONG PEGAWAI FARMASI U 5',
    'PENOLONG PEGAWAI PERUBATAN U 5',
    'PENOLONG PEGAWAI PERUBATAN U 6'
);

-- Step 6: Show final results
SELECT 
    'FINAL RESULTS' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical
FROM profiles;
