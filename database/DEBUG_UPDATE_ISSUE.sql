-- DEBUG WHY UPDATES AREN'T WORKING
-- Let's see exactly what's happening

-- Step 1: Check if the updates are actually running
-- Let's try updating just one specific position first
UPDATE profiles 
SET category = 'Clinical', updated_at = NOW() 
WHERE job_position_name = 'JURURAWAT U 5';

-- Step 2: Check if that worked
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name = 'JURURAWAT U 5'
GROUP BY job_position_name, category;

-- Step 3: Let's see the exact characters in the job position name
-- This will show us if there are hidden characters or spaces
SELECT 
    job_position_name,
    LENGTH(job_position_name) as name_length,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name LIKE '%JURURAWAT%'
GROUP BY job_position_name, category, name_length;

-- Step 4: Try a different approach - update using LIKE pattern
UPDATE profiles 
SET category = 'Clinical', updated_at = NOW() 
WHERE job_position_name LIKE '%JURURAWAT%';

-- Step 5: Check if the LIKE pattern worked
SELECT 
    'AFTER LIKE PATTERN' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical
FROM profiles;

-- Step 6: Show what we got
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE category = 'Clinical'
GROUP BY job_position_name, category
ORDER BY job_position_name;
