const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRolesConstraint() {
  try {
    console.log('🔍 Checking roles constraint in profiles table...');
    
    // Get sample profiles to see valid roles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('roles, name')
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }
    
    console.log('📊 Sample roles from existing profiles:');
    profiles?.forEach(profile => {
      console.log(`   ${profile.name}: ${JSON.stringify(profile.roles)} (type: ${typeof profile.roles})`);
    });
    
    // Try to find the constraint definition
    console.log('\n🔍 Checking for roles constraint...');
    
    // Try different role formats
    const testRoles = [
      'participant',
      ['participant'],
      '["participant"]',
      'admin',
      'instructor'
    ];
    
    console.log('\n💡 Valid roles might be one of:', testRoles);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRolesConstraint();



