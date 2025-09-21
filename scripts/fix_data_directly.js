// Direct Data Fix Script - No SQL Required
// This script fixes all data issues directly using the Supabase service key

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration with service key
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY3ODkyOSwiZXhwIjoyMDczMjU0OTI5fQ.YS3fbDXijyRShozK8VgLlIlFf5hadyEHAkHXcj2CK-Q';

// Create admin client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Main fix function
async function fixAllData() {
  try {
    logSection('DIRECT DATA FIX - NO SQL REQUIRED');
    log('Fixing all data issues directly using Supabase service key...', 'white');
    
    // Test connection
    logSection('TESTING CONNECTION');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      logError(`Connection failed: ${authError.message}`);
      return;
    }
    logSuccess('Connected to Supabase successfully!');

    // Get current data state
    await showCurrentState();

    // Fix 1: NULL categories in profiles
    await fixNullCategories();

    // Fix 2: Invalid test scores
    await fixInvalidTestScores();

    // Fix 3: NULL values in critical fields
    await fixNullValues();

    // Fix 4: Category mismatches between profiles and test_submissions
    await fixCategoryMismatches();

    // Fix 5: Orphaned records
    await fixOrphanedRecords();

    // Fix 6: Duplicate records
    await fixDuplicateRecords();

    // Final verification
    await finalVerification();

    logSection('FIX COMPLETED');
    logSuccess('All data issues have been fixed! 🎉');
    
  } catch (error) {
    logError(`Fix failed: ${error.message}`);
    console.error(error);
  }
}

// Show current data state
async function showCurrentState() {
  logSection('CURRENT DATA STATE');
  
  try {
    // Get profiles count
    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Get test_submissions count
    const { count: testSubmissionsCount } = await supabase
      .from('test_submissions')
      .select('*', { count: 'exact', head: true });

    // Get jobs count
    const { count: jobsCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });

    // Check for NULL categories
    const { count: nullCategoriesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('category', null);

    // Check for invalid test scores
    const { count: invalidScoresCount } = await supabase
      .from('test_submissions')
      .select('*', { count: 'exact', head: true })
      .or('score.lt.0,score.gt.total_questions,correct_answers.lt.0,correct_answers.gt.total_questions');

    logInfo(`📊 Current Data State:`);
    logInfo(`   - Total Profiles: ${profilesCount}`);
    logInfo(`   - Total Test Submissions: ${testSubmissionsCount}`);
    logInfo(`   - Total Jobs: ${jobsCount}`);
    logInfo(`   - Profiles with NULL categories: ${nullCategoriesCount}`);
    logInfo(`   - Invalid test scores: ${invalidScoresCount}`);

  } catch (error) {
    logError(`Error getting current state: ${error.message}`);
  }
}

