// Submission Service for managing test submissions and retake policies
// This file handles all database operations for test submissions tracking

import { supabase } from './supabase';

export interface TestSubmission {
  id: string;
  user_id: string; // UUID from profiles table
  user_name: string;
  user_email: string;
  ic_number?: string;
  job_position_name?: string;
  job_category?: 'Clinical' | 'Non-Clinical';
  test_type: 'pre_test' | 'post_test';
  course_session_id?: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken_seconds: number;
  submitted_at: string;
  is_completed: boolean;
  attempt_number: number;
  can_retake: boolean;
  retake_available_after?: string;
  results_released: boolean;
  results_released_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SubmissionSettings {
  enableOneTimeSubmission: boolean;
  singleAttempt: boolean;
  submissionLock: boolean;
  progressTracking: boolean;
  resultsLock: boolean;
  showResultsAfterSubmission: boolean;
  adminControlledRetake: boolean;
  allowRetake: boolean;
  maxRetakeAttempts: number;
  retakeCooldownHours: number;
}

export class SubmissionService {
  // Check if user has already taken the test
  static async hasUserTakenTest(
    userId: string, 
    testType: 'pre_test' | 'post_test',
    courseSessionId?: string
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('test_submissions')
        .select('id')
        .eq('user_id', userId)
        .eq('test_type', testType)
        .eq('is_completed', true);

      if (courseSessionId) {
        query = query.eq('course_session_id', courseSessionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        
        // If table doesn't exist, assume user hasn't taken the test
        if (error.code === 'PGRST205' && error.message.includes('Could not find the table')) {

          return false;
        }
        
        throw new Error(`Failed to check test submission: ${error.message}`);
      }

      const hasTaken = data && data.length > 0;
      return hasTaken;
    } catch (error) {
      console.error('Error checking test submission:', error);
      
      // If it's a table not found error, return false (user hasn't taken test)
      if (error instanceof Error && error.message.includes('Could not find the table')) {

        return false;
      }
      
      throw error;
    }
  }

