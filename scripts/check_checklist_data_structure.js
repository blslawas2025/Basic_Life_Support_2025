const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChecklistDataStructure() {
  try {
    console.log('🔍 Checking checklist data structure for detailed view...');
    
    // Get a sample checklist result to see what data is available
    const { data: results, error } = await supabase
      .from('checklist_result')
      .select('*')
      .eq('is_deleted', false)
      .limit(3);
    
    if (error) {
      console.error('❌ Error fetching results:', error);
      return;
    }
    
    console.log(`✅ Found ${results?.length || 0} sample results`);
    
    if (results && results.length > 0) {
      const sample = results[0];
      console.log('\n📋 Available fields in checklist_result:');
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = typeof value;
        const preview = type === 'object' ? JSON.stringify(value).substring(0, 100) + '...' : String(value).substring(0, 50);
        console.log(`   ${key}: ${type} - ${preview}`);
      });
      
      // Check specific fields that might contain checklist details
      console.log('\n🔍 Checking specific checklist detail fields:');
      console.log(`   section_results: ${JSON.stringify(sample.section_results, null, 2)}`);
      console.log(`   instructor_comments: ${sample.instructor_comments || 'N/A'}`);
      console.log(`   assessment_notes: ${sample.assessment_notes || 'N/A'}`);
      console.log(`   completed_items: ${sample.completed_items}`);
      console.log(`   total_items: ${sample.total_items}`);
      console.log(`   airway_completed: ${sample.airway_completed}`);
      console.log(`   breathing_completed: ${sample.breathing_completed}`);
      console.log(`   circulation_completed: ${sample.circulation_completed}`);
      console.log(`   all_compulsory_completed: ${sample.all_compulsory_completed}`);
    }
    
    // Check if we need to create sample checklist item data
    console.log('\n💡 Analysis:');
    if (results && results[0] && results[0].section_results && Object.keys(results[0].section_results).length > 0) {
      console.log('   ✅ section_results contains detailed checklist data');
    } else {
      console.log('   ⚠️  section_results is empty or null - need to create sample data');
    }
    
    if (results && results[0] && results[0].instructor_comments) {
      console.log('   ✅ instructor_comments available');
    } else {
      console.log('   ⚠️  instructor_comments is empty - need to add sample comments');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkChecklistDataStructure();



