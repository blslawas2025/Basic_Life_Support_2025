// Complete Data Fix Script
// This script fixes ALL data issues using the service key

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY3ODkyOSwiZXhwIjoyMDczMjU0OTI5fQ.YS3fbDXijyRShozK8VgLlIlFf5hadyEHAkHXcj2CK-Q';

// Create client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Starting COMPLETE data fix...');

async function completeFix() {
  try {
    // Test connection
    console.log('📊 Testing connection...');
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (profilesError) {
      console.error('❌ Connection failed:', profilesError.message);
      return;
    }

    console.log(`✅ Connected! Found ${profilesCount} profiles`);

    // Get test submissions count
    const { count: testSubmissionsCount } = await supabase
      .from('test_submissions')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Found ${testSubmissionsCount} test submissions`);

    // Fix 1: NULL categories in profiles
    console.log('\n🔧 Fixing NULL categories in profiles...');
    
    const { data: nullProfiles, error: nullError } = await supabase
      .from('profiles')
      .select('id, job_position_name, category')
      .is('category', null);

    if (nullError) {
      console.error('❌ Error fetching NULL categories:', nullError.message);
    } else if (nullProfiles && nullProfiles.length > 0) {
      console.log(`Found ${nullProfiles.length} profiles with NULL categories`);
      
      let fixedCount = 0;
      for (const profile of nullProfiles) {
        const jobName = profile.job_position_name || '';
        let category = null;

        // Check for Clinical positions
        if (jobName.toUpperCase().includes('JURURAWAT') || 
            jobName.toUpperCase().includes('PEGAWAI PERGIGIAN') ||
            jobName.toUpperCase().includes('PEGAWAI PERUBATAN') ||
            jobName.toUpperCase().includes('PENOLONG PEGAWAI PERUBATAN') ||
            jobName.toUpperCase().includes('PEMBANTU PERAWATAN') ||
            jobName.toUpperCase().includes('PEGAWAI PERUBATAN KESIHATAN') ||
            jobName.toUpperCase().includes('PENOLONG PEGAWAI PERUBATAN KESIHATAN') ||
            jobName.toUpperCase().includes('PEGAWAI PERUBATAN UD') ||
            jobName.toUpperCase().includes('PEMBANTU PEGAWAI PERUBATAN') ||
            jobName.toUpperCase().includes('JURU X-RAY') ||
            jobName.toUpperCase().includes('JURU RADIOLOGI')) {
          category = 'Clinical';
        }
        // Check for Non-Clinical positions
        else if (jobName.toUpperCase().includes('PEGAWAI FARMASI') ||
                 jobName.toUpperCase().includes('PENOLONG PEGAWAI FARMASI') ||
                 jobName.toUpperCase().includes('JURUTEKNOLOGI') ||
                 jobName.toUpperCase().includes('JURUPULIH') ||
                 jobName.toUpperCase().includes('PENOLONG PEGAWAI TADBIR') ||
                 jobName.toUpperCase().includes('PEMBANTU KHIDMAT') ||
                 jobName.toUpperCase().includes('PEGAWAI TADBIR') ||
                 jobName.toUpperCase().includes('PEGAWAI KHIDMAT') ||
                 jobName.toUpperCase().includes('PEGAWAI TEKNIKAL') ||
                 jobName.toUpperCase().includes('PEGAWAI PENYELIDIKAN') ||
                 jobName.toUpperCase().includes('PEGAWAI MAKMAL')) {
          category = 'Non-Clinical';
        }

        if (category) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ category })
            .eq('id', profile.id);

          if (updateError) {
            console.error(`❌ Failed to update profile ${profile.id}:`, updateError.message);
          } else {
            console.log(`✅ Updated profile ${profile.id} to ${category}`);
            fixedCount++;
          }
        }
      }
      console.log(`✅ Fixed ${fixedCount} profiles with NULL categories`);
    } else {
      console.log('✅ No profiles with NULL categories found');
    }

    // Fix 2: Invalid test scores
    console.log('\n🔧 Fixing invalid test scores...');
    
    // Get all test submissions
    const { data: allTestSubmissions, error: fetchError } = await supabase
      .from('test_submissions')
      .select('id, score, correct_answers, total_questions, time_taken_seconds');

    if (fetchError) {
      console.error('❌ Error fetching test submissions:', fetchError.message);
    } else if (allTestSubmissions && allTestSubmissions.length > 0) {
      let fixedScores = 0;
      let fixedCorrectAnswers = 0;
      let fixedTime = 0;

      for (const record of allTestSubmissions) {
        let needsUpdate = false;
        const updates = {};

        // Fix negative scores
        if (record.score < 0) {
          updates.score = 0;
          needsUpdate = true;
          fixedScores++;
        }
        // Fix scores > total_questions
        else if (record.score > record.total_questions) {
          updates.score = record.total_questions;
          needsUpdate = true;
          fixedScores++;
        }

        // Fix negative correct_answers
        if (record.correct_answers < 0) {
          updates.correct_answers = 0;
          needsUpdate = true;
          fixedCorrectAnswers++;
        }
        // Fix correct_answers > total_questions
        else if (record.correct_answers > record.total_questions) {
          updates.correct_answers = record.total_questions;
          needsUpdate = true;
          fixedCorrectAnswers++;
        }

        // Fix negative time_taken_seconds
        if (record.time_taken_seconds < 0) {
          updates.time_taken_seconds = 0;
          needsUpdate = true;
          fixedTime++;
        }

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('test_submissions')
            .update(updates)
            .eq('id', record.id);

          if (updateError) {
            console.error(`❌ Failed to update test submission ${record.id}:`, updateError.message);
          }
        }
      }

      console.log(`✅ Fixed ${fixedScores} invalid scores`);
      console.log(`✅ Fixed ${fixedCorrectAnswers} invalid correct_answers`);
      console.log(`✅ Fixed ${fixedTime} invalid time_taken_seconds`);
    } else {
      console.log('✅ No test submissions found');
    }

    // Fix 3: NULL values in critical fields
    console.log('\n🔧 Fixing NULL values in critical fields...');
    
    // Fix NULL user_type
    const { error: userTypeError } = await supabase
      .from('profiles')
      .update({ user_type: 'participant' })
      .is('user_type', null);

    if (userTypeError) {
      console.error('❌ Error fixing NULL user_type:', userTypeError.message);
    } else {
      console.log('✅ Fixed NULL user_type values');
    }

    // Fix NULL status
    const { error: statusError } = await supabase
      .from('profiles')
      .update({ status: 'pending' })
      .is('status', null);

    if (statusError) {
      console.error('❌ Error fixing NULL status:', statusError.message);
    } else {
      console.log('✅ Fixed NULL status values');
    }

    // Fix NULL payment_status
    const { error: paymentError } = await supabase
      .from('profiles')
      .update({ payment_status: 'pending' })
      .is('payment_status', null);

    if (paymentError) {
      console.error('❌ Error fixing NULL payment_status:', paymentError.message);
    } else {
      console.log('✅ Fixed NULL payment_status values');
    }

    // Fix 4: Category mismatches between profiles and test_submissions
    console.log('\n🔧 Fixing category mismatches...');
    
    // Get test_submissions with their profile categories
    const { data: testSubmissions, error: tsError } = await supabase
      .from('test_submissions')
      .select(`
        id,
        user_id,
        job_category,
        profiles!inner(
          id,
          category
        )
      `);

    if (tsError) {
      console.error('❌ Error fetching test submissions:', tsError.message);
    } else if (testSubmissions && testSubmissions.length > 0) {
      let fixedMismatches = 0;

      for (const ts of testSubmissions) {
        const profileCategory = ts.profiles.category;
        const testCategory = ts.job_category;

        if (profileCategory && testCategory && profileCategory !== testCategory) {
          const { error: updateError } = await supabase
            .from('test_submissions')
            .update({ job_category: profileCategory })
            .eq('id', ts.id);

          if (updateError) {
            console.error(`❌ Failed to fix mismatch for test_submission ${ts.id}:`, updateError.message);
          } else {
            console.log(`✅ Fixed category mismatch for test_submission ${ts.id}: ${testCategory} → ${profileCategory}`);
            fixedMismatches++;
          }
        }
      }

      console.log(`✅ Fixed ${fixedMismatches} category mismatches`);
    } else {
      console.log('✅ No test submissions found');
    }

    // Fix 5: Orphaned records
    console.log('\n🔧 Fixing orphaned records...');
    
    // Get all test_submissions
    const { data: allTS, error: allTSError } = await supabase
      .from('test_submissions')
      .select('id, user_id');

    // Get all profile IDs
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id');

    if (allTSError || allProfilesError) {
      console.error('❌ Error fetching data for orphaned records check');
    } else if (allTS && allProfiles) {
      const profileIds = new Set(allProfiles.map(p => p.id));
      const orphanedSubmissions = allTS.filter(ts => !profileIds.has(ts.user_id));

      if (orphanedSubmissions.length > 0) {
        console.log(`Found ${orphanedSubmissions.length} orphaned test_submissions`);

        const { error: deleteError } = await supabase
          .from('test_submissions')
          .delete()
          .in('id', orphanedSubmissions.map(ts => ts.id));

        if (deleteError) {
          console.error('❌ Failed to delete orphaned submissions:', deleteError.message);
        } else {
          console.log(`✅ Deleted ${orphanedSubmissions.length} orphaned test_submissions`);
        }
      } else {
        console.log('✅ No orphaned test_submissions found');
      }
    }

    // Fix 6: Duplicate records
    console.log('\n🔧 Fixing duplicate records...');
    
    // Find duplicate profiles by email
    const { data: allProfilesForDup, error: dupError } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .not('email', 'is', null)
      .order('email');

    if (dupError) {
      console.error('❌ Error fetching profiles for duplicate check:', dupError.message);
    } else if (allProfilesForDup && allProfilesForDup.length > 0) {
      // Group by email
      const emailGroups = {};
      allProfilesForDup.forEach(profile => {
        if (!emailGroups[profile.email]) {
          emailGroups[profile.email] = [];
        }
        emailGroups[profile.email].push(profile);
      });

      // Find duplicates
      const duplicates = Object.entries(emailGroups)
        .filter(([email, profiles]) => profiles.length > 1)
        .map(([email, profiles]) => ({ email, profiles: profiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) }));

      if (duplicates.length > 0) {
        console.log(`Found ${duplicates.length} duplicate email addresses`);

        let totalDeleted = 0;
        for (const duplicate of duplicates) {
          // Keep the first one (latest) and delete the rest
          const idsToDelete = duplicate.profiles.slice(1).map(p => p.id);
          
          const { error: deleteError } = await supabase
            .from('profiles')
            .delete()
            .in('id', idsToDelete);

          if (deleteError) {
            console.error(`❌ Failed to delete duplicate profiles for email ${duplicate.email}:`, deleteError.message);
          } else {
            console.log(`✅ Deleted ${idsToDelete.length} duplicate profiles for email ${duplicate.email}`);
            totalDeleted += idsToDelete.length;
          }
        }

        console.log(`✅ Deleted ${totalDeleted} duplicate profiles total`);
      } else {
        console.log('✅ No duplicate profiles found');
      }
    }

    // Final verification
    console.log('\n📊 Final verification...');
    
    const { count: finalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalTestSubmissions } = await supabase
      .from('test_submissions')
      .select('*', { count: 'exact', head: true });

    // Check for remaining issues
    const { count: remainingNullCategories } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('category', null);

    const { count: remainingInvalidScores } = await supabase
      .from('test_submissions')
      .select('*', { count: 'exact', head: true })
      .or('score.lt.0,score.gt.total_questions,correct_answers.lt.0,correct_answers.gt.total_questions');

    console.log(`\n📊 Final Results:`);
    console.log(`   - Total Profiles: ${finalProfiles}`);
    console.log(`   - Total Test Submissions: ${finalTestSubmissions}`);
    console.log(`   - Remaining NULL categories: ${remainingNullCategories}`);
    console.log(`   - Remaining invalid scores: ${remainingInvalidScores}`);

    if (remainingNullCategories === 0 && remainingInvalidScores === 0) {
      console.log('\n🎉 ALL DATA ISSUES HAVE BEEN FIXED! 🎉');
    } else {
      console.log('\n⚠️  Some issues may remain. Please check the verification results above.');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error(error);
  }
}

// Run the complete fix
completeFix();
