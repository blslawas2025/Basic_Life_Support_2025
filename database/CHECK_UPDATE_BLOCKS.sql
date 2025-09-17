-- CHECK WHAT'S BLOCKING UPDATES TO PROFILES TABLE

-- Step 1: Check if there are any triggers that might be reverting changes
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- Step 2: Check if there are any constraints on the category column
SELECT 
    constraint_name,
    constraint_type,
    table_name,
    column_name
FROM information_schema.constraint_column_usage 
WHERE table_name = 'profiles' AND column_name = 'category';

-- Step 3: Check if the category column has any check constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
  AND contype = 'c';

-- Step 4: Try to see if we can update ANY column at all
UPDATE profiles 
SET updated_at = NOW()
WHERE id = (SELECT id FROM profiles LIMIT 1);

-- Step 5: Check if that update worked
SELECT 
    'UPDATE TEST' as test,
    COUNT(*) as total,
    COUNT(CASE WHEN updated_at > NOW() - INTERVAL '1 minute' THEN 1 END) as recently_updated
FROM profiles;

-- Step 6: Try a different approach - check if we have UPDATE permissions
SELECT 
    'PERMISSIONS CHECK' as info,
    has_table_privilege('profiles', 'UPDATE') as can_update,
    has_table_privilege('profiles', 'SELECT') as can_select;
