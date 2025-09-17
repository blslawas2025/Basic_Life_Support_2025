-- CHECK CONSTRAINTS AND FORCE UPDATE
-- Let's see if there are any constraints preventing updates

-- Step 1: Check if there are any constraints on the category column
SELECT 
    constraint_name,
    constraint_type,
    table_name,
    column_name
FROM information_schema.constraint_column_usage 
WHERE table_name = 'profiles' AND column_name = 'category';

-- Step 2: Check if there are any triggers on the profiles table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- Step 3: Try a simple test update on a different column first
-- Let's see if we can update ANY column
UPDATE profiles 
SET updated_at = NOW() 
WHERE job_position_name = 'JURURAWAT U 5';

-- Step 4: Check if that worked
SELECT 
    job_position_name,
    updated_at,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name = 'JURURAWAT U 5'
GROUP BY job_position_name, updated_at;

-- Step 5: Try updating category with a different approach
-- Let's try updating ALL profiles at once
UPDATE profiles 
SET category = 'Clinical' 
WHERE job_position_name LIKE '%JURURAWAT%' 
   OR job_position_name LIKE '%PERUBATAN%' 
   OR job_position_name LIKE '%FARMASI%' 
   OR job_position_name LIKE '%PERGIGIAN%'
   OR job_position_name LIKE '%KESIHATAN%';

-- Step 6: Check results
SELECT 
    'AFTER FORCE UPDATE' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical
FROM profiles;

-- Step 7: Show what we got
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
GROUP BY job_position_name, category
ORDER BY job_position_name;
