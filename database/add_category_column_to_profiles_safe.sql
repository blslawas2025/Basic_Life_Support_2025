-- Add category column to profiles table (Safe Version)
-- This script adds a category column that automatically fills based on the jobs table
-- It handles cases where the jobs table might not exist yet

-- First, check if jobs table exists and create it if needed
-- This ensures the jobs table exists before we try to reference it

-- Add the category column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) CHECK (category IN ('Clinical', 'Non-Clinical'));

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_category ON profiles(category);

-- Create a function to automatically set category based on job_position_id
-- This function will work even if jobs table doesn't exist yet
CREATE OR REPLACE FUNCTION set_profile_category()
RETURNS TRIGGER AS $$
BEGIN
    -- If job_position_id is provided, try to get the category from jobs table
    IF NEW.job_position_id IS NOT NULL THEN
        -- Check if jobs table exists and has the expected structure
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
            SELECT j.category INTO NEW.category
            FROM jobs j
            WHERE j.id = NEW.job_position_id AND j.is_active = true;
            
            -- If no matching job found, set to NULL
            IF NOT FOUND THEN
                NEW.category := NULL;
            END IF;
        ELSE
            -- If jobs table doesn't exist, set category to NULL
            NEW.category := NULL;
        END IF;
    ELSE
        -- If no job_position_id, set category to NULL
        NEW.category := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS set_profile_category_on_insert ON profiles;
CREATE TRIGGER set_profile_category_on_insert
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_profile_category();

-- Create trigger for UPDATE operations
DROP TRIGGER IF EXISTS set_profile_category_on_update ON profiles;
CREATE TRIGGER set_profile_category_on_update
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_profile_category();

-- Update existing profiles with category values based on their job_position_id
-- Only run this if jobs table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        UPDATE profiles 
        SET category = j.category
        FROM jobs j
        WHERE profiles.job_position_id = j.id 
          AND j.is_active = true
          AND profiles.category IS NULL;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN profiles.category IS 'Category of the job position: Clinical or Non-Clinical, automatically filled from jobs table';

-- Create a function to manually update category for a specific profile
CREATE OR REPLACE FUNCTION update_profile_category(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    job_category VARCHAR(50);
BEGIN
    -- Check if jobs table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        RETURN FALSE;
    END IF;
    
    -- Get the category from the related job
    SELECT j.category INTO job_category
    FROM profiles p
    JOIN jobs j ON p.job_position_id = j.id
    WHERE p.id = profile_id AND j.is_active = true;
    
    -- Update the profile with the category
    IF job_category IS NOT NULL THEN
        UPDATE profiles 
        SET category = job_category, updated_at = NOW()
        WHERE id = profile_id;
        RETURN TRUE;
    ELSE
        -- If no job found, set category to NULL
        UPDATE profiles 
        SET category = NULL, updated_at = NOW()
        WHERE id = profile_id;
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update all profiles' categories
CREATE OR REPLACE FUNCTION update_all_profiles_categories()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Check if jobs table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        RETURN 0;
    END IF;
    
    -- Update all profiles with their job categories
    UPDATE profiles 
    SET category = j.category, updated_at = NOW()
    FROM jobs j
    WHERE profiles.job_position_id = j.id 
      AND j.is_active = true;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easy querying of profiles with job categories
-- Only create if jobs table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        EXECUTE '
        CREATE OR REPLACE VIEW profiles_with_categories AS
        SELECT
            p.*,
            j.name as job_name,
            j.category as job_category,
            j.code_prefix as job_code_prefix
        FROM profiles p
        LEFT JOIN jobs j ON p.job_position_id = j.id AND j.is_active = true;
        ';
        
        EXECUTE 'COMMENT ON VIEW profiles_with_categories IS ''View showing profiles with their job information and categories'';';
    END IF;
END $$;

-- Create a function to check if jobs table is ready
CREATE OR REPLACE FUNCTION is_jobs_table_ready()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'jobs'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'category'
    );
END;
$$ LANGUAGE plpgsql;
