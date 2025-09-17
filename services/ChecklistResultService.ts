import { supabase } from '../config/supabase';

export interface ChecklistResult {
  id?: string;
  participant_id: string;
  participant_name: string;
  participant_email?: string;
  participant_ic_number?: string;
  participant_phone_number?: string;
  participant_job_position?: string;
  participant_category?: string;
  participant_workplace?: string;
  participant_pregnancy_status?: boolean;
  participant_pregnancy_weeks?: number;
  participant_allergies?: boolean;
  participant_allergies_description?: string;
  participant_asthma_status?: boolean;
  checklist_type: string;
  checklist_version?: string;
  total_items: number;
  completed_items: number;
  completion_percentage: number;
  status: 'INCOMPLETE' | 'FAIL' | 'PASS';
  can_pass: boolean;
  all_compulsory_completed: boolean;
  section_results: any[];
  instructor_id?: string;
  instructor_name?: string;
  instructor_comments?: string;
  submitted_at?: string;
  submission_ip?: string;
  submission_device_info?: string;
  assessment_duration_seconds?: number;
  time_started?: string;
  time_completed?: string;
  assessment_notes?: string;
  retake_count?: number;
  is_retake?: boolean;
  previous_assessment_id?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: string;
  deletion_reason?: string;
}

export interface ChecklistResultSummary {
  id: string;
  participant_id: string;
  participant_name: string;
  participant_email?: string;
  participant_job_position?: string;
  participant_category?: string;
  checklist_type: string;
  total_items: number;
  completed_items: number;
  completion_percentage: number;
  status: 'INCOMPLETE' | 'FAIL' | 'PASS';
  can_pass: boolean;
  all_compulsory_completed: boolean;
  instructor_name?: string;
  instructor_comments?: string;
  submitted_at: string;
  assessment_duration_seconds?: number;
  retake_count: number;
  is_retake: boolean;
  participant_full_name?: string;
  participant_email_address?: string;
  participant_ic?: string;
  participant_phone?: string;
  participant_job_title?: string;
  participant_category_name?: string;
  participant_workplace_name?: string;
}

export interface ChecklistResultStats {
  checklist_type: string;
  total_assessments: number;
  pass_count: number;
  fail_count: number;
  incomplete_count: number;
  avg_completion_percentage: number;
  avg_duration_seconds: number;
  total_passes: number;
  pass_rate: number;
}

export class ChecklistResultService {
  /**
   * Validate that PASS status requires all compulsory items to be completed
   */
  static validatePassStatus(sectionResults: any[]): { isValid: boolean; missingCompulsory: string[] } {
    const missingCompulsory: string[] = [];
    
    sectionResults.forEach(section => {
      if (section.items) {
        const incompleteCompulsory = section.items
          .filter((item: any) => item.is_compulsory && !item.completed)
          .map((item: any) => `${section.section}: ${item.item}`);
        
        missingCompulsory.push(...incompleteCompulsory);
      }
    });
    
    return {
      isValid: missingCompulsory.length === 0,
      missingCompulsory
    };
  }

