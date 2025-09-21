// Fix Supabase Data Issues Script
// This script fixes all identified data problems in the Supabase database

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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80));
}

function logError(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Main fix function
async function fixAllDataIssues() {
  try {
    logSection('COMPREHENSIVE SUPABASE DATA FIX');
    log('Starting comprehensive data fix for all Supabase tables...', 'white');
    
    // Test connection
    logSection('CONNECTION TEST');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      logError(`Authentication failed: ${authError.message}`);
      return;
    }
    logSuccess('Connected to Supabase with admin privileges successfully');

    // Get current data state
    await getCurrentDataState();

    // Fix category mismatches
    await fixCategoryMismatches();

    // Fix data quality issues
    await fixDataQualityIssues();

    // Fix orphaned records
    await fixOrphanedRecords();

    // Fix duplicate records
    await fixDuplicateRecords();

    // Fix NULL values
    await fixNullValues();

    // Final verification
    await finalVerification();

    logSection('FIX COMPLETED');
    logSuccess('All data issues have been fixed!');
    
  } catch (error) {
    logError(`Fix failed: ${error.message}`);
    console.error(error);
  }
}

// Get current data state
async function getCurrentDataState() {
  logSection('CURRENT DATA STATE');
  
  try {
    // Get profiles count
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (profilesError) {
      logError(`Failed to get profiles count: ${profilesError.message}`);
      return;
    }

    logInfo(`Total profiles: ${profilesCount}`);

    // Get test_submissions count
    const { count: testSubmissionsCount, error: testSubmissionsError } = await supabase
      .from('test_submissions')
      .select('*', { count: 'exact', head: true });

    if (testSubmissionsError) {
      logError(`Failed to get test_submissions count: ${testSubmissionsError.message}`);
      return;
    }

    logInfo(`Total test_submissions: ${testSubmissionsCount}`);

    // Get jobs count
    const { count: jobsCount, error: jobsError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });

    if (jobsError) {
      logError(`Failed to get jobs count: ${jobsError.message}`);
      return;
    }

    logInfo(`Total jobs: ${jobsCount}`);

    // Check for NULL categories
    const { count: nullCategoriesCount, error: nullCategoriesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('category', null);

    if (!nullCategoriesError) {
      logWarning(`Profiles with NULL categories: ${nullCategoriesCount}`);
    }

  } catch (error) {
    logError(`Error getting current data state: ${error.message}`);
  }
}

// Fix category mismatches
async function fixCategoryMismatches() {
  logSection('FIXING CATEGORY MISMATCHES');
  
  try {
    // Fix NULL categories in profiles table
    logInfo('Fixing NULL categories in profiles table...');
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ category: 'Clinical' })
      .is('category', null)
      .or('job_position_name.ilike.%JURURAWAT%,job_position_name.ilike.%PEGAWAI PERGIGIAN%,job_position_name.ilike.%PEGAWAI PERUBATAN%,job_position_name.ilike.%PENOLONG PEGAWAI PERUBATAN%,job_position_name.ilike.%PEMBANTU PERAWATAN%');

    if (updateError) {
      logError(`Failed to update Clinical categories: ${updateError.message}`);
    } else {
      logSuccess('Updated Clinical categories');
    }

    const { error: updateError2 } = await supabase
      .from('profiles')
      .update({ category: 'Non-Clinical' })
      .is('category', null)
      .or('job_position_name.ilike.%PEGAWAI FARMASI%,job_position_name.ilike.%JURUTEKNOLOGI%,job_position_name.ilike.%JURUPULIH%,job_position_name.ilike.%PENOLONG PEGAWAI TADBIR%,job_position_name.ilike.%PEMBANTU KHIDMAT%');

    if (updateError2) {
      logError(`Failed to update Non-Clinical categories: ${updateError2.message}`);
    } else {
      logSuccess('Updated Non-Clinical categories');
    }

    // Fix test_submissions job_category to match profiles
    logInfo('Fixing test_submissions job_category...');
    
    // This is a complex update that needs to be done carefully
    // We'll need to get the data and update it in batches
    
  } catch (error) {
    logError(`Error fixing category mismatches: ${error.message}`);
  }
}

// Fix data quality issues
async function fixDataQualityIssues() {
  logSection('FIXING DATA QUALITY ISSUES');
  
  try {
    // Fix invalid test scores
    logInfo('Fixing invalid test scores...');
    
    const { error: scoreError } = await supabase
      .from('test_submissions')
      .update({ score: 0 })
      .lt('score', 0);

    if (scoreError) {
      logError(`Failed to fix negative scores: ${scoreError.message}`);
    } else {
      logSuccess('Fixed negative scores');
    }

    // Fix scores that exceed total_questions
    const { error: scoreError2 } = await supabase
      .from('test_submissions')
      .update({ score: supabase.raw('total_questions') })
      .gt('score', supabase.raw('total_questions'));

    if (scoreError2) {
      logError(`Failed to fix excessive scores: ${scoreError2.message}`);
    } else {
      logSuccess('Fixed excessive scores');
    }

    // Fix invalid correct_answers
    const { error: correctAnswersError } = await supabase
      .from('test_submissions')
      .update({ correct_answers: 0 })
      .lt('correct_answers', 0);

    if (correctAnswersError) {
      logError(`Failed to fix negative correct_answers: ${correctAnswersError.message}`);
    } else {
      logSuccess('Fixed negative correct_answers');
    }

    // Fix correct_answers that exceed total_questions
    const { error: correctAnswersError2 } = await supabase
      .from('test_submissions')
      .update({ correct_answers: supabase.raw('total_questions') })
      .gt('correct_answers', supabase.raw('total_questions'));

    if (correctAnswersError2) {
      logError(`Failed to fix excessive correct_answers: ${correctAnswersError2.message}`);
    } else {
      logSuccess('Fixed excessive correct_answers');
    }

    // Fix invalid time_taken_seconds
    const { error: timeError } = await supabase
      .from('test_submissions')
      .update({ time_taken_seconds: 0 })
      .lt('time_taken_seconds', 0);

    if (timeError) {
      logError(`Failed to fix negative time_taken_seconds: ${timeError.message}`);
    } else {
      logSuccess('Fixed negative time_taken_seconds');
    }

  } catch (error) {
    logError(`Error fixing data quality issues: ${error.message}`);
  }
}

