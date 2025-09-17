# Assign All Profiles to BLS Siri 1 2025

This guide shows you how to assign all existing profiles with user roles to the "BLS Siri 1 2025" course session.

## 🚀 Quick Methods

### Method 1: SQL Script (Fastest)
Run this SQL script directly in your Supabase SQL editor:

```sql
-- Assign all profiles with user roles to BLS Siri 1 2025
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
```

### Method 2: JavaScript Console Script
1. Update the credentials in `scripts/run-assignment.js`
2. Run: `node scripts/run-assignment.js`

### Method 3: From Your App
Add this to any screen in your app:

```typescript
import { assignAllToSiri1 } from './utils/assignToSiri1';

// Call this function
assignAllToSiri1();
```

### Method 4: Admin Button Component
Add the `AssignToSiri1Button` component to any admin screen:

```tsx
import AssignToSiri1Button from '../components/AssignToSiri1Button';

// In your component
<AssignToSiri1Button onComplete={(result) => {
  console.log('Assignment completed:', result);
}} />
```

## 📊 What This Does

- **Finds** the "BLS Siri 1 2025" course session
- **Updates** all profiles with user roles (`participant`, `staff`, `admin`, `super_admin`)
- **Assigns** them to the BLS Siri 1 2025 course session
- **Shows** statistics and breakdown by user type
- **Skips** profiles that already have a course session assigned

## 🔍 Verification

After running the assignment, you can verify it worked by running this SQL:

```sql
-- Check how many profiles are assigned to each course session
SELECT 
    cs.full_name,
    COUNT(p.id) as participant_count
FROM course_sessions cs
LEFT JOIN profiles p ON cs.id = p.course_session_id 
    AND p.user_type IN ('participant', 'staff', 'admin', 'super_admin')
GROUP BY cs.id, cs.full_name
ORDER BY participant_count DESC;
```

## ⚠️ Important Notes

1. **Backup First**: Make sure you have a backup of your database before running bulk updates
2. **Test Environment**: Test this on a development environment first
3. **Course Session Must Exist**: The "BLS Siri 1 2025" course session must exist in your `course_sessions` table
4. **Only Updates Null Values**: Only profiles without a `course_session_id` will be updated
5. **User Roles Only**: Only profiles with user roles (not system accounts) will be updated

## 🛠️ Troubleshooting

### "Course session not found"
- Make sure you've run the course sessions migration
- Check that "BLS Siri 1 2025" exists in your `course_sessions` table

### "No profiles to update"
- All profiles already have course sessions assigned
- Check your profiles table to see current assignments

### "Permission denied"
- Make sure your Supabase credentials have the right permissions
- Check that your RLS policies allow updates

## 📈 Expected Results

After running the assignment, you should see:
- All existing profiles assigned to "BLS Siri 1 2025"
- Participant counts updated in the course sessions table
- Clear breakdown by user type (participant, staff, admin, super_admin)

## 🔄 Undo Assignment

If you need to undo the assignment:

```sql
-- Remove course session assignment from all profiles
UPDATE profiles 
SET 
    course_session_id = NULL,
    updated_at = NOW()
WHERE 
    user_type IN ('participant', 'staff', 'admin', 'super_admin')
    AND course_session_id = (
        SELECT id 
        FROM course_sessions 
        WHERE full_name = 'BLS Siri 1 2025' 
        LIMIT 1
    );
```

## 📝 Next Steps

After assigning profiles to Siri 1:
1. **Test the registration flow** to make sure course session selection works
2. **Create additional course sessions** for future dates
3. **Update other screens** to filter by course session
4. **Set up course session management** for admins

This will give you a clean starting point where all existing profiles are assigned to the first course session, and new registrations can choose from available sessions.
