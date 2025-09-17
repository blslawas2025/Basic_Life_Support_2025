-- FIXED COMPLETE DATABASE ANALYSIS
-- This will give us the full picture of what's blocking updates

-- Step 1: List ALL tables in the database
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Step 2: Check constraints on profiles table (fixed query)
SELECT 
    constraint_name,
    table_name,
    column_name
FROM information_schema.constraint_column_usage 
WHERE table_name = 'profiles'
ORDER BY constraint_name;

-- Step 3: Check ALL triggers on profiles table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_orientation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- Step 4: Check check constraints on profiles table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition,
    convalidated as is_valid
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
ORDER BY conname;

-- Step 5: Check profiles table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 6: Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 7: Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 8: Check current user
SELECT 
    'CURRENT_USER' as info,
    current_user as user_name;

-- Step 9: Test SELECT
SELECT 
    'SELECT_TEST' as test,
    COUNT(*) as total_rows
FROM profiles;

-- Step 10: Test UPDATE
UPDATE profiles 
SET updated_at = NOW()
WHERE id = (SELECT id FROM profiles LIMIT 1);

-- Step 11: Check if update worked
SELECT 
    'UPDATE_TEST' as test,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN updated_at > NOW() - INTERVAL '1 minute' THEN 1 END) as recently_updated
FROM profiles;
