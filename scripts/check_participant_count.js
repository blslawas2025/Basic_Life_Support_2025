const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkParticipantCount() {
  try {
    console.log('🔍 Checking actual participant count...');
    
    // Check profiles table
    console.log('\n📊 Profiles Table:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, ic_number, job_position_name')
      .order('name');
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }
    
    console.log(`   Total profiles: ${profiles?.length || 0}`);
    
    // Check checklist results
    console.log('\n📊 Checklist Results Table:');
    const { data: results, error: resultsError } = await supabase
      .from('checklist_result')
      .select('participant_id, participant_name, participant_ic_number, participant_job_position')
      .eq('is_deleted', false)
      .order('participant_name');
    
    if (resultsError) {
      console.error('❌ Error fetching results:', resultsError);
      return;
    }
    
    console.log(`   Total checklist results: ${results?.length || 0}`);
    
    // Get unique participants from checklist results
    const uniqueParticipants = new Map();
    results?.forEach(result => {
      const key = result.participant_id;
      if (!uniqueParticipants.has(key)) {
        uniqueParticipants.set(key, {
          id: result.participant_id,
          name: result.participant_name,
          ic: result.participant_ic_number,
          job: result.participant_job_position
        });
      }
    });
    
    const checklistParticipants = Array.from(uniqueParticipants.values());
    console.log(`   Unique participants in checklist results: ${checklistParticipants.length}`);
    
    // Check for participants in profiles but not in checklist results
    console.log('\n🔍 Comparing profiles vs checklist results...');
    
    const profileNames = new Set(profiles?.map(p => p.name.toLowerCase()) || []);
    const checklistNames = new Set(checklistParticipants.map(p => p.name.toLowerCase()));
    
    const profilesNotInChecklist = profiles?.filter(p => 
      !checklistNames.has(p.name.toLowerCase())
    ) || [];
    
    const checklistNotInProfiles = checklistParticipants.filter(p => 
      !profileNames.has(p.name.toLowerCase())
    );
    
    console.log(`\n📋 Profiles NOT in checklist results (${profilesNotInChecklist.length}):`);
    profilesNotInChecklist.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.name} - IC: ${profile.ic_number || 'N/A'} - Job: ${profile.job_position_name || 'N/A'}`);
    });
    
    console.log(`\n📋 Checklist participants NOT in profiles (${checklistNotInProfiles.length}):`);
    checklistNotInProfiles.forEach((participant, index) => {
      console.log(`${index + 1}. ${participant.name} - IC: ${participant.ic || 'N/A'} - Job: ${participant.job || 'N/A'}`);
    });
    
    // Show all participants in checklist results
    console.log(`\n📋 All participants in checklist results (${checklistParticipants.length}):`);
    checklistParticipants.forEach((participant, index) => {
      console.log(`${index + 1}. ${participant.name} - IC: ${participant.ic || 'N/A'} - Job: ${participant.job || 'N/A'}`);
    });
    
    // Check if we have the expected 56 participants
    const expectedCount = 56;
    console.log(`\n📊 Summary:`);
    console.log(`   Expected participants: ${expectedCount}`);
    console.log(`   Profiles in database: ${profiles?.length || 0}`);
    console.log(`   Participants in checklist results: ${checklistParticipants.length}`);
    console.log(`   Missing from checklist: ${expectedCount - checklistParticipants.length}`);
    
    if (checklistParticipants.length < expectedCount) {
      console.log(`\n⚠️  We're missing ${expectedCount - checklistParticipants.length} participants in checklist results!`);
      console.log('Need to add the missing participants to checklist results.');
    } else if (checklistParticipants.length > expectedCount) {
      console.log(`\n⚠️  We have ${checklistParticipants.length - expectedCount} more participants than expected!`);
    } else {
      console.log(`\n✅ Perfect! We have exactly ${expectedCount} participants.`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkParticipantCount();



