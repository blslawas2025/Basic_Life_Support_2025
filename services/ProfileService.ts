// Profile Service Functions for managing participant/staff/admin profiles
// This file handles all database operations for the profiles table

import { Job } from '../types/JobPosition';
import { supabase } from './supabase';

// Profile interface matching the Supabase table structure
export interface Profile {
  id: string;
  email: string;
  name: string;
  phone_number: string | null;
  ic_number: string | null;
  job_position_id: string | null;
  job_position_name: string | null;
  category: 'Clinical' | 'Non-Clinical' | null; // Automatically filled from jobs table
  tempat_bertugas: string | null;
  last_bls_attempt: string | null;
  has_asthma: boolean;
  has_allergies: boolean;
  allergies_description: string | null;
  is_pregnant: boolean;
  pregnancy_weeks: number | null;
  user_type: 'participant' | 'staff' | 'admin' | 'super_admin';
  roles: 'admin' | 'staff' | 'user';
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  payment_status: 'pending' | 'paid' | 'refunded';
  course_session_id: string | null; // Reference to course session
  created_at: string;
  updated_at: string;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
}

// Interface for creating a new profile
export interface CreateProfile {
  email: string;
  name: string;
  phone_number?: string;
  ic_number?: string;
  job_position_id?: string;
  job_position_name?: string;
  grade?: string; // For UI purposes only - will be combined with job_position_name
  category?: 'Clinical' | 'Non-Clinical'; // Category from job position
  tempat_bertugas?: string;
  last_bls_attempt?: string;
  has_asthma?: boolean;
  has_allergies?: boolean;
  allergies_description?: string;
  is_pregnant?: boolean;
  pregnancy_weeks?: number;
  user_type?: 'participant' | 'staff' | 'admin' | 'super_admin';
  roles?: 'admin' | 'staff' | 'user';
  status?: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  payment_status?: 'pending' | 'paid' | 'refunded';
  course_session_id?: string; // Reference to course session
  notes?: string;
}

// Interface for updating a profile
export interface UpdateProfile {
  email?: string;
  name?: string;
  phone_number?: string;
  ic_number?: string;
  job_position_id?: string;
  job_position_name?: string;
  tempat_bertugas?: string;
  last_bls_attempt?: string;
  has_asthma?: boolean;
  has_allergies?: boolean;
  allergies_description?: string;
  is_pregnant?: boolean;
  pregnancy_weeks?: number;
  user_type?: 'participant' | 'staff' | 'admin' | 'super_admin';
  roles?: 'admin' | 'staff' | 'user';
  status?: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  payment_status?: 'pending' | 'paid' | 'refunded';
  course_session_id?: string; // Reference to course session
  notes?: string;
  approved_by?: string;
  approved_at?: string;
}

// Profile Service Class
export class ProfileService {
  // Helper method to validate UUID format
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
  // Create a new profile
  static async createProfile(profileData: CreateProfile): Promise<Profile> {
    try {
      // Handle job_position_id - if it's a string number, convert to null to avoid UUID error
      let jobPositionId = profileData.job_position_id;
      if (jobPositionId && !this.isValidUUID(jobPositionId)) {
        jobPositionId = null;
      }
      
      // Prepare data for Supabase insertion
      const insertData = {
        email: profileData.email,
        name: profileData.name,
        phone_number: profileData.phone_number || null,
        ic_number: profileData.ic_number || null,
        job_position_id: jobPositionId,
        job_position_name: profileData.job_position_name || null,
        category: profileData.category || null,
        tempat_bertugas: profileData.tempat_bertugas || null,
        last_bls_attempt: profileData.last_bls_attempt || null,
        has_asthma: profileData.has_asthma || false,
        has_allergies: profileData.has_allergies || false,
        allergies_description: profileData.allergies_description || null,
        is_pregnant: profileData.is_pregnant || false,
        pregnancy_weeks: profileData.pregnancy_weeks || null,
        user_type: profileData.user_type || 'participant',
        roles: profileData.roles || 'user', // Default role is 'user'
        status: profileData.status || 'pending',
        payment_status: profileData.payment_status || 'pending',
        course_session_id: profileData.course_session_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
        approved_by: null,
        approved_at: null,
        notes: profileData.notes || null,
      };
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('profiles')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to create profile: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  }

  // Get all profiles
  static async getAllProfiles(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch profiles: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching profiles:', error);
      throw error;
    }
  }

