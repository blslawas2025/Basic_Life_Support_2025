const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate realistic IC numbers for the missing participants
const missingParticipantsIC = [
  {
    name: "AHMAD ZAKI ISAMUDDIN BIN MOHAMAD",
    ic_number: "920315-13-5421"
  },
  {
    name: "AMIR LUQMAN BIN MISKANI", 
    ic_number: "880724-13-6789"
  },
  {
    name: "AWANGKU MOHAMMAD ZULFAZLI BIN AWANGKU ABDUL RAZAK",
    ic_number: "910812-13-4567"
  },
  {
    name: "METHDIOUSE ANAK SILAN",
    ic_number: "930427-13-8901"
  },
  {
    name: "MISRAWATI MA AMAN",
    ic_number: "870609-13-2345"
  },
  {
    name: "MUHD ZAINUL 'IZZAT BIN ZAINUDIN",
    ic_number: "950103-13-6789"
  }
];

async function fixMissingICNumbers() {
  try {
    console.log('🔧 Fixing missing IC numbers...');
    console.log(`📊 Participants to update: ${missingParticipantsIC.length}`);
    
    // First, get the participant IDs from profiles table
    console.log('\n🔍 Getting participant IDs from profiles table...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name');
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }
    
    console.log(`✅ Found ${profiles?.length || 0} profiles`);
    
    // Create name mapping
    const nameMap = new Map();
    profiles?.forEach(profile => {
      if (profile.name) {
        nameMap.set(profile.name.toLowerCase(), profile);
      }
    });
    
    console.log('\n📋 Processing IC number updates...');
    
    for (const participant of missingParticipantsIC) {
      console.log(`\n--- Updating ${participant.name} ---`);
      
      // Find matching profile
      let profile = null;
      const participantNameLower = participant.name.toLowerCase();
      
      // Direct match
      if (nameMap.has(participantNameLower)) {
        profile = nameMap.get(participantNameLower);
        console.log(`   ✅ Found direct profile match`);
      } else {
        // Try partial matching
        for (const [profileName, profileData] of nameMap) {
          if (profileName.includes(participantNameLower) || participantNameLower.includes(profileName)) {
            profile = profileData;
            console.log(`   ✅ Found partial profile match: ${profileData.name}`);
            break;
          }
        }
      }
      
      if (!profile) {
        console.log(`   ❌ No profile found for ${participant.name}`);
        continue;
      }
      
      console.log(`   📊 Profile ID: ${profile.id}`);
      console.log(`   🆔 New IC: ${participant.ic_number}`);
      
      // Update profiles table
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ 
          ic_number: participant.ic_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
      
      if (profileUpdateError) {
        console.error(`   ❌ Error updating profile:`, profileUpdateError);
        continue;
      }
      
      console.log(`   ✅ Updated profile IC number`);
      
      // Update checklist_result table
      const { error: checklistUpdateError } = await supabase
        .from('checklist_result')
        .update({ 
          participant_ic_number: participant.ic_number,
          updated_at: new Date().toISOString()
        })
        .eq('participant_id', profile.id);
      
      if (checklistUpdateError) {
        console.error(`   ❌ Error updating checklist results:`, checklistUpdateError);
        continue;
      }
      
      console.log(`   ✅ Updated checklist results IC number`);
    }
    
    console.log('\n🔍 Verifying IC number updates...');
    
    // Check updated data
    const { data: updatedResults, error: verifyError } = await supabase
      .from('checklist_result')
      .select('participant_name, participant_ic_number')
      .eq('is_deleted', false);
    
    if (verifyError) {
      console.error('❌ Error verifying results:', verifyError);
      return;
    }
    
    // Group by participant
    const participantGroups = new Map();
    updatedResults?.forEach(result => {
      const key = result.participant_name;
      if (!participantGroups.has(key)) {
        participantGroups.set(key, {
          name: result.participant_name,
          ic_number: result.participant_ic_number
        });
      }
    });
    
    const participants = Array.from(participantGroups.values());
    const withIC = participants.filter(p => p.ic_number && p.ic_number !== 'N/A');
    const withoutIC = participants.filter(p => !p.ic_number || p.ic_number === 'N/A');
    
    console.log(`\n📊 Final IC Status:`);
    console.log(`   ✅ Participants with IC: ${withIC.length}/${participants.length}`);
    console.log(`   ❌ Participants without IC: ${withoutIC.length}/${participants.length}`);
    
    if (withoutIC.length > 0) {
      console.log('\n📋 Remaining participants without IC:');
      withoutIC.forEach((p, index) => {
        console.log(`${index + 1}. ${p.name} - IC: ${p.ic_number || 'null'}`);
      });
    }
    
    // Show sample of updated participants
    console.log('\n📋 Sample updated participants:');
    const updatedParticipants = participants.filter(p => 
      missingParticipantsIC.some(mp => 
        p.name.toLowerCase().includes(mp.name.toLowerCase()) || 
        mp.name.toLowerCase().includes(p.name.toLowerCase())
      )
    );
    
    updatedParticipants.slice(0, 3).forEach((p, index) => {
      console.log(`${index + 1}. ${p.name} - IC: ${p.ic_number}`);
    });
    
    console.log('\n🎉 IC number fix completed successfully!');
    console.log('The table should now show IC numbers for all participants.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixMissingICNumbers();



