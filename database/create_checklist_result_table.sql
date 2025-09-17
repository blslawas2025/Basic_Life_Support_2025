-- Create checklist_result table to store submitted checklist assessments
-- This table will store all One Man CPR checklist submissions with detailed results

CREATE TABLE IF NOT EXISTS checklist_result (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Participant Information
    participant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    participant_email TEXT,
    participant_ic_number TEXT,
    participant_phone_number TEXT,
    participant_job_position TEXT,
    participant_category TEXT,
    participant_workplace TEXT,
    participant_pregnancy_status BOOLEAN DEFAULT FALSE,
    participant_pregnancy_weeks INTEGER,
    participant_allergies BOOLEAN DEFAULT FALSE,
    participant_allergies_description TEXT,
    participant_asthma_status BOOLEAN DEFAULT FALSE,
    
    -- Checklist Information
    checklist_type TEXT NOT NULL, -- 'one man cpr', 'two man cpr', etc.
    checklist_version TEXT DEFAULT '1.0',
    
    -- Assessment Results
    total_items INTEGER NOT NULL,
    completed_items INTEGER NOT NULL,
    completion_percentage DECIMAL(5,2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('INCOMPLETE', 'FAIL', 'PASS')),
    can_pass BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Compulsory Sections Status
    airway_completed BOOLEAN NOT NULL DEFAULT FALSE,
    breathing_completed BOOLEAN NOT NULL DEFAULT FALSE,
    circulation_completed BOOLEAN NOT NULL DEFAULT FALSE,
    all_compulsory_completed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Detailed Section Results (JSONB for flexibility)
    section_results JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Structure: [{"section": "airway", "completed": true, "items": [{"id": 1, "item": "Check responsiveness", "completed": true, "is_compulsory": true}]}]
    
    -- Instructor Information
    instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    instructor_name TEXT,
    instructor_comments TEXT,
    
    -- Submission Details
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submission_ip INET,
    submission_device_info TEXT,
    
    -- Assessment Duration
    assessment_duration_seconds INTEGER,
    time_started TIMESTAMP WITH TIME ZONE,
    time_completed TIMESTAMP WITH TIME ZONE,
    
    -- Additional Metadata
    assessment_notes TEXT,
    retake_count INTEGER DEFAULT 0,
    is_retake BOOLEAN DEFAULT FALSE,
    previous_assessment_id UUID REFERENCES checklist_result(id) ON DELETE SET NULL,
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Soft Delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    deletion_reason TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_checklist_result_participant_id ON checklist_result(participant_id);
CREATE INDEX IF NOT EXISTS idx_checklist_result_checklist_type ON checklist_result(checklist_type);
CREATE INDEX IF NOT EXISTS idx_checklist_result_status ON checklist_result(status);
CREATE INDEX IF NOT EXISTS idx_checklist_result_submitted_at ON checklist_result(submitted_at);
CREATE INDEX IF NOT EXISTS idx_checklist_result_instructor_id ON checklist_result(instructor_id);
CREATE INDEX IF NOT EXISTS idx_checklist_result_can_pass ON checklist_result(can_pass);
CREATE INDEX IF NOT EXISTS idx_checklist_result_is_deleted ON checklist_result(is_deleted);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_checklist_result_participant_type ON checklist_result(participant_id, checklist_type);
CREATE INDEX IF NOT EXISTS idx_checklist_result_type_status ON checklist_result(checklist_type, status);
CREATE INDEX IF NOT EXISTS idx_checklist_result_participant_submitted ON checklist_result(participant_id, submitted_at DESC);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_checklist_result_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_checklist_result_updated_at
    BEFORE UPDATE ON checklist_result
    FOR EACH ROW
    EXECUTE FUNCTION update_checklist_result_updated_at();

-- Create a function to calculate completion percentage
CREATE OR REPLACE FUNCTION calculate_completion_percentage(completed INTEGER, total INTEGER)
RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF total = 0 THEN
        RETURN 0.00;
    END IF;
    RETURN ROUND((completed::DECIMAL / total::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Create a function to determine assessment status
CREATE OR REPLACE FUNCTION determine_assessment_status(
    completed_items INTEGER,
    total_items INTEGER,
    airway_completed BOOLEAN,
    breathing_completed BOOLEAN,
    circulation_completed BOOLEAN
)
RETURNS TEXT AS $$
BEGIN
    -- If no items completed, status is INCOMPLETE
    IF completed_items = 0 THEN
        RETURN 'INCOMPLETE';
    END IF;
    
    -- If all compulsory sections completed, status is PASS
    IF airway_completed AND breathing_completed AND circulation_completed THEN
        RETURN 'PASS';
    END IF;
    
    -- If some items completed but not all compulsory sections, status is FAIL
    RETURN 'FAIL';
END;
$$ LANGUAGE plpgsql;

-- Create a function to validate checklist result data
CREATE OR REPLACE FUNCTION validate_checklist_result()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate completion percentage
    NEW.completion_percentage := calculate_completion_percentage(NEW.completed_items, NEW.total_items);
    
    -- Validate status
    NEW.status := determine_assessment_status(
        NEW.completed_items,
        NEW.total_items,
        NEW.airway_completed,
        NEW.breathing_completed,
        NEW.circulation_completed
    );
    
    -- Validate can_pass
    NEW.can_pass := (NEW.airway_completed AND NEW.breathing_completed AND NEW.circulation_completed);
    NEW.all_compulsory_completed := NEW.can_pass;
    
    -- Validate completed_items doesn't exceed total_items
    IF NEW.completed_items > NEW.total_items THEN
        RAISE EXCEPTION 'completed_items cannot exceed total_items';
    END IF;
    
    -- Validate completion_percentage is between 0 and 100
    IF NEW.completion_percentage < 0 OR NEW.completion_percentage > 100 THEN
        RAISE EXCEPTION 'completion_percentage must be between 0 and 100';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate data before insert/update
CREATE TRIGGER trigger_validate_checklist_result
    BEFORE INSERT OR UPDATE ON checklist_result
    FOR EACH ROW
    EXECUTE FUNCTION validate_checklist_result();

-- Create a view for easy querying of checklist results
CREATE OR REPLACE VIEW checklist_result_summary AS
SELECT 
    cr.id,
    cr.participant_id,
    cr.participant_name,
    cr.participant_email,
    cr.participant_job_position,
    cr.participant_category,
    cr.checklist_type,
    cr.total_items,
    cr.completed_items,
    cr.completion_percentage,
    cr.status,
    cr.can_pass,
    cr.airway_completed,
    cr.breathing_completed,
    cr.circulation_completed,
    cr.instructor_name,
    cr.instructor_comments,
    cr.submitted_at,
    cr.assessment_duration_seconds,
    cr.retake_count,
    cr.is_retake,
    p.name as participant_full_name,
    p.email as participant_email_address,
    p.ic_number as participant_ic,
    p.phone_number as participant_phone,
    p.job_position_name as participant_job_title,
    p.category as participant_category_name,
    p.tempat_bertugas as participant_workplace_name
FROM checklist_result cr
LEFT JOIN profiles p ON cr.participant_id = p.id
WHERE cr.is_deleted = FALSE;

-- Create a view for statistics
CREATE OR REPLACE VIEW checklist_result_stats AS
SELECT 
    checklist_type,
    COUNT(*) as total_assessments,
    COUNT(CASE WHEN status = 'PASS' THEN 1 END) as pass_count,
    COUNT(CASE WHEN status = 'FAIL' THEN 1 END) as fail_count,
    COUNT(CASE WHEN status = 'INCOMPLETE' THEN 1 END) as incomplete_count,
    ROUND(AVG(completion_percentage), 2) as avg_completion_percentage,
    ROUND(AVG(assessment_duration_seconds), 2) as avg_duration_seconds,
    COUNT(CASE WHEN can_pass = TRUE THEN 1 END) as total_passes,
    ROUND((COUNT(CASE WHEN can_pass = TRUE THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2) as pass_rate
FROM checklist_result
WHERE is_deleted = FALSE
GROUP BY checklist_type;

-- Insert sample data for testing (optional)
-- INSERT INTO checklist_result (
--     participant_id,
--     participant_name,
--     participant_email,
--     checklist_type,
--     total_items,
--     completed_items,
--     completion_percentage,
--     status,
--     can_pass,
--     airway_completed,
--     breathing_completed,
--     circulation_completed,
--     all_compulsory_completed,
--     section_results,
--     instructor_comments,
--     submitted_at
-- ) VALUES (
--     '00000000-0000-0000-0000-000000000000', -- Replace with actual participant ID
--     'Test Participant',
--     'test@example.com',
--     'one man cpr',
--     22,
--     22,
--     100.00,
--     'PASS',
--     TRUE,
--     TRUE,
--     TRUE,
--     TRUE,
--     TRUE,
--     '[{"section": "danger", "completed": true, "items": [{"id": 1, "item": "Check for danger", "completed": true, "is_compulsory": false}]}]'::jsonb,
--     'Excellent performance!',
--     NOW()
-- );

-- Grant permissions (adjust as needed for your security requirements)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON checklist_result TO authenticated;
-- GRANT SELECT ON checklist_result_summary TO authenticated;
-- GRANT SELECT ON checklist_result_stats TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE checklist_result IS 'Stores submitted checklist assessment results with detailed participant and instructor information';
COMMENT ON COLUMN checklist_result.participant_id IS 'Reference to the participant profile';
COMMENT ON COLUMN checklist_result.checklist_type IS 'Type of checklist (e.g., one man cpr, two man cpr)';
COMMENT ON COLUMN checklist_result.status IS 'Assessment status: INCOMPLETE, FAIL, or PASS';
COMMENT ON COLUMN checklist_result.section_results IS 'Detailed results for each section in JSON format';
COMMENT ON COLUMN checklist_result.assessment_duration_seconds IS 'Time taken to complete the assessment in seconds';
COMMENT ON COLUMN checklist_result.retake_count IS 'Number of times this participant has retaken this checklist type';
COMMENT ON COLUMN checklist_result.is_retake IS 'Whether this is a retake of a previous assessment';
