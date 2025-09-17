-- Ultra-safe version that dynamically checks column names
-- This version will work regardless of the actual table structure

-- Add the category column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) CHECK (category IN ('Clinical', 'Non-Clinical'));

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_category ON profiles(category);

-- Create a function to get the job name column dynamically
CREATE OR REPLACE FUNCTION get_job_name_column()
RETURNS TEXT AS $$
DECLARE
    job_name_col TEXT;
BEGIN
    -- Check if jobs table exists and get the name column
    SELECT column_name INTO job_name_col
    FROM information_schema.columns 
    WHERE table_name = 'jobs' 
    AND column_name IN ('name', 'position_name', 'job_name')
    ORDER BY 
        CASE column_name 
            WHEN 'name' THEN 1
            WHEN 'position_name' THEN 2
            WHEN 'job_name' THEN 3
            ELSE 4
        END
    LIMIT 1;
    
    RETURN job_name_col;
END;
$$ LANGUAGE plpgsql;

-- Create a function to automatically set category based on job_position_id
CREATE OR REPLACE FUNCTION set_profile_category()
RETURNS TRIGGER AS $$
DECLARE
    job_name_col TEXT;
    job_category_col TEXT;
    sql_query TEXT;
BEGIN
    -- If job_position_id is provided, try to get the category from jobs table
    IF NEW.job_position_id IS NOT NULL THEN
        -- Check if jobs table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
            -- Get the actual column names
            job_name_col := get_job_name_column();
            job_category_col := 'category';
            
            -- If we found the columns, try to get the category
            IF job_name_col IS NOT NULL THEN
                -- Build dynamic SQL query
                sql_query := format('SELECT %I FROM jobs WHERE id = $1 AND is_active = true', job_category_col);
                
                -- Execute the query
                EXECUTE sql_query INTO NEW.category USING NEW.job_position_id;
                
                -- If no matching job found, set to NULL
                IF NOT FOUND THEN
                    NEW.category := NULL;
                END IF;
            ELSE
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
-- Only run this if jobs table exists and has the required columns
DO $$
DECLARE
    job_name_col TEXT;
    job_category_col TEXT;
    sql_query TEXT;
    updated_count INTEGER;
BEGIN
    -- Check if jobs table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        -- Get the actual column names
        job_name_col := get_job_name_column();
        job_category_col := 'category';
        
        -- If we found the columns, update profiles
        IF job_name_col IS NOT NULL THEN
            -- Build dynamic SQL query
            sql_query := format('
                UPDATE profiles 
                SET category = j.%I
                FROM jobs j
                WHERE profiles.job_position_id = j.id 
                  AND j.is_active = true
                  AND profiles.category IS NULL', job_category_col);
            
            -- Execute the query
            EXECUTE sql_query;
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            RAISE NOTICE 'Updated % profiles with category information', updated_count;
        ELSE
            RAISE NOTICE 'Jobs table exists but does not have a recognizable name column';
        END IF;
    ELSE
        RAISE NOTICE 'Jobs table does not exist, skipping category update';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN profiles.category IS 'Category of the job position: Clinical or Non-Clinical, automatically filled from jobs table';

-- Create a function to manually update category for a specific profile
CREATE OR REPLACE FUNCTION update_profile_category(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    job_name_col TEXT;
    job_category_col TEXT;
    sql_query TEXT;
    job_category VARCHAR(50);
BEGIN
    -- Check if jobs table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        RETURN FALSE;
    END IF;
    
    -- Get the actual column names
    job_name_col := get_job_name_column();
    job_category_col := 'category';
    
    -- If we found the columns, try to get the category
    IF job_name_col IS NOT NULL THEN
        -- Build dynamic SQL query
        sql_query := format('
            SELECT j.%I 
            FROM profiles p
            JOIN jobs j ON p.job_position_id = j.id
            WHERE p.id = $1 AND j.is_active = true', job_category_col);
        
        -- Execute the query
        EXECUTE sql_query INTO job_category USING profile_id;
        
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
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update all profiles' categories
CREATE OR REPLACE FUNCTION update_all_profiles_categories()
RETURNS INTEGER AS $$
DECLARE
    job_name_col TEXT;
    job_category_col TEXT;
    sql_query TEXT;
    updated_count INTEGER;
BEGIN
    -- Check if jobs table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        RETURN 0;
    END IF;
    
    -- Get the actual column names
    job_name_col := get_job_name_column();
    job_category_col := 'category';
    
    -- If we found the columns, update profiles
    IF job_name_col IS NOT NULL THEN
        -- Build dynamic SQL query
        sql_query := format('
            UPDATE profiles 
            SET category = j.%I, updated_at = NOW()
            FROM jobs j
            WHERE profiles.job_position_id = j.id 
              AND j.is_active = true', job_category_col);
        
        -- Execute the query
        EXECUTE sql_query;
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RETURN updated_count;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to check if jobs table is ready
CREATE OR REPLACE FUNCTION is_jobs_table_ready()
RETURNS BOOLEAN AS $$
DECLARE
    job_name_col TEXT;
BEGIN
    -- Check if jobs table exists and has required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs') THEN
        RETURN FALSE;
    END IF;
    
    -- Check if it has a name column and category column
    job_name_col := get_job_name_column();
    
    RETURN job_name_col IS NOT NULL 
        AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'category');
END;
$$ LANGUAGE plpgsql;

-- Create a view for easy querying of profiles with job categories
-- Only create if jobs table is ready
DO $$
DECLARE
    job_name_col TEXT;
    sql_query TEXT;
BEGIN
    -- Check if jobs table is ready
    IF is_jobs_table_ready() THEN
        -- Get the actual column names
        job_name_col := get_job_name_column();
        
        -- Build dynamic SQL query for the view
        sql_query := format('
            CREATE OR REPLACE VIEW profiles_with_categories AS
            SELECT
                p.*,
                j.%I as job_name,
                j.category as job_category,
                j.code_prefix as job_code_prefix
            FROM profiles p
            LEFT JOIN jobs j ON p.job_position_id = j.id AND j.is_active = true', job_name_col);
        
        -- Execute the query
        EXECUTE sql_query;
        
        -- Add comment
        EXECUTE 'COMMENT ON VIEW profiles_with_categories IS ''View showing profiles with their job information and categories'';';
        
        RAISE NOTICE 'View profiles_with_categories created successfully';
    ELSE
        RAISE NOTICE 'Jobs table not ready, skipping view creation';
    END IF;
END $$;
