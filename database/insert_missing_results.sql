-- Insert missing test results and checklist data
-- This script adds the missing participant results to the database

-- First, let's check if these participants exist in the profiles table
SELECT id, name, email, ic_number, job_position_name, roles 
FROM profiles 
WHERE name ILIKE '%ANGELINA RURAN SIGAR%' 
   OR name ILIKE '%YONG ZILING%' 
   OR name ILIKE '%SYAMSUL HARDY BIN RAMLAN%';

-- Insert test results for ANGELINA RURAN SIGAR
-- Pre Test: 14/30 (46.7%)
-- Post Test: 27/30 (90%)
INSERT INTO test_submissions (
    user_id,
    user_name,
    user_email,
    ic_number,
    job_position_name,
    job_category,
    test_type,
    score,
    total_questions,
    correct_answers,
    time_taken_seconds,
    submitted_at,
    is_completed,
    attempt_number,
    can_retake,
    results_released,
    results_released_at,
    created_at,
    updated_at
)
SELECT 
    p.id,
    p.name,
    p.email,
    p.ic_number,
    p.job_position_name,
    COALESCE(j.category, 'Non-Clinical'),
    'pre_test',
    14,
    30,
    14,
    1200, -- 20 minutes
    NOW() - INTERVAL '2 days',
    true,
    1,
    false,
    true,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%ANGELINA RURAN SIGAR%' 
  AND p.roles = 'user'
  AND p.user_type = 'participant'
  AND p.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM test_submissions ts 
    WHERE ts.user_id = p.id AND ts.test_type = 'pre_test'
  );

INSERT INTO test_submissions (
    user_id,
    user_name,
    user_email,
    ic_number,
    job_position_name,
    job_category,
    test_type,
    score,
    total_questions,
    correct_answers,
    time_taken_seconds,
    submitted_at,
    is_completed,
    attempt_number,
    can_retake,
    results_released,
    results_released_at,
    created_at,
    updated_at
)
SELECT 
    p.id,
    p.name,
    p.email,
    p.ic_number,
    p.job_position_name,
    COALESCE(j.category, 'Non-Clinical'),
    'post_test',
    27,
    30,
    27,
    1500, -- 25 minutes
    NOW() - INTERVAL '1 day',
    true,
    1,
    false,
    true,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%ANGELINA RURAN SIGAR%' 
  AND p.roles = 'user'
  AND p.user_type = 'participant'
  AND p.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM test_submissions ts 
    WHERE ts.user_id = p.id AND ts.test_type = 'post_test'
  );

-- Insert test results for YONG ZILING
-- Pre Test: 19/30 (63.3%)
-- Post Test: 27/30 (90%)
INSERT INTO test_submissions (
    user_id,
    user_name,
    user_email,
    ic_number,
    job_position_name,
    job_category,
    test_type,
    score,
    total_questions,
    correct_answers,
    time_taken_seconds,
    submitted_at,
    is_completed,
    attempt_number,
    can_retake,
    results_released,
    results_released_at,
    created_at,
    updated_at
)
SELECT 
    p.id,
    p.name,
    p.email,
    p.ic_number,
    p.job_position_name,
    COALESCE(j.category, 'Non-Clinical'),
    'pre_test',
    19,
    30,
    19,
    1350, -- 22.5 minutes
    NOW() - INTERVAL '3 days',
    true,
    1,
    false,
    true,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%YONG ZILING%' 
  AND p.roles = 'user'
  AND p.user_type = 'participant'
  AND p.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM test_submissions ts 
    WHERE ts.user_id = p.id AND ts.test_type = 'pre_test'
  );

INSERT INTO test_submissions (
    user_id,
    user_name,
    user_email,
    ic_number,
    job_position_name,
    job_category,
    test_type,
    score,
    total_questions,
    correct_answers,
    time_taken_seconds,
    submitted_at,
    is_completed,
    attempt_number,
    can_retake,
    results_released,
    results_released_at,
    created_at,
    updated_at
)
SELECT 
    p.id,
    p.name,
    p.email,
    p.ic_number,
    p.job_position_name,
    COALESCE(j.category, 'Non-Clinical'),
    'post_test',
    27,
    30,
    27,
    1600, -- 26.7 minutes
    NOW() - INTERVAL '2 days',
    true,
    1,
    false,
    true,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%YONG ZILING%' 
  AND p.roles = 'user'
  AND p.user_type = 'participant'
  AND p.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM test_submissions ts 
    WHERE ts.user_id = p.id AND ts.test_type = 'post_test'
  );

