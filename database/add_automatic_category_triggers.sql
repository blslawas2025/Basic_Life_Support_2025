-- Add automatic triggers for category filling
-- This script adds the missing triggers to automatically fill the category column

-- Create a function to automatically set category based on job_position_id
CREATE OR REPLACE FUNCTION set_profile_category_auto()
RETURNS TRIGGER AS $$
DECLARE
    job_category VARCHAR(50);
BEGIN
    -- If job_position_id is provided, try to get the category from jobs table
    IF NEW.job_position_id IS NOT NULL THEN
        -- Check if jobs table exists and has the required structure
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
           AND EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'jobs' AND column_name = 'category') THEN
            
            -- Get the category from the related job
            SELECT j.category INTO job_category
            FROM jobs j
            WHERE j.id = NEW.job_position_id AND j.is_active = true;
            
            -- Set the category
            IF job_category IS NOT NULL THEN
                NEW.category := job_category;
            ELSE
                NEW.category := NULL;
            END IF;
        ELSE
            NEW.category := NULL;
        END IF;
    ELSE
        -- If no job_position_id, set category to NULL
        NEW.category := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_profile_category_on_insert ON profiles;
DROP TRIGGER IF EXISTS set_profile_category_on_update ON profiles;

-- Create trigger for INSERT operations
CREATE TRIGGER set_profile_category_on_insert
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_profile_category_auto();

-- Create trigger for UPDATE operations
CREATE TRIGGER set_profile_category_on_update
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_profile_category_auto();

-- Update all existing profiles with their categories
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Check if jobs table is ready
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') 
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'jobs' AND column_name = 'category') THEN
        
        -- Update all profiles with their job categories
        UPDATE profiles 
        SET category = j.category, updated_at = NOW()
        FROM jobs j
        WHERE profiles.job_position_id = j.id 
          AND j.is_active = true
          AND profiles.category IS NULL;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % profiles with category information', updated_count;
    ELSE
        RAISE NOTICE 'Jobs table not ready, skipping category update';
    END IF;
END $$;

-- Test the triggers by showing some sample data
SELECT 
    p.name,
    p.job_position_name,
    p.category,
    j.category as job_category
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.job_position_id IS NOT NULL
LIMIT 10;
