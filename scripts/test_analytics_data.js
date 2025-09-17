// Test script to verify analytics data is being fetched from Supabase
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://your-project.supabase.co'; // Replace with your actual URL
const supabaseKey = 'your-anon-key'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnalyticsData() {
  try {
    console.log('Testing analytics data fetch from Supabase...');
    
    // Test 1: Check if test_submissions table exists and has data
    console.log('\n1. Checking test_submissions table...');
    const { data: submissions, error: submissionsError } = await supabase
      .from('test_submissions')
      .select('*')
      .eq('is_completed', true)
      .order('submitted_at', { ascending: false })
      .limit(10);

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return;
    }

    console.log(`Found ${submissions?.length || 0} completed submissions`);
    if (submissions && submissions.length > 0) {
      console.log('Sample submission:', {
        id: submissions[0].id,
        user_name: submissions[0].user_name,
        test_type: submissions[0].test_type,
        score: submissions[0].score,
        job_category: submissions[0].job_category
      });
    }

    // Test 2: Check analytics summary
    console.log('\n2. Checking analytics summary...');
    const { data: analyticsData, error: analyticsError } = await supabase
      .rpc('get_analytics_summary');

    if (analyticsError) {
      console.log('Analytics function not available, using manual calculation...');
      
      // Manual calculation
      const preTestCount = submissions?.filter(s => s.test_type === 'pre_test').length || 0;
      const postTestCount = submissions?.filter(s => s.test_type === 'post_test').length || 0;
      const uniqueUsers = new Set(submissions?.map(s => s.user_id) || []).size;
      
      console.log('Manual analytics summary:', {
        totalParticipants: uniqueUsers,
        preTestParticipants: preTestCount,
        postTestParticipants: postTestCount,
        totalSubmissions: submissions?.length || 0
      });
    } else {
      console.log('Analytics summary:', analyticsData);
    }

    // Test 3: Check data structure
    console.log('\n3. Checking data structure...');
    if (submissions && submissions.length > 0) {
      const sample = submissions[0];
      console.log('Required fields present:', {
        id: !!sample.id,
        user_id: !!sample.user_id,
        user_name: !!sample.user_name,
        user_email: !!sample.user_email,
        test_type: !!sample.test_type,
        score: typeof sample.score === 'number',
        total_questions: typeof sample.total_questions === 'number',
        correct_answers: typeof sample.correct_answers === 'number',
        time_taken_seconds: typeof sample.time_taken_seconds === 'number',
        submitted_at: !!sample.submitted_at,
        job_category: !!sample.job_category
      });
    }

    console.log('\n✅ Analytics data test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing analytics data:', error);
  }
}

// Run the test
testAnalyticsData();
