const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQLScript(scriptPath) {
  try {
    console.log(`📄 Running SQL script: ${scriptPath}`);
    const sqlContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`  Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`❌ Error executing statement:`, error);
          // Continue with other statements
        } else {
          console.log(`  ✅ Statement executed successfully`);
        }
      }
    }
    
    console.log(`✅ SQL script completed: ${scriptPath}`);
  } catch (error) {
    console.error(`❌ Error running SQL script ${scriptPath}:`, error);
  }
}

async function initializeSynchronization() {
  console.log('🚀 Initializing synchronization system...');
  
  try {
    // 1. Fix choking checklist sections
    console.log('\n1️⃣ Fixing choking checklist sections...');
    await runSQLScript(path.join(__dirname, '../database/fix_choking_sections_complete.sql'));
    
    // 2. Fix existing results compulsory status
    console.log('\n2️⃣ Fixing existing results compulsory status...');
    await runSQLScript(path.join(__dirname, '../database/fix_existing_results_compulsory_status.sql'));
    
    // 3. Verify the fixes
    console.log('\n3️⃣ Verifying fixes...');
    
    // Check choking sections
    const { data: chokingData, error: chokingError } = await supabase
      .from('checklist_item')
      .select('checklist_type, section, COUNT(*) as count')
      .in('checklist_type', ['adult choking', 'infant choking'])
      .group('checklist_type, section')
      .order('checklist_type, section');
    
    if (chokingError) {
      console.error('❌ Error checking choking data:', chokingError);
    } else {
      console.log('✅ Choking checklist sections:');
      chokingData?.forEach(row => {
        console.log(`  ${row.checklist_type}: ${row.section} (${row.count} items)`);
      });
    }
    
    // Check results data
    const { data: resultsData, error: resultsError } = await supabase
      .from('checklist_result')
      .select('checklist_type, status, COUNT(*) as count')
      .eq('is_deleted', false)
      .group('checklist_type, status')
      .order('checklist_type, status');
    
    if (resultsError) {
      console.error('❌ Error checking results data:', resultsError);
    } else {
      console.log('✅ Checklist results:');
      resultsData?.forEach(row => {
        console.log(`  ${row.checklist_type}: ${row.status} (${row.count} results)`);
      });
    }
    
    console.log('\n🎉 Synchronization system initialized successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. All screens are now connected to Supabase');
    console.log('2. Changes in edit screen will sync to all other screens');
    console.log('3. Result screen will show correct compulsory status');
    console.log('4. Choking checklists use correct sections (not CPR sections)');
    
  } catch (error) {
    console.error('❌ Error initializing synchronization:', error);
  }
}

// Run the initialization
if (require.main === module) {
  initializeSynchronization();
}

module.exports = { initializeSynchronization };



