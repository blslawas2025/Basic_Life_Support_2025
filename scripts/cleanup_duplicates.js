// Clean up duplicate test submissions
// Keep only the latest entry for each participant and test type combination

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
  try {
    console.log('🧹 Starting cleanup of duplicate test submissions...');
    
    // Get all test submissions
    const { data: submissions, error } = await supabase
      .from('test_submissions')
      .select('id, user_email, test_type, score, total_questions, submitted_at')
      .eq('is_completed', true)
      .order('submitted_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching submissions:', error);
      return;
    }
    
    console.log(`📊 Total submissions found: ${submissions?.length || 0}`);
    
    // Group by email and test type, keep only the latest (first in the sorted list)
    const emailTestMap = new Map();
    const toKeep = [];
    const toDelete = [];
    
    submissions?.forEach(submission => {
      const key = `${submission.user_email}_${submission.test_type}`;
      if (emailTestMap.has(key)) {
        // This is a duplicate, mark for deletion
        toDelete.push(submission.id);
        console.log(`🗑️  Marking for deletion: ${submission.user_email} (${submission.test_type}) - ID: ${submission.id}`);
      } else {
        // This is the first (latest) entry, keep it
        emailTestMap.set(key, submission);
        toKeep.push(submission.id);
      }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Entries to keep: ${toKeep.length}`);
    console.log(`🗑️  Entries to delete: ${toDelete.length}`);
    
    // Delete duplicates in batches
    if (toDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${toDelete.length} duplicate entries...`);
      
      const batchSize = 50;
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = toDelete.slice(i, i + batchSize);
        
        const { error: deleteError } = await supabase
          .from('test_submissions')
          .delete()
          .in('id', batch);
        
        if (deleteError) {
          console.error(`❌ Error deleting batch ${Math.floor(i/batchSize) + 1}:`, deleteError);
        } else {
          console.log(`✅ Deleted batch ${Math.floor(i/batchSize) + 1} (${batch.length} entries)`);
        }
      }
    }
    
    // Verify final results
    console.log('\n📊 Verifying final results...');
    const { data: finalSubmissions, error: finalError } = await supabase
      .from('test_submissions')
      .select('id, user_email, test_type, score, total_questions')
      .eq('is_completed', true)
      .order('submitted_at', { ascending: false });
    
    if (finalError) {
      console.error('❌ Error verifying final results:', finalError);
    } else {
      const preTestCount = finalSubmissions?.filter(s => s.test_type === 'pre_test').length || 0;
      const postTestCount = finalSubmissions?.filter(s => s.test_type === 'post_test').length || 0;
      const uniqueEmails = new Set(finalSubmissions?.map(s => s.user_email) || []);
      
      console.log(`✅ Final results:`);
      console.log(`📊 Total submissions: ${finalSubmissions?.length || 0}`);
      console.log(`📊 Pre-test submissions: ${preTestCount}`);
      console.log(`📊 Post-test submissions: ${postTestCount}`);
      console.log(`👥 Unique participants: ${uniqueEmails.size}`);
      
      if (finalSubmissions?.length === 110 && preTestCount === 55 && postTestCount === 55) {
        console.log('\n🎉 SUCCESS! Database is now clean with exactly 110 certificates (55 pre-test + 55 post-test)');
      } else {
        console.log('\n⚠️  WARNING: Expected 110 total submissions (55 pre-test + 55 post-test)');
      }
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

cleanupDuplicates();
