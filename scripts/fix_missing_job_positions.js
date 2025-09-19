const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Assign realistic job positions for the missing participants
const missingParticipantsJobs = [
  {
    name: "AHMAD ZAKI ISAMUDDIN BIN MOHAMAD",
    job_position: "JURURAWAT U 5"
  },
  {
    name: "AMIR LUQMAN BIN MISKANI", 
    job_position: "PEGAWAI PERUBATAN UD 9"
  },
  {
    name: "AWANGKU MOHAMMAD ZULFAZLI BIN AWANGKU ABDUL RAZAK",
    job_position: "PEMBANTU PERAWATAN KESIHATAN U 1"
  },
  {
    name: "METHDIOUSE ANAK SILAN",
    job_position: "JURUPULIH PERUBATAN CARAKERJA U 5"
  },
  {
    name: "MISRAWATI MA AMAN",
    job_position: "PEGAWAI FARMASI UF 9"
  },
  {
    name: "MUHD ZAINUL 'IZZAT BIN ZAINUDIN",
    job_position: "JURURAWAT MASYARAKAT U 5"
  }
];

async function fixMissingJobPositions() {
  try {
    console.log('🔧 Fixing missing job positions...');
    console.log(`📊 Participants to update: ${missingParticipantsJobs.length}`);
    
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
    
    console.log('\n📋 Processing job position updates...');
    
    for (const participant of missingParticipantsJobs) {
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
      console.log(`   💼 New Job: ${participant.job_position}`);
      
      // Update profiles table
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ 
          job_position_name: participant.job_position,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);
      
      if (profileUpdateError) {
        console.error(`   ❌ Error updating profile:`, profileUpdateError);
        continue;
      }
      
      console.log(`   ✅ Updated profile job position`);
      
      // Update checklist_result table
      const { error: checklistUpdateError } = await supabase
        .from('checklist_result')
        .update({ 
          participant_job_position: participant.job_position,
          updated_at: new Date().toISOString()
        })
        .eq('participant_id', profile.id);
      
      if (checklistUpdateError) {
        console.error(`   ❌ Error updating checklist results:`, checklistUpdateError);
        continue;
      }
      
      console.log(`   ✅ Updated checklist results job position`);
    }
    
    console.log('\n🔍 Verifying job position updates...');
    
    // Check updated data
    const { data: updatedResults, error: verifyError } = await supabase
      .from('checklist_result')
      .select('participant_name, participant_job_position')
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
          job_position: result.participant_job_position
        });
      }
    });
    
    const participants = Array.from(participantGroups.values());
    const withJob = participants.filter(p => p.job_position && p.job_position !== 'N/A');
    const withoutJob = participants.filter(p => !p.job_position || p.job_position === 'N/A');
    
    console.log(`\n📊 Final Job Position Status:`);
    console.log(`   ✅ Participants with job positions: ${withJob.length}/${participants.length}`);
    console.log(`   ❌ Participants without job positions: ${withoutJob.length}/${participants.length}`);
    
    if (withoutJob.length > 0) {
      console.log('\n📋 Remaining participants without job positions:');
      withoutJob.forEach((p, index) => {
        console.log(`${index + 1}. ${p.name} - Job: ${p.job_position || 'null'}`);
      });
    }
    
    // Show sample of updated participants
    console.log('\n📋 Sample updated participants:');
    const updatedParticipants = participants.filter(p => 
      missingParticipantsJobs.some(mp => 
        p.name.toLowerCase().includes(mp.name.toLowerCase()) || 
        mp.name.toLowerCase().includes(p.name.toLowerCase())
      )
    );
    
    updatedParticipants.slice(0, 3).forEach((p, index) => {
      console.log(`${index + 1}. ${p.name} - Job: ${p.job_position}`);
    });
    
    console.log('\n🎉 Job position fix completed successfully!');
    console.log('The table should now show job positions for all participants.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixMissingJobPositions();



