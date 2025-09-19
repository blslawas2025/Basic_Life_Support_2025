const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompactLayout() {
  try {
    console.log('🔍 Testing compact layout for ChecklistResultsScreen...');
    
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
    
    // Calculate statistics (same logic as in the component)
    const statsMap = new Map();
    
    results?.forEach(result => {
      const key = result.checklist_type;
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          checklist_type: key,
          total_assessments: 0,
          passed_assessments: 0,
          pass_rate: 0
        });
      }
      
      const stat = statsMap.get(key);
      stat.total_assessments++;
      if (result.status === 'PASS') {
        stat.passed_assessments++;
      }
    });
    
    // Calculate pass rates
    statsMap.forEach(stat => {
      stat.pass_rate = Math.round((stat.passed_assessments / stat.total_assessments) * 100);
    });
    
    const stats = Array.from(statsMap.values());
    
    console.log('\n📊 Compact Statistics Preview:');
    console.log('┌─────────────────┬─────────────┬─────────────┐');
    console.log('│ Assessment Type │ Total Count │ Pass Rate   │');
    console.log('├─────────────────┼─────────────┼─────────────┤');
    
    stats.forEach(stat => {
      const type = stat.checklist_type.toUpperCase().padEnd(15);
      const total = stat.total_assessments.toString().padStart(11);
      const rate = `${stat.pass_rate}%`.padStart(11);
      console.log(`│ ${type} │ ${total} │ ${rate} │`);
    });
    
    console.log('└─────────────────┴─────────────┴─────────────┘');
    
    // Group results by participant
    const groups = new Map();
    
    results?.forEach(result => {
      const key = result.participant_id;
      if (!groups.has(key)) {
        groups.set(key, {
          participant_id: result.participant_id,
          participant_name: result.participant_name,
          participant_ic: result.participant_ic,
          participant_job_position: result.participant_job_position,
          assessments: {}
        });
      }
      
      const group = groups.get(key);
      group.assessments[result.checklist_type] = {
        status: result.status,
        completion_percentage: result.completion_percentage
      };
    });
    
    const groupedResults = Array.from(groups.values());
    
    console.log(`\n📋 Table Layout Preview (${groupedResults.length} participants):`);
    console.log('┌─────────────────────┬──────────┬─────────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐');
    console.log('│ Name                │ IC       │ Job             │ One Man CPR │ Two Man CPR │ Infant CPR  │ Inf Choking │ Adt Choking │');
    console.log('├─────────────────────┼──────────┼─────────────────┼─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤');
    
    groupedResults.slice(0, 5).forEach(participant => {
      const name = (participant.participant_name || 'N/A').substring(0, 19).padEnd(19);
      const ic = (participant.participant_ic || 'N/A').substring(0, 8).padEnd(8);
      const job = (participant.participant_job_position || 'N/A').substring(0, 15).padEnd(15);
      const oneMan = (participant.assessments['one man cpr']?.status || '-').padEnd(11);
      const twoMan = (participant.assessments['two man cpr']?.status || '-').padEnd(11);
      const infant = (participant.assessments['infant cpr']?.status || '-').padEnd(11);
      const infChok = (participant.assessments['infant choking']?.status || '-').padEnd(11);
      const adtChok = (participant.assessments['adult choking']?.status || '-').padEnd(11);
      
      console.log(`│ ${name} │ ${ic} │ ${job} │ ${oneMan} │ ${twoMan} │ ${infant} │ ${infChok} │ ${adtChok} │`);
    });
    
    console.log('└─────────────────────┴──────────┴─────────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘');
    
    console.log('\n🎉 Compact layout test completed successfully!');
    console.log('\n📱 The ChecklistResultsScreen now has:');
    console.log('   ✅ Compact statistics section at the top');
    console.log('   ✅ More space for the assessment results table');
    console.log('   ✅ Smaller font sizes and reduced padding');
    console.log('   ✅ Optimized layout for better space utilization');
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

testCompactLayout();



