-- Simple version - just add the category column
-- This version only adds the column and basic functionality without complex views

-- Add the category column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) CHECK (category IN ('Clinical', 'Non-Clinical'));

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_category ON profiles(category);

-- Add comment for documentation
COMMENT ON COLUMN profiles.category IS 'Category of the job position: Clinical or Non-Clinical, automatically filled from jobs table';

-- Create a simple function to update category based on job_position_id
CREATE OR REPLACE FUNCTION update_profile_category_simple(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    job_category VARCHAR(50);
BEGIN
    -- Check if jobs table exists and has the required structure
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        RETURN FALSE;
    END IF;
    
    -- Check if jobs table has category column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'category') THEN
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
CREATE OR REPLACE FUNCTION update_all_profiles_categories_simple()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Check if jobs table exists and has the required structure
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        RETURN 0;
    END IF;
    
    -- Check if jobs table has category column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'category') THEN
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

-- Create a function to check if jobs table is ready
CREATE OR REPLACE FUNCTION is_jobs_table_ready_simple()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if jobs table exists and has required columns
    RETURN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs')
        AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'category')
        AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'is_active');
END;
$$ LANGUAGE plpgsql;

-- Update existing profiles if jobs table is ready
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    IF is_jobs_table_ready_simple() THEN
        SELECT update_all_profiles_categories_simple() INTO updated_count;
        RAISE NOTICE 'Updated % profiles with category information', updated_count;
    ELSE
        RAISE NOTICE 'Jobs table not ready, skipping category update';
    END IF;
END $$;
