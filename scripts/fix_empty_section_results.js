const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Standard checklist structure based on the working records
const standardChecklistStructure = {
  'one man cpr': [
    {
      "section": "danger",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check for danger", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Ensure scene safety", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Remove hazards", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "responsiveness",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check for response", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Shake and shout", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Call for help", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "airway",
      "completed": false,
      "items": [
        { "id": 1, "item": "Open airway", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Head tilt chin lift", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Check for obstruction", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "breathing",
      "completed": false,
      "items": [
        { "id": 1, "item": "Look, listen, feel", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Check for 10 seconds", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Assess breathing quality", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "circulation",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check pulse", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Start chest compressions", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Maintain proper rate", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "defibrillation",
      "completed": false,
      "items": [
        { "id": 1, "item": "Apply AED pads", "completed": false, "is_compulsory": false },
        { "id": 2, "item": "Follow AED prompts", "completed": false, "is_compulsory": false },
        { "id": 3, "item": "Continue CPR", "completed": false, "is_compulsory": false }
      ]
    }
  ],
  'two man cpr': [
    {
      "section": "danger",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check for danger", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Ensure scene safety", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Remove hazards", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "responsiveness",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check for response", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Shake and shout", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Call for help", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "airway",
      "completed": false,
      "items": [
        { "id": 1, "item": "Open airway", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Head tilt chin lift", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Check for obstruction", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "breathing",
      "completed": false,
      "items": [
        { "id": 1, "item": "Look, listen, feel", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Check for 10 seconds", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Assess breathing quality", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "circulation",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check pulse", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Start chest compressions", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Coordinate with partner", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "defibrillation",
      "completed": false,
      "items": [
        { "id": 1, "item": "Apply AED pads", "completed": false, "is_compulsory": false },
        { "id": 2, "item": "Follow AED prompts", "completed": false, "is_compulsory": false },
        { "id": 3, "item": "Continue CPR", "completed": false, "is_compulsory": false }
      ]
    }
  ],
  'infant cpr': [
    {
      "section": "danger",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check for danger", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Ensure scene safety", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Remove hazards", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "responsiveness",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check for response", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Tap foot gently", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Call for help", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "airway",
      "completed": false,
      "items": [
        { "id": 1, "item": "Open airway", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Neutral head position", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Check for obstruction", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "breathing",
      "completed": false,
      "items": [
        { "id": 1, "item": "Look, listen, feel", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Check for 10 seconds", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Assess breathing quality", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "circulation",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check brachial pulse", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Start chest compressions", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Use 2 fingers technique", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "defibrillation",
      "completed": false,
      "items": [
        { "id": 1, "item": "Apply infant AED pads", "completed": false, "is_compulsory": false },
        { "id": 2, "item": "Follow AED prompts", "completed": false, "is_compulsory": false },
        { "id": 3, "item": "Continue CPR", "completed": false, "is_compulsory": false }
      ]
    }
  ],
  'infant choking': [
    {
      "section": "danger",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check for danger", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Ensure scene safety", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Remove hazards", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "responsiveness",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check for response", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Assess consciousness", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Call for help", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "shout for help",
      "completed": false,
      "items": [
        { "id": 1, "item": "Call for emergency help", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Stay with the infant", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Prepare for intervention", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "airway",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check airway", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Look for obstruction", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Prepare for removal", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "breathing",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check breathing", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Assess effort", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Monitor closely", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "circulation",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check circulation", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Monitor pulse", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Assess skin color", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "defibrillation",
      "completed": false,
      "items": [
        { "id": 1, "item": "Apply infant AED pads", "completed": false, "is_compulsory": false },
        { "id": 2, "item": "Follow AED prompts", "completed": false, "is_compulsory": false },
        { "id": 3, "item": "Continue monitoring", "completed": false, "is_compulsory": false }
      ]
    }
  ],
  'adult choking': [
    {
      "section": "danger",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check for danger", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Ensure scene safety", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Remove hazards", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "responsiveness",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check for response", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Assess consciousness", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Call for help", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "airway",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check airway", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Look for obstruction", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Prepare for removal", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "breathing",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check breathing", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Assess effort", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Monitor closely", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "circulation",
      "completed": false,
      "items": [
        { "id": 1, "item": "Check circulation", "completed": false, "is_compulsory": true },
        { "id": 2, "item": "Monitor pulse", "completed": false, "is_compulsory": true },
        { "id": 3, "item": "Assess skin color", "completed": false, "is_compulsory": true }
      ]
    },
    {
      "section": "defibrillation",
      "completed": false,
      "items": [
        { "id": 1, "item": "Apply AED pads", "completed": false, "is_compulsory": false },
        { "id": 2, "item": "Follow AED prompts", "completed": false, "is_compulsory": false },
        { "id": 3, "item": "Continue monitoring", "completed": false, "is_compulsory": false }
      ]
    }
  ]
};

async function fixEmptySectionResults() {
  try {
    console.log('🔍 Fixing empty section_results...');
    
    // Find all records with empty section_results
    const { data: emptyResults, error: fetchError } = await supabase
      .from('checklist_result')
      .select('*')
      .eq('is_deleted', false);
    
    if (fetchError) {
      console.error('❌ Error fetching records:', fetchError);
      return;
    }
    
    const emptyRecords = emptyResults.filter(r => !Array.isArray(r.section_results) || r.section_results.length === 0);
    console.log(`✅ Found ${emptyRecords.length} records with empty section_results`);
    
    if (emptyRecords.length === 0) {
      console.log('✅ No empty records found - all good!');
      return;
    }
    
    // Fix each empty record
    for (const record of emptyRecords) {
      const checklistType = record.checklist_type;
      const standardStructure = standardChecklistStructure[checklistType];
      
      if (!standardStructure) {
        console.log(`⚠️  No standard structure for ${checklistType} - skipping`);
        continue;
      }
      
      console.log(`🔧 Fixing ${record.participant_name} - ${checklistType}...`);
      
      // Update the record with the standard structure
      const { error: updateError } = await supabase
        .from('checklist_result')
        .update({
          section_results: standardStructure,
          total_items: standardStructure.reduce((total, section) => total + section.items.length, 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', record.id);
      
      if (updateError) {
        console.error(`❌ Error updating ${record.id}:`, updateError);
      } else {
        console.log(`✅ Fixed ${record.participant_name} - ${checklistType}`);
      }
    }
    
    console.log('🎉 All empty section_results have been fixed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixEmptySectionResults();



