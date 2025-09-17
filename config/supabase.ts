import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Update these values with your actual Supabase project details

export const supabaseConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uiluvmelzycqplzqovdj.supabase.co',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE',
};

// Create and export the Supabase client
export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

// Instructions for setup:
// 1. Go to your Supabase project dashboard
// 2. Navigate to Settings > API
// 3. Copy your Project URL and anon/public key
// 4. Create a .env file in your project root with:
//    EXPO_PUBLIC_SUPABASE_URL=your_project_url
//    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
// 5. Or replace the values directly in this file
