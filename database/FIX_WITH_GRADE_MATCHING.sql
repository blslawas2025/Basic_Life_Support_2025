-- FIX: Match profiles to jobs by removing grades from job_position_name
-- This will match "JURURAWAT U 5" to "Jururawat" in jobs table

UPDATE profiles 
SET category = j.category, updated_at = NOW()
FROM jobs j
WHERE TRIM(REGEXP_REPLACE(profiles.job_position_name, '\s+[A-Z]+\s*\d+$', '')) = j.job_position;

-- Check results
SELECT 
    'AFTER GRADE MATCHING' as status,
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
