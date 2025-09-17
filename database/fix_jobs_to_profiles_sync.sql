-- Fix synchronization between jobs and profiles tables
-- This script creates a trigger to update profiles when jobs table category changes

-- Step 1: Create function to sync profiles when jobs category changes
CREATE OR REPLACE FUNCTION sync_profiles_on_job_category_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if the category actually changed
    IF OLD.category IS DISTINCT FROM NEW.category THEN
        -- Update all profiles that reference this job
        UPDATE profiles 
        SET 
            category = NEW.category,
            updated_at = NOW()
        WHERE job_position_id = NEW.id;
        
        -- Log the change for debugging
        RAISE NOTICE 'Updated % profiles for job % (ID: %) from category % to %', 
            (SELECT COUNT(*) FROM profiles WHERE job_position_id = NEW.id),
            NEW.job_position,
            NEW.id,
            OLD.category,
            NEW.category;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_profiles_on_jobs_update ON jobs;

-- Step 3: Create trigger for UPDATE operations on jobs table
CREATE TRIGGER sync_profiles_on_jobs_update
    AFTER UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION sync_profiles_on_job_category_change();

-- Step 4: Test the trigger by showing current state
SELECT 
    'Current jobs with categories:' as info,
    job_position,
    category,
    (SELECT COUNT(*) FROM profiles WHERE job_position_id = jobs.id) as profile_count
FROM jobs 
WHERE category IS NOT NULL
ORDER BY job_position;

-- Step 5: Show profiles that might be out of sync
SELECT 
    'Profiles that may be out of sync:' as info,
    p.name,
    p.job_position_name,
    p.category as profile_category,
    j.category as job_category,
    j.job_position
FROM profiles p
JOIN jobs j ON p.job_position_id = j.id
WHERE p.category IS DISTINCT FROM j.category
LIMIT 10;

-- Step 6: Manual sync for any existing mismatches
UPDATE profiles 
SET 
    category = j.category,
    updated_at = NOW()
FROM jobs j
WHERE profiles.job_position_id = j.id 
  AND profiles.category IS DISTINCT FROM j.category;

-- Step 7: Verify the fix
SELECT 
    'Verification - profiles should now match jobs:' as info,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN p.category = j.category THEN 1 END) as matching_categories,
    COUNT(CASE WHEN p.category IS DISTINCT FROM j.category THEN 1 END) as mismatched_categories
FROM profiles p
JOIN jobs j ON p.job_position_id = j.id;

SELECT '✅ Trigger created successfully! Now when you change jobs.category, all related profiles will be automatically updated.' as result;
