-- IMMEDIATE FIX for NULL categories in profiles table
-- This script will fix all NULL categories based on job_position_name patterns

-- Step 1: Check current state
SELECT 
    'BEFORE FIX' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 2: Show profiles with NULL categories that will be fixed
SELECT 
    id,
    name,
    job_position_name,
    category as current_category
FROM profiles 
WHERE category IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Step 3: Update Clinical positions (comprehensive list)
UPDATE profiles 
SET category = 'Clinical', updated_at = NOW()
WHERE category IS NULL 
  AND (
    -- Exact matches
    job_position_name IN (
        'Jurupulih Fisioterapi',
        'Jururawat', 
        'Pegawai Perubatan',
        'Pegawai Farmasi',
        'Pegawai Pergigian',
        'Penolong Pegawai Perubatan',
        'Penolong Pegawai Farmasi',
        'Juruteknologi Makmal Perubatan',
        'Jurupulih Perubatan Carakerja',
        'Juru-Xray',
        'Pembantu Perawatan Kesihatan',
        'Jururawat Masyarakat',
        'Pembantu Pemberdahan Pergigian',
        'Doktor',
        'Pegawai Kesihatan',
        'Pembantu Perubatan',
        'Pembantu Kesihatan'
    )
    OR
    -- Pattern matches (for positions with grades)
    job_position_name LIKE 'Jururawat%' OR
    job_position_name LIKE 'Pegawai Perubatan%' OR
    job_position_name LIKE 'Pegawai Farmasi%' OR
    job_position_name LIKE 'Pegawai Pergigian%' OR
    job_position_name LIKE 'Penolong Pegawai Perubatan%' OR
    job_position_name LIKE 'Penolong Pegawai Farmasi%' OR
    job_position_name LIKE 'Juruteknologi%' OR
    job_position_name LIKE 'Jurupulih%' OR
    job_position_name LIKE 'Juru-Xray%' OR
    job_position_name LIKE 'Pembantu Perawatan%' OR
    job_position_name LIKE 'Jururawat Masyarakat%' OR
    job_position_name LIKE 'Pembantu Pemberdahan%' OR
    job_position_name LIKE 'Doktor%' OR
    job_position_name LIKE 'Pegawai Kesihatan%' OR
    job_position_name LIKE 'Pembantu Perubatan%' OR
    job_position_name LIKE 'Pembantu Kesihatan%'
  );

-- Step 4: Update Non-Clinical positions
UPDATE profiles 
SET category = 'Non-Clinical', updated_at = NOW()
WHERE category IS NULL 
  AND (
    -- Exact matches
    job_position_name IN (
        'Penolong Pegawai Tadbir',
        'Pembantu Khidmat Am',
        'Pembantu Tadbir',
        'Penolong Jurutera',
        'Pembantu Penyediaan Makanan',
        'Pegawai Tadbir',
        'Pembantu Pentadbiran',
        'Pembantu Kewangan',
        'Pembantu Stor',
        'Pembantu Teknikal',
        'Pembantu Makmal',
        'Pembantu Perpustakaan',
        'Pembantu Klinik',
        'Pembantu Am'
    )
    OR
    -- Pattern matches
    job_position_name LIKE 'Penolong Pegawai Tadbir%' OR
    job_position_name LIKE 'Pembantu Khidmat Am%' OR
    job_position_name LIKE 'Pembantu Tadbir%' OR
    job_position_name LIKE 'Penolong Jurutera%' OR
    job_position_name LIKE 'Pembantu Penyediaan%' OR
    job_position_name LIKE 'Pegawai Tadbir%' OR
    job_position_name LIKE 'Pembantu Pentadbiran%' OR
    job_position_name LIKE 'Pembantu Kewangan%' OR
    job_position_name LIKE 'Pembantu Stor%' OR
    job_position_name LIKE 'Pembantu Teknikal%' OR
    job_position_name LIKE 'Pembantu Makmal%' OR
    job_position_name LIKE 'Pembantu Perpustakaan%' OR
    job_position_name LIKE 'Pembantu Klinik%' OR
    job_position_name LIKE 'Pembantu Am%'
  );

-- Step 5: Set any remaining NULL as Non-Clinical (fallback)
UPDATE profiles 
SET category = 'Non-Clinical', updated_at = NOW()
WHERE category IS NULL;

-- Step 6: Verify the fix worked
SELECT 
    'AFTER FIX' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;

-- Step 7: Show sample of updated profiles
SELECT 
    name,
    job_position_name,
    category,
    created_at
FROM profiles 
WHERE category IS NOT NULL
ORDER BY updated_at DESC 
LIMIT 10;

