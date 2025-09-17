// Import spreadsheet data into test_submissions table
// This script processes the CSV data from your spreadsheet

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - replace with your actual values
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data from your spreadsheet (first 10 rows as example)
const spreadsheetData = [
  { email: 'christinapadin22@gmail.com', name: 'CHRISTINA PADIN', ic: '123456-12-1234', preTest: 13, postTest: 23 },
  { email: 'fizraivy@gmail.com', name: 'FIZRA IVY WAS', ic: '123456-12-1235', preTest: 17, postTest: 23 },
  { email: 'gracee8788@gmail.com', name: 'GRACE RURAN NGILO', ic: '123456-12-1236', preTest: 14, postTest: 25 },
  { email: 'mansurmurni22@gmail.com', name: 'MANSUR BIN MURNI', ic: '123456-12-1237', preTest: 20, postTest: 24 },
  { email: 'norbaizurah1994@gmail.com', name: 'NOR BAIZURAH BINTI MASLIM', ic: '123456-12-1238', preTest: 15, postTest: 22 },
  { email: 'rajami5119@gmail.com', name: 'RAJAMI BIN ABDUL HASHIM', ic: '123456-12-1239', preTest: 10, postTest: 19 },
  { email: 'sadiusop7581@gmail.com', name: 'SA\'DI BIN USOP', ic: '123456-12-1240', preTest: 15, postTest: 14 },
  { email: 'c.thyreen2021@gmail.com', name: 'CATHERINE JOHN', ic: '123456-12-1241', preTest: 18, postTest: 26 },
  // Add more rows as needed...
];

async function importSpreadsheetData() {
  try {
    console.log('🚀 Starting spreadsheet data import...');
    console.log(`📊 Processing ${spreadsheetData.length} records...`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // First, get all profiles to match with spreadsheet data
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name, ic_number, job_position_name, job_position_id')
      .eq('user_type', 'participant')
      .eq('status', 'approved');
    
    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }
    
    console.log(`👥 Found ${profiles?.length || 0} profiles in database`);
    
    // Create email lookup map
    const emailMap = new Map();
    profiles?.forEach(profile => {
      if (profile.email) {
        emailMap.set(profile.email.toLowerCase(), profile);
      }
    });
    
    // Process each row from spreadsheet
    for (let i = 0; i < spreadsheetData.length; i++) {
      const row = spreadsheetData[i];
      const rowNumber = i + 1;
      
      try {
        console.log(`\n📝 Processing row ${rowNumber}: ${row.email}`);
        
        // Find matching profile
        const profile = emailMap.get(row.email.toLowerCase());
        
        if (!profile) {
          console.log(`⚠️  No profile found for ${row.email}`);
          errors.push(`Row ${rowNumber}: No profile found for ${row.email}`);
          errorCount++;
          continue;
        }
        
        console.log(`✅ Found profile: ${profile.name}`);
        
        // Get job category from jobs table
        let jobCategory = 'Non-Clinical'; // Default
        if (profile.job_position_id) {
          const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('category')
            .eq('id', profile.job_position_id)
            .single();
          
          if (!jobError && job) {
            jobCategory = job.category || 'Non-Clinical';
          }
        }
        
        console.log(`🏥 Job category: ${jobCategory}`);
        
        // Import pre-test result
        if (row.preTest !== null && row.preTest !== undefined) {
          console.log(`📊 Importing pre-test: ${row.preTest}/30`);
          
          const preTestData = {
            user_id: profile.id,
            user_name: profile.name,
            user_email: profile.email,
            ic_number: profile.ic_number,
            job_position_name: profile.job_position_name,
            job_category: jobCategory,
            test_type: 'pre_test',
            score: row.preTest,
            total_questions: 30,
            correct_answers: row.preTest,
            time_taken_seconds: 1200, // Default 20 minutes
            submitted_at: new Date().toISOString(),
            is_completed: true,
            attempt_number: 1,
            can_retake: false,
            results_released: true,
            results_released_at: new Date().toISOString()
          };
          
          const { error: preTestError } = await supabase
            .from('test_submissions')
            .insert([preTestData]);
          
          if (preTestError) {
            console.log(`❌ Pre-test import failed: ${preTestError.message}`);
            errors.push(`Row ${rowNumber} pre-test: ${preTestError.message}`);
          } else {
            console.log(`✅ Pre-test imported successfully`);
          }
        }
        
        // Import post-test result
        if (row.postTest !== null && row.postTest !== undefined) {
          console.log(`📊 Importing post-test: ${row.postTest}/30`);
          
          const postTestData = {
            user_id: profile.id,
            user_name: profile.name,
            user_email: profile.email,
            ic_number: profile.ic_number,
            job_position_name: profile.job_position_name,
            job_category: jobCategory,
            test_type: 'post_test',
            score: row.postTest,
            total_questions: 30,
            correct_answers: row.postTest,
            time_taken_seconds: 1000, // Default 16.7 minutes
            submitted_at: new Date().toISOString(),
            is_completed: true,
            attempt_number: 1,
            can_retake: false,
            results_released: true,
            results_released_at: new Date().toISOString()
          };
          
          const { error: postTestError } = await supabase
            .from('test_submissions')
            .insert([postTestData]);
          
          if (postTestError) {
            console.log(`❌ Post-test import failed: ${postTestError.message}`);
            errors.push(`Row ${rowNumber} post-test: ${postTestError.message}`);
          } else {
            console.log(`✅ Post-test imported successfully`);
          }
        }
        
        successCount++;
        
      } catch (rowError) {
        console.log(`❌ Error processing row ${rowNumber}: ${rowError.message}`);
        errors.push(`Row ${rowNumber}: ${rowError.message}`);
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n🎉 Import completed!');
    console.log(`✅ Successfully processed: ${successCount} records`);
    console.log(`❌ Errors: ${errorCount} records`);
    
    if (errors.length > 0) {
      console.log('\n📋 Error details:');
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Verify import
    const { data: importedData, error: verifyError } = await supabase
      .from('test_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!verifyError && importedData) {
      console.log(`\n📊 Verification: Found ${importedData.length} records in test_submissions table`);
      console.log('📋 Sample records:');
      importedData.forEach(record => {
        console.log(`  - ${record.user_name}: ${record.test_type} = ${record.score}/30`);
      });
    }
    
  } catch (error) {
    console.error('💥 Import failed:', error);
  }
}

// Run the import
importSpreadsheetData();

