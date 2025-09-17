import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CourseSessionService } from "../services/CourseSessionService";
import { CourseSession, CreateCourseSession } from "../types/CourseSession";

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

interface CreateCourseScreenProps {
  onBack: () => void;
  onViewCourses?: () => void;
}

// Empty venues array - will be populated manually
const VENUES: string[] = [];

export default function CreateCourseScreen({ onBack, onViewCourses }: CreateCourseScreenProps) {
  const [courseName, setCourseName] = useState<string>("BLS");
  const [seriesNumber, setSeriesNumber] = useState<number>(1);
  const [courseDate, setCourseDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [venue, setVenue] = useState<string>("");
  const [customVenue, setCustomVenue] = useState<string>("");
  const [showCustomVenueInput, setShowCustomVenueInput] = useState<boolean>(false);
  const [customVenues, setCustomVenues] = useState<string[]>([]);
  const [description, setDescription] = useState<string>("");
  const [maxParticipants, setMaxParticipants] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Modal states
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [showVenuePicker, setShowVenuePicker] = useState<boolean>(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  
  // Custom date picker states
  const [tempDate, setTempDate] = useState<string>('');
  const [isStartDate, setIsStartDate] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    startAnimations();
    generateNextSeriesNumber();
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

  const generateNextSeriesNumber = async () => {
    try {
      // Get existing BLS courses for current year
      const currentYear = new Date().getFullYear();
      const existingCourses = await CourseSessionService.getCourseSessionsByCourseName("BLS");
      
      // Filter for current year and get the highest series number
      const currentYearCourses = existingCourses.filter(course => course.year === currentYear);
      const seriesNumbers = currentYearCourses.map(course => {
        const match = course.series_name.match(/Siri (\d+)/);
        return match ? parseInt(match[1]) : 0;
      });
      
      const nextSeriesNumber = seriesNumbers.length > 0 ? Math.max(...seriesNumbers) + 1 : 1;
      setSeriesNumber(nextSeriesNumber);
    } catch (error) {
      console.error('Error generating series number:', error);
      setSeriesNumber(1);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    console.log('Date change event:', event, 'Selected date:', selectedDate);
    
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setCourseDate(selectedDate);
        // Set end date to next day if not already set
        if (endDate <= selectedDate) {
          const nextDay = new Date(selectedDate);
          nextDay.setDate(nextDay.getDate() + 1);
          setEndDate(nextDay);
        }
      }
    } else {
      // iOS
      if (selectedDate) {
        setCourseDate(selectedDate);
        // Set end date to next day if not already set
        if (endDate <= selectedDate) {
          const nextDay = new Date(selectedDate);
          nextDay.setDate(nextDay.getDate() + 1);
          setEndDate(nextDay);
        }
      }
      setShowDatePicker(false);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    console.log('End date change event:', event, 'Selected date:', selectedDate);
    
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setEndDate(selectedDate);
      }
    } else {
      // iOS
      if (selectedDate) {
        setEndDate(selectedDate);
      }
      setShowEndDatePicker(false);
    }
  };

  const handleCustomVenueSubmit = () => {
    if (customVenue.trim()) {
      const newVenue = customVenue.trim();
      setVenue(newVenue);
      
      // Add to custom venues list if not already exists
      if (!customVenues.includes(newVenue)) {
        setCustomVenues([...customVenues, newVenue]);
      }
      
      setShowCustomVenueInput(false);
      setCustomVenue("");
    }
  };

  const handleCreateCourse = async () => {
    if (!venue.trim()) {
      Alert.alert("Error", "Please select a venue for the course.");
      return;
    }

    if (endDate <= courseDate) {
      Alert.alert("Error", "End date must be after the start date.");
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const currentYear = new Date().getFullYear();
      const seriesName = `Siri ${seriesNumber}`;
      const fullName = `${courseName} ${seriesName} ${currentYear}`;

      const courseData: CreateCourseSession = {
        course_name: courseName,
        series_name: seriesName,
        year: currentYear,
        full_name: fullName,
        description: description.trim() || `${fullName} - Basic Life Support Training`,
        start_date: courseDate.toISOString(),
        end_date: endDate.toISOString(),
        registration_start_date: new Date().toISOString(), // Start registration immediately
        registration_end_date: new Date(courseDate.getTime() - 24 * 60 * 60 * 1000).toISOString(), // End registration 1 day before course
        venue: venue,
        max_participants: maxParticipants,
        status: 'active',
        is_registration_open: true,
      };

      const newCourse = await CourseSessionService.createCourseSession(courseData);
      
      Alert.alert(
        "Success!",
        `Course "${fullName}" has been created successfully!\n\nVenue: ${venue}\nDate: ${courseDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\nMax Participants: ${maxParticipants}`,
        [
          {
            text: "OK",
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onBack();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error creating course:', error);
      Alert.alert(
        "Error",
        "Failed to create course. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderVenueItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.venueItem,
        venue === item && styles.venueItemSelected
      ]}
      onPress={() => {
        setVenue(item);
        setShowVenuePicker(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <Text style={[
        styles.venueItemText,
        venue === item && styles.venueItemTextSelected
      ]}>
        {item}
      </Text>
      {venue === item && (
        <Ionicons name="checkmark" size={20} color="#00ff88" />
      )}
    </TouchableOpacity>
  );

  const handleAddCustomVenue = () => {
    setShowVenuePicker(false);
    setShowCustomVenueInput(true);
  };

  const handleCustomDateSubmit = () => {
    if (tempDate) {
      const selectedDate = new Date(tempDate);
      if (!isNaN(selectedDate.getTime())) {
        if (isStartDate) {
          setCourseDate(selectedDate);
          // Set end date to next day if not already set
          if (endDate <= selectedDate) {
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            setEndDate(nextDay);
          }
        } else {
          setEndDate(selectedDate);
        }
        setShowDatePicker(false);
        setShowEndDatePicker(false);
        setTempDate('');
      }
    }
  };

  const openCustomDatePicker = (isStart: boolean) => {
    setIsStartDate(isStart);
    const currentDate = isStart ? courseDate : endDate;
    setSelectedDate(currentDate);
    setCurrentMonth(currentDate);
    if (isStart) {
      setTempDate(courseDate.toISOString().split('T')[0]);
      setShowDatePicker(true);
    } else {
      setTempDate(endDate.toISOString().split('T')[0]);
      setShowEndDatePicker(true);
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isDisabled = (date: Date) => {
    if (!isStartDate) {
      return date <= courseDate;
    }
    return false;
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!isDisabled(newDate)) {
      setSelectedDate(newDate);
      setTempDate(newDate.toISOString().split('T')[0]);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

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
          <Text style={styles.headerTitle}>Create Course</Text>
          <Text style={styles.headerSubtitle}>Set up new training course</Text>
        </View>
        {onViewCourses && (
          <TouchableOpacity 
            style={styles.viewCoursesButton}
            onPress={onViewCourses}
          >
            <Ionicons name="list" size={20} color="#ffffff" />
            <Text style={styles.viewCoursesButtonText}>View Courses</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <Animated.View style={[
          styles.formContainer,
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
          {/* Course Name Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Course Details</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Course Type</Text>
              <View style={styles.courseNameContainer}>
                <TextInput
                  style={styles.courseNameInput}
                  value={courseName}
                  onChangeText={setCourseName}
                  placeholder="BLS"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
                <Text style={styles.seriesText}>Siri {seriesNumber}</Text>
                <Text style={styles.yearText}>{new Date().getFullYear()}</Text>
              </View>
              <Text style={styles.helperText}>
                Course will be named: {courseName} Siri {seriesNumber} {new Date().getFullYear()}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter course description..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Date Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  console.log('Start date button pressed!');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openCustomDatePicker(true);
                }}
              >
                <Ionicons name="calendar" size={20} color="#00d4ff" />
                <Text style={styles.dateButtonText}>{formatDate(courseDate)}</Text>
                <Ionicons name="chevron-down" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>End Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  console.log('End date button pressed!');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  openCustomDatePicker(false);
                }}
              >
                <Ionicons name="calendar" size={20} color="#00d4ff" />
                <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
                <Ionicons name="chevron-down" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Venue Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Venue</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Select Venue *</Text>
              <TouchableOpacity
                style={styles.venueButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowVenuePicker(true);
                }}
              >
                <Ionicons name="location" size={20} color="#00ff88" />
                <Text style={styles.venueButtonText}>
                  {venue || "Select venue..."}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Capacity Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Capacity</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Maximum Participants</Text>
              <TextInput
                style={styles.input}
                value={maxParticipants.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text);
                  if (!isNaN(num) && num > 0) {
                    setMaxParticipants(num);
                  }
                }}
                placeholder="30"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                keyboardType="numeric"
              />
              <Text style={styles.helperText}>
                Set the maximum number of participants for this course
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Create Button */}
      <Animated.View style={[
        styles.footer,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            }) }
          ]
        }
      ]}>
        <TouchableOpacity
          style={[styles.createButton, isLoading && styles.createButtonDisabled]}
          onPress={handleCreateCourse}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? ["#666", "#555"] : ["#00ff88", "#00d4ff"]}
            style={styles.createButtonGradient}
          >
            <Ionicons 
              name={isLoading ? "hourglass" : "add-circle"} 
              size={20} 
              color="#ffffff" 
            />
            <Text style={styles.createButtonText}>
              {isLoading ? "Creating..." : "Create Course"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Custom Date Picker Modal */}
      {(showDatePicker || showEndDatePicker) && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker || showEndDatePicker}
          onRequestClose={() => {
            setShowDatePicker(false);
            setShowEndDatePicker(false);
            setTempDate('');
          }}
        >
          <View style={styles.datePickerModalOverlay}>
            <View style={styles.simpleDateModalContent}>
              <Text style={styles.simpleDateModalTitle}>
                {isStartDate ? 'Select Start Date' : 'Select End Date'}
              </Text>
              
              <View style={styles.compactCalendarContainer}>
                {/* Month Navigation */}
                <View style={styles.compactMonthHeader}>
                  <TouchableOpacity
                    style={styles.compactNavButton}
                    onPress={() => navigateMonth('prev')}
                  >
                    <Ionicons name="chevron-back" size={16} color="#00d4ff" />
                  </TouchableOpacity>
                  
                  <Text style={styles.compactMonthText}>
                    {currentMonth.toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </Text>
                  
                  <TouchableOpacity
                    style={styles.compactNavButton}
                    onPress={() => navigateMonth('next')}
                  >
                    <Ionicons name="chevron-forward" size={16} color="#00d4ff" />
                  </TouchableOpacity>
                </View>

                {/* Compact Calendar Grid */}
                <View style={styles.compactCalendarGrid}>
                  {(() => {
                    const daysInMonth = getDaysInMonth(currentMonth);
                    const firstDay = getFirstDayOfMonth(currentMonth);
                    const days = [];

                    // Add empty cells for days before the first day of the month
                    for (let i = 0; i < firstDay; i++) {
                      days.push(
                        <View key={`empty-${i}`} style={styles.compactCalendarDay} />
                      );
                    }

                    // Add days of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                      const isDaySelected = isSelected(date);
                      const isDayDisabled = isDisabled(date);

                      days.push(
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.compactCalendarDay,
                            isDaySelected && styles.compactCalendarDaySelected,
                            isDayDisabled && styles.compactCalendarDayDisabled,
                          ]}
                          onPress={() => handleDateSelect(day)}
                          disabled={isDayDisabled}
                        >
                          <Text
                            style={[
                              styles.compactCalendarDayText,
                              isDaySelected && styles.compactCalendarDayTextSelected,
                              isDayDisabled && styles.compactCalendarDayTextDisabled,
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                    return days;
                  })()}
                </View>
              </View>
              
              <View style={styles.simpleDateModalActions}>
                <TouchableOpacity
                  style={styles.simpleDateModalButton}
                  onPress={() => {
                    setShowDatePicker(false);
                    setShowEndDatePicker(false);
                    setTempDate('');
                  }}
                >
                  <Text style={styles.simpleDateModalButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.simpleDateModalButton, styles.simpleDateModalButtonPrimary]}
                  onPress={handleCustomDateSubmit}
                >
                  <Text style={[styles.simpleDateModalButtonText, styles.simpleDateModalButtonTextPrimary]}>
                    OK
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Venue Picker Modal */}
      <Modal
        visible={showVenuePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVenuePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Venue</Text>
              <TouchableOpacity
                onPress={() => setShowVenuePicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={customVenues}
              renderItem={renderVenueItem}
              keyExtractor={(item) => item}
              style={styles.venueList}
              ListEmptyComponent={
                <View style={styles.emptyVenueList}>
                  <Ionicons name="location-outline" size={48} color="rgba(255, 255, 255, 0.3)" />
                  <Text style={styles.emptyVenueText}>No venues added yet</Text>
                  <Text style={styles.emptyVenueSubtext}>Add your first venue below</Text>
                </View>
              }
            />
            <TouchableOpacity
              style={styles.addCustomVenueButton}
              onPress={handleAddCustomVenue}
            >
              <Ionicons name="add-circle" size={20} color="#00d4ff" />
              <Text style={styles.addCustomVenueText}>Add Custom Venue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Venue Input Modal */}
      <Modal
        visible={showCustomVenueInput}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomVenueInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customVenueModalContent}>
            <Text style={styles.customVenueModalTitle}>Add Custom Venue</Text>
            
            <TextInput
              style={styles.customVenueInput}
              placeholder="Enter venue name..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={customVenue}
              onChangeText={setCustomVenue}
              autoFocus={true}
            />
            
            <View style={styles.customVenueModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCustomVenueInput(false);
                  setCustomVenue("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleCustomVenueSubmit}
                disabled={!customVenue.trim()}
              >
                <LinearGradient
                  colors={customVenue.trim() ? ["#00ff88", "#00d4ff"] : ["#666", "#555"]}
                  style={styles.confirmButtonGradient}
                >
                  <Ionicons name="checkmark" size={16} color="#ffffff" />
                  <Text style={styles.confirmButtonText}>Add Venue</Text>
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
  viewCoursesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  viewCoursesButtonText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: 20,
  },
  formContainer: {
    gap: 20,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#00d4ff',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  courseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  courseNameInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#ffffff',
    fontWeight: '600',
  },
  seriesText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#00ff88',
    fontWeight: '600',
    marginHorizontal: 8,
  },
  yearText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#ffaa00',
    fontWeight: '600',
  },
  helperText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    fontStyle: 'italic',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateButtonText: {
    flex: 1,
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    marginLeft: 12,
  },
  venueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  venueButtonText: {
    flex: 1,
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    marginLeft: 12,
  },
  footer: {
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  createButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  createButtonText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
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
    maxHeight: height * 0.6,
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
  venueList: {
    maxHeight: height * 0.4,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  venueItemSelected: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  venueItemText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    fontWeight: '500',
  },
  venueItemTextSelected: {
    color: '#00ff88',
    fontWeight: '600',
  },
  addCustomVenueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  addCustomVenueText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#00d4ff',
    fontWeight: '600',
  },
  emptyVenueList: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyVenueText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 12,
    fontWeight: '600',
  },
  emptyVenueSubtext: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  // Custom Venue Modal styles
  customVenueModalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  customVenueModalTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  customVenueInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 24,
  },
  customVenueModalActions: {
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
  // Date Picker Modal styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Safe area for iOS
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  datePickerTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#ffffff',
  },
  datePickerCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerComponent: {
    backgroundColor: 'transparent',
    width: '100%',
    height: 200,
  },
  datePickerActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  datePickerCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerConfirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#00d4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerButtonText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
  },
  // Custom Date Picker Modal styles
  customDateModalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    padding: 2,
    marginHorizontal: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxHeight: 60,
    justifyContent: 'center',
    alignSelf: 'center',
    width: 120,
  },
  datePickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  // Calendar styles
  calendarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    padding: 2,
    marginVertical: 0,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  calendarNavButton: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthText: {
    fontSize: getResponsiveFontSize(6, 8, 10),
    fontWeight: '600',
    color: '#ffffff',
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  calendarDayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: getResponsiveFontSize(4, 6, 7),
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 0,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 1,
    marginVertical: 0,
    minHeight: 10,
  },
  calendarDaySelected: {
    backgroundColor: '#00d4ff',
  },
  calendarDayToday: {
    backgroundColor: 'rgba(0, 255, 136, 0.3)',
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  calendarDayDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  calendarDayText: {
    fontSize: getResponsiveFontSize(4, 6, 8),
    fontWeight: '500',
    color: '#ffffff',
  },
  calendarDayTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: '#00ff88',
    fontWeight: '700',
  },
  calendarDayTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  selectedDateContainer: {
    marginTop: 0,
    padding: 1,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 1,
    alignItems: 'center',
  },
  selectedDateLabel: {
    fontSize: getResponsiveFontSize(3, 4, 5),
    color: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 0,
  },
  selectedDateText: {
    fontSize: getResponsiveFontSize(4, 6, 8),
    fontWeight: '600',
    color: '#00d4ff',
    textAlign: 'center',
  },
  customDateModalTitle: {
    fontSize: getResponsiveFontSize(8, 10, 12),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 1,
    textAlign: 'center',
  },
  dateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 12,
    textAlign: 'center',
  },
  dateInputHelper: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  customDateModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleDateModalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 20,
    marginHorizontal: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: 280,
  },
  simpleDateModalTitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  simpleDateContainer: {
    marginBottom: 16,
  },
  simpleDateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    textAlign: 'center',
  },
  simpleDateModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  simpleDateModalButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  simpleDateModalButtonPrimary: {
    backgroundColor: '#00d4ff',
  },
  simpleDateModalButtonText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#ffffff',
  },
  simpleDateModalButtonTextPrimary: {
    color: '#000000',
  },
  // Compact Calendar styles
  compactCalendarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  compactMonthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  compactNavButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactMonthText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
  compactCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  compactCalendarDay: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginVertical: 2,
    minHeight: 28,
  },
  compactCalendarDaySelected: {
    backgroundColor: '#00d4ff',
  },
  compactCalendarDayDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  compactCalendarDayText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '500',
    color: '#ffffff',
  },
  compactCalendarDayTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  compactCalendarDayTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  debugText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#00ff88',
    textAlign: 'center',
    marginVertical: 4,
  },
});