  /**
   * Submit a checklist assessment result
   */
  static async submitChecklistResult(resultData: Omit<ChecklistResult, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: ChecklistResult; error?: string }> {
    try {
      console.log('Submitting checklist result:', resultData);
      
      const { data, error } = await supabase
        .from('checklist_result')
        .insert([resultData])
        .select()
        .single();

      if (error) {
        console.error('Error submitting checklist result:', error);
        return { success: false, error: error.message };
      }

      console.log('Checklist result submitted successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Error submitting checklist result:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get all checklist results with optional filtering
   */
  static async getAllChecklistResults(filters?: {
    participant_id?: string;
    checklist_type?: string;
    status?: string;
    instructor_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data?: ChecklistResultSummary[]; error?: string }> {
    try {
      let query = supabase
        .from('checklist_result')
        .select('*')
        .eq('is_deleted', false)
        .order('submitted_at', { ascending: false });

      if (filters?.participant_id) {
        query = query.eq('participant_id', filters.participant_id);
      }

      if (filters?.checklist_type) {
        query = query.eq('checklist_type', filters.checklist_type);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.instructor_id) {
        query = query.eq('instructor_id', filters.instructor_id);
      }

      if (filters?.start_date) {
        query = query.gte('submitted_at', filters.start_date);
      }

      if (filters?.end_date) {
        query = query.lte('submitted_at', filters.end_date);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching checklist results:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching checklist results:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get checklist result by ID
   */
  static async getChecklistResultById(id: string): Promise<{ success: boolean; data?: ChecklistResult; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('checklist_result')
        .select('*')
        .eq('id', id)
        .eq('is_deleted', false)
        .single();

      if (error) {
        console.error('Error fetching checklist result:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching checklist result:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get checklist results for a specific participant
   */
  static async getChecklistResultsByParticipant(participantId: string, checklistType?: string): Promise<{ success: boolean; data?: ChecklistResultSummary[]; error?: string }> {
    try {
      let query = supabase
        .from('checklist_result')
        .select('*')
        .eq('participant_id', participantId)
        .eq('is_deleted', false)
        .order('submitted_at', { ascending: false });

      if (checklistType) {
        query = query.eq('checklist_type', checklistType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching participant checklist results:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching participant checklist results:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get checklist statistics
   */
  static async getChecklistStats(checklistType?: string): Promise<{ success: boolean; data?: ChecklistResultStats[]; error?: string }> {
    try {
      // Since the view might not exist, let's calculate stats from the main table
      let query = supabase
        .from('checklist_result')
        .select('checklist_type, status, completion_percentage, assessment_duration_seconds')
        .eq('is_deleted', false);

      if (checklistType) {
        query = query.eq('checklist_type', checklistType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching checklist stats:', error);
        return { success: false, error: error.message };
      }

      // Calculate stats from the raw data
      const statsMap = new Map<string, any>();
      
      data?.forEach(result => {
        const type = result.checklist_type;
        if (!statsMap.has(type)) {
          statsMap.set(type, {
            checklist_type: type,
            total_assessments: 0,
            pass_count: 0,
            fail_count: 0,
            incomplete_count: 0,
            total_duration: 0,
            total_completion: 0
          });
        }
        
        const stats = statsMap.get(type);
        stats.total_assessments++;
        stats.total_duration += result.assessment_duration_seconds || 0;
        stats.total_completion += result.completion_percentage || 0;
        
        if (result.status === 'PASS') {
          stats.pass_count++;
        } else if (result.status === 'FAIL') {
          stats.fail_count++;
        } else if (result.status === 'INCOMPLETE') {
          stats.incomplete_count++;
        }
      });

      // Convert to final format
      const stats = Array.from(statsMap.values()).map(stat => ({
        checklist_type: stat.checklist_type,
        total_assessments: stat.total_assessments,
        pass_count: stat.pass_count,
        fail_count: stat.fail_count,
        incomplete_count: stat.incomplete_count,
        avg_completion_percentage: stat.total_assessments > 0 ? 
          Math.round((stat.total_completion / stat.total_assessments) * 100) / 100 : 0,
        avg_duration_seconds: stat.total_assessments > 0 ? 
          Math.round(stat.total_duration / stat.total_assessments) : 0,
        total_passes: stat.pass_count,
        pass_rate: stat.total_assessments > 0 ? 
          Math.round((stat.pass_count / stat.total_assessments) * 100) : 0
      }));

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching checklist stats:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update checklist result
   */
  static async updateChecklistResult(id: string, updates: Partial<ChecklistResult>): Promise<{ success: boolean; data?: ChecklistResult; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('checklist_result')
        .update(updates)
        .eq('id', id)
        .eq('is_deleted', false)
        .select()
        .single();

      if (error) {
        console.error('Error updating checklist result:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating checklist result:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Soft delete checklist result
   */
  static async deleteChecklistResult(id: string, deletedBy: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('checklist_result')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
          deletion_reason: reason
        })
        .eq('id', id);

      if (error) {
        console.error('Error deleting checklist result:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting checklist result:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get retake count for a participant and checklist type
   */
  static async getRetakeCount(participantId: string, checklistType: string): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('checklist_result')
        .select('retake_count')
        .eq('participant_id', participantId)
        .eq('checklist_type', checklistType)
        .eq('is_deleted', false)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching retake count:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count: data?.retake_count || 0 };
    } catch (error) {
      console.error('Error fetching retake count:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Check if participant can retake checklist
   */
  static async canRetakeChecklist(participantId: string, checklistType: string, maxRetakes: number = 3): Promise<{ success: boolean; canRetake?: boolean; retakeCount?: number; error?: string }> {
    try {
      const retakeResult = await this.getRetakeCount(participantId, checklistType);
      
      if (!retakeResult.success) {
        return { success: false, error: retakeResult.error };
      }

      const canRetake = (retakeResult.count || 0) < maxRetakes;
      
      return { 
        success: true, 
        canRetake, 
        retakeCount: retakeResult.count || 0 
      };
    } catch (error) {
      console.error('Error checking retake eligibility:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
