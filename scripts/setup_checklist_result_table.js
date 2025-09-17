const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function setupChecklistResultTable() {
  try {
    console.log('🚀 Setting up checklist_result table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'create_checklist_result_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 SQL file loaded successfully');
    console.log('📊 Executing SQL migration...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }
    
    console.log('✅ checklist_result table created successfully!');
    console.log('📋 Table includes:');
    console.log('   - Participant information storage');
    console.log('   - Assessment results tracking');
    console.log('   - Compulsory sections validation');
    console.log('   - Instructor comments');
    console.log('   - Retake tracking');
    console.log('   - Statistics views');
    console.log('   - Data validation triggers');
    
    // Test the table by checking if it exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('checklist_result')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error verifying table:', tableError);
      return;
    }
    
    console.log('✅ Table verification successful!');
    console.log('🎉 Checklist result system is ready to use!');
    
  } catch (error) {
    console.error('❌ Error setting up checklist_result table:', error);
    console.error('Please check your Supabase connection and permissions');
  }
}

// Run the setup
setupChecklistResultTable();
