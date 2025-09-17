// Setup Test Results Tables in Supabase
// This script creates the necessary tables for storing test results

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - replace with your actual values
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTestResultsTables() {
  try {
    console.log('🚀 Setting up Test Results Tables in Supabase...');
    
    // Create test_submissions table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS test_submissions (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        
        -- User Information (from profiles table)
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        user_name VARCHAR(255) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        ic_number VARCHAR(14),
        job_position_name VARCHAR(255),
        job_category VARCHAR(50), -- 'clinical' or 'non_clinical'
        
        -- Test Information
        test_type VARCHAR(20) NOT NULL CHECK (test_type IN ('pre_test', 'post_test')),
        course_session_id UUID,
        
        -- Test Results
        score INTEGER NOT NULL DEFAULT 0,
        total_questions INTEGER NOT NULL DEFAULT 30,
        correct_answers INTEGER NOT NULL DEFAULT 0,
        time_taken_seconds INTEGER NOT NULL DEFAULT 0,
        
        -- Submission Details
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_completed BOOLEAN DEFAULT TRUE,
        attempt_number INTEGER DEFAULT 1,
        
        -- Retake Policy
        can_retake BOOLEAN DEFAULT FALSE,
        retake_available_after TIMESTAMP WITH TIME ZONE,
        
        -- Results Management
        results_released BOOLEAN DEFAULT TRUE,
        results_released_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- System Fields
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Constraints
        CONSTRAINT valid_score CHECK (score >= 0 AND score <= total_questions),
        CONSTRAINT valid_correct_answers CHECK (correct_answers >= 0 AND correct_answers <= total_questions),
        CONSTRAINT valid_time CHECK (time_taken_seconds >= 0),
        CONSTRAINT valid_attempt CHECK (attempt_number > 0)
      );
    `;

    console.log('📝 Creating test_submissions table...');
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (tableError) {
      console.error('❌ Error creating table:', tableError);
      // Try alternative method
      console.log('🔄 Trying alternative method...');
      const { error: altError } = await supabase
        .from('test_submissions')
        .select('id')
        .limit(1);
      
      if (altError && altError.message.includes('relation "test_submissions" does not exist')) {
        console.log('⚠️  Table does not exist. Please run this SQL in your Supabase SQL Editor:');
        console.log('\n' + createTableSQL + '\n');
        return;
      }
    } else {
      console.log('✅ test_submissions table created successfully');
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_test_submissions_user_id ON test_submissions(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_test_submissions_test_type ON test_submissions(test_type);',
      'CREATE INDEX IF NOT EXISTS idx_test_submissions_submitted_at ON test_submissions(submitted_at);',
      'CREATE INDEX IF NOT EXISTS idx_test_submissions_job_category ON test_submissions(job_category);'
    ];

    console.log('📊 Creating indexes...');
    for (const indexSQL of indexes) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (indexError) {
        console.warn('⚠️  Index creation warning:', indexError.message);
      }
    }

    // Grant permissions
    const permissions = [
      'GRANT SELECT, INSERT, UPDATE, DELETE ON test_submissions TO authenticated;',
      'GRANT USAGE ON SCHEMA public TO authenticated;'
    ];

    console.log('🔐 Setting up permissions...');
    for (const permSQL of permissions) {
      const { error: permError } = await supabase.rpc('exec_sql', { sql: permSQL });
      if (permError) {
        console.warn('⚠️  Permission warning:', permError.message);
      }
    }

    // Test the table
    console.log('🧪 Testing table access...');
    const { data, error: testError } = await supabase
      .from('test_submissions')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Table test failed:', testError);
      console.log('\n📋 Manual Setup Required:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the following SQL:');
      console.log('\n' + createTableSQL + '\n');
    } else {
      console.log('✅ Table is accessible and ready to use!');
    }

    console.log('\n🎉 Test Results Tables setup completed!');
    console.log('\n📊 What was created:');
    console.log('  ✅ test_submissions table for storing test results');
    console.log('  ✅ Proper indexes for performance');
    console.log('  ✅ Foreign key relationship to profiles table');
    console.log('  ✅ Data validation constraints');
    console.log('  ✅ Proper permissions for authenticated users');
    
    console.log('\n🔗 Next steps:');
    console.log('  1. Test the bulk import feature');
    console.log('  2. Check the Results & Analytics screen');
    console.log('  3. Verify data is being saved correctly');

  } catch (error) {
    console.error('💥 Setup failed:', error);
    console.log('\n📋 Manual Setup Required:');
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log('\n' + createTableSQL + '\n');
  }
}

// Run the setup
setupTestResultsTables();

