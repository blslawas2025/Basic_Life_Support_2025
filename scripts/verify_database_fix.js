const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabaseFix() {
  console.log('🔍 Verifying database fix results...\n');

  try {
    // Check One Man CPR items
    console.log('1️⃣ Checking One Man CPR items...');
    const { data: oneManCprItems, error: oneManError } = await supabase
      .from('checklist_item')
      .select('section, item, is_compulsory')
      .eq('checklist_type', 'one man cpr')
      .order('order_index');

    if (oneManError) {
      console.error('Error fetching One Man CPR items:', oneManError);
      return;
    }

    console.log(`Found ${oneManCprItems.length} One Man CPR items:`);
    oneManCprItems.forEach(item => {
      console.log(`  ${item.section}: ${item.item.substring(0, 50)}... (${item.is_compulsory ? 'Compulsory' : 'Optional'})`);
    });

    // Check Adult Choking items
    console.log('\n2️⃣ Checking Adult Choking items...');
    const { data: adultChokingItems, error: adultError } = await supabase
      .from('checklist_item')
      .select('section, item, is_compulsory')
      .eq('checklist_type', 'adult choking')
      .order('order_index');

    if (adultError) {
      console.error('Error fetching Adult Choking items:', adultError);
      return;
    }

    console.log(`Found ${adultChokingItems.length} Adult Choking items:`);
    adultChokingItems.forEach(item => {
      console.log(`  ${item.section}: ${item.item.substring(0, 50)}... (${item.is_compulsory ? 'Compulsory' : 'Optional'})`);
    });

    // Check Infant Choking items
    console.log('\n3️⃣ Checking Infant Choking items...');
    const { data: infantChokingItems, error: infantError } = await supabase
      .from('checklist_item')
      .select('section, item, is_compulsory')
      .eq('checklist_type', 'infant choking')
      .order('order_index');

    if (infantError) {
      console.error('Error fetching Infant Choking items:', infantError);
      return;
    }

    console.log(`Found ${infantChokingItems.length} Infant Choking items:`);
    infantChokingItems.forEach(item => {
      console.log(`  ${item.section}: ${item.item.substring(0, 50)}... (${item.is_compulsory ? 'Compulsory' : 'Optional'})`);
    });

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`One Man CPR: ${oneManCprItems.length} items`);
    console.log(`Adult Choking: ${adultChokingItems.length} items`);
    console.log(`Infant Choking: ${infantChokingItems.length} items`);

    // Check if choking has correct sections
    const adultSections = [...new Set(adultChokingItems.map(item => item.section))];
    const infantSections = [...new Set(infantChokingItems.map(item => item.section))];
    
    console.log(`\nAdult Choking sections: ${adultSections.join(', ')}`);
    console.log(`Infant Choking sections: ${infantSections.join(', ')}`);

    const cprSections = ['danger', 'respons', 'shout for help', 'airway', 'breathing', 'circulation', 'defribillation'];
    const hasCprSectionsInAdult = adultSections.some(section => cprSections.includes(section));
    const hasCprSectionsInInfant = infantSections.some(section => cprSections.includes(section));

    if (hasCprSectionsInAdult) {
      console.log('❌ Adult Choking still has CPR sections!');
    } else {
      console.log('✅ Adult Choking has correct sections');
    }

    if (hasCprSectionsInInfant) {
      console.log('❌ Infant Choking still has CPR sections!');
    } else {
      console.log('✅ Infant Choking has correct sections');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the verification
if (require.main === module) {
  verifyDatabaseFix();
}

module.exports = { verifyDatabaseFix };