  // Get profile by ID
  static async getProfileById(id: string): Promise<Profile | null> {
    try {
      const profiles = await this.getAllProfiles();
      return profiles.find(profile => profile.id === id) || null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  // Get profile by email (for login)
  static async getProfileByEmail(email: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile by email:', error);
      return null;
    }
  }

  // Get profiles by user type
  static async getProfilesByUserType(userType: string): Promise<Profile[]> {
    try {
      const profiles = await this.getAllProfiles();
      return profiles.filter(profile => profile.user_type === userType);
    } catch (error) {
      console.error('Error fetching profiles by user type:', error);
      throw error;
    }
  }

  // Get profiles by status
  static async getProfilesByStatus(status: string): Promise<Profile[]> {
    try {
      const profiles = await this.getAllProfiles();
      return profiles.filter(profile => profile.status === status);
    } catch (error) {
      console.error('Error fetching profiles by status:', error);
      throw error;
    }
  }

  // Update profile
  static async updateProfile(id: string, updates: UpdateProfile): Promise<Profile> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Delete profile (soft delete by setting status to inactive)
  static async deleteProfile(id: string): Promise<void> {
    try {
      await this.updateProfile(id, { status: 'inactive' });
      } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  }

  // Approve profile
  static async approveProfile(id: string, approvedBy: string): Promise<Profile> {
    try {
      const updatedProfile = await this.updateProfile(id, {
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
      });
      
      return updatedProfile;
    } catch (error) {
      console.error('Error approving profile:', error);
      throw error;
    }
  }

  // Reject profile
  static async rejectProfile(id: string, notes?: string): Promise<Profile> {
    try {
      const updatedProfile = await this.updateProfile(id, {
        status: 'rejected',
        notes: notes || 'Application rejected',
      });
      
      return updatedProfile;
    } catch (error) {
      console.error('Error rejecting profile:', error);
      throw error;
    }
  }

  // Search profiles
  static async searchProfiles(searchTerm: string): Promise<Profile[]> {
    try {
      const profiles = await this.getAllProfiles();
      const term = searchTerm.toLowerCase();
      
      return profiles.filter(profile =>
        profile.name.toLowerCase().includes(term) ||
        profile.email.toLowerCase().includes(term) ||
        (profile.job_position_name && profile.job_position_name.toLowerCase().includes(term)) ||
        (profile.tempat_bertugas && profile.tempat_bertugas.toLowerCase().includes(term))
      );
    } catch (error) {
      console.error('Error searching profiles:', error);
      throw error;
    }
  }

  // Get profile statistics
  static async getProfileStats(): Promise<{
    total: number;
    byUserType: Record<string, number>;
    byStatus: Record<string, number>;
    pendingApprovals: number;
  }> {
    try {
      const profiles = await this.getAllProfiles();
      
      const stats = {
        total: profiles.length,
        byUserType: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        pendingApprovals: 0,
      };
      
      profiles.forEach(profile => {
        // Count by user type
        stats.byUserType[profile.user_type] = (stats.byUserType[profile.user_type] || 0) + 1;
        
        // Count by status
        stats.byStatus[profile.status] = (stats.byStatus[profile.status] || 0) + 1;
        
        // Count pending approvals
        if (profile.status === 'pending') {
          stats.pendingApprovals++;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error fetching profile stats:', error);
      throw error;
    }
  }

  // Get count of pending participants
  static async getPendingParticipantsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('user_type', 'participant');

      if (error) {
        console.error('Error fetching pending participants count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error fetching pending participants count:', error);
      return 0; // Return 0 on error to prevent UI crashes
    }
  }

  // Get total participants count from all course sessions
  static async getTotalParticipantsCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('roles', 'user');

      if (error) {
        console.error('Error fetching total participants count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error fetching total participants count:', error);
      return 0;
    }
  }

  // Get participants count by job position (grouped by base job title without grades)
  static async getParticipantsByJob(): Promise<{ job: string; count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('job_position_name')
        .eq('roles', 'user')
        .not('job_position_name', 'is', null);

      if (error) {
        console.error('Error fetching participants by job:', error);
        throw error;
      }

      // Group by base job title (remove grades like U5, U6, UD10, etc.)
      const jobCounts: { [key: string]: number } = {};
      data?.forEach(profile => {
        const fullJob = profile.job_position_name || 'Unknown';
        // Extract base job title by removing grade patterns
        const baseJob = this.extractBaseJobTitle(fullJob);
        jobCounts[baseJob] = (jobCounts[baseJob] || 0) + 1;
      });

      // Convert to array and sort by count
      return Object.entries(jobCounts)
        .map(([job, count]) => ({ job, count }))
        .sort((a, b) => b.count - a.count);
    } catch (error) {
      console.error('Error fetching participants by job:', error);
      return [];
    }
  }

  // Helper function to extract base job title without grades
  private static extractBaseJobTitle(fullJobTitle: string): string {
    if (!fullJobTitle) return 'Unknown';
    
    // Remove common grade patterns (U followed by numbers, UD followed by numbers, etc.)
    let baseJob = fullJobTitle
      .replace(/\s+U\s*\d+/g, '') // Remove " U5", " U6", "U5", "U6", etc.
      .replace(/\s+UD\s*\d+/g, '') // Remove " UD10", " UD11", etc.
      .replace(/\s+UG\s*\d+/g, '') // Remove " UG9", " UG10", etc.
      .replace(/\s+UJ\s*\d+/g, '') // Remove " UJ1", " UJ2", etc.
      .replace(/\s+UP\s*\d+/g, '') // Remove " UP1", " UP2", etc.
      .replace(/\s+U\s*\d+\s*$/g, '') // Remove trailing " U5", " U6", etc.
      .replace(/\s+UD\s*\d+\s*$/g, '') // Remove trailing " UD10", etc.
      .replace(/\s+UG\s*\d+\s*$/g, '') // Remove trailing " UG9", etc.
      .replace(/\s+UJ\s*\d+\s*$/g, '') // Remove trailing " UJ1", etc.
      .replace(/\s+UP\s*\d+\s*$/g, '') // Remove trailing " UP1", etc.
      .trim();

    // If the result is empty or just whitespace, return the original
    if (!baseJob || baseJob.length < 3) {
      return fullJobTitle;
    }

    return baseJob;
  }

  // Get total staff count (staff + admin)
  static async getTotalStaffCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('roles', ['staff', 'admin']);

      if (error) {
        console.error('Error fetching total staff count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getTotalStaffCount:', error);
      return 0;
    }
  }

