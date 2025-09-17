-- DEBUG AND FIX - Let's see exactly what job positions we have and fix them directly

-- Step 1: Show ALL unique job position names
SELECT DISTINCT job_position_name 
FROM profiles 
WHERE job_position_name IS NOT NULL
ORDER BY job_position_name;

-- Step 2: Show current categories
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
GROUP BY job_position_name, category
ORDER BY job_position_name;

-- Step 3: Let's try a different approach - update specific job positions directly
-- Based on what you showed me, let's update these exact patterns:

UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
WHERE job_position_name = 'PENOLONG PEGAWAI PERUBATAN U 5';

UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
WHERE job_position_name = 'JURUTEKNOLOGI MAKMAL PERUBATAN U 6';

UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
WHERE job_position_name = 'JURURAWAT U 5';

UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
WHERE job_position_name = 'PEGAWAI PERUBATAN UD 9';

UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
WHERE job_position_name = 'PEGAWAI PERGIGIAN UG 9';

-- Step 4: Try pattern matching with different approach
UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
WHERE job_position_name LIKE '%PERUBATAN%';

UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
WHERE job_position_name LIKE '%JURURAWAT%';

UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
WHERE job_position_name LIKE '%JURUTEKNOLOGI%';

UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
WHERE job_position_name LIKE '%PEGAWAI PERGIGIAN%';

UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
WHERE job_position_name LIKE '%FARMASI%';

-- Step 5: Check results
SELECT 
    'AFTER DIRECT UPDATES' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical
FROM profiles;

-- Step 6: Show what we fixed
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE category = 'Clinical'
GROUP BY job_position_name, category
ORDER BY job_position_name;
