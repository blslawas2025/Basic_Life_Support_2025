import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { CourseSessionService } from "../services/CourseSessionService";
import { ProfileService } from "../services/ProfileService";
import { CourseSession, AttendanceRecord, AttendanceSummary } from "../types/CourseSession";
import { Profile } from "../types/Profile";

const { width, height } = Dimensions.get('window');

// Responsive design helpers
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

interface AttendanceTrackingScreenProps {
  onBack: () => void;
  courseSessionId?: string; // If provided, load specific course session
}

export default function AttendanceTrackingScreen({ onBack, courseSessionId }: AttendanceTrackingScreenProps) {
  const [courseSessions, setCourseSessions] = useState<CourseSession[]>([]);
  const [selectedCourseSession, setSelectedCourseSession] = useState<CourseSession | null>(null);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Modal states
  const [showCourseSelector, setShowCourseSelector] = useState<boolean>(false);
  const [showCheckInModal, setShowCheckInModal] = useState<boolean>(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Profile | null>(null);
  const [checkInNotes, setCheckInNotes] = useState<string>("");
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    startAnimations();
    loadCourseSessions();
    
    // If courseSessionId is provided, load that specific session
    if (courseSessionId) {
      loadCourseSession(courseSessionId);
    }
  }, [courseSessionId]);

  const startAnimations = () => {
    Animated.stagger(200, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadCourseSessions = async () => {
    try {
      setIsLoading(true);
      const sessions = await CourseSessionService.getAllCourseSessions();
      setCourseSessions(sessions);
    } catch (error) {
      console.error('Error loading course sessions:', error);
      Alert.alert("Error", "Failed to load course sessions.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourseSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const [session, participants, summary] = await Promise.all([
        CourseSessionService.getCourseSessionById(sessionId),
        ProfileService.getParticipantsByCourseSession(sessionId),
        CourseSessionService.getAttendanceSummary(sessionId)
      ]);

      if (session) {
        setSelectedCourseSession(session);
        setParticipants(participants);
        setAttendanceSummary(summary);
      }
    } catch (error) {
      console.error('Error loading course session:', error);
      Alert.alert("Error", "Failed to load course session data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseSessionSelect = (session: CourseSession) => {
    setSelectedCourseSession(session);
    setShowCourseSelector(false);
    loadCourseSession(session.id);
  };

  const handleCheckInParticipant = (participant: Profile) => {
    setSelectedParticipant(participant);
    setCheckInNotes("");
    setShowCheckInModal(true);
  };

  const confirmCheckIn = async () => {
    if (!selectedParticipant || !selectedCourseSession) return;

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await CourseSessionService.checkInParticipant(
        selectedCourseSession.id,
        selectedParticipant.id,
        selectedParticipant.name,
        selectedParticipant.ic_number,
        undefined, // checkedInBy - could be current user
        checkInNotes
      );

      Alert.alert(
        "Success!",
        `${selectedParticipant.name} has been checked in successfully.`,
        [{ text: "OK" }]
      );

      setShowCheckInModal(false);
      setSelectedParticipant(null);
      setCheckInNotes("");
      
      // Reload attendance data
      if (selectedCourseSession) {
        await loadCourseSession(selectedCourseSession.id);
      }

    } catch (error) {
      console.error('Error checking in participant:', error);
      Alert.alert("Error", "Failed to check in participant. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAbsent = async (participant: Profile) => {
    if (!selectedCourseSession) return;

    Alert.alert(
      "Mark Absent",
      `Are you sure you want to mark ${participant.name} as absent?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

              await CourseSessionService.markParticipantAbsent(
                selectedCourseSession.id,
                participant.id,
                participant.name,
                participant.ic_number
              );

              Alert.alert("Success!", `${participant.name} has been marked as absent.`);
              
              // Reload attendance data
              await loadCourseSession(selectedCourseSession.id);

            } catch (error) {
              console.error('Error marking participant absent:', error);
              Alert.alert("Error", "Failed to mark participant absent. Please try again.");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const getAttendanceStatus = (participant: Profile): 'present' | 'absent' | 'not_checked' => {
    if (!attendanceSummary) return 'not_checked';
    
    const record = attendanceSummary.attendance_records.find(
      record => record.participant_id === participant.id
    );
    
    if (!record) return 'not_checked';
    return record.status;
  };

  const filteredParticipants = participants.filter(participant =>
    participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    participant.ic_number.includes(searchQuery)
  );

  const renderParticipantItem = ({ item: participant }: { item: Profile }) => {
    const attendanceStatus = getAttendanceStatus(participant);
    
    const getStatusColor = () => {
      switch (attendanceStatus) {
        case 'present': return '#00ff88';
        case 'absent': return '#ff4757';
        default: return '#ffaa00';
      }
    };

    const getStatusText = () => {
      switch (attendanceStatus) {
        case 'present': return 'Present';
        case 'absent': return 'Absent';
        default: return 'Not Checked';
      }
    };

    const getStatusIcon = () => {
      switch (attendanceStatus) {
        case 'present': return 'checkmark-circle';
        case 'absent': return 'close-circle';
        default: return 'time';
      }
    };

    return (
      <View style={styles.participantCard}>
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>{participant.name}</Text>
          <Text style={styles.participantIc}>IC: {participant.ic_number}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Ionicons name={getStatusIcon()} size={16} color={getStatusColor()} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        
        <View style={styles.participantActions}>
          {attendanceStatus !== 'present' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.checkInButton]}
              onPress={() => handleCheckInParticipant(participant)}
              disabled={isLoading}
            >
              <Ionicons name="checkmark" size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Check In</Text>
            </TouchableOpacity>
          )}
          
          {attendanceStatus !== 'absent' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.absentButton]}
              onPress={() => handleMarkAbsent(participant)}
              disabled={isLoading}
            >
              <Ionicons name="close" size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Absent</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderCourseSessionItem = ({ item: session }: { item: CourseSession }) => (
    <TouchableOpacity
      style={styles.courseSessionItem}
      onPress={() => handleCourseSessionSelect(session)}
    >
      <View style={styles.courseSessionInfo}>
        <Text style={styles.courseSessionName}>{session.full_name}</Text>
        <Text style={styles.courseSessionDate}>
          {session.start_date ? new Date(session.start_date).toLocaleDateString() : 'TBA'}
          {session.venue && ` • ${session.venue}`}
        </Text>
        <Text style={styles.courseSessionParticipants}>
          {session.current_participants}/{session.max_participants} participants
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ffffff" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background */}
      <LinearGradient 
        colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#533483"]} 
        style={styles.background}
      />

      {/* Header */}
      <Animated.View style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Attendance Tracking</Text>
          <Text style={styles.headerSubtitle}>
            {selectedCourseSession ? selectedCourseSession.full_name : "Select a course session"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.courseSelectorButton}
          onPress={() => setShowCourseSelector(true)}
        >
          <Ionicons name="school" size={24} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      {selectedCourseSession ? (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Attendance Summary */}
          {attendanceSummary && (
            <Animated.View style={[
              styles.summaryContainer,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0]
                  }) }
                ]
              }
            ]}>
              <Text style={styles.summaryTitle}>Attendance Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryNumber}>{attendanceSummary.total_registered}</Text>
                  <Text style={styles.summaryLabel}>Total Registered</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={[styles.summaryNumber, { color: '#00ff88' }]}>
                    {attendanceSummary.total_present}
                  </Text>
                  <Text style={styles.summaryLabel}>Present</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={[styles.summaryNumber, { color: '#ff4757' }]}>
                    {attendanceSummary.total_absent}
                  </Text>
                  <Text style={styles.summaryLabel}>Absent</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={[styles.summaryNumber, { color: '#ffaa00' }]}>
                    {attendanceSummary.attendance_rate}%
                  </Text>
                  <Text style={styles.summaryLabel}>Attendance Rate</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.5)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search participants..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Participants List */}
          <Animated.View style={[
            styles.participantsContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [150, 0]
                }) }
              ]
            }
          ]}>
            <Text style={styles.participantsTitle}>
              Participants ({filteredParticipants.length})
            </Text>
            {filteredParticipants.length > 0 ? (
              <FlatList
                data={filteredParticipants}
                renderItem={renderParticipantItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.participantsList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyStateText}>No participants found</Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="school-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
          <Text style={styles.emptyTitle}>Select a Course Session</Text>
          <Text style={styles.emptySubtitle}>
            Choose a course session to start tracking attendance
          </Text>
          <TouchableOpacity
            style={styles.selectCourseButton}
            onPress={() => setShowCourseSelector(true)}
          >
            <LinearGradient
              colors={["#00ff88", "#00d4ff"]}
              style={styles.selectCourseButtonGradient}
            >
              <Ionicons name="school" size={20} color="#ffffff" />
              <Text style={styles.selectCourseButtonText}>Select Course</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Course Session Selector Modal */}
      <Modal
        visible={showCourseSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCourseSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Course Session</Text>
              <TouchableOpacity
                onPress={() => setShowCourseSelector(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={courseSessions}
              renderItem={renderCourseSessionItem}
              keyExtractor={(item) => item.id}
              style={styles.courseSessionList}
            />
          </View>
        </View>
      </Modal>

      {/* Check In Modal */}
      <Modal
        visible={showCheckInModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCheckInModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.checkInModalContent}>
            <Text style={styles.checkInModalTitle}>
              Check In: {selectedParticipant?.name}
            </Text>
            <Text style={styles.checkInModalSubtitle}>
              IC: {selectedParticipant?.ic_number}
            </Text>
            
            <TextInput
              style={styles.notesInput}
              placeholder="Add notes (optional)..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={checkInNotes}
              onChangeText={setCheckInNotes}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.checkInModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCheckInModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmCheckIn}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={["#00ff88", "#00d4ff"]}
                  style={styles.confirmButtonGradient}
                >
                  <Ionicons name="checkmark" size={16} color="#ffffff" />
                  <Text style={styles.confirmButtonText}>
                    {isLoading ? "Checking In..." : "Check In"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
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
    backgroundColor: '#0a0a0a',
  },
  background: {
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
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 255, 136, 0.4)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  courseSelectorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: getResponsivePadding(),
  },
  emptyTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
  },
  selectCourseButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectCourseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  selectCourseButtonText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
  },
  summaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#00ff88',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: (width - 72) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: getResponsiveFontSize(24, 28, 32),
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    marginLeft: 12,
  },
  participantsContainer: {
    marginBottom: 20,
  },
  participantsTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  participantsList: {
    gap: 12,
  },
  participantCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  participantIc: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  statusText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
  },
  participantActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  checkInButton: {
    backgroundColor: '#00ff88',
  },
  absentButton: {
    backgroundColor: '#ff4757',
  },
  actionButtonText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#ffffff',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseSessionList: {
    maxHeight: height * 0.5,
  },
  courseSessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  courseSessionInfo: {
    flex: 1,
  },
  courseSessionName: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  courseSessionDate: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  courseSessionParticipants: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.5)',
  },
  // Check In Modal styles
  checkInModalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkInModalTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  checkInModalSubtitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 24,
    textAlignVertical: 'top',
  },
  checkInModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
  },
  confirmButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
  },
});
