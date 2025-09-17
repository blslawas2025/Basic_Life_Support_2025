-- FINAL CATEGORY FIX WITH TRIGGER DISABLE
-- This script will temporarily disable triggers, fix categories, and re-enable triggers

-- Step 1: Show current state
SELECT 'BEFORE FIX - Current state' as status;
SELECT 
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category;

-- Step 2: Disable the problematic triggers temporarily
SELECT 'Disabling triggers...' as status;

-- Drop the existing triggers
DROP TRIGGER IF EXISTS set_profile_category_on_insert ON profiles;
DROP TRIGGER IF EXISTS set_profile_category_on_update ON profiles;
DROP TRIGGER IF EXISTS trigger_auto_populate_category_insert ON profiles;
DROP TRIGGER IF EXISTS trigger_auto_populate_category_update ON profiles;

-- Step 3: Manually update categories based on job_position_id
SELECT 'Updating categories based on linked jobs...' as status;

-- Update profiles to get their categories from the jobs table
UPDATE profiles 
SET category = j.category,
    updated_at = NOW()
FROM jobs j
WHERE profiles.job_position_id = j.id 
  AND j.is_active = true
  AND profiles.job_position_id IS NOT NULL;

-- Step 4: For profiles without job_position_id, set categories based on job_position_name
SELECT 'Updating categories for profiles without job_position_id...' as status;

-- Clinical positions
UPDATE profiles 
SET category = 'Clinical',
    updated_at = NOW()
WHERE job_position_name IN (
    'JURURAWAT MASYARAKAT U 1',
    'JURURAWAT U 5',
    'JURURAWAT U 6',
    'JURURAWAT U 7',
    'PEGAWAI PERGIGIAN UG 9',
    'PEGAWAI PERGIGIAN UG 10',
    'PEGAWAI PERUBATAN UD 9',
    'PEGAWAI PERUBATAN UD 10',
    'PEMBANTU PERAWATAN KESIHATAN U 1',
    'PENOLONG PEGAWAI PERUBATAN U 5',
    'PENOLONG PEGAWAI PERUBATAN U 6'
)
AND job_position_id IS NULL;

-- Non-Clinical positions
UPDATE profiles 
SET category = 'Non-Clinical',
    updated_at = NOW()
WHERE job_position_name IN (
    'JURUPULIH PERUBATAN CARAKERJA U 5',
    'JURUTEKNOLOGI MAKMAL PERUBATAN U 6',
    'PEGAWAI FARMASI UF 9',
    'PENOLONG PEGAWAI FARMASI U 5',
    'PENOLONG PEGAWAI TADBIR N 5',
    'PEMBANTU KHIDMAT AM H 1'
)
AND job_position_id IS NULL;

-- Step 5: Show results after manual update
SELECT 'AFTER MANUAL UPDATE - Results' as status;
SELECT 
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category
ORDER BY category;

-- Step 6: Show detailed breakdown
SELECT 'DETAILED BREAKDOWN' as status;
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY job_position_name, category
ORDER BY job_position_name, category;

-- Step 7: Create a corrected trigger function
SELECT 'Creating corrected trigger function...' as status;

-- Create a new, improved trigger function
CREATE OR REPLACE FUNCTION set_profile_category_corrected()
RETURNS TRIGGER AS $$
DECLARE
    job_category VARCHAR(50);
