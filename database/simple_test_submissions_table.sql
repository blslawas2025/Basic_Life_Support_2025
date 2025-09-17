-- Simple test_submissions table creation
-- This version avoids foreign key constraints that might cause issues

CREATE TABLE IF NOT EXISTS test_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User Information
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_submissions_user_id ON test_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_test_type ON test_submissions(test_type);
CREATE INDEX IF NOT EXISTS idx_test_submissions_submitted_at ON test_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_test_submissions_job_category ON test_submissions(job_category);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON test_submissions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Test insert to verify table works
INSERT INTO test_submissions (
  user_id, user_name, user_email, ic_number, job_position_name, job_category,
  test_type, score, total_questions, correct_answers, time_taken_seconds
) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Test User', 'test@example.com', '123456789012', 'Test Position', 'Clinical', 'pre_test', 25, 30, 25, 1200)
ON CONFLICT DO NOTHING;

-- Verify the table was created and test data inserted
SELECT 'test_submissions table created successfully' as status;
SELECT COUNT(*) as record_count FROM test_submissions;
