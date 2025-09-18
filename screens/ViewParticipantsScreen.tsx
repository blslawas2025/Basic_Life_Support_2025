import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, TextInput, Alert, Modal, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { ProfileService, Profile, UpdateProfile } from "../services/ProfileService";
import { CourseSessionService } from "../services/CourseSessionService";
import { CourseSession } from "../types/CourseSession";
import { useResponsive } from "../utils/responsiveHelpers";

interface ViewParticipantsScreenProps {
  onBack: () => void;
}

export default function ViewParticipantsScreen({ onBack }: ViewParticipantsScreenProps) {
  const { width, height, isSmallScreen, isMediumScreen, isTablet, getResponsiveSize, getResponsiveFontSize, getResponsivePadding } = useResponsive();
  const windowDims = useWindowDimensions();
  
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [jobFilter, setJobFilter] = useState<string>('');
  const [allergiesFilter, setAllergiesFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [pregnantFilter, setPregnantFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [courseSessionFilter, setCourseSessionFilter] = useState<string>('');
  const [courseSessions, setCourseSessions] = useState<CourseSession[]>([]);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [showCourseSessionDropdown, setShowCourseSessionDropdown] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [courseSessionSearchQuery, setCourseSessionSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Profile | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Profile | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [showEditSuccessModal, setShowEditSuccessModal] = useState(false);
  const [showEditErrorModal, setShowEditErrorModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showPaginationModal, setShowPaginationModal] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadParticipants();
    loadCourseSessions();
    startAnimations();
  }, []);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchQuery, jobFilter, allergiesFilter, pregnantFilter, courseSessionFilter]);

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

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const allProfiles = await ProfileService.getAllProfiles();
      setParticipants(allProfiles);
    } catch (error) {
      console.error('Error loading participants:', error);
      Alert.alert('Error', 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseSessions = async () => {
    try {
      const sessions = await CourseSessionService.getAllCourseSessions();
      setCourseSessions(sessions);
    } catch (error) {
      console.error('Error loading course sessions:', error);
      // Don't show alert for course sessions as it's not critical
    }
  };

  const filterParticipants = () => {
    let filtered = participants;

    // Filter to only show profiles with user roles
    filtered = filtered.filter(p => p.roles === 'user');

    // Filter by search query (name only)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query)
      );
    }

    // Filter by job
    if (jobFilter.trim()) {
      filtered = filtered.filter(p => 
        p.job_position_name && p.job_position_name.toLowerCase().includes(jobFilter.toLowerCase())
      );
    }

    // Filter by allergies
    if (allergiesFilter !== 'all') {
      filtered = filtered.filter(p => 
        allergiesFilter === 'yes' ? p.has_allergies : !p.has_allergies
      );
    }

    // Filter by pregnant
    if (pregnantFilter !== 'all') {
      filtered = filtered.filter(p => 
        pregnantFilter === 'yes' ? p.is_pregnant : !p.is_pregnant
      );
    }

    // Filter by course session
    if (courseSessionFilter.trim()) {
      filtered = filtered.filter(p => 
        p.course_session_id === courseSessionFilter
      );
    }

    // Sort by name A-Z by default
    filtered = filtered.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });

    setFilteredParticipants(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Pagination logic
  const getPaginatedParticipants = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredParticipants.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(filteredParticipants.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page
    setShowPaginationModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'staff': return '#3b82f6';
      case 'user': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return 'shield';
      case 'staff': return 'person';
      case 'user': return 'people';
      default: return 'help-circle';
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

  // Get unique job positions for dropdown with search
  const getUniqueJobPositions = () => {
    let jobs = participants
      .map(p => p.job_position_name)
      .filter(job => job && job.trim() !== '')
      .filter((job, index, self) => self.indexOf(job) === index)
      .sort();

    // Filter by search query
    if (jobSearchQuery.trim()) {
      jobs = jobs.filter(job => 
        job && job.toLowerCase().includes(jobSearchQuery.toLowerCase())
      );
    }

    return jobs;
  };

  // Get course sessions for dropdown with search
  const getFilteredCourseSessions = () => {
    let sessions = courseSessions.sort((a, b) => a.full_name.localeCompare(b.full_name));

    // Filter by search query
    if (courseSessionSearchQuery.trim()) {
      sessions = sessions.filter(session => 
        session.full_name.toLowerCase().includes(courseSessionSearchQuery.toLowerCase())
      );
    }

    return sessions;
  };

  // Handle edit participant
  const handleEditParticipant = (participant: Profile) => {
    setEditingParticipant(participant);
    setEditFormData({
      name: participant.name,
      email: participant.email,
      phone_number: participant.phone_number || '',
      ic_number: participant.ic_number || '',
      job_position_name: participant.job_position_name || '',
      tempat_bertugas: participant.tempat_bertugas || '',
      last_bls_attempt: participant.last_bls_attempt || '',
      has_asthma: participant.has_asthma,
      has_allergies: participant.has_allergies,
      allergies_description: participant.allergies_description || '',
      is_pregnant: participant.is_pregnant,
      pregnancy_weeks: participant.pregnancy_weeks?.toString() || '',
      roles: participant.roles,
      status: participant.status,
      notes: participant.notes || '',
    });
    setShowEditModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Show edit confirmation
  const showEditConfirmation = () => {
    setShowEditConfirmModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Handle delete participant
  const handleDeleteParticipant = (participant: Profile) => {
    setSelectedParticipant(participant);
    setShowDeleteModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Save edited participant
  const handleSaveEdit = async () => {
    if (!editingParticipant) return;

    setSaving(true);
    setShowEditConfirmModal(false);
    
    try {
      const updateData: UpdateProfile = {
        name: editFormData.name,
        email: editFormData.email,
        phone_number: editFormData.phone_number,
        ic_number: editFormData.ic_number,
        job_position_name: editFormData.job_position_name,
        tempat_bertugas: editFormData.tempat_bertugas,
        last_bls_attempt: editFormData.last_bls_attempt,
        has_asthma: editFormData.has_asthma,
        has_allergies: editFormData.has_allergies,
        allergies_description: editFormData.allergies_description,
        is_pregnant: editFormData.is_pregnant,
        pregnancy_weeks: editFormData.pregnancy_weeks ? parseInt(editFormData.pregnancy_weeks) : undefined,
        roles: editFormData.roles,
        status: editFormData.status,
        notes: editFormData.notes,
      };

      await ProfileService.updateProfile(editingParticipant.id, updateData);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAlertMessage('Participant updated successfully!');
      setShowEditSuccessModal(true);
      
      setShowEditModal(false);
      setEditingParticipant(null);
      loadParticipants(); // Refresh the list
    } catch (error) {
      console.error('Error updating participant:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertMessage('Failed to update participant. Please try again.');
      setShowEditErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  // Confirm delete participant
  const confirmDelete = async () => {
    if (!selectedParticipant) return;

    setDeleting(true);
    setShowDeleteModal(false);

    try {
      await ProfileService.deleteProfile(selectedParticipant.id);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAlertMessage('Participant deleted successfully!');
      setShowDeleteSuccessModal(true);
      
      setSelectedParticipant(null);
      loadParticipants(); // Refresh the list
    } catch (error) {
      console.error('Error deleting participant:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertMessage('Failed to delete participant. Please try again.');
      setShowDeleteErrorModal(true);
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
            <Text style={styles.headerTitle}>View Participants</Text>
            <Text style={styles.headerSubtitle}>View all participants with roles</Text>
          </View>
        </View>
      </Animated.View>

      {/* Search and Filter */}
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
            placeholder="Search participants..."
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

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Job Position:</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowJobDropdown(!showJobDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {jobFilter || 'All Jobs'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#a0a0a0" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Allergies:</Text>
              <View style={styles.filterButtons}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'yes', label: 'Yes' },
                  { key: 'no', label: 'No' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterButton,
                      allergiesFilter === option.key && styles.filterButtonActive
                    ]}
                    onPress={() => setAllergiesFilter(option.key as any)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      allergiesFilter === option.key && styles.filterButtonTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Pregnant:</Text>
              <View style={styles.filterButtons}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'yes', label: 'Yes' },
                  { key: 'no', label: 'No' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterButton,
                      pregnantFilter === option.key && styles.filterButtonActive
                    ]}
                    onPress={() => setPregnantFilter(option.key as any)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      pregnantFilter === option.key && styles.filterButtonTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Course Session:</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowCourseSessionDropdown(!showCourseSessionDropdown)}
              >
                <Text style={styles.dropdownText}>
                  {courseSessionFilter ? 
                    courseSessions.find(s => s.id === courseSessionFilter)?.full_name || 'Select Session' 
                    : 'All Sessions'
                  }
                </Text>
                <Ionicons name="chevron-down" size={16} color="#a0a0a0" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Pagination Controls - Above Table */}
        {filteredParticipants.length > 0 && (
          <View style={styles.topPaginationContainer}>
            <View style={styles.paginationInfo}>
              <Text style={styles.paginationText}>
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredParticipants.length)} of {filteredParticipants.length} participants
              </Text>
            </View>
            
            <View style={styles.paginationControls}>
              <TouchableOpacity
                style={styles.paginationButton}
                onPress={() => setShowPaginationModal(true)}
              >
                <Text style={styles.paginationButtonText}>{itemsPerPage} per page</Text>
                <Ionicons name="chevron-down" size={16} color="#ffffff" />
              </TouchableOpacity>

              <View style={styles.pageControls}>
                <TouchableOpacity
                  style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                  onPress={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? "#666" : "#ffffff"} />
                </TouchableOpacity>

                <View style={styles.pageNumbers}>
                  {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <TouchableOpacity
                        key={page}
                        style={[
                          styles.pageNumber,
                          currentPage === page && styles.pageNumberActive
                        ]}
                        onPress={() => handlePageChange(page)}
                      >
                        <Text style={[
                          styles.pageNumberText,
                          currentPage === page && styles.pageNumberTextActive
                        ]}>
                          {page}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={[styles.pageButton, currentPage === getTotalPages() && styles.pageButtonDisabled]}
                  onPress={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === getTotalPages()}
                >
                  <Ionicons name="chevron-forward" size={16} color={currentPage === getTotalPages() ? "#666" : "#ffffff"} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Participants List */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading participants...</Text>
          </View>
        ) : filteredParticipants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#6b7280" />
            <Text style={styles.emptyTitle}>No participants found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search criteria' : 'No participants match the selected role'}
            </Text>
          </View>
        ) : (
          <Animated.View style={[
            styles.staffList,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}>
            {getPaginatedParticipants().map((participant) => (
              <View key={participant.id} style={styles.staffCard}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                  style={styles.staffCardGradient}
                >
                  <View style={styles.staffHeader}>
                    <View style={styles.staffInfo}>
                      <Text style={styles.staffName}>{participant.name}</Text>
                      <Text style={styles.staffEmail}>{participant.email}</Text>
                    </View>
                    <View style={styles.staffBadges}>
                      <View style={[styles.roleBadge, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
                        <Text style={[styles.roleText, { color: '#6366f1' }]}>
                          {(participant.roles?.toUpperCase?.()) || 'USER'}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(participant.status) + '20' }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusColor(participant.status) }]}>
                          {(participant.status?.toUpperCase?.()) || 'UNKNOWN'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.staffDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="briefcase" size={16} color="#a0a0a0" />
                      <Text style={styles.detailText}>{participant.job_position_name || '-'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={16} color="#a0a0a0" />
                      <Text style={styles.detailText}>{participant.tempat_bertugas || '-'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="call" size={16} color="#a0a0a0" />
                      <Text style={styles.detailText}>{participant.phone_number || '-'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="card" size={16} color="#a0a0a0" />
                      <Text style={styles.detailText}>{participant.ic_number || '-'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={16} color="#a0a0a0" />
                      <Text style={styles.detailText}>{participant.last_bls_attempt || '-'}</Text>
                    </View>
                    <View style={[styles.detailRow, { gap: 8 }]}>
                      <View style={[styles.statusBadge, participant.has_allergies ? styles.statusBadgeYes : styles.statusBadgeNo]}>
                        <Text style={[styles.statusBadgeText, participant.has_allergies ? styles.statusBadgeTextYes : styles.statusBadgeTextNo]}>
                          Allergies: {participant.has_allergies ? 'Yes' : 'No'}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, participant.is_pregnant ? styles.statusBadgeYes : styles.statusBadgeNo]}>
                        <Text style={[styles.statusBadgeText, participant.is_pregnant ? styles.statusBadgeTextYes : styles.statusBadgeTextNo]}>
                          Pregnant: {participant.is_pregnant ? 'Yes' : 'No'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.staffActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => handleEditParticipant(participant)}
                    >
                      <Ionicons name="create" size={16} color="#f59e0b" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteParticipant(participant)}
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

      {/* Job Position Dropdown Modal */}
      <Modal
        visible={showJobDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowJobDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Job Position</Text>
              <TouchableOpacity onPress={() => setShowJobDropdown(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.jobSearchContainer}>
              <TextInput
                style={styles.jobSearchInput}
                placeholder="Search job positions..."
                placeholderTextColor="#a0a0a0"
                value={jobSearchQuery}
                onChangeText={setJobSearchQuery}
              />
              <Ionicons name="search" size={20} color="#a0a0a0" style={styles.jobSearchIcon} />
            </View>
            <ScrollView style={styles.modalOptions}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setJobFilter('');
                  setJobSearchQuery('');
                  setShowJobDropdown(false);
                }}
              >
                <Text style={styles.modalOptionText}>All Jobs</Text>
              </TouchableOpacity>
              {getUniqueJobPositions().map((job, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalOption}
                  onPress={() => {
                    setJobFilter(job || '');
                    setJobSearchQuery('');
                    setShowJobDropdown(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{job}</Text>
                </TouchableOpacity>
              ))}
              {getUniqueJobPositions().length === 0 && jobSearchQuery.trim() && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No jobs found matching "{jobSearchQuery}"</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Course Session Dropdown Modal */}
      <Modal
        visible={showCourseSessionDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCourseSessionDropdown(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Course Session</Text>
              <TouchableOpacity onPress={() => setShowCourseSessionDropdown(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.jobSearchContainer}>
              <TextInput
                style={styles.jobSearchInput}
                placeholder="Search course sessions..."
                placeholderTextColor="#a0a0a0"
                value={courseSessionSearchQuery}
                onChangeText={setCourseSessionSearchQuery}
              />
              <Ionicons name="search" size={20} color="#a0a0a0" style={styles.jobSearchIcon} />
            </View>
            <ScrollView style={styles.modalOptions}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setCourseSessionFilter('');
                  setCourseSessionSearchQuery('');
                  setShowCourseSessionDropdown(false);
                }}
              >
                <Text style={styles.modalOptionText}>All Sessions</Text>
              </TouchableOpacity>
              {getFilteredCourseSessions().map((session, index) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.modalOption}
                  onPress={() => {
                    setCourseSessionFilter(session.id);
                    setCourseSessionSearchQuery('');
                    setShowCourseSessionDropdown(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{session.full_name}</Text>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionInfoText}>
                      {session.current_participants}/{session.max_participants} participants
                    </Text>
                    <Text style={[styles.sessionStatusText, { color: session.is_registration_open ? '#10b981' : '#ef4444' }]}>
                      {session.is_registration_open ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              {getFilteredCourseSessions().length === 0 && courseSessionSearchQuery.trim() && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No course sessions found matching "{courseSessionSearchQuery}"</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Participant Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.editModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Participant</Text>
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

              <View style={styles.toggleGroup}>
                <TouchableOpacity
                  style={[styles.toggle, editFormData.has_asthma && styles.toggleActive]}
                  onPress={() => setEditFormData({...editFormData, has_asthma: !editFormData.has_asthma})}
                >
                  <Text style={[styles.toggleText, editFormData.has_asthma && styles.toggleTextActive]}>
                    Has Asthma
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggle, editFormData.has_allergies && styles.toggleActive]}
                  onPress={() => setEditFormData({...editFormData, has_allergies: !editFormData.has_allergies})}
                >
                  <Text style={[styles.toggleText, editFormData.has_allergies && styles.toggleTextActive]}>
                    Has Allergies
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggle, editFormData.is_pregnant && styles.toggleActive]}
                  onPress={() => setEditFormData({...editFormData, is_pregnant: !editFormData.is_pregnant})}
                >
                  <Text style={[styles.toggleText, editFormData.is_pregnant && styles.toggleTextActive]}>
                    Is Pregnant
                  </Text>
                </TouchableOpacity>
              </View>

              {editFormData.has_allergies && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Allergies Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editFormData.allergies_description}
                    onChangeText={(value) => setEditFormData({...editFormData, allergies_description: value})}
                    placeholder="Describe allergies"
                    placeholderTextColor="#a0a0a0"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}

              {editFormData.is_pregnant && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Pregnancy Weeks</Text>
                  <TextInput
                    style={styles.input}
                    value={editFormData.pregnancy_weeks}
                    onChangeText={(value) => setEditFormData({...editFormData, pregnancy_weeks: value})}
                    placeholder="Enter pregnancy weeks"
                    placeholderTextColor="#a0a0a0"
                    keyboardType="numeric"
                  />
                </View>
              )}

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
                onPress={showEditConfirmation}
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
                  Are you sure you want to delete this participant?
                </Text>
                {selectedParticipant && (
                  <View style={styles.participantDetails}>
                    <Text style={styles.participantDetailText}>
                      <Text style={styles.detailLabel}>Name:</Text> {selectedParticipant.name}
                    </Text>
                    <Text style={styles.participantDetailText}>
                      <Text style={styles.detailLabel}>Email:</Text> {selectedParticipant.email}
                    </Text>
                    <Text style={styles.participantDetailText}>
                      <Text style={styles.detailLabel}>Job:</Text> {selectedParticipant.job_position_name || 'N/A'}
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

      {/* Edit Confirmation Modal */}
      <Modal
        visible={showEditConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditConfirmModal(false)}
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
                    <Ionicons name="create" size={28} color="#f59e0b" />
                  </View>
                  <Text style={styles.modalTitle}>Confirm Edit</Text>
                </View>
                <TouchableOpacity onPress={() => setShowEditConfirmModal(false)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={20} color="#f59e0b" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalMessage}>
                  Are you sure you want to save the changes to this participant?
                </Text>
                {editingParticipant && (
                  <View style={styles.participantDetails}>
                    <Text style={styles.participantDetailText}>
                      <Text style={styles.detailLabel}>Name:</Text> {editingParticipant.name}
                    </Text>
                    <Text style={styles.participantDetailText}>
                      <Text style={styles.detailLabel}>Email:</Text> {editingParticipant.email}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.modalFooter}>
                <View style={styles.confirmButtonContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowEditConfirmModal(false)}
                  >
                    <Ionicons name="close" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveConfirmButton}
                    onPress={handleSaveEdit}
                    disabled={saving}
                  >
                    <Ionicons name="checkmark" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Edit Success Modal */}
      <Modal
        visible={showEditSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditSuccessModal(false)}
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
                  onPress={() => setShowEditSuccessModal(false)}
                >
                  <Ionicons name="checkmark" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>OK</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Edit Error Modal */}
      <Modal
        visible={showEditErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditErrorModal(false)}
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
                  onPress={() => setShowEditErrorModal(false)}
                >
                  <Ionicons name="close" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>OK</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Delete Success Modal */}
      <Modal
        visible={showDeleteSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteSuccessModal(false)}
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
                  onPress={() => setShowDeleteSuccessModal(false)}
                >
                  <Ionicons name="checkmark" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>OK</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Delete Error Modal */}
      <Modal
        visible={showDeleteErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteErrorModal(false)}
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
                  onPress={() => setShowDeleteErrorModal(false)}
                >
                  <Ionicons name="close" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>OK</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Pagination Modal */}
      <Modal
        visible={showPaginationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaginationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Items Per Page</Text>
              <TouchableOpacity onPress={() => setShowPaginationModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.paginationOptions}>
              {[20, 50, 100].map((items) => (
                <TouchableOpacity
                  key={items}
                  style={[
                    styles.paginationOption,
                    itemsPerPage === items && styles.paginationOptionActive
                  ]}
                  onPress={() => handleItemsPerPageChange(items)}
                >
                  <Text style={[
                    styles.paginationOptionText,
                    itemsPerPage === items && styles.paginationOptionTextActive
                  ]}>
                    {items} participants
                  </Text>
                  {itemsPerPage === items && (
                    <Ionicons name="checkmark" size={20} color="#10b981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
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
    paddingHorizontal: getResponsivePadding(),
    paddingTop: getResponsiveSize(25, 30, 35),
    paddingBottom: getResponsiveSize(20, 25, 30),
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.3)',
  },
  backButton: {
    marginRight: getResponsiveSize(15, 18, 20),
  },
  backButtonGradient: {
    padding: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(12, 14, 16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: getResponsiveSize(50, 55, 60),
    height: getResponsiveSize(50, 55, 60),
    borderRadius: getResponsiveSize(25, 27, 30),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSize(15, 18, 20),
  },
  headerIconGradient: {
    width: getResponsiveSize(50, 55, 60),
    height: getResponsiveSize(50, 55, 60),
    borderRadius: getResponsiveSize(25, 27, 30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(22, 26, 30),
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: getResponsiveSize(15, 18, 20),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    marginBottom: getResponsiveSize(12, 15, 18),
  },
  searchIcon: {
    marginRight: getResponsiveSize(8, 10, 12),
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    paddingVertical: getResponsiveSize(12, 14, 16),
  },
  clearButton: {
    padding: getResponsiveSize(4, 6, 8),
  },
  roleFilter: {
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  roleButton: {
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(20, 22, 24),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: getResponsiveSize(8, 10, 12),
  },
  roleButtonActive: {
    backgroundColor: '#6366f1',
  },
  roleButtonText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#ffffff',
  },
  roleButtonTextActive: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: getResponsivePadding(),
    paddingBottom: getResponsiveSize(20, 25, 30),
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: getResponsiveSize(40, 50, 60),
  },
  loadingText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#a0a0a0',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: getResponsiveSize(40, 50, 60),
  },
  emptyTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#ffffff',
    marginTop: getResponsiveSize(12, 15, 18),
  },
  emptySubtitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#a0a0a0',
    textAlign: 'center',
    marginTop: getResponsiveSize(8, 10, 12),
  },
  participantCard: {
    marginBottom: getResponsiveSize(12, 15, 18),
    borderRadius: getResponsiveSize(12, 14, 16),
    overflow: 'hidden',
  },
  cardGradient: {
    padding: getResponsiveSize(16, 18, 20),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSize(12, 15, 18),
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  participantEmail: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#a0a0a0',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  roleText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '700',
    marginLeft: getResponsiveSize(4, 6, 8),
  },
  cardDetails: {
    marginBottom: getResponsiveSize(12, 15, 18),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  detailText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#a0a0a0',
    marginLeft: getResponsiveSize(8, 10, 12),
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: getResponsiveSize(32, 36, 40),
    height: getResponsiveSize(32, 36, 40),
    borderRadius: getResponsiveSize(6, 8, 10),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: getResponsiveSize(2, 3, 4),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  viewButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  editButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  actionButtonText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: getResponsiveSize(4, 6, 8),
  },
  // Filter styles
  filtersContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 14, 16),
    marginBottom: getResponsiveSize(12, 15, 18),
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: getResponsiveSize(8, 10, 12),
    gap: getResponsiveSize(12, 16, 20),
    flexWrap: 'wrap',
  },
  filterGroup: {
    flex: 1,
    minWidth: isSmallScreen ? '100%' : '45%',
  },
  filterLabel: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  filterInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(6, 8, 10),
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(6, 8, 10),
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: getResponsiveSize(4, 6, 8),
  },
  filterButton: {
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(6, 8, 10),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: getResponsiveSize(36, 40, 44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterButtonText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#ffffff',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  // Table styles
  tableContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: getResponsiveSize(16, 18, 20),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    marginHorizontal: getResponsiveSize(8, 12, 16),
    maxWidth: '100%',
    minHeight: getResponsiveSize(400, 500, 600),
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2d1b69',
    paddingVertical: getResponsiveSize(24, 28, 32),
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(99, 102, 241, 0.6)',
    minHeight: getResponsiveSize(90, 100, 110),
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tableHeaderText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'left',
    letterSpacing: 0.5,
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    paddingVertical: getResponsiveSize(8, 10, 12),
    justifyContent: 'center',
    alignItems: 'flex-start',
    lineHeight: getResponsiveSize(22, 24, 26),
  },
  scrollContent: {
    flexGrow: 1,
  },
  tableBody: {
    minWidth: getResponsiveColumnWidth(2800, 3200, 3600), // Responsive width to accommodate larger columns
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: getResponsiveSize(16, 20, 24),
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'flex-start',
    minHeight: getResponsiveSize(100, 110, 120),
  },
  tableRowEven: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableCell: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#e5e7eb',
    textAlign: 'left',
    paddingVertical: getResponsiveSize(20, 24, 28),
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    justifyContent: 'center',
    alignItems: 'flex-start',
    lineHeight: getResponsiveSize(22, 24, 26),
    flexWrap: 'wrap',
  },
  // Responsive column widths for proper alignment - optimized to prevent cramping
  nameColumn: {
    width: getResponsiveColumnWidth(350, 400, 450),
    flex: 0,
    minWidth: getResponsiveColumnWidth(350, 400, 450),
  },
  emailColumn: {
    width: getResponsiveColumnWidth(400, 450, 500),
    flex: 0,
    minWidth: getResponsiveColumnWidth(400, 450, 500),
  },
  phoneColumn: {
    width: getResponsiveColumnWidth(150, 180, 200),
    flex: 0,
    minWidth: getResponsiveColumnWidth(150, 180, 200),
  },
  icColumn: {
    width: getResponsiveColumnWidth(200, 220, 250),
    flex: 0,
    minWidth: getResponsiveColumnWidth(200, 220, 250),
  },
  jobColumn: {
    width: getResponsiveColumnWidth(500, 600, 700),
    flex: 0,
    minWidth: getResponsiveColumnWidth(500, 600, 700),
  },
  workplaceColumn: {
    width: getResponsiveColumnWidth(350, 400, 450),
    flex: 0,
    minWidth: getResponsiveColumnWidth(350, 400, 450),
  },
  blsColumn: {
    width: getResponsiveColumnWidth(150, 180, 200),
    flex: 0,
    minWidth: getResponsiveColumnWidth(150, 180, 200),
  },
  allergiesColumn: {
    width: getResponsiveColumnWidth(120, 140, 160),
    flex: 0,
    minWidth: getResponsiveColumnWidth(120, 140, 160),
  },
  pregnantColumn: {
    width: getResponsiveColumnWidth(120, 140, 160),
    flex: 0,
    minWidth: getResponsiveColumnWidth(120, 140, 160),
  },
  statusColumn: {
    width: getResponsiveColumnWidth(150, 180, 200),
    flex: 0,
    minWidth: getResponsiveColumnWidth(150, 180, 200),
  },
  actionsColumn: {
    width: getResponsiveColumnWidth(150, 180, 200),
    flex: 0,
    minWidth: getResponsiveColumnWidth(150, 180, 200),
  },
  // Status badge styles
  statusBadge: {
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(6, 8, 10),
    borderRadius: getResponsiveSize(12, 14, 16),
    alignSelf: 'center',
    minWidth: getResponsiveSize(60, 70, 80),
    maxWidth: getResponsiveSize(100, 110, 120),
  },
  statusBadgeYes: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  statusBadgeNo: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  statusBadgeText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '600',
    textAlign: 'center',
  },
  statusBadgeTextYes: {
    color: '#ef4444',
  },
  statusBadgeTextNo: {
    color: '#10b981',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: getResponsiveSize(4, 6, 8),
  },
  // Dropdown styles
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(6, 8, 10),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(10, 12, 14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: getResponsiveSize(40, 44, 48),
  },
  dropdownText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#ffffff',
    flex: 1,
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
    borderRadius: getResponsiveSize(12, 14, 16),
    margin: getResponsiveSize(20, 25, 30),
    maxHeight: '70%',
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  editModalContent: {
    maxHeight: '90%',
    width: '95%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsiveSize(16, 18, 20),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.2)',
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCloseButton: {
    width: getResponsiveSize(32, 36, 40),
    height: getResponsiveSize(32, 36, 40),
    borderRadius: getResponsiveSize(16, 18, 20),
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptions: {
    maxHeight: getResponsiveSize(200, 250, 300),
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getResponsiveSize(12, 14, 16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalOptionText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    flex: 1,
  },
  // Job dropdown search container styles
  jobSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(8, 10, 12),
    margin: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  jobSearchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    paddingVertical: getResponsiveSize(12, 14, 16),
  },
  jobSearchIcon: {
    marginLeft: getResponsiveSize(8, 10, 12),
  },
  noResultsContainer: {
    padding: getResponsiveSize(20, 24, 28),
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#a0a0a0',
    fontStyle: 'italic',
  },
  // Edit form styles
  editForm: {
    padding: getResponsiveSize(16, 18, 20),
    maxHeight: getResponsiveSize(400, 500, 600),
  },
  inputGroup: {
    marginBottom: getResponsiveSize(12, 15, 18),
  },
  label: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(8, 10, 12),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(12, 14, 16),
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: getResponsiveSize(80, 90, 100),
    textAlignVertical: 'top',
  },
  toggleGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSize(8, 10, 12),
    marginBottom: getResponsiveSize(12, 15, 18),
  },
  toggle: {
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(20, 22, 24),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  toggleText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#ffffff',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: getResponsiveSize(16, 18, 20),
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
  },
  modalButton: {
    flex: 1,
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(16, 18, 20),
    borderRadius: getResponsiveSize(8, 10, 12),
    alignItems: 'center',
    marginHorizontal: getResponsiveSize(4, 6, 8),
  },
  cancelButton: {
    backgroundColor: '#6b7280',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  modalButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
  // Delete modal styles
  modalGradient: {
    flex: 1,
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIconContainer: {
    marginRight: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(12, 14, 16),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  modalBody: {
    padding: getResponsiveSize(16, 18, 20),
  },
  modalMessage: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  participantDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 14, 16),
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  participantDetailText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#e5e7eb',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  detailLabel: {
    fontWeight: '600',
    color: '#ffffff',
  },
  warningText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#f59e0b',
    textAlign: 'center',
    fontWeight: '600',
  },
  confirmButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveSize(12, 16, 20),
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(14, 16, 18),
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  // Additional button styles for alerts
  saveConfirmButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(14, 16, 18),
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  successButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(14, 16, 18),
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    borderRadius: getResponsiveSize(12, 14, 16),
    alignSelf: 'center',
    minWidth: getResponsiveSize(120, 140, 160),
  },
  errorButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(14, 16, 18),
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    borderRadius: getResponsiveSize(12, 14, 16),
    alignSelf: 'center',
    minWidth: getResponsiveSize(120, 140, 160),
  },
  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingVertical: getResponsiveSize(12, 14, 16),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
  },
  stickyPaginationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingVertical: getResponsiveSize(12, 14, 16),
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(99, 102, 241, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  topPaginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingVertical: getResponsiveSize(12, 14, 16),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getResponsiveSize(8, 10, 12),
    marginHorizontal: getResponsiveSize(8, 12, 16),
    marginBottom: getResponsiveSize(12, 15, 18),
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  paginationInfo: {
    flex: 1,
  },
  paginationText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#a0a0a0',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(12, 16, 20),
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(8, 10, 12),
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    gap: getResponsiveSize(4, 6, 8),
  },
  paginationButtonText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#ffffff',
    fontWeight: '600',
  },
  pageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(4, 6, 8),
  },
  pageButton: {
    width: getResponsiveSize(32, 36, 40),
    height: getResponsiveSize(32, 36, 40),
    borderRadius: getResponsiveSize(6, 8, 10),
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
  },
  pageButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: getResponsiveSize(2, 4, 6),
  },
  pageNumber: {
    width: getResponsiveSize(32, 36, 40),
    height: getResponsiveSize(32, 36, 40),
    borderRadius: getResponsiveSize(6, 8, 10),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pageNumberActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  pageNumberText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#a0a0a0',
    fontWeight: '600',
  },
  pageNumberTextActive: {
    color: '#ffffff',
  },
  // Pagination modal styles
  paginationOptions: {
    padding: getResponsiveSize(16, 18, 20),
  },
  paginationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(16, 18, 20),
    borderRadius: getResponsiveSize(8, 10, 12),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: getResponsiveSize(8, 10, 12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  paginationOptionActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  paginationOptionText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    fontWeight: '600',
  },
  paginationOptionTextActive: {
    color: '#10b981',
  },
  // Course session modal styles
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  sessionInfoText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#a0a0a0',
    fontWeight: '500',
  },
  sessionStatusText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '600',
  },
});
