// Access Control Service for Test Questions
// Handles approval-based access control with usage tracking and expiration
import { supabase } from '../config/supabase';

export interface AccessRequest {
  id: string;
  userId: string;
  testType: 'pre_test' | 'post_test';
  poolId: string;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  expiresAt?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'used';
  usageCount: number;
  maxUsage: number;
  reason?: string;
  adminNotes?: string;
}

export interface AccessControlSettings {
  enableApprovalBasedAccess: boolean;
  defaultMaxUsage: number;
  autoApprove: boolean;
  approvalRequiredFor: ('pre_test' | 'post_test')[];
  notificationSettings: {
    notifyOnRequest: boolean;
    notifyOnApproval: boolean;
    notifyOnExpiry: boolean;
  };
  expirySettings: {
    defaultExpiryHours: number;
    extendOnUse: boolean;
    maxExtensions: number;
  };
}

export class AccessControlService {
  private static readonly STORAGE_KEY = 'access_control_requests';
  private static readonly SETTINGS_KEY = 'access_control_settings';

  // Default settings
  private static defaultSettings: AccessControlSettings = {
    enableApprovalBasedAccess: true,
    defaultMaxUsage: 1,
    autoApprove: false,
    approvalRequiredFor: ['pre_test', 'post_test'],
    notificationSettings: {
      notifyOnRequest: true,
      notifyOnApproval: true,
      notifyOnExpiry: true,
    },
    expirySettings: {
      defaultExpiryHours: 24,
      extendOnUse: false,
      maxExtensions: 3,
    },
  };

  // Get access control settings
  static async getSettings(): Promise<AccessControlSettings> {
    try {
      const stored = localStorage.getItem(this.SETTINGS_KEY);
      if (stored) {
        return { ...this.defaultSettings, ...JSON.parse(stored) };
      }
      return this.defaultSettings;
    } catch (error) {
      console.error('Error loading access control settings:', error);
      return this.defaultSettings;
    }
  }

