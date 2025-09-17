-- Step-by-step test_submissions table creation
-- Run each step separately in Supabase SQL Editor

-- STEP 1: Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS test_submissions CASCADE;

-- STEP 2: Create the table with basic structure
CREATE TABLE test_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  ic_number VARCHAR(14),
  job_position_name VARCHAR(255),
  job_category VARCHAR(50),
  test_type VARCHAR(20) NOT NULL,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 3: Add constraints
ALTER TABLE test_submissions 
ADD CONSTRAINT valid_test_type CHECK (test_type IN ('pre_test', 'post_test'));

ALTER TABLE test_submissions 
ADD CONSTRAINT valid_score CHECK (score >= 0 AND score <= total_questions);

ALTER TABLE test_submissions 
ADD CONSTRAINT valid_correct_answers CHECK (correct_answers >= 0 AND correct_answers <= total_questions);

ALTER TABLE test_submissions 
ADD CONSTRAINT valid_time CHECK (time_taken_seconds >= 0);

ALTER TABLE test_submissions 
ADD CONSTRAINT valid_attempt CHECK (attempt_number > 0);

-- STEP 4: Create indexes
CREATE INDEX idx_test_submissions_user_id ON test_submissions(user_id);
CREATE INDEX idx_test_submissions_test_type ON test_submissions(test_type);
CREATE INDEX idx_test_submissions_submitted_at ON test_submissions(submitted_at);
CREATE INDEX idx_test_submissions_job_category ON test_submissions(job_category);

-- STEP 5: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON test_submissions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- STEP 6: Test with sample data
INSERT INTO test_submissions (
  user_id, user_name, user_email, ic_number, job_position_name, job_category,
  test_type, score, total_questions, correct_answers, time_taken_seconds
) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Test User 1', 'test1@example.com', '123456789012', 'Jururawat U5', 'Clinical', 'pre_test', 25, 30, 25, 1200),
  ('00000000-0000-0000-0000-000000000002', 'Test User 2', 'test2@example.com', '123456789013', 'Pembantu Perawatan U3', 'Clinical', 'post_test', 28, 30, 28, 1000);

-- STEP 7: Verify table was created successfully
SELECT 'SUCCESS: test_submissions table created and populated' as status;
SELECT COUNT(*) as total_records FROM test_submissions;
SELECT * FROM test_submissions LIMIT 5;

