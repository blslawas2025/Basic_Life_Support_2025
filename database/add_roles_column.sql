-- Add roles column to profiles table
-- This column will determine which dashboard users see after login

-- Add the roles column with default value 'user'
ALTER TABLE profiles 
ADD COLUMN roles VARCHAR(20) DEFAULT 'user' NOT NULL;

-- Add check constraint to ensure only valid roles are allowed
ALTER TABLE profiles 
ADD CONSTRAINT check_roles 
CHECK (roles IN ('admin', 'staff', 'user'));

-- Update existing records to have appropriate roles
-- You may need to adjust these based on your existing data
UPDATE profiles 
SET roles = 'admin' 
WHERE user_type = 'admin' OR user_type = 'super_admin';

UPDATE profiles 
SET roles = 'staff' 
WHERE user_type = 'staff';

UPDATE profiles 
SET roles = 'user' 
WHERE user_type = 'participant';

-- Create index for better performance on role-based queries
CREATE INDEX idx_profiles_roles ON profiles(roles);

-- Verify the changes
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name = 'roles';

-- Show sample data with roles
SELECT id, email, name, user_type, roles, status 
FROM profiles 
LIMIT 10;
