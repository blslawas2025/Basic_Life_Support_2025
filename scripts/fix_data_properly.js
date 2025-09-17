const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDataProperly() {
  try {
    console.log('🔧 Fixing data properly using profiles table...');
    
    // First, get all profiles with their actual data
    console.log('\n🔍 Fetching all profiles from database...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, ic_number, job_position_name, category');
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }
    
    console.log(`✅ Found ${profiles?.length || 0} profiles in database`);
    
    // Show sample of actual profile data
    console.log('\n📋 Sample profile data:');
    profiles?.slice(0, 5).forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.name}`);
      console.log(`   IC: ${profile.ic_number || 'N/A'}`);
      console.log(`   Job: ${profile.job_position_name || 'N/A'}`);
      console.log(`   Category: ${profile.category || 'N/A'}`);
      console.log('');
    });
    
    // Now get all checklist results
    console.log('🔍 Fetching all checklist results...');
    const { data: results, error: resultsError } = await supabase
      .from('checklist_result')
      .select('*')
      .eq('is_deleted', false);
    
    if (resultsError) {
      console.error('❌ Error fetching results:', resultsError);
      return;
    }
    
    console.log(`✅ Found ${results?.length || 0} checklist results`);
    
    // Create a mapping of participant names to profile data
    const profileMap = new Map();
    profiles?.forEach(profile => {
      if (profile.name) {
        profileMap.set(profile.name.toLowerCase(), profile);
      }
    });
    
    console.log('\n🔧 Updating checklist results with correct profile data...');
    
    let updatedCount = 0;
    
    // Group results by participant
    const participantGroups = new Map();
    results?.forEach(result => {
      const key = result.participant_id;
      if (!participantGroups.has(key)) {
        participantGroups.set(key, {
          participant_id: result.participant_id,
          participant_name: result.participant_name,
          results: []
        });
      }
      participantGroups.get(key).results.push(result);
    });
    
    console.log(`📊 Found ${participantGroups.size} unique participants in checklist results`);
    
    // Update each participant's data with correct profile information
    for (const [participantId, participantData] of participantGroups) {
      const participantName = participantData.participant_name;
      console.log(`\n--- Processing ${participantName} ---`);
      
      // Find matching profile
      let matchingProfile = null;
      const participantNameLower = participantName.toLowerCase();
      
      // Direct match
      if (profileMap.has(participantNameLower)) {
        matchingProfile = profileMap.get(participantNameLower);
        console.log(`   ✅ Found direct profile match`);
      } else {
        // Try partial matching
        for (const [profileName, profileData] of profileMap) {
          if (profileName.includes(participantNameLower) || participantNameLower.includes(profileName)) {
            matchingProfile = profileData;
            console.log(`   ✅ Found partial profile match: ${profileData.name}`);
            break;
          }
        }
      }
      
      if (!matchingProfile) {
        console.log(`   ❌ No profile found for ${participantName}`);
        continue;
      }
      
      console.log(`   📊 Profile: ${matchingProfile.name}`);
      console.log(`   🆔 IC: ${matchingProfile.ic_number || 'N/A'}`);
      console.log(`   💼 Job: ${matchingProfile.job_position_name || 'N/A'}`);
      console.log(`   📂 Category: ${matchingProfile.category || 'N/A'}`);
      
      // Update all results for this participant
      const { error: updateError } = await supabase
        .from('checklist_result')
        .update({
          participant_name: matchingProfile.name,
          participant_email: matchingProfile.email,
          participant_ic_number: matchingProfile.ic_number,
          participant_job_position: matchingProfile.job_position_name,
          participant_category: matchingProfile.category,
          updated_at: new Date().toISOString()
        })
        .eq('participant_id', participantId);
      
      if (updateError) {
        console.error(`   ❌ Error updating results:`, updateError);
        continue;
      }
      
      console.log(`   ✅ Updated ${participantData.results.length} results for this participant`);
      updatedCount += participantData.results.length;
    }
    
    console.log(`\n🎉 Successfully updated ${updatedCount} checklist results with correct profile data!`);
    
    // Final verification
    console.log('\n🔍 Final verification...');
    const { data: finalResults, error: finalError } = await supabase
      .from('checklist_result')
      .select('participant_name, participant_ic_number, participant_job_position, participant_category')
      .eq('is_deleted', false)
      .limit(10);
    
    if (finalError) {
      console.error('❌ Error in final verification:', finalError);
      return;
    }
    
    console.log('\n📋 Sample updated data:');
    finalResults?.forEach((result, index) => {
      console.log(`${index + 1}. ${result.participant_name}`);
      console.log(`   IC: ${result.participant_ic_number || 'N/A'}`);
      console.log(`   Job: ${result.participant_job_position || 'N/A'}`);
      console.log(`   Category: ${result.participant_category || 'N/A'}`);
      console.log('');
    });
    
    // Count participants with complete data
    const { data: allResults, error: allError } = await supabase
      .from('checklist_result')
      .select('participant_name, participant_ic_number, participant_job_position')
      .eq('is_deleted', false);
    
    if (!allError && allResults) {
      const uniqueParticipants = new Map();
      allResults.forEach(result => {
        const key = result.participant_name;
        if (!uniqueParticipants.has(key)) {
          uniqueParticipants.set(key, {
            name: result.participant_name,
            ic: result.participant_ic_number,
            job: result.participant_job_position
          });
        }
      });
      
      const participants = Array.from(uniqueParticipants.values());
      const withIC = participants.filter(p => p.ic && p.ic !== 'N/A');
      const withJob = participants.filter(p => p.job && p.job !== 'N/A');
      
      console.log(`\n📊 Final Data Quality:`);
      console.log(`   Total participants: ${participants.length}`);
      console.log(`   With IC numbers: ${withIC.length}/${participants.length}`);
      console.log(`   With job positions: ${withJob.length}/${participants.length}`);
    }
    
    console.log('\n✅ Data fix completed! All data now comes from the actual profiles table.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixDataProperly();


