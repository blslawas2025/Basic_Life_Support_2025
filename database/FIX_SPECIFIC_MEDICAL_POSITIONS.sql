-- FIX SPECIFIC MEDICAL POSITIONS
-- Based on the exact job position names from your database

-- Step 1: Show before
SELECT 
    'BEFORE FIX' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical
FROM profiles;

-- Step 2: Fix ALL the medical positions to Clinical
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'JURUPULIH PERUBATAN CARAKERJA U 5';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'JURURAWAT MASYARAKAT U 1';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'JURURAWAT U 5';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'JURURAWAT U 6';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'JURURAWAT U 7';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'JURUTEKNOLOGI MAKMAL PERUBATAN U 6';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'PEGAWAI FARMASI UF 9';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'PEGAWAI PERGIGIAN UG 10';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'PEGAWAI PERGIGIAN UG 9';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'PEGAWAI PERUBATAN UD 10';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'PEGAWAI PERUBATAN UD 9';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'PEMBANTU PEGAWAI PERUBATAN U 5';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'PEMBANTU PEGAWAI PERUBATAN U 6';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'PEMBANTU PERAWATAN KESIHATAN U 1';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'PENOLONG PEGAWAI FARMASI U 5';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'PENOLONG PEGAWAI PERUBATAN U 5';
UPDATE profiles SET category = 'Clinical', updated_at = NOW() WHERE job_position_name = 'PENOLONG PEGAWAI PERUBATAN U 6';

-- Step 3: Keep only the administrative position as Non-Clinical
-- PENOLONG PEGAWAI TADBIR N 5 - this should stay Non-Clinical (it's administrative)
-- PEMBANTU KHIDMAT AM H 1 - this should stay Non-Clinical (it's general service)

-- Step 4: Show results
SELECT 
    'AFTER FIX' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical
FROM profiles;

-- Step 5: Show the fixed medical positions
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE category = 'Clinical'
GROUP BY job_position_name, category
ORDER BY job_position_name;

-- Step 6: Show remaining Non-Clinical (should only be administrative)
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE category = 'Non-Clinical'
GROUP BY job_position_name, category
ORDER BY job_position_name;
