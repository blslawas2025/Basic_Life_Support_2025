const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

// The 5 missing participants from the original 56 list
const missingOriginalParticipants = [
  {
    name: "AHMAD ZAKI ISAMUDDIN BIN MOHAMAD",
    results: ["PASS", "PASS", "PASS", "PASS", "PASS"]
  },
  {
    name: "AWANGKU MOHAMMAD ZULFAZLI BIN AWANGKU ABDUL RAZAK",
    results: ["PASS", "PASS", "PASS", "PASS", "PASS"]
  },
  {
    name: "METHDIOUSE ANAK SILAN",
    results: ["PASS", "PASS", "PASS", "PASS", "PASS"]
  },
  {
    name: "MISRAWATI MA AMAN",
    results: ["PASS", "PASS", "PASS", "PASS", "PASS"]
  },
  {
    name: "MUHD ZAINUL 'IZZAT BIN ZAINUDIN",
    results: ["PASS", "PASS", "PASS", "PASS", "PASS"]
  }
];

const assessmentTypes = ["one man cpr", "two man cpr", "infant cpr", "infant choking", "adult choking"];

async function addMissingOriginalParticipants() {
  try {
    console.log('🔧 Adding missing original participants to checklist results...');
    console.log(`📊 Missing participants to add: ${missingOriginalParticipants.length}`);
    
    // Get all profiles to find matching ones
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, email, ic_number, job_position_name, category');
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }
    
    console.log(`✅ Found ${profiles?.length || 0} profiles`);
    
    // Create name mapping
    const nameMap = new Map();
    profiles?.forEach(profile => {
      if (profile.name) {
        nameMap.set(profile.name.toLowerCase(), profile);
      }
    });
    
    const checklistResults = [];
    
    console.log('\n📋 Processing missing participants...');
    
    for (const participant of missingOriginalParticipants) {
      console.log(`\n--- Processing ${participant.name} ---`);
      
      // Find matching profile
      let profile = null;
      const participantNameLower = participant.name.toLowerCase();
      
      // Direct match
      if (nameMap.has(participantNameLower)) {
        profile = nameMap.get(participantNameLower);
        console.log(`   ✅ Found direct profile match`);
      } else {
        // Try partial matching
        for (const [profileName, profileData] of nameMap) {
          if (profileName.includes(participantNameLower) || participantNameLower.includes(profileName)) {
            profile = profileData;
            console.log(`   ✅ Found partial profile match: ${profileData.name}`);
            break;
          }
        }
      }
      
      if (!profile) {
        console.log(`   ❌ No profile found for ${participant.name}`);
        continue;
      }
      
      console.log(`   📊 Profile: ${profile.name}`);
      console.log(`   🆔 IC: ${profile.ic_number || 'N/A'}`);
      console.log(`   💼 Job: ${profile.job_position_name || 'N/A'}`);
      console.log(`   📂 Category: ${profile.category || 'N/A'}`);
      
      // Create checklist results for this participant
      participant.results.forEach((result, index) => {
        const checklistType = assessmentTypes[index];
        const isPass = result === 'PASS';
        
        const checklistResult = {
          id: uuidv4(),
          participant_id: profile.id,
          participant_name: profile.name,
          participant_email: profile.email,
          participant_ic_number: profile.ic_number,
          participant_phone_number: null,
          participant_job_position: profile.job_position_name,
          participant_category: profile.category,
          participant_workplace: null,
          participant_pregnancy_status: false,
          participant_pregnancy_weeks: null,
          participant_allergies: false,
          participant_allergies_description: null,
          participant_asthma_status: false,
          checklist_type: checklistType,
          checklist_version: '1.0',
          total_items: checklistType === 'one man cpr' ? 22 : 
                      checklistType === 'two man cpr' ? 25 : 
                      checklistType === 'infant cpr' ? 20 : 15,
          completed_items: isPass ? (checklistType === 'one man cpr' ? 22 : 
                                    checklistType === 'two man cpr' ? 25 : 
                                    checklistType === 'infant cpr' ? 20 : 15) : 0,
          completion_percentage: isPass ? 100 : 0,
          status: result,
          can_pass: isPass,
          airway_completed: true,
          breathing_completed: true,
          circulation_completed: true,
          all_compulsory_completed: isPass,
          section_results: {},
          instructor_id: null,
          instructor_name: 'System Import',
          instructor_comments: null,
          submitted_at: new Date().toISOString(),
          submission_ip: '127.0.0.1',
          submission_device_info: 'System Import',
          assessment_duration_seconds: isPass ? 1800 : 0,
          time_started: new Date(Date.now() - 1800000).toISOString(),
          time_completed: isPass ? new Date().toISOString() : null,
          assessment_notes: null,
          retake_count: 0,
          is_retake: false,
          previous_assessment_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: profiles?.[0]?.id || uuidv4(),
          updated_by: profiles?.[0]?.id || uuidv4(),
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null
        };
        
        checklistResults.push(checklistResult);
        console.log(`   ✅ Created ${checklistType}: ${result}`);
      });
    }
    
    console.log(`\n📊 Total checklist results to insert: ${checklistResults.length}`);
    
    if (checklistResults.length > 0) {
      // Insert all checklist results
      console.log('\n💾 Inserting checklist results...');
      const { error: insertError } = await supabase
        .from('checklist_result')
        .insert(checklistResults);
      
      if (insertError) {
        console.error('❌ Error inserting checklist results:', insertError);
        return;
      }
      
      console.log('✅ Successfully inserted all missing participant data!');
    }
    
    // Final verification
    console.log('\n🔍 Final verification...');
    const { data: finalResults, error: finalError } = await supabase
      .from('checklist_result')
      .select('participant_name')
      .eq('is_deleted', false);
    
    if (finalError) {
      console.error('❌ Error verifying results:', finalError);
      return;
    }
    
    const uniqueParticipants = [...new Set(finalResults?.map(r => r.participant_name) || [])];
    console.log(`✅ Total participants in checklist results: ${uniqueParticipants.length}`);
    
    // Check if we now have 56 participants
    if (uniqueParticipants.length >= 56) {
      console.log('🎉 Success! We now have 56+ participants in checklist results.');
    } else {
      console.log(`⚠️  Still missing ${56 - uniqueParticipants.length} participants.`);
    }
    
    console.log('\n📋 All participants in checklist results:');
    uniqueParticipants.sort().forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addMissingOriginalParticipants();



