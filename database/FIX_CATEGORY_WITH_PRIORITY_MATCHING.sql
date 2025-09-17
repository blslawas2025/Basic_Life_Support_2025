-- FIX CATEGORY WITH PRIORITY MATCHING
-- This script prioritizes exact matches over partial matches to avoid conflicts

-- Step 1: Show current matching conflicts
SELECT 'CURRENT MATCHING CONFLICTS' as status;
SELECT 
    p.job_position_name,
    j.job_position,
    j.category,
    CASE 
        WHEN UPPER(p.job_position_name) = UPPER(j.job_position) THEN 'EXACT MATCH'
        ELSE 'PARTIAL MATCH'
    END as match_type
FROM profiles p
JOIN jobs j ON UPPER(TRIM(REGEXP_REPLACE(p.job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g'))) = UPPER(j.job_position)
WHERE p.job_position_name IS NOT NULL
  AND j.is_active = true
ORDER BY p.job_position_name, match_type;

-- Step 2: Update with priority matching (exact matches first, then partial)
UPDATE profiles 
SET category = j.category,
    updated_at = NOW()
FROM jobs j
WHERE profiles.job_position_name IS NOT NULL
  AND j.is_active = true
  AND (
    -- First priority: Exact match
    UPPER(profiles.job_position_name) = UPPER(j.job_position)
    OR
    -- Second priority: Partial match (extract job name and match)
    UPPER(TRIM(REGEXP_REPLACE(profiles.job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g'))) = UPPER(j.job_position)
  )
  -- Only update if this is the best match (exact or no exact match exists)
  AND NOT EXISTS (
    SELECT 1 FROM jobs j2 
    WHERE j2.is_active = true 
    AND UPPER(profiles.job_position_name) = UPPER(j2.job_position)
    AND j2.id != j.id
  );

-- Step 3: Show results after update
SELECT 'RESULTS AFTER UPDATE' as status;
SELECT 
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
GROUP BY category
ORDER BY category;

-- Step 4: Show verification of matches
SELECT 'VERIFICATION - SAMPLE RESULTS' as status;
SELECT 
    p.name,
    p.job_position_name,
    p.category as profile_category,
    j.job_position,
    j.category as jobs_category,
    CASE 
        WHEN p.category = j.category THEN 'CORRECT'
        ELSE 'MISMATCH'
    END as status
FROM profiles p
JOIN jobs j ON (
    UPPER(p.job_position_name) = UPPER(j.job_position)
    OR UPPER(TRIM(REGEXP_REPLACE(p.job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g'))) = UPPER(j.job_position)
)
WHERE p.job_position_name IS NOT NULL
  AND j.is_active = true
ORDER BY p.job_position_name
LIMIT 15;

-- Step 5: Show any remaining unmatched profiles
SELECT 'REMAINING UNMATCHED PROFILES' as status;
SELECT 
    job_position_name,
    category,
    COUNT(*) as count
FROM profiles 
WHERE job_position_name IS NOT NULL
  AND id NOT IN (
    SELECT p.id
    FROM profiles p
    JOIN jobs j ON (
      UPPER(p.job_position_name) = UPPER(j.job_position)
      OR UPPER(TRIM(REGEXP_REPLACE(p.job_position_name, '\s+(U|UD|UG|UF|H|N|JA)\s*\d+$', '', 'g'))) = UPPER(j.job_position)
    )
    WHERE j.is_active = true
  )
GROUP BY job_position_name, category
ORDER BY job_position_name;
