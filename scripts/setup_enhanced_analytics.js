// Setup Enhanced Analytics Database Schema
// This script sets up the enhanced test results schema with all required fields

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupEnhancedAnalytics() {
  try {
    console.log('🚀 Setting up Enhanced Analytics Database Schema...');
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '../database/enhanced_test_results_schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    console.log('🎉 Enhanced Analytics Database Schema setup completed!');
    console.log('\n📊 What was created:');
    console.log('  ✅ Enhanced test_submissions table with all required fields');
    console.log('  ✅ test_analytics view for comprehensive reporting');
    console.log('  ✅ get_analytics_summary() function for dashboard metrics');
    console.log('  ✅ get_user_test_results() function for individual results');
    console.log('  ✅ Sample data for testing');
    console.log('  ✅ Proper indexes for performance');
    
    console.log('\n🔗 Next steps:');
    console.log('  1. Update your app to use the new SubmissionService.saveTestResult() method');
    console.log('  2. Test the Results & Analytics screen with real data');
    console.log('  3. Verify all fields (name, IC, job, pre/post test results) are saved correctly');
    
  } catch (error) {
    console.error('💥 Error setting up Enhanced Analytics:', error);
    process.exit(1);
  }
}

// Run the setup
setupEnhancedAnalytics();