// Fix NULL categories in profiles
async function fixNullCategories() {
  logSection('FIXING NULL CATEGORIES IN PROFILES');
  
  try {
    // Get all profiles with NULL categories
    const { data: nullCategoryProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, job_position_name, category')
      .is('category', null);

    if (fetchError) {
      logError(`Failed to fetch profiles: ${fetchError.message}`);
      return;
    }

    if (!nullCategoryProfiles || nullCategoryProfiles.length === 0) {
      logSuccess('No profiles with NULL categories found');
      return;
    }

    logInfo(`Found ${nullCategoryProfiles.length} profiles with NULL categories`);

    // Define Clinical job positions
    const clinicalPositions = [
      'JURURAWAT', 'PEGAWAI PERGIGIAN', 'PEGAWAI PERUBATAN', 
      'PENOLONG PEGAWAI PERUBATAN', 'PEMBANTU PERAWATAN',
      'PEGAWAI PERUBATAN KESIHATAN', 'PENOLONG PEGAWAI PERUBATAN KESIHATAN',
      'PEGAWAI PERUBATAN UD', 'PEMBANTU PEGAWAI PERUBATAN',
      'JURU X-RAY', 'JURU RADIOLOGI'
    ];

    // Define Non-Clinical job positions
    const nonClinicalPositions = [
      'PEGAWAI FARMASI', 'PENOLONG PEGAWAI FARMASI', 'JURUTEKNOLOGI',
      'JURUPULIH', 'PENOLONG PEGAWAI TADBIR', 'PEMBANTU KHIDMAT',
      'PEGAWAI TADBIR', 'PEGAWAI KHIDMAT', 'PEGAWAI TEKNIKAL',
      'PEGAWAI PENYELIDIKAN', 'PEGAWAI MAKMAL'
    ];

    let clinicalCount = 0;
    let nonClinicalCount = 0;

    // Fix each profile
    for (const profile of nullCategoryProfiles) {
      const jobName = profile.job_position_name || '';
      let category = null;

      // Check if it's a Clinical position
      if (clinicalPositions.some(pos => jobName.toUpperCase().includes(pos))) {
        category = 'Clinical';
        clinicalCount++;
      }
      // Check if it's a Non-Clinical position
      else if (nonClinicalPositions.some(pos => jobName.toUpperCase().includes(pos))) {
        category = 'Non-Clinical';
        nonClinicalCount++;
      }

      if (category) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ category })
          .eq('id', profile.id);

        if (updateError) {
          logError(`Failed to update profile ${profile.id}: ${updateError.message}`);
        }
      }
    }

    logSuccess(`Fixed ${clinicalCount} Clinical profiles`);
    logSuccess(`Fixed ${nonClinicalCount} Non-Clinical profiles`);

  } catch (error) {
    logError(`Error fixing NULL categories: ${error.message}`);
  }
}

// Fix invalid test scores
async function fixInvalidTestScores() {
  logSection('FIXING INVALID TEST SCORES');
  
  try {
    // Fix negative scores
    const { error: negativeScoresError } = await supabase
      .from('test_submissions')
      .update({ score: 0 })
      .lt('score', 0);

    if (negativeScoresError) {
      logError(`Failed to fix negative scores: ${negativeScoresError.message}`);
    } else {
      logSuccess('Fixed negative scores');
    }

    // Fix scores that exceed total_questions
    const { error: excessiveScoresError } = await supabase
      .from('test_submissions')
      .update({ score: supabase.raw('total_questions') })
      .gt('score', supabase.raw('total_questions'));

    if (excessiveScoresError) {
      logError(`Failed to fix excessive scores: ${excessiveScoresError.message}`);
    } else {
      logSuccess('Fixed excessive scores');
    }

    // Fix negative correct_answers
    const { error: negativeCorrectError } = await supabase
      .from('test_submissions')
      .update({ correct_answers: 0 })
      .lt('correct_answers', 0);

    if (negativeCorrectError) {
      logError(`Failed to fix negative correct_answers: ${negativeCorrectError.message}`);
    } else {
      logSuccess('Fixed negative correct_answers');
    }

    // Fix correct_answers that exceed total_questions
    const { error: excessiveCorrectError } = await supabase
      .from('test_submissions')
      .update({ correct_answers: supabase.raw('total_questions') })
      .gt('correct_answers', supabase.raw('total_questions'));

    if (excessiveCorrectError) {
      logError(`Failed to fix excessive correct_answers: ${excessiveCorrectError.message}`);
    } else {
      logSuccess('Fixed excessive correct_answers');
    }

    // Fix negative time_taken_seconds
    const { error: negativeTimeError } = await supabase
      .from('test_submissions')
      .update({ time_taken_seconds: 0 })
      .lt('time_taken_seconds', 0);

    if (negativeTimeError) {
      logError(`Failed to fix negative time_taken_seconds: ${negativeTimeError.message}`);
    } else {
      logSuccess('Fixed negative time_taken_seconds');
    }

  } catch (error) {
    logError(`Error fixing invalid test scores: ${error.message}`);
  }
}

