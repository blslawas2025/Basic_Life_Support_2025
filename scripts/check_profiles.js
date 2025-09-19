const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  try {
    console.log('🔍 Checking existing profiles...');
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, email, user_type, status')
      .eq('user_type', 'participant')
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }
    
    console.log(`✅ Found ${profiles?.length || 0} participant profiles`);
    
    if (profiles && profiles.length > 0) {
      console.log('\n📋 Sample profiles:');
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.name} (${profile.email}) - ${profile.status}`);
      });
    }
    
    // Check total count
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('user_type', 'participant');
    
    if (countError) {
      console.error('❌ Error counting profiles:', countError);
    } else {
      console.log(`\n📊 Total participant profiles: ${count}`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkProfiles();



