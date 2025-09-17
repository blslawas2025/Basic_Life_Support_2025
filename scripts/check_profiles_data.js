const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesData() {
  try {
    console.log('🔍 Checking profiles data structure...');
    
    // Fetch profiles data
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }
    
    console.log(`✅ Fetched ${profiles?.length || 0} profiles`);
    
    if (profiles && profiles.length > 0) {
      console.log('\n📋 Sample profile data:');
      console.log('Available fields:', Object.keys(profiles[0]));
      
      profiles.slice(0, 3).forEach((profile, index) => {
        console.log(`\n--- Profile ${index + 1} ---`);
        console.log(`ID: ${profile.id}`);
        console.log(`Name: ${profile.name || 'N/A'}`);
        console.log(`Email: ${profile.email || 'N/A'}`);
        console.log(`IC: ${profile.ic || 'N/A'}`);
        console.log(`Job Position: ${profile.job_position || 'N/A'}`);
        console.log(`Category: ${profile.category || 'N/A'}`);
        console.log(`Created: ${profile.created_at || 'N/A'}`);
      });
    }
    
    // Check checklist_result data structure
    console.log('\n🔍 Checking checklist_result data structure...');
    const { data: results, error: resultsError } = await supabase
      .from('checklist_result')
      .select('*')
      .limit(5);
    
    if (resultsError) {
      console.error('❌ Error fetching results:', resultsError);
      return;
    }
    
    if (results && results.length > 0) {
      console.log('\n📋 Sample checklist_result data:');
      console.log('Available fields:', Object.keys(results[0]));
      
      results.slice(0, 2).forEach((result, index) => {
        console.log(`\n--- Result ${index + 1} ---`);
        console.log(`Participant ID: ${result.participant_id}`);
        console.log(`Participant Name: ${result.participant_name || 'N/A'}`);
        console.log(`Participant IC: ${result.participant_ic || 'N/A'}`);
        console.log(`Participant Job: ${result.participant_job_position || 'N/A'}`);
        console.log(`Checklist Type: ${result.checklist_type || 'N/A'}`);
        console.log(`Status: ${result.status || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkProfilesData();


