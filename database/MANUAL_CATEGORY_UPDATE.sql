-- MANUAL CATEGORY UPDATE SCRIPT
-- Use this if the automatic scripts don't work

-- Step 1: Check what you have
SELECT 
    id,
    name,
    job_position_name,
    category
FROM profiles 
WHERE category IS NULL
ORDER BY job_position_name;

-- Step 2: Manual updates for specific job positions
-- Copy and paste these one by one, replacing the ID with actual IDs from Step 1

-- For Clinical positions:
UPDATE profiles SET category = 'Clinical' WHERE id = 'YOUR_ID_HERE' AND job_position_name = 'YOUR_JOB_POSITION_HERE';

-- For Non-Clinical positions:
UPDATE profiles SET category = 'Non-Clinical' WHERE id = 'YOUR_ID_HERE' AND job_position_name = 'YOUR_JOB_POSITION_HERE';

-- Step 3: Bulk update by job position name (safer approach)
-- Replace 'JOB_POSITION_NAME' with actual job position names from your data

-- Clinical positions:
UPDATE profiles SET category = 'Clinical' WHERE job_position_name = 'Jururawat U5';
UPDATE profiles SET category = 'Clinical' WHERE job_position_name = 'Jururawat U6';
UPDATE profiles SET category = 'Clinical' WHERE job_position_name = 'Pegawai Perubatan UD41';
UPDATE profiles SET category = 'Clinical' WHERE job_position_name = 'Pegawai Farmasi UD44';
-- Add more as needed...

-- Non-Clinical positions:
UPDATE profiles SET category = 'Non-Clinical' WHERE job_position_name = 'Penolong Pegawai Tadbir N17';
UPDATE profiles SET category = 'Non-Clinical' WHERE job_position_name = 'Pembantu Khidmat Am N1';
-- Add more as needed...

-- Step 4: Set remaining NULL as Non-Clinical
UPDATE profiles SET category = 'Non-Clinical' WHERE category IS NULL;

-- Step 5: Verify
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
GROUP BY job_position_name, category
ORDER BY job_position_name;
