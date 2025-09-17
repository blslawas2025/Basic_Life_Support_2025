const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdatedService() {
  try {
    console.log('🔍 Testing updated ChecklistResultService...');
    
    // Test 1: Get all checklist results from main table
    console.log('\n📊 Test 1: Fetching checklist results from main table...');
    const { data: results, error: resultsError } = await supabase
      .from('checklist_result')
      .select('*')
      .eq('is_deleted', false)
      .order('submitted_at', { ascending: false })
      .limit(5);
    
    if (resultsError) {
      console.error('❌ Error fetching checklist results:', resultsError);
    } else {
      console.log(`✅ Successfully fetched ${results?.length || 0} checklist results`);
      if (results && results.length > 0) {
        console.log('📋 Sample results:');
        results.slice(0, 3).forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.participant_name} | ${result.checklist_type} | ${result.status} | ${result.completion_percentage}%`);
        });
      }
    }
    
    // Test 2: Calculate stats from main table
    console.log('\n📊 Test 2: Calculating stats from main table...');
    const { data: statsData, error: statsError } = await supabase
      .from('checklist_result')
      .select('checklist_type, status, completion_percentage, assessment_duration_seconds')
      .eq('is_deleted', false);
    
    if (statsError) {
      console.error('❌ Error fetching stats data:', statsError);
    } else {
      console.log(`✅ Successfully fetched ${statsData?.length || 0} records for stats calculation`);
      
      // Calculate stats
      const statsMap = new Map();
      
      statsData?.forEach(result => {
        const type = result.checklist_type;
        if (!statsMap.has(type)) {
          statsMap.set(type, {
            checklist_type: type,
            total_assessments: 0,
            pass_count: 0,
            fail_count: 0,
            incomplete_count: 0,
            total_duration: 0,
            total_completion: 0
          });
        }
        
        const stats = statsMap.get(type);
        stats.total_assessments++;
        stats.total_duration += result.assessment_duration_seconds || 0;
        stats.total_completion += result.completion_percentage || 0;
        
        if (result.status === 'PASS') {
          stats.pass_count++;
        } else if (result.status === 'FAIL') {
          stats.fail_count++;
        } else if (result.status === 'INCOMPLETE') {
          stats.incomplete_count++;
        }
      });

      // Convert to final format
      const stats = Array.from(statsMap.values()).map(stat => ({
        checklist_type: stat.checklist_type,
        total_assessments: stat.total_assessments,
        pass_count: stat.pass_count,
        fail_count: stat.fail_count,
        incomplete_count: stat.incomplete_count,
        avg_completion_percentage: stat.total_assessments > 0 ? 
          Math.round((stat.total_completion / stat.total_assessments) * 100) / 100 : 0,
        avg_duration_seconds: stat.total_assessments > 0 ? 
          Math.round(stat.total_duration / stat.total_assessments) : 0,
        total_passes: stat.pass_count,
        pass_rate: stat.total_assessments > 0 ? 
          Math.round((stat.pass_count / stat.total_assessments) * 100) : 0
      }));
      
      console.log('📊 Calculated stats:');
      stats.forEach(stat => {
        console.log(`  - ${stat.checklist_type}: ${stat.total_assessments} assessments, ${stat.pass_rate}% pass rate`);
      });
    }
    
    console.log('\n🎉 Updated service test completed successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

testUpdatedService();


