import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, Alert, TextInput, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { AccessControlService, AccessRequest, AccessControlSettings } from "../services/AccessControlService";

const { width, height } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 414;
const isLargeScreen = width >= 414;

const getResponsiveSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

const getResponsiveFontSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

const getResponsivePadding = () => {
  if (isSmallScreen) return 16;
  if (isMediumScreen) return 20;
  return 24;
};

interface AccessControlManagementScreenProps {
  onBack: () => void;
  userRole?: 'admin' | 'staff' | 'user';
  isSuperAdmin?: boolean;
}

export default function AccessControlManagementScreen({ onBack, userRole = 'user', isSuperAdmin = false }: AccessControlManagementScreenProps) {
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [settings, setSettings] = useState<AccessControlSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'expired' | 'used'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendHours, setExtendHours] = useState('24');
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [editedSettings, setEditedSettings] = useState<AccessControlSettings | null>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    startAnimations();
    loadData();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [requests, settingsData] = await Promise.all([
        AccessControlService.getAllAccessRequests(),
        AccessControlService.getSettings()
      ]);
      setAccessRequests(requests);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading access control data:', error);
      Alert.alert('Error', 'Failed to load access control data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async (request: AccessRequest) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const result = await AccessControlService.approveAccessRequest(
        request.id,
        'admin', // In real app, this would be the current admin's ID
        adminNotes.trim() || undefined
      );
      
      if (result.success) {
        Alert.alert('Success', result.message);
        await loadData();
        setShowRequestDetails(false);
        setAdminNotes('');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert('Error', 'Failed to approve access request');
    }
  };

  const handleRejectRequest = async (request: AccessRequest) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const result = await AccessControlService.rejectAccessRequest(
        request.id,
        'admin', // In real app, this would be the current admin's ID
        rejectionReason.trim() || undefined
      );
      
      if (result.success) {
        Alert.alert('Success', result.message);
        await loadData();
        setShowRequestDetails(false);
        setRejectionReason('');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject access request');
    }
  };

  const handleExtendAccess = async (request: AccessRequest) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const hours = parseInt(extendHours);
      if (isNaN(hours) || hours <= 0) {
        Alert.alert('Error', 'Please enter a valid number of hours');
        return;
      }
      
      const result = await AccessControlService.extendAccess(
        request.id,
        hours,
        'admin' // In real app, this would be the current admin's ID
      );
      
      if (result.success) {
        Alert.alert('Success', result.message);
        await loadData();
        setShowExtendModal(false);
        setExtendHours('24');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error extending access:', error);
      Alert.alert('Error', 'Failed to extend access');
    }
  };

  const handleEditSettings = () => {
    if (settings) {
      setEditedSettings({ ...settings });
      setIsEditingSettings(true);
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (!editedSettings) return;

      const success = await AccessControlService.updateSettings(editedSettings);
      if (success) {
        setSettings(editedSettings);
        setIsEditingSettings(false);
        Alert.alert('Success', 'Settings updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleCancelEdit = () => {
    setEditedSettings(null);
    setIsEditingSettings(false);
  };

  const updateSetting = (key: keyof AccessControlSettings, value: any) => {
    if (editedSettings) {
      setEditedSettings({
        ...editedSettings,
        [key]: value
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffaa00';
      case 'approved': return '#00ff88';
      case 'rejected': return '#ff6b6b';
      case 'expired': return '#666666';
      case 'used': return '#8b5cf6';
      default: return '#ffffff';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time';
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      case 'expired': return 'hourglass';
      case 'used': return 'checkmark-done';
      default: return 'help-circle';
    }
  };

  const filteredRequests = accessRequests.filter(request => {
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      request.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.testType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.poolId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const renderRequestCard = (request: AccessRequest) => (
    <Animated.View
      key={request.id}
      style={[
        styles.requestCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <LinearGradient
        colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
        style={styles.requestCardGradient}
      >
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <Text style={styles.requestId}>#{request.id.slice(-8)}</Text>
            <View style={styles.statusContainer}>
              <Ionicons 
                name={getStatusIcon(request.status)} 
                size={getResponsiveSize(16, 18, 20)} 
                color={getStatusColor(request.status)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                {request.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedRequest(request);
              setShowRequestDetails(true);
            }}
          >
            <Ionicons name="eye" size={getResponsiveSize(16, 18, 20)} color="#00d4ff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.requestDetails}>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>User:</Text> {request.userId}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Test:</Text> {request.testType.replace('_', ' ').toUpperCase()}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Pool:</Text> {request.poolId}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Usage:</Text> {request.usageCount}/{request.maxUsage}
          </Text>
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Requested:</Text> {new Date(request.requestedAt).toLocaleDateString()}
          </Text>
          {request.expiresAt && (
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Expires:</Text> {new Date(request.expiresAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <View style={styles.loadingContent}>
          <Ionicons name="shield-checkmark" size={getResponsiveSize(48, 56, 64)} color="#667eea" />
          <Text style={styles.loadingText}>Loading Access Control...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <Animated.View style={[styles.header, { transform: [{ scale: fadeAnim }] }]}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={getResponsiveSize(24, 26, 28)} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Access Control</Text>
            <Text style={styles.headerSubtitle}>Manage test access permissions</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettings(true)}
            >
              <Ionicons name="settings" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={getResponsiveSize(20, 22, 24)} color="#667eea" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search requests..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {['all', 'pending', 'approved', 'rejected', 'expired', 'used'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.activeFilter
              ]}
              onPress={() => setFilterStatus(status as any)}
            >
              <Text style={[
                styles.filterText,
                filterStatus === status && styles.activeFilterText
              ]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={getResponsiveSize(64, 72, 80)} color="#667eea" />
            <Text style={styles.emptyTitle}>No Access Requests</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No requests match your search' : 'No access requests found'}
            </Text>
          </View>
        ) : (
          filteredRequests.map(renderRequestCard)
        )}
      </ScrollView>

      {/* Request Details Modal */}
      <Modal
        visible={showRequestDetails}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRequestDetails(false)}
            >
              <Ionicons name="close" size={getResponsiveSize(24, 26, 28)} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Request Details</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          
          {selectedRequest && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>Request Information</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Request ID:</Text>
                    <Text style={styles.detailValue}>#{selectedRequest.id.slice(-8)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>User ID:</Text>
                    <Text style={styles.detailValue}>{selectedRequest.userId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Test Type:</Text>
                    <Text style={styles.detailValue}>{selectedRequest.testType.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pool ID:</Text>
                    <Text style={styles.detailValue}>{selectedRequest.poolId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, { color: getStatusColor(selectedRequest.status) }]}>
                      {selectedRequest.status.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Usage:</Text>
                    <Text style={styles.detailValue}>{selectedRequest.usageCount}/{selectedRequest.maxUsage}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Requested:</Text>
                    <Text style={styles.detailValue}>{new Date(selectedRequest.requestedAt).toLocaleString()}</Text>
                  </View>
                  {selectedRequest.approvedAt && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Approved:</Text>
                      <Text style={styles.detailValue}>{new Date(selectedRequest.approvedAt).toLocaleString()}</Text>
                    </View>
                  )}
                  {selectedRequest.expiresAt && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Expires:</Text>
                      <Text style={styles.detailValue}>{new Date(selectedRequest.expiresAt).toLocaleString()}</Text>
                    </View>
                  )}
                  {selectedRequest.reason && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Reason:</Text>
                      <Text style={styles.detailValue}>{selectedRequest.reason}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Admin Actions */}
              {selectedRequest.status === 'pending' && (
                <View style={styles.actionsCard}>
                  <Text style={styles.actionsTitle}>Admin Actions</Text>
                  
                  <Text style={styles.inputLabel}>Admin Notes (Optional)</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Add notes for this request..."
                    placeholderTextColor="rgba(0, 0, 0, 0.5)"
                    value={adminNotes}
                    onChangeText={setAdminNotes}
                    multiline
                    numberOfLines={3}
                  />
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApproveRequest(selectedRequest)}
                    >
                      <Ionicons name="checkmark" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleRejectRequest(selectedRequest)}
                    >
                      <Ionicons name="close" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {selectedRequest.status === 'approved' && (
                <View style={styles.actionsCard}>
                  <Text style={styles.actionsTitle}>Access Management</Text>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.extendButton]}
                    onPress={() => setShowExtendModal(true)}
                  >
                    <Ionicons name="time" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Extend Access</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Extend Access Modal */}
      <Modal
        visible={showExtendModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.extendModal}>
            <Text style={styles.extendModalTitle}>Extend Access</Text>
            <Text style={styles.extendModalText}>
              How many additional hours would you like to extend this access?
            </Text>
            
            <TextInput
              style={styles.numberInput}
              placeholder="24"
              placeholderTextColor="rgba(0, 0, 0, 0.5)"
              value={extendHours}
              onChangeText={setExtendHours}
              keyboardType="numeric"
            />
            
            <View style={styles.extendModalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowExtendModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => selectedRequest && handleExtendAccess(selectedRequest)}
              >
                <Text style={styles.confirmButtonText}>Extend</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSettings(false)}
            >
              <Ionicons name="close" size={getResponsiveSize(24, 26, 28)} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Access Control Settings</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.settingsCard}>
              <View style={styles.settingsHeader}>
                <Text style={styles.settingsCardTitle}>Access Control Configuration</Text>
                {isSuperAdmin && !isEditingSettings && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEditSettings}
                  >
                    <Ionicons name="create-outline" size={getResponsiveSize(16, 18, 20)} color="#667eea" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.settingsCardDescription}>
                Configure how access control works for your tests
              </Text>
              
              {(isEditingSettings ? editedSettings : settings) && (
                <View style={styles.settingsContent}>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Enable Approval-Based Access</Text>
                    <Text style={styles.settingDescription}>
                      Require admin approval for test access
                    </Text>
                    {isEditingSettings ? (
                      <TouchableOpacity
                        style={[styles.toggleButton, (editedSettings?.enableApprovalBasedAccess ? styles.toggleOn : styles.toggleOff)]}
                        onPress={() => updateSetting('enableApprovalBasedAccess', !editedSettings?.enableApprovalBasedAccess)}
                      >
                        <Text style={[styles.toggleText, (editedSettings?.enableApprovalBasedAccess ? styles.toggleTextOn : styles.toggleTextOff)]}>
                          {editedSettings?.enableApprovalBasedAccess ? 'Enabled' : 'Disabled'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.settingValue}>
                        <Text style={styles.settingValueText}>
                          {settings?.enableApprovalBasedAccess ? 'Enabled' : 'Disabled'}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Default Max Usage</Text>
                    <Text style={styles.settingDescription}>
                      Number of times access can be used before expiring
                    </Text>
                    {isEditingSettings ? (
                      <TextInput
                        style={styles.numberInput}
                        value={editedSettings?.defaultMaxUsage.toString() || '1'}
                        onChangeText={(text) => {
                          const num = parseInt(text) || 1;
                          updateSetting('defaultMaxUsage', Math.max(1, num));
                        }}
                        keyboardType="numeric"
                      />
                    ) : (
                      <View style={styles.settingValue}>
                        <Text style={styles.settingValueText}>
                          {settings?.defaultMaxUsage} time(s)
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Auto Approve</Text>
                    <Text style={styles.settingDescription}>
                      Automatically approve access requests
                    </Text>
                    {isEditingSettings ? (
                      <TouchableOpacity
                        style={[styles.toggleButton, (editedSettings?.autoApprove ? styles.toggleOn : styles.toggleOff)]}
                        onPress={() => updateSetting('autoApprove', !editedSettings?.autoApprove)}
                      >
                        <Text style={[styles.toggleText, (editedSettings?.autoApprove ? styles.toggleTextOn : styles.toggleTextOff)]}>
                          {editedSettings?.autoApprove ? 'Enabled' : 'Disabled'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.settingValue}>
                        <Text style={styles.settingValueText}>
                          {settings?.autoApprove ? 'Enabled' : 'Disabled'}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Default Expiry Time</Text>
                    <Text style={styles.settingDescription}>
                      Hours before access expires
                    </Text>
                    {isEditingSettings ? (
                      <TextInput
                        style={styles.numberInput}
                        value={editedSettings?.expirySettings.defaultExpiryHours.toString() || '24'}
                        onChangeText={(text) => {
                          const num = parseInt(text) || 24;
                          updateSetting('expirySettings', {
                            ...editedSettings?.expirySettings,
                            defaultExpiryHours: Math.max(1, num)
                          });
                        }}
                        keyboardType="numeric"
                      />
                    ) : (
                      <View style={styles.settingValue}>
                        <Text style={styles.settingValueText}>
                          {settings?.expirySettings.defaultExpiryHours} hours
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>Max Extensions</Text>
                    <Text style={styles.settingDescription}>
                      Maximum number of access extensions allowed
                    </Text>
                    {isEditingSettings ? (
                      <TextInput
                        style={styles.numberInput}
                        value={editedSettings?.expirySettings.maxExtensions.toString() || '3'}
                        onChangeText={(text) => {
                          const num = parseInt(text) || 3;
                          updateSetting('expirySettings', {
                            ...editedSettings?.expirySettings,
                            maxExtensions: Math.max(0, num)
                          });
                        }}
                        keyboardType="numeric"
                      />
                    ) : (
                      <View style={styles.settingValue}>
                        <Text style={styles.settingValueText}>
                          {settings?.expirySettings.maxExtensions} extensions
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
            
            {isEditingSettings && (
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelEditButton]}
                  onPress={handleCancelEdit}
                >
                  <Text style={styles.cancelEditButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveEditButton]}
                  onPress={handleSaveSettings}
                >
                  <Ionicons name="checkmark" size={getResponsiveSize(16, 18, 20)} color="#ffffff" />
                  <Text style={styles.saveEditButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {!isSuperAdmin && (
              <View style={styles.settingsNote}>
                <Ionicons name="information-circle" size={getResponsiveSize(20, 22, 24)} color="#667eea" />
                <Text style={styles.settingsNoteText}>
                  Settings are read-only. Contact your system administrator to modify access control settings.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    color: '#ffffff',
    marginTop: getResponsiveSize(16, 18, 20),
  },
  header: {
    paddingTop: getResponsiveSize(40, 44, 48),
  },
  headerGradient: {
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: getResponsiveSize(16, 18, 20),
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: getResponsiveSize(12, 14, 16),
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(24, 28, 32),
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: getResponsiveSize(4, 6, 8),
  },
  headerActions: {
    flexDirection: 'row',
    gap: getResponsiveSize(8, 10, 12),
  },
  settingsButton: {
    width: getResponsiveSize(44, 48, 52),
    height: getResponsiveSize(44, 48, 52),
    borderRadius: getResponsiveSize(22, 24, 26),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: getResponsiveSize(16, 18, 20),
    gap: getResponsiveSize(12, 14, 16),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(16, 18, 20),
    paddingVertical: getResponsiveSize(12, 14, 16),
    gap: getResponsiveSize(12, 14, 16),
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#ffffff',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: getResponsiveSize(8, 10, 12),
  },
  filterButton: {
    paddingHorizontal: getResponsiveSize(16, 18, 20),
    paddingVertical: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(20, 24, 28),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilter: {
    backgroundColor: '#667eea',
  },
  filterText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(60, 80, 100),
  },
  emptyTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
    marginTop: getResponsiveSize(16, 18, 20),
  },
  emptyText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: getResponsiveSize(8, 10, 12),
  },
  requestCard: {
    marginBottom: getResponsiveSize(16, 18, 20),
  },
  requestCardGradient: {
    borderRadius: getResponsiveSize(16, 20, 24),
    padding: getResponsiveSize(20, 24, 28),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(12, 14, 16),
  },
  requestInfo: {
    flex: 1,
  },
  requestId: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(6, 8, 10),
  },
  statusText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
  },
  actionButton: {
    width: getResponsiveSize(36, 40, 44),
    height: getResponsiveSize(36, 40, 44),
    borderRadius: getResponsiveSize(18, 20, 22),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestDetails: {
    gap: getResponsiveSize(6, 8, 10),
  },
  detailText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.8)',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#667eea',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: getResponsiveSize(16, 18, 20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCloseButton: {
    width: getResponsiveSize(40, 44, 48),
    height: getResponsiveSize(40, 44, 48),
    borderRadius: getResponsiveSize(20, 22, 24),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
  },
  modalPlaceholder: {
    width: getResponsiveSize(40, 44, 48),
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(),
  },
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(16, 18, 20),
    marginVertical: getResponsiveSize(16, 18, 20),
  },
  detailsTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: getResponsiveSize(12, 14, 16),
  },
  detailsGrid: {
    gap: getResponsiveSize(8, 10, 12),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
    textAlign: 'right',
  },
  actionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(16, 18, 20),
    marginBottom: getResponsiveSize(16, 18, 20),
  },
  actionsTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: getResponsiveSize(12, 14, 16),
  },
  inputLabel: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 14, 16),
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    textAlignVertical: 'top',
    marginBottom: getResponsiveSize(16, 18, 20),
  },
  actionButtons: {
    flexDirection: 'row',
    gap: getResponsiveSize(12, 14, 16),
  },
  approveButton: {
    backgroundColor: '#00ff88',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(8, 10, 12),
  },
  rejectButton: {
    backgroundColor: '#ff6b6b',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(8, 10, 12),
  },
  extendButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(8, 10, 12),
  },
  actionButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(),
  },
  extendModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: getResponsiveSize(16, 20, 24),
    padding: getResponsiveSize(24, 28, 32),
    width: '100%',
    maxWidth: 400,
  },
  extendModalTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: getResponsiveSize(16, 18, 20),
  },
  extendModalText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: getResponsiveSize(20, 24, 28),
  },
  numberInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 14, 16),
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: getResponsiveSize(20, 24, 28),
  },
  extendModalButtons: {
    flexDirection: 'row',
    gap: getResponsiveSize(12, 14, 16),
  },
  modalButton: {
    flex: 1,
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(8, 10, 12),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmButton: {
    backgroundColor: '#667eea',
  },
  cancelButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
  confirmButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
  // Settings Modal Styles
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(16, 18, 20),
    marginVertical: getResponsiveSize(16, 18, 20),
  },
  settingsCardTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  settingsCardDescription: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: getResponsiveSize(16, 18, 20),
  },
  settingsContent: {
    gap: getResponsiveSize(16, 18, 20),
  },
  settingItem: {
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLabel: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  settingDescription: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  settingValue: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: getResponsiveSize(6, 8, 10),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(6, 8, 10),
    alignSelf: 'flex-start',
  },
  settingValueText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#667eea',
  },
  settingsNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 14, 16),
    marginVertical: getResponsiveSize(16, 18, 20),
    gap: getResponsiveSize(8, 10, 12),
  },
  settingsNoteText: {
    flex: 1,
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: getResponsiveSize(20, 22, 24),
  },
  // Editable Settings Styles
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: getResponsiveSize(8, 10, 12),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(6, 8, 10),
    gap: getResponsiveSize(4, 6, 8),
  },
  editButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#667eea',
  },
  toggleButton: {
    borderRadius: getResponsiveSize(6, 8, 10),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(6, 8, 10),
    alignSelf: 'flex-start',
  },
  toggleOn: {
    backgroundColor: '#00ff88',
  },
  toggleOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  toggleText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
  },
  toggleTextOn: {
    color: '#ffffff',
  },
  toggleTextOff: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  numberInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(6, 8, 10),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(8, 10, 12),
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: getResponsiveSize(80, 90, 100),
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    gap: getResponsiveSize(12, 14, 16),
    marginVertical: getResponsiveSize(16, 18, 20),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(8, 10, 12),
    gap: getResponsiveSize(6, 8, 10),
  },
  cancelEditButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  saveEditButton: {
    backgroundColor: '#00ff88',
  },
  cancelEditButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
  saveEditButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
});
