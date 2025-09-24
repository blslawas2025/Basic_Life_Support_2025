import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, Alert, TextInput, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { AccessControlService, AccessRequest, AccessControlSettings } from "../services/AccessControlService";
import { supabase } from "../config/supabase";

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
  const [profileMap, setProfileMap] = useState<Record<string, { name?: string; email?: string; ic?: string }>>({});
  
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

      // Load participant profiles for requesters to show human-friendly details
      const ids = Array.from(new Set(requests.map(r => r.userId))).filter(Boolean);
      if (ids.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id,name,email,ic_number')
          .in('id', ids as any);
        const map: Record<string, { name?: string; email?: string; ic?: string }> = {};
        (data || []).forEach((p: any) => {
          map[p.id] = { name: p.name, email: p.email, ic: p.ic_number };
        });
        setProfileMap(map);
      }
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
        colors={["rgba(37,99,235,0.12)", "rgba(14,165,233,0.12)"]}
        style={styles.requestCardGradient}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.personBlock}>
            <View style={styles.personBadge}>
              <Ionicons name="person" size={18} color="#38bdf8" />
            </View>
            <View style={styles.personText}>
              <Text style={styles.personName}>{profileMap[request.userId]?.name || 'Unknown user'}</Text>
              <Text style={styles.personMeta} numberOfLines={1}>{profileMap[request.userId]?.email || request.userId}</Text>
              {profileMap[request.userId]?.ic && (
                <Text style={styles.personMeta}>IC: {profileMap[request.userId]?.ic}</Text>
              )}
            </View>
          </View>
          <View style={styles.statusPill}>
            <Ionicons name={getStatusIcon(request.status)} size={16} color={getStatusColor(request.status)} />
            <Text style={[styles.statusPillText, { color: getStatusColor(request.status) }]}>{request.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>Test: <Text style={styles.metaValue}>{request.testType.replace('_',' ').toUpperCase()}</Text></Text>
          <Text style={styles.metaItem}>Pool: <Text style={styles.metaValue}>{request.poolId}</Text></Text>
          <Text style={styles.metaItem}>Usage: <Text style={styles.metaValue}>{request.usageCount}/{request.maxUsage}</Text></Text>
          <Text style={styles.metaItem}>Requested: <Text style={styles.metaValue}>{new Date(request.requestedAt).toLocaleDateString()}</Text></Text>
        </View>

        {request.status === 'pending' && (
          <View style={styles.inlineActions}>
            <TouchableOpacity style={[styles.inlineBtn, styles.inlineApprove]} onPress={() => handleApproveRequest(request)}>
              <Ionicons name="checkmark" size={18} color="#0f172a" />
              <Text style={styles.inlineApproveText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.inlineBtn, styles.inlineReject]} onPress={() => handleRejectRequest(request)}>
              <Ionicons name="close" size={18} color="#ffffff" />
              <Text style={styles.inlineRejectText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <View style={styles.loadingContent}>
          <Ionicons name="shield-checkmark" size={24} color="#667eea" />
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
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
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
              <Ionicons name="settings" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={24} color="#667eea" />
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
            <Ionicons name="document-outline" size={24} color="#667eea" />
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
              <Ionicons name="close" size={24} color="#666" />
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
                      <Ionicons name="checkmark" size={24} color="#ffffff" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleRejectRequest(selectedRequest)}
                    >
                      <Ionicons name="close" size={24} color="#ffffff" />
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
                    <Ionicons name="time" size={24} color="#ffffff" />
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
              <Ionicons name="close" size={24} color="#666" />
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
                    <Ionicons name="create-outline" size={24} color="#667eea" />
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
                  <Ionicons name="checkmark" size={24} color="#ffffff" />
                  <Text style={styles.saveEditButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {!isSuperAdmin && (
              <View style={styles.settingsNote}>
                <Ionicons name="information-circle" size={24} color="#667eea" />
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
    fontSize: 16,
    color: '#ffffff',
    marginTop: 24,
  },
  header: {
    paddingTop: 24,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 24,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 24,
  },
  settingsButton: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  filterButton: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilter: {
    backgroundColor: '#667eea',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 24,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 24,
  },
  requestCard: {
    marginBottom: 24,
  },
  requestCardGradient: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  personBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    flex: 1,
  },
  personBadge: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56,189,248,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.35)'
  },
  personText: { flex: 1 },
  personName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  personMeta: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)'
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  statusPillText: {
    fontSize: 16,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  metaItem: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)'
  },
  metaValue: {
    color: '#ffffff',
    fontWeight: '600'
  },
  inlineActions: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 24,
  },
  inlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  inlineApprove: {
    backgroundColor: '#34d399',
  },
  inlineReject: {
    backgroundColor: 'rgba(239,68,68,0.9)'
  },
  inlineApproveText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  inlineRejectText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  requestInfo: {
    flex: 1,
  },
  requestId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestDetails: {
    gap: 24,
  },
  detailText: {
    fontSize: 16,
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
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalPlaceholder: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginVertical: 24,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  detailsGrid: {
    gap: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
    textAlign: 'right',
  },
  actionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    fontSize: 16,
    color: '#ffffff',
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  approveButton: {
    backgroundColor: '#00ff88',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 24,
    borderRadius: 24,
  },
  rejectButton: {
    backgroundColor: '#ff6b6b',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 24,
    borderRadius: 24,
  },
  extendButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 24,
    borderRadius: 24,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  extendModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  extendModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  extendModalText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  numberInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  extendModalButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmButton: {
    backgroundColor: '#667eea',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Settings Modal Styles
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginVertical: 24,
  },
  settingsCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  settingsCardDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
  },
  settingsContent: {
    gap: 24,
  },
  settingItem: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
  },
  settingDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
  },
  settingValue: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    alignSelf: 'flex-start',
  },
  settingValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  settingsNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 24,
    padding: 24,
    marginVertical: 24,
    gap: 24,
  },
  settingsNoteText: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
  },
  // Editable Settings Styles
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 24,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
  },
  toggleButton: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
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
    fontSize: 16,
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
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 24,
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    gap: 24,
    marginVertical: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderRadius: 24,
    gap: 24,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveEditButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
