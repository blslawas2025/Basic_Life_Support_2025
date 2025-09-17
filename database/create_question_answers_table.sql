-- Create question_answers table for detailed answer tracking
-- This table stores individual question responses for each test submission
-- Run this SQL in your Supabase SQL Editor

-- ==============================================
-- CREATE QUESTION_ANSWERS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS question_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES test_submissions(id) ON DELETE CASCADE,
    question_id UUID, -- Will reference questions table if it exists
    question_number INTEGER NOT NULL,
    question_text TEXT,
    user_answer VARCHAR(1) CHECK (user_answer IN ('A', 'B', 'C', 'D')),
    correct_answer VARCHAR(1) CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one answer per question per submission
    UNIQUE(submission_id, question_number)
);

-- ==============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Index for querying answers by submission
CREATE INDEX IF NOT EXISTS idx_question_answers_submission_id ON question_answers(submission_id);

-- Index for querying answers by question
CREATE INDEX IF NOT EXISTS idx_question_answers_question_id ON question_answers(question_id);

-- Index for querying answers by question number
CREATE INDEX IF NOT EXISTS idx_question_answers_question_number ON question_answers(question_number);

-- Index for querying correct/incorrect answers
CREATE INDEX IF NOT EXISTS idx_question_answers_is_correct ON question_answers(is_correct);

-- ==============================================
-- GRANT PERMISSIONS
-- ==============================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON question_answers TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ==============================================
-- ADD FOREIGN KEY CONSTRAINT TO QUESTIONS TABLE (if it exists)
-- ==============================================

-- Add foreign key constraint to questions table if it exists
DO $$ 
BEGIN
    -- Check if questions table exists and has id column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'id') THEN
        
        -- Add foreign key constraint to questions table
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_question_answers_question_id'
        ) THEN
            ALTER TABLE question_answers 
            ADD CONSTRAINT fk_question_answers_question_id 
            FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL;
            
            RAISE NOTICE 'Foreign key constraint to questions table added successfully';
        END IF;
    ELSE
        RAISE NOTICE 'Questions table not found or missing id column - skipping foreign key constraint';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add foreign key constraint to questions table: %', SQLERRM;
END $$;

-- ==============================================
-- VERIFY TABLE CREATION
-- ==============================================

-- Verify the table was created
SELECT 'question_answers table created successfully' as status;

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'question_answers' 
ORDER BY ordinal_position;
