-- TEST CATEGORY UPDATE - Shows what will be changed BEFORE updating
-- Run this first to see what will happen

-- Step 1: Show what will be set to Clinical
SELECT 
    'WILL BE SET TO CLINICAL' as action,
    job_position_name,
    category as current_category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name LIKE '%JURURAWAT%' OR 
      job_position_name LIKE '%PERUBATAN%' OR 
      job_position_name LIKE '%FARMASI%' OR 
      job_position_name LIKE '%PERGIGIAN%' OR 
      job_position_name LIKE '%KESIHATAN%' OR 
      job_position_name LIKE '%JURUTEKNOLOGI%' OR 
      job_position_name LIKE '%JURUPULIH%' OR 
      job_position_name LIKE '%XRAY%' OR 
      job_position_name LIKE '%PERAWATAN%' OR 
      job_position_name LIKE '%PEMBERDAHAN%' OR 
      job_position_name LIKE '%MAKMAL%' OR 
      job_position_name LIKE '%CARAKERJA%' OR 
      job_position_name LIKE '%FISIOTERAPI%'
GROUP BY job_position_name, category
ORDER BY job_position_name;

-- Step 2: Show what will be set to Non-Clinical
SELECT 
    'WILL BE SET TO NON-CLINICAL' as action,
    job_position_name,
    category as current_category,
    COUNT(*) as count
FROM profiles 
WHERE category IS NULL
GROUP BY job_position_name, category
ORDER BY job_position_name;

-- Step 3: Show what will stay as Non-Clinical (administrative)
SELECT 
    'WILL STAY NON-CLINICAL' as action,
    job_position_name,
    category as current_category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name LIKE '%KHIDMAT%' OR 
      job_position_name LIKE '%TADBIR%'
GROUP BY job_position_name, category
ORDER BY job_position_name;

-- Step 4: Show summary of what will happen
SELECT 
    'SUMMARY' as info,
    'Clinical positions' as type,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name LIKE '%JURURAWAT%' OR 
      job_position_name LIKE '%PERUBATAN%' OR 
      job_position_name LIKE '%FARMASI%' OR 
      job_position_name LIKE '%PERGIGIAN%' OR 
      job_position_name LIKE '%KESIHATAN%' OR 
      job_position_name LIKE '%JURUTEKNOLOGI%' OR 
      job_position_name LIKE '%JURUPULIH%' OR 
      job_position_name LIKE '%XRAY%' OR 
      job_position_name LIKE '%PERAWATAN%' OR 
      job_position_name LIKE '%PEMBERDAHAN%' OR 
      job_position_name LIKE '%MAKMAL%' OR 
      job_position_name LIKE '%CARAKERJA%' OR 
      job_position_name LIKE '%FISIOTERAPI%'

UNION ALL

SELECT 
    'SUMMARY' as info,
    'Non-Clinical positions' as type,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name LIKE '%KHIDMAT%' OR 
      job_position_name LIKE '%TADBIR%' OR
      category IS NULL;
