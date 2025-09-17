// Check certificate count and identify duplicates
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCertificateCount() {
  try {
    console.log('🔍 Checking certificate count in database...');
    
    // Get all test submissions
    const { data: submissions, error } = await supabase
      .from('test_submissions')
      .select('id, user_email, test_type, score, total_questions, submitted_at')
      .eq('is_completed', true)
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching submissions:', error);
      return;
    }
    
    console.log(`📊 Total submissions found: ${submissions?.length || 0}`);
    
    // Count by test type
    const preTestCount = submissions?.filter(s => s.test_type === 'pre_test').length || 0;
    const postTestCount = submissions?.filter(s => s.test_type === 'post_test').length || 0;
    
    console.log(`📊 Pre-test submissions: ${preTestCount}`);
    console.log(`📊 Post-test submissions: ${postTestCount}`);
    console.log(`📊 Total: ${preTestCount + postTestCount}`);
    
    // Check for duplicates by email and test type
    const emailTestMap = new Map();
    const duplicates = [];
    
    submissions?.forEach(submission => {
      const key = `${submission.user_email}_${submission.test_type}`;
      if (emailTestMap.has(key)) {
        duplicates.push({
          email: submission.user_email,
          testType: submission.test_type,
          id1: emailTestMap.get(key).id,
          id2: submission.id,
          score1: emailTestMap.get(key).score,
          score2: submission.score
        });
      } else {
        emailTestMap.set(key, submission);
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`\n❌ Found ${duplicates.length} duplicate entries:`);
      duplicates.forEach(dup => {
        console.log(`  - ${dup.email} (${dup.testType}): IDs ${dup.id1} & ${dup.id2}, Scores ${dup.score1} & ${dup.score2}`);
      });
    } else {
      console.log('\n✅ No duplicates found');
    }
    
    // Show unique participants
    const uniqueEmails = new Set(submissions?.map(s => s.user_email) || []);
    console.log(`\n👥 Unique participants: ${uniqueEmails.size}`);
    
    // Show recent submissions
    console.log('\n📋 Recent submissions (last 10):');
    submissions?.slice(0, 10).forEach(sub => {
      console.log(`  - ${sub.user_email}: ${sub.test_type} = ${sub.score}/${sub.total_questions} (${sub.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCertificateCount();
