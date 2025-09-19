import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  RefreshControl,
  Modal,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useContainerMaxWidth } from "../utils/uiHooks";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { CourseSessionService } from "../services/CourseSessionService";
import { ProfileService } from "../services/ProfileService";
import { AttendanceService } from "../services/AttendanceService";
import { getResponsiveFontSize, getResponsivePadding, getResponsiveSize } from "../utils/responsiveHelpers";
import { CourseSession } from "../types/CourseSession";
import { Profile } from "../types/Profile";
import QRCode from 'react-native-qrcode-svg';
import { BarCodeScanner } from 'expo-barcode-scanner';

import { AttendanceRecord } from "../services/AttendanceService";

interface AttendanceMonitoringScreenProps {
  onBack: () => void;
}

export default function AttendanceMonitoringScreen({ onBack }: AttendanceMonitoringScreenProps) {
  const containerMaxWidth = useContainerMaxWidth();
  const [courses, setCourses] = useState<CourseSession[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseSession | null>(null);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [scanned, setScanned] = useState<boolean>(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    loadCourses();
    requestCameraPermission();
    
    // Start animations
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
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadParticipants();
      loadAttendanceRecords();
    }
  }, [selectedCourse]);

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const coursesData = await CourseSessionService.getAllCourseSessions();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      Alert.alert("Error", "Failed to load courses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadParticipants = async () => {
    if (!selectedCourse) return;
    
    try {
      const participantsData = await ProfileService.getAllProfiles();
      setParticipants(participantsData);
    } catch (error) {
      console.error('Error loading participants:', error);
      Alert.alert("Error", "Failed to load participants. Please try again.");
    }
  };

  const loadAttendanceRecords = async () => {
    if (!selectedCourse) return;
    
    try {
      // Initialize attendance records for all participants if they don't exist
      const participantIds = participants.map(p => p.id);
      await AttendanceService.initializeAttendanceForCourse(selectedCourse.id, participantIds);
      
      // Load attendance records with participant details
      const records = await AttendanceService.getAttendanceWithParticipants(selectedCourse.id);
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error loading attendance records:', error);
      Alert.alert("Error", "Failed to load attendance records. Please try again.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    if (selectedCourse) {
      await loadParticipants();
      await loadAttendanceRecords();
    }
    setRefreshing(false);
  };

  const handleCourseSelect = (course: CourseSession) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCourse(course);
  };

  const handleGenerateQR = () => {
    if (!selectedCourse) {
      Alert.alert("Error", "Please select a course first.");
      return;
    }
    setShowQRModal(true);
  };

  const handleScanQR = () => {
    if (!selectedCourse) {
      Alert.alert("Error", "Please select a course first.");
      return;
    }
    setShowScannerModal(true);
    setScanned(false);
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Parse QR code data and mark attendance
    try {
      const qrData = JSON.parse(data);
      if (qrData.courseId === selectedCourse?.id) {
        markAttendance(qrData.participantId);
      } else {
        Alert.alert("Invalid QR Code", "This QR code is not for the selected course.");
      }
    } catch (error) {
      Alert.alert("Invalid QR Code", "Unable to read QR code data.");
    }
    
    setShowScannerModal(false);
  };

  const markAttendance = async (participantId: string) => {
    if (!selectedCourse) return;
    
    try {
      await AttendanceService.markAttendance(participantId, selectedCourse.id, 'present');
      await loadAttendanceRecords(); // Reload to get updated data
      Alert.alert("Success", "Attendance marked successfully!");
    } catch (error) {
      console.error('Error marking attendance:', error);
      Alert.alert("Error", "Failed to mark attendance. Please try again.");
    }
  };

  const getAttendanceStats = () => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(record => record.status === 'present').length;
    const absent = attendanceRecords.filter(record => record.status === 'absent').length;
    const late = attendanceRecords.filter(record => record.status === 'late').length;
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    
    return { total, present, absent, late, attendanceRate };
  };

  const renderCourseCard = (course: CourseSession) => (
    <TouchableOpacity
      key={course.id}
      style={[
        styles.courseCard,
        selectedCourse?.id === course.id && styles.selectedCourseCard
      ]}
      onPress={() => handleCourseSelect(course)}
    >
      <View style={styles.courseCardContent}>
        <Text style={styles.courseName}>{course.full_name}</Text>
        <Text style={styles.courseDate}>
          {new Date(course.start_date).toLocaleDateString()}
        </Text>
        <Text style={styles.courseVenue}>{course.venue || 'No venue set'}</Text>
        
        <View style={styles.courseStatus}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(course.status) }]}>
            <Ionicons name={getStatusIcon(course.status)} size={12} color="#ffffff" />
            <Text style={styles.statusText}>{course.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderAttendanceCard = (record: AttendanceRecord) => (
    <View key={record.id} style={styles.attendanceCard}>
      <View style={styles.participantInfo}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={20} color="#00d4ff" />
        </View>
        <View style={styles.participantDetails}>
          <Text style={styles.participantName}>
            {record.profiles?.full_name || 'Unknown Participant'}
          </Text>
          <Text style={styles.participantId}>
            ID: {record.profiles?.id || record.participant_id}
          </Text>
          {record.check_in_time && (
            <Text style={styles.checkInTime}>
              Checked in: {new Date(record.check_in_time).toLocaleTimeString()}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.attendanceStatus}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: record.status === 'present' ? '#00ff88' : '#ff4757' }
        ]}>
          <Ionicons 
            name={record.status === 'present' ? 'checkmark-circle' : 'close-circle'} 
            size={16} 
            color="#ffffff" 
          />
          <Text style={styles.statusText}>
            {record.status === 'present' ? 'PRESENT' : 'ABSENT'}
          </Text>
        </View>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#00ff88';
      case 'inactive': return '#ffaa00';
      case 'completed': return '#00d4ff';
      case 'cancelled': return '#ff4757';
      case 'draft': return '#666666';
      default: return '#ffffff';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return 'play-circle';
      case 'inactive': return 'pause-circle';
      case 'completed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      case 'draft': return 'create';
      default: return 'help-circle';
    }
  };

  const stats = getAttendanceStats();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#0a0a0a', '#1a1a2e', '#16213e']}
        style={styles.background}
      />

      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Attendance Monitoring</Text>
          <Text style={styles.headerSubtitle}>
            Track participant attendance
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons name="refresh" size={20} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentContainer, containerMaxWidth ? { maxWidth: containerMaxWidth, alignSelf: 'center', width: '100%' } : null]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00d4ff"
            colors={['#00d4ff']}
          />
        }
      >
        {/* Course Selection */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Select Course</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.coursesScrollView}
          >
            {courses.map((course, index) => (
              <Animated.View
                key={course.id}
                style={{
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 50],
                        outputRange: [0, -50 * (index + 1)],
                      }),
                    },
                  ],
                }}
              >
                {renderCourseCard(course)}
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Action Buttons */}
        {selectedCourse && (
          <Animated.View 
            style={[
              styles.actionButtons,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <TouchableOpacity
              style={[styles.actionButton, styles.qrGenerateButton]}
              onPress={handleGenerateQR}
            >
              <Ionicons name="qr-code" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Generate QR Code</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.qrScanButton]}
              onPress={handleScanQR}
            >
              <Ionicons name="scan" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Attendance Statistics */}
        {selectedCourse && (
          <Animated.View 
            style={[
              styles.statsContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Attendance Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#00ff88' }]}>{stats.present}</Text>
                <Text style={styles.statLabel}>Present</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#ff4757' }]}>{stats.absent}</Text>
                <Text style={styles.statLabel}>Absent</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#ffaa00' }]}>{stats.late}</Text>
                <Text style={styles.statLabel}>Late</Text>
              </View>
            </View>
            <View style={styles.attendanceRateCard}>
              <Text style={[styles.statNumber, { color: '#00d4ff' }]}>{stats.attendanceRate}%</Text>
              <Text style={styles.statLabel}>Attendance Rate</Text>
            </View>
          </Animated.View>
        )}

        {/* Attendance List */}
        {selectedCourse && (
          <Animated.View 
            style={[
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <Text style={styles.sectionTitle}>Participants</Text>
            {attendanceRecords.length > 0 ? (
              attendanceRecords.map((record, index) => (
                <Animated.View
                  key={record.id}
                  style={{
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 50],
                          outputRange: [0, 50 * (index + 1)],
                        }),
                      },
                    ],
                  }}
                >
                  {renderAttendanceCard(record)}
                </Animated.View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.emptyTitle}>No Participants</Text>
                <Text style={styles.emptySubtitle}>
                  No participants registered for this course
                </Text>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Course QR Code</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowQRModal(false)}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrContainer}>
              <QRCode
                value={JSON.stringify({
                  courseId: selectedCourse?.id,
                  courseName: selectedCourse?.full_name,
                  timestamp: Date.now()
                })}
                size={200}
                color="#000000"
                backgroundColor="#ffffff"
              />
              <Text style={styles.qrText}>
                Scan this QR code to check in for {selectedCourse?.full_name}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Scanner Modal */}
      <Modal
        visible={showScannerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowScannerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.scannerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan QR Code</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowScannerModal(false)}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            {hasPermission ? (
              <View style={styles.scannerContainer}>
                <BarCodeScanner
                  onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                  style={styles.barcodeScanner}
                />
                <Text style={styles.scannerText}>
                  Point camera at QR code to scan
                </Text>
              </View>
            ) : (
              <View style={styles.permissionContainer}>
                <Ionicons name="camera-off" size={48} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.permissionText}>
                  Camera permission is required to scan QR codes
                </Text>
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={requestCameraPermission}
                >
                  <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
            )}
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
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 255, 0.2)',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
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
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  section: {
    marginHorizontal: getResponsivePadding(),
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  coursesScrollView: {
    flexDirection: 'row',
  },
  courseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedCourseCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  courseCardContent: {
    flex: 1,
  },
  courseName: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  courseDate: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  courseVenue: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  courseStatus: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '600',
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: getResponsivePadding(),
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  qrGenerateButton: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
  },
  qrScanButton: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
  },
  actionButtonText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#ffffff',
  },
  statsContainer: {
    marginHorizontal: getResponsivePadding(),
    marginTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statNumber: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  attendanceRateCard: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  attendanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  participantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  participantId: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  checkInTime: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: 'rgba(255, 255, 255, 0.5)',
  },
  attendanceStatus: {
    marginLeft: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '80%',
    maxWidth: 400,
  },
  scannerModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '90%',
    height: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: getResponsiveFontSize(18, 20, 22),
  },
  scannerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeScanner: {
    width: '100%',
    height: '70%',
    borderRadius: 12,
  },
  scannerText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: getResponsiveFontSize(18, 20, 22),
  },
  permissionButton: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#00d4ff',
  },
});
