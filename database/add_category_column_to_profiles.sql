-- Add category column to profiles table
-- This script adds a category column that automatically fills based on the jobs table

-- Add the category column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) CHECK (category IN ('Clinical', 'Non-Clinical'));

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_category ON profiles(category);

-- Create a function to automatically set category based on job_position_id
CREATE OR REPLACE FUNCTION set_profile_category()
RETURNS TRIGGER AS $$
BEGIN
    -- If job_position_id is provided, get the category from jobs table
    IF NEW.job_position_id IS NOT NULL THEN
        SELECT j.category INTO NEW.category
        FROM jobs j
        WHERE j.id = NEW.job_position_id AND j.is_active = true;
        
        -- If no matching job found, set to NULL
        IF NOT FOUND THEN
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
CREATE OR REPLACE TRIGGER set_profile_category_on_insert
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_profile_category();

-- Create trigger for UPDATE operations
CREATE OR REPLACE TRIGGER set_profile_category_on_update
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_profile_category();

-- Update existing profiles with category values based on their job_position_id
UPDATE profiles 
SET category = j.category
FROM jobs j
WHERE profiles.job_position_id = j.id 
  AND j.is_active = true
  AND profiles.category IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.category IS 'Category of the job position: Clinical or Non-Clinical, automatically filled from jobs table';

-- Create a function to manually update category for a specific profile
CREATE OR REPLACE FUNCTION update_profile_category(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    job_category VARCHAR(50);
BEGIN
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
-- Note: This view will only work if the jobs table exists
CREATE OR REPLACE VIEW profiles_with_categories AS
SELECT
    p.*,
    j.name as job_name,
    j.category as job_category,
    j.code_prefix as job_code_prefix
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id AND j.is_active = true;

-- Add RLS policy for the new column if needed
-- (Assuming RLS is already enabled on profiles table)
COMMENT ON VIEW profiles_with_categories IS 'View showing profiles with their job information and categories';
