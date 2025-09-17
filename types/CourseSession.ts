// TypeScript interfaces for Course Sessions
// This file defines the structure for managing different BLS course sessions

// Course Session interface matching the Supabase table structure
export interface CourseSession {
  id: string;
  course_name: string; // "BLS", "ACLS", "PALS", etc.
  series_name: string; // "Siri 1", "Siri 2", "Siri 3"
  year: number; // 2025, 2026, etc.
  full_name: string; // "BLS Siri 1 2025", "BLS Siri 2 2025"
  description?: string;
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  registration_start_date?: string; // ISO date string
  registration_end_date?: string; // ISO date string
  venue?: string; // Training venue/location
  max_participants: number;
  current_participants: number;
  status: 'active' | 'inactive' | 'completed' | 'cancelled' | 'draft';
  is_registration_open: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Interface for creating a new course session
export interface CreateCourseSession {
  course_name: string;
  series_name: string;
  year: number;
  full_name?: string; // Will be auto-generated if not provided
  description?: string;
  start_date?: string;
  end_date?: string;
  registration_start_date?: string;
  registration_end_date?: string;
  venue?: string; // Training venue/location
  max_participants?: number;
  status?: 'active' | 'inactive' | 'completed' | 'cancelled' | 'draft';
  is_registration_open?: boolean;
  created_by?: string;
}

// Interface for updating a course session
export interface UpdateCourseSession {
  course_name?: string;
  series_name?: string;
  year?: number;
  full_name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  registration_start_date?: string;
  registration_end_date?: string;
  venue?: string; // Training venue/location
  max_participants?: number;
  status?: 'active' | 'inactive' | 'completed' | 'cancelled' | 'draft';
  is_registration_open?: boolean;
}

// Interface for course session statistics
export interface CourseSessionStats {
  total_sessions: number;
  active_sessions: number;
  completed_sessions: number;
  total_participants: number;
  available_spots: number;
  by_status: Record<string, number>;
  by_course: Record<string, number>;
}

// Interface for course session with participant count
export interface CourseSessionWithParticipants extends CourseSession {
  participant_count: number;
  available_spots: number;
  is_full: boolean;
  registration_deadline_passed: boolean;
}

// Interface for course session selection (for dropdowns)
export interface CourseSessionOption {
  id: string;
  label: string; // Display text for dropdown
  value: string; // Full name
  is_available: boolean;
  available_spots: number;
  registration_deadline?: string;
}

// Enum for course types
export enum CourseType {
  BLS = 'BLS',
  ACLS = 'ACLS',
  PALS = 'PALS',
  FIRST_AID = 'First Aid',
  CPR = 'CPR'
}

// Enum for course session status
export enum CourseSessionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DRAFT = 'draft'
}

// Interface for course session filters
export interface CourseSessionFilters {
  course_name?: string;
  year?: number;
  status?: CourseSessionStatus;
  is_registration_open?: boolean;
  has_available_spots?: boolean;
}

// Interface for course session search
export interface CourseSessionSearch {
  query?: string;
  filters?: CourseSessionFilters;
  sort_by?: 'created_at' | 'start_date' | 'full_name' | 'current_participants';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Interface for attendance tracking
export interface AttendanceRecord {
  id: string;
  course_session_id: string;
  participant_id: string;
  participant_name: string;
  participant_ic: string;
  arrival_time: string; // ISO date string
  status: 'present' | 'absent' | 'late';
  checked_in_by?: string; // Staff member who checked them in
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Interface for creating attendance record
export interface CreateAttendanceRecord {
  course_session_id: string;
  participant_id: string;
  participant_name: string;
  participant_ic: string;
  arrival_time?: string; // Defaults to current time
  status?: 'present' | 'absent' | 'late';
  checked_in_by?: string;
  notes?: string;
}

// Interface for attendance summary
export interface AttendanceSummary {
  course_session_id: string;
  total_registered: number;
  total_present: number;
  total_absent: number;
  total_late: number;
  attendance_rate: number; // Percentage
  attendance_records: AttendanceRecord[];
}

// Helper function to generate full course name
export const generateCourseFullName = (courseName: string, seriesName: string, year: number): string => {
  return `${courseName} ${seriesName} ${year}`;
};

// Helper function to check if registration is open
export const isRegistrationOpen = (session: CourseSession): boolean => {
  if (!session.is_registration_open) return false;
  if (session.status !== 'active') return false;
  if (session.current_participants >= session.max_participants) return false;
  
  const now = new Date();
  if (session.registration_end_date) {
    const endDate = new Date(session.registration_end_date);
    if (now > endDate) return false;
  }
  
  return true;
};

// Helper function to get available spots
export const getAvailableSpots = (session: CourseSession): number => {
  return Math.max(0, session.max_participants - session.current_participants);
};

// Helper function to check if session is full
export const isSessionFull = (session: CourseSession): boolean => {
  return session.current_participants >= session.max_participants;
};

// Helper function to format course session for display
export const formatCourseSessionDisplay = (session: CourseSession): string => {
  const spots = getAvailableSpots(session);
  const status = session.is_registration_open ? 'Open' : 'Closed';
  return `${session.full_name} (${spots} spots available, ${status})`;
};
