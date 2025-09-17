-- CHECK AND FIX JOBS TABLE
-- This script will ensure the jobs table has proper category data

-- Step 1: Check jobs table structure
SELECT 
    'JOBS TABLE STRUCTURE' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'jobs'
ORDER BY ordinal_position;

-- Step 2: Check if jobs table has data
SELECT 
    'JOBS TABLE DATA COUNT' as info,
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_jobs,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_jobs,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_categories
FROM jobs;

-- Step 3: Show all jobs with their categories
SELECT 
    'ALL JOBS' as info,
    id,
    name,
    category,
    is_active,
    created_at
FROM jobs 
ORDER BY name;

-- Step 4: If jobs table has NULL categories, fix them based on job names
UPDATE jobs 
SET category = 'Clinical'
WHERE category IS NULL 
  AND (
    name ILIKE '%jururawat%' OR
    name ILIKE '%perubatan%' OR
    name ILIKE '%farmasi%' OR
    name ILIKE '%pergigian%' OR
    name ILIKE '%kesihatan%' OR
    name ILIKE '%doktor%' OR
    name ILIKE '%juruteknologi%' OR
    name ILIKE '%jurupulih%' OR
    name ILIKE '%xray%' OR
    name ILIKE '%perawatan%' OR
    name ILIKE '%pemberdahan%' OR
    name ILIKE '%makmal%' OR
    name ILIKE '%carakerja%' OR
    name ILIKE '%fisioterapi%'
  );

UPDATE jobs 
SET category = 'Non-Clinical'
WHERE category IS NULL 
  AND (
    name ILIKE '%tadbir%' OR
    name ILIKE '%khidmat%' OR
    name ILIKE '%pentadbiran%' OR
    name ILIKE '%jurutera%' OR
    name ILIKE '%penyediaan%' OR
    name ILIKE '%kewangan%' OR
    name ILIKE '%stor%' OR
    name ILIKE '%teknikal%' OR
    name ILIKE '%perpustakaan%' OR
    name ILIKE '%klinik%' OR
    name ILIKE '%am%'
  );

-- Step 5: Set any remaining NULL as Non-Clinical
UPDATE jobs 
SET category = 'Non-Clinical'
WHERE category IS NULL;

-- Step 6: Verify jobs table is now properly categorized
SELECT 
    'AFTER JOBS TABLE FIX' as info,
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_jobs,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_jobs,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_categories
FROM jobs;

-- Step 7: Show updated jobs
SELECT 
    'UPDATED JOBS' as info,
    id,
    name,
    category,
    is_active
FROM jobs 
ORDER BY name;