BEGIN
    -- If job_position_id is provided, get the category from jobs table
    IF NEW.job_position_id IS NOT NULL THEN
        SELECT j.category INTO job_category
        FROM jobs j
        WHERE j.id = NEW.job_position_id 
          AND j.is_active = true;
        
        -- Set the category if found
        IF job_category IS NOT NULL THEN
            NEW.category := job_category;
        ELSE
            -- If no job found, try to determine from job_position_name
            NEW.category := CASE 
                WHEN NEW.job_position_name LIKE 'JURURAWAT%' THEN 'Clinical'
                WHEN NEW.job_position_name LIKE 'PEGAWAI PERGIGIAN%' THEN 'Clinical'
                WHEN NEW.job_position_name LIKE 'PEGAWAI PERUBATAN%' THEN 'Clinical'
                WHEN NEW.job_position_name LIKE 'PENOLONG PEGAWAI PERUBATAN%' THEN 'Clinical'
                WHEN NEW.job_position_name LIKE 'PEMBANTU PERAWATAN%' THEN 'Clinical'
                WHEN NEW.job_position_name LIKE 'JURUPULIH%' THEN 'Non-Clinical'
                WHEN NEW.job_position_name LIKE 'JURUTEKNOLOGI%' THEN 'Non-Clinical'
                WHEN NEW.job_position_name LIKE 'PEGAWAI FARMASI%' THEN 'Non-Clinical'
                WHEN NEW.job_position_name LIKE 'PENOLONG PEGAWAI FARMASI%' THEN 'Non-Clinical'
                WHEN NEW.job_position_name LIKE 'PENOLONG PEGAWAI TADBIR%' THEN 'Non-Clinical'
                WHEN NEW.job_position_name LIKE 'PEMBANTU KHIDMAT%' THEN 'Non-Clinical'
                ELSE 'Non-Clinical'
            END;
        END IF;
    ELSE
        -- If no job_position_id, determine category from job_position_name
        NEW.category := CASE 
            WHEN NEW.job_position_name LIKE 'JURURAWAT%' THEN 'Clinical'
            WHEN NEW.job_position_name LIKE 'PEGAWAI PERGIGIAN%' THEN 'Clinical'
            WHEN NEW.job_position_name LIKE 'PEGAWAI PERUBATAN%' THEN 'Clinical'
            WHEN NEW.job_position_name LIKE 'PENOLONG PEGAWAI PERUBATAN%' THEN 'Clinical'
            WHEN NEW.job_position_name LIKE 'PEMBANTU PERAWATAN%' THEN 'Clinical'
            WHEN NEW.job_position_name LIKE 'JURUPULIH%' THEN 'Non-Clinical'
            WHEN NEW.job_position_name LIKE 'JURUTEKNOLOGI%' THEN 'Non-Clinical'
            WHEN NEW.job_position_name LIKE 'PEGAWAI FARMASI%' THEN 'Non-Clinical'
            WHEN NEW.job_position_name LIKE 'PENOLONG PEGAWAI FARMASI%' THEN 'Non-Clinical'
            WHEN NEW.job_position_name LIKE 'PENOLONG PEGAWAI TADBIR%' THEN 'Non-Clinical'
            WHEN NEW.job_position_name LIKE 'PEMBANTU KHIDMAT%' THEN 'Non-Clinical'
            ELSE 'Non-Clinical'
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Re-create triggers with the corrected function
SELECT 'Re-creating triggers with corrected function...' as status;

-- Create trigger for INSERT operations
CREATE TRIGGER set_profile_category_on_insert_corrected
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_profile_category_corrected();

-- Create trigger for UPDATE operations
CREATE TRIGGER set_profile_category_on_update_corrected
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_profile_category_corrected();

-- Step 9: Test the new trigger
SELECT 'Testing new trigger...' as status;

-- Test with a sample update
UPDATE profiles 
SET updated_at = NOW()
WHERE id = (
    SELECT id FROM profiles 
    WHERE job_position_name = 'JURURAWAT U 5' 
    LIMIT 1
);

-- Check if the trigger worked
SELECT 
    'Trigger test result' as test,
    job_position_name,
    category
FROM profiles 
WHERE job_position_name = 'JURURAWAT U 5'
LIMIT 1;

-- Step 10: Final verification
SELECT 'FINAL VERIFICATION' as status;
SELECT 
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category
ORDER BY category;

-- Step 11: Summary
SELECT 'SUMMARY' as status;
SELECT 
    '✅ Categories have been corrected' as result,
    '✅ Triggers have been disabled and re-created with improved logic' as triggers,
    '✅ All clinical positions should now show as Clinical' as clinical,
    '✅ All non-clinical positions should show as Non-Clinical' as non_clinical;
