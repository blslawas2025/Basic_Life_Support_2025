-- Auto-populate category field in profiles table
-- This script creates a trigger to automatically fill the category field
-- when a profile is inserted or updated with a job_position_id

-- First, let's fix existing NULL categories
UPDATE profiles 
SET category = j.category
FROM jobs j
WHERE profiles.job_position_id = j.id 
  AND profiles.category IS NULL;

-- Create a function to automatically populate category from job
CREATE OR REPLACE FUNCTION auto_populate_category()
RETURNS TRIGGER AS $$
BEGIN
    -- If job_position_id is provided, get the category from jobs table
    IF NEW.job_position_id IS NOT NULL THEN
        SELECT category INTO NEW.category
        FROM jobs 
        WHERE id = NEW.job_position_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS trigger_auto_populate_category_insert ON profiles;
CREATE TRIGGER trigger_auto_populate_category_insert
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_category();

-- Create trigger for UPDATE operations
DROP TRIGGER IF EXISTS trigger_auto_populate_category_update ON profiles;
CREATE TRIGGER trigger_auto_populate_category_update
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_category();

-- Test the trigger by inserting a test profile
-- (This will be commented out in production)
/*
INSERT INTO profiles (
    email, 
    name, 
    job_position_id, 
    job_position_name, 
    user_type, 
    status
) VALUES (
    'test@example.com',
    'Test User',
    (SELECT id FROM jobs WHERE name = 'Jururawat' LIMIT 1),
    'Jururawat U5',
    'participant',
    'pending'
);

-- Check if the category was auto-populated
SELECT 
    name, 
    job_position_name, 
    category 
FROM profiles 
WHERE email = 'test@example.com';

-- Clean up test data
DELETE FROM profiles WHERE email = 'test@example.com';
*/

-- Verify all profiles now have categories
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;
