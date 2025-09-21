# Direct Supabase Data Fix Guide
## Fix All Issues Through Supabase Dashboard (No SQL Required)

You're absolutely right! You can fix all the data issues directly from the Supabase dashboard. Here's how to do it step by step:

## 🔧 **METHOD 1: Table Editor (Easiest)**

### **Step 1: Fix NULL Categories in Profiles Table**

1. **Go to Supabase Dashboard** → **Table Editor** → **profiles**
2. **Filter for NULL categories:**
   - Click the filter icon
   - Select column: `category`
   - Operator: `is`
   - Value: `null`
3. **For each record with NULL category:**
   - Click on the record
   - Set `category` to:
     - `Clinical` for: JURURAWAT, PEGAWAI PERGIGIAN, PEGAWAI PERUBATAN, etc.
     - `Non-Clinical` for: PEGAWAI FARMASI, JURUTEKNOLOGI, JURUPULIH, etc.

### **Step 2: Fix Test Submissions Job Categories**

1. **Go to Table Editor** → **test_submissions**
2. **Filter for mismatched categories:**
   - Look for records where `job_category` doesn't match the user's profile category
3. **Update job_category to match the profile:**
   - Click on each record
   - Set `job_category` to match the user's profile category

### **Step 3: Fix Invalid Test Scores**

1. **Go to Table Editor** → **test_submissions**
2. **Filter for invalid scores:**
   - `score < 0` or `score > total_questions`
   - `correct_answers < 0` or `correct_answers > total_questions`
3. **Fix each record:**
   - Set negative scores to `0`
   - Set scores > total_questions to `total_questions`
   - Set negative correct_answers to `0`
   - Set correct_answers > total_questions to `total_questions`

### **Step 4: Fix NULL Values in Critical Fields**

1. **Go to Table Editor** → **profiles**
2. **Filter for NULL values:**
   - `user_type` is null
   - `status` is null
   - `payment_status` is null
3. **Set default values:**
   - `user_type`: `participant`
   - `status`: `pending`
   - `payment_status`: `pending`

## 🔧 **METHOD 2: Bulk Operations**

### **Step 1: Use Supabase's Bulk Edit Feature**

1. **Go to Table Editor** → **profiles**
2. **Select multiple records** (Ctrl+Click)
3. **Click "Edit Selected"**
4. **Bulk update categories:**
   - Select all Clinical job positions
   - Set category to `Clinical`
   - Select all Non-Clinical job positions
   - Set category to `Non-Clinical`

### **Step 2: Use Filters for Bulk Updates**

1. **Filter by job_position_name:**
   - Clinical: `job_position_name` contains `JURURAWAT`
   - Update all to `category = Clinical`
   - Repeat for other Clinical positions

2. **Filter by job_position_name:**
   - Non-Clinical: `job_position_name` contains `PEGAWAI FARMASI`
   - Update all to `category = Non-Clinical`
   - Repeat for other Non-Clinical positions

## 🔧 **METHOD 3: Data Import/Export**

### **Step 1: Export Data**

1. **Go to Table Editor** → **profiles**
2. **Click "Export"** → **CSV**
3. **Download the CSV file**

### **Step 2: Fix in Excel/Google Sheets**

1. **Open the CSV file**
2. **Fix the data:**
   - Fill NULL categories based on job_position_name
   - Fix any other data issues
3. **Save the file**

### **Step 3: Import Fixed Data**

1. **Go to Table Editor** → **profiles**
2. **Click "Import"** → **CSV**
3. **Upload the fixed CSV file**
4. **Choose "Upsert" to update existing records**

## 🔧 **METHOD 4: Using Supabase's SQL Editor (Simplified)**

If you prefer a few simple SQL commands:

### **Quick Fix Commands:**

```sql
-- Fix NULL categories (run these one by one)
UPDATE profiles SET category = 'Clinical' WHERE category IS NULL AND job_position_name ILIKE '%JURURAWAT%';
UPDATE profiles SET category = 'Clinical' WHERE category IS NULL AND job_position_name ILIKE '%PEGAWAI PERGIGIAN%';
UPDATE profiles SET category = 'Clinical' WHERE category IS NULL AND job_position_name ILIKE '%PEGAWAI PERUBATAN%';

UPDATE profiles SET category = 'Non-Clinical' WHERE category IS NULL AND job_position_name ILIKE '%PEGAWAI FARMASI%';
UPDATE profiles SET category = 'Non-Clinical' WHERE category IS NULL AND job_position_name ILIKE '%JURUTEKNOLOGI%';

-- Fix test scores
UPDATE test_submissions SET score = 0 WHERE score < 0;
UPDATE test_submissions SET score = total_questions WHERE score > total_questions;

-- Fix NULL values
UPDATE profiles SET user_type = 'participant' WHERE user_type IS NULL;
UPDATE profiles SET status = 'pending' WHERE status IS NULL;
```

## 📊 **Verification Steps**

After fixing, check these in the Table Editor:

1. **Profiles table:**
   - No NULL categories
   - All user_type, status, payment_status filled

2. **Test_submissions table:**
   - All scores between 0 and total_questions
   - All correct_answers between 0 and total_questions
   - job_category matches profile category

3. **Check specific records:**
   - Search for "ALVIN DULAMIT" to verify his data is fixed
   - Check a few random records to ensure consistency

## 🎯 **Recommended Approach**

**For you, I recommend Method 1 (Table Editor)** because:
- ✅ No SQL knowledge required
- ✅ Visual interface
- ✅ Can see exactly what you're changing
- ✅ Easy to verify results
- ✅ Safe and controlled

## ⚠️ **Important Tips**

1. **Start with a few records** to test the process
2. **Use filters** to work on specific groups of records
3. **Save frequently** as you make changes
4. **Check your work** by looking at the data after each change
5. **Take screenshots** of before/after if needed

## 🚀 **Quick Start**

1. **Go to Supabase Dashboard**
2. **Table Editor** → **profiles**
3. **Filter for NULL categories**
4. **Start fixing one by one**
5. **Move to test_submissions table**
6. **Fix any invalid scores**
7. **Verify everything looks correct**

This way you can fix all the data issues directly through the Supabase interface without writing any SQL! 🎉
