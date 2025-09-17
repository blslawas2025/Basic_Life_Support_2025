-- Diagnostic script to check the actual structure of the jobs table
-- This will help us understand why j.name doesn't exist

-- Check if jobs table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
        THEN 'jobs table EXISTS'
        ELSE 'jobs table DOES NOT EXIST'
    END as table_status;

-- Check the actual columns in the jobs table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;

-- Check if there are any other job-related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%job%' 
ORDER BY table_name;

-- Check the actual data in jobs table (if it exists)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
        THEN 'jobs table has data'
        ELSE 'jobs table does not exist'
    END as data_status;

-- If jobs table exists, show sample data
SELECT * FROM jobs LIMIT 3;

-- Check what the profiles table is actually referencing
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE '%job%'
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'profiles';
