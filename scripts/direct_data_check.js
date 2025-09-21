// Direct data check using existing Supabase connection
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking Supabase data directly...\n');

  try {
    // Check profiles table
    console.log('📋 Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, ic_number, job_position_name, category, user_type')
      .eq('user_type', 'participant')
      .limit(5);

    if (profilesError) {
      console.error('❌ Profiles error:', profilesError);
    } else {
      console.log(`✅ Found ${profiles.length} sample profiles:`);
      profiles.forEach(profile => {
        console.log(`  ${profile.name} - Category: ${profile.category || 'NULL'}`);
      });
    }

    // Check test_submissions table
    console.log('\n📋 Checking test_submissions table...');
    const { data: submissions, error: submissionsError } = await supabase
      .from('test_submissions')
      .select('id, user_name, job_category, test_type, submitted_at')
      .limit(5);

    if (submissionsError) {
      console.error('❌ Submissions error:', submissionsError);
    } else {
      console.log(`✅ Found ${submissions.length} sample test submissions:`);
      submissions.forEach(submission => {
        console.log(`  ${submission.user_name} - Category: ${submission.job_category || 'NULL'} (${submission.test_type})`);
      });
    }

    // Check ALVIN DULAMIT specifically
    console.log('\n🔍 Checking ALVIN DULAMIT specifically...');
    const { data: alvinProfile, error: alvinProfileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('name', '%alvin%dulamit%')
      .single();

    if (alvinProfileError) {
      console.log('❌ ALVIN DULAMIT profile error:', alvinProfileError.message);
    } else if (alvinProfile) {
      console.log('✅ ALVIN DULAMIT profile found:');
      console.log(`  Name: ${alvinProfile.name}`);
      console.log(`  Category: ${alvinProfile.category || 'NULL'}`);
      console.log(`  Job Position: ${alvinProfile.job_position_name || 'NULL'}`);
      console.log(`  User Type: ${alvinProfile.user_type || 'NULL'}`);

      // Check his test submissions
      const { data: alvinSubmissions, error: alvinSubmissionsError } = await supabase
        .from('test_submissions')
        .select('*')
        .eq('user_id', alvinProfile.id);

      if (alvinSubmissionsError) {
        console.log('❌ ALVIN DULAMIT submissions error:', alvinSubmissionsError.message);
      } else if (alvinSubmissions && alvinSubmissions.length > 0) {
        console.log(`✅ ALVIN DULAMIT has ${alvinSubmissions.length} test submissions:`);
        alvinSubmissions.forEach(submission => {
          console.log(`  ${submission.test_type}: Category = ${submission.job_category || 'NULL'}, Score = ${submission.correct_answers}/${submission.total_questions}`);
        });
      } else {
        console.log('❌ ALVIN DULAMIT has no test submissions');
      }
    } else {
      console.log('❌ ALVIN DULAMIT not found in profiles');
    }

    // Check category distribution
    console.log('\n📊 Checking category distribution...');
    const { data: profileCategories, error: profileCategoriesError } = await supabase
      .from('profiles')
      .select('category')
      .eq('user_type', 'participant');

    if (!profileCategoriesError && profileCategories) {
      const categoryCount = {};
      profileCategories.forEach(profile => {
        const category = profile.category || 'NULL';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
      
      console.log('Profile categories:');
      Object.entries(categoryCount).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });
    }

    const { data: submissionCategories, error: submissionCategoriesError } = await supabase
      .from('test_submissions')
      .select('job_category');

    if (!submissionCategoriesError && submissionCategories) {
      const categoryCount = {};
      submissionCategories.forEach(submission => {
        const category = submission.job_category || 'NULL';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
      
      console.log('Test submission categories:');
      Object.entries(categoryCount).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });
    }

    console.log('\n✅ Data check completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkData();
