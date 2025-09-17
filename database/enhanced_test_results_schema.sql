-- Enhanced Test Results Schema for BLS Analytics
-- This schema includes all required fields: name, IC, job, pre-test and post-test results

-- Create test_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS test_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User Information (from profiles table)
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  ic_number VARCHAR(14),
  job_position_name VARCHAR(255),
  job_category VARCHAR(50), -- 'clinical' or 'non_clinical'
  
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
CREATE INDEX IF NOT EXISTS idx_test_submissions_course_session ON test_submissions(course_session_id);
CREATE INDEX IF NOT EXISTS idx_test_submissions_job_category ON test_submissions(job_category);

-- Create a view for analytics that combines pre and post test results
CREATE OR REPLACE VIEW test_analytics AS
SELECT 
  p.id as user_id,
  p.name as user_name,
  p.email as user_email,
  p.ic_number,
  p.job_position_name,
  p.category as job_category,
  p.tempat_bertugas,
  
  -- Pre-test results
  pre_test.id as pre_test_id,
  pre_test.score as pre_test_score,
  pre_test.correct_answers as pre_test_correct,
  pre_test.total_questions as pre_test_total,
  pre_test.time_taken_seconds as pre_test_time,
  pre_test.submitted_at as pre_test_date,
  pre_test.is_completed as pre_test_completed,
  
  -- Post-test results
  post_test.id as post_test_id,
  post_test.score as post_test_score,
  post_test.correct_answers as post_test_correct,
  post_test.total_questions as post_test_total,
  post_test.time_taken_seconds as post_test_time,
  post_test.submitted_at as post_test_date,
  post_test.is_completed as post_test_completed,
  
  -- Calculated fields
  CASE 
    WHEN pre_test.score IS NOT NULL AND post_test.score IS NOT NULL 
    THEN post_test.score - pre_test.score
    ELSE NULL
  END as score_improvement,
  
  CASE 
    WHEN pre_test.score IS NOT NULL AND post_test.score IS NOT NULL 
    THEN ROUND(((post_test.score - pre_test.score)::DECIMAL / pre_test.score * 100), 2)
    ELSE NULL
  END as improvement_percentage,
  
  -- Pass/Fail status based on job category
  CASE 
    WHEN p.category = 'clinical' AND pre_test.score >= 25 THEN 'PASS'
    WHEN p.category != 'clinical' AND pre_test.score >= 20 THEN 'PASS'
    ELSE 'FAIL'
  END as pre_test_status,
  
  CASE 
    WHEN p.category = 'clinical' AND post_test.score >= 25 THEN 'PASS'
    WHEN p.category != 'clinical' AND post_test.score >= 20 THEN 'PASS'
    ELSE 'FAIL'
  END as post_test_status,
  
  -- Overall completion status
  CASE 
    WHEN pre_test.id IS NOT NULL AND post_test.id IS NOT NULL THEN 'COMPLETED'
    WHEN pre_test.id IS NOT NULL THEN 'PRE_TEST_ONLY'
    WHEN post_test.id IS NOT NULL THEN 'POST_TEST_ONLY'
    ELSE 'NOT_STARTED'
  END as completion_status

FROM profiles p
LEFT JOIN test_submissions pre_test ON p.id = pre_test.user_id AND pre_test.test_type = 'pre_test'
LEFT JOIN test_submissions post_test ON p.id = post_test.user_id AND post_test.test_type = 'post_test'
WHERE p.user_type = 'participant' AND p.status = 'approved';

