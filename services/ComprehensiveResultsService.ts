// Comprehensive Results Service
// This service combines test submissions and checklist results into a unified view

import { supabase } from './supabase';
import { SubmissionService, TestSubmission } from './SubmissionService';
import { ChecklistResultService, ChecklistResultSummary } from './ChecklistResultService';

export interface ComprehensiveResult {
  participant_id: string;
  participant_name: string;
  participant_ic_number: string;
  participant_job_position: string;
  participant_category: string;
  pre_test: {
    score: number | null;
    total_questions: number | null;
    percentage: number | null;
    status: 'PASS' | 'FAIL' | 'NOT_TAKEN';
    submitted_at: string | null;
  };
  post_test: {
    score: number | null;
    total_questions: number | null;
    percentage: number | null;
    status: 'PASS' | 'FAIL' | 'NOT_TAKEN';
    submitted_at: string | null;
  };
  one_man_cpr: {
    status: 'PASS' | 'FAIL' | 'INCOMPLETE' | 'NOT_TAKEN';
    completion_percentage: number;
    submitted_at: string | null;
  };
  two_man_cpr: {
    status: 'PASS' | 'FAIL' | 'INCOMPLETE' | 'NOT_TAKEN';
    completion_percentage: number;
    submitted_at: string | null;
  };
  infant_cpr: {
    status: 'PASS' | 'FAIL' | 'INCOMPLETE' | 'NOT_TAKEN';
    completion_percentage: number;
    submitted_at: string | null;
  };
  infant_choking: {
    status: 'PASS' | 'FAIL' | 'INCOMPLETE' | 'NOT_TAKEN';
    completion_percentage: number;
    submitted_at: string | null;
  };
  adult_choking: {
    status: 'PASS' | 'FAIL' | 'INCOMPLETE' | 'NOT_TAKEN';
    completion_percentage: number;
    submitted_at: string | null;
  };
  remedial: {
    status: 'ALLOWED' | 'NOT_ALLOWED';
    reason: string;
  };
  certified: {
    status: 'CERTIFIED' | 'NOT_CERTIFIED';
    reason: string;
  };
}

export class ComprehensiveResultsService {
  // Real-time subscription for data changes
  static subscribeToChanges(callback: (results: ComprehensiveResult[]) => void) {
    console.log('🔄 Setting up real-time subscription for comprehensive results...');
    
    // Subscribe to test_submissions changes
    const testSubmissionsSubscription = supabase
      .channel('test_submissions_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'test_submissions' 
        }, 
        async () => {
          console.log('📊 Test submissions changed - refreshing data');
          const results = await this.getAllComprehensiveResults();
          callback(results);
        }
      )
      .subscribe();

