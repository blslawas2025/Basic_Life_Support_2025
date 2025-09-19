const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTableLayout() {
  try {
    console.log('🔍 Testing table layout data structure...');
    
    // Fetch checklist results
    const { data: results, error } = await supabase
      .from('checklist_result')
      .select('*')
      .eq('is_deleted', false)
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching results:', error);
      return;
    }
    
    console.log(`✅ Fetched ${results?.length || 0} results`);
    
    // Group results by participant (same logic as in the component)
    const groups = new Map();
    
    results?.forEach(result => {
      const key = result.participant_id;
      if (!groups.has(key)) {
        groups.set(key, {
          participant_id: result.participant_id,
          participant_name: result.participant_name,
          participant_email: result.participant_email,
          participant_ic: result.participant_ic,
          participant_job_position: result.participant_job_position,
          participant_category: result.participant_category,
          assessments: {}
        });
      }
      
      const group = groups.get(key);
      group.assessments[result.checklist_type] = {
        status: result.status,
        completion_percentage: result.completion_percentage,
        submitted_at: result.submitted_at,
        instructor_name: result.instructor_name
      };
    });
    
    const groupedResults = Array.from(groups.values());
    
    console.log(`\n📊 Grouped into ${groupedResults.length} participants`);
    
    // Show sample data structure
    console.log('\n📋 Sample participant data:');
    const sampleParticipant = groupedResults[0];
    if (sampleParticipant) {
      console.log(`Name: ${sampleParticipant.participant_name}`);
      console.log(`IC: ${sampleParticipant.participant_ic}`);
      console.log(`Job: ${sampleParticipant.participant_job_position}`);
      console.log('Assessments:');
      Object.entries(sampleParticipant.assessments).forEach(([type, assessment]) => {
        console.log(`  - ${type}: ${assessment.status} (${assessment.completion_percentage}%)`);
      });
    }
    
    // Show table structure
    console.log('\n📊 Table Structure:');
    console.log('| Name | IC | Job | One Man CPR | Two Man CPR | Infant CPR | Infant Choking | Adult Choking |');
    console.log('|------|----|----|-------------|-------------|-----------|----------------|---------------|');
    
    groupedResults.slice(0, 3).forEach(participant => {
      const oneManCpr = participant.assessments['one man cpr']?.status || '-';
      const twoManCpr = participant.assessments['two man cpr']?.status || '-';
      const infantCpr = participant.assessments['infant cpr']?.status || '-';
      const infantChoking = participant.assessments['infant choking']?.status || '-';
      const adultChoking = participant.assessments['adult choking']?.status || '-';
      
      console.log(`| ${participant.participant_name.substring(0, 20)}... | ${participant.participant_ic || 'N/A'} | ${(participant.participant_job_position || 'N/A').substring(0, 15)}... | ${oneManCpr} | ${twoManCpr} | ${infantCpr} | ${infantChoking} | ${adultChoking} |`);
    });
    
    console.log('\n🎉 Table layout test completed successfully!');
    console.log('\n📱 The ChecklistResultsScreen should now display results in a table format.');
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

testTableLayout();



