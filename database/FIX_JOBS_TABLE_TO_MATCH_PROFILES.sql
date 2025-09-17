-- FIX: Update jobs table to have the exact job position names from profiles
-- This will add the graded job positions to the jobs table

-- Add the missing graded job positions to jobs table
INSERT INTO jobs (job_position, category, is_active, created_at, updated_at)
SELECT DISTINCT 
    job_position_name as job_position,
    CASE 
        WHEN job_position_name LIKE '%JURURAWAT%' OR
             job_position_name LIKE '%PERUBATAN%' OR
             job_position_name LIKE '%FARMASI%' OR
             job_position_name LIKE '%PERGIGIAN%' OR
             job_position_name LIKE '%KESIHATAN%' OR
             job_position_name LIKE '%JURUTEKNOLOGI%' OR
             job_position_name LIKE '%JURUPULIH%' OR
             job_position_name LIKE '%XRAY%' OR
             job_position_name LIKE '%PERAWATAN%' OR
             job_position_name LIKE '%PEMBERDAHAN%' OR
             job_position_name LIKE '%MAKMAL%' OR
             job_position_name LIKE '%CARAKERJA%' OR
             job_position_name LIKE '%FISIOTERAPI%'
        THEN 'Clinical'
        ELSE 'Non-Clinical'
    END as category,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM profiles 
WHERE job_position_name IS NOT NULL
  AND job_position_name NOT IN (SELECT job_position FROM jobs);

-- Now update profiles using the exact job_position_name match
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
