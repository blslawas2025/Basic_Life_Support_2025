-- SIMPLE DIRECT FIX for NULL categories
-- This script will fix categories based on exact job position names found in your data

-- Step 1: First, let's see what job positions you actually have
SELECT DISTINCT job_position_name 
FROM profiles 
WHERE job_position_name IS NOT NULL 
ORDER BY job_position_name;

-- Step 2: Update based on common patterns (this will work for most cases)
UPDATE profiles 
SET category = 'Clinical'
WHERE category IS NULL 
  AND (
    job_position_name ILIKE '%jururawat%' OR
    job_position_name ILIKE '%perubatan%' OR
    job_position_name ILIKE '%farmasi%' OR
    job_position_name ILIKE '%pergigian%' OR
    job_position_name ILIKE '%kesihatan%' OR
    job_position_name ILIKE '%doktor%' OR
    job_position_name ILIKE '%juruteknologi%' OR
    job_position_name ILIKE '%jurupulih%' OR
    job_position_name ILIKE '%xray%' OR
    job_position_name ILIKE '%perawatan%' OR
    job_position_name ILIKE '%pemberdahan%' OR
    job_position_name ILIKE '%makmal%' OR
    job_position_name ILIKE '%carakerja%' OR
    job_position_name ILIKE '%fisioterapi%'
  );

-- Step 3: Update Non-Clinical positions
UPDATE profiles 
SET category = 'Non-Clinical'
WHERE category IS NULL 
  AND (
    job_position_name ILIKE '%tadbir%' OR
    job_position_name ILIKE '%khidmat%' OR
    job_position_name ILIKE '%pentadbiran%' OR
    job_position_name ILIKE '%jurutera%' OR
    job_position_name ILIKE '%penyediaan%' OR
    job_position_name ILIKE '%kewangan%' OR
    job_position_name ILIKE '%stor%' OR
    job_position_name ILIKE '%teknikal%' OR
    job_position_name ILIKE '%perpustakaan%' OR
    job_position_name ILIKE '%klinik%' OR
    job_position_name ILIKE '%am%'
  );

-- Step 4: Set any remaining NULL as Non-Clinical (safe fallback)
UPDATE profiles 
SET category = 'Non-Clinical'
WHERE category IS NULL;

-- Step 5: Verify the results
SELECT 
    'AFTER SIMPLE FIX' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 6: Show sample results
SELECT 
    name,
    job_position_name,
    category,
    created_at
FROM profiles 
ORDER BY updated_at DESC 
LIMIT 10;