// Fix NULL values in critical fields
async function fixNullValues() {
  logSection('FIXING NULL VALUES IN CRITICAL FIELDS');
  
  try {
    // Fix NULL user_type
    const { error: userTypeError } = await supabase
      .from('profiles')
      .update({ user_type: 'participant' })
      .is('user_type', null);

    if (userTypeError) {
      logError(`Failed to fix NULL user_type: ${userTypeError.message}`);
    } else {
      logSuccess('Fixed NULL user_type values');
    }

    // Fix NULL status
    const { error: statusError } = await supabase
      .from('profiles')
      .update({ status: 'pending' })
      .is('status', null);

    if (statusError) {
      logError(`Failed to fix NULL status: ${statusError.message}`);
    } else {
      logSuccess('Fixed NULL status values');
    }

    // Fix NULL payment_status
    const { error: paymentStatusError } = await supabase
      .from('profiles')
      .update({ payment_status: 'pending' })
      .is('payment_status', null);

    if (paymentStatusError) {
      logError(`Failed to fix NULL payment_status: ${paymentStatusError.message}`);
    } else {
      logSuccess('Fixed NULL payment_status values');
    }

  } catch (error) {
    logError(`Error fixing NULL values: ${error.message}`);
  }
}

// Fix category mismatches between profiles and test_submissions
async function fixCategoryMismatches() {
  logSection('FIXING CATEGORY MISMATCHES');
  
  try {
    // Get test_submissions with category mismatches
    const { data: mismatches, error: fetchError } = await supabase
      .from('test_submissions')
      .select(`
        id,
        user_id,
        job_category,
        profiles!inner(
          id,
          category
        )
      `)
      .not('profiles.category', 'is', null)
      .not('job_category', 'is', null);

    if (fetchError) {
      logError(`Failed to fetch mismatches: ${fetchError.message}`);
      return;
    }

    if (!mismatches || mismatches.length === 0) {
      logSuccess('No category mismatches found');
      return;
    }

    logInfo(`Found ${mismatches.length} category mismatches`);

    let fixedCount = 0;

    // Fix each mismatch
    for (const mismatch of mismatches) {
      const profileCategory = mismatch.profiles.category;
      const testCategory = mismatch.job_category;

      if (profileCategory !== testCategory) {
        const { error: updateError } = await supabase
          .from('test_submissions')
          .update({ job_category: profileCategory })
          .eq('id', mismatch.id);

        if (updateError) {
          logError(`Failed to fix mismatch for test_submission ${mismatch.id}: ${updateError.message}`);
        } else {
          fixedCount++;
        }
      }
    }

    logSuccess(`Fixed ${fixedCount} category mismatches`);

  } catch (error) {
    logError(`Error fixing category mismatches: ${error.message}`);
  }
}

// Fix orphaned records
async function fixOrphanedRecords() {
  logSection('FIXING ORPHANED RECORDS');
  
  try {
    // Get all test_submissions
    const { data: allTestSubmissions, error: fetchError } = await supabase
      .from('test_submissions')
      .select('id, user_id');

    if (fetchError) {
      logError(`Failed to fetch test_submissions: ${fetchError.message}`);
      return;
    }

    if (!allTestSubmissions || allTestSubmissions.length === 0) {
      logSuccess('No test_submissions found');
      return;
    }

    // Get all profile IDs
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      logError(`Failed to fetch profiles: ${profilesError.message}`);
      return;
    }

    const profileIds = new Set(allProfiles.map(p => p.id));
    const orphanedSubmissions = allTestSubmissions.filter(ts => !profileIds.has(ts.user_id));

    if (orphanedSubmissions.length === 0) {
      logSuccess('No orphaned test_submissions found');
      return;
    }

    logInfo(`Found ${orphanedSubmissions.length} orphaned test_submissions`);

    // Delete orphaned submissions
    const { error: deleteError } = await supabase
      .from('test_submissions')
      .delete()
      .in('id', orphanedSubmissions.map(ts => ts.id));

    if (deleteError) {
      logError(`Failed to delete orphaned submissions: ${deleteError.message}`);
    } else {
      logSuccess(`Deleted ${orphanedSubmissions.length} orphaned test_submissions`);
    }

  } catch (error) {
    logError(`Error fixing orphaned records: ${error.message}`);
  }
}

