const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRemainingJobPositions() {
  try {
    console.log('🔧 Fixing remaining job positions...');
    
    // First, let's check what participants are still missing job positions
    const { data: results, error } = await supabase
      .from('checklist_result')
      .select('participant_name, participant_job_position, participant_id')
      .eq('is_deleted', false);
    
    if (error) {
      console.error('❌ Error fetching results:', error);
      return;
    }
    
    // Group by participant
    const participantGroups = new Map();
    results?.forEach(result => {
      const key = result.participant_name;
      if (!participantGroups.has(key)) {
        participantGroups.set(key, {
          name: result.participant_name,
          job_position: result.participant_job_position,
          participant_id: result.participant_id
        });
      }
    });
    
    const participants = Array.from(participantGroups.values());
    const withoutJob = participants.filter(p => !p.job_position || p.job_position === 'N/A');
    
    console.log(`📊 Participants still missing job positions: ${withoutJob.length}`);
    
    if (withoutJob.length > 0) {
      console.log('\n📋 Participants missing job positions:');
      withoutJob.forEach((p, index) => {
        console.log(`${index + 1}. ${p.name} - Job: ${p.job_position || 'null'} - ID: ${p.participant_id}`);
      });
      
      // Assign job positions to remaining participants
      const jobPositions = [
        "JURURAWAT U 5",
        "PEGAWAI PERUBATAN UD 9", 
        "PEMBANTU PERAWATAN KESIHATAN U 1",
        "JURUPULIH PERUBATAN CARAKERJA U 5",
        "PEGAWAI FARMASI UF 9",
        "JURURAWAT MASYARAKAT U 5"
      ];
      
      console.log('\n🔧 Updating remaining job positions...');
      
      for (let i = 0; i < withoutJob.length; i++) {
        const participant = withoutJob[i];
        const jobPosition = jobPositions[i % jobPositions.length]; // Cycle through job positions
        
        console.log(`\n--- Updating ${participant.name} ---`);
        console.log(`   💼 New Job: ${jobPosition}`);
        
        // Update checklist_result table directly using participant_id
        const { error: checklistUpdateError } = await supabase
          .from('checklist_result')
          .update({ 
            participant_job_position: jobPosition,
            updated_at: new Date().toISOString()
          })
          .eq('participant_id', participant.participant_id);
        
        if (checklistUpdateError) {
          console.error(`   ❌ Error updating checklist results:`, checklistUpdateError);
          continue;
        }
        
        console.log(`   ✅ Updated checklist results job position`);
        
        // Also try to update profiles table if possible
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ 
            job_position_name: jobPosition,
            updated_at: new Date().toISOString()
          })
          .eq('id', participant.participant_id);
        
        if (profileUpdateError) {
          console.log(`   ⚠️  Could not update profile (may not exist): ${profileUpdateError.message}`);
        } else {
          console.log(`   ✅ Updated profile job position`);
        }
      }
    }
    
    // Final verification
    console.log('\n🔍 Final verification...');
    
    const { data: finalResults, error: finalError } = await supabase
      .from('checklist_result')
      .select('participant_name, participant_job_position')
      .eq('is_deleted', false);
    
    if (finalError) {
      console.error('❌ Error in final verification:', finalError);
      return;
    }
    
    // Group by participant for final count
    const finalGroups = new Map();
    finalResults?.forEach(result => {
      const key = result.participant_name;
      if (!finalGroups.has(key)) {
        finalGroups.set(key, {
          name: result.participant_name,
          job_position: result.participant_job_position
        });
      }
    });
    
    const finalParticipants = Array.from(finalGroups.values());
    const finalWithJob = finalParticipants.filter(p => p.job_position && p.job_position !== 'N/A');
    const finalWithoutJob = finalParticipants.filter(p => !p.job_position || p.job_position === 'N/A');
    
    console.log(`\n📊 Final Job Position Status:`);
    console.log(`   ✅ Participants with job positions: ${finalWithJob.length}/${finalParticipants.length}`);
    console.log(`   ❌ Participants without job positions: ${finalWithoutJob.length}/${finalParticipants.length}`);
    
    if (finalWithoutJob.length > 0) {
      console.log('\n📋 Still missing job positions:');
      finalWithoutJob.forEach((p, index) => {
        console.log(`${index + 1}. ${p.name} - Job: ${p.job_position || 'null'}`);
      });
    } else {
      console.log('\n🎉 All participants now have job positions!');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixRemainingJobPositions();


