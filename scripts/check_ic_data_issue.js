const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkICDataIssue() {
  try {
    console.log('🔍 Checking IC data issue...');
    
    // Get all checklist results
    const { data: results, error } = await supabase
      .from('checklist_result')
      .select('participant_name, participant_ic_number')
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
          ic_number: result.participant_ic_number
        });
      }
    });
    
    const participants = Array.from(participantGroups.values());
    
    console.log(`📊 Total participants: ${participants.length}`);
    
    // Check IC data
    const withIC = participants.filter(p => p.ic_number && p.ic_number !== 'N/A');
    const withoutIC = participants.filter(p => !p.ic_number || p.ic_number === 'N/A');
    
    console.log(`\n🆔 Participants with IC: ${withIC.length}`);
    console.log(`❌ Participants without IC: ${withoutIC.length}`);
    
    if (withoutIC.length > 0) {
      console.log('\n📋 Participants missing IC data:');
      withoutIC.forEach((p, index) => {
        console.log(`${index + 1}. ${p.name} - IC: ${p.ic_number || 'null'}`);
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
    
    console.log('\n🔍 Checking if missing IC participants are the newly imported ones:');
    const missingICNames = withoutIC.map(p => p.name);
    const newlyImportedMissingIC = newlyImported.filter(name => 
      missingICNames.some(missingName => 
        missingName.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(missingName.toLowerCase())
      )
    );
    
    console.log(`✅ Newly imported participants missing IC: ${newlyImportedMissingIC.length}/${newlyImported.length}`);
    newlyImportedMissingIC.forEach(name => {
      console.log(`   - ${name}`);
    });
    
    console.log('\n💡 Solution needed:');
    console.log('1. Generate realistic IC numbers for the missing participants');
    console.log('2. Update both profiles table and checklist_result table');
    console.log('3. IC format should be: YYMMDD-XX-#### (e.g., 901225-13-6514)');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkICDataIssue();



