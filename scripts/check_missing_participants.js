const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Original 56 participants
const originalParticipants = [
  "ABDUL RAHMAN BIN MOHAMAD BADARUDDIN", "AHMAD ZAKI ISAMUDDIN BIN MOHAMAD", "ALVIN DULAMIT",
  "AMANDA BULAN SIGAR", "AMIR LUQMAN BIN MISKANI", "ANGELINA RURAN SIGAR",
  "AWANGKU MOHAMMAD ZULFAZLI BIN AWANGKU ABDUL RAZAK", "CATHERINE JOHN", "CHRISTINA PADIN",
  "CHRISTINE KOW CHONG LI", "ELSIE ANAK BITI", "EMILY AKUP", "FAIRYLICIA BRAIM",
  "FARIDAH BINTI KUNAS", "FIZRA IVY WAS", "GRACE NYURA ANAK JAMBAI",
  "GRACE RURAN NGILO", "IMANUEL G. KORO", "JANIZA BINTI BUJANG", "JOHARI BIN EPIN",
  "KAMARIAH BINTI MOHAMAD ALI", "MANSUR BIN MURNI", "MARZUKI RAJANG",
  "METHDIOUSE ANAK SILAN", "MISRAWATI MA AMAN", "MOHAMAD FARIZZUL BIN JAYA",
  "MOHAMMAD ANNAS BIN BOING", "MUHD ZAINUL 'IZZAT BIN ZAINUDIN", "MUHSINAH BINTI ABDUL SHOMAD",
  "MYRA ATHIRA BINTI OMAR", "NADHIRAH BINTI MOHD HANAFIAH", "NAZURAH BINTI ABDUL LATIP",
  "NOR BAIZURAH BINTI MASLIM", "NORFARAIN BINTI SARBINI@SALDAN", "NORLINA BINTI ALI",
  "NORSHELA BINTI YUSUF", "NUR AMANDA BELINDA JARUT", "NURITA BINTI HANTIN",
  "NURIZANIE BINTI SANEH", "NURMASLIANA BINTI ISMAIL", "NURUL HAZWANIE ABDULLAH",
  "PRISCA ANAK RUE", "RAJAMI BIN ABDUL HASHIM", "RAZAMAH BINTI DULLAH", "RURAN SAUL",
  "SA'DI BIN USOP", "SAUDAAH BINTI IDANG", "SHAHIRUL AQMAL BIN SHAHEEDAN",
  "SHAHRULNIZAM BIN IBRAHIM", "SHIRLEY SEBELT", "SITI KHAIRUNISA BINTI ZALEK",
  "SUHARMIE BIN SULAIMAN", "TRACY JONAS", "VOON KING FATT",
  "WENDY CHANDI ANAK SAMPURAI", "YONG ZILING"
];

async function checkMissingParticipants() {
  try {
    console.log('🔍 Checking for missing participants...');
    console.log(`📊 Original participants: ${originalParticipants.length}`);
    
    // Get all participants from database
    const { data: dbParticipants, error } = await supabase
      .from('checklist_result')
      .select('participant_name')
      .eq('is_deleted', false);
    
    if (error) {
      console.error('❌ Error fetching participants:', error);
      return;
    }
    
    // Get unique participant names from database
    const dbParticipantNames = [...new Set(dbParticipants?.map(p => p.participant_name) || [])];
    console.log(`📊 Database participants: ${dbParticipantNames.length}`);
    
    // Find missing participants
    const missingParticipants = originalParticipants.filter(name => 
      !dbParticipantNames.some(dbName => 
        dbName.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(dbName.toLowerCase())
      )
    );
    
    console.log(`\n❌ Missing participants: ${missingParticipants.length}`);
    if (missingParticipants.length > 0) {
      console.log('\n📋 Missing participant names:');
      missingParticipants.forEach((name, index) => {
        console.log(`${index + 1}. ${name}`);
      });
    }
    
    // Find participants in database but not in original list
    const extraParticipants = dbParticipantNames.filter(dbName => 
      !originalParticipants.some(origName => 
        dbName.toLowerCase().includes(origName.toLowerCase()) || 
        origName.toLowerCase().includes(dbName.toLowerCase())
      )
    );
    
    console.log(`\n➕ Extra participants in database: ${extraParticipants.length}`);
    if (extraParticipants.length > 0) {
      console.log('\n📋 Extra participant names:');
      extraParticipants.forEach((name, index) => {
        console.log(`${index + 1}. ${name}`);
      });
    }
    
    // Check for name matching issues
    console.log('\n🔍 Checking for name matching issues...');
    const potentialMatches = [];
    
    missingParticipants.forEach(missingName => {
      const similarNames = dbParticipantNames.filter(dbName => {
        // Check for partial matches
        const missingWords = missingName.toLowerCase().split(' ');
        const dbWords = dbName.toLowerCase().split(' ');
        
        // Check if any significant words match
        const matchingWords = missingWords.filter(word => 
          word.length > 3 && dbWords.some(dbWord => 
            dbWord.includes(word) || word.includes(dbWord)
          )
        );
        
        return matchingWords.length > 0;
      });
      
      if (similarNames.length > 0) {
        potentialMatches.push({
          missing: missingName,
          similar: similarNames
        });
      }
    });
    
    if (potentialMatches.length > 0) {
      console.log('\n🔍 Potential name matching issues:');
      potentialMatches.forEach(match => {
        console.log(`   Missing: "${match.missing}"`);
        console.log(`   Similar in DB: ${match.similar.join(', ')}`);
        console.log('');
      });
    }
    
    console.log('\n💡 Next steps:');
    console.log('1. Import the missing 6 participants');
    console.log('2. Check for name matching issues');
    console.log('3. Verify all 56 participants are in the database');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkMissingParticipants();



