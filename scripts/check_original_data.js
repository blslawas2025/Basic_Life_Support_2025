// Original participant data provided by user
const originalParticipantData = [
  { name: "SA'DI BIN USOP", results: ["FAIL", "FAIL", "PASS", "PASS", "FAIL"] },
  { name: "RAJAMI BIN ABDUL HASHIM", results: ["FAIL", "FAIL", "PASS", "PASS", "FAIL"] },
  { name: "NURMASLIANA BINTI ISMAIL", results: ["PASS", "PASS", "PASS", "PASS", "FAIL"] },
  { name: "NURIZANIE BINTI SANEH", results: ["PASS", "PASS", "PASS", "PASS", "FAIL"] },
  { name: "NOR BAIZURAH BINTI MASLIM", results: ["FAIL", "FAIL", "PASS", "PASS", "FAIL"] },
  { name: "MANSUR BIN MURNI", results: ["FAIL", "FAIL", "PASS", "PASS", "FAIL"] },
  { name: "MARZUKI RAJANG", results: ["FAIL", "FAIL", "PASS", "PASS", "FAIL"] },
  { name: "GRACE RURAN NGILO", results: ["FAIL", "FAIL", "PASS", "PASS", "FAIL"] },
  { name: "FIZRA IVY WAS", results: ["PASS", "PASS", "PASS", "PASS", "FAIL"] }
];

const assessmentTypes = ["one man cpr", "two man cpr", "infant cpr", "infant choking", "adult choking"];

console.log('🔍 Analyzing original data vs current database data...');
console.log('\n📊 Original Data Analysis:');

originalParticipantData.forEach(participant => {
  console.log(`\n--- ${participant.name} ---`);
  participant.results.forEach((result, index) => {
    console.log(`  ${assessmentTypes[index]}: ${result}`);
  });
});

console.log('\n🔍 Issue Analysis:');
console.log('The problem is that the import script created INCOMPLETE entries for some assessments');
console.log('instead of using the FAIL status from the original data.');
console.log('\nExpected behavior:');
console.log('- FAIL results should show as "FAIL" status');
console.log('- PASS results should show as "PASS" status');
console.log('- INCOMPLETE should only be used for truly incomplete assessments (0% completion)');
console.log('\nCurrent behavior:');
console.log('- Some FAIL results are showing as INCOMPLETE with 0% completion');
console.log('- This is incorrect data mapping during import');

console.log('\n💡 Solution needed:');
console.log('1. Update the import script to correctly map FAIL results');
console.log('2. Or update the existing data to fix the incorrect INCOMPLETE entries');
console.log('3. FAIL results should have completion_percentage > 0 but status = FAIL');



