-- Create test_submissions table for storing test results
-- Run this SQL in your Supabase SQL Editor

-- First, let's check if profiles table has a category column
-- If not, we'll create the test_submissions table without the foreign key constraint

CREATE TABLE IF NOT EXISTS test_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User Information (from profiles table)
  user_id UUID NOT NULL, -- Will reference profiles(id) after we confirm the structure
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  ic_number VARCHAR(14),
  job_position_name VARCHAR(255),
  job_category VARCHAR(50), -- 'Clinical' or 'Non-Clinical' (will be populated from jobs table)
  
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

-- Add foreign key constraint to profiles table (if it exists)
-- This will only work if the profiles table exists and has an 'id' column
DO $$ 
BEGIN
    -- Check if profiles table exists and has id column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id') THEN
        -- Add foreign key constraint
        ALTER TABLE test_submissions 
        ADD CONSTRAINT fk_test_submissions_user_id 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'Profiles table not found or missing id column - skipping foreign key constraint';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add foreign key constraint: %', SQLERRM;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_submissions_user_id ON test_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_test_type ON test_submissions(test_type);
CREATE INDEX IF NOT EXISTS idx_test_submissions_submitted_at ON test_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_test_submissions_job_category ON test_submissions(job_category);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON test_submissions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Insert sample data for testing (optional)
-- Note: Replace the UUIDs with actual user IDs from your profiles table
INSERT INTO test_submissions (
  user_id, user_name, user_email, ic_number, job_position_name, job_category,
  test_type, score, total_questions, correct_answers, time_taken_seconds
) VALUES 
  -- Sample pre-test results
  ('00000000-0000-0000-0000-000000000001', 'John Doe', 'john@example.com', '123456789012', 'Jururawat U5', 'Clinical', 'pre_test', 18, 30, 18, 1200),
  ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'jane@example.com', '123456789013', 'Pembantu Perawatan U3', 'Clinical', 'pre_test', 15, 30, 15, 1500),
  ('00000000-0000-0000-0000-000000000003', 'Dr. Ahmad', 'ahmad@example.com', '123456789014', 'Doktor', 'Clinical', 'pre_test', 22, 30, 22, 900),
  
  -- Sample post-test results
  ('00000000-0000-0000-0000-000000000001', 'John Doe', 'john@example.com', '123456789012', 'Jururawat U5', 'Clinical', 'post_test', 25, 30, 25, 1000),
  ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'jane@example.com', '123456789013', 'Pembantu Perawatan U3', 'Clinical', 'post_test', 22, 30, 22, 1200),
  ('00000000-0000-0000-0000-000000000003', 'Dr. Ahmad', 'ahmad@example.com', '123456789014', 'Doktor', 'Clinical', 'post_test', 28, 30, 28, 800)
ON CONFLICT DO NOTHING;

-- Verify the table was created
SELECT 'test_submissions table created successfully' as status;
