# Step-by-Step Guide to Fix NULL Categories

## Method 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Open your Supabase project
   - Navigate to "SQL Editor" in the left sidebar

2. **Run the SQL Command**
   - Copy and paste this command:
   ```sql
   UPDATE profiles 
   SET category = j.category
   FROM jobs j
   WHERE profiles.job_position_id = j.id 
     AND profiles.category IS NULL;
   ```

3. **Click "Run"**
   - The command will update all NULL categories at once

4. **Verify the Results**
   - Run this to check:
   ```sql
   SELECT 
       COUNT(*) as total_profiles,
       COUNT(CASE WHEN category = 'Clinical' THEN 1 END) as clinical_count,
       COUNT(CASE WHEN category = 'Non-Clinical' THEN 1 END) as non_clinical_count,
       COUNT(CASE WHEN category IS NULL THEN 1 END) as null_count
   FROM profiles;
   ```

## Method 2: If Method 1 Doesn't Work

1. **Check if profiles have job_position_id**
   ```sql
   SELECT id, name, job_position_id, category 
   FROM profiles 
   WHERE category IS NULL 
   LIMIT 5;
   ```

2. **If job_position_id is NULL, update it first**
   ```sql
   -- This will match profiles by job_position_name to jobs table
   UPDATE profiles 
   SET job_position_id = j.id
   FROM jobs j
   WHERE profiles.job_position_name ILIKE '%' || j.name || '%'
     AND profiles.job_position_id IS NULL;
   ```

3. **Then update categories**
   ```sql
   UPDATE profiles 
   SET category = j.category
   FROM jobs j
   WHERE profiles.job_position_id = j.id 
     AND profiles.category IS NULL;
   ```

## Method 3: Manual Update (Only if needed)

If the above methods don't work, you can update specific profiles:

```sql
-- Update specific profiles manually
UPDATE profiles 
SET category = 'Clinical' 
WHERE job_position_name ILIKE '%jururawat%' 
   OR job_position_name ILIKE '%perubatan%'
   OR job_position_name ILIKE '%farmasi%'
   OR job_position_name ILIKE '%pergigian%'
   AND category IS NULL;

UPDATE profiles 
SET category = 'Non-Clinical' 
WHERE job_position_name ILIKE '%tadbir%' 
   OR job_position_name ILIKE '%khidmat%'
   OR job_position_name ILIKE '%jurutera%'
   AND category IS NULL;
```

## Troubleshooting

- **If you get permission errors**: Make sure you're logged in as the project owner
- **If the update shows 0 rows affected**: Check if job_position_id is properly set
- **If categories are still NULL**: The job names might not match exactly
