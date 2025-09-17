-- Minimal test_submissions table creation
-- This is the simplest possible version

-- Drop table if exists
DROP TABLE IF EXISTS test_submissions;

-- Create basic table
CREATE TABLE test_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  ic_number VARCHAR(14),
  job_position_name VARCHAR(255),
  job_category VARCHAR(50),
  test_type VARCHAR(20) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 30,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_completed BOOLEAN DEFAULT TRUE,
  attempt_number INTEGER DEFAULT 1,
  can_retake BOOLEAN DEFAULT FALSE,
  results_released BOOLEAN DEFAULT TRUE,
  results_released_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON test_submissions TO authenticated;

-- Test insert
INSERT INTO test_submissions (user_id, user_name, user_email, job_category, test_type, score) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Test User', 'test@example.com', 'Clinical', 'pre_test', 25);

-- Verify
SELECT 'Table created successfully' as status;
SELECT COUNT(*) as records FROM test_submissions;
