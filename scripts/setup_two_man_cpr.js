const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTwoManCPR() {
  try {
    console.log('🚀 Setting up Two Man CPR checklist...');
    
    // First, check if Two Man CPR checklist already exists
    const { data: existingData, error: checkError } = await supabase
      .from('checklist_item')
      .select('id')
      .eq('checklist_type', 'two man cpr')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking existing data:', checkError);
      return;
    }

    if (existingData && existingData.length > 0) {
      console.log('✅ Two Man CPR checklist already exists!');
      return;
    }

    // Create Two Man CPR checklist items
    const twoManCPRItems = [
      // DANGER section
      {
        checklist_type: 'two man cpr',
        section: 'danger',
        item: 'Wear PPE (gloves, apron, mask), look out for blood spills, sharps, electric wires. Unsteady beds, trolley',
        is_compulsory: true,
        order_index: 1
      },
      
      // RESPONSE section
      {
        checklist_type: 'two man cpr',
        section: 'respons',
        item: 'Shoulder tap',
        is_compulsory: true,
        order_index: 2
      },
      {
        checklist_type: 'two man cpr',
        section: 'respons',
        item: 'Shout & speak "are you okay?"',
        is_compulsory: true,
        order_index: 3
      },
      
      // SHOUT FOR HELP section
      {
        checklist_type: 'two man cpr',
        section: 'shout for help',
        item: 'For IHCA - Shout "Emergency! Emergency! Bring the resuscitation trolley and defibrillator/AED!"',
        is_compulsory: true,
        order_index: 4
      },
      
      // AIRWAY section
      {
        checklist_type: 'two man cpr',
        section: 'airway',
        item: 'Head Tilt Chin Lift',
        is_compulsory: true,
        order_index: 5
      },
      {
        checklist_type: 'two man cpr',
        section: 'airway',
        item: 'Jaw Thrust',
        is_compulsory: true,
        order_index: 6
      },
      
      // BREATHING section
      {
        checklist_type: 'two man cpr',
        section: 'breathing',
        item: 'Determine while opening the airway by looking at the chest, in not more than 10 seconds (and if you are trained, simultaneously feel for the presence of pulse)',
        is_compulsory: true,
        order_index: 7
      },
      {
        checklist_type: 'two man cpr',
        section: 'breathing',
        item: 'Chest compression shall begin with absence of normal breathing or no pulse',
        is_compulsory: true,
        order_index: 8
      },
      
      // CIRCULATION section (1st Rescuer)
      {
        checklist_type: 'two man cpr',
        section: 'circulation',
        item: 'Location - middle of chest, lower half of sternum',
        is_compulsory: true,
        order_index: 9
      },
      {
        checklist_type: 'two man cpr',
        section: 'circulation',
        item: 'Rate of compression: 100-120/min',
        is_compulsory: true,
        order_index: 10
      },
      {
        checklist_type: 'two man cpr',
        section: 'circulation',
        item: 'Depth of compression: 5-6 cm',
        is_compulsory: true,
        order_index: 11
      },
      {
        checklist_type: 'two man cpr',
        section: 'circulation',
        item: 'Full recoil after each compression',
        is_compulsory: true,
        order_index: 12
      },
      {
        checklist_type: 'two man cpr',
        section: 'circulation',
        item: 'Minimize Interruption',
        is_compulsory: true,
        order_index: 13
      },
      {
        checklist_type: 'two man cpr',
        section: 'circulation',
        item: 'Compressions to ventilations ratio, 30:2',
        is_compulsory: true,
        order_index: 14
      },
      {
        checklist_type: 'two man cpr',
        section: 'circulation',
        item: 'Each ventilation in 1 second',
        is_compulsory: true,
        order_index: 15
      },
      
      // DEFIBRILLATION section (2nd Rescuer)
      {
        checklist_type: 'two man cpr',
        section: 'defribillation',
        item: '2nd Rescuer arrives and turn on AED',
        is_compulsory: true,
        order_index: 16
      },
      {
        checklist_type: 'two man cpr',
        section: 'defribillation',
        item: '2nd Rescuer attach pads while the 1st rescuer continue chest compression',
        is_compulsory: true,
        order_index: 17
      },
      {
        checklist_type: 'two man cpr',
        section: 'defribillation',
        item: '2nd Rescuer clear the victim allowing AED rhythm analysis, RESCUERS SWITCH ROLES',
        is_compulsory: true,
        order_index: 18
      },
      {
        checklist_type: 'two man cpr',
        section: 'defribillation',
        item: 'If shock is advised 2nd rescuer clears the victim and loudly state "Stand Clear" then press the shock button',
        is_compulsory: true,
        order_index: 19
      },
      {
        checklist_type: 'two man cpr',
        section: 'defribillation',
        item: 'After shock, BOTH rescuers immediately resume CPR for 5 cycles or about 2 minutes; 1st rescuer provide ventilation, 2nd rescuer provide chest compression',
        is_compulsory: true,
        order_index: 20
      },
      {
        checklist_type: 'two man cpr',
        section: 'defribillation',
        item: 'If no shock is indicated, BOTH rescuers provide CPR as above',
        is_compulsory: true,
        order_index: 21
      },
      {
        checklist_type: 'two man cpr',
        section: 'defribillation',
        item: 'After 5 cycles or about 2 minutes of CPR, the AED will prompt rescuer to repeat steps (c to e)',
        is_compulsory: true,
        order_index: 22
      },
      {
        checklist_type: 'two man cpr',
        section: 'defribillation',
        item: 'Reassess and RESCUERS SWITCH during AED analysis. If AED not available, rescuers switch role after CPR for 5 cycles or 2 minutes',
        is_compulsory: true,
        order_index: 23
      }
    ];

    // Insert the items
    const { data, error } = await supabase
      .from('checklist_item')
      .insert(twoManCPRItems);

    if (error) {
      console.error('❌ Error creating Two Man CPR checklist:', error);
      return;
    }

    console.log('✅ Two Man CPR checklist created successfully!');
    console.log(`📋 Created ${twoManCPRItems.length} checklist items`);
    console.log('🎯 Sections included:');
    console.log('   - Danger (1 item)');
    console.log('   - Response (2 items)');
    console.log('   - Shout for Help (1 item)');
    console.log('   - Airway (2 items)');
    console.log('   - Breathing (2 items)');
    console.log('   - Circulation (7 items)');
    console.log('   - Defibrillation (8 items)');
    console.log('🎉 Two Man CPR checklist is ready to use!');
    
  } catch (error) {
    console.error('❌ Error setting up Two Man CPR checklist:', error);
    console.error('Please check your Supabase connection and permissions');
  }
}

// Run the setup
setupTwoManCPR();
