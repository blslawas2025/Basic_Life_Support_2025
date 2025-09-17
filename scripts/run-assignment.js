// Quick script to assign all profiles to BLS Siri 1 2025
// Run this with: node scripts/run-assignment.js

// This is a simple example - you'll need to replace with your actual Supabase credentials
const { createClient } = require('@supabase/supabase-js');

// Replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.log('❌ Please update the Supabase credentials in this script first!');
  console.log('Edit scripts/run-assignment.js and replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAssignment() {
  try {
    console.log('🚀 Starting profile assignment to BLS Siri 1 2025...');
    
    // Get the course session ID for "BLS Siri 1 2025"
    const { data: courseSession, error: courseError } = await supabase
      .from('course_sessions')
      .select('id, full_name')
      .eq('full_name', 'BLS Siri 1 2025')
      .single();

    if (courseError) {
      console.error('❌ Error finding course session:', courseError);
      return;
    }

    if (!courseSession) {
      console.error('❌ BLS Siri 1 2025 course session not found. Please create it first.');
      return;
    }

    console.log('✅ Found course session:', courseSession.full_name, 'ID:', courseSession.id);

    // Update all profiles with user roles
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        course_session_id: courseSession.id,
        updated_at: new Date().toISOString()
      })
      .in('user_type', ['participant', 'staff', 'admin', 'super_admin'])
      .is('course_session_id', null)
      .select('id, name, user_type');

    if (error) {
      console.error('❌ Error updating profiles:', error);
      return;
    }

    console.log(`✅ Successfully assigned ${data.length} profiles to BLS Siri 1 2025`);
    
    // Show breakdown by user type
    const breakdown = data.reduce((acc, profile) => {
      acc[profile.user_type] = (acc[profile.user_type] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Breakdown by user type:');
    Object.entries(breakdown).forEach(([userType, count]) => {
      console.log(`   ${userType}: ${count}`);
    });

    console.log('\n🎉 Assignment completed successfully!');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

// Run the assignment
runAssignment();
