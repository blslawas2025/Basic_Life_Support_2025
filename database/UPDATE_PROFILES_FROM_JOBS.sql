-- UPDATE PROFILES FROM JOBS TABLE
-- Now that jobs table has the correct categories, update profiles

UPDATE profiles 
SET category = j.category, updated_at = NOW()
FROM jobs j
WHERE profiles.job_position_name = j.job_position;

-- Check results
SELECT 
    'FINAL RESULTS' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical
FROM profiles;

-- Show the fixed categories
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
GROUP BY job_position_name, category
ORDER BY job_position_name;
