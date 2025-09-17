import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { CourseSessionService } from "../services/CourseSessionService";
import { CourseSession } from "../types/CourseSession";
import CalendarPicker from "../components/CalendarPicker";

const { width, height } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;
const isLargeScreen = width >= 768;

const getResponsiveFontSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

const getResponsiveSize = (small: number, medium: number, large: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  return large;
};

interface EditCourseScreenProps {
  course: CourseSession;
  onBack: () => void;
  onCourseUpdated: () => void;
}

export default function EditCourseScreen({ course, onBack, onCourseUpdated }: EditCourseScreenProps) {
  const [courseName, setCourseName] = useState(course.full_name || '');
  const [description, setDescription] = useState(course.description || '');
  const [startDate, setStartDate] = useState(course.start_date || '');
  const [endDate, setEndDate] = useState(course.end_date || '');
  const [venue, setVenue] = useState(course.venue || '');
  const [maxParticipants, setMaxParticipants] = useState(course.max_participants?.toString() || '75');
  const [status, setStatus] = useState(course.status || 'active');
  const [isLoading, setIsLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleUpdateCourse = async () => {
    if (!courseName.trim()) {
      Alert.alert("Error", "Course name is required");
      return;
    }

    if (!startDate || !endDate) {
      Alert.alert("Error", "Start and end dates are required");
      return;
    }

    if (!venue.trim()) {
      Alert.alert("Error", "Venue is required");
      return;
    }

    if (!maxParticipants || parseInt(maxParticipants) <= 0) {
      Alert.alert("Error", "Please enter a valid number of participants");
      return;
    }

    try {
      setIsLoading(true);
      
      const updatedCourse: Partial<CourseSession> = {
        full_name: courseName.trim(),
        description: description.trim(),
        start_date: startDate,
        end_date: endDate,
        venue: venue.trim(),
        max_participants: parseInt(maxParticipants),
        status: status,
      };

      await CourseSessionService.updateCourseSession(course.id, updatedCourse);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Course updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            onCourseUpdated();
            onBack();
          },
        },
      ]);
    } catch (error) {
      console.error("Error updating course:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to update course. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'Select Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStartDateSelect = (date: string) => {
    setStartDate(date);
    // Auto-set end date if it's before the new start date
    if (endDate && new Date(date) > new Date(endDate)) {
      setEndDate(date);
    }
  };

  const handleEndDateSelect = (date: string) => {
    setEndDate(date);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#0a0a0a"]}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Course</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Course Name *</Text>
            <TextInput
              style={styles.textInput}
              value={courseName}
              onChangeText={setCourseName}
              placeholder="Enter course name"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter course description"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateInputGroup}>
              <Text style={styles.label}>Start Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formatDateForDisplay(startDate)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#00d4ff" />
              </TouchableOpacity>
            </View>
            <View style={styles.dateInputGroup}>
              <Text style={styles.label}>End Date *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formatDateForDisplay(endDate)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#00d4ff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Venue *</Text>
            <TextInput
              style={styles.textInput}
              value={venue}
              onChangeText={setVenue}
              placeholder="Enter venue"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Max Participants *</Text>
            <TextInput
              style={styles.textInput}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              placeholder="Enter maximum participants"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status *</Text>
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === 'active' && styles.statusButtonActive
                ]}
                onPress={() => setStatus('active')}
              >
                <Ionicons 
                  name="play-circle" 
                  size={20} 
                  color={status === 'active' ? '#ffffff' : '#00ff88'} 
                />
                <Text style={[
                  styles.statusButtonText,
                  status === 'active' && styles.statusButtonTextActive
                ]}>
                  Active
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === 'inactive' && styles.statusButtonActive
                ]}
                onPress={() => setStatus('inactive')}
              >
                <Ionicons 
                  name="pause-circle" 
                  size={20} 
                  color={status === 'inactive' ? '#ffffff' : '#ffaa00'} 
                />
                <Text style={[
                  styles.statusButtonText,
                  status === 'inactive' && styles.statusButtonTextActive
                ]}>
                  Inactive
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
            onPress={handleUpdateCourse}
            disabled={isLoading}
          >
            <LinearGradient
              colors={isLoading ? ["#666", "#555"] : ["#00ff88", "#00d4ff"]}
              style={styles.updateButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#ffffff" />
                  <Text style={styles.updateButtonText}>Update Course</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Calendar Pickers */}
      <CalendarPicker
        visible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        onDateSelect={handleStartDateSelect}
        title="Select Start Date"
        initialDate={startDate ? new Date(startDate) : new Date()}
        minDate={new Date()}
      />

      <CalendarPicker
        visible={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        onDateSelect={handleEndDateSelect}
        title="Select End Date"
        initialDate={endDate ? new Date(endDate) : new Date()}
        minDate={startDate ? new Date(startDate) : new Date()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: "700",
    color: "#ffffff",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formContainer: {
    paddingVertical: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  dateInputGroup: {
    flex: 1,
  },
  dateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 8,
  },
  statusButtonActive: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  statusButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
  statusButtonTextActive: {
    color: '#000000',
  },
  updateButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: "hidden",
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  updateButtonText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: "700",
    color: "#ffffff",
  },
});
