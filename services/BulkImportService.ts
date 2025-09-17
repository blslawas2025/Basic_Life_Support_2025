import { supabase } from './supabase';
import { SubmissionService } from './SubmissionService';

export interface ImportTestResult {
  email: string;
  name: string;
  ic: string;
  preTest: number;
  postTest: number;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  matchedProfiles: number;
  importedResults: number;
  errors: string[];
  unmatchedEmails: string[];
}

export class BulkImportService {
  static async importTestResults(data: ImportTestResult[]): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      totalRows: data.length,
      matchedProfiles: 0,
      importedResults: 0,
      errors: [],
      unmatchedEmails: []
    };

    try {
      // Get all profiles from Supabase
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name, ic_number, job_position_name, job_position_id')
        .eq('user_type', 'participant')
        .eq('status', 'approved');

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      // Create lookup maps
      const emailMap = new Map<string, any>();
      profiles?.forEach(profile => {
        if (profile.email) {
          emailMap.set(profile.email.toLowerCase(), profile);
        }
      });

      // Process each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 1;

        try {
          // Validate row data
          if (!row.email || !row.name || !row.ic) {
            result.errors.push(`Row ${rowNumber}: Missing required fields`);
            continue;
          }

          if (isNaN(row.preTest) || isNaN(row.postTest)) {
            result.errors.push(`Row ${rowNumber}: Invalid test scores`);
            continue;
          }

          // Match profile by email
          const matchedProfile = emailMap.get(row.email.toLowerCase());
          
          if (matchedProfile) {
            result.matchedProfiles++;

            // Import pre-test result if provided
            if (row.preTest > 0) {
              await SubmissionService.saveTestResult(
                matchedProfile.id,
                'pre_test',
                row.preTest,
                30,
                row.preTest,
                0,
                undefined
              );
              result.importedResults++;
            }

            // Import post-test result if provided
            if (row.postTest > 0) {
              await SubmissionService.saveTestResult(
                matchedProfile.id,
                'post_test',
                row.postTest,
                30,
                row.postTest,
                0,
                undefined
              );
              result.importedResults++;
            }
          } else {
            result.unmatchedEmails.push(`${row.email} (${row.name})`);
          }

        } catch (error) {
          result.errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      result.success = result.errors.length === 0;

    } catch (error) {
      result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  static parseCSVData(csvContent: string): ImportTestResult[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const results: ImportTestResult[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
      
      if (columns.length >= 5) {
        const [email, name, ic, preTestStr, postTestStr] = columns;
        
        const preTest = parseInt(preTestStr) || 0;
        const postTest = parseInt(postTestStr) || 0;

        if (email && name && ic && (preTest > 0 || postTest > 0)) {
          results.push({
            email: email.trim(),
            name: name.trim(),
            ic: ic.trim(),
            preTest,
            postTest
          });
        }
      }
    }

    return results;
  }
}