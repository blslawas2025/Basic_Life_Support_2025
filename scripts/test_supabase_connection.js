const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test 1: Check checklist results
    console.log('\n📊 Test 1: Fetching checklist results...');
    const { data: results, error: resultsError } = await supabase
      .from('checklist_result_summary')
      .select('*')
      .limit(5);
    
    if (resultsError) {
      console.error('❌ Error fetching checklist results:', resultsError);
    } else {
      console.log(`✅ Successfully fetched ${results?.length || 0} checklist results`);
    }
    
    // Test 2: Check checklist stats
    console.log('\n📊 Test 2: Fetching checklist stats...');
    const { data: stats, error: statsError } = await supabase
      .from('checklist_result_stats')
      .select('*');
    
    if (statsError) {
      console.error('❌ Error fetching checklist stats:', statsError);
    } else {
      console.log(`✅ Successfully fetched ${stats?.length || 0} checklist stats`);
    }
    
    console.log('\n🎉 Supabase connection test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error during connection test:', error);
  }
}

testConnection();


