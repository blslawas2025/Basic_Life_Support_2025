// Script to assign all profiles with user roles to BLS Siri 1 2025 course session
// Run this script after setting up the course sessions table

const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase URL and anon key
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function assignProfilesToSiri1() {
  try {
    console.log('🚀 Starting profile assignment to BLS Siri 1 2025...');
    
    // First, get the course session ID for "BLS Siri 1 2025"
    console.log('📚 Looking for BLS Siri 1 2025 course session...');
    const { data: courseSession, error: courseError } = await supabase
      .from('course_sessions')
      .select('id, full_name')
      .eq('full_name', 'BLS Siri 1 2025')
      .single();

    if (courseError) {
      console.error('❌ Error finding course session:', courseError);
      return;
    }

    if (!courseSession) {
      console.error('❌ BLS Siri 1 2025 course session not found. Please create it first.');
      return;
    }

    console.log('✅ Found course session:', courseSession.full_name, 'ID:', courseSession.id);

    // Get all profiles with user roles (participant, staff, admin, super_admin)
    console.log('👥 Fetching all profiles with user roles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, user_type, course_session_id')
      .in('user_type', ['participant', 'staff', 'admin', 'super_admin']);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`📊 Found ${profiles.length} profiles with user roles`);

    // Filter profiles that don't already have a course session assigned
    const profilesToUpdate = profiles.filter(profile => !profile.course_session_id);
    console.log(`🔄 ${profilesToUpdate.length} profiles need course session assignment`);

    if (profilesToUpdate.length === 0) {
      console.log('✅ All profiles already have course sessions assigned');
      return;
    }

    // Update profiles in batches
    const batchSize = 10;
    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < profilesToUpdate.length; i += batchSize) {
      const batch = profilesToUpdate.slice(i, i + batchSize);
      
      console.log(`📝 Updating batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(profilesToUpdate.length / batchSize)}...`);
      
      for (const profile of batch) {
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ course_session_id: courseSession.id })
            .eq('id', profile.id);

          if (updateError) {
            console.error(`❌ Error updating profile ${profile.name} (${profile.email}):`, updateError);
            errorCount++;
          } else {
            console.log(`✅ Updated: ${profile.name} (${profile.user_type})`);
            updatedCount++;
          }
        } catch (error) {
          console.error(`❌ Exception updating profile ${profile.name}:`, error);
          errorCount++;
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < profilesToUpdate.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('\n🎉 Assignment completed!');
    console.log(`✅ Successfully updated: ${updatedCount} profiles`);
    console.log(`❌ Errors: ${errorCount} profiles`);
    console.log(`📊 Total processed: ${updatedCount + errorCount} profiles`);

    // Verify the update
    console.log('\n🔍 Verifying assignment...');
    const { data: updatedProfiles, error: verifyError } = await supabase
      .from('profiles')
      .select('id, name, user_type, course_session_id')
      .eq('course_session_id', courseSession.id);

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
    } else {
      console.log(`✅ Verification: ${updatedProfiles.length} profiles now assigned to BLS Siri 1 2025`);
      
      // Show breakdown by user type
      const breakdown = updatedProfiles.reduce((acc, profile) => {
        acc[profile.user_type] = (acc[profile.user_type] || 0) + 1;
        return acc;
      }, {});

      console.log('📊 Breakdown by user type:');
      Object.entries(breakdown).forEach(([userType, count]) => {
        console.log(`   ${userType}: ${count}`);
      });
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the script
assignProfilesToSiri1();
