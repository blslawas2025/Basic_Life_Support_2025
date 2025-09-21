// Audit all participants data in Supabase
// This script will check for data mismatches across all participants

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditAllParticipants() {
  console.log('🔍 Starting comprehensive data audit...\n');

  try {
    // Step 1: Get all participants from profiles table
    console.log('📋 Step 1: Fetching all participants from profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, ic_number, job_position_name, job_position_id, category, user_type')
      .eq('user_type', 'participant')
      .eq('status', 'approved');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`✅ Found ${profiles.length} participants in profiles table\n`);

    // Step 2: Get all test submissions
    console.log('📋 Step 2: Fetching all test submissions...');
    const { data: testSubmissions, error: submissionsError } = await supabase
      .from('test_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('❌ Error fetching test submissions:', submissionsError);
      return;
    }

    console.log(`✅ Found ${testSubmissions.length} test submissions\n`);

    // Step 3: Check for category mismatches
    console.log('🔍 Step 3: Checking for category mismatches...');
    const mismatches = [];
    const categoryStats = {
      profiles: { Clinical: 0, 'Non-Clinical': 0, null: 0 },
      testSubmissions: { Clinical: 0, 'Non-Clinical': 0, null: 0 }
    };

    // Count categories in profiles
    profiles.forEach(profile => {
      const category = profile.category;
      if (categoryStats.profiles[category] !== undefined) {
        categoryStats.profiles[category]++;
      } else {
        categoryStats.profiles[category] = 1;
      }
    });

    // Count categories in test submissions and check for mismatches
    testSubmissions.forEach(submission => {
      const category = submission.job_category;
      if (categoryStats.testSubmissions[category] !== undefined) {
        categoryStats.testSubmissions[category]++;
      } else {
        categoryStats.testSubmissions[category] = 1;
      }

      // Find corresponding profile
      const profile = profiles.find(p => p.id === submission.user_id);
      if (profile && profile.category !== submission.job_category) {
        mismatches.push({
          name: profile.name,
          icNumber: profile.ic_number,
          profileCategory: profile.category,
          testSubmissionCategory: submission.job_category,
          testType: submission.test_type,
          submittedAt: submission.submitted_at
        });
      }
    });

    // Step 4: Display results
    console.log('📊 CATEGORY DISTRIBUTION:');
    console.log('Profiles:');
    Object.entries(categoryStats.profiles).forEach(([category, count]) => {
      console.log(`  ${category || 'NULL'}: ${count}`);
    });
    console.log('\nTest Submissions:');
    Object.entries(categoryStats.testSubmissions).forEach(([category, count]) => {
      console.log(`  ${category || 'NULL'}: ${count}`);
    });

    console.log(`\n🚨 FOUND ${mismatches.length} CATEGORY MISMATCHES:`);
    if (mismatches.length > 0) {
      console.log('\nDetailed mismatches:');
      mismatches.forEach((mismatch, index) => {
        console.log(`\n${index + 1}. ${mismatch.name} (IC: ${mismatch.icNumber})`);
        console.log(`   Profile Category: ${mismatch.profileCategory || 'NULL'}`);
        console.log(`   Test Submission Category: ${mismatch.testSubmissionCategory || 'NULL'}`);
        console.log(`   Test Type: ${mismatch.testType}`);
        console.log(`   Submitted: ${mismatch.submittedAt}`);
      });
    }

    // Step 5: Check ALVIN DULAMIT specifically
    console.log('\n🔍 ALVIN DULAMIT SPECIFIC CHECK:');
    const alvinProfile = profiles.find(p => 
      p.name.toLowerCase().includes('alvin') && 
      p.name.toLowerCase().includes('dulamit')
    );
    
    if (alvinProfile) {
      console.log('Profile data:');
      console.log(`  Name: ${alvinProfile.name}`);
      console.log(`  IC: ${alvinProfile.ic_number}`);
      console.log(`  Job Position: ${alvinProfile.job_position_name}`);
      console.log(`  Category: ${alvinProfile.category || 'NULL'}`);
      console.log(`  User Type: ${alvinProfile.user_type}`);

      const alvinSubmissions = testSubmissions.filter(s => s.user_id === alvinProfile.id);
      console.log(`\nTest submissions (${alvinSubmissions.length}):`);
      alvinSubmissions.forEach(submission => {
        console.log(`  ${submission.test_type}: Category = ${submission.job_category || 'NULL'}, Score = ${submission.correct_answers}/${submission.total_questions}`);
      });
    } else {
      console.log('❌ ALVIN DULAMIT not found in profiles table');
    }

    // Step 6: Check for data quality issues
    console.log('\n🔍 DATA QUALITY ISSUES:');
    
    // Check for NULL job_categories in test_submissions
    const nullJobCategories = testSubmissions.filter(s => !s.job_category);
    console.log(`Test submissions with NULL job_category: ${nullJobCategories.length}`);
    
    // Check for NULL categories in profiles
    const nullProfileCategories = profiles.filter(p => !p.category);
    console.log(`Profiles with NULL category: ${nullProfileCategories.length}`);

    // Check for inconsistent job_categories for same user
    const inconsistentUsers = new Map();
    testSubmissions.forEach(submission => {
      if (!inconsistentUsers.has(submission.user_id)) {
        inconsistentUsers.set(submission.user_id, new Set());
      }
      inconsistentUsers.get(submission.user_id).add(submission.job_category);
    });

    const inconsistentCount = Array.from(inconsistentUsers.values()).filter(categories => categories.size > 1).length;
    console.log(`Users with inconsistent job_categories: ${inconsistentCount}`);

    console.log('\n✅ Data audit completed!');

  } catch (error) {
    console.error('❌ Error during audit:', error);
  }
}

// Run the audit
auditAllParticipants();
