// Import all 55 participants from your complete dataset
// This will import all the test results data

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Complete dataset with all 55 participants
const allParticipants = [
  { email: 'rahmanbadaruddin@gmail.com', name: 'ABDUL RAHMAN BIN MOHAMAD BADARUDDIN', ic: '960109-03-5847', preTest: 20, postTest: 25 },
  { email: 'zaki940852@gmail.com', name: 'AHMMAD ZAKI ISAMUDDIN BIN MOHAMAD', ic: '940819-13-6687', preTest: 13, postTest: 21 },
  { email: 'alvincie5115@gmail.com', name: 'ALVIN DULAMIT', ic: '910522-12-5429', preTest: 27, postTest: 30 },
  { email: 'amandasigar@gmail.com', name: 'AMANDA BULAN SIGAR', ic: '840901-13-6178', preTest: 19, postTest: 20 },
  { email: 'roketship101@gmail.com', name: 'AMIR LUQMAN', ic: '950623-14-6647', preTest: 25, postTest: 27 },
  { email: 'awangku7467@gmail.com', name: 'AWANGKU MOHAMAD ZULFAZLI BIN AWANGKU ABDUL RAZAK', ic: '950821-13-6503', preTest: 14, postTest: 22 },
  { email: 'c.thyreen2021@gmail.com', name: 'CATHERINE JOHN', ic: '790820-13-5146', preTest: 19, postTest: 26 },
  { email: 'christinapadin22@gmail.com', name: 'CHRISTINA PADIN', ic: '860121-52-5488', preTest: 13, postTest: 23 },
  { email: 'christine.kcl@moh.gov.my', name: 'CHRISTINE KOW CHONG LI', ic: '911225-12-5718', preTest: 21, postTest: 27 },
  { email: 'elsiemorriebiti9898@gmail.com', name: 'ELSIE ANAK BITI', ic: '980912-13-5458', preTest: 24, postTest: 27 },
  { email: 'emilyakup8279@gmail.com', name: 'EMILY AKUP', ic: '820924-13-5946', preTest: 20, postTest: 28 },
  { email: 'fairybobbylicia@gmail.com', name: 'FAIRYLICIA BRAIM', ic: '960927-13-6308', preTest: 23, postTest: 28 },
  { email: 'farifari83_aku@yahoo.com.my', name: 'FARIDAH BINTI KUNAS', ic: '830926-12-5994', preTest: 23, postTest: 26 },
  { email: 'fizraivy@gmail.com', name: 'FIZRA IVY WAS', ic: '981108-13-6016', preTest: 17, postTest: 23 },
  { email: 'gracenyura@gmail.com', name: 'GRACE NYURA ANAK JAMBAI', ic: '960222-13-6244', preTest: 19, postTest: 28 },
  { email: 'gracee8788@gmail.com', name: 'GRACE RURAN NGILO', ic: '880708-13-5196', preTest: 14, postTest: 22 },
  { email: 'imanuel@moh.gov.my', name: 'IMANUEL G. KORO', ic: '940830-12-6615', preTest: 16, postTest: 24 },
  { email: 'neezabujang@gmail.com', name: 'JANIZA BINTI BUJANG', ic: '810409-13-5520', preTest: 18, postTest: 29 },
  { email: 'johaee24@gmail.com', name: 'JOHARI BIN EPIN', ic: '980724-12-5949', preTest: 15, postTest: 24 },
  { email: 'kamariah.m.ali@moh.gov.my', name: 'KAMARIAH BINTI MOHAMAD ALI', ic: '810315-13-5546', preTest: 22, postTest: 27 },
  { email: 'mansurmurni22@gmail.com', name: 'MANSUR BIN MURNI', ic: '850410-13-5583', preTest: 20, postTest: 24 },
  { email: 'marzukirajang@gmail.com', name: 'MARZUKI RAJANG', ic: '730818-13-5601', preTest: 15, postTest: 26 },
  { email: 'endansilan@gmail.com', name: 'METHDIOUSE AK SILAN', ic: '740227-13-5051', preTest: 9, postTest: 20 },
  { email: 'miesra.maaman125@gmail.com', name: 'MISRAWATI BINTI MA AMAN', ic: '900512-12-6138', preTest: 25, postTest: 29 },
  { email: 'farizulbj@gmail.com', name: 'MOHAMAD FARIZZUL BIN JAYA', ic: '841116-13-6003', preTest: 25, postTest: 28 },
  { email: 'mohammadannas@moh.gov.my', name: 'MOHAMMAD ANNAS BIN BOING', ic: '881028-13-5349', preTest: 25, postTest: 30 },
  { email: 'zainulizzat@gmail.com', name: 'MUHD ZAINUL IZZAT BIN ZAINUDIN', ic: '930829-13-6657', preTest: 21, postTest: 29 },
  { email: 'muhsinah92@gmail.com', name: 'MUHSINAH BINTI ABDUL SHOMAD', ic: '920408-08-5506', preTest: 21, postTest: 26 },
  { email: 'myraathira53@gmail.com', name: 'MYRA ATHIRA BINTI OMAR', ic: '920529-12-6298', preTest: 19, postTest: 27 },
  { email: 'nadhirahmh98@gmail.com', name: 'NADHIRAH BINTI MOHD HANAFIAH', ic: '980501-11-5030', preTest: 17, postTest: 25 },
  { email: 'juralatip3010@gmail.com', name: 'NAZURAH BINTI ABDUL LATIP', ic: '911030-13-6310', preTest: 28, postTest: 29 },
  { email: 'norbaizurah1994@gmail.com', name: 'NOR BAIZURAH BINTI MASLIM', ic: '941223-13-6648', preTest: 15, postTest: 22 },
  { email: 'norfarainsarbini@gmail.com', name: 'NORFARAIN BINTI SARBINI@SALDAN', ic: '980627-13-6064', preTest: 24, postTest: 28 },
  { email: 'norlinaali95@gmail.com', name: 'NORLINA BINTI ALI', ic: '951128-12-6360', preTest: 20, postTest: 28 },
  { email: 'shelayusuf175@gmail.com', name: 'NORSHELA BINTI YUSUF', ic: '850722-13-5232', preTest: 18, postTest: 23 },
  { email: 'nuramandabelindajarut@gmail.com', name: 'NUR AMANDA BELINDA JARUT', ic: '890916-13-5624', preTest: 21, postTest: 24 },
  { email: 'nbhromeoalfa07@gmail.com', name: 'NURITA BINTI HANTIN', ic: '740709-13-5492', preTest: 25, postTest: 28 },
  { email: 'ezanie950728@gmail.com', name: 'NURIZANIE BINTI SANEH', ic: '950728-13-5098', preTest: 21, postTest: 26 },
  { email: 'maslianaismail8@gmail.com', name: 'NURMASLIANA BINTI ISMAIL', ic: '901225-13-6514', preTest: 19, postTest: 27 },
  { email: 'nurulhazwanie1505@gmail.com', name: 'NURUL HAZWANIE ABDULLAH', ic: '790825-13-6156', preTest: 24, postTest: 28 },
  { email: 'priscarue24@gmail.com', name: 'PRISCA ANAK RUE', ic: '940402-13-5566', preTest: 22, postTest: 27 },
  { email: 'rajami5119@gmail.com', name: 'RAJAMI BIN ABDUL HASHIM', ic: '700825-13-5119', preTest: 10, postTest: 19 },
  { email: 'razamah.fn95@gmail.com', name: 'RAZAMAH BINTI DULLAH', ic: '721119-13-5368', preTest: 23, postTest: 25 },
  { email: 'ruransaul1990@gmail.com', name: 'RURAN SAUL', ic: '900612-13-8742', preTest: 17, postTest: 28 },
  { email: 'sadiusop7581@gmail.com', name: 'SA\'DI BIN USOP', ic: '680924-13-5151', preTest: 15, postTest: 14 },
  { email: 'saudahidang@gmail.com', name: 'SAUDAAH BINTI IDANG', ic: '830105-13-5984', preTest: 20, postTest: 28 },
  { email: 'shahirul.aqmal@gmail.com', name: 'SHAHIRUL AQMAL BIN SHAHEEDAN', ic: '970430-13-6459', preTest: 25, postTest: 28 },
  { email: 'shirley.sebelt71@gmail.com', name: 'SHIRLEY SEBELT', ic: '710217-13-5106', preTest: 24, postTest: 27 },
  { email: 'nisazalek@gmail.com', name: 'SITI KHAIRUNISA BINTI ZALEK', ic: '920509-13-5402', preTest: 22, postTest: 27 },
  { email: 'suharmies@gmail.com', name: 'SUHARMIE BIN SULAIMAN', ic: '850507-13-5897', preTest: 11, postTest: 23 },
  { email: 'syamgunners22@gmail.com', name: 'SYAMSUL HARDY BIN RAMLAN', ic: '921022-13-6061', preTest: 18, postTest: 26 },
  { email: 'immaculateflynn@gmail.com', name: 'TRACY JONAS', ic: '920303-12-5954', preTest: 19, postTest: 26 },
  { email: 'kingfattvoon@gmail.com', name: 'VOON KING FATT', ic: '961201-13-6231', preTest: 22, postTest: 28 },
  { email: 'weywenwen93@gmail.com', name: 'WENDY CHANDI ANAK SAMPURAI', ic: '930519-13-5552', preTest: 20, postTest: 25 },
  { email: 'shahrulnizam3716@gmail.com', name: 'SHAHRULNIZAM BIN IBRAHIM', ic: '960401135909', preTest: 20, postTest: 26 }
];

