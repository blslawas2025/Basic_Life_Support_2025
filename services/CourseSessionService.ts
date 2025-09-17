// Course Session Service Functions for managing course sessions
// This file handles all database operations for the course_sessions table

import { supabase } from './supabase';
import { 
  CourseSession, 
  CreateCourseSession, 
  UpdateCourseSession, 
  CourseSessionStats,
  CourseSessionWithParticipants,
  CourseSessionOption,
  CourseSessionFilters,
  CourseSessionSearch,
  AttendanceRecord,
  CreateAttendanceRecord,
  AttendanceSummary,
  generateCourseFullName,
  isRegistrationOpen,
  getAvailableSpots,
  isSessionFull
} from '../types/CourseSession';

// Course Session Service Class
export class CourseSessionService {
  // Create a new course session
  static async createCourseSession(sessionData: CreateCourseSession): Promise<CourseSession> {
    try {
      // Generate full name if not provided
      const fullName = sessionData.full_name || generateCourseFullName(
        sessionData.course_name, 
        sessionData.series_name, 
        sessionData.year
      );
      
      // Prepare data for Supabase insertion
      const insertData = {
        course_name: sessionData.course_name,
        series_name: sessionData.series_name,
        year: sessionData.year,
        full_name: fullName,
        description: sessionData.description || null,
        start_date: sessionData.start_date || null,
        end_date: sessionData.end_date || null,
        registration_start_date: sessionData.registration_start_date || null,
        registration_end_date: sessionData.registration_end_date || null,
        venue: sessionData.venue || null,
        max_participants: sessionData.max_participants || 50,
        current_participants: 0,
        status: sessionData.status || 'active',
        is_registration_open: sessionData.is_registration_open !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: sessionData.created_by || null,
      };
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('course_sessions')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to create course session: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating course session:', error);
      throw error;
    }
  }

  // Get all course sessions
  static async getAllCourseSessions(): Promise<CourseSession[]> {
    try {
      const { data, error } = await supabase
        .from('course_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch course sessions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching course sessions:', error);
      throw error;
    }
  }

  // Get active course sessions (registration open)
  static async getActiveCourseSessions(): Promise<CourseSession[]> {
    try {
      const { data, error } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('status', 'active')
        .eq('is_registration_open', true)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch active course sessions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching active course sessions:', error);
      throw error;
    }
  }

  // Get course session by ID
  static async getCourseSessionById(id: string): Promise<CourseSession | null> {
    try {
      const { data, error } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching course session by ID:', error);
      return null;
    }
  }

  // Get course sessions with participant information
  static async getCourseSessionsWithParticipants(): Promise<CourseSessionWithParticipants[]> {
    try {
      const sessions = await this.getAllCourseSessions();
      
      return sessions.map(session => ({
        ...session,
        participant_count: session.current_participants,
        available_spots: getAvailableSpots(session),
        is_full: isSessionFull(session),
        registration_deadline_passed: session.registration_end_date ? 
          new Date() > new Date(session.registration_end_date) : false
      }));
    } catch (error) {
      console.error('Error fetching course sessions with participants:', error);
      throw error;
    }
  }

  // Get course session options for dropdowns
  static async getCourseSessionOptions(): Promise<CourseSessionOption[]> {
    try {
      const sessions = await this.getActiveCourseSessions();
      
      return sessions.map(session => ({
        id: session.id,
        label: `${session.full_name} (${getAvailableSpots(session)} spots available)`,
        value: session.full_name,
        is_available: isRegistrationOpen(session),
        available_spots: getAvailableSpots(session),
        registration_deadline: session.registration_end_date || undefined
      }));
    } catch (error) {
      console.error('Error fetching course session options:', error);
      throw error;
    }
  }

