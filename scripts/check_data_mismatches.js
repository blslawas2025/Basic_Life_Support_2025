// Check data mismatches using existing services
const { ComprehensiveResultsService } = require('../services/ComprehensiveResultsService.ts');

async function checkDataMismatches() {
  console.log('🔍 Checking data mismatches...\n');

  try {
    // Get all comprehensive results
    const results = await ComprehensiveResultsService.getAllComprehensiveResults();
    
    console.log(`✅ Found ${results.length} comprehensive results\n`);

    // Check for category distribution
    const categoryStats = {
      Clinical: 0,
      'Non-Clinical': 0,
      Other: 0
    };

    results.forEach(result => {
      const category = result.participant_category;
      if (category === 'Clinical') {
        categoryStats.Clinical++;
      } else if (category === 'Non-Clinical') {
        categoryStats['Non-Clinical']++;
      } else {
        categoryStats.Other++;
      }
    });

    console.log('📊 CATEGORY DISTRIBUTION:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

    // Find ALVIN DULAMIT
    const alvinResult = results.find(r => 
      r.participant_name.toLowerCase().includes('alvin') && 
      r.participant_name.toLowerCase().includes('dulamit')
    );

    if (alvinResult) {
      console.log('\n🔍 ALVIN DULAMIT DATA:');
      console.log(`  Name: ${alvinResult.participant_name}`);
      console.log(`  IC: ${alvinResult.participant_ic_number}`);
      console.log(`  Category: ${alvinResult.participant_category}`);
      console.log(`  Job Position: ${alvinResult.participant_job_position}`);
      console.log(`  Pre Test: ${alvinResult.pre_test.status} (${alvinResult.pre_test.score}/${alvinResult.pre_test.total_questions})`);
      console.log(`  Post Test: ${alvinResult.post_test.status} (${alvinResult.post_test.score}/${alvinResult.post_test.total_questions})`);
    } else {
      console.log('\n❌ ALVIN DULAMIT not found');
    }

    // Check for any participants with unusual categories
    const unusualCategories = results.filter(r => 
      r.participant_category !== 'Clinical' && 
      r.participant_category !== 'Non-Clinical'
    );

    if (unusualCategories.length > 0) {
      console.log(`\n🚨 Found ${unusualCategories.length} participants with unusual categories:`);
      unusualCategories.forEach(participant => {
        console.log(`  ${participant.participant_name}: ${participant.participant_category}`);
      });
    }

    console.log('\n✅ Data check completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDataMismatches();
