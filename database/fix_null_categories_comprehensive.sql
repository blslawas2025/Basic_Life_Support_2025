-- Comprehensive fix for NULL categories in profiles table
-- This script categorizes job positions as Clinical or Non-Clinical based on job position names

-- Step 1: Check current state before update
SELECT 
    'BEFORE UPDATE' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 2: Show profiles that will be updated
SELECT 
    p.id,
    p.name,
    p.job_position_name,
    p.category as current_category
FROM profiles p
WHERE p.category IS NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 3: Update categories based on job position names
-- Clinical positions (direct patient care, medical treatment, healthcare services)
UPDATE profiles 
SET category = 'Clinical'
WHERE category IS NULL 
  AND (
    -- Medical positions
    job_position_name ILIKE '%Pegawai Perubatan%' OR
    job_position_name ILIKE '%Pegawai Farmasi%' OR
    job_position_name ILIKE '%Pegawai Pergigian%' OR
    job_position_name ILIKE '%Penolong Pegawai Perubatan%' OR
    job_position_name ILIKE '%Penolong Pegawai Farmasi%' OR
    
    -- Nursing positions
    job_position_name ILIKE '%Jururawat%' OR
    job_position_name ILIKE '%Jururawat Masyarakat%' OR
    
    -- Allied Health positions
    job_position_name ILIKE '%Juruteknologi Makmal Perubatan%' OR
    job_position_name ILIKE '%Jurupulih Perubatan Carakerja%' OR
    job_position_name ILIKE '%Jurupulih Fisioterapi%' OR
    job_position_name ILIKE '%Juru-Xray%' OR
    
    -- Healthcare support positions
    job_position_name ILIKE '%Pembantu Perawatan Kesihatan%' OR
    
    -- Dental positions
    job_position_name ILIKE '%Pembantu Pemberdahan Pergigian%' OR
    
    -- Any position with medical/healthcare keywords
    job_position_name ILIKE '%Perubatan%' OR
    job_position_name ILIKE '%Farmasi%' OR
    job_position_name ILIKE '%Pergigian%' OR
    job_position_name ILIKE '%Kesihatan%' OR
    job_position_name ILIKE '%Makmal%' OR
    job_position_name ILIKE '%Pulih%' OR
    job_position_name ILIKE '%Xray%' OR
    job_position_name ILIKE '%Radiologi%' OR
    job_position_name ILIKE '%Fisioterapi%' OR
    job_position_name ILIKE '%Carakerja%'
  );

-- Step 4: Update remaining positions as Non-Clinical
-- Administrative, support, and general service positions
UPDATE profiles 
SET category = 'Non-Clinical'
WHERE category IS NULL 
  AND (
    -- Administrative positions
    job_position_name ILIKE '%Penolong Pegawai Tadbir%' OR
    job_position_name ILIKE '%Pembantu Tadbir%' OR
    
    -- General services
    job_position_name ILIKE '%Pembantu Khidmat Am%' OR
    job_position_name ILIKE '%Pembantu Penyediaan Makanan%' OR
    
    -- Engineering positions
    job_position_name ILIKE '%Penolong Jurutera%' OR
    
    -- Any position with administrative/support keywords
    job_position_name ILIKE '%Tadbir%' OR
    job_position_name ILIKE '%Khidmat Am%' OR
    job_position_name ILIKE '%Penyediaan Makanan%' OR
    job_position_name ILIKE '%Jurutera%' OR
    job_position_name ILIKE '%Pentadbiran%' OR
    job_position_name ILIKE '%Sokongan%'
  );

-- Step 5: Handle any remaining NULL categories with a fallback
-- If there are still NULL categories, set them based on common patterns
UPDATE profiles 
SET category = 'Non-Clinical'
WHERE category IS NULL;

-- Step 6: Verify the update results
SELECT 
    'AFTER UPDATE' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 7: Show sample of updated profiles
SELECT 
    p.id,
    p.name,
    p.job_position_name,
    p.category as updated_category,
    p.created_at
FROM profiles p
WHERE p.category IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 15;

-- Step 8: Show breakdown by category
SELECT 
    category,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM profiles), 2) as percentage
FROM profiles 
WHERE category IS NOT NULL
GROUP BY category
ORDER BY count DESC;

-- Step 9: Create a summary report
SELECT 
    'SUMMARY REPORT' as report_type,
    'Total profiles processed: ' || COUNT(*) as total_processed,
    'Clinical positions: ' || COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_summary,
    'Non-Clinical positions: ' || COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_summary,
    'Remaining NULL: ' || COUNT(CASE WHEN category IS NULL THEN 1 END) as null_summary
FROM profiles;
