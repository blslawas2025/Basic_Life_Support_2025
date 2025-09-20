import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Animated, Dimensions, ScrollView, Modal, Alert, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { ProfileService, CreateProfile } from "../services/ProfileService";

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

interface RegisterStaffScreenProps {
  onBack: () => void;
}

interface StaffFormData {
  email: string;
  name: string;
  phoneNumber: string;
  icNumber: string;
  jobPosition: string;
  workplace: string;
  userType: 'staff' | 'admin';
  status: 'active' | 'pending';
  notes: string;
}

export default function RegisterStaffScreen({ onBack }: RegisterStaffScreenProps) {
  const [formData, setFormData] = useState<StaffFormData>({
    email: '',
    name: '',
    phoneNumber: '',
    icNumber: '',
    jobPosition: '',
    workplace: '',
    userType: 'staff',
    status: 'active',
    notes: ''
  });

  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<StaffFormData>>({});

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.stagger(150, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleInputChange = (field: keyof StaffFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<StaffFormData> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    if (!formData.icNumber.trim()) {
      newErrors.icNumber = 'IC number is required';
    } else if (!/^\d{12}$|^\d{6}-\d{2}-\d{4}$/.test(formData.icNumber.replace(/\s/g, ''))) {
      newErrors.icNumber = 'Please enter a valid IC number';
    }

    if (!formData.jobPosition.trim()) {
      newErrors.jobPosition = 'Job position is required';
    }

    if (!formData.workplace.trim()) {
      newErrors.workplace = 'Workplace is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setModalMessage('Please fill in all required fields');
      setShowErrorModal(true);
      return;
    }

    setModalTitle('📝 Confirm Staff Registration');
    setModalMessage(`Are you sure you want to register this staff member?\n\n` +
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `Position: ${formData.jobPosition}\n` +
      `Type: ${formData.userType}`);
    setOnConfirm(() => () => {
      setShowConfirmModal(false);
      performRegistration();
    });
    setShowConfirmModal(true);
  };

  const performRegistration = async () => {
    setIsSubmitting(true);
    
    try {
      const profileData: CreateProfile = {
        email: formData.email,
        name: formData.name,
        phone_number: formData.phoneNumber,
        ic_number: formData.icNumber,
        job_position_name: formData.jobPosition,
        tempat_bertugas: formData.workplace,
        user_type: formData.userType,
        roles: formData.userType === 'admin' ? 'admin' : 'staff',
        status: formData.status,
        notes: formData.notes || `Staff registered on ${new Date().toLocaleDateString()}`
      };
      
      const savedProfile = await ProfileService.createProfile(profileData);
      
      setModalMessage(`🎉 Staff Registration Successful!\n\nStaff member "${formData.name}" has been registered successfully!`);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Registration error:', error);
      setModalMessage(`❌ Registration Failed\n\nError: ${error?.message || 'Unknown error occurred'}`);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      phoneNumber: '',
      icNumber: '',
      jobPosition: '',
      workplace: '',
      userType: 'staff',
      status: 'active',
      notes: ''
    });
    setErrors({});
    setFocusedInput(null);
  };

  const isFormComplete = () => {
    return (
      formData.email.trim() !== '' &&
      formData.name.trim() !== '' &&
      formData.phoneNumber.trim() !== '' &&
      formData.icNumber.trim() !== '' &&
      formData.jobPosition.trim() !== '' &&
      formData.workplace.trim() !== ''
    );
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
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.1)"]}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <LinearGradient 
              colors={["#00ff88", "#5b73ff", "#00d4ff", "#ff0080"]} 
              style={styles.headerIconGradient}
            >
              <Ionicons name="person-add" size={24} color="#ffffff" />
            </LinearGradient>
          </View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>✨ Register Staff</Text>
            <Text style={styles.headerSubtitle}>Add new staff members</Text>
          </View>
        </View>
      </Animated.View>
      
      {/* Form Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={[
          styles.formContainer,
          {
            opacity: fadeAnim,
            transform: [
              { 
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              }
            ]
          }
        ]}>

          {/* Personal Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>👤 Personal Information</Text>
            
            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>📧 Email Address <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TextInput
                style={[styles.textInput, focusedInput === 'email' && styles.textInputFocused]}
                placeholder="Enter email address"
                placeholderTextColor="#888"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>👋 Full Name <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TextInput
                style={[styles.textInput, focusedInput === 'name' && styles.textInputFocused]}
                placeholder="Enter full name"
                placeholderTextColor="#888"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="words"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>📱 Phone Number <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TextInput
                style={[styles.textInput, focusedInput === 'phoneNumber' && styles.textInputFocused]}
                placeholder="Enter phone number"
                placeholderTextColor="#888"
                value={formData.phoneNumber}
                onChangeText={(text) => handleInputChange('phoneNumber', text)}
                onFocus={() => setFocusedInput('phoneNumber')}
                onBlur={() => setFocusedInput(null)}
                keyboardType="phone-pad"
              />
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
            </View>

            {/* IC Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🆔 IC Number <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TextInput
                style={[styles.textInput, focusedInput === 'icNumber' && styles.textInputFocused]}
                placeholder="123456-78-9012"
                placeholderTextColor="#888"
                value={formData.icNumber}
                onChangeText={(text) => handleInputChange('icNumber', text)}
                onFocus={() => setFocusedInput('icNumber')}
                onBlur={() => setFocusedInput(null)}
                keyboardType="default"
                maxLength={14}
              />
              {errors.icNumber && <Text style={styles.errorText}>{errors.icNumber}</Text>}
            </View>
          </View>

          {/* Professional Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>💼 Professional Information</Text>
            
            {/* Job Position */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🎯 Job Position <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TextInput
                style={[styles.textInput, focusedInput === 'jobPosition' && styles.textInputFocused]}
                placeholder="Enter job position"
                placeholderTextColor="#888"
                value={formData.jobPosition}
                onChangeText={(text) => handleInputChange('jobPosition', text)}
                onFocus={() => setFocusedInput('jobPosition')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="words"
              />
              {errors.jobPosition && <Text style={styles.errorText}>{errors.jobPosition}</Text>}
            </View>

            {/* Workplace */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🏢 Workplace <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TextInput
                style={[styles.textInput, focusedInput === 'workplace' && styles.textInputFocused]}
                placeholder="Enter workplace location"
                placeholderTextColor="#888"
                value={formData.workplace}
                onChangeText={(text) => handleInputChange('workplace', text)}
                onFocus={() => setFocusedInput('workplace')}
                onBlur={() => setFocusedInput(null)}
                autoCapitalize="words"
              />
              {errors.workplace && <Text style={styles.errorText}>{errors.workplace}</Text>}
            </View>

            {/* User Type */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>👑 User Type</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => {
                  setShowUserTypeModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.dropdownText}>
                  {formData.userType === 'admin' ? 'Admin' : 'Staff'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Status */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>📊 Status</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => {
                  setShowStatusModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.dropdownText}>
                  {formData.status === 'active' ? 'Active' : 'Pending'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📝 Additional Information</Text>
            
            {/* Notes */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>📋 Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, focusedInput === 'notes' && styles.textInputFocused]}
                placeholder="Enter any additional notes..."
                placeholderTextColor="#888"
                value={formData.notes}
                onChangeText={(text) => handleInputChange('notes', text)}
                onFocus={() => setFocusedInput('notes')}
                onBlur={() => setFocusedInput(null)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton, 
              (isSubmitting || !isFormComplete()) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !isFormComplete()}
          >
            <LinearGradient
              colors={
                isSubmitting 
                  ? ['#4a5568', '#718096'] 
                  : !isFormComplete() 
                    ? ['#6b7280', '#9ca3af'] 
                    : ['#6366f1', '#8b5cf6', '#06b6d4']
              }
              style={styles.submitButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>⏳ Registering...</Text>
              ) : !isFormComplete() ? (
                <Text style={styles.submitButtonText}>⚠️ Complete All Fields</Text>
              ) : (
                <Text style={styles.submitButtonText}>✨ Register Staff</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* User Type Modal */}
      <Modal
        visible={showUserTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👑 Select User Type</Text>
              <TouchableOpacity onPress={() => setShowUserTypeModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalOptions}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  handleInputChange('userType', 'staff');
                  setShowUserTypeModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.modalOptionText}>Staff</Text>
                <Ionicons name="chevron-forward" size={16} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  handleInputChange('userType', 'admin');
                  setShowUserTypeModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.modalOptionText}>Admin</Text>
                <Ionicons name="chevron-forward" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📊 Select Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalOptions}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  handleInputChange('status', 'active');
                  setShowStatusModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.modalOptionText}>Active</Text>
                <Ionicons name="chevron-forward" size={16} color="#ffffff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  handleInputChange('status', 'pending');
                  setShowStatusModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.modalOptionText}>Pending</Text>
                <Ionicons name="chevron-forward" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
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
          <View style={[styles.modalContent, { backgroundColor: '#10b981' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✅ Success</Text>
              <TouchableOpacity onPress={() => setShowSuccessModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>{modalMessage}</Text>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#ffffff' }]}
                onPress={() => {
                  setShowSuccessModal(false);
                  resetForm();
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#10b981' }]}>OK</Text>
              </TouchableOpacity>
            </View>
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
          <View style={[styles.modalContent, { backgroundColor: '#ef4444' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>❌ Error</Text>
              <TouchableOpacity onPress={() => setShowErrorModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>{modalMessage}</Text>
            </View>
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#ffffff' }]}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: '#ef4444' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
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
                  <Text style={styles.modalTitle}>{modalTitle}</Text>
                </View>
                <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalMessage}>{modalMessage}</Text>
              </View>
              <View style={styles.modalFooter}>
                <View style={styles.confirmButtonContainer}>
                  <TouchableOpacity 
                    style={styles.noButton}
                    onPress={() => setShowConfirmModal(false)}
                  >
                    <Ionicons name="close" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.yesButton}
                    onPress={() => {
                      if (onConfirm) {
                        onConfirm();
                      }
                    }}
                  >
                    <Ionicons name="checkmark" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Confirm</Text>
                  </TouchableOpacity>
                </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  formContainer: {
    marginTop: 24,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
    paddingLeft: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
    paddingLeft: 24,
  },
  requiredAsterisk: {
    color: '#ef4444',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textInputFocused: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  textArea: {
    height: 24,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dropdownText: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 24,
    paddingLeft: 24,
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  submitButtonGradient: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
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
    flex: 1,
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
  modalFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
  },
  modalMessage: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButton: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOptions: {
    maxHeight: 24,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
  confirmButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
  },
  noButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  yesButton: {
    flex: 1,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
});
