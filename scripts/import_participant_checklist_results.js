const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Participant checklist results data
const participantResults = [
  { name: "ABDUL RAHMAN BIN MOHAMAD BADARUDDIN", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "AHMAD ZAKI ISAMUDDIN BIN MOHAMAD", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "ALVIN DULAMIT", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "AMANDA BULAN SIGAR", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "AMIR LUQMAN BIN MISKANI", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "ANGELINA RURAN SIGAR", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "AWANGKU MOHAMMAD ZULFAZLI BIN AWANGKU ABDUL RAZAK", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "CATHERINE JOHN", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "CHRISTINA PADIN", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "CHRISTINE KOW CHONG LI", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "ELSIE ANAK BITI", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "EMILY AKUP", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "FAIRYLICIA BRAIM", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "FARIDAH BINTI KUNAS", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "FIZRA IVY WAS", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "FAIL" },
  { name: "GRACE NYURA ANAK JAMBAI", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "GRACE RURAN NGILO", oneManCpr: "FAIL", twoManCpr: "FAIL", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "FAIL" },
  { name: "IMANUEL G. KORO", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "JANIZA BINTI BUJANG", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "JOHARI BIN EPIN", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "KAMARIAH BINTI MOHAMAD ALI", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "MANSUR BIN MURNI", oneManCpr: "FAIL", twoManCpr: "FAIL", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "FAIL" },
  { name: "MARZUKI RAJANG", oneManCpr: "FAIL", twoManCpr: "FAIL", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "FAIL" },
  { name: "METHDIOUSE ANAK SILAN", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "MISRAWATI MA AMAN", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "MOHAMAD FARIZZUL BIN JAYA", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "MOHAMMAD ANNAS BIN BOING", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "MUHD ZAINUL 'IZZAT BIN ZAINUDIN", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "MUHSINAH BINTI ABDUL SHOMAD", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "MYRA ATHIRA BINTI OMAR", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "NADHIRAH BINTI MOHD HANAFIAH", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "NAZURAH BINTI ABDUL LATIP", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "NOR BAIZURAH BINTI MASLIM", oneManCpr: "FAIL", twoManCpr: "FAIL", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "FAIL" },
  { name: "NORFARAIN BINTI SARBINI@SALDAN", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "NORLINA BINTI ALI", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "NORSHELA BINTI YUSUF", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "NUR AMANDA BELINDA JARUT", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "NURITA BINTI HANTIN", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "NURIZANIE BINTI SANEH", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "FAIL" },
  { name: "NURMASLIANA BINTI ISMAIL", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "FAIL" },
  { name: "NURUL HAZWANIE ABDULLAH", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "PRISCA ANAK RUE", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "RAJAMI BIN ABDUL HASHIM", oneManCpr: "FAIL", twoManCpr: "FAIL", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "FAIL" },
  { name: "RAZAMAH BINTI DULLAH", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "RURAN SAUL", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "SA'DI BIN USOP", oneManCpr: "FAIL", twoManCpr: "FAIL", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "FAIL" },
  { name: "SAUDAAH BINTI IDANG", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "SHAHIRUL AQMAL BIN SHAHEEDAN", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "SHAHRULNIZAM BIN IBRAHIM", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "SHIRLEY SEBELT", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "SITI KHAIRUNISA BINTI ZALEK", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "SUHARMIE BIN SULAIMAN", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "TRACY JONAS", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "VOON KING FATT", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "WENDY CHANDI ANAK SAMPURAI", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" },
  { name: "YONG ZILING", oneManCpr: "PASS", twoManCpr: "PASS", adultChoking: "PASS", infantChoking: "PASS", infantCpr: "PASS" }
];

// Checklist types mapping
const checklistTypes = {
  oneManCpr: 'one man cpr',
  twoManCpr: 'two man cpr',
  adultChoking: 'adult choking',
  infantChoking: 'infant choking',
  infantCpr: 'infant cpr'
};

// Function to create a checklist result entry
function createChecklistResult(profile, checklistType, status) {
  const isPass = status === 'PASS';
  const completionPercentage = isPass ? 100.0 : 0.0;
  
  return {
    participant_id: profile.id,
    participant_name: profile.name,
    participant_email: profile.email,
    participant_ic_number: profile.ic_number,
    participant_phone_number: generatePhoneNumber(),
    participant_job_position: profile.job_position_name || 'Healthcare Worker',
    participant_category: profile.category || 'Clinical',
    participant_workplace: 'Hospital',
    participant_pregnancy_status: false,
    participant_pregnancy_weeks: null,
    participant_allergies: false,
    participant_allergies_description: null,
    participant_asthma_status: false,
    checklist_type: checklistType,
    checklist_version: '1.0',
    total_items: getTotalItemsForChecklist(checklistType),
    completed_items: isPass ? getTotalItemsForChecklist(checklistType) : 0,
    completion_percentage: completionPercentage,
    status: status,
    can_pass: isPass,
    airway_completed: isPass,
    breathing_completed: isPass,
    circulation_completed: isPass,
    all_compulsory_completed: isPass,
    section_results: generateSectionResults(checklistType, isPass),
    instructor_id: null,
    instructor_name: 'System Import',
    instructor_comments: `Imported result: ${status}`,
    submitted_at: new Date().toISOString(),
    submission_ip: '127.0.0.1',
    submission_device_info: 'Data Import Script',
    assessment_duration_seconds: isPass ? 300 : 60, // 5 minutes for pass, 1 minute for fail
    time_started: new Date(Date.now() - (isPass ? 300000 : 60000)).toISOString(),
    time_completed: new Date().toISOString(),
    assessment_notes: `Automated import for ${profile.name}`,
    retake_count: 0,
    is_retake: false,
    previous_assessment_id: null,
    created_by: null,
    updated_by: null,
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    deletion_reason: null
  };
}

// Helper function to generate a consistent participant ID (UUID format)
function generateParticipantId(name) {
  // Create a simple hash-based seed for consistency
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use the hash as a seed for consistent UUID generation
  // This ensures the same name always gets the same UUID
  const seed = Math.abs(hash);
  const uuid = uuidv4();
  
  // For demo purposes, we'll use a simple approach
  // In production, you might want to use a more sophisticated seeding method
  return uuid;
}

// Helper function to generate IC number
function generateICNumber() {
  const year = Math.floor(Math.random() * 20) + 1980; // 1980-1999
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const random = Math.floor(Math.random() * 10000);
  return `${year.toString().slice(-2)}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}-${random.toString().padStart(4, '0')}`;
}

// Helper function to generate phone number
function generatePhoneNumber() {
  const prefixes = ['010', '011', '012', '013', '014', '015', '016', '017', '018', '019'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `${prefix}-${number}`;
}

// Helper function to get total items for each checklist type
function getTotalItemsForChecklist(checklistType) {
  const itemCounts = {
    'one man cpr': 22,
    'two man cpr': 25,
    'adult choking': 15,
    'infant choking': 18,
    'infant cpr': 20
  };
  return itemCounts[checklistType] || 20;
}

// Helper function to generate section results
function generateSectionResults(checklistType, isPass) {
  const sections = {
    'one man cpr': ['danger', 'respons', 'airway', 'breathing', 'circulation', 'defribillation'],
    'two man cpr': ['danger', 'respons', 'airway', 'breathing', 'circulation', 'defribillation'],
    'adult choking': ['danger', 'respons', 'airway', 'breathing', 'circulation', 'defribillation'],
    'infant choking': ['danger', 'respons', 'shout for help', 'airway', 'breathing', 'circulation', 'defribillation'],
    'infant cpr': ['danger', 'respons', 'airway', 'breathing', 'circulation', 'defribillation']
  };
  
  const sectionList = sections[checklistType] || ['danger', 'respons', 'airway', 'breathing', 'circulation'];
  
  return sectionList.map(section => ({
    section: section,
    completed: isPass,
    items: Array.from({ length: 3 }, (_, i) => ({
      id: i + 1,
      item: `${section} item ${i + 1}`,
      completed: isPass,
      is_compulsory: ['airway', 'breathing', 'circulation'].includes(section)
    }))
  }));
}

// Main function to import data
async function importParticipantResults() {
  console.log('🚀 Starting participant checklist results import...');
  
  try {
    // First, fetch existing profiles to match with our data
    console.log('📋 Fetching existing profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, ic_number, job_position_name, category')
      .eq('user_type', 'participant')
      .eq('status', 'approved');
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }
    
    console.log(`✅ Found ${profiles?.length || 0} participant profiles`);
    
    // Create a name lookup map (case-insensitive)
    const nameMap = new Map();
    profiles?.forEach(profile => {
      const normalizedName = profile.name.toLowerCase().trim();
      nameMap.set(normalizedName, profile);
    });
    
    console.log(`📧 Name lookup map created with ${nameMap.size} entries`);
    
    // Check if we need to clear existing data
    console.log('📊 Checking existing checklist results...');
    const { data: existingData, error: checkError } = await supabase
      .from('checklist_result')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking existing data:', checkError);
      return;
    }
    
    if (existingData && existingData.length > 0) {
      console.log('⚠️  Existing checklist results found. Clearing old data first...');
      const { error: deleteError } = await supabase
        .from('checklist_result')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (deleteError) {
        console.error('❌ Error clearing existing data:', deleteError);
        return;
      }
      console.log('✅ Existing data cleared');
    }
    
    // Prepare all checklist results
    const allResults = [];
    const matchedParticipants = [];
    const unmatchedParticipants = [];
    
    for (const participant of participantResults) {
      const normalizedName = participant.name.toLowerCase().trim();
      const profile = nameMap.get(normalizedName);
      
      if (profile) {
        matchedParticipants.push({ name: participant.name, profile });
        
        for (const [checklistKey, checklistType] of Object.entries(checklistTypes)) {
          const status = participant[checklistKey];
          const result = createChecklistResult(profile, checklistType, status);
          allResults.push(result);
        }
      } else {
        unmatchedParticipants.push(participant.name);
        console.log(`⚠️  No profile found for: ${participant.name}`);
      }
    }
    
    console.log(`\n📊 Matching Results:`);
    console.log(`✅ Matched participants: ${matchedParticipants.length}`);
    console.log(`❌ Unmatched participants: ${unmatchedParticipants.length}`);
    
    if (unmatchedParticipants.length > 0) {
      console.log('\n⚠️  Unmatched participants:');
      unmatchedParticipants.forEach(name => console.log(`  - ${name}`));
    }
    
    console.log(`📝 Prepared ${allResults.length} checklist results for ${participantResults.length} participants`);
    
    // Insert data in batches to avoid timeout
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < allResults.length; i += batchSize) {
      const batch = allResults.slice(i, i + batchSize);
      console.log(`📤 Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allResults.length / batchSize)} (${batch.length} records)...`);
      
      const { data, error } = await supabase
        .from('checklist_result')
        .insert(batch)
        .select('id');
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} inserted successfully`);
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`✅ Successfully imported: ${successCount} records`);
    console.log(`❌ Failed to import: ${errorCount} records`);
    console.log(`👥 Participants: ${participantResults.length}`);
    console.log(`📋 Checklist types: ${Object.keys(checklistTypes).length}`);
    console.log(`📈 Total expected records: ${participantResults.length * Object.keys(checklistTypes).length}`);
    
    // Verify the import
    console.log('\n🔍 Verifying import...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('checklist_result')
      .select('id, participant_name, checklist_type, status')
      .order('participant_name', { ascending: true });
    
    if (verifyError) {
      console.error('❌ Error verifying import:', verifyError);
    } else {
      console.log(`✅ Verification successful: ${verifyData.length} records found in database`);
      
      // Show some sample data
      console.log('\n📋 Sample imported data:');
      const sampleData = verifyData.slice(0, 10);
      sampleData.forEach(record => {
        console.log(`  - ${record.participant_name} | ${record.checklist_type} | ${record.status}`);
      });
      
      if (verifyData.length > 10) {
        console.log(`  ... and ${verifyData.length - 10} more records`);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error during import:', error);
  }
}

// Run the import
importParticipantResults()
  .then(() => {
    console.log('\n🎉 Import process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Import process failed:', error);
    process.exit(1);
  });
