// Simple import test to verify the process works
// This tests the exact same flow as the BulkImportResultsScreen

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - using the same credentials as the app
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data from your spreadsheet
const testData = [
  { email: 'christinapadin22@gmail.com', name: 'CHRISTINA PADIN', ic: '123456-12-1234', preTest: 13, postTest: 23 },
  { email: 'fizraivy@gmail.com', name: 'FIZRA IVY WAS', ic: '123456-12-1235', preTest: 17, postTest: 23 },
  { email: 'gracee8788@gmail.com', name: 'GRACE RURAN NGILO', ic: '123456-12-1236', preTest: 14, postTest: 25 }
];

async function testImport() {
  try {
    console.log('🧪 Testing import process...');
    
    // Step 1: Get profiles
    console.log('\n📋 Step 1: Fetching profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name, ic_number, job_position_name, job_position_id')
      .eq('user_type', 'participant')
      .eq('status', 'approved');
    
    if (profilesError) {
      console.error('❌ Profiles error:', profilesError);
      return;
    }
    
    console.log(`✅ Found ${profiles?.length || 0} profiles`);
    
    // Step 2: Create email lookup
    const emailMap = new Map();
    profiles?.forEach(profile => {
      if (profile.email) {
        emailMap.set(profile.email.toLowerCase(), profile);
      }
    });
    
    console.log(`📧 Email lookup map created with ${emailMap.size} entries`);
    
    // Step 3: Test each row
    for (let i = 0; i < testData.length; i++) {
      const row = testData[i];
      console.log(`\n📝 Testing row ${i + 1}: ${row.email}`);
      
      // Check if profile exists
      const profile = emailMap.get(row.email.toLowerCase());
      if (!profile) {
        console.log(`⚠️  No profile found for ${row.email}`);
        continue;
      }
      
      console.log(`✅ Found profile: ${profile.name} (${profile.id})`);
      
      // Get job category
      let jobCategory = 'Non-Clinical';
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
      
      // Test pre-test insert
      if (row.preTest > 0) {
        console.log(`📊 Inserting pre-test: ${row.preTest}/30`);
        
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
          time_taken_seconds: 1200,
          submitted_at: new Date().toISOString(),
          is_completed: true,
          attempt_number: 1,
          can_retake: false,
          results_released: true,
          results_released_at: new Date().toISOString()
        };
        
        const { data: preTestResult, error: preTestError } = await supabase
          .from('test_submissions')
          .insert([preTestData])
          .select()
          .single();
        
        if (preTestError) {
          console.log(`❌ Pre-test insert failed: ${preTestError.message}`);
        } else {
          console.log(`✅ Pre-test inserted: ${preTestResult.id}`);
        }
      }
      
      // Test post-test insert
      if (row.postTest > 0) {
        console.log(`📊 Inserting post-test: ${row.postTest}/30`);
        
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
          time_taken_seconds: 1000,
          submitted_at: new Date().toISOString(),
          is_completed: true,
          attempt_number: 1,
          can_retake: false,
          results_released: true,
          results_released_at: new Date().toISOString()
        };
        
        const { data: postTestResult, error: postTestError } = await supabase
          .from('test_submissions')
          .insert([postTestData])
          .select()
          .single();
        
        if (postTestError) {
          console.log(`❌ Post-test insert failed: ${postTestError.message}`);
        } else {
          console.log(`✅ Post-test inserted: ${postTestResult.id}`);
        }
      }
    }
    
    // Step 4: Verify results
    console.log('\n📊 Verifying results...');
    const { data: allResults, error: verifyError } = await supabase
      .from('test_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (verifyError) {
      console.error('❌ Verify error:', verifyError);
    } else {
      console.log(`✅ Found ${allResults?.length || 0} total records in test_submissions`);
      if (allResults && allResults.length > 0) {
        console.log('📋 Recent records:');
        allResults.forEach(record => {
          console.log(`  - ${record.user_name}: ${record.test_type} = ${record.score}/30`);
        });
      }
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testImport();