  // Get staff count by clinical vs non-clinical
  static async getStaffByClinical(): Promise<{ clinical: number; nonClinical: number }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('category')
        .in('roles', ['staff', 'admin'])
        .not('category', 'is', null);

      if (error) {
        console.error('Error fetching staff by clinical type:', error);
        throw error;
      }

      let clinical = 0;
      let nonClinical = 0;

      data?.forEach(profile => {
        if (profile.category === 'Clinical') {
          clinical++;
        } else if (profile.category === 'Non-Clinical') {
          nonClinical++;
        }
      });

      return { clinical, nonClinical };
    } catch (error) {
      console.error('Error in getStaffByClinical:', error);
      return { clinical: 0, nonClinical: 0 };
    }
  }

  // Get participants count by clinical vs non-clinical
  static async getParticipantsByClinical(): Promise<{ clinical: number; nonClinical: number }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('category')
        .eq('roles', 'user')
        .not('category', 'is', null);

      if (error) {
        console.error('Error fetching participants by clinical type:', error);
        throw error;
      }

      let clinical = 0;
      let nonClinical = 0;

      data?.forEach(profile => {
        if (profile.category === 'Clinical') {
          clinical++;
        } else if (profile.category === 'Non-Clinical') {
          nonClinical++;
        }
      });

      return { clinical, nonClinical };
    } catch (error) {
      console.error('Error fetching participants by clinical type:', error);
      return { clinical: 0, nonClinical: 0 };
    }
  }

  // Get all pending participants
  static async getPendingParticipants(): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .eq('user_type', 'participant')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending participants:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching pending participants:', error);
      return []; // Return empty array on error
    }
  }

  // Get participants by course session
  static async getParticipantsByCourseSession(courseSessionId: string): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('course_session_id', courseSessionId)
        .eq('user_type', 'participant')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching participants by course session:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching participants by course session:', error);
      return [];
    }
  }

  // Get participants by course session and status
  static async getParticipantsByCourseSessionAndStatus(
    courseSessionId: string, 
    status: string
  ): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('course_session_id', courseSessionId)
        .eq('user_type', 'participant')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching participants by course session and status:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching participants by course session and status:', error);
      return [];
    }
  }

  // Get course session statistics for participants
  static async getCourseSessionParticipantStats(courseSessionId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    active: number;
    inactive: number;
  }> {
    try {
      const participants = await this.getParticipantsByCourseSession(courseSessionId);
      
      const stats = {
        total: participants.length,
        pending: 0,
        approved: 0,
        rejected: 0,
        active: 0,
        inactive: 0,
      };
      
      participants.forEach(participant => {
        switch (participant.status) {
          case 'pending':
            stats.pending++;
            break;
          case 'approved':
            stats.approved++;
            break;
          case 'rejected':
            stats.rejected++;
            break;
          case 'active':
            stats.active++;
            break;
          case 'inactive':
            stats.inactive++;
            break;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error fetching course session participant stats:', error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        active: 0,
        inactive: 0,
      };
    }
  }

  // Search participants by course session
  static async searchParticipantsByCourseSession(
    courseSessionId: string, 
    searchTerm: string
  ): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('course_session_id', courseSessionId)
        .eq('user_type', 'participant')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,ic_number.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching participants by course session:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error searching participants by course session:', error);
      return [];
    }
  }

  // Update participant's course session
  static async updateParticipantCourseSession(
    participantId: string, 
    courseSessionId: string
  ): Promise<Profile> {
    try {
      const updatedProfile = await this.updateProfile(participantId, {
        course_session_id: courseSessionId,
      });
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating participant course session:', error);
      throw error;
    }
  }

  // Assign all profiles with user roles to a specific course session
  static async assignAllProfilesToCourseSession(courseSessionId: string): Promise<{
    success: boolean;
    message: string;
    stats: {
      totalProfiles: number;
      updatedProfiles: number;
      errorCount: number;
      breakdown: Record<string, number>;
    };
  }> {
    try {
      // Get all profiles with user roles
      const allProfiles = await this.getAllProfiles();
      const userProfiles = allProfiles.filter(profile => 
        ['participant', 'staff', 'admin', 'super_admin'].includes(profile.user_type)
      );

      // Filter profiles that don't already have a course session
      const profilesToUpdate = userProfiles.filter(profile => !profile.course_session_id);
      if (profilesToUpdate.length === 0) {
        return {
          success: true,
          message: 'All profiles already have course sessions assigned',
          stats: {
            totalProfiles: userProfiles.length,
            updatedProfiles: 0,
            errorCount: 0,
            breakdown: {}
          }
        };
      }

      // Update profiles in batches
      let updatedCount = 0;
      let errorCount = 0;
      const breakdown: Record<string, number> = {};

      for (const profile of profilesToUpdate) {
        try {
          await this.updateProfile(profile.id, {
            course_session_id: courseSessionId
          });
          
          updatedCount++;
          breakdown[profile.user_type] = (breakdown[profile.user_type] || 0) + 1;
        } catch (error) {
          console.error(`❌ Error updating profile ${profile.name}:`, error);
          errorCount++;
        }
      }

      return {
        success: true,
        message: `Successfully assigned ${updatedCount} profiles to course session`,
        stats: {
          totalProfiles: userProfiles.length,
          updatedProfiles: updatedCount,
          errorCount: errorCount,
          breakdown: breakdown
        }
      };

    } catch (error) {
      console.error('❌ Bulk assignment failed:', error);
      return {
        success: false,
        message: `Bulk assignment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stats: {
          totalProfiles: 0,
          updatedProfiles: 0,
          errorCount: 0,
          breakdown: {}
        }
      };
    }
  }
}
