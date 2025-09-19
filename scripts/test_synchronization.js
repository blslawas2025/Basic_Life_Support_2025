const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSynchronization() {
  console.log('🧪 Testing synchronization between screens...\n');

  try {
    // 1. Check checklist items data
    console.log('1️⃣ Checking checklist items data...');
    const { data: checklistItems, error: itemsError } = await supabase
      .from('checklist_item')
      .select('checklist_type, section, item, is_compulsory')
      .in('checklist_type', ['one man cpr', 'adult choking'])
      .order('checklist_type, order_index');

    if (itemsError) {
      console.error('❌ Error fetching checklist items:', itemsError);
      return;
    }

    console.log('✅ Checklist items found:', checklistItems.length);
    
    // Group by checklist type
    const groupedItems = checklistItems.reduce((acc, item) => {
      if (!acc[item.checklist_type]) acc[item.checklist_type] = [];
      acc[item.checklist_type].push(item);
      return acc;
    }, {});

    // Show sample data for each type
    Object.keys(groupedItems).forEach(type => {
      console.log(`\n📋 ${type.toUpperCase()}:`);
      const items = groupedItems[type];
      const sections = [...new Set(items.map(item => item.section))];
      console.log(`  Sections: ${sections.join(', ')}`);
      
      // Show compulsory vs optional items
      const compulsory = items.filter(item => item.is_compulsory);
      const optional = items.filter(item => !item.is_compulsory);
      console.log(`  Compulsory items: ${compulsory.length}`);
      console.log(`  Optional items: ${optional.length}`);
      
      // Show sample items
      console.log('  Sample items:');
      items.slice(0, 3).forEach(item => {
        console.log(`    - ${item.item.substring(0, 50)}... (${item.is_compulsory ? 'Compulsory' : 'Optional'})`);
      });
    });

    // 2. Check checklist results data
    console.log('\n2️⃣ Checking checklist results data...');
    const { data: results, error: resultsError } = await supabase
      .from('checklist_result')
      .select('checklist_type, status, section_results')
      .eq('is_deleted', false)
      .limit(5);

    if (resultsError) {
      console.error('❌ Error fetching results:', resultsError);
      return;
    }

    console.log('✅ Checklist results found:', results.length);
    
    results.forEach((result, index) => {
      console.log(`\n📊 Result ${index + 1} (${result.checklist_type}):`);
      console.log(`  Status: ${result.status}`);
      
      if (result.section_results && Array.isArray(result.section_results)) {
        console.log(`  Sections: ${result.section_results.length}`);
        
        result.section_results.forEach(section => {
          if (section.items && Array.isArray(section.items)) {
            const compulsory = section.items.filter(item => item.is_compulsory);
            const optional = section.items.filter(item => !item.is_compulsory);
            console.log(`    ${section.section}: ${compulsory.length} compulsory, ${optional.length} optional`);
          }
        });
      }
    });

    // 3. Check for synchronization issues
    console.log('\n3️⃣ Checking for synchronization issues...');
    
    // Check if choking checklists have correct sections
    const chokingItems = checklistItems.filter(item => 
      item.checklist_type.includes('choking')
    );
    
    const chokingSections = [...new Set(chokingItems.map(item => item.section))];
    const cprSections = ['danger', 'respons', 'shout for help', 'airway', 'breathing', 'circulation', 'defribillation'];
    const hasCprSections = chokingSections.some(section => cprSections.includes(section));
    
    if (hasCprSections) {
      console.log('❌ ISSUE: Choking checklists still have CPR sections:', 
        chokingSections.filter(section => cprSections.includes(section)).join(', '));
    } else {
      console.log('✅ Choking checklists have correct sections:', chokingSections.join(', '));
    }

    // Check if all items have compulsory status set
    const itemsWithoutCompulsory = checklistItems.filter(item => 
      item.is_compulsory === null || item.is_compulsory === undefined
    );
    
    if (itemsWithoutCompulsory.length > 0) {
      console.log('❌ ISSUE: Some items missing compulsory status:', itemsWithoutCompulsory.length);
    } else {
      console.log('✅ All items have compulsory status set');
    }

    console.log('\n🎉 Synchronization test completed!');
    console.log('\n📋 Summary:');
    console.log(`- Checklist items: ${checklistItems.length}`);
    console.log(`- Results: ${results.length}`);
    console.log(`- Choking sections: ${chokingSections.join(', ')}`);
    console.log(`- Items with compulsory status: ${checklistItems.length - itemsWithoutCompulsory.length}/${checklistItems.length}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testSynchronization();
}

module.exports = { testSynchronization };


