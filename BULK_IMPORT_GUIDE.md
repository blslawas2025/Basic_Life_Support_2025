# Bulk Import Test Results Guide

## 🎯 Overview
This guide shows how to import your spreadsheet test results data into the system. The data will be matched with existing profiles in Supabase and saved to the test_submissions table.

## 📊 Data Format Required

Your CSV data should have the following columns in this exact order:
```
email,name,ic,pre test,post test
```

### Example:
```csv
email,name,ic,pre test,post test
john.doe@gmail.com,JOHN DOE,123456789012,20,25
jane.smith@gmail.com,JANE SMITH,123456789013,18,22
ahmad.ali@gmail.com,AHMAD ALI,123456789014,15,28
```

## 🔧 How to Use

### Step 1: Access Bulk Import
1. Go to **Results & Analytics** screen
2. Click on **"Bulk Import"** button (purple gradient card)
3. You'll see the Bulk Import Results screen

### Step 2: Prepare Your Data
1. Copy your spreadsheet data (including headers)
2. Paste it into the text area
3. Click **"Parse Data"** to validate the format
4. Review the preview to ensure data looks correct

### Step 3: Import Results
1. Click **"Import Results"** to start the import process
2. The system will:
   - Match emails with existing profiles in Supabase
   - Validate test scores (0-30 range)
   - Save pre-test and post-test results
   - Show detailed import results

## ✅ Data Matching Process

The system matches your data with Supabase profiles using:
1. **Email address** (primary method - most reliable)
2. **IC number** (secondary method)
3. **Name** (tertiary method - less reliable)

## 📋 Validation Rules

### Email Format
- Must be valid email format
- Case insensitive matching

### Name Format
- Must be at least 2 characters
- Case insensitive matching

### IC Number Format
- Must be 12 digits: `123456789012`
- Or 6-2-4 format: `123456-12-9012`

### Test Scores
- Must be between 0 and 30
- At least one test score must be provided
- Both pre-test and post-test can be imported

## 🎯 What Gets Imported

For each matched profile, the system will:
- ✅ Save pre-test results (if score > 0)
- ✅ Save post-test results (if score > 0)
- ✅ Include all user information (name, IC, job position)
- ✅ Set proper test type (pre_test/post_test)
- ✅ Calculate pass/fail status based on job category

## 📊 Import Results

After import, you'll see:
- **Total Rows**: Number of rows processed
- **Matched Profiles**: Profiles found in Supabase
- **Imported Results**: Number of test results saved
- **Unmatched Emails**: Emails not found in profiles
- **Errors**: Any validation or import errors

## 🚨 Important Notes

### Duplicate Prevention
- The system checks for existing test results
- Won't overwrite existing pre-test or post-test results
- Shows warnings for duplicate attempts

### Data Requirements
- Profiles must exist in Supabase first
- Profiles must be approved participants
- Email addresses must match exactly (case insensitive)

### Error Handling
- Invalid data rows are skipped
- Detailed error messages are provided
- Import continues even if some rows fail

## 🔍 Troubleshooting

### Common Issues

**"No profiles matched"**
- Check that participants are registered in the system
- Verify email addresses match exactly
- Ensure profiles are approved

**"Invalid test scores"**
- Scores must be between 0 and 30
- Use numbers only (no text)

**"Missing required fields"**
- Ensure all columns are present
- Check for empty cells in required fields

### Data Format Issues
- Use comma-separated values (CSV)
- Include header row
- No extra spaces or special characters
- Use proper IC number format

## 🎉 Success!

Once imported successfully:
- ✅ All test results are saved to Supabase
- ✅ Data appears in the Results & Analytics dashboard
- ✅ Pre-test and post-test scores are tracked
- ✅ Pass/fail status is calculated automatically
- ✅ All required fields (name, IC, job, test results) are stored

## 📞 Support

If you encounter issues:
1. Check the error messages in the import results
2. Verify your data format matches the requirements
3. Ensure all participants are registered and approved
4. Try importing a small sample first

The bulk import feature makes it easy to add your spreadsheet data to the modern analytics system!

