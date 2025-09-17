const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPaymentStatus() {
  try {
    console.log('🔍 Checking payment_status values in profiles table...');
    
    // Get sample profiles to see valid payment statuses
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('payment_status, name')
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }
    
    console.log('📊 Sample payment_status from existing profiles:');
    const uniqueStatuses = new Set();
    profiles?.forEach(profile => {
      console.log(`   ${profile.name}: ${profile.payment_status}`);
      uniqueStatuses.add(profile.payment_status);
    });
    
    console.log('\n💡 Unique payment statuses found:', Array.from(uniqueStatuses));
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPaymentStatus();


