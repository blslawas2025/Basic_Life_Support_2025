// Import all 55 participants from complete_55_participants.csv
// This will import all the test results data for all 55 participants

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the complete CSV file
function readCSVData() {
  try {
    const csvPath = path.join(__dirname, '..', 'data', 'complete_55_participants.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    
    // Skip header row
    const dataLines = lines.slice(1);
    
    const participants = dataLines.map((line, index) => {
      const [email, name, ic, preTest, postTest] = line.split(',');
      return {
        email: email.trim(),
        name: name.trim(),
        ic: ic.trim(),
        preTest: parseInt(preTest.trim()) || 0,
        postTest: parseInt(postTest.trim()) || 0
      };
    }).filter(p => p.email && p.name); // Filter out empty rows
    
    console.log(`📊 Loaded ${participants.length} participants from CSV`);
    return participants;
  } catch (error) {
    console.error('❌ Error reading CSV file:', error);
    return [];
  }
}

async function importAll55Participants() {
  try {
    console.log('🚀 Starting complete import of all 55 participants...');
    
    // Read data from CSV
    const allTestData = readCSVData();
    
    if (allTestData.length === 0) {
      throw new Error('No data found in CSV file');
    }
    
    console.log(`📊 Processing ${allTestData.length} participants...`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    const importedRecords = [];
    
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
      emailMap.set(profile.email.toLowerCase(), profile);
    });
    
    console.log(`📧 Email lookup map created with ${emailMap.size} entries`);
    
    // Process each participant
    for (let i = 0; i < allTestData.length; i++) {
      const participant = allTestData[i];
      const rowNumber = i + 2; // +2 because we skipped header and arrays are 0-indexed
      
      console.log(`\n📝 Processing participant ${i + 1}/${allTestData.length}: ${participant.email}`);
      
      // Find matching profile
      const profile = emailMap.get(participant.email.toLowerCase());
      
      if (!profile) {
        console.log(`❌ Profile not found for ${participant.email}`);
        errors.push(`Row ${rowNumber}: Profile not found for ${participant.email}`);
        errorCount++;
        continue;
      }
      
      console.log(`✅ Found profile: ${profile.name} (${profile.id})`);
      
      // Determine job category based on job position
      let jobCategory = 'Non-Clinical';
      if (profile.job_position_name) {
        const clinicalKeywords = ['nurse', 'doctor', 'medical', 'clinical', 'health', 'jururawat', 'doktor', 'perubatan'];
        const isClinical = clinicalKeywords.some(keyword => 
          profile.job_position_name.toLowerCase().includes(keyword)
        );
        jobCategory = isClinical ? 'Clinical' : 'Non-Clinical';
      }
      
      console.log(`🏥 Job category: ${jobCategory}`);
      
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
          time_taken_seconds: 1200, // 20 minutes
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
    }
    
    console.log('\n🎉 Import completed!');
    console.log(`✅ Successfully processed: ${successCount} participants`);
    console.log(`❌ Errors: ${errorCount} participants`);
    console.log(`📊 Total records imported: ${importedRecords.length}`);
    
    console.log('\n📋 Imported Records Summary:');
    const preTestCount = importedRecords.filter(r => r.test === 'pre_test').length;
    const postTestCount = importedRecords.filter(r => r.test === 'post_test').length;
    console.log(`📊 Pre-test records: ${preTestCount}`);
    console.log(`📊 Post-test records: ${postTestCount}`);
    
    console.log('\n📋 Sample imported records:');
    importedRecords.slice(0, 10).forEach(record => {
      console.log(`  - ${record.participant}: ${record.test} = ${record.score}/30`);
    });
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.slice(0, 10).forEach(error => console.log(`  - ${error}`));
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more errors`);
      }
    }
    
    // Verify final results
    console.log('\n📊 Verifying final results...');
    const { data: finalCount, error: countError } = await supabase
      .from('test_submissions')
      .select('id', { count: 'exact' });
    
    if (countError) {
      console.log(`❌ Error counting final results: ${countError.message}`);
    } else {
      console.log(`✅ Total records in test_submissions: ${finalCount?.length || 0}`);
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Check your Supabase Dashboard to see all imported data');
    console.log('2. Go to Certificate Management screen in your app');
    console.log('3. View the imported certificates for all 55 participants');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

// Run the import
importAll55Participants();