-- Step 8: Create/Update the trigger to prevent future NULL categories
CREATE OR REPLACE FUNCTION set_profile_category_auto()
RETURNS TRIGGER AS $$
DECLARE
    job_category VARCHAR(50);
BEGIN
    -- If job_position_name is provided, determine category based on patterns
    IF NEW.job_position_name IS NOT NULL THEN
        -- Check for Clinical patterns
        IF (NEW.job_position_name LIKE 'Jururawat%' OR
            NEW.job_position_name LIKE 'Pegawai Perubatan%' OR
            NEW.job_position_name LIKE 'Pegawai Farmasi%' OR
            NEW.job_position_name LIKE 'Pegawai Pergigian%' OR
            NEW.job_position_name LIKE 'Penolong Pegawai Perubatan%' OR
            NEW.job_position_name LIKE 'Penolong Pegawai Farmasi%' OR
            NEW.job_position_name LIKE 'Juruteknologi%' OR
            NEW.job_position_name LIKE 'Jurupulih%' OR
            NEW.job_position_name LIKE 'Juru-Xray%' OR
            NEW.job_position_name LIKE 'Pembantu Perawatan%' OR
            NEW.job_position_name LIKE 'Jururawat Masyarakat%' OR
            NEW.job_position_name LIKE 'Pembantu Pemberdahan%' OR
            NEW.job_position_name LIKE 'Doktor%' OR
            NEW.job_position_name LIKE 'Pegawai Kesihatan%' OR
            NEW.job_position_name LIKE 'Pembantu Perubatan%' OR
            NEW.job_position_name LIKE 'Pembantu Kesihatan%' OR
            NEW.job_position_name IN (
                'Jurupulih Fisioterapi',
                'Jururawat', 
                'Pegawai Perubatan',
                'Pegawai Farmasi',
                'Pegawai Pergigian',
                'Penolong Pegawai Perubatan',
                'Penolong Pegawai Farmasi',
                'Juruteknologi Makmal Perubatan',
                'Jurupulih Perubatan Carakerja',
                'Juru-Xray',
                'Pembantu Perawatan Kesihatan',
                'Jururawat Masyarakat',
                'Pembantu Pemberdahan Pergigian',
                'Doktor',
                'Pegawai Kesihatan',
                'Pembantu Perubatan',
                'Pembantu Kesihatan'
            )) THEN
            NEW.category := 'Clinical';
        -- Check for Non-Clinical patterns
        ELSIF (NEW.job_position_name LIKE 'Penolong Pegawai Tadbir%' OR
               NEW.job_position_name LIKE 'Pembantu Khidmat Am%' OR
               NEW.job_position_name LIKE 'Pembantu Tadbir%' OR
               NEW.job_position_name LIKE 'Penolong Jurutera%' OR
               NEW.job_position_name LIKE 'Pembantu Penyediaan%' OR
               NEW.job_position_name LIKE 'Pegawai Tadbir%' OR
               NEW.job_position_name LIKE 'Pembantu Pentadbiran%' OR
               NEW.job_position_name LIKE 'Pembantu Kewangan%' OR
               NEW.job_position_name LIKE 'Pembantu Stor%' OR
               NEW.job_position_name LIKE 'Pembantu Teknikal%' OR
               NEW.job_position_name LIKE 'Pembantu Makmal%' OR
               NEW.job_position_name LIKE 'Pembantu Perpustakaan%' OR
               NEW.job_position_name LIKE 'Pembantu Klinik%' OR
               NEW.job_position_name LIKE 'Pembantu Am%' OR
               NEW.job_position_name IN (
                   'Penolong Pegawai Tadbir',
                   'Pembantu Khidmat Am',
                   'Pembantu Tadbir',
                   'Penolong Jurutera',
                   'Pembantu Penyediaan Makanan',
                   'Pegawai Tadbir',
                   'Pembantu Pentadbiran',
                   'Pembantu Kewangan',
                   'Pembantu Stor',
                   'Pembantu Teknikal',
                   'Pembantu Makmal',
                   'Pembantu Perpustakaan',
                   'Pembantu Klinik',
                   'Pembantu Am'
               )) THEN
            NEW.category := 'Non-Clinical';
        ELSE
            -- Default to Non-Clinical for unknown positions
            NEW.category := 'Non-Clinical';
        END IF;
    ELSE
        -- If no job position, set to NULL
        NEW.category := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_profile_category_on_insert ON profiles;
DROP TRIGGER IF EXISTS set_profile_category_on_update ON profiles;

-- Create trigger for INSERT operations
CREATE TRIGGER set_profile_category_on_insert
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_profile_category_auto();

-- Create trigger for UPDATE operations
CREATE TRIGGER set_profile_category_on_update
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_profile_category_auto();

-- Final verification
SELECT 
    'FINAL RESULT' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
    COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
FROM profiles;
