const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testModalData() {
  try {
    console.log('🔍 Testing modal data structure...');
    
    // Get a specific assessment
    const { data: result, error } = await supabase
      .from('checklist_result')
      .select('*')
      .eq('participant_id', '74ccea87-c129-45c9-92ae-044767e9c3e5')
      .eq('checklist_type', 'infant cpr')
      .eq('is_deleted', false)
      .single();
    
    if (error) {
      console.error('❌ Error fetching result:', error);
      return;
    }
    
    console.log('✅ Fetched assessment data:');
    console.log(`   Participant: ${result.participant_name}`);
    console.log(`   Checklist Type: ${result.checklist_type}`);
    console.log(`   Status: ${result.status}`);
    
    // Test the modal logic
    const sectionResults = Array.isArray(result.section_results) ? result.section_results : [];
    console.log(`\n🔍 Modal logic test:`);
    console.log(`   Section Results Type: ${typeof result.section_results}`);
    console.log(`   Section Results Is Array: ${Array.isArray(result.section_results)}`);
    console.log(`   Safe Section Results Length: ${sectionResults.length}`);
    console.log(`   Section Results Length > 0: ${sectionResults.length > 0}`);
    
    if (sectionResults.length > 0) {
      console.log('   ✅ Should show checklist details');
      sectionResults.forEach((section, index) => {
        console.log(`   Section ${index + 1}: ${section.section} (${section.items?.length || 0} items)`);
      });
    } else {
      console.log('   ❌ Will show "No checklist details available"');
    }
    
    // Test the items logic
    if (sectionResults.length > 0) {
      const firstSection = sectionResults[0];
      console.log(`\n🔍 First section items test:`);
      console.log(`   Items Type: ${typeof firstSection.items}`);
      console.log(`   Items Is Array: ${Array.isArray(firstSection.items)}`);
      console.log(`   Items Length: ${firstSection.items?.length || 0}`);
      
      if (Array.isArray(firstSection.items) && firstSection.items.length > 0) {
        console.log('   ✅ Should show items');
        firstSection.items.forEach((item, index) => {
          console.log(`     Item ${index + 1}: ${item.item} (${item.completed ? 'completed' : 'not completed'})`);
        });
      } else {
        console.log('   ❌ Will show "No items available"');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testModalData();


