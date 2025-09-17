-- Sync Questions and Test Submissions Tables
-- This script ensures proper synchronization between questions and test_submissions tables
-- Run this in your Supabase SQL Editor

-- ==============================================
-- 1. ENSURE QUESTIONS TABLE EXISTS AND IS PROPERLY STRUCTURED
-- ==============================================

-- Create questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Question content (bilingual support)
    question_text TEXT NOT NULL,
    question_text_en TEXT,
    
    -- Question metadata
    question_type VARCHAR(50) DEFAULT 'multiple_choice',
    difficulty_level VARCHAR(20) DEFAULT 'easy',
    category VARCHAR(100) DEFAULT 'basic_life_support',
    points INTEGER DEFAULT 10,
    time_limit_seconds INTEGER DEFAULT 30,
    
    -- Correct answer and options (bilingual support)
    correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    option_a TEXT,
    option_a_en TEXT,
    option_b TEXT,
    option_b_en TEXT,
    option_c TEXT,
    option_c_en TEXT,
    option_d TEXT,
    option_d_en TEXT,
    
    -- Additional fields
    explanation TEXT,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[],
    test_type VARCHAR(20) DEFAULT 'pre_test' CHECK (test_type IN ('pre_test', 'post_test')),
    
    -- Course session relationship
    course_session_id UUID,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- ==============================================
-- 2. ENSURE TEST_SUBMISSIONS TABLE EXISTS AND IS PROPERLY STRUCTURED
-- ==============================================

-- Create test_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS test_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User Information (from profiles table)
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    ic_number VARCHAR(14),
    job_position_name VARCHAR(255),
    job_category VARCHAR(50), -- 'Clinical' or 'Non-Clinical'
    
    -- Test Information
    test_type VARCHAR(20) NOT NULL CHECK (test_type IN ('pre_test', 'post_test')),
    course_session_id UUID,
    
    -- Test Results
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 30,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    time_taken_seconds INTEGER NOT NULL DEFAULT 0,
    
    -- Submission Details
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_completed BOOLEAN DEFAULT TRUE,
    attempt_number INTEGER DEFAULT 1,
    
    -- Retake Policy
    can_retake BOOLEAN DEFAULT FALSE,
    retake_available_after TIMESTAMP WITH TIME ZONE,
    
    -- Results Management
    results_released BOOLEAN DEFAULT TRUE,
    results_released_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- System Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_score CHECK (score >= 0 AND score <= total_questions),
    CONSTRAINT valid_correct_answers CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
    CONSTRAINT valid_time CHECK (time_taken_seconds >= 0),
    CONSTRAINT valid_attempt CHECK (attempt_number > 0)
);

-- ==============================================
-- 3. CREATE QUESTION_ANSWERS TABLE FOR DETAILED TRACKING
-- ==============================================

-- Create question_answers table to track individual question responses
CREATE TABLE IF NOT EXISTS question_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES test_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_answer VARCHAR(1) CHECK (user_answer IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one answer per question per submission
    UNIQUE(submission_id, question_id)
);

-- ==============================================
-- 4. ADD FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Add foreign key constraint to test_submissions if profiles table exists
DO $$ 
BEGIN
    -- Check if profiles table exists and has id column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id') THEN
        -- Add foreign key constraint to test_submissions
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_test_submissions_user_id'
        ) THEN
            ALTER TABLE test_submissions 
            ADD CONSTRAINT fk_test_submissions_user_id 
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
        END IF;
        
        RAISE NOTICE 'Foreign key constraint added to test_submissions';
    ELSE
        RAISE NOTICE 'Profiles table not found - skipping foreign key constraint';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
END $$;

-- ==============================================
-- 5. CREATE INDEXES FOR BETTER PERFORMANCE
-- ==============================================

-- Questions table indexes
CREATE INDEX IF NOT EXISTS idx_questions_test_type ON questions(test_type);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_course_session ON questions(course_session_id);

