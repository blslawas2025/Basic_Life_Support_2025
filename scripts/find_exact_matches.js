const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

// The 5 missing participants from the original 56 list
const missingOriginalParticipants = [
  "AHMAD ZAKI ISAMUDDIN BIN MOHAMAD",
  "AWANGKU MOHAMMAD ZULFAZLI BIN AWANGKU ABDUL RAZAK",
  "METHDIOUSE ANAK SILAN",
  "MISRAWATI MA AMAN",
  "MUHD ZAINUL 'IZZAT BIN ZAINUDIN"
];

async function findExactMatches() {
  try {
    console.log('🔍 Finding exact matches for missing participants...');
    
    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, ic_number, job_position_name, category')
      .order('name');
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }
    
    console.log(`✅ Found ${profiles?.length || 0} profiles`);
    
    console.log('\n📋 Looking for matches for missing participants:');
    
    missingOriginalParticipants.forEach(missingName => {
      console.log(`\n--- Looking for: ${missingName} ---`);
      
      // Try different matching strategies
      const missingNameLower = missingName.toLowerCase();
      
      // 1. Direct match
      const directMatch = profiles?.find(p => 
        p.name.toLowerCase() === missingNameLower
      );
      
      if (directMatch) {
        console.log(`   ✅ Direct match: ${directMatch.name}`);
        console.log(`   🆔 IC: ${directMatch.ic_number || 'N/A'}`);
        console.log(`   💼 Job: ${directMatch.job_position_name || 'N/A'}`);
        return;
      }
      
      // 2. Partial match (contains)
      const partialMatches = profiles?.filter(p => 
        p.name.toLowerCase().includes(missingNameLower) || 
        missingNameLower.includes(p.name.toLowerCase())
      );
      
      if (partialMatches && partialMatches.length > 0) {
        console.log(`   🔍 Partial matches found:`);
        partialMatches.forEach(match => {
          console.log(`     - ${match.name} (IC: ${match.ic_number || 'N/A'})`);
        });
      } else {
        console.log(`   ❌ No matches found`);
      }
      
      // 3. Try matching by key words
      const missingWords = missingNameLower.split(' ').filter(word => word.length > 3);
      const wordMatches = profiles?.filter(p => {
        const profileWords = p.name.toLowerCase().split(' ');
        return missingWords.some(word => 
          profileWords.some(profileWord => 
            profileWord.includes(word) || word.includes(profileWord)
          )
        );
      });
      
      if (wordMatches && wordMatches.length > 0) {
        console.log(`   🔍 Word-based matches:`);
        wordMatches.forEach(match => {
          console.log(`     - ${match.name} (IC: ${match.ic_number || 'N/A'})`);
        });
      }
    });
    
    // Show all profiles that are NOT in checklist results
    console.log('\n📋 All profiles NOT in checklist results:');
    const { data: results, error: resultsError } = await supabase
      .from('checklist_result')
      .select('participant_name')
      .eq('is_deleted', false);
    
    if (!resultsError && results) {
      const checklistNames = new Set(results.map(r => r.participant_name.toLowerCase()));
      
      const profilesNotInChecklist = profiles?.filter(p => 
        !checklistNames.has(p.name.toLowerCase())
      ) || [];
      
      profilesNotInChecklist.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.name} - IC: ${profile.ic_number || 'N/A'} - Job: ${profile.job_position_name || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

findExactMatches();


