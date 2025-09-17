// Simple script to check test_submissions data
const { createClient } = require('@supabase/supabase-js');

// You need to replace these with your actual Supabase credentials
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTestData() {
  try {
    console.log('Checking test_submissions table...');
    
    // Check if table exists and get basic info
    const { data, error, count } = await supabase
      .from('test_submissions')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      console.error('Error:', error.message);
      if (error.code === 'PGRST205') {
        console.log('❌ test_submissions table does not exist');
        console.log('Please run the database setup scripts first');
      }
      return;
    }

    console.log(`✅ Found ${count} total records in test_submissions table`);
    
    if (data && data.length > 0) {
      console.log('\nSample data:');
      data.forEach((record, index) => {
        console.log(`${index + 1}. ${record.user_name} - ${record.test_type} - Score: ${record.score}/${record.total_questions}`);
      });
      
      // Check data distribution
      const preTestCount = data.filter(r => r.test_type === 'pre_test').length;
      const postTestCount = data.filter(r => r.test_type === 'post_test').length;
      const clinicalCount = data.filter(r => r.job_category === 'Clinical').length;
      const nonClinicalCount = data.filter(r => r.job_category === 'Non-Clinical').length;
      
      console.log('\nData distribution:');
      console.log(`- Pre-test: ${preTestCount}`);
      console.log(`- Post-test: ${postTestCount}`);
      console.log(`- Clinical: ${clinicalCount}`);
      console.log(`- Non-Clinical: ${nonClinicalCount}`);
    } else {
      console.log('❌ No data found in test_submissions table');
      console.log('You may need to import some test data first');
    }
    
  } catch (error) {
    console.error('❌ Error checking test data:', error);
  }
}

checkTestData();
