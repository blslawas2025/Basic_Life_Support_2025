-- Create question_pool_assignments table
-- This table stores which question pools are assigned to which test types

CREATE TABLE IF NOT EXISTS question_pool_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    test_type VARCHAR(20) NOT NULL UNIQUE, -- 'pre_test' or 'post_test'
    pool_id VARCHAR(255) NOT NULL, -- Store pool ID as string since pools are generated dynamically
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_question_pool_assignments_test_type ON question_pool_assignments(test_type);

-- Add RLS (Row Level Security) policies
ALTER TABLE question_pool_assignments ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read pool assignments
CREATE POLICY "Allow authenticated users to read pool assignments" ON question_pool_assignments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow only admins and super admins to modify pool assignments
CREATE POLICY "Allow admins to modify pool assignments" ON question_pool_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.roles IN ('admin', 'super_admin')
        )
    );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_question_pool_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_question_pool_assignments_updated_at
    BEFORE UPDATE ON question_pool_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_question_pool_assignments_updated_at();
