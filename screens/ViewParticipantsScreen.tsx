import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Modal, SafeAreaView, Dimensions, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ProfileService, Profile } from "../services/ProfileService";
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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>👥 View Participants</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading participants...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Fixed Header - NO POSITION ABSOLUTE */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#3498db" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>👥 View Participants</Text>
            <Text style={styles.subtitle}>✅ All filters restored • Mobile scrolling fixed</Text>
          </View>
        </View>

        {/* Search and Filter Toggle - SCROLLABLE */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search participants by name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          
          <View style={styles.filterControls}>
            <TouchableOpacity
              style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons name="filter" size={20} color={showFilters ? "#fff" : "#3498db"} />
              <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>
                Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
              </Text>
            </TouchableOpacity>
            
            {getActiveFilterCount() > 0 && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.resultCount}>
            {filteredParticipants.length} participant{filteredParticipants.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {/* SCROLLABLE CONTENT - PROPER SCROLLVIEW */}
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Filter Section - INSIDE SCROLLVIEW */}
          {showFilters && (
            <View style={styles.filtersContainer}>
              <Text style={styles.filtersTitle}>🔍 Filter Options</Text>
              
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
            </View>
          )}

          {/* Participants List */}
          <View style={styles.participantsList}>
            {filteredParticipants.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No participants found</Text>
                <Text style={styles.emptySubtitle}>
                  {getActiveFilterCount() > 0 
                    ? 'Try adjusting your filters or search' 
                    : 'No participants available'}
                </Text>
              </View>
            ) : (
              filteredParticipants.map((participant, index) => (
                <TouchableOpacity
                  key={participant.id}
                  style={styles.participantCard}
                  onPress={() => handleParticipantPress(participant)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.participantName}>{participant.name}</Text>
                    <Text style={styles.participantIndex}>#{index + 1}</Text>
                  </View>
                  
                  <Text style={styles.participantEmail}>📧 {participant.email}</Text>
                  <Text style={styles.participantJob}>💼 {participant.job_position_name || 'No job specified'}</Text>
                  <Text style={styles.participantWorkplace}>🏢 {participant.workplace_name || 'No workplace specified'}</Text>
                  
                  {participant.ic_number && (
                    <Text style={styles.participantIC}>🆔 IC: {participant.ic_number}</Text>
                  )}
                  
                  <View style={styles.statusRow}>
                    {participant.has_allergies && (
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>⚠️ Allergies</Text>
                      </View>
                    )}
                    {participant.is_pregnant && (
                      <View style={[styles.statusBadge, { backgroundColor: '#f39c12' }]}>
                        <Text style={styles.statusText}>🤰 Pregnant</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
          
          {/* Bottom spacing for scroll */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>

      {/* Participant Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Participant Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          
          {selectedParticipant && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalParticipantName}>{selectedParticipant.name}</Text>
              
              <View style={styles.detailSection}>
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
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>💼 Work Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Job Position:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.job_position_name || 'Not specified'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Workplace:</Text>
                  <Text style={styles.detailValue}>{selectedParticipant.workplace_name || 'Not specified'}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
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
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  // Header styles - NO POSITION ABSOLUTE
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
    marginLeft: 5,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
  },
  // Search section - NO POSITION ABSOLUTE
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 15,
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
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  filterToggleActive: {
    backgroundColor: '#3498db',
  },
  filterToggleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
  },
  filterToggleTextActive: {
    color: '#fff',
  },
  clearFiltersButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  // Scroll container - PROPER SCROLLVIEW
  scrollContainer: {
    flex: 1,
  },
  // Filters container - INSIDE SCROLLVIEW
  filtersContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
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
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
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
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginTop: 5,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownSearch: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    margin: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dropdownList: {
    maxHeight: 140,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextActive: {
    color: '#3498db',
    fontWeight: '600',
  },
  // Participants list
  participantsList: {
    padding: 20,
  },
  participantCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
  },
  participantIndex: {
    fontSize: 14,
    color: '#6c757d',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  participantEmail: {
    fontSize: 14,
    color: '#3498db',
    marginBottom: 6,
  },
  participantJob: {
    fontSize: 14,
    color: '#e67e22',
    marginBottom: 6,
  },
  participantWorkplace: {
    fontSize: 14,
    color: '#27ae60',
    marginBottom: 6,
  },
  participantIC: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#adb5bd',
    textAlign: 'center',
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6c757d',
  },
  bottomSpacing: {
    height: 50,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalParticipantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 30,
  },
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
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
  },
});