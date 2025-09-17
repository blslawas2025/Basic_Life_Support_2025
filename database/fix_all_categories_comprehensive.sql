-- Comprehensive fix for all NULL categories
-- This script will update ALL profiles with NULL categories

-- Step 1: Check current state
SELECT 
    'Before Update' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 2: Show which profiles will be updated
SELECT 
    p.id,
    p.name,
    p.job_position_name,
    p.category as current_category,
    j.name as job_name,
    j.category as job_category
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.category IS NULL
ORDER BY p.created_at DESC;

-- Step 3: Update ALL profiles with NULL categories
UPDATE profiles 
SET category = j.category
FROM jobs j
WHERE profiles.job_position_id = j.id 
  AND profiles.category IS NULL;

-- Step 4: Verify the update worked
SELECT 
    'After Update' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 5: Show updated profiles
SELECT 
    p.id,
    p.name,
    p.job_position_name,
    p.category as updated_category,
    j.name as job_name,
    j.category as job_category
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.category IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;