-- Insert checklist results for SYAMSUL HARDY BIN RAMLAN
-- All 5 checklists: PASS (100% completion)
INSERT INTO checklist_result (
    participant_id,
    participant_name,
    participant_email,
    participant_ic_number,
    participant_job_position,
    participant_category,
    checklist_type,
    checklist_version,
    total_items,
    completed_items,
    completion_percentage,
    status,
    can_pass,
    airway_completed,
    breathing_completed,
    circulation_completed,
    all_compulsory_completed,
    section_results,
    instructor_name,
    instructor_comments,
    submitted_at,
    assessment_duration_seconds,
    time_started,
    time_completed,
    assessment_notes,
    retake_count,
    is_retake,
    created_at,
    updated_at,
    is_deleted
)
SELECT 
    p.id,
    p.name,
    p.email,
    p.ic_number,
    p.job_position_name,
    COALESCE(j.category, 'Non-Clinical'),
    'one man cpr',
    '1.0',
    22,
    22,
    100.00,
    'PASS',
    true,
    true,
    true,
    true,
    true,
    '[
        {
            "section": "danger",
            "completed": true,
            "items": [
                {"id": 1, "item": "Check for danger", "completed": true, "is_compulsory": false},
                {"id": 2, "item": "Ensure scene safety", "completed": true, "is_compulsory": false}
            ]
        },
        {
            "section": "airway",
            "completed": true,
            "items": [
                {"id": 3, "item": "Check responsiveness", "completed": true, "is_compulsory": true},
                {"id": 4, "item": "Open airway", "completed": true, "is_compulsory": true},
                {"id": 5, "item": "Check breathing", "completed": true, "is_compulsory": true}
            ]
        },
        {
            "section": "breathing",
            "completed": true,
            "items": [
                {"id": 6, "item": "Give 2 rescue breaths", "completed": true, "is_compulsory": true},
                {"id": 7, "item": "Check for chest rise", "completed": true, "is_compulsory": true}
            ]
        },
        {
            "section": "circulation",
            "completed": true,
            "items": [
                {"id": 8, "item": "Check for pulse", "completed": true, "is_compulsory": true},
                {"id": 9, "item": "Begin chest compressions", "completed": true, "is_compulsory": true},
                {"id": 10, "item": "Maintain proper compression depth", "completed": true, "is_compulsory": true},
                {"id": 11, "item": "Maintain proper compression rate", "completed": true, "is_compulsory": true},
                {"id": 12, "item": "Allow full chest recoil", "completed": true, "is_compulsory": true},
                {"id": 13, "item": "Minimize interruptions", "completed": true, "is_compulsory": true},
                {"id": 14, "item": "Switch rescuers every 2 minutes", "completed": true, "is_compulsory": false},
                {"id": 15, "item": "Continue until help arrives", "completed": true, "is_compulsory": false}
            ]
        }
    ]'::jsonb,
    'Instructor Name',
    'Excellent performance! All steps completed correctly.',
    NOW() - INTERVAL '1 day',
    1800, -- 30 minutes
    NOW() - INTERVAL '1 day' - INTERVAL '30 minutes',
    NOW() - INTERVAL '1 day',
    'Perfect execution of one man CPR technique',
    0,
    false,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    false
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%SYAMSUL HARDY BIN RAMLAN%' 
  AND p.roles = 'user'
  AND p.user_type = 'participant'
  AND p.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM checklist_result cr 
    WHERE cr.participant_id = p.id AND cr.checklist_type = 'one man cpr'
  );

