-- Simple script to insert missing results
-- Run this in your Supabase SQL editor

-- First, check if participants exist
SELECT id, name, email, roles FROM profiles 
WHERE name ILIKE '%ANGELINA RURAN SIGAR%' 
   OR name ILIKE '%YONG ZILING%' 
   OR name ILIKE '%SYAMSUL HARDY BIN RAMLAN%';

-- Insert ANGELINA RURAN SIGAR test results
-- Pre Test: 14/30 (46.7%) - FAIL
-- Post Test: 27/30 (90%) - PASS

-- Pre Test for ANGELINA
INSERT INTO test_submissions (
    user_id, user_name, user_email, ic_number, job_position_name, job_category,
    test_type, score, total_questions, correct_answers, time_taken_seconds,
    submitted_at, is_completed, attempt_number, can_retake, results_released,
    results_released_at, created_at, updated_at
)
SELECT 
    p.id, p.name, p.email, p.ic_number, p.job_position_name, 
    COALESCE(j.category, 'Non-Clinical'),
    'pre_test', 14, 30, 14, 1200,
    NOW() - INTERVAL '2 days', true, 1, false, true,
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%ANGELINA RURAN SIGAR%' 
  AND p.roles = 'user' AND p.user_type = 'participant' AND p.status = 'approved';

-- Post Test for ANGELINA
INSERT INTO test_submissions (
    user_id, user_name, user_email, ic_number, job_position_name, job_category,
    test_type, score, total_questions, correct_answers, time_taken_seconds,
    submitted_at, is_completed, attempt_number, can_retake, results_released,
    results_released_at, created_at, updated_at
)
SELECT 
    p.id, p.name, p.email, p.ic_number, p.job_position_name, 
    COALESCE(j.category, 'Non-Clinical'),
    'post_test', 27, 30, 27, 1500,
    NOW() - INTERVAL '1 day', true, 1, false, true,
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%ANGELINA RURAN SIGAR%' 
  AND p.roles = 'user' AND p.user_type = 'participant' AND p.status = 'approved';

-- Insert YONG ZILING test results
-- Pre Test: 19/30 (63.3%) - FAIL
-- Post Test: 27/30 (90%) - PASS

-- Pre Test for YONG ZILING
INSERT INTO test_submissions (
    user_id, user_name, user_email, ic_number, job_position_name, job_category,
    test_type, score, total_questions, correct_answers, time_taken_seconds,
    submitted_at, is_completed, attempt_number, can_retake, results_released,
    results_released_at, created_at, updated_at
)
SELECT 
    p.id, p.name, p.email, p.ic_number, p.job_position_name, 
    COALESCE(j.category, 'Non-Clinical'),
    'pre_test', 19, 30, 19, 1350,
    NOW() - INTERVAL '3 days', true, 1, false, true,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%YONG ZILING%' 
  AND p.roles = 'user' AND p.user_type = 'participant' AND p.status = 'approved';

-- Post Test for YONG ZILING
INSERT INTO test_submissions (
    user_id, user_name, user_email, ic_number, job_position_name, job_category,
    test_type, score, total_questions, correct_answers, time_taken_seconds,
    submitted_at, is_completed, attempt_number, can_retake, results_released,
    results_released_at, created_at, updated_at
)
SELECT 
    p.id, p.name, p.email, p.ic_number, p.job_position_name, 
    COALESCE(j.category, 'Non-Clinical'),
    'post_test', 27, 30, 27, 1600,
    NOW() - INTERVAL '2 days', true, 1, false, true,
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%YONG ZILING%' 
  AND p.roles = 'user' AND p.user_type = 'participant' AND p.status = 'approved';

-- Insert SYAMSUL HARDY BIN RAMLAN checklist results (all PASS)
-- One Man CPR
INSERT INTO checklist_result (
    participant_id, participant_name, participant_email, participant_ic_number,
    participant_job_position, participant_category, checklist_type, checklist_version,
    total_items, completed_items, completion_percentage, status, can_pass,
    airway_completed, breathing_completed, circulation_completed, all_compulsory_completed,
    section_results, instructor_name, instructor_comments, submitted_at,
    assessment_duration_seconds, time_started, time_completed, assessment_notes,
    retake_count, is_retake, created_at, updated_at, is_deleted
)
SELECT 
    p.id, p.name, p.email, p.ic_number, p.job_position_name, 
    COALESCE(j.category, 'Non-Clinical'),
    'one man cpr', '1.0', 22, 22, 100.00, 'PASS', true,
    true, true, true, true,
    '[{"section": "airway", "completed": true, "items": [{"id": 1, "item": "Check responsiveness", "completed": true, "is_compulsory": true}]}]'::jsonb,
    'Instructor', 'Excellent performance!', NOW() - INTERVAL '1 day',
    1800, NOW() - INTERVAL '1 day' - INTERVAL '30 minutes', NOW() - INTERVAL '1 day',
    'Perfect execution', 0, false, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', false
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%SYAMSUL HARDY BIN RAMLAN%' 
  AND p.roles = 'user' AND p.user_type = 'participant' AND p.status = 'approved';

