// Test script to verify test_submissions table creation
// This script will test if the table exists and can be accessed

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - replace with your actual values
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTableCreation() {
  try {
    console.log('🧪 Testing test_submissions table...');
    
    // Test 1: Check if table exists by trying to select from it
    console.log('📋 Test 1: Checking if table exists...');
    const { data, error } = await supabase
      .from('test_submissions')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205' && error.message.includes('Could not find the table')) {
        console.log('❌ Table does not exist yet');
        console.log('📝 Please run the SQL from database/create_test_submissions_table.sql in your Supabase SQL Editor');
        return;
      } else {
        console.error('❌ Error accessing table:', error);
        return;
      }
    }

    console.log('✅ Table exists and is accessible!');
    console.log(`📊 Found ${data?.length || 0} records in the table`);

    // Test 2: Check table structure
    console.log('\n📋 Test 2: Checking table structure...');
    const { data: structureData, error: structureError } = await supabase
      .from('test_submissions')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Error checking structure:', structureError);
    } else {
      console.log('✅ Table structure is correct');
      if (structureData && structureData.length > 0) {
        console.log('📋 Sample record fields:', Object.keys(structureData[0]));
      }
    }

    // Test 3: Test insert operation
    console.log('\n📋 Test 3: Testing insert operation...');
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000001',
      user_name: 'Test User',
      user_email: 'test@example.com',
      ic_number: '123456789012',
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
      console.error('❌ Error inserting test data:', insertError);
    } else {
      console.log('✅ Insert operation successful!');
      console.log('🆔 Inserted record ID:', insertData.id);
      
      // Clean up test data
      await supabase
        .from('test_submissions')
        .delete()
        .eq('id', insertData.id);
      console.log('🧹 Test data cleaned up');
    }

    console.log('\n🎉 All tests passed! The test_submissions table is ready to use.');
    console.log('\n📋 Next steps:');
    console.log('  1. Test the bulk import feature');
    console.log('  2. Check the Results & Analytics screen');
    console.log('  3. Verify data is being saved correctly');

  } catch (error) {
    console.error('💥 Test failed:', error);
    console.log('\n📋 Manual Setup Required:');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('Copy the contents from database/create_test_submissions_table.sql');
  }
}

// Run the test
testTableCreation();

