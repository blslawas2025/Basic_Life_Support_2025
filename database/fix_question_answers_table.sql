-- Fix question_answers table to add missing columns
-- This script updates the existing table structure to match the expected schema
-- Run this SQL in your Supabase SQL Editor

-- ==============================================
-- ADD MISSING COLUMNS TO EXISTING TABLE
-- ==============================================

-- Add question_number column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'question_answers' AND column_name = 'question_number'
    ) THEN
        ALTER TABLE question_answers ADD COLUMN question_number INTEGER;
        RAISE NOTICE 'Added question_number column to question_answers table';
    ELSE
        RAISE NOTICE 'question_number column already exists in question_answers table';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add question_number column: %', SQLERRM;
END $$;

-- Add question_text column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'question_answers' AND column_name = 'question_text'
    ) THEN
        ALTER TABLE question_answers ADD COLUMN question_text TEXT;
        RAISE NOTICE 'Added question_text column to question_answers table';
    ELSE
        RAISE NOTICE 'question_text column already exists in question_answers table';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add question_text column: %', SQLERRM;
END $$;

-- Add correct_answer column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'question_answers' AND column_name = 'correct_answer'
    ) THEN
        ALTER TABLE question_answers ADD COLUMN correct_answer VARCHAR(1) CHECK (correct_answer IN ('A', 'B', 'C', 'D'));
        RAISE NOTICE 'Added correct_answer column to question_answers table';
    ELSE
        RAISE NOTICE 'correct_answer column already exists in question_answers table';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add correct_answer column: %', SQLERRM;
END $$;

-- ==============================================
-- UPDATE EXISTING DATA
-- ==============================================

-- Update question_number for existing records (if any exist)
-- This will set question_number based on the order of questions in the submission
DO $$ 
BEGIN
    -- Only update if there are records and question_number is null
    IF EXISTS (SELECT 1 FROM question_answers WHERE question_number IS NULL) THEN
        -- Update question_number based on the order of records per submission
        WITH numbered_answers AS (
            SELECT id, 
                   ROW_NUMBER() OVER (PARTITION BY submission_id ORDER BY created_at) as question_num
            FROM question_answers 
            WHERE question_number IS NULL
        )
        UPDATE question_answers 
        SET question_number = numbered_answers.question_num
        FROM numbered_answers 
        WHERE question_answers.id = numbered_answers.id;
        
        RAISE NOTICE 'Updated question_number for existing records';
    ELSE
        RAISE NOTICE 'No existing records found or question_number already populated';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not update existing question_number values: %', SQLERRM;
END $$;

-- ==============================================
-- ADD CONSTRAINTS AND INDEXES
-- ==============================================

-- Make question_number NOT NULL after populating it
DO $$ 
BEGIN
    -- First check if all records have question_number populated
    IF NOT EXISTS (SELECT 1 FROM question_answers WHERE question_number IS NULL) THEN
        -- Add NOT NULL constraint
        ALTER TABLE question_answers ALTER COLUMN question_number SET NOT NULL;
        RAISE NOTICE 'Added NOT NULL constraint to question_number column';
    ELSE
        RAISE NOTICE 'Cannot add NOT NULL constraint - some records still have NULL question_number';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add NOT NULL constraint to question_number: %', SQLERRM;
END $$;

-- Drop the old unique constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'question_answers' 
        AND constraint_name = 'question_answers_submission_id_question_id_key'
    ) THEN
        ALTER TABLE question_answers DROP CONSTRAINT question_answers_submission_id_question_id_key;
        RAISE NOTICE 'Dropped old unique constraint';
    ELSE
        RAISE NOTICE 'Old unique constraint not found';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop old unique constraint: %', SQLERRM;
END $$;

-- Add new unique constraint on submission_id and question_number
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'question_answers' 
        AND constraint_name = 'question_answers_submission_id_question_number_key'
    ) THEN
        ALTER TABLE question_answers ADD CONSTRAINT question_answers_submission_id_question_number_key 
        UNIQUE(submission_id, question_number);
        RAISE NOTICE 'Added new unique constraint on submission_id and question_number';
    ELSE
        RAISE NOTICE 'New unique constraint already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add new unique constraint: %', SQLERRM;
END $$;

-- Create index on question_number if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'question_answers' 
        AND indexname = 'idx_question_answers_question_number'
    ) THEN
        CREATE INDEX idx_question_answers_question_number ON question_answers(question_number);
        RAISE NOTICE 'Created index on question_number';
    ELSE
        RAISE NOTICE 'Index on question_number already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not create index on question_number: %', SQLERRM;
END $$;

-- ==============================================
-- VERIFY CHANGES
-- ==============================================

-- Show the updated table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'question_answers' 
ORDER BY ordinal_position;

-- Show any existing data
SELECT COUNT(*) as total_records FROM question_answers;

-- Show sample data if any exists
SELECT * FROM question_answers LIMIT 5;
