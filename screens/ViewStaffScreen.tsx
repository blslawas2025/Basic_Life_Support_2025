import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, TextInput, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { ProfileService, Profile, UpdateProfile } from "../services/ProfileService";

const { width, height } = Dimensions.get('window');

// Responsive helpers
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;
const isLargeScreen = width >= 768;

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

interface ViewStaffScreenProps {
  onBack: () => void;
}

export default function ViewStaffScreen({ onBack }: ViewStaffScreenProps) {
  const [staff, setStaff] = useState<Profile[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Profile | null>(null);
  const [editingStaff, setEditingStaff] = useState<Profile | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadStaff();
    startAnimations();
  }, []);

  useEffect(() => {
    filterStaff();
  }, [staff, searchQuery]);

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

  const loadStaff = async () => {
    try {
      setLoading(true);
      const allProfiles = await ProfileService.getAllProfiles();
      // Filter to only show staff and admin profiles
      const staffProfiles = allProfiles.filter(p => p.roles === 'staff' || p.roles === 'admin' || p.user_type === 'staff' || p.user_type === 'admin');
      setStaff(staffProfiles);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStaff = () => {
    let filtered = staff;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        (p.job_position_name && p.job_position_name.toLowerCase().includes(query))
      );
    }

    // Sort by name A-Z
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredStaff(filtered);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'staff': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'approved': return '#3b82f6';
      case 'rejected': return '#ef4444';
      case 'inactive': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const handleEditStaff = (staffMember: Profile) => {
    setEditingStaff(staffMember);
    setEditFormData({
      name: staffMember.name,
      email: staffMember.email,
      phone_number: staffMember.phone_number || '',
      ic_number: staffMember.ic_number || '',
      job_position_name: staffMember.job_position_name || '',
      tempat_bertugas: staffMember.tempat_bertugas || '',
      roles: staffMember.roles,
      status: staffMember.status,
      notes: staffMember.notes || '',
    });
    setShowEditModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDeleteStaff = (staffMember: Profile) => {
    setSelectedStaff(staffMember);
    setShowDeleteModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSaveEdit = async () => {
    if (!editingStaff) return;

    setSaving(true);
    
    try {
      const updateData: UpdateProfile = {
        name: editFormData.name,
        email: editFormData.email,
        phone_number: editFormData.phone_number,
        ic_number: editFormData.ic_number,
        job_position_name: editFormData.job_position_name,
        tempat_bertugas: editFormData.tempat_bertugas,
        roles: editFormData.roles,
        status: editFormData.status,
        notes: editFormData.notes,
      };

      await ProfileService.updateProfile(editingStaff.id, updateData);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAlertMessage('Staff member updated successfully!');
      setShowSuccessModal(true);
      
      setShowEditModal(false);
      setEditingStaff(null);
      loadStaff();
    } catch (error) {
      console.error('Error updating staff:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertMessage('Failed to update staff member. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedStaff) return;

    setDeleting(true);
    setShowDeleteModal(false);

    try {
      await ProfileService.deleteProfile(selectedStaff.id);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAlertMessage('Staff member deleted successfully!');
      setShowSuccessModal(true);
      
      setSelectedStaff(null);
      loadStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertMessage('Failed to delete staff member. Please try again.');
      setShowErrorModal(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background */}
      <Animated.View style={styles.backgroundContainer}>
        <LinearGradient 
          colors={["#0f0f23", "#1a1a2e", "#16213e", "#0f3460"]} 
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Header */}
      <Animated.View style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.2)']}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.headerIconGradient}
            >
              <Ionicons name="eye" size={24} color="#ffffff" />
            </LinearGradient>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>View Staff</Text>
            <Text style={styles.headerSubtitle}>Manage staff members</Text>
          </View>
        </View>
      </Animated.View>

      {/* Search */}
      <Animated.View style={[
        styles.searchContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#a0a0a0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff..."
            placeholderTextColor="#a0a0a0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#a0a0a0" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Staff List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading staff...</Text>
          </View>
        ) : filteredStaff.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#6b7280" />
            <Text style={styles.emptyTitle}>No staff found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search criteria' : 'No staff members registered'}
            </Text>
          </View>
        ) : (
          <Animated.View style={[
            styles.staffList,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            {filteredStaff.map((staffMember, index) => (
              <View key={staffMember.id} style={styles.staffCard}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.staffCardGradient}
                >
                  <View style={styles.staffHeader}>
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{staffMember.name}</Text>
                      <Text style={styles.staffEmail}>{staffMember.email}</Text>
                    </View>
                    <View style={styles.staffBadges}>
                      <View style={[styles.roleBadge, { backgroundColor: getRoleColor(staffMember.roles) + '20' }]}>
                        <Text style={[styles.roleText, { color: getRoleColor(staffMember.roles) }]}>
                          {staffMember.roles.toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(staffMember.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(staffMember.status) }]}>
                          {staffMember.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.staffDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="briefcase" size={16} color="#a0a0a0" />
                      <Text style={styles.detailText}>
                        {staffMember.job_position_name || 'No position assigned'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={16} color="#a0a0a0" />
                      <Text style={styles.detailText}>
                        {staffMember.tempat_bertugas || 'No workplace assigned'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="call" size={16} color="#a0a0a0" />
                      <Text style={styles.detailText}>
                        {staffMember.phone_number || 'No phone number'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.staffActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEditStaff(staffMember)}
                    >
                      <Ionicons name="create" size={16} color="#f59e0b" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteStaff(staffMember)}
                    >
                      <Ionicons name="trash" size={16} color="#ef4444" />
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.editModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Staff</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={editFormData.name}
                  onChangeText={(value) => setEditFormData({...editFormData, name: value})}
                  placeholder="Enter full name"
                  placeholderTextColor="#a0a0a0"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={editFormData.email}
                  onChangeText={(value) => setEditFormData({...editFormData, email: value})}
                  placeholder="Enter email address"
                  placeholderTextColor="#a0a0a0"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={editFormData.phone_number}
                  onChangeText={(value) => setEditFormData({...editFormData, phone_number: value})}
                  placeholder="Enter phone number"
                  placeholderTextColor="#a0a0a0"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Job Position</Text>
                <TextInput
                  style={styles.input}
                  value={editFormData.job_position_name}
                  onChangeText={(value) => setEditFormData({...editFormData, job_position_name: value})}
                  placeholder="Enter job position"
                  placeholderTextColor="#a0a0a0"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Workplace</Text>
                <TextInput
                  style={styles.input}
                  value={editFormData.tempat_bertugas}
                  onChangeText={(value) => setEditFormData({...editFormData, tempat_bertugas: value})}
                  placeholder="Enter workplace"
                  placeholderTextColor="#a0a0a0"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editFormData.notes}
                  onChangeText={(value) => setEditFormData({...editFormData, notes: value})}
                  placeholder="Enter any additional notes"
                  placeholderTextColor="#a0a0a0"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                <Text style={styles.modalButtonText}>
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#1e1b4b', '#312e81', '#1e1b4b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons name="warning" size={28} color="#ef4444" />
                  </View>
                  <Text style={styles.modalTitle}>Confirm Deletion</Text>
                </View>
                <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalMessage}>
                  Are you sure you want to delete this staff member?
                </Text>
                {selectedStaff && (
                  <View style={styles.staffDetails}>
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Name:</Text> {selectedStaff.name}
                    </Text>
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Email:</Text> {selectedStaff.email}
                    </Text>
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Role:</Text> {selectedStaff.roles}
                    </Text>
                  </View>
                )}
                <Text style={styles.warningText}>
                  ⚠️ This action cannot be undone!
                </Text>
              </View>
              <View style={styles.modalFooter}>
                <View style={styles.confirmButtonContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowDeleteModal(false)}
                  >
                    <Ionicons name="close" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteConfirmButton}
                    onPress={confirmDelete}
                    disabled={deleting}
                  >
                    <Ionicons name="trash" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                      {deleting ? 'Deleting...' : 'Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#064e3b', '#065f46', '#064e3b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                    <Ionicons name="checkmark-circle" size={28} color="#10b981" />
                  </View>
                  <Text style={styles.modalTitle}>Success!</Text>
                </View>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalMessage}>{alertMessage}</Text>
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.successButton}
                  onPress={() => setShowSuccessModal(false)}
                >
                  <Ionicons name="checkmark" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>OK</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Error Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowErrorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#7f1d1d', '#991b1b', '#7f1d1d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <View style={[styles.modalIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                    <Ionicons name="close-circle" size={28} color="#ef4444" />
                  </View>
                  <Text style={styles.modalTitle}>Error!</Text>
                </View>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalMessage}>{alertMessage}</Text>
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.errorButton}
                  onPress={() => setShowErrorModal(false)}
                >
                  <Ionicons name="close" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>OK</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.3)',
  },
  backButton: {
    marginRight: 24,
  },
  backButtonGradient: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  headerIconGradient: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
  },
  searchIcon: {
    marginRight: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    paddingVertical: 24,
  },
  clearButton: {
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#a0a0a0',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginTop: 24,
  },
  staffList: {
    gap: 24,
  },
  staffCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  staffCardGradient: {
    padding: 24,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  staffEmail: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  staffBadges: {
    flexDirection: 'row',
    gap: 24,
  },
  roleBadge: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  staffDetails: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailText: {
    fontSize: 16,
    color: '#a0a0a0',
    marginLeft: 24,
    flex: 1,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#ffffff',
  },
  staffActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 24,
  },
  editButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 24,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    margin: 24,
    maxHeight: '70%',
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  editModalContent: {
    maxHeight: '90%',
    width: '95%',
  },
  modalGradient: {
    flex: 1,
    borderRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.2)',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIconContainer: {
    marginRight: 24,
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 24,
  },
  modalMessage: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 24,
  },
  warningText: {
    fontSize: 16,
    color: '#f59e0b',
    textAlign: 'center',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Edit form styles
  editForm: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  confirmButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  successButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: 'center',
    minWidth: 24,
  },
  errorButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignSelf: 'center',
    minWidth: 24,
  },
});