  // Get user's submission history for a test type
  static async getUserSubmissions(
    userId: string, 
    testType: 'pre_test' | 'post_test',
    courseSessionId?: string
  ): Promise<TestSubmission[]> {
    try {
      let query = supabase
        .from('test_submissions')
        .select('*')
        .eq('user_id', userId)
        .eq('test_type', testType)
        .order('submitted_at', { ascending: false });

      if (courseSessionId) {
        query = query.eq('course_session_id', courseSessionId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch submissions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  }

  // Create a new test submission
  static async createSubmission(
    userId: string,
    testType: 'pre_test' | 'post_test',
    score: number,
    totalQuestions: number,
    correctAnswers: number,
    timeTakenSeconds: number,
    courseSessionId?: string
  ): Promise<TestSubmission> {
    try {
      // Get the next attempt number
      const existingSubmissions = await this.getUserSubmissions(userId, testType, courseSessionId);
      const attemptNumber = existingSubmissions.length + 1;

      const submissionData = {
        user_id: userId,
        test_type: testType,
        course_session_id: courseSessionId || null,
        score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        time_taken_seconds: timeTakenSeconds,
        submitted_at: new Date().toISOString(),
        is_completed: true,
        attempt_number: attemptNumber,
        can_retake: false, // Will be set based on retake policy
        results_released: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('test_submissions')
        .insert([submissionData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        
        // If table doesn't exist, create a mock submission
        if (error.code === 'PGRST205' && error.message.includes('Could not find the table')) {

          const mockSubmission: TestSubmission = {
            id: `mock_${Date.now()}`,
            user_id: userId,
            test_type: testType,
            course_session_id: courseSessionId,
            score,
            total_questions: totalQuestions,
            correct_answers: correctAnswers,
            time_taken_seconds: timeTakenSeconds,
            submitted_at: new Date().toISOString(),
            is_completed: true,
            attempt_number: 1,
            can_retake: false,
            results_released: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          return mockSubmission;
        }
        
        throw new Error(`Failed to create submission: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating submission:', error);
      
      // If it's a table not found error, create a mock submission
      if (error instanceof Error && error.message.includes('Could not find the table')) {

        const mockSubmission: TestSubmission = {
          id: `mock_${Date.now()}`,
          user_id: userId,
          test_type: testType,
          course_session_id: courseSessionId,
          score,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          time_taken_seconds: timeTakenSeconds,
          submitted_at: new Date().toISOString(),
          is_completed: true,
          attempt_number: 1,
          can_retake: false,
          results_released: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return mockSubmission;
      }
      
      throw error;
    }
  }

  // Check if user can retake the test
  static async canUserRetake(
    userId: string,
    testType: 'pre_test' | 'post_test',
    settings: SubmissionSettings,
    courseSessionId?: string
  ): Promise<{ canRetake: boolean; reason?: string; retakeAvailableAfter?: string }> {
    try {
      // If one-time submission is disabled, always allow retake
      if (!settings.enableOneTimeSubmission) {
        return { canRetake: true };
      }

      // If single attempt is enabled, no retakes allowed
      if (settings.singleAttempt) {
        return { canRetake: false, reason: 'Single attempt only - no retakes allowed' };
      }

      // If admin controlled retake is enabled, check admin permission
      if (settings.adminControlledRetake && !settings.allowRetake) {
        return { canRetake: false, reason: 'Retake not allowed by admin' };
      }

      const submissions = await this.getUserSubmissions(userId, testType, courseSessionId);
      
      // Check max retake attempts
      if (submissions.length >= settings.maxRetakeAttempts) {
        return { canRetake: false, reason: `Maximum retake attempts (${settings.maxRetakeAttempts}) reached` };
      }

      // Check cooldown period
      if (submissions.length > 0 && settings.retakeCooldownHours > 0) {
        const lastSubmission = submissions[0];
        const lastSubmissionTime = new Date(lastSubmission.submitted_at);
        const cooldownEndTime = new Date(lastSubmissionTime.getTime() + (settings.retakeCooldownHours * 60 * 60 * 1000));
        const now = new Date();

        if (now < cooldownEndTime) {
          return { 
            canRetake: false, 
            reason: `Cooldown period active - retake available after ${cooldownEndTime.toLocaleString()}`,
            retakeAvailableAfter: cooldownEndTime.toISOString()
          };
        }
      }

      return { canRetake: true };
    } catch (error) {
      console.error('Error checking retake eligibility:', error);
      throw error;
    }
  }

  // Release results for a submission
  static async releaseResults(submissionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('test_submissions')
        .update({
          results_released: true,
          results_released_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', submissionId);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to release results: ${error.message}`);
      }

      } catch (error) {
      console.error('Error releasing results:', error);
      throw error;
    }
  }

  // Get submission by ID
  static async getSubmissionById(submissionId: string): Promise<TestSubmission | null> {
    try {
      const { data, error } = await supabase
        .from('test_submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch submission: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching submission:', error);
      throw error;
    }
  }

  // Update retake permission for a user
  static async updateRetakePermission(
    userId: string,
    testType: 'pre_test' | 'post_test',
    canRetake: boolean,
    courseSessionId?: string
  ): Promise<void> {
    try {
      let query = supabase
        .from('test_submissions')
        .update({
          can_retake: canRetake,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('test_type', testType);

      if (courseSessionId) {
        query = query.eq('course_session_id', courseSessionId);
      }

      const { error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to update retake permission: ${error.message}`);
      }

      } catch (error) {
      console.error('Error updating retake permission:', error);
      throw error;
    }
  }

  // Get all submissions for analytics
  static async getAllSubmissions(): Promise<TestSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('test_submissions')
        .select('*')
        .eq('is_completed', true)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        
        // If table doesn't exist, return empty array instead of mock data
        if (error.code === 'PGRST205' && error.message.includes('Could not find the table')) {

          return [];
        }
        
        throw new Error(`Failed to fetch submissions: ${error.message}`);
      }

      // Transform the data to match the TestSubmission interface
      const transformedData: TestSubmission[] = data?.map(submission => ({
        id: submission.id,
        user_id: submission.user_id,
        user_name: submission.user_name || 'Unknown User',
        user_email: submission.user_email || 'No email',
        ic_number: submission.ic_number,
        job_position_name: submission.job_position_name,
        job_category: submission.job_category as 'Clinical' | 'Non-Clinical' | undefined,
        test_type: submission.test_type as 'pre_test' | 'post_test',
        course_session_id: submission.course_session_id,
        score: submission.score,
        total_questions: submission.total_questions,
        correct_answers: submission.correct_answers,
        time_taken_seconds: submission.time_taken_seconds,
        submitted_at: submission.submitted_at,
        is_completed: submission.is_completed,
        attempt_number: submission.attempt_number,
        can_retake: submission.can_retake,
        retake_available_after: submission.retake_available_after,
        results_released: submission.results_released,
        results_released_at: submission.results_released_at,
        created_at: submission.created_at,
        updated_at: submission.updated_at,
      })) || [];

      return transformedData;
    } catch (error) {
      console.error('Error fetching all submissions:', error);
      
      // If it's a table not found error, return empty array
      if (error instanceof Error && error.message.includes('Could not find the table')) {

        return [];
      }
      
      throw error;
    }
  }

  // Generate mock submissions for testing
  private static getMockSubmissions(): any[] {
    const mockSubmissions = [];
    const userTypes = ['clinical', 'non-clinical'];
    const testTypes = ['pre_test', 'post_test'];
    
    for (let i = 1; i <= 20; i++) {
      const userType = userTypes[Math.floor(Math.random() * userTypes.length)];
      const testType = testTypes[Math.floor(Math.random() * testTypes.length)];
      const score = Math.floor(Math.random() * 31); // 0-30
      const timeTaken = Math.floor(Math.random() * 1800) + 300; // 5-35 minutes
      
      mockSubmissions.push({
        id: `mock_${i}`,
        user_id: `user_${i}`,
        test_type: testType,
        score: score,
        total_questions: 30,
        correct_answers: score,
        time_taken: timeTaken,
        submitted_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        user_name: `User ${i}`,
        user_email: `user${i}@example.com`,
        user_type: userType,
        answers: {},
        questions: [],
      });
    }
    
    return mockSubmissions;
  }

  // Save test result with enhanced user information
  static async saveTestResult(
    userId: string,
    testType: 'pre_test' | 'post_test',
    score: number,
    totalQuestions: number,
    correctAnswers: number,
    timeTakenSeconds: number,
    courseSessionId?: string
  ): Promise<TestSubmission> {
    try {
      // First, get user profile information
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, email, ic_number, job_position_name, job_position_id')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw profileError;
      }
      
      if (!profile) {
        throw new Error('User profile not found');
      }
      
      // Get job category from jobs table if job_position_id exists
      let jobCategory = 'Non-Clinical'; // Default value
      if (profile.job_position_id) {
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('category')
          .eq('id', profile.job_position_id)
          .single();
        
        if (!jobError && job) {
          jobCategory = job.category || 'Non-Clinical';
        }
      }
      
      // Check if user has already taken this test type
      const hasTaken = await this.hasUserTakenTest(userId, testType, courseSessionId);
      const attemptNumber = hasTaken ? await this.getNextAttemptNumber(userId, testType, courseSessionId) : 1;
      
      // Prepare submission data with enhanced information
      const submissionData = {
        user_id: userId,
        user_name: profile.name,
        user_email: profile.email,
        ic_number: profile.ic_number,
        job_position_name: profile.job_position_name,
        job_category: jobCategory,
        test_type: testType,
        course_session_id: courseSessionId,
        score: score,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        time_taken_seconds: timeTakenSeconds,
        submitted_at: new Date().toISOString(),
        is_completed: true,
        attempt_number: attemptNumber,
        can_retake: false, // Will be set based on retake policy
        results_released: true,
        results_released_at: new Date().toISOString()
      };
      
      // Insert the submission
      const { data, error } = await supabase
        .from('test_submissions')
        .insert([submissionData])
        .select()
        .single();
      
      if (error) {
        console.error('Error saving test result:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in saveTestResult:', error);
      throw error;
    }
  }

  // Get next attempt number for a user and test type
  private static async getNextAttemptNumber(
    userId: string, 
    testType: 'pre_test' | 'post_test',
    courseSessionId?: string
  ): Promise<number> {
    try {
      let query = supabase
        .from('test_submissions')
        .select('attempt_number')
        .eq('user_id', userId)
        .eq('test_type', testType);
      
      if (courseSessionId) {
        query = query.eq('course_session_id', courseSessionId);
      }
      
      const { data, error } = await query.order('attempt_number', { ascending: false }).limit(1);
      
      if (error) {
        console.error('Error getting attempt number:', error);
        return 1;
      }
      
      return data && data.length > 0 ? data[0].attempt_number + 1 : 1;
    } catch (error) {
      console.error('Error in getNextAttemptNumber:', error);
      return 1;
    }
  }
}
