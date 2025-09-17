-- Improved synchronization between jobs and profiles tables
-- This version handles edge cases and prevents constraint violations

-- Step 1: Drop the previous trigger if it exists
DROP TRIGGER IF EXISTS sync_profiles_on_jobs_update ON jobs;

-- Step 2: Create improved function to sync profiles when jobs category changes
CREATE OR REPLACE FUNCTION sync_profiles_on_job_category_change()
RETURNS TRIGGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Only proceed if the category actually changed and is valid
    IF OLD.category IS DISTINCT FROM NEW.category 
       AND NEW.category IN ('Clinical', 'Non-Clinical') THEN
        
        -- Update all profiles that reference this job
        UPDATE profiles 
        SET 
            category = NEW.category,
            updated_at = NOW()
        WHERE job_position_id = NEW.id;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        
        -- Log the change for debugging
        RAISE NOTICE 'Updated % profiles for job % (ID: %) from category % to %', 
            updated_count,
            NEW.job_position,
            NEW.id,
            OLD.category,
            NEW.category;
    ELSIF NEW.category NOT IN ('Clinical', 'Non-Clinical') THEN
        -- If invalid category, set profiles to NULL
        UPDATE profiles 
        SET 
            category = NULL,
            updated_at = NOW()
        WHERE job_position_id = NEW.id;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        
        RAISE WARNING 'Invalid category % for job % (ID: %). Set % profiles to NULL.', 
            NEW.category,
            NEW.job_position,
            NEW.id,
            updated_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create improved trigger for UPDATE operations on jobs table
CREATE TRIGGER sync_profiles_on_jobs_update
    AFTER UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION sync_profiles_on_job_category_change();

-- Step 4: Also create a function to validate and fix existing data
CREATE OR REPLACE FUNCTION validate_and_fix_profile_categories()
RETURNS INTEGER AS $$
DECLARE
    fixed_count INTEGER := 0;
    profile_record RECORD;
BEGIN
    -- Loop through profiles with invalid categories
    FOR profile_record IN 
        SELECT id, job_position_name, job_position_id
        FROM profiles 
        WHERE category IS NOT NULL 
          AND category NOT IN ('Clinical', 'Non-Clinical')
    LOOP
        -- Fix based on job_position_name if job_position_id is not helpful
        UPDATE profiles 
        SET 
            category = CASE 
                WHEN job_position_name ILIKE '%JURURAWAT%' THEN 'Clinical'
                WHEN job_position_name ILIKE '%PEGAWAI PERGIGIAN%' THEN 'Clinical'
                WHEN job_position_name ILIKE '%PEGAWAI PERUBATAN%' THEN 'Clinical'
                WHEN job_position_name ILIKE '%PENOLONG PEGAWAI PERUBATAN%' THEN 'Clinical'
                WHEN job_position_name ILIKE '%PEMBANTU PERAWATAN%' THEN 'Clinical'
                WHEN job_position_name ILIKE '%PEGAWAI FARMASI%' THEN 'Non-Clinical'
                WHEN job_position_name ILIKE '%JURUTEKNOLOGI%' THEN 'Non-Clinical'
                WHEN job_position_name ILIKE '%JURUPULIH%' THEN 'Non-Clinical'
                WHEN job_position_name ILIKE '%PENOLONG PEGAWAI TADBIR%' THEN 'Non-Clinical'
                WHEN job_position_name ILIKE '%PEMBANTU KHIDMAT%' THEN 'Non-Clinical'
                ELSE 'Non-Clinical'
            END,
            updated_at = NOW()
        WHERE id = profile_record.id;
        
        fixed_count := fixed_count + 1;
    END LOOP;
    
    RETURN fixed_count;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Run the validation function
SELECT validate_and_fix_profile_categories() as profiles_fixed;

-- Step 6: Final verification
SELECT 
    'Final category distribution:' as info,
    category,
    COUNT(*) as count
FROM profiles 
GROUP BY category
ORDER BY category;

SELECT '✅ Improved sync trigger created with better error handling!' as result;
