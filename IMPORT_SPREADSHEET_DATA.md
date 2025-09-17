# 📊 Import Spreadsheet Data Guide

## 🎯 **Your Spreadsheet Data**

I can see you have a spreadsheet with 55 participants containing:
- **Email addresses** (gmail.com, moh.gov.my, yahoo.com.my)
- **Full names** (in uppercase)
- **IC numbers** (formatted as ######-##-####)
- **Pre-test scores** (9-28 out of 30)
- **Post-test scores** (14-30 out of 30)

## 🚀 **How to Import Your Data**

### **Method 1: Use the Bulk Import Screen (Recommended)**

1. **First, make sure the test_submissions table exists:**
   - Go to Supabase Dashboard → SQL Editor
   - Run the contents of `database/minimal_test_submissions.sql`

2. **Convert your spreadsheet to CSV:**
   - Save your Excel/spreadsheet as CSV format
   - Make sure the columns are: `email,name,ic,pre_test,post_test`

3. **Use the Bulk Import feature:**
   - Go to Results & Analytics screen
   - Click "Bulk Import" button
   - Paste your CSV data into the text area
   - Click "Parse Data" to preview
   - Click "Import Data" to save to Supabase

### **Method 2: Use the Import Script**

1. **Update the script with your data:**
   - Edit `scripts/import_spreadsheet_data.js`
   - Replace the `spreadsheetData` array with your actual data
   - Update Supabase credentials

2. **Run the script:**
   ```bash
   node scripts/import_spreadsheet_data.js
   ```

## 📋 **CSV Format Required**

Your CSV should look like this:
```csv
email,name,ic,pre_test,post_test
christinapadin22@gmail.com,CHRISTINA PADIN,123456-12-1234,13,23
fizraivy@gmail.com,FIZRA IVY WAS,123456-12-1235,17,23
gracee8788@gmail.com,GRACE RURAN NGILO,123456-12-1236,14,25
```

## ✅ **What Gets Imported**

For each participant, the system will:
1. **Find matching profile** by email address
2. **Get job category** from the jobs table
3. **Create pre-test record** with score and details
4. **Create post-test record** with score and details
5. **Save to test_submissions table** in Supabase

## 🎯 **Expected Results**

After import, you'll have:
- **110 records** in test_submissions (55 pre-test + 55 post-test)
- **Complete participant information** (name, IC, job, category)
- **Test scores** ready for analytics
- **Data visible** in Results & Analytics screen

## 🔧 **Troubleshooting**

**If participants aren't found:**
- Check that email addresses match exactly
- Ensure participants are approved in the profiles table
- Verify user_type is 'participant'

**If import fails:**
- Check that test_submissions table exists
- Verify Supabase credentials
- Check console for error messages

## 📊 **Sample Data Included**

I've created `data/sample_test_results.csv` with the first 8 participants from your spreadsheet as an example.

Ready to import your data? Let me know if you need help with any step!

