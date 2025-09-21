// Comprehensive Supabase Data Audit Script
// This script will check ALL tables for data inconsistencies and anomalies

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY3ODkyOSwiZXhwIjoyMDczMjU0OTI5fQ.YS3fbDXijyRShozK8VgLlIlFf5hadyEHAkHXcj2CK-Q';

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80));
}

function logError(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Main audit function
async function comprehensiveAudit() {
  try {
    logSection('COMPREHENSIVE SUPABASE DATA AUDIT');
    log('Starting comprehensive data audit of all Supabase tables...', 'white');
    
    // Test connection
    logSection('CONNECTION TEST');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError) {
      logError(`Authentication failed: ${authError.message}`);
      return;
    }
    logSuccess('Connected to Supabase with admin privileges successfully');

    // Get all tables
    logSection('DISCOVERING TABLES');
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      logError(`Failed to get tables: ${tablesError.message}`);
      return;
    }

    const tableNames = tables.map(t => t.table_name);
    logInfo(`Found ${tableNames.length} tables: ${tableNames.join(', ')}`);

    // Audit each table
    for (const tableName of tableNames) {
      await auditTable(tableName);
    }

    // Cross-table relationship checks
    await crossTableAudit(tableNames);

    // Summary
    logSection('AUDIT SUMMARY');
    logSuccess('Comprehensive audit completed!');
    
  } catch (error) {
    logError(`Audit failed: ${error.message}`);
    console.error(error);
  }
}

// Audit individual table
async function auditTable(tableName) {
  logSection(`AUDITING TABLE: ${tableName.toUpperCase()}`);
  
  try {
    // Get table structure
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (columnsError) {
      logError(`Failed to get columns for ${tableName}: ${columnsError.message}`);
      return;
    }

    logInfo(`Table structure: ${columns.length} columns`);
    columns.forEach(col => {
      log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(NULLABLE)'}`, 'white');
    });

    // Get row count
    const { count, error: countError } = await supabaseAdmin
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      logError(`Failed to get row count for ${tableName}: ${countError.message}`);
      return;
    }

    logInfo(`Total rows: ${count}`);

    if (count === 0) {
      logWarning(`Table ${tableName} is empty`);
      return;
    }

    // Get sample data
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .limit(5);

    if (sampleError) {
      logError(`Failed to get sample data for ${tableName}: ${sampleError.message}`);
      return;
    }

    logInfo('Sample data:');
    console.table(sampleData);

    // Check for common data issues
    await checkDataQuality(tableName, columns);

  } catch (error) {
    logError(`Error auditing table ${tableName}: ${error.message}`);
  }
}

// Check data quality issues
async function checkDataQuality(tableName, columns) {
  logInfo('Checking data quality...');

  // Check for NULL values in important columns
  for (const column of columns) {
    if (column.is_nullable === 'YES') {
      const { count, error } = await supabaseAdmin
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .is(column.column_name, null);

      if (!error && count > 0) {
        logWarning(`${count} NULL values found in ${column.column_name}`);
      }
    }
  }

  // Check for duplicate values in unique columns
  const uniqueColumns = columns.filter(col => 
    col.column_name.includes('id') || 
    col.column_name.includes('email') || 
    col.column_name.includes('name')
  );

  for (const column of uniqueColumns) {
    const { data: duplicates, error } = await supabaseAdmin
      .from(tableName)
      .select(column.column_name)
      .not(column.column_name, 'is', null);

    if (!error && duplicates) {
      const valueCounts = {};
      duplicates.forEach(row => {
        const value = row[column.column_name];
        valueCounts[value] = (valueCounts[value] || 0) + 1;
      });

      const duplicateValues = Object.entries(valueCounts)
        .filter(([value, count]) => count > 1)
        .map(([value, count]) => `${value} (${count} times)`);

      if (duplicateValues.length > 0) {
        logWarning(`Duplicate values in ${column.column_name}: ${duplicateValues.join(', ')}`);
      }
    }
  }

  // Check for data type inconsistencies
  for (const column of columns) {
    if (column.data_type === 'character varying' || column.data_type === 'text') {
      const { data: data, error } = await supabaseAdmin
        .from(tableName)
        .select(column.column_name)
        .not(column.column_name, 'is', null)
        .limit(100);

      if (!error && data) {
        const invalidValues = data.filter(row => {
          const value = row[column.column_name];
          if (typeof value !== 'string') return true;
          if (value.trim() === '') return true;
          return false;
        });

        if (invalidValues.length > 0) {
          logWarning(`${invalidValues.length} invalid string values in ${column.column_name}`);
        }
      }
    }
  }
}

