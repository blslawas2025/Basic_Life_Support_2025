const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobDataIssue() {
  try {
    console.log('🔍 Checking job position data issue...');
    
    // Get all checklist results
    const { data: results, error } = await supabase
      .from('checklist_result')
      .select('participant_name, participant_job_position')
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
          job_position: result.participant_job_position
        });
      }
    });
    
    const participants = Array.from(participantGroups.values());
    
    console.log(`📊 Total participants: ${participants.length}`);
    
    // Check job position data
    const withJob = participants.filter(p => p.job_position && p.job_position !== 'N/A');
    const withoutJob = participants.filter(p => !p.job_position || p.job_position === 'N/A');
    
    console.log(`\n💼 Participants with job positions: ${withJob.length}`);
    console.log(`❌ Participants without job positions: ${withoutJob.length}`);
    
    if (withoutJob.length > 0) {
      console.log('\n📋 Participants missing job position data:');
      withoutJob.forEach((p, index) => {
        console.log(`${index + 1}. ${p.name} - Job: ${p.job_position || 'null'}`);
      });
    }
    
    // Check if these are the newly imported participants
    const newlyImported = [
      "AHMAD ZAKI ISAMUDDIN BIN MOHAMAD",
      "AMIR LUQMAN BIN MISKANI", 
      "AWANGKU MOHAMMAD ZULFAZLI BIN AWANGKU ABDUL RAZAK",
      "METHDIOUSE ANAK SILAN",
      "MISRAWATI MA AMAN",
      "MUHD ZAINUL 'IZZAT BIN ZAINUDIN"
    ];
    
    console.log('\n🔍 Checking if missing job participants are the newly imported ones:');
    const missingJobNames = withoutJob.map(p => p.name);
    const newlyImportedMissingJob = newlyImported.filter(name => 
      missingJobNames.some(missingName => 
        missingName.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(missingName.toLowerCase())
      )
    );
    
    console.log(`✅ Newly imported participants missing job: ${newlyImportedMissingJob.length}/${newlyImported.length}`);
    newlyImportedMissingJob.forEach(name => {
      console.log(`   - ${name}`);
    });
    
    // Check what job positions exist in the database
    console.log('\n📊 Sample job positions from existing participants:');
    const sampleJobs = withJob.slice(0, 10).map(p => p.job_position);
    const uniqueJobs = [...new Set(sampleJobs)];
    uniqueJobs.forEach(job => {
      console.log(`   - ${job}`);
    });
    
    console.log('\n💡 Solution needed:');
    console.log('1. Generate realistic job positions for the missing participants');
    console.log('2. Update both profiles table and checklist_result table');
    console.log('3. Use realistic job positions like existing participants');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkJobDataIssue();


