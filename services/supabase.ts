// Supabase configuration and service functions
// This file handles all database operations for the Basic Life Support app

import { createClient } from '@supabase/supabase-js';
import { Job, JobDatabase, JobGradeOption, CreateJob, UpdateJob, JobGradeView, JobStats, JobCategory, CodePrefix, CategoryInfo, CategoryChange, BulkCategoryChange } from '../types/JobPosition';

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uiluvmelzycqplzqovdj.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpbHV2bWVsenljcXBsenFvdmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg5MjksImV4cCI6MjA3MzI1NDkyOX0.SgI8tL2LS57KUWvnKCBUY-ijBdA4wa5aNlbGYVF2JJE';

// Create Supabase client with error handling
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.error('Failed to create Supabase client:', error);
  // Create a mock client to prevent app crashes
  supabase = {
    auth: { getUser: () => ({ data: { user: null }, error: null }) },
    from: () => ({ select: () => ({ limit: () => ({ data: [], error: null }) }) }),
    channel: () => ({ on: () => ({ subscribe: () => {} }) })
  };
}

export { supabase };

// Create a client with RLS bypass for debugging (if service role key is available)
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY;
export const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Test Supabase connection
// Job Service Functions
export class JobService {
  // Test Supabase connection
  static async testConnection(): Promise<boolean> {
    try {
      // Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('jobs')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Supabase connection test exception:', error);
      return false;
    }
  }

  // Get all combined job+grade options
  static async getAllJobGradeOptions(): Promise<JobGradeOption[]> {
    try {
      const jobs = await this.getAllJobs();
      const jobGradeOptions: JobGradeOption[] = [];
      
      jobs.forEach(job => {
        job.grades.forEach(grade => {
          jobGradeOptions.push({
            id: `${job.id}_${grade}`,
            displayName: `${job.name} ${grade}`,
            jobName: job.name,
            grade: grade,
            code_prefix: job.code_prefix,
            category: job.category,
            notes: job.notes,
            is_active: job.is_active
          });
        });
      });
      
      return jobGradeOptions;
    } catch (error) {
      console.error('Error generating job+grade options:', error);
      return [];
    }
  }

