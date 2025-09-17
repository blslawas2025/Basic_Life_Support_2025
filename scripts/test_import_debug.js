// Debug script to test import functionality
// This will help identify why data isn't saving to Supabase

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - replace with your actual values
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugImport() {
  try {
    console.log('🔍 Debugging import process...');
    
    // Step 1: Check if test_submissions table exists and is accessible
    console.log('\n📋 Step 1: Checking test_submissions table...');
    const { data: tableData, error: tableError } = await supabase
      .from('test_submissions')
      .select('id, user_name, test_type, score')
      .limit(5);
    
    if (tableError) {
      console.error('❌ Table access error:', tableError);
      return;
    }
    
    console.log('✅ Table accessible');
    console.log(`📊 Current records: ${tableData?.length || 0}`);
    if (tableData && tableData.length > 0) {
      console.log('📋 Sample records:');
      tableData.forEach(record => {
        console.log(`  - ${record.user_name}: ${record.test_type} = ${record.score}`);
      });
    }
    
    // Step 2: Check profiles table
    console.log('\n📋 Step 2: Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name, user_type, status')
      .eq('user_type', 'participant')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Profiles access error:', profilesError);
      return;
    }
    
    console.log('✅ Profiles accessible');
    console.log(`👥 Participant profiles: ${profiles?.length || 0}`);
    if (profiles && profiles.length > 0) {
      console.log('📋 Sample profiles:');
      profiles.forEach(profile => {
        console.log(`  - ${profile.email}: ${profile.name} (${profile.status})`);
      });
    }
    
    // Step 3: Test manual insert
    console.log('\n📋 Step 3: Testing manual insert...');
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000001',
      user_name: 'Debug Test User',
      user_email: 'debug@example.com',
      ic_number: '123456-12-1234',
      job_position_name: 'Test Position',
      job_category: 'Clinical',
      test_type: 'pre_test',
      score: 25,
      total_questions: 30,
      correct_answers: 25,
      time_taken_seconds: 1200,
      submitted_at: new Date().toISOString(),
      is_completed: true,
      attempt_number: 1,
      can_retake: false,
      results_released: true,
      results_released_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('test_submissions')
      .insert([testData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ Manual insert successful');
      console.log('🆔 Inserted record ID:', insertData.id);
      
      // Clean up test data
      await supabase
        .from('test_submissions')
        .delete()
        .eq('id', insertData.id);
      console.log('🧹 Test data cleaned up');
    }
    
    // Step 4: Test with actual profile data
    console.log('\n📋 Step 4: Testing with real profile...');
    if (profiles && profiles.length > 0) {
      const realProfile = profiles[0];
      console.log(`🧪 Testing with profile: ${realProfile.email}`);
      
      const realTestData = {
        user_id: realProfile.id,
        user_name: realProfile.name,
        user_email: realProfile.email,
        ic_number: '123456-12-1234',
        job_position_name: 'Test Position',
        job_category: 'Clinical',
        test_type: 'pre_test',
        score: 20,
        total_questions: 30,
        correct_answers: 20,
        time_taken_seconds: 1000,
        submitted_at: new Date().toISOString(),
        is_completed: true,
        attempt_number: 1,
        can_retake: false,
        results_released: true,
        results_released_at: new Date().toISOString()
      };
      
      const { data: realInsertData, error: realInsertError } = await supabase
        .from('test_submissions')
        .insert([realTestData])
        .select()
        .single();
      
      if (realInsertError) {
        console.error('❌ Real profile insert error:', realInsertError);
      } else {
        console.log('✅ Real profile insert successful');
        console.log('🆔 Inserted record ID:', realInsertData.id);
        
        // Clean up
        await supabase
          .from('test_submissions')
          .delete()
          .eq('id', realInsertData.id);
        console.log('🧹 Real test data cleaned up');
      }
    }
    
    console.log('\n🎉 Debug completed!');
    console.log('\n📋 Next steps:');
    console.log('1. If manual insert works, the issue is in the BulkImportService');
    console.log('2. If manual insert fails, check table permissions');
    console.log('3. If profiles are missing, check user registration');
    
  } catch (error) {
    console.error('💥 Debug failed:', error);
  }
}

// Run the debug
debugImport();

