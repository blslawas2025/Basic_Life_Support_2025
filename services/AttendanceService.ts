import { supabase } from './supabase';

export interface AttendanceRecord {
  id: string;
  participant_id: string;
  course_session_id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: 'present' | 'absent' | 'late';
  created_at: string;
  updated_at: string;
}

export interface CreateAttendanceRecord {
  participant_id: string;
  course_session_id: string;
  status: 'present' | 'absent' | 'late';
  check_in_time?: string;
  check_out_time?: string;
}

export interface UpdateAttendanceRecord {
  status?: 'present' | 'absent' | 'late';
  check_in_time?: string;
  check_out_time?: string;
}

export class AttendanceService {
  /**
   * Get all attendance records for a specific course session
   */
  static async getAttendanceByCourse(courseSessionId: string): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('course_session_id', courseSessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching attendance records:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAttendanceByCourse:', error);
      throw error;
    }
  }

  /**
   * Get attendance record for a specific participant and course
   */
  static async getAttendanceRecord(
    participantId: string, 
    courseSessionId: string
  ): Promise<AttendanceRecord | null> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('participant_id', participantId)
        .eq('course_session_id', courseSessionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching attendance record:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Error in getAttendanceRecord:', error);
      throw error;
    }
  }

  /**
   * Create a new attendance record
   */
  static async createAttendanceRecord(
    record: CreateAttendanceRecord
  ): Promise<AttendanceRecord> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .insert([record])
        .select()
        .single();

      if (error) {
        console.error('Error creating attendance record:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createAttendanceRecord:', error);
      throw error;
    }
  }

  /**
   * Update an existing attendance record
   */
  static async updateAttendanceRecord(
    id: string,
    updates: UpdateAttendanceRecord
  ): Promise<AttendanceRecord> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating attendance record:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateAttendanceRecord:', error);
      throw error;
    }
  }

  /**
   * Mark attendance for a participant in a course session
   */
  static async markAttendance(
    participantId: string,
    courseSessionId: string,
    status: 'present' | 'absent' | 'late' = 'present'
  ): Promise<AttendanceRecord> {
    try {
      console.log('Marking attendance:', { participantId, courseSessionId, status });
      
      // Check if record already exists
      const existingRecord = await this.getAttendanceRecord(participantId, courseSessionId);
      
      if (existingRecord) {
        // Update existing record
        const updates: UpdateAttendanceRecord = {
          status,
          check_in_time: status === 'present' || status === 'late' ? new Date().toISOString() : existingRecord.check_in_time,
        };
        
        console.log('Updating existing attendance record:', updates);
        return await this.updateAttendanceRecord(existingRecord.id, updates);
      } else {
        // Create new record
        const newRecord: CreateAttendanceRecord = {
          participant_id: participantId,
          course_session_id: courseSessionId,
          status,
          check_in_time: status === 'present' || status === 'late' ? new Date().toISOString() : null,
        };
        
        console.log('Creating new attendance record:', newRecord);
        return await this.createAttendanceRecord(newRecord);
      }
    } catch (error) {
      console.error('Error in markAttendance:', error);
      throw error;
    }
  }

  /**
   * Get attendance statistics for a course session
   */
  static async getAttendanceStats(courseSessionId: string): Promise<{
    total: number;
    present: number;
    absent: number;
    late: number;
    attendanceRate: number;
  }> {
    try {
      const records = await this.getAttendanceByCourse(courseSessionId);
      
      const total = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const late = records.filter(r => r.status === 'late').length;
      const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
      
      return {
        total,
        present,
        absent,
        late,
        attendanceRate,
      };
    } catch (error) {
      console.error('Error in getAttendanceStats:', error);
      throw error;
    }
  }

  /**
   * Initialize attendance records for all participants in a course
   * This creates 'absent' records for participants who haven't checked in yet
   */
  static async initializeAttendanceForCourse(
    courseSessionId: string,
    participantIds: string[]
  ): Promise<void> {
    try {
      console.log('Initializing attendance for course:', courseSessionId, 'with participants:', participantIds);
      
      // Get existing records
      const existingRecords = await this.getAttendanceByCourse(courseSessionId);
      const existingParticipantIds = existingRecords.map(r => r.participant_id);
      
      // Find participants without records
      const newParticipantIds = participantIds.filter(id => !existingParticipantIds.includes(id));
      
      if (newParticipantIds.length > 0) {
        // Create absent records for new participants
        const newRecords: CreateAttendanceRecord[] = newParticipantIds.map(participantId => ({
          participant_id: participantId,
          course_session_id: courseSessionId,
          status: 'absent',
        }));
        
        console.log('Creating new attendance records:', newRecords);
        
        const { error } = await supabase
          .from('attendance_records')
          .insert(newRecords);

        if (error) {
          console.error('Error creating initial attendance records:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error in initializeAttendanceForCourse:', error);
      throw error;
    }
  }

  /**
   * Delete attendance records for a course session
   */
  static async deleteAttendanceByCourse(courseSessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('course_session_id', courseSessionId);

      if (error) {
        console.error('Error deleting attendance records:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteAttendanceByCourse:', error);
      throw error;
    }
  }

  /**
   * Get attendance records with participant details
   */
  static async getAttendanceWithParticipants(courseSessionId: string): Promise<
    Array<AttendanceRecord & { participant?: any }>
  > {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          profiles:participant_id (
            id,
            full_name,
            email,
            phone,
            job_position
          )
        `)
        .eq('course_session_id', courseSessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching attendance with participants:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAttendanceWithParticipants:', error);
      throw error;
    }
  }
}
