const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDatabaseFix() {
  console.log('🔧 Running database fix to correct choking sections and compulsory status...\n');

  try {
    // 1. First, let's see what's currently in the database
    console.log('1️⃣ Checking current data...');
    const { data: currentItems, error: fetchError } = await supabase
      .from('checklist_item')
      .select('checklist_type, section, item, is_compulsory')
      .in('checklist_type', ['adult choking', 'infant choking', 'one man cpr'])
      .order('checklist_type, order_index');

    if (fetchError) {
      console.error('❌ Error fetching current data:', fetchError);
      return;
    }

    console.log('Current items found:', currentItems.length);
    
    // Group by checklist type
    const grouped = currentItems.reduce((acc, item) => {
      if (!acc[item.checklist_type]) acc[item.checklist_type] = [];
      acc[item.checklist_type].push(item);
      return acc;
    }, {});

    Object.keys(grouped).forEach(type => {
      const items = grouped[type];
      const sections = [...new Set(items.map(item => item.section))];
      const compulsory = items.filter(item => item.is_compulsory).length;
      const optional = items.filter(item => !item.is_compulsory).length;
      
      console.log(`\n📋 ${type.toUpperCase()}:`);
      console.log(`  Sections: ${sections.join(', ')}`);
      console.log(`  Compulsory: ${compulsory}, Optional: ${optional}`);
    });

    // 2. Fix the database constraint first
    console.log('\n2️⃣ Fixing database constraint...');
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE checklist_item DROP CONSTRAINT IF EXISTS checklist_item_section_check;
        ALTER TABLE checklist_item ADD CONSTRAINT checklist_item_section_check 
        CHECK (section IN (
          'danger',
          'respons',
          'shout for help',
          'airway',
          'breathing',
          'circulation',
          'defribillation',
          'first rescuer',
          'second rescuer',
          'assess severity',
          'mild choking',
          'severe choking',
          'victim unconscious'
        ));
      `
    });

    if (constraintError) {
      console.log('⚠️ Constraint update failed (might already be correct):', constraintError.message);
    } else {
      console.log('✅ Database constraint updated');
    }

    // 3. Delete existing choking data
    console.log('\n3️⃣ Deleting existing choking data...');
    const { error: deleteError } = await supabase
      .from('checklist_item')
      .delete()
      .in('checklist_type', ['adult choking', 'infant choking']);

    if (deleteError) {
      console.error('❌ Error deleting choking data:', deleteError);
      return;
    }
    console.log('✅ Deleted existing choking data');

    // 4. Insert correct adult choking data
    console.log('\n4️⃣ Inserting correct adult choking data...');
    const adultChokingData = [
      { checklist_type: 'adult choking', section: 'assess severity', item: 'Ask: Are you choking? Are you ok?', is_compulsory: false, order_index: 1 },
      { checklist_type: 'adult choking', section: 'assess severity', item: 'Mild - effective cough', is_compulsory: false, order_index: 2 },
      { checklist_type: 'adult choking', section: 'assess severity', item: 'Severe - the cough becomes ineffective', is_compulsory: false, order_index: 3 },
      { checklist_type: 'adult choking', section: 'mild choking', item: 'a. Encourage the victim to cough', is_compulsory: false, order_index: 4 },
      { checklist_type: 'adult choking', section: 'severe choking', item: 'a. Give 5 back blows:', is_compulsory: false, order_index: 5 },
      { checklist_type: 'adult choking', section: 'severe choking', item: 'i. Lean the victim forwards.', is_compulsory: false, order_index: 6 },
      { checklist_type: 'adult choking', section: 'severe choking', item: 'ii. Apply blows between the shoulder blades using the heel of one hand', is_compulsory: false, order_index: 7 },
      { checklist_type: 'adult choking', section: 'severe choking', item: 'b. If back blows are ineffective, give 5 abdominal thrusts:', is_compulsory: false, order_index: 8 },
      { checklist_type: 'adult choking', section: 'severe choking', item: 'i. Stand behind the victim and put both your arms around the upper part of the victim\'s abdomen.', is_compulsory: false, order_index: 9 },
      { checklist_type: 'adult choking', section: 'severe choking', item: 'ii. Lean the victim forwards.', is_compulsory: false, order_index: 10 },
      { checklist_type: 'adult choking', section: 'severe choking', item: 'iii. Clench your fist and place it between the umbilicus (navel) and the ribcage.', is_compulsory: false, order_index: 11 },
      { checklist_type: 'adult choking', section: 'severe choking', item: 'iv. Grasp your fist with the other hand and pull sharply inwards and upwards.', is_compulsory: false, order_index: 12 },
      { checklist_type: 'adult choking', section: 'severe choking', item: 'c. Continue alternating 5 back blows with 5 abdominal thrusts until it is relieved, or the victim becomes unconscious.', is_compulsory: false, order_index: 13 },
      { checklist_type: 'adult choking', section: 'severe choking', item: 'd. Perform chest thrust for pregnant and very obese victims', is_compulsory: false, order_index: 14 },
      { checklist_type: 'adult choking', section: 'victim unconscious', item: 'a. Start CPR', is_compulsory: false, order_index: 15 },
      { checklist_type: 'adult choking', section: 'victim unconscious', item: '-During airway opening, check for foreign body, do not perform a blind finger sweep.', is_compulsory: false, order_index: 16 }
    ];

    const { error: adultError } = await supabase
      .from('checklist_item')
      .insert(adultChokingData);

    if (adultError) {
      console.error('❌ Error inserting adult choking data:', adultError);
      return;
    }
    console.log('✅ Adult choking data inserted');

    // 5. Insert correct infant choking data
    console.log('\n5️⃣ Inserting correct infant choking data...');
    const infantChokingData = [
      { checklist_type: 'infant choking', section: 'assess severity', item: 'Mild:', is_compulsory: false, order_index: 1 },
      { checklist_type: 'infant choking', section: 'assess severity', item: 'coughing effectively (fully responsive, loud cough, taking a breath before coughing), still crying, or speaking', is_compulsory: false, order_index: 2 },
      { checklist_type: 'infant choking', section: 'assess severity', item: 'Severe:', is_compulsory: false, order_index: 3 },
      { checklist_type: 'infant choking', section: 'assess severity', item: '- ineffective cough, inability to cough, decreasing consciousness, inability to breathe or vocalise, cyanosis.', is_compulsory: false, order_index: 4 },
      { checklist_type: 'infant choking', section: 'mild choking', item: 'a Encourage the child to cough and continue monitoring the child\'s condition', is_compulsory: false, order_index: 5 },
      { checklist_type: 'infant choking', section: 'severe choking', item: 'a Ask for help', is_compulsory: false, order_index: 6 },
      { checklist_type: 'infant choking', section: 'severe choking', item: 'i. second rescuer should call MERS 999, preferably by mobile phone (speaker function).', is_compulsory: false, order_index: 7 },
      { checklist_type: 'infant choking', section: 'severe choking', item: 'ii. A single trained rescuer should first proceed with rescue manoeuvres (unless able to call simultaneously with the speaker function activated)', is_compulsory: false, order_index: 8 },
      { checklist_type: 'infant choking', section: 'severe choking', item: 'b Perform 5 back blows and followed with 5 chest thrusts', is_compulsory: false, order_index: 9 },
      { checklist_type: 'infant choking', section: 'severe choking', item: 'Back Blows', is_compulsory: false, order_index: 10 },
      { checklist_type: 'infant choking', section: 'severe choking', item: 'i. Support the infant in a head-downwards, prone position by placing the thumb of one hand at the angle of the lower jaw. Deliver up to 5 sharp back blows with the heel of one hand in the middle of the back between the shoulder blades.', is_compulsory: false, order_index: 11 },
      { checklist_type: 'infant choking', section: 'severe choking', item: 'Chest Thrust', is_compulsory: false, order_index: 12 },
      { checklist_type: 'infant choking', section: 'severe choking', item: 'i. Turn the infant into a head-downwards supine position and place free arm along the infant\'s back and encircling the occiput with your hand.', is_compulsory: false, order_index: 13 },
      { checklist_type: 'infant choking', section: 'severe choking', item: 'ii. Place two fingers of the free hand on the lower half of the infant\'s sternum (in the same position as for chest compression during CPR).', is_compulsory: false, order_index: 14 },
      { checklist_type: 'infant choking', section: 'severe choking', item: 'iii. Deliver up to 5 chest thrusts. These are similar to chest compressions but sharper and delivered at a slower rate.', is_compulsory: false, order_index: 15 },
      { checklist_type: 'infant choking', section: 'severe choking', item: 'iv. Continue alternating 5 back blows with 5 chest thrusts until the obstruction is relieved or the infant becomes unconscious.', is_compulsory: false, order_index: 16 },
      { checklist_type: 'infant choking', section: 'victim unconscious', item: 'a. Start CPR', is_compulsory: false, order_index: 17 },
      { checklist_type: 'infant choking', section: 'victim unconscious', item: '-During airway opening, check for foreign body, do not perform a blind finger sweep.', is_compulsory: false, order_index: 18 }
    ];

    const { error: infantError } = await supabase
      .from('checklist_item')
      .insert(infantChokingData);

    if (infantError) {
      console.error('❌ Error inserting infant choking data:', infantError);
      return;
    }
    console.log('✅ Infant choking data inserted');

    // 6. Fix compulsory status for CPR checklists
    console.log('\n6️⃣ Fixing compulsory status for CPR checklists...');
    
    // Get all CPR items
    const { data: cprItems, error: cprError } = await supabase
      .from('checklist_item')
      .select('id, section, is_compulsory')
      .in('checklist_type', ['one man cpr', 'two man cpr', 'infant cpr']);

    if (cprError) {
      console.error('❌ Error fetching CPR items:', cprError);
      return;
    }

    // Update compulsory status based on section
    const updates = cprItems.map(item => {
      const isCompulsory = ['airway', 'breathing', 'circulation'].includes(item.section);
      return { id: item.id, is_compulsory: isCompulsory };
    });

    // Update in batches
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('checklist_item')
        .update({ is_compulsory: update.is_compulsory })
        .eq('id', update.id);

      if (updateError) {
        console.error(`❌ Error updating item ${update.id}:`, updateError);
      }
    }

    console.log('✅ CPR compulsory status fixed');

    // 7. Verify the fixes
    console.log('\n7️⃣ Verifying fixes...');
    const { data: verifyItems, error: verifyError } = await supabase
      .from('checklist_item')
      .select('checklist_type, section, item, is_compulsory')
      .in('checklist_type', ['adult choking', 'infant choking', 'one man cpr'])
      .order('checklist_type, order_index');

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError);
      return;
    }

    // Group by checklist type
    const verifyGrouped = verifyItems.reduce((acc, item) => {
      if (!acc[item.checklist_type]) acc[item.checklist_type] = [];
      acc[item.checklist_type].push(item);
      return acc;
    }, {});

    console.log('\n📊 VERIFICATION RESULTS:');
    Object.keys(verifyGrouped).forEach(type => {
      const items = verifyGrouped[type];
      const sections = [...new Set(items.map(item => item.section))];
      const compulsory = items.filter(item => item.is_compulsory).length;
      const optional = items.filter(item => !item.is_compulsory).length;
      
      console.log(`\n📋 ${type.toUpperCase()}:`);
      console.log(`  Sections: ${sections.join(', ')}`);
      console.log(`  Compulsory: ${compulsory}, Optional: ${optional}`);
      
      // Check if choking has correct sections
      if (type.includes('choking')) {
        const cprSections = ['danger', 'respons', 'shout for help', 'airway', 'breathing', 'circulation', 'defribillation'];
        const hasCprSections = sections.some(section => cprSections.includes(section));
        if (hasCprSections) {
          console.log('  ❌ Still has CPR sections!');
        } else {
          console.log('  ✅ Has correct choking sections');
        }
      }
    });

    console.log('\n🎉 Database fix completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Refresh your app');
    console.log('2. Check choking checklists - should show correct sections');
    console.log('3. Check CPR checklists - only airway, breathing, circulation should be compulsory');

  } catch (error) {
    console.error('❌ Database fix failed:', error);
  }
}

// Run the fix
if (require.main === module) {
  runDatabaseFix();
}

module.exports = { runDatabaseFix };