-- Two Man CPR
INSERT INTO checklist_result (
    participant_id,
    participant_name,
    participant_email,
    participant_ic_number,
    participant_job_position,
    participant_category,
    checklist_type,
    checklist_version,
    total_items,
    completed_items,
    completion_percentage,
    status,
    can_pass,
    airway_completed,
    breathing_completed,
    circulation_completed,
    all_compulsory_completed,
    section_results,
    instructor_name,
    instructor_comments,
    submitted_at,
    assessment_duration_seconds,
    time_started,
    time_completed,
    assessment_notes,
    retake_count,
    is_retake,
    created_at,
    updated_at,
    is_deleted
)
SELECT 
    p.id,
    p.name,
    p.email,
    p.ic_number,
    p.job_position_name,
    COALESCE(j.category, 'Non-Clinical'),
    'two man cpr',
    '1.0',
    20,
    20,
    100.00,
    'PASS',
    true,
    true,
    true,
    true,
    true,
    '[
        {
            "section": "danger",
            "completed": true,
            "items": [
                {"id": 1, "item": "Check for danger", "completed": true, "is_compulsory": false},
                {"id": 2, "item": "Ensure scene safety", "completed": true, "is_compulsory": false}
            ]
        },
        {
            "section": "airway",
            "completed": true,
            "items": [
                {"id": 3, "item": "Check responsiveness", "completed": true, "is_compulsory": true},
                {"id": 4, "item": "Open airway", "completed": true, "is_compulsory": true},
                {"id": 5, "item": "Check breathing", "completed": true, "is_compulsory": true}
            ]
        },
        {
            "section": "breathing",
            "completed": true,
            "items": [
                {"id": 6, "item": "Give 2 rescue breaths", "completed": true, "is_compulsory": true},
                {"id": 7, "item": "Check for chest rise", "completed": true, "is_compulsory": true}
            ]
        },
        {
            "section": "circulation",
            "completed": true,
            "items": [
                {"id": 8, "item": "Check for pulse", "completed": true, "is_compulsory": true},
                {"id": 9, "item": "Begin chest compressions", "completed": true, "is_compulsory": true},
                {"id": 10, "item": "Maintain proper compression depth", "completed": true, "is_compulsory": true},
                {"id": 11, "item": "Maintain proper compression rate", "completed": true, "is_compulsory": true},
                {"id": 12, "item": "Allow full chest recoil", "completed": true, "is_compulsory": true},
                {"id": 13, "item": "Minimize interruptions", "completed": true, "is_compulsory": true},
                {"id": 14, "item": "Switch rescuers every 2 minutes", "completed": true, "is_compulsory": true},
                {"id": 15, "item": "Continue until help arrives", "completed": true, "is_compulsory": false}
            ]
        }
    ]'::jsonb,
    'Instructor Name',
    'Outstanding two man CPR technique!',
    NOW() - INTERVAL '1 day',
    2000, -- 33.3 minutes
    NOW() - INTERVAL '1 day' - INTERVAL '33 minutes',
    NOW() - INTERVAL '1 day',
    'Perfect coordination between rescuers',
    0,
    false,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    false
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%SYAMSUL HARDY BIN RAMLAN%' 
  AND p.roles = 'user'
  AND p.user_type = 'participant'
  AND p.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM checklist_result cr 
    WHERE cr.participant_id = p.id AND cr.checklist_type = 'two man cpr'
  );

-- Infant CPR
INSERT INTO checklist_result (
    participant_id,
    participant_name,
    participant_email,
    participant_ic_number,
    participant_job_position,
    participant_category,
    checklist_type,
    checklist_version,
    total_items,
    completed_items,
    completion_percentage,
    status,
    can_pass,
    airway_completed,
    breathing_completed,
    circulation_completed,
    all_compulsory_completed,
    section_results,
    instructor_name,
    instructor_comments,
    submitted_at,
    assessment_duration_seconds,
    time_started,
    time_completed,
    assessment_notes,
    retake_count,
    is_retake,
    created_at,
    updated_at,
    is_deleted
)
SELECT 
    p.id,
    p.name,
    p.email,
    p.ic_number,
    p.job_position_name,
    COALESCE(j.category, 'Non-Clinical'),
    'infant cpr',
    '1.0',
    18,
    18,
    100.00,
    'PASS',
    true,
    true,
    true,
    true,
    true,
    '[
        {
            "section": "danger",
            "completed": true,
            "items": [
                {"id": 1, "item": "Check for danger", "completed": true, "is_compulsory": false},
                {"id": 2, "item": "Ensure scene safety", "completed": true, "is_compulsory": false}
            ]
        },
        {
            "section": "airway",
            "completed": true,
            "items": [
                {"id": 3, "item": "Check responsiveness", "completed": true, "is_compulsory": true},
                {"id": 4, "item": "Open airway (head tilt-chin lift)", "completed": true, "is_compulsory": true},
                {"id": 5, "item": "Check breathing", "completed": true, "is_compulsory": true}
            ]
        },
        {
            "section": "breathing",
            "completed": true,
            "items": [
                {"id": 6, "item": "Give 2 gentle rescue breaths", "completed": true, "is_compulsory": true},
                {"id": 7, "item": "Check for chest rise", "completed": true, "is_compulsory": true}
            ]
        },
        {
            "section": "circulation",
            "completed": true,
            "items": [
                {"id": 8, "item": "Check for pulse", "completed": true, "is_compulsory": true},
                {"id": 9, "item": "Begin chest compressions (2 fingers)", "completed": true, "is_compulsory": true},
                {"id": 10, "item": "Maintain proper compression depth", "completed": true, "is_compulsory": true},
                {"id": 11, "item": "Maintain proper compression rate", "completed": true, "is_compulsory": true},
                {"id": 12, "item": "Allow full chest recoil", "completed": true, "is_compulsory": true},
                {"id": 13, "item": "Minimize interruptions", "completed": true, "is_compulsory": true},
                {"id": 14, "item": "Continue until help arrives", "completed": true, "is_compulsory": false}
            ]
        }
    ]'::jsonb,
    'Instructor Name',
    'Excellent infant CPR technique!',
    NOW() - INTERVAL '1 day',
    1600, -- 26.7 minutes
    NOW() - INTERVAL '1 day' - INTERVAL '27 minutes',
    NOW() - INTERVAL '1 day',
    'Perfect technique for infant resuscitation',
    0,
    false,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    false
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%SYAMSUL HARDY BIN RAMLAN%' 
  AND p.roles = 'user'
  AND p.user_type = 'participant'
  AND p.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM checklist_result cr 
    WHERE cr.participant_id = p.id AND cr.checklist_type = 'infant cpr'
  );

