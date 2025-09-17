const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testChecklistResults() {
  try {
    console.log('🔍 Testing checklist results data...');
    
    // Test 1: Get all checklist results
    console.log('\n📊 Test 1: Fetching all checklist results...');
    const { data: allResults, error: allError } = await supabase
      .from('checklist_result_summary')
      .select('*')
      .order('submitted_at', { ascending: false });
    
    if (allError) {
      console.error('❌ Error fetching all results:', allError);
      return;
    }
    
    console.log(`✅ Found ${allResults?.length || 0} checklist results`);
    
    // Test 2: Get statistics
    console.log('\n📊 Test 2: Fetching checklist statistics...');
    const { data: stats, error: statsError } = await supabase
      .from('checklist_result_stats')
      .select('*');
    
    if (statsError) {
      console.error('❌ Error fetching stats:', statsError);
    } else {
      console.log(`✅ Found ${stats?.length || 0} checklist type statistics`);
      if (stats && stats.length > 0) {
        stats.forEach(stat => {
          console.log(`  - ${stat.checklist_type}: ${stat.total_assessments} assessments, ${stat.pass_rate}% pass rate`);
        });
      }
    }
    
    // Test 3: Filter by checklist type
    console.log('\n📊 Test 3: Filtering by checklist type (one man cpr)...');
    const { data: oneManResults, error: oneManError } = await supabase
      .from('checklist_result_summary')
      .select('*')
      .eq('checklist_type', 'one man cpr')
      .order('submitted_at', { ascending: false });
    
    if (oneManError) {
      console.error('❌ Error fetching one man cpr results:', oneManError);
    } else {
      console.log(`✅ Found ${oneManResults?.length || 0} one man cpr results`);
    }
    
    // Test 4: Filter by status
    console.log('\n📊 Test 4: Filtering by status (PASS)...');
    const { data: passResults, error: passError } = await supabase
      .from('checklist_result_summary')
      .select('*')
      .eq('status', 'PASS')
      .order('submitted_at', { ascending: false })
      .limit(10);
    
    if (passError) {
      console.error('❌ Error fetching pass results:', passError);
    } else {
      console.log(`✅ Found ${passResults?.length || 0} pass results (showing first 10)`);
    }
    
    // Test 5: Search by participant name
    console.log('\n📊 Test 5: Searching by participant name (ABDUL)...');
    const { data: searchResults, error: searchError } = await supabase
      .from('checklist_result_summary')
      .select('*')
      .ilike('participant_name', '%ABDUL%')
      .order('submitted_at', { ascending: false });
    
    if (searchError) {
      console.error('❌ Error searching by name:', searchError);
    } else {
      console.log(`✅ Found ${searchResults?.length || 0} results for participants with 'ABDUL' in name`);
    }
    
    // Test 6: Show sample data
    console.log('\n📋 Sample Data:');
    if (allResults && allResults.length > 0) {
      const sample = allResults.slice(0, 5);
      sample.forEach((result, index) => {
        console.log(`${index + 1}. ${result.participant_name} | ${result.checklist_type} | ${result.status} | ${result.completion_percentage}%`);
      });
    }
    
    // Test 7: Count by status
    console.log('\n📊 Test 7: Counting by status...');
    const { data: statusCounts, error: statusError } = await supabase
      .from('checklist_result_summary')
      .select('status')
      .not('status', 'is', null);
    
    if (statusError) {
      console.error('❌ Error counting by status:', statusError);
    } else {
      const counts = {};
      statusCounts?.forEach(result => {
        counts[result.status] = (counts[result.status] || 0) + 1;
      });
      
      console.log('✅ Status distribution:');
      Object.entries(counts).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count} results`);
      });
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📱 The ChecklistResultsScreen should now display this data properly.');
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

testChecklistResults();