  // Update access control settings
  static async updateSettings(settings: Partial<AccessControlSettings>): Promise<boolean> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));
      return true;
    } catch (error) {
      console.error('Error updating access control settings:', error);
      return false;
    }
  }

  // Check if user has access to a test
  static async hasAccess(
    userId: string, 
    testType: 'pre_test' | 'post_test', 
    poolId: string
  ): Promise<{ hasAccess: boolean; reason?: string; requestId?: string }> {
    try {
      const settings = await this.getSettings();
      
      // If approval-based access is disabled, allow access
      if (!settings.enableApprovalBasedAccess) {
        return { hasAccess: true };
      }

      // Check if test type requires approval
      if (!settings.approvalRequiredFor.includes(testType)) {
        return { hasAccess: true };
      }

      // Get user's access requests
      const requests = await this.getUserAccessRequests(userId);
      const activeRequest = requests.find(req => 
        req.testType === testType && 
        req.poolId === poolId && 
        req.status === 'approved' &&
        (!req.expiresAt || new Date(req.expiresAt) > new Date()) &&
        req.usageCount < req.maxUsage
      );

      if (activeRequest) {
        return { hasAccess: true, requestId: activeRequest.id };
      }

      // Check if there's a pending request
      const pendingRequest = requests.find(req => 
        req.testType === testType && 
        req.poolId === poolId && 
        req.status === 'pending'
      );

      if (pendingRequest) {
        return { 
          hasAccess: false, 
          reason: 'Access request is pending approval',
          requestId: pendingRequest.id
        };
      }

      return { 
        hasAccess: false, 
        reason: 'No approved access found. Please request access first.' 
      };
    } catch (error) {
      console.error('Error checking access:', error);
      return { hasAccess: false, reason: 'Error checking access' };
    }
  }

  // Request access to a test
  static async requestAccess(
    userId: string,
    testType: 'pre_test' | 'post_test',
    poolId: string,
    reason?: string
  ): Promise<{ success: boolean; requestId?: string; message: string }> {
    try {
      const settings = await this.getSettings();
      
      // Check if approval is required
      if (!settings.enableApprovalBasedAccess || !settings.approvalRequiredFor.includes(testType)) {
        return { success: false, message: 'Approval not required for this test type' };
      }

      // Check if there's already a pending or approved request
      const existingRequests = await this.getUserAccessRequests(userId);
      const existingRequest = existingRequests.find(req => 
        req.testType === testType && 
        req.poolId === poolId && 
        (req.status === 'pending' || req.status === 'approved')
      );

      if (existingRequest) {
        return { 
          success: false, 
          message: existingRequest.status === 'pending' 
            ? 'Access request is already pending' 
            : 'Access is already approved'
        };
      }

      // Create new access request
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newRequest: AccessRequest = {
        id: requestId,
        userId,
        testType,
        poolId,
        requestedAt: new Date().toISOString(),
        status: settings.autoApprove ? 'approved' : 'pending',
        usageCount: 0,
        maxUsage: settings.defaultMaxUsage,
        reason: reason || 'Test access requested',
        ...(settings.autoApprove && {
          approvedAt: new Date().toISOString(),
          approvedBy: 'system',
          expiresAt: new Date(Date.now() + settings.expirySettings.defaultExpiryHours * 60 * 60 * 1000).toISOString(),
        }),
      };

      // Save the request to Supabase (fallback to local on error)
      const { data: inserted, error } = await supabase.from('access_requests').insert({
        user_id: userId,
        test_type: testType,
        pool_id: poolId,
        requested_at: newRequest.requestedAt,
        status: newRequest.status,
        usage_count: newRequest.usageCount,
        max_usage: newRequest.maxUsage,
        reason: newRequest.reason,
        approved_at: newRequest.approvedAt || null,
        approved_by: newRequest.approvedBy || null,
        expires_at: newRequest.expiresAt || null,
      }).select('id').single();

      if (error) {
        const allRequests = await this.getAllAccessRequests();
        allRequests.push(newRequest);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allRequests));
      } else if (inserted && inserted.id) {
        newRequest.id = inserted.id;
      }

      return { 
        success: true, 
        requestId,
        message: settings.autoApprove 
          ? 'Access approved automatically' 
          : 'Access request submitted for approval'
      };
    } catch (error) {
      console.error('Error requesting access:', error);
      return { success: false, message: 'Failed to submit access request' };
    }
  }

  // Use access (increment usage count)
  static async useAccess(
    userId: string,
    testType: 'pre_test' | 'post_test',
    poolId: string
  ): Promise<{ success: boolean; message: string; expired?: boolean }> {
    try {
      // Supabase-first update
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('test_type', testType)
        .eq('pool_id', poolId)
        .eq('status', 'approved')
        .maybeSingle();

      if (!error && data) {
        if (data.expires_at && new Date(data.expires_at) <= new Date()) {
          await supabase.from('access_requests').update({ status: 'expired' }).eq('id', data.id);
          return { success: false, message: 'Access has expired', expired: true };
        }
        const newCount = (data.usage_count || 0) + 1;
        const newStatus = newCount >= (data.max_usage || 1) ? 'used' : 'approved';
        await supabase.from('access_requests').update({ usage_count: newCount, status: newStatus }).eq('id', data.id);
        return {
          success: true,
          message: newStatus === 'used' ? 'Access used successfully. Access has expired after reaching usage limit.' : 'Access used successfully',
          expired: newStatus === 'used'
        };
      }

      // Fallback to local storage
      const allRequests = await this.getAllAccessRequests();
      const request = allRequests.find(req => 
        req.userId === userId && 
        req.testType === testType && 
        req.poolId === poolId && 
        req.status === 'approved'
      );

      if (!request) {
        return { success: false, message: 'No approved access found' };
      }

      if (request.expiresAt && new Date(request.expiresAt) <= new Date()) {
        request.status = 'expired';
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allRequests));
        return { success: false, message: 'Access has expired', expired: true };
      }

      request.usageCount += 1;
      if (request.usageCount >= request.maxUsage) {
        request.status = 'used';
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allRequests));
        return { success: true, message: 'Access used successfully. Access has expired after reaching usage limit.', expired: true };
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allRequests));
      return { success: true, message: 'Access used successfully' };
    } catch (error) {
      console.error('Error using access:', error);
      return { success: false, message: 'Failed to use access' };
    }
  }

  // Get user's access requests
  static async getUserAccessRequests(userId: string): Promise<AccessRequest[]> {
    try {
      // Try Supabase first for multi-device
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .eq('user_id', userId)
        .order('requested_at', { ascending: false });

      if (!error && data) {
        return data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          testType: r.test_type,
          poolId: r.pool_id,
          requestedAt: r.requested_at,
          approvedAt: r.approved_at || undefined,
          approvedBy: r.approved_by || undefined,
          expiresAt: r.expires_at || undefined,
          status: r.status,
          usageCount: r.usage_count,
          maxUsage: r.max_usage,
          reason: r.reason || undefined,
          adminNotes: r.admin_notes || undefined,
        }));
      }

      const allRequests = await this.getAllAccessRequests();
      return allRequests.filter(req => req.userId === userId);
    } catch (error) {
      console.error('Error getting user access requests:', error);
      return [];
    }
  }

  // Get all access requests (admin function)
  static async getAllAccessRequests(): Promise<AccessRequest[]> {
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (!error && data) {
        return data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          testType: r.test_type,
          poolId: r.pool_id,
          requestedAt: r.requested_at,
          approvedAt: r.approved_at || undefined,
          approvedBy: r.approved_by || undefined,
          expiresAt: r.expires_at || undefined,
          status: r.status,
          usageCount: r.usage_count,
          maxUsage: r.max_usage,
          reason: r.reason || undefined,
          adminNotes: r.admin_notes || undefined,
        }));
      }

      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting all access requests:', error);
      return [];
    }
  }

  // Approve access request (admin function)
  static async approveAccessRequest(
    requestId: string, 
    approvedBy: string, 
    adminNotes?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const settings = await this.getSettings();
      const { error } = await supabase
        .from('access_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: null,
          admin_notes: adminNotes || null,
          expires_at: new Date(Date.now() + settings.expirySettings.defaultExpiryHours * 60 * 60 * 1000).toISOString()
        })
        .filter('id', 'eq', requestId);

      if (error) {
        // Fallback local update
        const allRequests = await this.getAllAccessRequests();
        const request = allRequests.find(req => req.id === requestId);
        if (!request) return { success: false, message: 'Access request not found' };
        if (request.status !== 'pending') return { success: false, message: 'Request is not pending approval' };
        request.status = 'approved';
        request.approvedAt = new Date().toISOString();
        request.approvedBy = approvedBy;
        request.adminNotes = adminNotes;
        request.expiresAt = new Date(Date.now() + settings.expirySettings.defaultExpiryHours * 60 * 60 * 1000).toISOString();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allRequests));
      }
      return { success: true, message: 'Access request approved successfully' };
    } catch (error) {
      console.error('Error approving access request:', error);
      return { success: false, message: 'Failed to approve access request' };
    }
  }

  // Reject access request (admin function)
  static async rejectAccessRequest(
    requestId: string, 
    rejectedBy: string, 
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ status: 'rejected', approved_by: null, admin_notes: reason || null })
        .filter('id', 'eq', requestId);

      if (error) {
        const allRequests = await this.getAllAccessRequests();
        const request = allRequests.find(req => req.id === requestId);
        if (!request) return { success: false, message: 'Access request not found' };
        if (request.status !== 'pending') return { success: false, message: 'Request is not pending approval' };
        request.status = 'rejected';
        request.approvedBy = rejectedBy;
        request.adminNotes = reason;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allRequests));
      }
      return { success: true, message: 'Access request rejected' };
    } catch (error) {
      console.error('Error rejecting access request:', error);
      return { success: false, message: 'Failed to reject access request' };
    }
  }

  // Extend access (admin function)
  static async extendAccess(
    requestId: string,
    additionalHours: number,
    extendedBy: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase
        .from('access_requests')
        .select('expires_at, extensions')
        .eq('id', requestId)
        .single();

      if (!error && data) {
        const settings = await this.getSettings();
        const currentExtensions = (data.extensions || 0) as number;
        if (currentExtensions >= settings.expirySettings.maxExtensions) {
          return { success: false, message: 'Maximum extensions reached' };
        }
        const currentExpiry = data.expires_at ? new Date(data.expires_at) : new Date();
        const newExpiry = new Date(currentExpiry.getTime() + additionalHours * 60 * 60 * 1000).toISOString();
        const { error: updErr } = await supabase
          .from('access_requests')
          .update({ expires_at: newExpiry, extensions: currentExtensions + 1 })
          .filter('id', 'eq', requestId);
        if (!updErr) return { success: true, message: 'Access extended successfully' };
      }

      // Fallback local update
      const allRequests = await this.getAllAccessRequests();
      const request = allRequests.find(req => req.id === requestId);
      if (!request) return { success: false, message: 'Access request not found' };
      if (request.status !== 'approved') return { success: false, message: 'Request is not approved' };
      const settings = await this.getSettings();
      const currentExtensions = (request as any).extensions || 0;
      if (currentExtensions >= settings.expirySettings.maxExtensions) return { success: false, message: 'Maximum extensions reached' };
      const currentExpiry = request.expiresAt ? new Date(request.expiresAt) : new Date();
      request.expiresAt = new Date(currentExpiry.getTime() + additionalHours * 60 * 60 * 1000).toISOString();
      (request as any).extensions = currentExtensions + 1;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allRequests));
      return { success: true, message: 'Access extended successfully' };
    } catch (error) {
      console.error('Error extending access:', error);
      return { success: false, message: 'Failed to extend access' };
    }
  }

  // Get access statistics (admin function)
  static async getAccessStatistics(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    expiredRequests: number;
    usedRequests: number;
  }> {
    try {
      const allRequests = await this.getAllAccessRequests();
      
      return {
        totalRequests: allRequests.length,
        pendingRequests: allRequests.filter(req => req.status === 'pending').length,
        approvedRequests: allRequests.filter(req => req.status === 'approved').length,
        rejectedRequests: allRequests.filter(req => req.status === 'rejected').length,
        expiredRequests: allRequests.filter(req => req.status === 'expired').length,
        usedRequests: allRequests.filter(req => req.status === 'used').length,
      };
    } catch (error) {
      console.error('Error getting access statistics:', error);
      return {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        expiredRequests: 0,
        usedRequests: 0,
      };
    }
  }
}
