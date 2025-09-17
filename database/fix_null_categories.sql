-- Fix NULL categories in profiles table by updating from jobs table
-- This script will automatically populate the category field based on job_position_id

-- First, let's see what we're working with
SELECT 
    p.id,
    p.name,
    p.job_position_name,
    p.category,
    j.name as job_name,
    j.category as job_category
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.category IS NULL
ORDER BY p.created_at DESC;

-- Update profiles with NULL categories using job data
UPDATE profiles 
SET category = j.category
FROM jobs j
WHERE profiles.job_position_id = j.id 
  AND profiles.category IS NULL;

-- Verify the update worked
SELECT 
    p.id,
    p.name,
    p.job_position_name,
    p.category,
    j.name as job_name,
    j.category as job_category
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.category IS NOT NULL
ORDER BY p.created_at DESC;

-- Count how many profiles were updated
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;
