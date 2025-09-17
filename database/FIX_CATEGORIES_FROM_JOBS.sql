-- FIX CATEGORIES BY FOLLOWING JOBS TABLE DATA
-- This script will properly fetch categories from the jobs table

-- Step 1: Check if jobs table exists and has the right structure
SELECT 
    'JOBS TABLE CHECK' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
        THEN 'EXISTS' 
        ELSE 'NOT EXISTS' 
    END as jobs_table_status;

-- Step 2: Show jobs table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'jobs'
ORDER BY ordinal_position;

-- Step 3: Show sample data from jobs table
SELECT 
    'JOBS TABLE DATA' as info,
    id,
    name,
    category,
    is_active
FROM jobs 
LIMIT 10;

-- Step 4: Show current profiles with their job_position_id
SELECT 
    'PROFILES WITH JOB POSITION IDS' as info,
    p.id,
    p.name,
    p.job_position_name,
    p.job_position_id,
    p.category as current_category,
    j.name as job_name,
    j.category as job_category
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.job_position_id IS NOT NULL
LIMIT 10;

-- Step 5: Update profiles using the jobs table data
UPDATE profiles 
SET category = j.category, updated_at = NOW()
FROM jobs j
WHERE profiles.job_position_id = j.id 
  AND profiles.category IS NULL
  AND j.category IS NOT NULL;

-- Step 6: For profiles with job_position_name but no job_position_id, try to match by name
UPDATE profiles 
SET category = j.category, updated_at = NOW()
FROM jobs j
WHERE profiles.job_position_name = j.name 
  AND profiles.category IS NULL
  AND j.category IS NOT NULL
  AND profiles.job_position_id IS NULL;

-- Step 7: For profiles with job_position_name that contains job name (for grades)
UPDATE profiles 
SET category = j.category, updated_at = NOW()
FROM jobs j
WHERE profiles.job_position_name LIKE '%' || j.name || '%'
  AND profiles.category IS NULL
  AND j.category IS NOT NULL
  AND profiles.job_position_id IS NULL
  AND j.name != ''; -- Avoid empty names

-- Step 8: Show results after update
SELECT 
    'AFTER UPDATE FROM JOBS' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 9: Show updated profiles
SELECT 
    p.name,
    p.job_position_name,
    p.category as updated_category,
    j.name as job_name,
    j.category as job_category
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.category IS NOT NULL
ORDER BY p.updated_at DESC
LIMIT 10;

-- Step 10: Show any remaining NULL categories
SELECT 
    'REMAINING NULL CATEGORIES' as info,
    p.id,
    p.name,
    p.job_position_name,
    p.job_position_id,
    j.name as job_name,
    j.category as job_category
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.category IS NULL
ORDER BY p.created_at DESC;
