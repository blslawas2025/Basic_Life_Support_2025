#!/usr/bin/env node

// Supabase Category Fix Script
// This script connects to your Supabase database and fixes all category mismatches

const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY3ODkyOSwiZXhwIjoyMDczMjU0OTI5fQ.YS3fbDXijyRShozK8VgLlIlFf5hadyEHAkHXcj2CK-Q';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCategories() {
    console.log('🔧 Starting category fix process...\n');

    try {
        // Step 1: Check current state
        console.log('📊 Checking current category distribution...');
        const { data: currentProfiles, error: profileError } = await supabase
            .from('profiles')
            .select('category')
            .not('category', 'is', null);

        if (profileError) {
            console.error('❌ Error fetching profiles:', profileError);
            return;
        }

        const currentDistribution = currentProfiles.reduce((acc, profile) => {
            acc[profile.category] = (acc[profile.category] || 0) + 1;
            return acc;
        }, {});

        console.log('Current distribution:', currentDistribution);

        // Step 2: Fix Non-Clinical positions that are incorrectly marked as Clinical
        console.log('\n🔨 Fixing Non-Clinical positions incorrectly marked as Clinical...');
        
        const { error: nonClinicalError } = await supabase.rpc('execute_sql', {
            sql: `
                UPDATE profiles 
                SET 
                    category = 'Non-Clinical',
                    updated_at = NOW()
                WHERE category = 'Clinical'
                  AND (
                    job_position_name ILIKE '%FARMASI%' OR
                    job_position_name ILIKE '%JURUTEKNOLOGI%' OR
                    job_position_name ILIKE '%JURUPULIH%' OR
                    job_position_name ILIKE '%PENOLONG PEGAWAI TADBIR%' OR
                    job_position_name ILIKE '%PEMBANTU KHIDMAT%' OR
                    job_position_name ILIKE '%PEGAWAI TADBIR%' OR
                    job_position_name ILIKE '%PEGAWAI KHIDMAT%' OR
                    job_position_name ILIKE '%PEGAWAI TEKNIKAL%' OR
                    job_position_name ILIKE '%PEGAWAI PENYELIDIKAN%' OR
                    job_position_name ILIKE '%PEGAWAI MAKMAL%' OR
                    job_position_name ILIKE '%JURU X-RAY%' OR
                    job_position_name ILIKE '%JURU RADIOLOGI%'
                  );
            `
        });

        if (nonClinicalError) {
            console.log('⚠️  Using alternative method for Non-Clinical fixes...');
            
            // Alternative approach: Get profiles and update individually
            const { data: nonClinicalProfiles, error: fetchError } = await supabase
                .from('profiles')
                .select('id, job_position_name')
                .eq('category', 'Clinical')
                .or('job_position_name.ilike.%FARMASI%,job_position_name.ilike.%JURUTEKNOLOGI%,job_position_name.ilike.%JURUPULIH%,job_position_name.ilike.%PENOLONG PEGAWAI TADBIR%,job_position_name.ilike.%PEMBANTU KHIDMAT%');

            if (fetchError) {
                console.error('❌ Error fetching non-clinical profiles:', fetchError);
            } else if (nonClinicalProfiles && nonClinicalProfiles.length > 0) {
                console.log(`Found ${nonClinicalProfiles.length} non-clinical profiles to fix`);
                
                // Update each profile individually
                for (const profile of nonClinicalProfiles) {
                    const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ 
                            category: 'Non-Clinical',
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', profile.id);
                    
                    if (updateError) {
                        console.error(`❌ Error updating profile ${profile.id}:`, updateError);
                    }
                }
            }
        }

        // Step 3: Ensure all Clinical positions are correctly marked
        console.log('\n🔨 Ensuring Clinical positions are correctly marked...');
        
        const { data: clinicalProfiles, error: clinicalFetchError } = await supabase
            .from('profiles')
            .select('id, job_position_name')
            .or('job_position_name.ilike.%JURURAWAT%,job_position_name.ilike.%PEGAWAI PERGIGIAN%,job_position_name.ilike.%PEGAWAI PERUBATAN%,job_position_name.ilike.%PENOLONG PEGAWAI PERUBATAN%,job_position_name.ilike.%PEMBANTU PERAWATAN%')
            .neq('category', 'Clinical');

        if (clinicalFetchError) {
            console.error('❌ Error fetching clinical profiles:', clinicalFetchError);
        } else if (clinicalProfiles && clinicalProfiles.length > 0) {
            console.log(`Found ${clinicalProfiles.length} clinical profiles to fix`);
            
            for (const profile of clinicalProfiles) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ 
                        category: 'Clinical',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', profile.id);
                
                if (updateError) {
                    console.error(`❌ Error updating profile ${profile.id}:`, updateError);
                }
            }
        }

        // Step 4: Update jobs table
        console.log('\n🔨 Updating jobs table...');
        
        // Update Non-Clinical jobs
        const { data: nonClinicalJobs, error: nonClinicalJobsError } = await supabase
            .from('jobs')
            .select('id, job_position')
            .eq('category', 'Clinical')
            .or('job_position.ilike.%PEGAWAI FARMASI%,job_position.ilike.%JURUTEKNOLOGI%,job_position.ilike.%JURUPULIH%,job_position.ilike.%PENOLONG PEGAWAI TADBIR%,job_position.ilike.%PEMBANTU KHIDMAT%');

        if (!nonClinicalJobsError && nonClinicalJobs && nonClinicalJobs.length > 0) {
            for (const job of nonClinicalJobs) {
                await supabase
                    .from('jobs')
                    .update({ 
                        category: 'Non-Clinical',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', job.id);
            }
        }

        // Update Clinical jobs
        const { data: clinicalJobs, error: clinicalJobsError } = await supabase
            .from('jobs')
            .select('id, job_position')
            .neq('category', 'Clinical')
            .or('job_position.ilike.%JURURAWAT%,job_position.ilike.%PEGAWAI PERGIGIAN%,job_position.ilike.%PEGAWAI PERUBATAN%,job_position.ilike.%PENOLONG PEGAWAI PERUBATAN%,job_position.ilike.%PEMBANTU PERAWATAN%');

        if (!clinicalJobsError && clinicalJobs && clinicalJobs.length > 0) {
            for (const job of clinicalJobs) {
                await supabase
                    .from('jobs')
                    .update({ 
                        category: 'Clinical',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', job.id);
            }
        }

        // Step 5: Show final results
        console.log('\n📊 Final category distribution:');
        const { data: finalProfiles, error: finalError } = await supabase
            .from('profiles')
            .select('category')
            .not('category', 'is', null);

        if (!finalError && finalProfiles) {
            const finalDistribution = finalProfiles.reduce((acc, profile) => {
                acc[profile.category] = (acc[profile.category] || 0) + 1;
                return acc;
            }, {});

            console.log('Final distribution:', finalDistribution);
        }

        // Step 6: Show some examples of fixed profiles
        console.log('\n✅ Sample of fixed profiles:');
        const { data: sampleProfiles, error: sampleError } = await supabase
            .from('profiles')
            .select('name, job_position_name, category')
            .in('job_position_name', ['PEGAWAI FARMASI UF 9', 'JURURAWAT U5', 'JURUTEKNOLOGI MAKMAL PERUBATAN U6'])
            .limit(5);

        if (!sampleError && sampleProfiles) {
            sampleProfiles.forEach(profile => {
                console.log(`- ${profile.name}: ${profile.job_position_name} → ${profile.category}`);
            });
        }

        console.log('\n🎉 Category fix completed successfully!');
        console.log('All Non-Clinical positions should now be correctly categorized.');
        console.log('All Clinical positions should now be correctly categorized.');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run the fix
fixCategories().then(() => {
    console.log('\n✨ Script execution completed.');
    process.exit(0);
}).catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
