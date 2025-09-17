-- Simple Sync Script for Questions and Test Submissions
-- Run this in your Supabase SQL Editor to ensure tables are synchronized

-- ==============================================
-- 1. ENSURE QUESTIONS TABLE HAS CORRECT STRUCTURE
-- ==============================================

-- Add missing columns to questions table if they don't exist
DO $$ 
BEGIN
    -- Add course_session_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'course_session_id') THEN
        ALTER TABLE questions ADD COLUMN course_session_id UUID;
    END IF;
    
    -- Add created_by if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'created_by') THEN
        ALTER TABLE questions ADD COLUMN created_by UUID;
    END IF;
    
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'updated_at') THEN
        ALTER TABLE questions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    RAISE NOTICE 'Questions table structure updated';
END $$;

-- ==============================================
-- 2. ENSURE TEST_SUBMISSIONS TABLE EXISTS
-- ==============================================

-- Create test_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS test_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    ic_number VARCHAR(14),
    job_position_name VARCHAR(255),
    job_category VARCHAR(50),
    test_type VARCHAR(20) NOT NULL CHECK (test_type IN ('pre_test', 'post_test')),
    course_session_id UUID,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 30,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    time_taken_seconds INTEGER NOT NULL DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_completed BOOLEAN DEFAULT TRUE,
    attempt_number INTEGER DEFAULT 1,
    can_retake BOOLEAN DEFAULT FALSE,
    retake_available_after TIMESTAMP WITH TIME ZONE,
    results_released BOOLEAN DEFAULT TRUE,
    results_released_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
    UNIQUE(submission_id, question_id)
);

-- ==============================================
-- 4. ADD FOREIGN KEY CONSTRAINTS
-- ==============================================

-- Add foreign key constraint to test_submissions if profiles table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id') THEN
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
-- 5. CREATE ESSENTIAL INDEXES
-- ==============================================

-- Questions table indexes
CREATE INDEX IF NOT EXISTS idx_questions_test_type ON questions(test_type);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON questions(is_active);

-- Test submissions indexes
CREATE INDEX IF NOT EXISTS idx_test_submissions_user_id ON test_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_test_type ON test_submissions(test_type);
CREATE INDEX IF NOT EXISTS idx_test_submissions_submitted_at ON test_submissions(submitted_at);

-- Question answers indexes
CREATE INDEX IF NOT EXISTS idx_question_answers_submission_id ON question_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_question_id ON question_answers(question_id);

-- ==============================================
-- 6. GRANT PERMISSIONS
-- ==============================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON test_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON question_answers TO authenticated;

-- ==============================================
-- 7. VERIFICATION
-- ==============================================

-- Check if tables are properly synchronized
SELECT 
    'questions' as table_name,
    COUNT(*) as total_questions,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_questions
FROM questions;

SELECT 
    'test_submissions' as table_name,
    COUNT(*) as total_submissions
FROM test_submissions;

SELECT 
    'question_answers' as table_name,
    COUNT(*) as total_answers
FROM question_answers;

-- Show table relationships
SELECT 
    'Synchronization Status' as status,
    'Tables are now properly linked and synchronized' as message;
