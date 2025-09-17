-- Create job_positions table in Supabase
-- This table stores all the healthcare job positions for the Basic Life Support system

CREATE TABLE IF NOT EXISTS job_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    position_name VARCHAR(255) NOT NULL UNIQUE,
    position_code VARCHAR(50) UNIQUE,
    category VARCHAR(100),
    level VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the job positions data
INSERT INTO job_positions (position_name, position_code, category, level, description) VALUES
('Pegawai Perubatan', 'PP', 'Medical', 'Professional', 'Medical Officer responsible for medical care and treatment'),
('Pegawai Farmasi', 'PF', 'Pharmacy', 'Professional', 'Pharmacy Officer responsible for medication management'),
('Penolong Pegawai Perubatan', 'PPP', 'Medical', 'Assistant', 'Assistant Medical Officer supporting medical operations'),
('Jururawat', 'JR', 'Nursing', 'Professional', 'Nurse responsible for patient care and medical assistance'),
('Penolong Pegawai Farmasi', 'PPF', 'Pharmacy', 'Assistant', 'Assistant Pharmacy Officer supporting pharmacy operations'),
('Juruteknologi Makmal Perubatan', 'JMP', 'Laboratory', 'Technical', 'Medical Laboratory Technologist for diagnostic testing'),
('Jurupulih Perubatan Carakerja', 'JPC', 'Rehabilitation', 'Professional', 'Occupational Therapist for patient rehabilitation'),
('Jurupulih Fisioterapi', 'JPF', 'Rehabilitation', 'Professional', 'Physiotherapist for physical therapy and rehabilitation'),
('Juru-Xray', 'JX', 'Radiology', 'Technical', 'X-ray Technician for medical imaging'),
('Penolong Pegawai Tadbir', 'PPT', 'Administration', 'Assistant', 'Assistant Administrative Officer for administrative support'),
('Pembantu Khidmat Am', 'PKA', 'General Services', 'Support', 'General Services Assistant for facility maintenance'),
('Pembantu Perawatan Kesihatan', 'PPK', 'Healthcare', 'Support', 'Healthcare Assistant for patient care support'),
('Pembantu Tadbir', 'PT', 'Administration', 'Support', 'Administrative Assistant for clerical support'),
('Jururawat Masyarakat', 'JM', 'Community Health', 'Professional', 'Community Health Nurse for public health services'),
('Penolong Jurutera', 'PJ', 'Engineering', 'Assistant', 'Assistant Engineer for technical support'),
('Pembantu Penyediaan Makanan', 'PPM', 'Food Services', 'Support', 'Food Preparation Assistant for dietary services'),
('Pegawai Pergigian', 'PPG', 'Dental', 'Professional', 'Dental Officer for oral healthcare'),
('Pembantu Pemberdahan Pergigian', 'PPP2', 'Dental', 'Support', 'Dental Assistant for dental procedure support');

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_job_positions_name ON job_positions(position_name);
CREATE INDEX IF NOT EXISTS idx_job_positions_category ON job_positions(category);
CREATE INDEX IF NOT EXISTS idx_job_positions_active ON job_positions(is_active);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_job_positions_updated_at 
    BEFORE UPDATE ON job_positions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all authenticated users to read job positions
CREATE POLICY "Allow authenticated users to read job positions" ON job_positions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create a policy that allows only authenticated users to insert job positions
CREATE POLICY "Allow authenticated users to insert job positions" ON job_positions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create a policy that allows only authenticated users to update job positions
CREATE POLICY "Allow authenticated users to update job positions" ON job_positions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create a policy that allows only authenticated users to delete job positions
CREATE POLICY "Allow authenticated users to delete job positions" ON job_positions
    FOR DELETE USING (auth.role() = 'authenticated');