    // Subscribe to checklist_result changes
    const checklistResultSubscription = supabase
      .channel('checklist_result_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'checklist_result' 
        }, 
        async () => {
          console.log('📊 Checklist results changed - refreshing data');
          const results = await this.getAllComprehensiveResults();
          callback(results);
        }
      )
      .subscribe();

    // Subscribe to profiles changes
    const profilesSubscription = supabase
      .channel('profiles_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        }, 
        async () => {
          console.log('📊 Profiles changed - refreshing data');
          const results = await this.getAllComprehensiveResults();
          callback(results);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      console.log('🔄 Unsubscribing from real-time updates');
      testSubmissionsSubscription.unsubscribe();
      checklistResultSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
    };
  }

  // Get all comprehensive results directly from test_submissions and checklist_result tables
  static async getAllComprehensiveResults(): Promise<ComprehensiveResult[]> {
    try {
      console.log('🔄 Fetching comprehensive results directly from source tables...');
      
      // Fetch participants first
      const { data: participants, error: participantsError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          ic_number,
          job_position_name,
          user_type,
          status,
          roles
        `)
        .eq('user_type', 'participant')
        .eq('status', 'approved')
        .eq('roles', 'user');

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw participantsError;
      }

      if (!participants || participants.length === 0) {
        console.log('No participants found');
        return [];
      }

      const participantIds = participants.map(p => p.id);

      // Fetch test submissions for these participants
      const { data: testSubmissions, error: testError } = await supabase
        .from('test_submissions')
        .select('*')
        .in('user_id', participantIds);

      if (testError) {
        console.error('Error fetching test submissions:', testError);
        throw testError;
      }

      // Fetch checklist results for these participants
      const { data: checklistResults, error: checklistError } = await supabase
        .from('checklist_result')
        .select('*')
        .in('participant_id', participantIds);

      if (checklistError) {
        console.error('Error fetching checklist results:', checklistError);
        throw checklistError;
      }

      console.log(`📊 Found ${testSubmissions?.length || 0} test submissions`);
      console.log(`📊 Found ${checklistResults?.length || 0} checklist results`);

      // Group data by participant
      const participantsMap = new Map<string, {
        profile: any;
        testSubmissions: { pre_test?: any; post_test?: any };
        checklistResults: Map<string, any>;
      }>();

      // Initialize participants map
      participants.forEach(participant => {
        participantsMap.set(participant.id, {
          profile: participant,
          testSubmissions: {},
          checklistResults: new Map()
        });
      });

      // Process test submissions
      testSubmissions?.forEach(submission => {
        const participantId = submission.user_id;
        const participant = participantsMap.get(participantId);
        if (participant) {
          if (submission.test_type === 'pre_test') {
            participant.testSubmissions.pre_test = submission;
          } else if (submission.test_type === 'post_test') {
            participant.testSubmissions.post_test = submission;
          }
        }
      });

      // Process checklist results
      checklistResults?.forEach(result => {
        const participantId = result.participant_id;
        const participant = participantsMap.get(participantId);
        if (participant) {
          participant.checklistResults.set(result.checklist_type, result);
        }
      });

      // Create comprehensive results
      const comprehensiveResults: ComprehensiveResult[] = Array.from(participantsMap.values()).map(participant => {
        const profile = participant.profile;
        const testSubmissions = participant.testSubmissions;
        const checklistResults = participant.checklistResults;

        // Helper function to get test result
        const getTestResult = (testType: 'pre_test' | 'post_test') => {
          const submission = testSubmissions[testType];
          if (!submission) {
            return {
              score: null,
              total_questions: null,
              percentage: null,
              status: 'NOT_TAKEN' as const,
              submitted_at: null
            };
          }

          const percentage = submission.total_questions > 0 
            ? Math.round((submission.correct_answers / submission.total_questions) * 100)
            : 0;

          // Use correct answer count threshold based on job category from test submission
          const jobCategory = submission.job_category;
          const passThreshold = jobCategory === 'Clinical' ? 25 : 20;
          const passed = submission.correct_answers >= passThreshold;

          // Debug logging for specific participants
          if (profile.name === 'AMANDA BULAN SIGAR' || profile.name === 'METHDIOUSE AK SILAN') {
            console.log(`🔍 ${profile.name} - ${testType}:`, {
              correct_answers: submission.correct_answers,
              total_questions: submission.total_questions,
              percentage: percentage,
              job_category: jobCategory,
              pass_threshold: passThreshold,
              status: passed ? 'PASS' : 'FAIL'
            });
          }

          return {
            score: submission.correct_answers,
            total_questions: submission.total_questions,
            percentage,
            status: passed ? 'PASS' as const : 'FAIL' as const,
            submitted_at: submission.submitted_at
          };
        };

        // Helper function to get checklist result
        const getChecklistResult = (checklistType: string) => {
          const result = checklistResults.get(checklistType);
          if (!result) {
            return {
              status: 'NOT_TAKEN' as const,
              completion_percentage: 0,
              submitted_at: null
            };
          }

          return {
            status: result.status as 'PASS' | 'FAIL' | 'INCOMPLETE' | 'NOT_TAKEN',
            completion_percentage: result.completion_percentage,
            submitted_at: result.submitted_at
          };
        };

        // Calculate remedial status
        const getRemedialStatus = () => {
          const postTestResult = getTestResult('post_test');
          if (postTestResult.status === 'PASS') {
            return {
              status: 'ALLOWED' as const,
              reason: 'Post test passed - remedial allowed'
            };
          } else if (postTestResult.status === 'FAIL') {
            return {
              status: 'NOT_ALLOWED' as const,
              reason: 'Post test failed - remedial not allowed'
            };
          } else {
            return {
              status: 'NOT_ALLOWED' as const,
              reason: 'Post test not taken - remedial not allowed'
            };
          }
        };

        // Calculate certified status
        const getCertifiedStatus = () => {
          const postTestResult = getTestResult('post_test');
          const oneManCpr = getChecklistResult('one man cpr');
          const twoManCpr = getChecklistResult('two man cpr');
          const infantCpr = getChecklistResult('infant cpr');
          const infantChoking = getChecklistResult('infant choking');
          const adultChoking = getChecklistResult('adult choking');

          // Check if post test is passed
          if (postTestResult.status !== 'PASS') {
            return {
              status: 'NOT_CERTIFIED' as const,
              reason: 'Post test not passed'
            };
          }

          // Check if all checklists are passed
          const allChecklistsPassed = 
            oneManCpr.status === 'PASS' &&
            twoManCpr.status === 'PASS' &&
            infantCpr.status === 'PASS' &&
            infantChoking.status === 'PASS' &&
            adultChoking.status === 'PASS';

          if (allChecklistsPassed) {
            return {
              status: 'CERTIFIED' as const,
              reason: 'All requirements met - certified'
            };
          } else {
            const failedChecklists = [];
            if (oneManCpr.status !== 'PASS') failedChecklists.push('One Man CPR');
            if (twoManCpr.status !== 'PASS') failedChecklists.push('Two Man CPR');
            if (infantCpr.status !== 'PASS') failedChecklists.push('Infant CPR');
            if (infantChoking.status !== 'PASS') failedChecklists.push('Infant Choking');
            if (adultChoking.status !== 'PASS') failedChecklists.push('Adult Choking');

            return {
              status: 'NOT_CERTIFIED' as const,
              reason: `Failed checklists: ${failedChecklists.join(', ')}`
            };
          }
        };

        return {
          participant_id: profile.id,
          participant_name: profile.name || 'Unknown',
          participant_ic_number: profile.ic_number || 'N/A',
          participant_job_position: profile.job_position_name || 'N/A',
          participant_category: testSubmissions.pre_test?.job_category || testSubmissions.post_test?.job_category || 'Non-Clinical',
          pre_test: getTestResult('pre_test'),
          post_test: getTestResult('post_test'),
          one_man_cpr: getChecklistResult('one man cpr'),
          two_man_cpr: getChecklistResult('two man cpr'),
          infant_cpr: getChecklistResult('infant cpr'),
          infant_choking: getChecklistResult('infant choking'),
          adult_choking: getChecklistResult('adult choking'),
          remedial: getRemedialStatus(),
          certified: getCertifiedStatus()
        };
      });

      // Sort by participant name
      comprehensiveResults.sort((a, b) => a.participant_name.localeCompare(b.participant_name));

      console.log(`✅ Created ${comprehensiveResults.length} comprehensive results`);
      return comprehensiveResults;

    } catch (error) {
      console.error('Error fetching comprehensive results:', error);
      throw error;
    }
  }

  // Get comprehensive results with filtering
  static async getComprehensiveResultsWithFilters(
    searchQuery?: string,
    categoryFilter?: string,
    statusFilter?: string,
    remedialFilter?: string,
    certifiedFilter?: string,
    dateRangeFilter?: string,
    customStartDate?: string,
    customEndDate?: string
  ): Promise<ComprehensiveResult[]> {
    try {
      const allResults = await this.getAllComprehensiveResults();
      
      return allResults.filter(result => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = result.participant_name.toLowerCase().includes(query);
          const matchesIC = result.participant_ic_number.toLowerCase().includes(query);
          const matchesJob = result.participant_job_position.toLowerCase().includes(query);
          
          if (!matchesName && !matchesIC && !matchesJob) {
            return false;
          }
        }

        // Category filter
        if (categoryFilter && categoryFilter !== 'all') {
          if (result.participant_category !== categoryFilter) {
            return false;
          }
        }

        // Status filter (check if any assessment matches the status)
        if (statusFilter && statusFilter !== 'all') {
          const hasMatchingStatus = 
            result.pre_test.status === statusFilter ||
            result.post_test.status === statusFilter ||
            result.one_man_cpr.status === statusFilter ||
            result.two_man_cpr.status === statusFilter ||
            result.infant_cpr.status === statusFilter ||
            result.infant_choking.status === statusFilter ||
            result.adult_choking.status === statusFilter;
          
          if (!hasMatchingStatus) {
            return false;
          }
        }

        // Remedial filter
        if (remedialFilter && remedialFilter !== 'all') {
          if (result.remedial.status !== remedialFilter) {
            return false;
          }
        }

        // Certified filter
        if (certifiedFilter && certifiedFilter !== 'all') {
          if (result.certified.status !== certifiedFilter) {
            return false;
          }
        }

        // Date range filter
        if (dateRangeFilter && dateRangeFilter !== 'all') {
          const now = new Date();
          let startDate: Date;
          let endDate: Date = now;

          switch (dateRangeFilter) {
            case 'today':
              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              break;
            case '7days':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case '30days':
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            case 'custom':
              if (customStartDate && customEndDate) {
                startDate = new Date(customStartDate);
                endDate = new Date(customEndDate);
              } else {
                return true; // No custom dates provided, show all
              }
              break;
            default:
              return true; // Unknown filter, show all
          }

          // Check if any assessment was submitted within the date range
          const hasRecentSubmission = 
            (result.pre_test.submitted_at && new Date(result.pre_test.submitted_at) >= startDate && new Date(result.pre_test.submitted_at) <= endDate) ||
            (result.post_test.submitted_at && new Date(result.post_test.submitted_at) >= startDate && new Date(result.post_test.submitted_at) <= endDate) ||
            (result.one_man_cpr.submitted_at && new Date(result.one_man_cpr.submitted_at) >= startDate && new Date(result.one_man_cpr.submitted_at) <= endDate) ||
            (result.two_man_cpr.submitted_at && new Date(result.two_man_cpr.submitted_at) >= startDate && new Date(result.two_man_cpr.submitted_at) <= endDate) ||
            (result.infant_cpr.submitted_at && new Date(result.infant_cpr.submitted_at) >= startDate && new Date(result.infant_cpr.submitted_at) <= endDate) ||
            (result.infant_choking.submitted_at && new Date(result.infant_choking.submitted_at) >= startDate && new Date(result.infant_choking.submitted_at) <= endDate) ||
            (result.adult_choking.submitted_at && new Date(result.adult_choking.submitted_at) >= startDate && new Date(result.adult_choking.submitted_at) <= endDate);

          if (!hasRecentSubmission) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      console.error('Error filtering comprehensive results:', error);
      throw error;
    }
  }

  // Get statistics for comprehensive results
  static async getComprehensiveStatistics(): Promise<{
    totalParticipants: number;
    testStats: {
      preTestPassed: number;
      preTestFailed: number;
      preTestNotTaken: number;
      postTestPassed: number;
      postTestFailed: number;
      postTestNotTaken: number;
    };
    checklistStats: {
      oneManCprPassed: number;
      twoManCprPassed: number;
      infantCprPassed: number;
      infantChokingPassed: number;
      adultChokingPassed: number;
    };
    statusStats: {
      remedialAllowed: number;
      remedialNotAllowed: number;
      certified: number;
      notCertified: number;
    };
  }> {
    try {
      const results = await this.getAllComprehensiveResults();
      
      const stats = {
        totalParticipants: results.length,
        testStats: {
          preTestPassed: 0,
          preTestFailed: 0,
          preTestNotTaken: 0,
          postTestPassed: 0,
          postTestFailed: 0,
          postTestNotTaken: 0,
        },
        checklistStats: {
          oneManCprPassed: 0,
          twoManCprPassed: 0,
          infantCprPassed: 0,
          infantChokingPassed: 0,
          adultChokingPassed: 0,
        },
        statusStats: {
          remedialAllowed: 0,
          remedialNotAllowed: 0,
          certified: 0,
          notCertified: 0,
        }
      };

      results.forEach(result => {
        // Test statistics
        if (result.pre_test.status === 'PASS') stats.testStats.preTestPassed++;
        else if (result.pre_test.status === 'FAIL') stats.testStats.preTestFailed++;
        else stats.testStats.preTestNotTaken++;

        if (result.post_test.status === 'PASS') stats.testStats.postTestPassed++;
        else if (result.post_test.status === 'FAIL') stats.testStats.postTestFailed++;
        else stats.testStats.postTestNotTaken++;

        // Checklist statistics
        if (result.one_man_cpr.status === 'PASS') stats.checklistStats.oneManCprPassed++;
        if (result.two_man_cpr.status === 'PASS') stats.checklistStats.twoManCprPassed++;
        if (result.infant_cpr.status === 'PASS') stats.checklistStats.infantCprPassed++;
        if (result.infant_choking.status === 'PASS') stats.checklistStats.infantChokingPassed++;
        if (result.adult_choking.status === 'PASS') stats.checklistStats.adultChokingPassed++;

        // Status statistics
        if (result.remedial.status === 'ALLOWED') stats.statusStats.remedialAllowed++;
        else stats.statusStats.remedialNotAllowed++;

        if (result.certified.status === 'CERTIFIED') stats.statusStats.certified++;
        else stats.statusStats.notCertified++;
      });

      return stats;
    } catch (error) {
      console.error('Error getting comprehensive statistics:', error);
      throw error;
    }
  }
}
