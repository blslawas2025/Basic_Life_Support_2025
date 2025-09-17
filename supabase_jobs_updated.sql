-- Updated jobs table structure with grades and code prefixes
-- This replaces the previous job_positions table with a more comprehensive structure

-- Drop the old table if it exists
DROP TABLE IF EXISTS job_positions CASCADE;

-- Create the new jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    code_prefix VARCHAR(10) NOT NULL,
    grades JSONB NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Clinical', 'Non-Clinical')),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the job data with grades and code prefixes
INSERT INTO jobs (name, code_prefix, grades, category, notes) VALUES
-- Clinical Officers
('Pegawai Perubatan', 'UD', '["UD9","UD10","UD12","UD13","UD14","UD15"]', 'Clinical', 'UD15 = pakar'),
('Pegawai Farmasi', 'UF', '["UF9","UF10","UF12","UF13","UF14"]', 'Clinical', null),
('Pegawai Pergigian', 'UG', '["UG9","UG10","UG12","UG13","UG14","UG15"]', 'Clinical', 'UG15 = pakar'),

-- Allied Health (Clinical)
('Penolong Pegawai Perubatan', 'U', '["U5","U6","U7","U9","U10","U12","U13","U14"]', 'Clinical', null),
('Jururawat', 'U', '["U5","U6","U7","U9","U10","U12","U13","U14"]', 'Clinical', null),
('Penolong Pegawai Farmasi', 'U', '["U5","U6","U7","U8"]', 'Clinical', null),
('Juruteknologi Makmal Perubatan', 'U', '["U5","U6","U7","U8"]', 'Clinical', null),
('Jurupulih Perubatan Carakerja', 'U', '["U5","U6","U7","U8"]', 'Clinical', null),
('Jurupulih Fisioterapi', 'U', '["U5","U6","U7","U8"]', 'Clinical', null),
('Juru-Xray', 'U', '["U5","U6","U7","U9","U10","U12","U13","U14"]', 'Clinical', 'Diagnostik/Pengimejan'),
('Pembantu Perawatan Kesihatan', 'U', '["U1","U2","U3","U4"]', 'Clinical', null),
('Jururawat Masyarakat', 'U', '["U1","U2","U3","U4"]', 'Clinical', null),
('Pembantu Pembedahan Pergigian', 'U', '["U1","U2","U3","U4"]', 'Clinical', null),

-- Non-Clinical / Support
('Penolong Pegawai Tadbir', 'N', '["N5","N6","N7","N8"]', 'Non-Clinical', null),
('Pembantu Tadbir', 'N', '["N1","N2","N3","N4"]', 'Non-Clinical', 'Perkeranian/Operasi'),
('Pembantu Khidmat Am', 'H', '["H1","H2","H3","H4"]', 'Non-Clinical', null),
('Penolong Jurutera', 'JA', '["JA5","JA6","JA7","JA8"]', 'Non-Clinical', null),
('Pembantu Penyediaan Makanan', 'N', '["N1","N2","N3","N4"]', 'Non-Clinical', null)
ON CONFLICT (name) DO UPDATE
SET code_prefix = excluded.code_prefix,
    grades = excluded.grades,
    category = excluded.category,
    notes = excluded.notes;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_name ON jobs(name);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_code_prefix ON jobs(code_prefix);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_grades ON jobs USING GIN(grades);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
DROP POLICY IF EXISTS "Allow authenticated users to read jobs" ON jobs;
CREATE POLICY "Allow authenticated users to read jobs" ON jobs
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to insert jobs" ON jobs;
CREATE POLICY "Allow authenticated users to insert jobs" ON jobs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to update jobs" ON jobs;
CREATE POLICY "Allow authenticated users to update jobs" ON jobs
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to delete jobs" ON jobs;
CREATE POLICY "Allow authenticated users to delete jobs" ON jobs
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create a view for easy querying of job grades
DROP VIEW IF EXISTS job_grades_view;
CREATE VIEW job_grades_view AS
SELECT 
    id,
    name,
    code_prefix,
    category,
    notes,
    is_active,
    jsonb_array_elements_text(grades) as grade,
    created_at,
    updated_at
FROM jobs
WHERE is_active = true;

-- Create a function to get jobs by grade
CREATE OR REPLACE FUNCTION get_jobs_by_grade(target_grade TEXT)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    code_prefix VARCHAR(10),
    category VARCHAR(50),
    notes TEXT,
    grade TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.name,
        j.code_prefix,
        j.category,
        j.notes,
        jsonb_array_elements_text(j.grades)::TEXT as grade
    FROM jobs j
    WHERE j.is_active = true 
    AND j.grades ? target_grade;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get jobs by category
CREATE OR REPLACE FUNCTION get_jobs_by_category(target_category TEXT)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    code_prefix VARCHAR(10),
    grades JSONB,
    category VARCHAR(50),
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.name,
        j.code_prefix,
        j.grades,
        j.category,
        j.notes
    FROM jobs j
    WHERE j.is_active = true 
    AND j.category = target_category
    ORDER BY j.name;
END;
$$ LANGUAGE plpgsql;

-- Create a function to change job category
CREATE OR REPLACE FUNCTION change_job_category(
    job_id UUID,
    new_category TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validate category
    IF new_category NOT IN ('Clinical', 'Non-Clinical') THEN
        RAISE EXCEPTION 'Invalid category. Must be either Clinical or Non-Clinical';
    END IF;
    
    -- Update the job category
    UPDATE jobs 
    SET category = new_category, updated_at = NOW()
    WHERE id = job_id AND is_active = true;
    
    -- Return true if a row was updated
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get all available categories
CREATE OR REPLACE FUNCTION get_available_categories()
RETURNS TABLE (category VARCHAR(50), job_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.category,
        COUNT(*) as job_count
    FROM jobs j
    WHERE j.is_active = true
    GROUP BY j.category
    ORDER BY j.category;
END;
$$ LANGUAGE plpgsql;

-- Create a function to bulk change categories
CREATE OR REPLACE FUNCTION bulk_change_job_categories(
    job_ids UUID[],
    new_category TEXT
)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Validate category
    IF new_category NOT IN ('Clinical', 'Non-Clinical') THEN
        RAISE EXCEPTION 'Invalid category. Must be either Clinical or Non-Clinical';
    END IF;
    
    -- Update multiple jobs
    UPDATE jobs 
    SET category = new_category, updated_at = NOW()
    WHERE id = ANY(job_ids) AND is_active = true;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
