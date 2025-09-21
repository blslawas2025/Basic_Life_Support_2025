// Simple Data Fix Script
// This script fixes data issues using the service key

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY3ODkyOSwiZXhwIjoyMDczMjU0OTI5fQ.YS3fbDXijyRShozK8VgLlIlFf5hadyEHAkHXcj2CK-Q';

// Create client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Starting data fix...');

async function fixData() {
  try {
    // Test connection by getting profiles count
    console.log('📊 Testing connection...');
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }

    console.log(`✅ Connected! Found ${count} profiles`);

    // Fix 1: NULL categories
    console.log('\n🔧 Fixing NULL categories...');
    
    // Get profiles with NULL categories
    const { data: nullProfiles, error: nullError } = await supabase
      .from('profiles')
      .select('id, job_position_name')
      .is('category', null);

    if (nullError) {
      console.error('❌ Error fetching NULL categories:', nullError.message);
    } else if (nullProfiles && nullProfiles.length > 0) {
      console.log(`Found ${nullProfiles.length} profiles with NULL categories`);
      
      // Fix each profile
      for (const profile of nullProfiles) {
        const jobName = profile.job_position_name || '';
        let category = null;

        // Check for Clinical positions
        if (jobName.toUpperCase().includes('JURURAWAT') || 
            jobName.toUpperCase().includes('PEGAWAI PERGIGIAN') ||
            jobName.toUpperCase().includes('PEGAWAI PERUBATAN') ||
            jobName.toUpperCase().includes('PENOLONG PEGAWAI PERUBATAN') ||
            jobName.toUpperCase().includes('PEMBANTU PERAWATAN')) {
          category = 'Clinical';
        }
        // Check for Non-Clinical positions
        else if (jobName.toUpperCase().includes('PEGAWAI FARMASI') ||
                 jobName.toUpperCase().includes('JURUTEKNOLOGI') ||
                 jobName.toUpperCase().includes('JURUPULIH') ||
                 jobName.toUpperCase().includes('PENOLONG PEGAWAI TADBIR') ||
                 jobName.toUpperCase().includes('PEMBANTU KHIDMAT')) {
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
          }
        }
      }
    } else {
      console.log('✅ No profiles with NULL categories found');
    }

    // Fix 2: Invalid test scores
    console.log('\n🔧 Fixing invalid test scores...');
    
    // Fix negative scores
    const { error: negativeError } = await supabase
      .from('test_submissions')
      .update({ score: 0 })
      .lt('score', 0);

    if (negativeError) {
      console.error('❌ Error fixing negative scores:', negativeError.message);
    } else {
      console.log('✅ Fixed negative scores');
    }

    // Fix scores > total_questions - we'll get all records and check manually
    const { data: allTestSubmissions, error: fetchError } = await supabase
      .from('test_submissions')
      .select('id, score, total_questions');

    if (fetchError) {
      console.error('❌ Error fetching test submissions:', fetchError.message);
    } else if (allTestSubmissions && allTestSubmissions.length > 0) {
      // Find records where score > total_questions
      const excessiveScores = allTestSubmissions.filter(record => record.score > record.total_questions);
      
      if (excessiveScores.length > 0) {
        console.log(`Found ${excessiveScores.length} excessive scores to fix`);
        
        for (const record of excessiveScores) {
          const { error: updateError } = await supabase
            .from('test_submissions')
            .update({ score: record.total_questions })
            .eq('id', record.id);

          if (updateError) {
            console.error(`❌ Failed to fix score for record ${record.id}:`, updateError.message);
          }
        }
        console.log('✅ Fixed excessive scores');
      } else {
        console.log('✅ No excessive scores found');
      }
    } else {
      console.log('✅ No test submissions found');
    }

    // Fix 3: NULL values
    console.log('\n🔧 Fixing NULL values...');
    
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

    // Final verification
    console.log('\n📊 Final verification...');
    
    const { count: finalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    const { count: finalTestSubmissions } = await supabase
      .from('test_submissions')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Final counts: ${finalProfiles} profiles, ${finalTestSubmissions} test submissions`);
    console.log('🎉 Data fix completed!');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

// Run the fix
fixData();