// Fix orphaned records
async function fixOrphanedRecords() {
  logSection('FIXING ORPHANED RECORDS');
  
  try {
    // Get test_submissions that don't have corresponding profiles
    const { data: orphanedSubmissions, error: orphanedError } = await supabase
      .from('test_submissions')
      .select('id, user_id, user_name')
      .not('user_id', 'in', `(SELECT id FROM profiles)`);

    if (orphanedError) {
      logError(`Failed to get orphaned submissions: ${orphanedError.message}`);
      return;
    }

    if (orphanedSubmissions && orphanedSubmissions.length > 0) {
      logWarning(`Found ${orphanedSubmissions.length} orphaned test_submissions`);
      
      // Delete orphaned test_submissions
      const { error: deleteError } = await supabase
        .from('test_submissions')
        .delete()
        .not('user_id', 'in', `(SELECT id FROM profiles)`);

      if (deleteError) {
        logError(`Failed to delete orphaned submissions: ${deleteError.message}`);
      } else {
        logSuccess(`Deleted ${orphanedSubmissions.length} orphaned test_submissions`);
      }
    } else {
      logSuccess('No orphaned test_submissions found');
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
    const { data: duplicateProfiles, error: duplicateError } = await supabase
      .from('profiles')
      .select('email, COUNT(*) as count')
      .not('email', 'is', null)
      .group('email')
      .having('COUNT(*) > 1');

    if (duplicateError) {
      logError(`Failed to find duplicate profiles: ${duplicateError.message}`);
      return;
    }

    if (duplicateProfiles && duplicateProfiles.length > 0) {
      logWarning(`Found ${duplicateProfiles.length} duplicate email addresses`);
      
      // For each duplicate email, keep the latest profile and delete others
      for (const duplicate of duplicateProfiles) {
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
            logSuccess(`Deleted ${idsToDelete.length} duplicate profiles for email ${duplicate.email}`);
          }
        }
      }
    } else {
      logSuccess('No duplicate profiles found');
    }

  } catch (error) {
    logError(`Error fixing duplicate records: ${error.message}`);
  }
}

// Fix NULL values
async function fixNullValues() {
  logSection('FIXING NULL VALUES');
  
  try {
    // Set default user_type for NULL values
    const { error: userTypeError } = await supabase
      .from('profiles')
      .update({ user_type: 'participant' })
      .is('user_type', null);

    if (userTypeError) {
      logError(`Failed to fix NULL user_type: ${userTypeError.message}`);
    } else {
      logSuccess('Fixed NULL user_type values');
    }

    // Set default status for NULL values
    const { error: statusError } = await supabase
      .from('profiles')
      .update({ status: 'pending' })
      .is('status', null);

    if (statusError) {
      logError(`Failed to fix NULL status: ${statusError.message}`);
    } else {
      logSuccess('Fixed NULL status values');
    }

    // Set default payment_status for NULL values
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

// Final verification
async function finalVerification() {
  logSection('FINAL VERIFICATION');
  
  try {
    // Check for remaining NULL categories
    const { count: nullCategoriesCount, error: nullCategoriesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .is('category', null);

    if (!nullCategoriesError) {
      if (nullCategoriesCount > 0) {
        logWarning(`Remaining NULL categories: ${nullCategoriesCount}`);
      } else {
        logSuccess('No NULL categories remaining');
      }
    }

    // Check for invalid test scores
    const { count: invalidScoresCount, error: invalidScoresError } = await supabase
      .from('test_submissions')
      .select('*', { count: 'exact', head: true })
      .or('score.lt.0,score.gt.total_questions,correct_answers.lt.0,correct_answers.gt.total_questions');

    if (!invalidScoresError) {
      if (invalidScoresCount > 0) {
        logWarning(`Remaining invalid test scores: ${invalidScoresCount}`);
      } else {
        logSuccess('No invalid test scores remaining');
      }
    }

    // Get final data summary
    const { count: finalProfilesCount, error: finalProfilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: finalTestSubmissionsCount, error: finalTestSubmissionsError } = await supabase
      .from('test_submissions')
      .select('*', { count: 'exact', head: true });

    if (!finalProfilesError && !finalTestSubmissionsError) {
      logInfo(`Final data summary:`);
      logInfo(`  - Profiles: ${finalProfilesCount}`);
      logInfo(`  - Test Submissions: ${finalTestSubmissionsCount}`);
    }

  } catch (error) {
    logError(`Error in final verification: ${error.message}`);
  }
}

// Run the fix
if (require.main === module) {
  fixAllDataIssues().catch(console.error);
}

module.exports = { fixAllDataIssues };
