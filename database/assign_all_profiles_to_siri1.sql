-- Assign all profiles with user roles to BLS Siri 1 2025 course session
-- This script will update all existing profiles to be assigned to the first course session

-- First, let's see what profiles we have
SELECT 
    user_type,
    COUNT(*) as count,
    COUNT(CASE WHEN course_session_id IS NOT NULL THEN 1 END) as with_course_session,
    COUNT(CASE WHEN course_session_id IS NULL THEN 1 END) as without_course_session
FROM profiles 
WHERE user_type IN ('participant', 'staff', 'admin', 'super_admin')
GROUP BY user_type
ORDER BY user_type;

-- Get the course session ID for BLS Siri 1 2025
-- (This will show the ID if the course session exists)
SELECT id, full_name, current_participants, max_participants
FROM course_sessions 
WHERE full_name = 'BLS Siri 1 2025';

-- Update all profiles with user roles to assign them to BLS Siri 1 2025
-- This uses a subquery to get the course session ID
UPDATE profiles 
SET 
    course_session_id = (
        SELECT id 
        FROM course_sessions 
        WHERE full_name = 'BLS Siri 1 2025' 
        LIMIT 1
    ),
    updated_at = NOW()
WHERE 
    user_type IN ('participant', 'staff', 'admin', 'super_admin')
    AND course_session_id IS NULL;

-- Show the results after update
SELECT 
    'After Update' as status,
    user_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN course_session_id IS NOT NULL THEN 1 END) as with_course_session,
    COUNT(CASE WHEN course_session_id IS NULL THEN 1 END) as without_course_session
FROM profiles 
WHERE user_type IN ('participant', 'staff', 'admin', 'super_admin')
GROUP BY user_type
ORDER BY user_type;

-- Show course session participant counts
SELECT 
    cs.full_name,
    cs.current_participants,
    cs.max_participants,
    COUNT(p.id) as actual_participants
FROM course_sessions cs
LEFT JOIN profiles p ON cs.id = p.course_session_id 
    AND p.user_type IN ('participant', 'staff', 'admin', 'super_admin')
WHERE cs.full_name = 'BLS Siri 1 2025'
GROUP BY cs.id, cs.full_name, cs.current_participants, cs.max_participants;

-- Show some sample updated profiles
SELECT 
    name,
    email,
    user_type,
    course_session_id,
    created_at
FROM profiles 
WHERE course_session_id IS NOT NULL
    AND user_type IN ('participant', 'staff', 'admin', 'super_admin')
ORDER BY created_at DESC
LIMIT 10;
