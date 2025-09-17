-- DEBUG: Check if jobs table was updated and why profiles aren't getting Clinical categories

-- Step 1: Check if the graded job positions were added to jobs table
SELECT 
    'JOBS TABLE CHECK' as info,
    job_position,
    category,
    code_prefix,
    grades
FROM jobs 
WHERE job_position LIKE '%JURURAWAT%' OR job_position LIKE '%PERUBATAN%'
ORDER BY job_position;

-- Step 2: Check if profiles are matching with jobs table
SELECT 
    'PROFILES VS JOBS MATCH' as info,
    p.job_position_name,
    p.category as profile_category,
    j.job_position,
    j.category as job_category
FROM profiles p
LEFT JOIN jobs j ON p.job_position_name = j.job_position
WHERE p.job_position_name LIKE '%JURURAWAT%'
LIMIT 5;

-- Step 3: Try a direct update on one specific position
UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
WHERE job_position_name = 'JURURAWAT U 5';

-- Step 4: Check if that worked
SELECT 
    'AFTER DIRECT UPDATE' as status,
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name = 'JURURAWAT U 5'
GROUP BY job_position_name, category;

-- Step 5: Show all jobs table entries
SELECT 
    'ALL JOBS' as info,
    job_position,
    category
FROM jobs 
ORDER BY job_position;
