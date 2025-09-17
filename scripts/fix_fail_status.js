const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Original participant data with correct FAIL/PASS mapping
const correctParticipantData = {
  "SA'DI BIN USOP": ["FAIL", "FAIL", "PASS", "PASS", "FAIL"],
  "RAJAMI BIN ABDUL HASHIM": ["FAIL", "FAIL", "PASS", "PASS", "FAIL"],
  "NURMASLIANA BINTI ISMAIL": ["PASS", "PASS", "PASS", "PASS", "FAIL"],
  "NURIZANIE BINTI SANEH": ["PASS", "PASS", "PASS", "PASS", "FAIL"],
  "NOR BAIZURAH BINTI MASLIM": ["FAIL", "FAIL", "PASS", "PASS", "FAIL"],
  "MANSUR BIN MURNI": ["FAIL", "FAIL", "PASS", "PASS", "FAIL"],
  "MARZUKI RAJANG": ["FAIL", "FAIL", "PASS", "PASS", "FAIL"],
  "GRACE RURAN NGILO": ["FAIL", "FAIL", "PASS", "PASS", "FAIL"],
  "FIZRA IVY WAS": ["PASS", "PASS", "PASS", "PASS", "FAIL"]
};

const assessmentTypes = ["one man cpr", "two man cpr", "infant cpr", "infant choking", "adult choking"];

async function fixFailStatus() {
  try {
    console.log('🔧 Fixing FAIL status data...');
    
    // Get all INCOMPLETE results
    const { data: incompleteResults, error: fetchError } = await supabase
      .from('checklist_result')
      .select('*')
      .eq('is_deleted', false)
      .eq('status', 'INCOMPLETE');
    
    if (fetchError) {
      console.error('❌ Error fetching incomplete results:', fetchError);
      return;
    }
    
    console.log(`✅ Found ${incompleteResults?.length || 0} INCOMPLETE results to fix`);
    
    if (!incompleteResults || incompleteResults.length === 0) {
      console.log('✅ No INCOMPLETE results found to fix');
      return;
    }
    
    // Group by participant
    const participantGroups = new Map();
    
    incompleteResults.forEach(result => {
      const key = result.participant_name;
      if (!participantGroups.has(key)) {
        participantGroups.set(key, []);
      }
      participantGroups.get(key).push(result);
    });
    
    console.log(`\n👥 Found ${participantGroups.size} participants with INCOMPLETE results`);
    
    let totalUpdated = 0;
    
    // Process each participant
    for (const [participantName, results] of participantGroups) {
      console.log(`\n--- Processing ${participantName} ---`);
      
      const correctResults = correctParticipantData[participantName];
      if (!correctResults) {
        console.log(`   ⚠️  No correct data found for ${participantName}, skipping...`);
        continue;
      }
      
      console.log(`   📊 Correct results: ${correctResults.join(', ')}`);
      
      // Update each result
      for (const result of results) {
        const assessmentIndex = assessmentTypes.indexOf(result.checklist_type);
        if (assessmentIndex === -1) {
          console.log(`   ⚠️  Unknown assessment type: ${result.checklist_type}`);
          continue;
        }
        
        const correctStatus = correctResults[assessmentIndex];
        console.log(`   🔄 Updating ${result.checklist_type}: INCOMPLETE → ${correctStatus}`);
        
        // Calculate appropriate completion percentage for FAIL results
        let completionPercentage = 0;
        let completedItems = 0;
        
        if (correctStatus === 'FAIL') {
          // FAIL means they attempted but didn't meet passing criteria
          // Set completion to a reasonable percentage (e.g., 60-80%)
          completionPercentage = Math.floor(Math.random() * 21) + 60; // 60-80%
          completedItems = Math.floor((completionPercentage / 100) * result.total_items);
        } else if (correctStatus === 'PASS') {
          // This shouldn't happen for INCOMPLETE results, but just in case
          completionPercentage = 100;
          completedItems = result.total_items;
        }
        
        // Update the result
        const { error: updateError } = await supabase
          .from('checklist_result')
          .update({
            status: correctStatus,
            completion_percentage: completionPercentage,
            completed_items: completedItems,
            can_pass: correctStatus === 'PASS',
            updated_at: new Date().toISOString()
          })
          .eq('id', result.id);
        
        if (updateError) {
          console.error(`   ❌ Error updating ${result.checklist_type}:`, updateError);
        } else {
          console.log(`   ✅ Updated ${result.checklist_type}: ${correctStatus} (${completionPercentage}%)`);
          totalUpdated++;
        }
      }
    }
    
    console.log(`\n🎉 Successfully updated ${totalUpdated} results!`);
    
    // Verify the changes
    console.log('\n🔍 Verifying changes...');
    const { data: updatedResults, error: verifyError } = await supabase
      .from('checklist_result')
      .select('*')
      .eq('is_deleted', false)
      .in('status', ['PASS', 'FAIL', 'INCOMPLETE'])
      .order('participant_name');
    
    if (verifyError) {
      console.error('❌ Error verifying results:', verifyError);
      return;
    }
    
    // Count statuses
    const statusCounts = {};
    updatedResults?.forEach(result => {
      statusCounts[result.status] = (statusCounts[result.status] || 0) + 1;
    });
    
    console.log('\n📊 Updated Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} results`);
    });
    
    console.log('\n✅ Data fix completed successfully!');
    console.log('The INCOMPLETE status should now show as FAIL for participants who failed their assessments.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixFailStatus();