  // Update course session
  static async updateCourseSession(id: string, updates: UpdateCourseSession): Promise<CourseSession> {
    try {
      console.log('CourseSessionService.updateCourseSession called with:', { id, updates });
      
      // Generate full name if course_name, series_name, or year is being updated
      if (updates.course_name || updates.series_name || updates.year) {
        const existingSession = await this.getCourseSessionById(id);
        if (existingSession) {
          const courseName = updates.course_name || existingSession.course_name;
          const seriesName = updates.series_name || existingSession.series_name;
          const year = updates.year || existingSession.year;
          updates.full_name = generateCourseFullName(courseName, seriesName, year);
        }
      }
      
      console.log('Final updates object:', updates);
      
      const { data, error } = await supabase
        .from('course_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating course session:', error);
        throw error;
      }

      console.log('Course session updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating course session:', error);
      throw error;
    }
  }

  // Delete course session (soft delete by setting status to cancelled)
  static async deleteCourseSession(id: string): Promise<void> {
    try {
      await this.updateCourseSession(id, { status: 'cancelled' });
      } catch (error) {
      console.error('Error deleting course session:', error);
      throw error;
    }
  }

  // Search course sessions
  static async searchCourseSessions(searchParams: CourseSessionSearch): Promise<CourseSession[]> {
    try {
      let query = supabase
        .from('course_sessions')
        .select('*');

      // Apply filters
      if (searchParams.filters) {
        const { filters } = searchParams;
        if (filters.course_name) {
          query = query.eq('course_name', filters.course_name);
        }
        if (filters.year) {
          query = query.eq('year', filters.year);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.is_registration_open !== undefined) {
          query = query.eq('is_registration_open', filters.is_registration_open);
        }
        if (filters.has_available_spots) {
          query = query.gt('max_participants', 'current_participants');
        }
      }

      // Apply text search
      if (searchParams.query) {
        query = query.or(`full_name.ilike.%${searchParams.query}%,description.ilike.%${searchParams.query}%`);
      }

      // Apply sorting
      const sortBy = searchParams.sort_by || 'created_at';
      const sortOrder = searchParams.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (searchParams.limit) {
        query = query.limit(searchParams.limit);
      }
      if (searchParams.offset) {
        query = query.range(searchParams.offset, searchParams.offset + (searchParams.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to search course sessions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error searching course sessions:', error);
      throw error;
    }
  }

  // Get course session statistics
  static async getCourseSessionStats(): Promise<CourseSessionStats> {
    try {
      const sessions = await this.getAllCourseSessions();
      
      const stats: CourseSessionStats = {
        total_sessions: sessions.length,
        active_sessions: 0,
        completed_sessions: 0,
        total_participants: 0,
        available_spots: 0,
        by_status: {},
        by_course: {}
      };
      
      sessions.forEach(session => {
        // Count by status
        stats.by_status[session.status] = (stats.by_status[session.status] || 0) + 1;
        
        // Count by course
        stats.by_course[session.course_name] = (stats.by_course[session.course_name] || 0) + 1;
        
        // Count active and completed sessions
        if (session.status === 'active') {
          stats.active_sessions++;
        } else if (session.status === 'completed') {
          stats.completed_sessions++;
        }
        
        // Sum participants and available spots
        stats.total_participants += session.current_participants;
        stats.available_spots += getAvailableSpots(session);
      });
      
      return stats;
    } catch (error) {
      console.error('Error fetching course session stats:', error);
      throw error;
    }
  }

  // Check if a course session has available spots
  static async hasAvailableSpots(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getCourseSessionById(sessionId);
      if (!session) return false;
      
      return getAvailableSpots(session) > 0;
    } catch (error) {
      console.error('Error checking available spots:', error);
      return false;
    }
  }

  // Get course sessions by year
  static async getCourseSessionsByYear(year: number): Promise<CourseSession[]> {
    try {
      const { data, error } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('year', year)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch course sessions for year ${year}: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching course sessions by year:', error);
      throw error;
    }
  }

  // Get course sessions by course name
  static async getCourseSessionsByCourseName(courseName: string): Promise<CourseSession[]> {
    try {
      const { data, error } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('course_name', courseName)
        .order('year', { ascending: false })
        .order('series_name', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch course sessions for ${courseName}: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching course sessions by course name:', error);
      throw error;
    }
  }

  // Get ended course sessions count (completed or past end date)
  static async getEndedCourseSessionsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('course_sessions')
        .select('*', { count: 'exact', head: true })
        .or('status.eq.completed,and(end_date.lt.' + new Date().toISOString() + ')');

      if (error) {
        console.error('Error fetching ended course sessions count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getEndedCourseSessionsCount:', error);
      return 0;
    }
  }

  // Attendance Tracking Methods

  // Create attendance record
  static async createAttendanceRecord(recordData: CreateAttendanceRecord): Promise<AttendanceRecord> {
    try {
      const insertData = {
        course_session_id: recordData.course_session_id,
        participant_id: recordData.participant_id,
        participant_name: recordData.participant_name,
        participant_ic: recordData.participant_ic,
        arrival_time: recordData.arrival_time || new Date().toISOString(),
        status: recordData.status || 'present',
        checked_in_by: recordData.checked_in_by || null,
        notes: recordData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('attendance_records')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to create attendance record: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating attendance record:', error);
      throw error;
    }
  }

  // Get attendance records for a course session
  static async getAttendanceRecords(courseSessionId: string): Promise<AttendanceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('course_session_id', courseSessionId)
        .order('arrival_time', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch attendance records: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      throw error;
    }
  }

  // Get attendance summary for a course session
  static async getAttendanceSummary(courseSessionId: string): Promise<AttendanceSummary> {
    try {
      const [attendanceRecords, courseSession] = await Promise.all([
        this.getAttendanceRecords(courseSessionId),
        this.getCourseSessionById(courseSessionId)
      ]);

      if (!courseSession) {
        throw new Error('Course session not found');
      }

      const totalRegistered = courseSession.max_participants;
      const totalPresent = attendanceRecords.filter(record => record.status === 'present').length;
      const totalAbsent = attendanceRecords.filter(record => record.status === 'absent').length;
      const totalLate = attendanceRecords.filter(record => record.status === 'late').length;
      const attendanceRate = totalRegistered > 0 ? (totalPresent / totalRegistered) * 100 : 0;

      return {
        course_session_id: courseSessionId,
        total_registered: totalRegistered,
        total_present: totalPresent,
        total_absent: totalAbsent,
        total_late: totalLate,
        attendance_rate: Math.round(attendanceRate * 100) / 100, // Round to 2 decimal places
        attendance_records: attendanceRecords,
      };
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      throw error;
    }
  }

  // Update attendance record
  static async updateAttendanceRecord(
    recordId: string, 
    updates: Partial<CreateAttendanceRecord>
  ): Promise<AttendanceRecord> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('attendance_records')
        .update(updateData)
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to update attendance record: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error updating attendance record:', error);
      throw error;
    }
  }

  // Delete attendance record
  static async deleteAttendanceRecord(recordId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to delete attendance record: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      throw error;
    }
  }

  // Check in participant (mark as present)
  static async checkInParticipant(
    courseSessionId: string,
    participantId: string,
    participantName: string,
    participantIc: string,
    checkedInBy?: string,
    notes?: string
  ): Promise<AttendanceRecord> {
    try {
      // Check if attendance record already exists
      const existingRecord = await supabase
        .from('attendance_records')
        .select('*')
        .eq('course_session_id', courseSessionId)
        .eq('participant_id', participantId)
        .single();

      if (existingRecord.data) {
        // Update existing record
        return await this.updateAttendanceRecord(existingRecord.data.id, {
          status: 'present',
          arrival_time: new Date().toISOString(),
          checked_in_by: checkedInBy,
          notes: notes,
        });
      } else {
        // Create new record
        return await this.createAttendanceRecord({
          course_session_id: courseSessionId,
          participant_id: participantId,
          participant_name: participantName,
          participant_ic: participantIc,
          status: 'present',
          checked_in_by: checkedInBy,
          notes: notes,
        });
      }
    } catch (error) {
      console.error('Error checking in participant:', error);
      throw error;
    }
  }

  // Mark participant as absent
  static async markParticipantAbsent(
    courseSessionId: string,
    participantId: string,
    participantName: string,
    participantIc: string,
    checkedInBy?: string,
    notes?: string
  ): Promise<AttendanceRecord> {
    try {
      // Check if attendance record already exists
      const existingRecord = await supabase
        .from('attendance_records')
        .select('*')
        .eq('course_session_id', courseSessionId)
        .eq('participant_id', participantId)
        .single();

      if (existingRecord.data) {
        // Update existing record
        return await this.updateAttendanceRecord(existingRecord.data.id, {
          status: 'absent',
          checked_in_by: checkedInBy,
          notes: notes,
        });
      } else {
        // Create new record
        return await this.createAttendanceRecord({
          course_session_id: courseSessionId,
          participant_id: participantId,
          participant_name: participantName,
          participant_ic: participantIc,
          status: 'absent',
          checked_in_by: checkedInBy,
          notes: notes,
        });
      }
    } catch (error) {
      console.error('Error marking participant absent:', error);
      throw error;
    }
  }
}