-- Test submissions indexes
CREATE INDEX IF NOT EXISTS idx_test_submissions_user_id ON test_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_test_type ON test_submissions(test_type);
CREATE INDEX IF NOT EXISTS idx_test_submissions_submitted_at ON test_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_test_submissions_course_session ON test_submissions(course_session_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_job_category ON test_submissions(job_category);
CREATE INDEX IF NOT EXISTS idx_test_submissions_score ON test_submissions(score);

-- Question answers indexes
CREATE INDEX IF NOT EXISTS idx_question_answers_submission_id ON question_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_question_id ON question_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_is_correct ON question_answers(is_correct);

-- ==============================================
-- 6. CREATE SYNCHRONIZATION FUNCTIONS
-- ==============================================

-- Function to validate test submission against questions
CREATE OR REPLACE FUNCTION validate_test_submission(
    p_user_id UUID,
    p_test_type VARCHAR(20),
    p_answers JSONB
) RETURNS TABLE (
    is_valid BOOLEAN,
    total_questions INTEGER,
    correct_answers INTEGER,
    score INTEGER,
    errors TEXT[]
) AS $$
DECLARE
    question_count INTEGER;
    correct_count INTEGER := 0;
    error_list TEXT[] := '{}';
    answer_record RECORD;
    question_record RECORD;
BEGIN
    -- Get total questions for this test type
    SELECT COUNT(*) INTO question_count
    FROM questions 
    WHERE test_type = p_test_type AND is_active = true;
    
    -- Validate each answer
    FOR answer_record IN 
        SELECT key as question_id, value as user_answer
        FROM jsonb_each_text(p_answers)
    LOOP
        -- Get question details
        SELECT * INTO question_record
        FROM questions 
        WHERE id = answer_record.question_id::UUID;
        
        -- Check if question exists and is active
        IF question_record.id IS NULL THEN
            error_list := array_append(error_list, 'Question ' || answer_record.question_id || ' not found');
        ELSIF NOT question_record.is_active THEN
            error_list := array_append(error_list, 'Question ' || answer_record.question_id || ' is not active');
        ELSIF question_record.test_type != p_test_type THEN
            error_list := array_append(error_list, 'Question ' || answer_record.question_id || ' is not for ' || p_test_type);
        ELSE
            -- Check if answer is correct
            IF answer_record.user_answer = question_record.correct_answer THEN
                correct_count := correct_count + 1;
            END IF;
        END IF;
    END LOOP;
    
    -- Calculate score
    score := correct_count;
    
    -- Return validation results
    RETURN QUERY SELECT 
        array_length(error_list, 1) IS NULL OR array_length(error_list, 1) = 0 as is_valid,
        question_count as total_questions,
        correct_count as correct_answers,
        score as score,
        error_list as errors;
END;
$$ LANGUAGE plpgsql;

-- Function to create test submission with detailed answers
CREATE OR REPLACE FUNCTION create_test_submission_with_answers(
    p_user_id UUID,
    p_test_type VARCHAR(20),
    p_answers JSONB,
    p_time_taken_seconds INTEGER,
    p_course_session_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    submission_id UUID;
    validation_result RECORD;
    answer_record RECORD;
    question_record RECORD;
BEGIN
    -- Validate the submission
    SELECT * INTO validation_result
    FROM validate_test_submission(p_user_id, p_test_type, p_answers);
    
    -- Check if validation passed
    IF NOT validation_result.is_valid THEN
        RAISE EXCEPTION 'Invalid test submission: %', array_to_string(validation_result.errors, ', ');
    END IF;
    
    -- Get user profile information
    DECLARE
        user_profile RECORD;
    BEGIN
        SELECT name, email, ic_number, job_position_name, job_position_id
        INTO user_profile
        FROM profiles 
        WHERE id = p_user_id;
        
        IF user_profile IS NULL THEN
            RAISE EXCEPTION 'User profile not found';
        END IF;
        
        -- Get job category
        DECLARE
            job_category VARCHAR(50) := 'Non-Clinical';
        BEGIN
            IF user_profile.job_position_id IS NOT NULL THEN
                SELECT category INTO job_category
                FROM jobs 
                WHERE id = user_profile.job_position_id;
            END IF;
            
            -- Create test submission
            INSERT INTO test_submissions (
                user_id, user_name, user_email, ic_number, job_position_name, job_category,
                test_type, course_session_id, score, total_questions, correct_answers, time_taken_seconds
            ) VALUES (
                p_user_id, user_profile.name, user_profile.email, user_profile.ic_number, 
                user_profile.job_position_name, job_category, p_test_type, p_course_session_id,
                validation_result.score, validation_result.total_questions, validation_result.correct_answers, 
                p_time_taken_seconds
            ) RETURNING id INTO submission_id;
        END;
    END;
    
    -- Insert detailed answers
    FOR answer_record IN 
        SELECT key as question_id, value as user_answer
        FROM jsonb_each_text(p_answers)
    LOOP
        -- Get question details
        SELECT * INTO question_record
        FROM questions 
        WHERE id = answer_record.question_id::UUID;
        
        -- Insert answer record
        INSERT INTO question_answers (
            submission_id, question_id, user_answer, is_correct, time_spent_seconds
        ) VALUES (
            submission_id, 
            answer_record.question_id::UUID, 
            answer_record.user_answer,
            answer_record.user_answer = question_record.correct_answer,
            0 -- Time spent can be tracked separately if needed
        );
    END LOOP;
    
    RETURN submission_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 7. CREATE ANALYTICS VIEWS
-- ==============================================

-- Create comprehensive analytics view
CREATE OR REPLACE VIEW test_analytics_detailed AS
SELECT 
    ts.id as submission_id,
    ts.user_id,
    ts.user_name,
    ts.user_email,
    ts.ic_number,
    ts.job_position_name,
    ts.job_category,
    ts.test_type,
    ts.score,
    ts.total_questions,
    ts.correct_answers,
    ts.time_taken_seconds,
    ts.submitted_at,
    ts.attempt_number,
    
    -- Calculate percentage score
    ROUND((ts.score::DECIMAL / ts.total_questions * 100), 2) as percentage_score,
    
    -- Pass/Fail status based on job category
    CASE 
        WHEN ts.job_category = 'Clinical' AND ts.score >= 25 THEN 'PASS'
        WHEN ts.job_category != 'Clinical' AND ts.score >= 20 THEN 'PASS'
        ELSE 'FAIL'
    END as pass_status,
    
    -- Question-level details
    COUNT(qa.id) as questions_answered,
    COUNT(CASE WHEN qa.is_correct THEN 1 END) as questions_correct,
    ROUND(AVG(CASE WHEN qa.is_correct THEN 1.0 ELSE 0.0 END) * 100, 2) as accuracy_percentage

FROM test_submissions ts
LEFT JOIN question_answers qa ON ts.id = qa.submission_id
GROUP BY ts.id, ts.user_id, ts.user_name, ts.user_email, ts.ic_number, 
         ts.job_position_name, ts.job_category, ts.test_type, ts.score, 
         ts.total_questions, ts.correct_answers, ts.time_taken_seconds, 
         ts.submitted_at, ts.attempt_number;

-- ==============================================
-- 8. GRANT PERMISSIONS
-- ==============================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON test_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON question_answers TO authenticated;
GRANT SELECT ON test_analytics_detailed TO authenticated;
GRANT EXECUTE ON FUNCTION validate_test_submission(UUID, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_test_submission_with_answers(UUID, VARCHAR, JSONB, INTEGER, UUID) TO authenticated;

-- ==============================================
-- 9. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ==============================================

-- Update timestamp trigger for questions
CREATE OR REPLACE FUNCTION update_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_questions_updated_at();

-- Update timestamp trigger for test_submissions
CREATE OR REPLACE FUNCTION update_test_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_test_submissions_updated_at
    BEFORE UPDATE ON test_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_test_submissions_updated_at();

-- ==============================================
-- 10. VERIFICATION QUERIES
-- ==============================================

-- Verify tables exist and have correct structure
SELECT 'Tables created successfully' as status;

-- Check questions table
SELECT 
    'questions' as table_name,
    COUNT(*) as total_questions,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_questions,
    COUNT(CASE WHEN test_type = 'pre_test' THEN 1 END) as pre_test_questions,
    COUNT(CASE WHEN test_type = 'post_test' THEN 1 END) as post_test_questions
FROM questions;

-- Check test_submissions table
SELECT 
    'test_submissions' as table_name,
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN test_type = 'pre_test' THEN 1 END) as pre_test_submissions,
    COUNT(CASE WHEN test_type = 'post_test' THEN 1 END) as post_test_submissions
FROM test_submissions;

-- Check question_answers table
SELECT 
    'question_answers' as table_name,
    COUNT(*) as total_answers,
    COUNT(CASE WHEN is_correct = true THEN 1 END) as correct_answers
FROM question_answers;