-- Two Man CPR
INSERT INTO checklist_result (
    participant_id, participant_name, participant_email, participant_ic_number,
    participant_job_position, participant_category, checklist_type, checklist_version,
    total_items, completed_items, completion_percentage, status, can_pass,
    airway_completed, breathing_completed, circulation_completed, all_compulsory_completed,
    section_results, instructor_name, instructor_comments, submitted_at,
    assessment_duration_seconds, time_started, time_completed, assessment_notes,
    retake_count, is_retake, created_at, updated_at, is_deleted
)
SELECT 
    p.id, p.name, p.email, p.ic_number, p.job_position_name, 
    COALESCE(j.category, 'Non-Clinical'),
    'two man cpr', '1.0', 20, 20, 100.00, 'PASS', true,
    true, true, true, true,
    '[{"section": "airway", "completed": true, "items": [{"id": 1, "item": "Check responsiveness", "completed": true, "is_compulsory": true}]}]'::jsonb,
    'Instructor', 'Outstanding technique!', NOW() - INTERVAL '1 day',
    2000, NOW() - INTERVAL '1 day' - INTERVAL '33 minutes', NOW() - INTERVAL '1 day',
    'Perfect coordination', 0, false, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', false
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%SYAMSUL HARDY BIN RAMLAN%' 
  AND p.roles = 'user' AND p.user_type = 'participant' AND p.status = 'approved';

-- Infant CPR
INSERT INTO checklist_result (
    participant_id, participant_name, participant_email, participant_ic_number,
    participant_job_position, participant_category, checklist_type, checklist_version,
    total_items, completed_items, completion_percentage, status, can_pass,
    airway_completed, breathing_completed, circulation_completed, all_compulsory_completed,
    section_results, instructor_name, instructor_comments, submitted_at,
    assessment_duration_seconds, time_started, time_completed, assessment_notes,
    retake_count, is_retake, created_at, updated_at, is_deleted
)
SELECT 
    p.id, p.name, p.email, p.ic_number, p.job_position_name, 
    COALESCE(j.category, 'Non-Clinical'),
    'infant cpr', '1.0', 18, 18, 100.00, 'PASS', true,
    true, true, true, true,
    '[{"section": "airway", "completed": true, "items": [{"id": 1, "item": "Check responsiveness", "completed": true, "is_compulsory": true}]}]'::jsonb,
    'Instructor', 'Excellent infant CPR!', NOW() - INTERVAL '1 day',
    1600, NOW() - INTERVAL '1 day' - INTERVAL '27 minutes', NOW() - INTERVAL '1 day',
    'Perfect technique', 0, false, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', false
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%SYAMSUL HARDY BIN RAMLAN%' 
  AND p.roles = 'user' AND p.user_type = 'participant' AND p.status = 'approved';

-- Infant Choking
INSERT INTO checklist_result (
    participant_id, participant_name, participant_email, participant_ic_number,
    participant_job_position, participant_category, checklist_type, checklist_version,
    total_items, completed_items, completion_percentage, status, can_pass,
    airway_completed, breathing_completed, circulation_completed, all_compulsory_completed,
    section_results, instructor_name, instructor_comments, submitted_at,
    assessment_duration_seconds, time_started, time_completed, assessment_notes,
    retake_count, is_retake, created_at, updated_at, is_deleted
)
SELECT 
    p.id, p.name, p.email, p.ic_number, p.job_position_name, 
    COALESCE(j.category, 'Non-Clinical'),
    'infant choking', '1.0', 15, 15, 100.00, 'PASS', true,
    true, true, true, true,
    '[{"section": "assessment", "completed": true, "items": [{"id": 1, "item": "Check for signs of choking", "completed": true, "is_compulsory": true}]}]'::jsonb,
    'Instructor', 'Perfect infant choking response!', NOW() - INTERVAL '1 day',
    1200, NOW() - INTERVAL '1 day' - INTERVAL '20 minutes', NOW() - INTERVAL '1 day',
    'Excellent technique', 0, false, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', false
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%SYAMSUL HARDY BIN RAMLAN%' 
  AND p.roles = 'user' AND p.user_type = 'participant' AND p.status = 'approved';

-- Adult Choking
INSERT INTO checklist_result (
    participant_id, participant_name, participant_email, participant_ic_number,
    participant_job_position, participant_category, checklist_type, checklist_version,
    total_items, completed_items, completion_percentage, status, can_pass,
    airway_completed, breathing_completed, circulation_completed, all_compulsory_completed,
    section_results, instructor_name, instructor_comments, submitted_at,
    assessment_duration_seconds, time_started, time_completed, assessment_notes,
    retake_count, is_retake, created_at, updated_at, is_deleted
)
SELECT 
    p.id, p.name, p.email, p.ic_number, p.job_position_name, 
    COALESCE(j.category, 'Non-Clinical'),
    'adult choking', '1.0', 12, 12, 100.00, 'PASS', true,
    true, true, true, true,
    '[{"section": "assessment", "completed": true, "items": [{"id": 1, "item": "Check for signs of choking", "completed": true, "is_compulsory": true}]}]'::jsonb,
    'Instructor', 'Outstanding adult choking response!', NOW() - INTERVAL '1 day',
    1000, NOW() - INTERVAL '1 day' - INTERVAL '17 minutes', NOW() - INTERVAL '1 day',
    'Perfect technique', 0, false, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', false
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%SYAMSUL HARDY BIN RAMLAN%' 
  AND p.roles = 'user' AND p.user_type = 'participant' AND p.status = 'approved';

-- Verify the results
SELECT 'Test Results' as type, user_name, test_type, correct_answers, total_questions, 
       ROUND((correct_answers::DECIMAL / total_questions) * 100, 1) as percentage
FROM test_submissions 
WHERE user_name ILIKE '%ANGELINA%' OR user_name ILIKE '%YONG%' OR user_name ILIKE '%SYAMSUL%'
UNION ALL
SELECT 'Checklist Results' as type, participant_name, checklist_type, completed_items, total_items, 
       completion_percentage as percentage
FROM checklist_result 
WHERE participant_name ILIKE '%ANGELINA%' OR participant_name ILIKE '%YONG%' OR participant_name ILIKE '%SYAMSUL%'
ORDER BY type, user_name, test_type;