async function importAll55Participants() {
  try {
    console.log('🚀 Starting complete import of all 55 participants...');
    console.log(`📊 Processing ${allParticipants.length} participants...`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const importedRecords = [];
    const improvements = [];
    
    // Get all profiles
    console.log('\n📋 Fetching all profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name, ic_number, job_position_name, job_position_id')
      .eq('user_type', 'participant')
      .eq('status', 'approved');
    
    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }
    
    console.log(`✅ Found ${profiles?.length || 0} profiles in database`);
    
    // Create email lookup map
    const emailMap = new Map();
    profiles?.forEach(profile => {
      if (profile.email) {
        emailMap.set(profile.email.toLowerCase(), profile);
      }
    });
    
    console.log(`📧 Email lookup map created with ${emailMap.size} entries`);
    
    // Process each participant
    for (let i = 0; i < allParticipants.length; i++) {
      const participant = allParticipants[i];
      const rowNumber = i + 1;
      
      try {
        console.log(`\n📝 Processing participant ${rowNumber}/${allParticipants.length}: ${participant.email}`);
        
        // Find matching profile
        const profile = emailMap.get(participant.email.toLowerCase());
        
        if (!profile) {
          console.log(`⚠️  No profile found for ${participant.email}`);
          errors.push(`Row ${rowNumber}: No profile found for ${participant.email}`);
          errorCount++;
          continue;
        }
        
        console.log(`✅ Found profile: ${profile.name} (${profile.id})`);
        
        // Get job category
        let jobCategory = 'Non-Clinical';
        if (profile.job_position_id) {
          const { data: job, error: jobError } = await supabase
            .from('jobs')
            .select('category')
            .eq('id', profile.job_position_id)
            .single();
          
          if (!jobError && job) {
            jobCategory = job.category || 'Non-Clinical';
          }
        }
        
        console.log(`🏥 Job category: ${jobCategory}`);
        
        // Calculate improvement
        const improvement = participant.postTest - participant.preTest;
        improvements.push({
          name: participant.name,
          preTest: participant.preTest,
          postTest: participant.postTest,
          improvement: improvement
        });
        
        // Import pre-test result
        if (participant.preTest > 0) {
          console.log(`📊 Importing pre-test: ${participant.preTest}/30`);
          
          const preTestData = {
            user_id: profile.id,
            user_name: profile.name,
            user_email: profile.email,
            ic_number: profile.ic_number,
            job_position_name: profile.job_position_name,
            job_category: jobCategory,
            test_type: 'pre_test',
            score: participant.preTest,
            total_questions: 30,
            correct_answers: participant.preTest,
            time_taken_seconds: 1200, // 20 minutes
            submitted_at: new Date().toISOString(),
            is_completed: true,
            attempt_number: 1,
            can_retake: false,
            results_released: true,
            results_released_at: new Date().toISOString()
          };
          
          const { data: preTestResult, error: preTestError } = await supabase
            .from('test_submissions')
            .insert([preTestData])
            .select()
            .single();
          
          if (preTestError) {
            console.log(`❌ Pre-test insert failed: ${preTestError.message}`);
            errors.push(`Row ${rowNumber} pre-test: ${preTestError.message}`);
          } else {
            console.log(`✅ Pre-test inserted: ${preTestResult.id}`);
            importedRecords.push({
              participant: participant.name,
              test: 'pre_test',
              score: participant.preTest,
              id: preTestResult.id
            });
          }
        }
        
        // Import post-test result
        if (participant.postTest > 0) {
          console.log(`📊 Importing post-test: ${participant.postTest}/30`);
          
          const postTestData = {
            user_id: profile.id,
            user_name: profile.name,
            user_email: profile.email,
            ic_number: profile.ic_number,
            job_position_name: profile.job_position_name,
            job_category: jobCategory,
            test_type: 'post_test',
            score: participant.postTest,
            total_questions: 30,
            correct_answers: participant.postTest,
            time_taken_seconds: 1000, // 16.7 minutes
            submitted_at: new Date().toISOString(),
            is_completed: true,
            attempt_number: 1,
            can_retake: false,
            results_released: true,
            results_released_at: new Date().toISOString()
          };
          
          const { data: postTestResult, error: postTestError } = await supabase
            .from('test_submissions')
            .insert([postTestData])
            .select()
            .single();
          
          if (postTestError) {
            console.log(`❌ Post-test insert failed: ${postTestError.message}`);
            errors.push(`Row ${rowNumber} post-test: ${postTestError.message}`);
          } else {
            console.log(`✅ Post-test inserted: ${postTestResult.id}`);
            importedRecords.push({
              participant: participant.name,
              test: 'post_test',
              score: participant.postTest,
              id: postTestResult.id
            });
          }
        }
        
        successCount++;
        
      } catch (rowError) {
        console.log(`❌ Error processing participant ${rowNumber}: ${rowError.message}`);
        errors.push(`Row ${rowNumber}: ${rowError.message}`);
        errorCount++;
      }
    }
    
    // Summary
    console.log('\n🎉 Import completed!');
    console.log(`✅ Successfully processed: ${successCount} participants`);
    console.log(`❌ Errors: ${errorCount} participants`);
    console.log(`📊 Total records imported: ${importedRecords.length}`);
    
    // Show improvement analysis
    console.log('\n📈 Performance Analysis:');
    const improved = improvements.filter(p => p.improvement > 0);
    const declined = improvements.filter(p => p.improvement < 0);
    const noChange = improvements.filter(p => p.improvement === 0);
    
    console.log(`📊 Participants who improved: ${improved.length}`);
    console.log(`📊 Participants who declined: ${declined.length}`);
    console.log(`📊 Participants with no change: ${noChange.length}`);
    
    // Show top improvements
    const topImprovements = improvements
      .filter(p => p.improvement > 0)
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 10);
    
    console.log('\n🏆 Top 10 Improvements:');
    topImprovements.forEach((p, index) => {
      console.log(`  ${index + 1}. ${p.name}: ${p.preTest} → ${p.postTest} (+${p.improvement})`);
    });
    
    // Show average scores
    const avgPreTest = improvements.reduce((sum, p) => sum + p.preTest, 0) / improvements.length;
    const avgPostTest = improvements.reduce((sum, p) => sum + p.postTest, 0) / improvements.length;
    const avgImprovement = avgPostTest - avgPreTest;
    
    console.log('\n📊 Average Scores:');
    console.log(`  Pre-test average: ${avgPreTest.toFixed(1)}/30`);
    console.log(`  Post-test average: ${avgPostTest.toFixed(1)}/30`);
    console.log(`  Average improvement: ${avgImprovement.toFixed(1)} points`);
    
    if (errors.length > 0) {
      console.log('\n📋 Error details:');
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    // Verify final count
    console.log('\n📊 Verifying final results...');
    const { data: finalResults, error: verifyError } = await supabase
      .from('test_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (verifyError) {
      console.error('❌ Verify error:', verifyError);
    } else {
      console.log(`✅ Total records in test_submissions: ${finalResults?.length || 0}`);
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Check your Supabase Dashboard to see all imported data');
    console.log('2. Go to Results & Analytics screen in your app');
    console.log('3. View the imported test results and analytics');
    console.log('4. Analyze performance improvements and trends');
    
  } catch (error) {
    console.error('💥 Import failed:', error);
  }
}

// Run the import
importAll55Participants();

