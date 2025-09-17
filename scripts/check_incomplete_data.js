const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIncompleteData() {
  try {
    console.log('🔍 Investigating INCOMPLETE status data...');
    
    // Fetch all checklist results
    const { data: results, error } = await supabase
      .from('checklist_result')
      .select('*')
      .eq('is_deleted', false)
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching results:', error);
      return;
    }
    
    console.log(`✅ Fetched ${results?.length || 0} total results`);
    
    // Analyze status distribution
    const statusCounts = {};
    const incompleteResults = [];
    
    results?.forEach(result => {
      const status = result.status || 'UNKNOWN';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      if (status === 'INCOMPLETE') {
        incompleteResults.push(result);
      }
    });
    
    console.log('\n📊 Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} results`);
    });
    
    if (incompleteResults.length > 0) {
      console.log(`\n🔍 Analyzing ${incompleteResults.length} INCOMPLETE results:`);
      
      // Group incomplete results by participant
      const incompleteByParticipant = new Map();
      
      incompleteResults.forEach(result => {
        const key = result.participant_id;
        if (!incompleteByParticipant.has(key)) {
          incompleteByParticipant.set(key, {
            participant_name: result.participant_name,
            participant_ic_number: result.participant_ic_number,
            participant_job_position: result.participant_job_position,
            results: []
          });
        }
        
        incompleteByParticipant.get(key).results.push({
          checklist_type: result.checklist_type,
          status: result.status,
          completion_percentage: result.completion_percentage,
          completed_items: result.completed_items,
          total_items: result.total_items,
          submitted_at: result.submitted_at,
          instructor_name: result.instructor_name
        });
      });
      
      console.log(`\n👥 Participants with INCOMPLETE results (${incompleteByParticipant.size}):`);
      
      incompleteByParticipant.forEach((participant, participantId) => {
        console.log(`\n--- ${participant.participant_name} ---`);
        console.log(`IC: ${participant.participant_ic_number}`);
        console.log(`Job: ${participant.participant_job_position}`);
        console.log('Assessments:');
        
        participant.results.forEach(result => {
          console.log(`  - ${result.checklist_type}: ${result.status} (${result.completion_percentage}%)`);
          console.log(`    Completed: ${result.completed_items}/${result.total_items} items`);
          console.log(`    Submitted: ${result.submitted_at}`);
          console.log(`    Instructor: ${result.instructor_name || 'N/A'}`);
        });
      });
      
      // Check if there are any patterns
      console.log('\n🔍 Pattern Analysis:');
      
      // Check completion percentages
      const completionPercents = incompleteResults.map(r => r.completion_percentage);
      const uniquePercents = [...new Set(completionPercents)];
      console.log(`   Completion percentages: ${uniquePercents.join(', ')}`);
      
      // Check if all incomplete have 0% completion
      const allZeroPercent = incompleteResults.every(r => r.completion_percentage === 0);
      console.log(`   All INCOMPLETE have 0% completion: ${allZeroPercent}`);
      
      // Check completed items
      const completedItems = incompleteResults.map(r => r.completed_items);
      const uniqueCompleted = [...new Set(completedItems)];
      console.log(`   Completed items counts: ${uniqueCompleted.join(', ')}`);
      
      // Check if all incomplete have 0 completed items
      const allZeroItems = incompleteResults.every(r => r.completed_items === 0);
      console.log(`   All INCOMPLETE have 0 completed items: ${allZeroItems}`);
      
      // Check submission times
      const submissionTimes = incompleteResults.map(r => r.submitted_at);
      const uniqueTimes = [...new Set(submissionTimes)];
      console.log(`   Unique submission times: ${uniqueTimes.length}`);
      
      // Check instructors
      const instructors = incompleteResults.map(r => r.instructor_name).filter(Boolean);
      const uniqueInstructors = [...new Set(instructors)];
      console.log(`   Instructors involved: ${uniqueInstructors.join(', ') || 'None'}`);
      
    } else {
      console.log('\n✅ No INCOMPLETE results found!');
    }
    
    // Check for any participants who might have mixed statuses
    console.log('\n🔍 Checking for participants with mixed statuses...');
    
    const participantStatuses = new Map();
    
    results?.forEach(result => {
      const key = result.participant_id;
      if (!participantStatuses.has(key)) {
        participantStatuses.set(key, {
          participant_name: result.participant_name,
          statuses: new Set()
        });
      }
      participantStatuses.get(key).statuses.add(result.status);
    });
    
    const mixedStatusParticipants = Array.from(participantStatuses.entries())
      .filter(([_, data]) => data.statuses.size > 1);
    
    if (mixedStatusParticipants.length > 0) {
      console.log(`\n👥 Participants with mixed statuses (${mixedStatusParticipants.length}):`);
      mixedStatusParticipants.forEach(([participantId, data]) => {
        console.log(`   ${data.participant_name}: ${Array.from(data.statuses).join(', ')}`);
      });
    } else {
      console.log('\n✅ No participants with mixed statuses found.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkIncompleteData();


