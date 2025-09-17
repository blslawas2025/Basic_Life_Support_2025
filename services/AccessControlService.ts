// Access Control Service for Test Questions
// Handles approval-based access control with usage tracking and expiration

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

      // Save the request
      const allRequests = await this.getAllAccessRequests();
      allRequests.push(newRequest);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allRequests));

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

      // Check if access has expired
      if (request.expiresAt && new Date(request.expiresAt) <= new Date()) {
        request.status = 'expired';
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allRequests));
        return { success: false, message: 'Access has expired', expired: true };
      }

      // Increment usage count
      request.usageCount += 1;

      // Check if usage limit reached
      if (request.usageCount >= request.maxUsage) {
        request.status = 'used';
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allRequests));
        return { 
          success: true, 
          message: 'Access used successfully. Access has expired after reaching usage limit.',
          expired: true 
        };
      }

      // Update request
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
      const allRequests = await this.getAllAccessRequests();
      const request = allRequests.find(req => req.id === requestId);

      if (!request) {
        return { success: false, message: 'Access request not found' };
      }

      if (request.status !== 'pending') {
        return { success: false, message: 'Request is not pending approval' };
      }

      // Approve the request
      request.status = 'approved';
      request.approvedAt = new Date().toISOString();
      request.approvedBy = approvedBy;
      request.adminNotes = adminNotes;

      // Set expiry date
      const settings = await this.getSettings();
      request.expiresAt = new Date(
        Date.now() + settings.expirySettings.defaultExpiryHours * 60 * 60 * 1000
      ).toISOString();

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allRequests));
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
      const allRequests = await this.getAllAccessRequests();
      const request = allRequests.find(req => req.id === requestId);

      if (!request) {
        return { success: false, message: 'Access request not found' };
      }

      if (request.status !== 'pending') {
        return { success: false, message: 'Request is not pending approval' };
      }

      // Reject the request
      request.status = 'rejected';
      request.approvedBy = rejectedBy;
      request.adminNotes = reason;

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allRequests));
      return { success: false, message: 'Access request rejected' };
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
      const allRequests = await this.getAllAccessRequests();
      const request = allRequests.find(req => req.id === requestId);

      if (!request) {
        return { success: false, message: 'Access request not found' };
      }

      if (request.status !== 'approved') {
        return { success: false, message: 'Request is not approved' };
      }

      // Check extension limit
      const settings = await this.getSettings();
      const currentExtensions = (request as any).extensions || 0;
      if (currentExtensions >= settings.expirySettings.maxExtensions) {
        return { success: false, message: 'Maximum extensions reached' };
      }

      // Extend access
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