  // Get all jobs from Supabase
  static async getAllJobs(): Promise<Job[]> {
    try {
      // First, let's check what tables exist and what the actual structure is
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .like('table_name', '%job%');
      
      // Try a simple count query first
      const { count, error: countError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });
      
      // Query the jobs table with correct column names
      const { data: allData, error: allError } = await supabase
        .from('jobs')
        .select('*')
        .order('name');

      // Try without ordering to see if that's the issue
      const { data: simpleData, error: simpleError } = await supabase
        .from('jobs')
        .select('*');

      // Try with admin client to bypass RLS if available
      let adminData = null;
      if (supabaseAdmin) {
        const { data: adminDataResult, error: adminError } = await supabaseAdmin
          .from('jobs')
          .select('*');
        
        adminData = adminDataResult;
        }

      // Now try with the is_active filter
      const { data: activeData, error: activeError } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('name');

      // If we have data from any query, use it (prioritize admin data if available)
      const finalData = adminData || allData || simpleData || activeData;
      const finalError = allError || simpleError || activeError;

      if (finalError) {
        console.error('Error fetching jobs from Supabase:', finalError);
        // Fallback to sample data if Supabase fails
        const sampleJobs = this.getSampleJobs();
        return sampleJobs;
      }

      // If no data returned (likely due to RLS), use sample data
      if (!finalData || finalData.length === 0) {
        const sampleJobs = this.getSampleJobs();
        return sampleJobs;
      }

      // Transform the data to match the expected Job interface
      const transformedData = (finalData || []).map((job: any): Job => ({
        id: job.id,
        name: job.name, // Use name directly from database
        code_prefix: job.code_prefix,
        grades: job.grades,
        category: job.category,
        notes: job.notes,
        is_active: job.is_active,
        created_at: job.created_at,
        updated_at: job.updated_at
      }));

      return transformedData;
    } catch (error) {
      console.error('Error in getAllJobs:', error);
      // Fallback to sample data if there's any error
      const sampleJobs = this.getSampleJobs();
      return sampleJobs;
    }
  }

  // Sample data fallback
  private static getSampleJobs(): Job[] {
    const sampleJobs = [
      { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Jurupulih Fisioterapi', category: 'Clinical', code_prefix: 'U', grades: ['U5', 'U6', 'U7', 'U8'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Jururawat', category: 'Clinical', code_prefix: 'U', grades: ['U5', 'U6', 'U7', 'U8'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Pembantu Khidmat Am', category: 'Non-Clinical', code_prefix: 'H', grades: ['H1', 'H2', 'H3', 'H4'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Penolong Pegawai Tadbir', category: 'Non-Clinical', code_prefix: 'N', grades: ['N1', 'N2', 'N3', 'N4', 'N5', 'N6'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Pegawai Pergigian', category: 'Clinical', code_prefix: 'UG', grades: ['UG9', 'UG10', 'UG12', 'UG13', 'UG14', 'UG15'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Pegawai Farmasi', category: 'Clinical', code_prefix: 'UF', grades: ['UF9', 'UF10', 'UF12', 'UF13', 'UF14'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440007', name: 'Pembantu Tadbir', category: 'Non-Clinical', code_prefix: 'N', grades: ['N1', 'N2', 'N3', 'N4'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440008', name: 'Juruteknologi Makmal Perubatan', category: 'Clinical', code_prefix: 'U', grades: ['U5', 'U6', 'U7', 'U8'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440009', name: 'Pembantu Perawatan Kesihatan', category: 'Clinical', code_prefix: 'U', grades: ['U5', 'U6', 'U7', 'U8'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440010', name: 'Jururawat Masyarakat', category: 'Clinical', code_prefix: 'U', grades: ['U5', 'U6', 'U7', 'U8'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440011', name: 'Pegawai Perubatan', category: 'Clinical', code_prefix: 'UD', grades: ['UD9', 'UD10', 'UD12', 'UD13', 'UD14', 'UD15'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440012', name: 'Pembantu Pembedahan Pergigian', category: 'Clinical', code_prefix: 'U', grades: ['U5', 'U6', 'U7', 'U8'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440013', name: 'Pembantu Penyediaan Makanan', category: 'Non-Clinical', code_prefix: 'H', grades: ['H1', 'H2', 'H3', 'H4'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440014', name: 'Jurupulih Perubatan Carakerja', category: 'Clinical', code_prefix: 'U', grades: ['U5', 'U6', 'U7', 'U8'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440015', name: 'Penolong Jurutera', category: 'Non-Clinical', code_prefix: 'JA', grades: ['JA5', 'JA6', 'JA7', 'JA8'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440016', name: 'Penolong Pegawai Farmasi', category: 'Clinical', code_prefix: 'U', grades: ['U5', 'U6', 'U7', 'U8'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440017', name: 'Juru-Xray', category: 'Clinical', code_prefix: 'U', grades: ['U5', 'U6', 'U7', 'U8'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
      { id: '550e8400-e29b-41d4-a716-446655440018', name: 'Penolong Pegawai Perubatan', category: 'Clinical', code_prefix: 'U', grades: ['U5', 'U6', 'U7', 'U8'], is_active: true, created_at: '2025-09-13T09:06:39.608105+00:00', updated_at: '2025-09-13T09:06:39.608105+00:00', notes: null },
    ];
    return sampleJobs;
  }

  // Get available grades for a specific job
  static async getJobGrades(jobId: string): Promise<string[]> {
    // Find the job and return its grades
    const jobs = await this.getAllJobs();
    const job = jobs.find(j => j.id === jobId);
    return job?.grades || [];
  }

  // Get job by ID
  static async getJobById(id: string): Promise<Job | null> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        name: data.name,
        code_prefix: data.code_prefix,
        grades: data.grades,
        category: data.category,
        notes: data.notes,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      } as Job;
    } catch (error) {
      console.error('Error in getJobById:', error);
      return null;
    }
  }

  // Get jobs by category
  static async getJobsByCategory(category: JobCategory): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('name');

      if (error) return [];

      return data.map((job: JobDatabase): Job => ({
        id: job.id,
        name: job.name,
        code_prefix: job.code_prefix,
        grades: job.grades,
        category: job.category,
        notes: job.notes,
        is_active: job.is_active,
        created_at: job.created_at,
        updated_at: job.updated_at
      }));
    } catch (error) {
      console.error('Error in getJobsByCategory:', error);
      return [];
    }
  }

  // Get jobs by code prefix
  static async getJobsByCodePrefix(codePrefix: CodePrefix): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('code_prefix', codePrefix)
        .eq('is_active', true)
        .order('name');

      if (error) return [];

      return data.map((job: JobDatabase): Job => ({
        id: job.id,
        name: job.name,
        code_prefix: job.code_prefix,
        grades: job.grades,
        category: job.category,
        notes: job.notes,
        is_active: job.is_active,
        created_at: job.created_at,
        updated_at: job.updated_at
      }));
    } catch (error) {
      console.error('Error in getJobsByCodePrefix:', error);
      return [];
    }
  }

  // Search jobs by name
  static async searchJobs(searchTerm: string): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .eq('is_active', true)
        .order('name');

      if (error) return [];

      return data.map((job: JobDatabase): Job => ({
        id: job.id,
        name: job.name,
        code_prefix: job.code_prefix,
        grades: job.grades,
        category: job.category,
        notes: job.notes,
        is_active: job.is_active,
        created_at: job.created_at,
        updated_at: job.updated_at
      }));
    } catch (error) {
      console.error('Error in searchJobs:', error);
      return [];
    }
  }

  // Get job statistics
  static async getJobStats(): Promise<JobStats> {
    const jobs = await this.getAllJobs();
    
    const stats: JobStats = {
      total: jobs.length,
      byCategory: {},
      byCodePrefix: {},
      byGrade: {}
    };

    jobs.forEach(job => {
      // Count by category
      if (job.category) {
        stats.byCategory[job.category] = (stats.byCategory[job.category] || 0) + 1;
      }

      // Count by code prefix
      if (job.code_prefix) {
        stats.byCodePrefix[job.code_prefix] = (stats.byCodePrefix[job.code_prefix] || 0) + 1;
      }

      // Count by grade
      if (job.grades && Array.isArray(job.grades)) {
        job.grades.forEach((grade: string) => {
          stats.byGrade[grade] = (stats.byGrade[grade] || 0) + 1;
        });
      }
    });

    return stats;
  }

  // Check if a grade exists for a specific job
  static async isGradeValidForJob(jobId: string, grade: string): Promise<boolean> {
    const grades = await this.getJobGrades(jobId);
    return grades.includes(grade);
  }
}

// Legacy class for backward compatibility
export class JobPositionService extends JobService {
  static async getAllJobPositions() {
    return this.getAllJobs();
  }

  static async getJobPositionById(id: string) {
    return this.getJobById(id);
  }

  static async getJobPositionsByCategory(category: string) {
    return this.getJobsByCategory(category as JobCategory);
  }
}