-- Create a function to get analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary()
RETURNS TABLE (
  total_participants BIGINT,
  pre_test_participants BIGINT,
  post_test_participants BIGINT,
  completed_participants BIGINT,
  average_pre_test_score DECIMAL,
  average_post_test_score DECIMAL,
  improvement_rate DECIMAL,
  pass_rate DECIMAL,
  completion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT user_id) as total_participants,
    COUNT(DISTINCT CASE WHEN pre_test_id IS NOT NULL THEN user_id END) as pre_test_participants,
    COUNT(DISTINCT CASE WHEN post_test_id IS NOT NULL THEN user_id END) as post_test_participants,
    COUNT(DISTINCT CASE WHEN completion_status = 'COMPLETED' THEN user_id END) as completed_participants,
    ROUND(AVG(pre_test_score), 2) as average_pre_test_score,
    ROUND(AVG(post_test_score), 2) as average_post_test_score,
    ROUND(AVG(improvement_percentage), 2) as improvement_rate,
    ROUND(
      (COUNT(CASE WHEN post_test_status = 'PASS' THEN 1 END)::DECIMAL / 
       NULLIF(COUNT(CASE WHEN post_test_id IS NOT NULL THEN 1 END), 0) * 100), 2
    ) as pass_rate,
    ROUND(
      (COUNT(CASE WHEN completion_status = 'COMPLETED' THEN 1 END)::DECIMAL / 
       NULLIF(COUNT(DISTINCT user_id), 0) * 100), 2
    ) as completion_rate
  FROM test_analytics;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get detailed results for a specific user
CREATE OR REPLACE FUNCTION get_user_test_results(user_uuid UUID)
RETURNS TABLE (
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  ic_number VARCHAR(14),
  job_position_name VARCHAR(255),
  job_category VARCHAR(50),
  pre_test_score INTEGER,
  pre_test_correct INTEGER,
  pre_test_total INTEGER,
  pre_test_time INTEGER,
  pre_test_date TIMESTAMP WITH TIME ZONE,
  pre_test_status VARCHAR(10),
  post_test_score INTEGER,
  post_test_correct INTEGER,
  post_test_total INTEGER,
  post_test_time INTEGER,
  post_test_date TIMESTAMP WITH TIME ZONE,
  post_test_status VARCHAR(10),
  score_improvement INTEGER,
  improvement_percentage DECIMAL,
  completion_status VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.user_name,
    ta.user_email,
    ta.ic_number,
    ta.job_position_name,
    ta.job_category,
    ta.pre_test_score,
    ta.pre_test_correct,
    ta.pre_test_total,
    ta.pre_test_time,
    ta.pre_test_date,
    ta.pre_test_status,
    ta.post_test_score,
    ta.post_test_correct,
    ta.post_test_total,
    ta.post_test_time,
    ta.post_test_date,
    ta.post_test_status,
    ta.score_improvement,
    ta.improvement_percentage,
    ta.completion_status
  FROM test_analytics ta
  WHERE ta.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing (optional)
-- This can be removed in production
INSERT INTO test_submissions (
  user_id, user_name, user_email, ic_number, job_position_name, job_category,
  test_type, score, total_questions, correct_answers, time_taken_seconds
) VALUES 
  -- Sample pre-test results
  ('00000000-0000-0000-0000-000000000001', 'John Doe', 'john@example.com', '123456789012', 'Jururawat U5', 'clinical', 'pre_test', 18, 30, 18, 1200),
  ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'jane@example.com', '123456789013', 'Pembantu Perawatan U3', 'non_clinical', 'pre_test', 15, 30, 15, 1500),
  ('00000000-0000-0000-0000-000000000003', 'Dr. Ahmad', 'ahmad@example.com', '123456789014', 'Doktor', 'clinical', 'pre_test', 22, 30, 22, 900),
  
  -- Sample post-test results
  ('00000000-0000-0000-0000-000000000001', 'John Doe', 'john@example.com', '123456789012', 'Jururawat U5', 'clinical', 'post_test', 25, 30, 25, 1000),
  ('00000000-0000-0000-0000-000000000002', 'Jane Smith', 'jane@example.com', '123456789013', 'Pembantu Perawatan U3', 'non_clinical', 'post_test', 22, 30, 22, 1200),
  ('00000000-0000-0000-0000-000000000003', 'Dr. Ahmad', 'ahmad@example.com', '123456789014', 'Doktor', 'clinical', 'post_test', 28, 30, 28, 800)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON test_submissions TO authenticated;
GRANT SELECT ON test_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_analytics_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_test_results(UUID) TO authenticated;

