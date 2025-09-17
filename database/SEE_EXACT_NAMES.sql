-- Let's see the EXACT job position names in your database
-- Run this first to see what we're working with

SELECT DISTINCT job_position_name 
FROM profiles 
WHERE job_position_name IS NOT NULL
ORDER BY job_position_name;

-- Also show the count for each job position
SELECT 
    job_position_name,
    COUNT(*) as count,
    category
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY job_position_name, category
ORDER BY job_position_name;