-- Infant Choking
INSERT INTO checklist_result (
    participant_id,
    participant_name,
    participant_email,
    participant_ic_number,
    participant_job_position,
    participant_category,
    checklist_type,
    checklist_version,
    total_items,
    completed_items,
    completion_percentage,
    status,
    can_pass,
    airway_completed,
    breathing_completed,
    circulation_completed,
    all_compulsory_completed,
    section_results,
    instructor_name,
    instructor_comments,
    submitted_at,
    assessment_duration_seconds,
    time_started,
    time_completed,
    assessment_notes,
    retake_count,
    is_retake,
    created_at,
    updated_at,
    is_deleted
)
SELECT 
    p.id,
    p.name,
    p.email,
    p.ic_number,
    p.job_position_name,
    COALESCE(j.category, 'Non-Clinical'),
    'infant choking',
    '1.0',
    15,
    15,
    100.00,
    'PASS',
    true,
    true,
    true,
    true,
    true,
    '[
        {
            "section": "assessment",
            "completed": true,
            "items": [
                {"id": 1, "item": "Check for signs of choking", "completed": true, "is_compulsory": true},
                {"id": 2, "item": "Assess consciousness", "completed": true, "is_compulsory": true},
                {"id": 3, "item": "Check for breathing", "completed": true, "is_compulsory": true}
            ]
        },
        {
            "section": "intervention",
            "completed": true,
            "items": [
                {"id": 4, "item": "Position infant face down", "completed": true, "is_compulsory": true},
                {"id": 5, "item": "Support head and neck", "completed": true, "is_compulsory": true},
                {"id": 6, "item": "Give 5 back blows", "completed": true, "is_compulsory": true},
                {"id": 7, "item": "Turn infant face up", "completed": true, "is_compulsory": true},
                {"id": 8, "item": "Give 5 chest thrusts", "completed": true, "is_compulsory": true},
                {"id": 9, "item": "Check for object", "completed": true, "is_compulsory": true},
                {"id": 10, "item": "Repeat if necessary", "completed": true, "is_compulsory": true}
            ]
        },
        {
            "section": "follow_up",
            "completed": true,
            "items": [
                {"id": 11, "item": "Monitor breathing", "completed": true, "is_compulsory": true},
                {"id": 12, "item": "Seek medical attention", "completed": true, "is_compulsory": true},
                {"id": 13, "item": "Document incident", "completed": true, "is_compulsory": false}
            ]
        }
    ]'::jsonb,
    'Instructor Name',
    'Perfect infant choking response!',
    NOW() - INTERVAL '1 day',
    1200, -- 20 minutes
    NOW() - INTERVAL '1 day' - INTERVAL '20 minutes',
    NOW() - INTERVAL '1 day',
    'Excellent technique for infant choking management',
    0,
    false,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    false
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%SYAMSUL HARDY BIN RAMLAN%' 
  AND p.roles = 'user'
  AND p.user_type = 'participant'
  AND p.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM checklist_result cr 
    WHERE cr.participant_id = p.id AND cr.checklist_type = 'infant choking'
  );