// Cross-table relationship checks
async function crossTableAudit(tableNames) {
  logSection('CROSS-TABLE RELATIONSHIP AUDIT');

  // Check foreign key relationships
  const { data: foreignKeys, error: fkError } = await supabaseAdmin
    .from('information_schema.key_column_usage')
    .select('table_name, column_name, referenced_table_name, referenced_column_name')
    .not('referenced_table_name', 'is', null)
    .eq('table_schema', 'public');

  if (fkError) {
    logError(`Failed to get foreign key information: ${fkError.message}`);
    return;
  }

  if (foreignKeys && foreignKeys.length > 0) {
    logInfo('Found foreign key relationships:');
    foreignKeys.forEach(fk => {
      log(`  ${fk.table_name}.${fk.column_name} -> ${fk.referenced_table_name}.${fk.referenced_column_name}`, 'white');
    });

    // Check for orphaned records
    for (const fk of foreignKeys) {
      await checkOrphanedRecords(fk);
    }
  } else {
    logInfo('No foreign key relationships found');
  }

  // Check for data consistency between related tables
  if (tableNames.includes('profiles') && tableNames.includes('test_submissions')) {
    await checkProfilesTestSubmissionsConsistency();
  }

  if (tableNames.includes('jobs') && tableNames.includes('profiles')) {
    await checkJobsProfilesConsistency();
  }
}

// Check for orphaned records
async function checkOrphanedRecords(fk) {
  try {
    const { data: orphaned, error } = await supabaseAdmin
      .from(fk.table_name)
      .select(fk.column_name)
      .not(fk.column_name, 'is', null);

    if (error || !orphaned) return;

    const referencedValues = orphaned.map(row => row[fk.column_name]);
    const uniqueValues = [...new Set(referencedValues)];

    for (const value of uniqueValues) {
      const { data: exists, error: checkError } = await supabaseAdmin
        .from(fk.referenced_table_name)
        .select(fk.referenced_column_name)
        .eq(fk.referenced_column_name, value)
        .limit(1);

      if (checkError) {
        logError(`Error checking orphaned records: ${checkError.message}`);
        continue;
      }

      if (!exists || exists.length === 0) {
        logWarning(`Orphaned record: ${fk.table_name}.${fk.column_name} = ${value} (not found in ${fk.referenced_table_name})`);
      }
    }
  } catch (error) {
    logError(`Error checking orphaned records for ${fk.table_name}.${fk.column_name}: ${error.message}`);
  }
}

// Check consistency between profiles and test_submissions
async function checkProfilesTestSubmissionsConsistency() {
  logInfo('Checking profiles vs test_submissions consistency...');

  try {
    // Check for category mismatches
    const { data: mismatches, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        name,
        category,
        test_submissions!inner(
          job_category,
          test_type
        )
      `)
      .not('category', 'is', null)
      .not('test_submissions.job_category', 'is', null);

    if (error) {
      logError(`Error checking category mismatches: ${error.message}`);
      return;
    }

    if (mismatches) {
      const categoryMismatches = mismatches.filter(profile => 
        profile.category !== profile.test_submissions.job_category
      );

      if (categoryMismatches.length > 0) {
        logWarning(`${categoryMismatches.length} category mismatches found between profiles and test_submissions`);
        categoryMismatches.forEach(mismatch => {
          log(`  ${mismatch.name}: profile.category=${mismatch.category}, test_submission.job_category=${mismatch.test_submissions.job_category}`, 'yellow');
        });
      } else {
        logSuccess('No category mismatches found between profiles and test_submissions');
      }
    }
  } catch (error) {
    logError(`Error in profiles vs test_submissions check: ${error.message}`);
  }
}

// Check consistency between jobs and profiles
async function checkJobsProfilesConsistency() {
  logInfo('Checking jobs vs profiles consistency...');

  try {
    // Check for job position name mismatches
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('job_position_name, job_position_id')
      .not('job_position_name', 'is', null);

    if (profilesError) {
      logError(`Error getting profiles: ${profilesError.message}`);
      return;
    }

    if (profiles) {
      const { data: jobs, error: jobsError } = await supabaseAdmin
        .from('jobs')
        .select('id, name');

      if (jobsError) {
        logError(`Error getting jobs: ${jobsError.message}`);
        return;
      }

      if (jobs) {
        const jobNames = new Set(jobs.map(job => job.name));
        const jobIds = new Set(jobs.map(job => job.id));

        const invalidJobNames = profiles.filter(profile => 
          profile.job_position_name && !jobNames.has(profile.job_position_name)
        );

        const invalidJobIds = profiles.filter(profile => 
          profile.job_position_id && !jobIds.has(profile.job_position_id)
        );

        if (invalidJobNames.length > 0) {
          logWarning(`${invalidJobNames.length} profiles have invalid job position names`);
          invalidJobNames.forEach(profile => {
            log(`  Invalid job name: "${profile.job_position_name}"`, 'yellow');
          });
        }

        if (invalidJobIds.length > 0) {
          logWarning(`${invalidJobIds.length} profiles have invalid job position IDs`);
          invalidJobIds.forEach(profile => {
            log(`  Invalid job ID: "${profile.job_position_id}"`, 'yellow');
          });
        }

        if (invalidJobNames.length === 0 && invalidJobIds.length === 0) {
          logSuccess('All job references in profiles are valid');
        }
      }
    }
  } catch (error) {
    logError(`Error in jobs vs profiles check: ${error.message}`);
  }
}

// Run the audit
if (require.main === module) {
  comprehensiveAudit().catch(console.error);
}

module.exports = { comprehensiveAudit };
