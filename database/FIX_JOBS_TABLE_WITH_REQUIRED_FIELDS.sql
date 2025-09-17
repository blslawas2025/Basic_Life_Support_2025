-- FIX: Update jobs table with all required fields
-- This will add the graded job positions with proper code_prefix and grades

-- Add the missing graded job positions to jobs table with all required fields
INSERT INTO jobs (job_position, code_prefix, grades, category, is_active, created_at, updated_at)
SELECT DISTINCT 
    job_position_name as job_position,
    CASE 
        -- Extract code prefix from job position name
        WHEN job_position_name LIKE '% U 5%' OR job_position_name LIKE '% U 6%' OR job_position_name LIKE '% U 7%' THEN 'U'
        WHEN job_position_name LIKE '% UD 9%' OR job_position_name LIKE '% UD 10%' THEN 'UD'
        WHEN job_position_name LIKE '% UG 9%' OR job_position_name LIKE '% UG 10%' THEN 'UG'
        WHEN job_position_name LIKE '% UF 9%' THEN 'UF'
        WHEN job_position_name LIKE '% H 1%' THEN 'H'
        WHEN job_position_name LIKE '% N 5%' THEN 'N'
        ELSE 'U' -- Default fallback
    END as code_prefix,
    CASE 
        -- Extract grades as JSON array
        WHEN job_position_name LIKE '% U 5%' THEN '["U5"]'::jsonb
        WHEN job_position_name LIKE '% U 6%' THEN '["U6"]'::jsonb
        WHEN job_position_name LIKE '% U 7%' THEN '["U7"]'::jsonb
        WHEN job_position_name LIKE '% UD 9%' THEN '["UD9"]'::jsonb
        WHEN job_position_name LIKE '% UD 10%' THEN '["UD10"]'::jsonb
        WHEN job_position_name LIKE '% UG 9%' THEN '["UG9"]'::jsonb
        WHEN job_position_name LIKE '% UG 10%' THEN '["UG10"]'::jsonb
        WHEN job_position_name LIKE '% UF 9%' THEN '["UF9"]'::jsonb
        WHEN job_position_name LIKE '% H 1%' THEN '["H1"]'::jsonb
        WHEN job_position_name LIKE '% N 5%' THEN '["N5"]'::jsonb
        ELSE '["U5"]'::jsonb -- Default fallback
    END as grades,
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