-- Adult Choking
INSERT INTO checklist_result (
    participant_id,
    participant_name,
    participant_email,
    participant_ic_number,
    participant_job_position,
    participant_category,
    checklist_type,
    checklist_version,
    total_items,
    completed_items,
    completion_percentage,
    status,
    can_pass,
    airway_completed,
    breathing_completed,
    circulation_completed,
    all_compulsory_completed,
    section_results,
    instructor_name,
    instructor_comments,
    submitted_at,
    assessment_duration_seconds,
    time_started,
    time_completed,
    assessment_notes,
    retake_count,
    is_retake,
    created_at,
    updated_at,
    is_deleted
)
SELECT 
    p.id,
    p.name,
    p.email,
    p.ic_number,
    p.job_position_name,
    COALESCE(j.category, 'Non-Clinical'),
    'adult choking',
    '1.0',
    12,
    12,
    100.00,
    'PASS',
    true,
    true,
    true,
    true,
    true,
    '[
        {
            "section": "assessment",
            "completed": true,
            "items": [
                {"id": 1, "item": "Check for signs of choking", "completed": true, "is_compulsory": true},
                {"id": 2, "item": "Assess consciousness", "completed": true, "is_compulsory": true},
                {"id": 3, "item": "Check for breathing", "completed": true, "is_compulsory": true}
            ]
        },
        {
            "section": "intervention",
            "completed": true,
            "items": [
                {"id": 4, "item": "Position behind victim", "completed": true, "is_compulsory": true},
                {"id": 5, "item": "Place hands correctly", "completed": true, "is_compulsory": true},
                {"id": 6, "item": "Give 5 abdominal thrusts", "completed": true, "is_compulsory": true},
                {"id": 7, "item": "Check for object", "completed": true, "is_compulsory": true},
                {"id": 8, "item": "Repeat if necessary", "completed": true, "is_compulsory": true}
            ]
        },
        {
            "section": "follow_up",
            "completed": true,
            "items": [
                {"id": 9, "item": "Monitor breathing", "completed": true, "is_compulsory": true},
                {"id": 10, "item": "Seek medical attention", "completed": true, "is_compulsory": true},
                {"id": 11, "item": "Document incident", "completed": true, "is_compulsory": false}
            ]
        }
    ]'::jsonb,
    'Instructor Name',
    'Outstanding adult choking response!',
    NOW() - INTERVAL '1 day',
    1000, -- 16.7 minutes
    NOW() - INTERVAL '1 day' - INTERVAL '17 minutes',
    NOW() - INTERVAL '1 day',
    'Perfect technique for adult choking management',
    0,
    false,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    false
FROM profiles p
LEFT JOIN jobs j ON p.job_position_id = j.id
WHERE p.name ILIKE '%SYAMSUL HARDY BIN RAMLAN%' 
  AND p.roles = 'user'
  AND p.user_type = 'participant'
  AND p.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM checklist_result cr 
    WHERE cr.participant_id = p.id AND cr.checklist_type = 'adult choking'
  );

-- Verify the inserted data
SELECT 
    'Test Submissions' as table_name,
    user_name,
    test_type,
    correct_answers,
    total_questions,
    ROUND((correct_answers::DECIMAL / total_questions) * 100, 1) as percentage,
    submitted_at
FROM test_submissions 
WHERE user_name ILIKE '%ANGELINA RURAN SIGAR%' 
   OR user_name ILIKE '%YONG ZILING%'
   OR user_name ILIKE '%SYAMSUL HARDY BIN RAMLAN%'
ORDER BY user_name, test_type;

SELECT 
    'Checklist Results' as table_name,
    participant_name,
    checklist_type,
    completed_items,
    total_items,
    completion_percentage,
    status,
    submitted_at
FROM checklist_result 
WHERE participant_name ILIKE '%ANGELINA RURAN SIGAR%' 
   OR participant_name ILIKE '%YONG ZILING%'
   OR participant_name ILIKE '%SYAMSUL HARDY BIN RAMLAN%'
ORDER BY participant_name, checklist_type;