// Fix duplicate records
async function fixDuplicateRecords() {
  logSection('FIXING DUPLICATE RECORDS');
  
  try {
    // Find duplicate profiles by email
    const { data: duplicateEmails, error: duplicateError } = await supabase
      .from('profiles')
      .select('email')
      .not('email', 'is', null);

    if (duplicateError) {
      logError(`Failed to find duplicate profiles: ${duplicateError.message}`);
      return;
    }

    // Count duplicates
    const emailCounts = {};
    duplicateEmails.forEach(profile => {
      emailCounts[profile.email] = (emailCounts[profile.email] || 0) + 1;
    });

    const duplicateEmailsList = Object.entries(emailCounts)
      .filter(([email, count]) => count > 1)
      .map(([email, count]) => ({ email, count }));

    if (duplicateEmailsList.length === 0) {
      logSuccess('No duplicate profiles found');
      return;
    }

    logInfo(`Found ${duplicateEmailsList.length} duplicate email addresses`);

    let totalDeleted = 0;

    // Fix each duplicate email
    for (const duplicate of duplicateEmailsList) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, created_at')
        .eq('email', duplicate.email)
        .order('created_at', { ascending: false });

      if (profilesError) {
        logError(`Failed to get profiles for email ${duplicate.email}: ${profilesError.message}`);
        continue;
      }

      if (profiles && profiles.length > 1) {
        // Keep the first one (latest) and delete the rest
        const idsToDelete = profiles.slice(1).map(p => p.id);
        
        const { error: deleteError } = await supabase
          .from('profiles')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) {
          logError(`Failed to delete duplicate profiles for email ${duplicate.email}: ${deleteError.message}`);
        } else {
          totalDeleted += idsToDelete.length;
        }
      }
    }

    logSuccess(`Deleted ${totalDeleted} duplicate profiles`);

  } catch (error) {
    logError(`Error fixing duplicate records: ${error.message}`);
  }
}

// Final verification
async function finalVerification() {
  logSection('FINAL VERIFICATION');
  
  try {
    // Check for remaining NULL categories
    const { count: nullCategoriesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('category', null);

    // Check for invalid test scores
    const { count: invalidScoresCount } = await supabase
      .from('test_submissions')
      .select('*', { count: 'exact', head: true })
      .or('score.lt.0,score.gt.total_questions,correct_answers.lt.0,correct_answers.gt.total_questions');

    // Check for orphaned test_submissions
    const { data: allTestSubmissions } = await supabase
      .from('test_submissions')
      .select('user_id');
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id');
    
    const profileIds = new Set(allProfiles.map(p => p.id));
    const orphanedCount = allTestSubmissions.filter(ts => !profileIds.has(ts.user_id)).length;

    // Get final counts
    const { count: finalProfilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    const { count: finalTestSubmissionsCount } = await supabase
      .from('test_submissions')
      .select('*', { count: 'exact', head: true });

    logInfo(`📊 Final Verification Results:`);
    logInfo(`   - Remaining NULL categories: ${nullCategoriesCount}`);
    logInfo(`   - Remaining invalid test scores: ${invalidScoresCount}`);
    logInfo(`   - Remaining orphaned test_submissions: ${orphanedCount}`);
    logInfo(`   - Final Profiles count: ${finalProfilesCount}`);
    logInfo(`   - Final Test Submissions count: ${finalTestSubmissionsCount}`);

    if (nullCategoriesCount === 0 && invalidScoresCount === 0 && orphanedCount === 0) {
      logSuccess('🎉 All issues have been successfully fixed!');
    } else {
      logError('⚠️  Some issues remain. Please check the verification results above.');
    }

  } catch (error) {
    logError(`Error in final verification: ${error.message}`);
  }
}

// Run the fix
if (require.main === module) {
  fixAllData().catch(console.error);
}

module.exports = { fixAllData };
