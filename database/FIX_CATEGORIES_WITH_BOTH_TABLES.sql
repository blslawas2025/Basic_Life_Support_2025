-- FIX CATEGORIES USING BOTH JOBS TABLE AND JOB_GRADES_VIEW
-- This script will work with your actual table structure

-- Step 1: First, let's see what we're working with
SELECT 
    'CURRENT PROFILES STATE' as info,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 2: Check if jobs table has category column
SELECT 
    'JOBS TABLE CATEGORY CHECK' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'category') 
        THEN 'HAS CATEGORY COLUMN' 
        ELSE 'NO CATEGORY COLUMN' 
    END as category_status;

-- Step 3: If jobs table has category column, update it first
-- (This will be adjusted based on your actual column names)
-- UPDATE jobs SET category = 'Clinical' WHERE category IS NULL AND (job_name ILIKE '%jururawat%' OR job_name ILIKE '%perubatan%');
-- UPDATE jobs SET category = 'Non-Clinical' WHERE category IS NULL;

-- Step 4: Update profiles using job_position_id from jobs table
UPDATE profiles 
SET category = j.category, updated_at = NOW()
FROM jobs j
WHERE profiles.job_position_id = j.id 
  AND profiles.category IS NULL
  AND j.category IS NOT NULL;

-- Step 5: If job_grades_view has category information, use that too
-- (This will be adjusted based on your actual column names)
-- UPDATE profiles 
-- SET category = jgv.category, updated_at = NOW()
-- FROM job_grades_view jgv
-- WHERE profiles.job_position_name = jgv.job_name 
--   AND profiles.category IS NULL
--   AND jgv.category IS NOT NULL;

-- Step 6: For remaining NULL categories, use pattern matching on job_position_name
UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
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

UPDATE profiles 
SET category = 'Non-Clinical', updated_at = NOW()
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

-- Step 7: Set any remaining NULL as Non-Clinical
UPDATE profiles 
SET category = 'Non-Clinical', updated_at = NOW()
WHERE category IS NULL;

-- Step 8: Show final results
SELECT 
    'FINAL RESULTS' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 9: Show sample of updated profiles
SELECT 
    name,
    job_position_name,
    category,
    job_position_id
FROM profiles 
WHERE category IS NOT NULL
ORDER BY updated_at DESC 
LIMIT 10;
