import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Modal, SafeAreaView, Dimensions, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ProfileService, Profile, UpdateProfile } from "../services/ProfileService";
import { CourseSessionService } from "../services/CourseSessionService";
import { CourseSession } from "../types/CourseSession";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get('window');
const isSmallScreen = width < 768;

interface ViewParticipantsScreenProps {
  onBack: () => void;
}

export default function ViewParticipantsScreen({ onBack }: ViewParticipantsScreenProps) {
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedParticipant, setSelectedParticipant] = useState<Profile | null>(null);
  const [showModal, setShowModal] = useState(false);

  // EDIT/DELETE FUNCTIONALITY
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Profile | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // RESTORED FILTER STATES
  const [jobFilter, setJobFilter] = useState<string>('');
  const [allergiesFilter, setAllergiesFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [pregnantFilter, setPregnantFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [courseSessionFilter, setCourseSessionFilter] = useState<string>('');
  const [courseSessions, setCourseSessions] = useState<CourseSession[]>([]);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [showCourseSessionDropdown, setShowCourseSessionDropdown] = useState(false);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [courseSessionSearchQuery, setCourseSessionSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadParticipants();
    loadCourseSessions();
    startAnimations();
  }, []);

  useEffect(() => {
    filterParticipants();
  }, [participants, searchQuery, jobFilter, allergiesFilter, pregnantFilter, courseSessionFilter]);

  const startAnimations = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const loadParticipants = async () => {
    try {
      setLoading(true);
      const allProfiles = await ProfileService.getAllProfiles();
      const userProfiles = allProfiles.filter(p => p.roles === 'user');
      console.log('Loaded participants:', userProfiles); // Debug log
      setParticipants(userProfiles);
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
    }
  };

  // RESTORED FILTER LOGIC
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

    // Sort by name A-Z
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredParticipants(filtered);
  };

  // EDIT/DELETE HANDLERS
  const handleEditParticipant = (participant: Profile) => {
    setEditingParticipant(participant);
    setEditFormData({
      name: participant.name,
      email: participant.email,
      ic_number: participant.ic_number,
      phone_number: participant.phone_number || '',
              job_position_name: participant.job_position_name || '',
              tempat_bertugas: participant.tempat_bertugas || '',
      has_allergies: participant.has_allergies,
      is_pregnant: participant.is_pregnant,
    });
    setShowEditModal(true);
  };

  const handleDeleteParticipant = (participant: Profile) => {
    setSelectedParticipant(participant);
    setShowDeleteModal(true);
  };

  const saveParticipantEdit = async () => {
    if (!editingParticipant) return;

    try {
      setSaving(true);
      const updateData: UpdateProfile = {
        name: editFormData.name,
        email: editFormData.email,
        ic_number: editFormData.ic_number,
        phone_number: editFormData.phone_number,
        job_position_name: editFormData.job_position_name,
        tempat_bertugas: editFormData.tempat_bertugas,
        has_allergies: editFormData.has_allergies,
        is_pregnant: editFormData.is_pregnant,
      };

      await ProfileService.updateProfile(editingParticipant.id, updateData);
      Alert.alert('Success', 'Participant updated successfully');
      setShowEditModal(false);
      setEditingParticipant(null);
      loadParticipants(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating participant:', error);
      Alert.alert('Error', 'Failed to update participant');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteParticipant = async () => {
    if (!selectedParticipant) return;

    try {
      setDeleting(true);
      await ProfileService.deleteProfile(selectedParticipant.id);
      Alert.alert('Success', 'Participant deleted successfully');
      setShowDeleteModal(false);
      setSelectedParticipant(null);
      loadParticipants(); // Reload to get updated data
    } catch (error) {
      console.error('Error deleting participant:', error);
      Alert.alert('Error', 'Failed to delete participant');
    } finally {
      setDeleting(false);
    }
  };

  // Get unique job positions for dropdown
  const getUniqueJobPositions = () => {
    const jobs = participants
      .map(p => p.job_position_name)
      .filter((job, index, arr) => job && arr.indexOf(job) === index)
      .sort();
    return jobs;
  };

  // Filter job positions based on search
  const getFilteredJobPositions = () => {
    const allJobs = getUniqueJobPositions();
    if (!jobSearchQuery.trim()) return allJobs;
    return allJobs.filter(job => 
      job.toLowerCase().includes(jobSearchQuery.toLowerCase())
    );
  };

  // Filter course sessions based on search
  const getFilteredCourseSessions = () => {
    if (!courseSessionSearchQuery.trim()) return courseSessions;
    return courseSessions.filter(session =>
      session.course_name.toLowerCase().includes(courseSessionSearchQuery.toLowerCase())
    );
  };

  const handleParticipantPress = (participant: Profile) => {
    setSelectedParticipant(participant);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedParticipant(null);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setJobFilter('');
    setAllergiesFilter('all');
    setPregnantFilter('all');
    setCourseSessionFilter('');
    setJobSearchQuery('');
    setCourseSessionSearchQuery('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (jobFilter.trim()) count++;
    if (allergiesFilter !== 'all') count++;
    if (pregnantFilter !== 'all') count++;
    if (courseSessionFilter.trim()) count++;
    return count;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>👥 View Participants</Text>
          </View>
          <View style={styles.loadingContainer}>
            <Ionicons name="people" size={60} color="#fff" />
            <Text style={styles.loadingText}>Loading participants...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Enhanced Header with Gradient */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Text style={styles.title}>👥 View Participants</Text>
              <Text style={styles.subtitle}>✨ Enhanced Design • Full CRUD • Fixed Data</Text>
            </View>
          </View>

          {/* Search and Filter Section with Glass Effect */}
          <View style={styles.searchSection}>
            <LinearGradient 
              colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']} 
              style={styles.searchGradient}
            >
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 Search participants by name..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#666"
              />
              
              <View style={styles.filterControls}>
                <TouchableOpacity
                  style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Ionicons name="filter" size={20} color={showFilters ? "#fff" : "#667eea"} />
                  <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>
                    Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
                  </Text>
                </TouchableOpacity>
                
                {getActiveFilterCount() > 0 && (
                  <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
                    <Ionicons name="refresh" size={16} color="#fff" />
                    <Text style={styles.clearFiltersText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.resultCount}>
                {filteredParticipants.length} participant{filteredParticipants.length !== 1 ? 's' : ''} found
              </Text>
            </LinearGradient>
          </View>

          {/* SCROLLABLE CONTENT */}
          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Filter Section with Glass Effect */}
            {showFilters && (
              <View style={styles.filtersContainer}>
                <LinearGradient 
                  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']} 
                  style={styles.filtersGradient}
                >
                  <Text style={styles.filtersTitle}>🔍 Advanced Filters</Text>
                  
                  {/* Job Position Filter */}
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>💼 Job Position:</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowJobDropdown(!showJobDropdown)}
                    >
                      <Text style={styles.dropdownButtonText}>
                        {jobFilter || 'All Jobs'}
                      </Text>
                      <Ionicons name={showJobDropdown ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                    </TouchableOpacity>
                    
                    {showJobDropdown && (
                      <View style={styles.dropdown}>
                        <TextInput
                          style={styles.dropdownSearch}
                          placeholder="Search jobs..."
                          value={jobSearchQuery}
                          onChangeText={setJobSearchQuery}
                          placeholderTextColor="#999"
                        />
                        <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                          <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => {
                              setJobFilter('');
                              setShowJobDropdown(false);
                              setJobSearchQuery('');
                            }}
                          >
                            <Text style={[styles.dropdownItemText, !jobFilter && styles.dropdownItemTextActive]}>
                              All Jobs
                            </Text>
                          </TouchableOpacity>
                          {getFilteredJobPositions().map((job, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.dropdownItem}
                              onPress={() => {
                                setJobFilter(job);
                                setShowJobDropdown(false);
                                setJobSearchQuery('');
                              }}
                            >
                              <Text style={[styles.dropdownItemText, jobFilter === job && styles.dropdownItemTextActive]}>
                                {job}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* Allergies Filter */}
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>⚠️ Allergies:</Text>
                    <View style={styles.filterButtons}>
                      {['all', 'yes', 'no'].map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.filterButton,
                            allergiesFilter === option && styles.filterButtonActive
                          ]}
                          onPress={() => setAllergiesFilter(option as any)}
                        >
                          <Text style={[
                            styles.filterButtonText,
                            allergiesFilter === option && styles.filterButtonTextActive
                          ]}>
                            {option === 'all' ? 'All' : option === 'yes' ? 'Yes' : 'No'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Pregnant Filter */}
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>🤰 Pregnant:</Text>
                    <View style={styles.filterButtons}>
                      {['all', 'yes', 'no'].map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.filterButton,
                            pregnantFilter === option && styles.filterButtonActive
                          ]}
                          onPress={() => setPregnantFilter(option as any)}
                        >
                          <Text style={[
                            styles.filterButtonText,
                            pregnantFilter === option && styles.filterButtonTextActive
                          ]}>
                            {option === 'all' ? 'All' : option === 'yes' ? 'Yes' : 'No'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Course Session Filter */}
                  {courseSessions.length > 0 && (
                    <View style={styles.filterGroup}>
                      <Text style={styles.filterLabel}>🎓 Course Session:</Text>
                      <TouchableOpacity
                        style={styles.dropdownButton}
                        onPress={() => setShowCourseSessionDropdown(!showCourseSessionDropdown)}
                      >
                        <Text style={styles.dropdownButtonText}>
                          {courseSessionFilter ? 
                            courseSessions.find(s => s.id === courseSessionFilter)?.course_name || 'All Sessions'
                            : 'All Sessions'
                          }
                        </Text>
                        <Ionicons name={showCourseSessionDropdown ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                      </TouchableOpacity>
                      
                      {showCourseSessionDropdown && (
                        <View style={styles.dropdown}>
                          <TextInput
                            style={styles.dropdownSearch}
                            placeholder="Search sessions..."
                            value={courseSessionSearchQuery}
                            onChangeText={setCourseSessionSearchQuery}
                            placeholderTextColor="#999"
                          />
                          <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => {
                                setCourseSessionFilter('');
                                setShowCourseSessionDropdown(false);
                                setCourseSessionSearchQuery('');
                              }}
                            >
                              <Text style={[styles.dropdownItemText, !courseSessionFilter && styles.dropdownItemTextActive]}>
                                All Sessions
                              </Text>
                            </TouchableOpacity>
                            {getFilteredCourseSessions().map((session) => (
                              <TouchableOpacity
                                key={session.id}
                                style={styles.dropdownItem}
                                onPress={() => {
                                  setCourseSessionFilter(session.id);
                                  setShowCourseSessionDropdown(false);
                                  setCourseSessionSearchQuery('');
                                }}
                              >
                                <Text style={[styles.dropdownItemText, courseSessionFilter === session.id && styles.dropdownItemTextActive]}>
                                  {session.course_name}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  )}
                </LinearGradient>
              </View>
            )}

            {/* Enhanced Participants List */}
            <View style={styles.participantsList}>
              {filteredParticipants.length === 0 ? (
                <View style={styles.emptyState}>
                  <LinearGradient 
                    colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']} 
                    style={styles.emptyStateGradient}
                  >
                    <Ionicons name="people-outline" size={60} color="#667eea" />
                    <Text style={styles.emptyTitle}>No participants found</Text>
                    <Text style={styles.emptySubtitle}>
                      {getActiveFilterCount() > 0 
                        ? 'Try adjusting your filters or search' 
                        : 'No participants available'}
                    </Text>
                  </LinearGradient>
                </View>
              ) : (
                filteredParticipants.map((participant, index) => (
                  <View key={participant.id} style={styles.participantCardWrapper}>
                    <LinearGradient 
                      colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']} 
                      style={styles.participantCardGradient}
                    >
                      <TouchableOpacity
                        style={styles.participantCard}
                        onPress={() => handleParticipantPress(participant)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.cardHeader}>
                          <View style={styles.nameSection}>
                            <Text style={styles.participantName}>{participant.name}</Text>
                            <Text style={styles.participantIndex}>#{index + 1}</Text>
                          </View>
                          
                          {/* EDIT/DELETE BUTTONS */}
                          <View style={styles.actionButtons}>
                            <TouchableOpacity
                              style={styles.editButton}
                              onPress={() => handleEditParticipant(participant)}
                            >
                              <Ionicons name="pencil" size={16} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => handleDeleteParticipant(participant)}
                            >
                              <Ionicons name="trash" size={16} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        </View>
                        
                        <View style={styles.participantInfo}>
                          <View style={styles.infoRow}>
                            <Ionicons name="mail" size={16} color="#667eea" />
                            <Text style={styles.participantEmail}>{participant.email}</Text>
                          </View>
                          
                          <View style={styles.infoRow}>
                            <Ionicons name="briefcase" size={16} color="#f39c12" />
                            <Text style={styles.participantJob}>
                              {participant.job_position_name || 'No job specified'}
                            </Text>
                          </View>
                          
                          <View style={styles.infoRow}>
                            <Ionicons name="business" size={16} color="#27ae60" />
                            <Text style={styles.participantWorkplace}>
                              {participant.tempat_bertugas || 'No workplace specified'}
                            </Text>
                          </View>
                          
                          {participant.ic_number && (
                            <View style={styles.infoRow}>
                              <Ionicons name="card" size={16} color="#6c757d" />
                              <Text style={styles.participantIC}>IC: {participant.ic_number}</Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.statusRow}>
                          {participant.has_allergies && (
                            <View style={styles.allergyBadge}>
                              <Ionicons name="warning" size={12} color="#fff" />
                              <Text style={styles.statusText}>Allergies</Text>
                            </View>
                          )}
                          {participant.is_pregnant && (
                            <View style={styles.pregnantBadge}>
                              <Ionicons name="heart" size={12} color="#fff" />
                              <Text style={styles.statusText}>Pregnant</Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                ))
              )}
            </View>
            
            {/* Bottom spacing for scroll */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </Animated.View>
      </SafeAreaView>

      {/* Enhanced Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalBackground} />
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Participant Details</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {selectedParticipant && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalParticipantName}>{selectedParticipant.name}</Text>
                
                <View style={styles.detailSection}>
                  <LinearGradient 
                    colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']} 
                    style={styles.detailSectionGradient}
                  >
                    <Text style={styles.sectionTitle}>📧 Contact Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Email:</Text>
                      <Text style={styles.detailValue}>{selectedParticipant.email}</Text>
                    </View>
                    {selectedParticipant.phone_number && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Phone:</Text>
                        <Text style={styles.detailValue}>{selectedParticipant.phone_number}</Text>
                      </View>
                    )}
                    {selectedParticipant.ic_number && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>IC Number:</Text>
                        <Text style={styles.detailValue}>{selectedParticipant.ic_number}</Text>
                      </View>
                    )}
                  </LinearGradient>
                </View>

                <View style={styles.detailSection}>
                  <LinearGradient 
                    colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']} 
                    style={styles.detailSectionGradient}
                  >
                    <Text style={styles.sectionTitle}>💼 Work Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Job Position:</Text>
                      <Text style={styles.detailValue}>{selectedParticipant.job_position_name || 'Not specified'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Workplace:</Text>
                      <Text style={styles.detailValue}>{selectedParticipant.tempat_bertugas || 'Not specified'}</Text>
                    </View>
                  </LinearGradient>
                </View>

                <View style={styles.detailSection}>
                  <LinearGradient 
                    colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']} 
                    style={styles.detailSectionGradient}
                  >
                    <Text style={styles.sectionTitle}>🏥 Medical Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Allergies:</Text>
                      <Text style={[styles.detailValue, { color: selectedParticipant.has_allergies ? '#e74c3c' : '#27ae60' }]}>
                        {selectedParticipant.has_allergies ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Pregnant:</Text>
                      <Text style={[styles.detailValue, { color: selectedParticipant.is_pregnant ? '#f39c12' : '#27ae60' }]}>
                        {selectedParticipant.is_pregnant ? 'Yes' : 'No'}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalBackground} />
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Participant</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.editForm}>
                <LinearGradient 
                  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']} 
                  style={styles.editFormGradient}
                >
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Name</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editFormData.name}
                      onChangeText={(text) => setEditFormData({...editFormData, name: text})}
                      placeholder="Full name"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editFormData.email}
                      onChangeText={(text) => setEditFormData({...editFormData, email: text})}
                      placeholder="Email address"
                      keyboardType="email-address"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>IC Number</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editFormData.ic_number}
                      onChangeText={(text) => setEditFormData({...editFormData, ic_number: text})}
                      placeholder="IC Number"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editFormData.phone_number}
                      onChangeText={(text) => setEditFormData({...editFormData, phone_number: text})}
                      placeholder="Phone number"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Job Position</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editFormData.job_position_name}
                      onChangeText={(text) => setEditFormData({...editFormData, job_position_name: text})}
                      placeholder="Job position"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Workplace</Text>
                    <TextInput
                      style={styles.editInput}
                      value={editFormData.tempat_bertugas}
                      onChangeText={(text) => setEditFormData({...editFormData, tempat_bertugas: text})}
                      placeholder="Workplace name"
                    />
                  </View>

                  <View style={styles.checkboxGroup}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => setEditFormData({...editFormData, has_allergies: !editFormData.has_allergies})}
                    >
                      <Ionicons 
                        name={editFormData.has_allergies ? "checkbox" : "square-outline"} 
                        size={24} 
                        color="#667eea" 
                      />
                      <Text style={styles.checkboxLabel}>Has allergies</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.checkboxGroup}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => setEditFormData({...editFormData, is_pregnant: !editFormData.is_pregnant})}
                    >
                      <Ionicons 
                        name={editFormData.is_pregnant ? "checkbox" : "square-outline"} 
                        size={24} 
                        color="#667eea" 
                      />
                      <Text style={styles.checkboxLabel}>Is pregnant</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveParticipantEdit}
                    disabled={saving}
                  >
                    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.saveButtonGradient}>
                      {saving ? (
                        <Text style={styles.saveButtonText}>Saving...</Text>
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={20} color="#fff" />
                          <Text style={styles.saveButtonText}>Save Changes</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <LinearGradient 
              colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.95)']} 
              style={styles.deleteModalGradient}
            >
              <Ionicons name="warning" size={60} color="#e74c3c" />
              <Text style={styles.deleteModalTitle}>Delete Participant</Text>
              <Text style={styles.deleteModalText}>
                Are you sure you want to delete{' '}
                <Text style={styles.deleteModalName}>{selectedParticipant?.name}</Text>?
                {'\n\n'}This action cannot be undone.
              </Text>
              
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.confirmDeleteButton}
                  onPress={confirmDeleteParticipant}
                  disabled={deleting}
                >
                  <LinearGradient colors={['#e74c3c', '#c0392b']} style={styles.confirmDeleteGradient}>
                    {deleting ? (
                      <Text style={styles.confirmDeleteText}>Deleting...</Text>
                    ) : (
                      <>
                        <Ionicons name="trash" size={16} color="#fff" />
                        <Text style={styles.confirmDeleteText}>Delete</Text>
                      </>
                    )}
                  </LinearGradient>
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
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  // Enhanced Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  // Enhanced Search Section
  searchSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  searchGradient: {
    padding: 20,
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.3)',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#667eea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterToggleActive: {
    backgroundColor: '#667eea',
  },
  filterToggleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
  },
  filterToggleTextActive: {
    color: '#fff',
  },
  clearFiltersButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  resultCount: {
    fontSize: 14,
    color: '#667eea',
    textAlign: 'center',
    fontWeight: '600',
  },
  // Scroll container
  scrollContainer: {
    flex: 1,
  },
  // Enhanced Filters Container
  filtersContainer: {
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  filtersGradient: {
    padding: 20,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 20,
    textAlign: 'center',
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.3)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  dropdownButton: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.3)',
    marginTop: 5,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownSearch: {
    backgroundColor: 'rgba(248,249,250,0.8)',
    borderRadius: 8,
    padding: 10,
    margin: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.2)',
  },
  dropdownList: {
    maxHeight: 140,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(248,249,250,0.5)',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextActive: {
    color: '#667eea',
    fontWeight: '600',
  },
  // Enhanced Participants List
  participantsList: {
    padding: 20,
  },
  participantCardWrapper: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  participantCardGradient: {
    padding: 0,
  },
  participantCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nameSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginRight: 10,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  participantIndex: {
    fontSize: 12,
    color: '#667eea',
    backgroundColor: 'rgba(102,126,234,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontWeight: '600',
  },
  // EDIT/DELETE BUTTONS
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3498db',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  participantInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  participantEmail: {
    fontSize: 14,
    color: '#667eea',
    marginLeft: 8,
    flex: 1,
  },
  participantJob: {
    fontSize: 14,
    color: '#f39c12',
    marginLeft: 8,
    flex: 1,
  },
  participantWorkplace: {
    fontSize: 14,
    color: '#27ae60',
    marginLeft: 8,
    flex: 1,
  },
  participantIC: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 8,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyBadge: {
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pregnantBadge: {
    backgroundColor: '#f39c12',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Enhanced Empty State
  emptyState: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyStateGradient: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 8,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 50,
  },
  // Enhanced Modal styles
  modalContainer: {
    flex: 1,
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalParticipantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  detailSection: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  detailSectionGradient: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(102,126,234,0.1)',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
  },
  // Edit Form Styles
  editForm: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editFormGradient: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkboxGroup: {
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  saveButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  deleteModalGradient: {
    padding: 30,
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 16,
    marginBottom: 8,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  deleteModalName: {
    fontWeight: 'bold',
    color: '#667eea',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(108,117,125,0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  confirmDeleteGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  confirmDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});