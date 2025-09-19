// Simple script to add a test participant
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestParticipant() {
  try {
    const testParticipant = {
      email: 'test.participant@example.com',
      name: 'Test Participant',
      phone_number: '+60123456789',
      ic_number: '900101-01-0001',
      job_position_name: 'Jururawat U5',
      category: 'Clinical',
      tempat_bertugas: 'Hospital Test',
      last_bls_attempt: '2024-01-15',
      has_asthma: false,
      has_allergies: true,
      allergies_description: 'Peanuts',
      is_pregnant: false,
      user_type: 'participant',
      roles: 'user',
      status: 'approved',
      payment_status: 'paid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert([testParticipant])
      .select();

    if (error) {
      console.error('Error adding test participant:', error);
    } else {
      console.log('Test participant added successfully:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

addTestParticipant();
