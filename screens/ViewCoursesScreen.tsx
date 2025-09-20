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
  RefreshControl,
  Modal,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useContainerMaxWidth } from "../utils/uiHooks";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { CourseSessionService } from "../services/CourseSessionService";
import { CourseSession } from "../types/CourseSession";

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

interface ViewCoursesScreenProps {
  onBack: () => void;
  onEditCourse?: (course: CourseSession) => void;
}

export default function ViewCoursesScreen({ onBack, onEditCourse }: ViewCoursesScreenProps) {
  const containerMaxWidth = useContainerMaxWidth();
  const windowDims = useWindowDimensions();
  const [courses, setCourses] = useState<CourseSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [courseToToggle, setCourseToToggle] = useState<CourseSession | null>(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    startAnimations();
    loadCourses();
  }, []);

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

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const courseSessions = await CourseSessionService.getAllCourseSessions();
      setCourses(courseSessions);
    } catch (error) {
      console.error('Error loading courses:', error);
      Alert.alert("Error", "Failed to load courses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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

  const handleDeleteCourse = async (course: CourseSession) => {
    Alert.alert(
      "Delete Course",
      `Are you sure you want to delete "${course.full_name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await CourseSessionService.deleteCourseSession(course.id);
              Alert.alert("Success", "Course deleted successfully.");
              loadCourses(); // Reload the list
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert("Error", "Failed to delete course. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleToggleStatus = async (course: CourseSession) => {
    console.log('handleToggleStatus called for course:', course.id);
    setCourseToToggle(course);
    setShowConfirmModal(true);
  };

  const handleConfirmToggle = async () => {
    if (!courseToToggle) return;
    
    const newStatus = courseToToggle.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'activate' : 'deactivate';
    
    console.log('Confirming toggle:', { 
      courseId: courseToToggle.id, 
      currentStatus: courseToToggle.status, 
      newStatus: newStatus,
      actionText: actionText 
    });
    
    try {
      console.log('Updating course status to:', newStatus);
      await CourseSessionService.updateCourseSession(courseToToggle.id, { 
        status: newStatus 
      });
      console.log('Course status updated successfully');
      
      // Show success message
      Alert.alert("Success", `Course ${actionText}d successfully.`);
      loadCourses(); // Reload the list
      
      setShowConfirmModal(false);
      setCourseToToggle(null);
    } catch (error) {
      console.error(`Error ${actionText}ing course:`, error);
      Alert.alert("Error", `Failed to ${actionText} course. Please try again.`);
    }
  };

  const handleCancelToggle = () => {
    console.log('User cancelled the toggle');
    setShowConfirmModal(false);
    setCourseToToggle(null);
  };

  const renderCourseCard = (course: CourseSession, index: number) => (
    <Animated.View
      key={course.id}
      style={[
        styles.courseCard,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [100 + (index * 20), 0]
            }) }
          ]
        }
      ]}
    >
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
        style={styles.courseCardGradient}
      >
        <View style={styles.courseCardHeader}>
          <View style={styles.courseInfo}>
            <Text style={styles.courseName}>{course.full_name}</Text>
            <Text style={styles.courseDescription}>{course.description}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(course.status) + '20' }]}>
            <Ionicons 
              name={getStatusIcon(course.status) as any} 
              size={16} 
              color={getStatusColor(course.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(course.status) }]}>
              {course.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.courseDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color="#00d4ff" />
            <Text style={styles.detailText}>
              {formatDate(course.start_date)} - {formatDate(course.end_date)}
            </Text>
          </View>
          
          {course.venue && (
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color="#00ff88" />
              <Text style={styles.detailText}>{course.venue}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Ionicons name="people" size={16} color="#ffaa00" />
            <Text style={styles.detailText}>
              {course.current_participants}/{course.max_participants} participants
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color="#ff0080" />
            <Text style={styles.detailText}>
              Created: {new Date(course.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.courseActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (onEditCourse) {
                onEditCourse(course);
              } else {
                Alert.alert("Edit Course", "Edit functionality not available");
              }
            }}
          >
            <Ionicons name="create" size={16} color="#00d4ff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.actionButton, 
              course.status === 'active' ? styles.inactiveButton : styles.activeButton
            ]}
            onPress={() => {
              console.log('Toggle button pressed for course:', course.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleToggleStatus(course);
            }}
          >
            <Ionicons 
              name={course.status === 'active' ? 'pause-circle' : 'play-circle'} 
              size={16} 
              color={course.status === 'active' ? '#ffaa00' : '#00ff88'} 
            />
            <Text style={[
              styles.actionButtonText, 
              { color: course.status === 'active' ? '#ffaa00' : '#00ff88' }
            ]}>
              {course.status === 'active' ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteCourse(course)}
          >
            <Ionicons name="trash" size={16} color="#ff4757" />
            <Text style={[styles.actionButtonText, { color: '#ff4757' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
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
          <Text style={styles.headerTitle}>Created Courses</Text>
          <Text style={styles.headerSubtitle}>
            {courses.length} course{courses.length !== 1 ? 's' : ''} found
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
        contentContainerStyle={[styles.contentContainer, { paddingHorizontal: windowDims.width < 375 ? 16 : windowDims.width < 768 ? 20 : 24 }, containerMaxWidth ? { maxWidth: containerMaxWidth, alignSelf: 'center', width: '100%' } : null]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00d4ff"
            colors={["#00d4ff"]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass" size={48} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.loadingText}>Loading courses...</Text>
          </View>
        ) : courses.length > 0 ? (
          <View style={styles.coursesList}>
            {courses.map((course, index) => renderCourseCard(course, index))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
            <Text style={styles.emptyTitle}>No Courses Created</Text>
            <Text style={styles.emptySubtitle}>
              Create your first course to get started
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelToggle}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmModalTitle}>
              Confirm {courseToToggle?.status === 'active' ? 'Deactivate' : 'Activate'}
            </Text>
            <Text style={styles.confirmModalText}>
              Are you sure you want to {courseToToggle?.status === 'active' ? 'deactivate' : 'activate'} "{courseToToggle?.full_name}"?
            </Text>
            
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.cancelButton]}
                onPress={handleCancelToggle}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.confirmButton]}
                onPress={handleConfirmToggle}
              >
                <Text style={styles.confirmButtonText}>
                  {courseToToggle?.status === 'active' ? 'Deactivate' : 'Activate'}
                </Text>
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 212, 255, 0.4)',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  refreshButton: {
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  coursesList: {
    gap: 16,
  },
  courseCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  courseCardGradient: {
    padding: 20,
  },
  courseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  courseInfo: {
    flex: 1,
    marginRight: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  courseDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  courseActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  activeButton: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  inactiveButton: {
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d4ff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '80%',
  },
  confirmModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmModalText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 16,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmButton: {
    backgroundColor: '#ff4757',
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
});
