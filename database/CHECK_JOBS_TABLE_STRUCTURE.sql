-- Check the actual structure of your jobs table
-- This will show us what columns exist

-- Step 1: Check all columns in jobs table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'jobs'
ORDER BY ordinal_position;

-- Step 2: Check if jobs table has any data
SELECT COUNT(*) as total_rows FROM jobs;

-- Step 3: Show sample data from jobs table (using * to see all columns)
SELECT * FROM jobs LIMIT 5;

-- Step 4: Check if there's a different table name for jobs
SELECT table_name 
FROM information_schema.tables 
WHERE table_name ILIKE '%job%' 
   OR table_name ILIKE '%position%';
