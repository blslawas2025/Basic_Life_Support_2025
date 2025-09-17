-- DEBUG AND FIX CATEGORIES
-- This script will debug why the updates aren't working and fix the categories

-- Step 1: Check current state
SELECT 'CURRENT STATE' as status;
SELECT 
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category;

-- Step 2: Check if there are any constraints on the category column
SELECT 'CATEGORY COLUMN INFO' as status;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'category';

-- Step 3: Try updating one specific position first to test
SELECT 'TESTING SINGLE UPDATE' as status;
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name = 'JURURAWAT U 5'
  AND job_position_name IS NOT NULL;

-- Step 4: Check if the test update worked
SELECT 'AFTER TEST UPDATE' as status;
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name = 'JURURAWAT U 5'
GROUP BY job_position_name, category;

-- Step 5: If test worked, update all JURURAWAT positions
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'JURURAWAT%'
  AND job_position_name IS NOT NULL;

-- Step 6: Update all PEGAWAI PERGIGIAN positions
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEGAWAI PERGIGIAN%'
  AND job_position_name IS NOT NULL;

-- Step 7: Update all PEGAWAI PERUBATAN positions
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEGAWAI PERUBATAN%'
  AND job_position_name IS NOT NULL;

-- Step 8: Update all PENOLONG PEGAWAI PERUBATAN positions
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PENOLONG PEGAWAI PERUBATAN%'
  AND job_position_name IS NOT NULL;

-- Step 9: Update all PEMBANTU PERAWATAN positions
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name LIKE 'PEMBANTU PERAWATAN%'
  AND job_position_name IS NOT NULL;

-- Step 10: Show results after all updates
SELECT 'FINAL RESULTS' as status;
SELECT 
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category
ORDER BY category;

-- Step 11: Show detailed breakdown by job position
SELECT 'DETAILED BREAKDOWN' as status;
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY job_position_name, category
ORDER BY job_position_name;
