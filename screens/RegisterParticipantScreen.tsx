import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Animated, Dimensions, ScrollView, Modal, Alert, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { JobService } from "../services/supabase";
import { Job } from "../types/JobPosition";
import { ProfileService, CreateProfile } from "../services/ProfileService";
import { CourseSessionService } from "../services/CourseSessionService";
import { CourseSession, CourseSessionOption } from "../types/CourseSession";
import { modernRegisterStyles as styles } from "../styles/RegisterParticipantStyles";

const { width, height } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 768;
const isLargeScreen = width >= 768;
const isTablet = width >= 768 && height >= 1024;

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
  if (isTablet) return 32;
  return 24;
};

interface RegisterParticipantScreenProps {
  onBack: () => void;
}


interface FormData {
  email: string;
  name: string;
  phoneNumber: string;
  icNumber: string;
  job: string; // Job position name
  jobId: string; // Job ID
  grade: string; // Grade
  category: string; // Category from job (Clinical/Non-Clinical)
  tempatBertugas: string;
  lastBlsAttempt: string;
  asthma: string;
  allergic: string;
  allergicWith: string;
  pregnant: string;
  pregnantWeeks: string;
  courseSessionId: string; // Course session ID
  courseSessionName: string; // Course session display name
}

export default function RegisterParticipantScreenModern({ onBack }: RegisterParticipantScreenProps) {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    name: '',
    phoneNumber: '',
    icNumber: '',
    job: '',
    jobId: '',
    grade: '',
    category: '',
    tempatBertugas: '',
    lastBlsAttempt: '',
    asthma: '',
    allergic: '',
    allergicWith: '',
    pregnant: '',
    pregnantWeeks: '',
    courseSessionId: '',
    courseSessionName: ''
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [jobSearchQuery, setJobSearchQuery] = useState<string>('');
  const [jobGrades, setJobGrades] = useState<string[]>([]);
  const [courseSessions, setCourseSessions] = useState<CourseSessionOption[]>([]);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showBlsModal, setShowBlsModal] = useState(false);
  const [showCourseSessionModal, setShowCourseSessionModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Particle animations
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;
  const particle4 = useRef(new Animated.Value(0)).current;
  const particle5 = useRef(new Animated.Value(0)).current;

  const currentYear = new Date().getFullYear();
  const yearOptions = ['First Time'].concat(
    Array.from({ length: 10 }, (_, i) => (currentYear - i).toString())
  );

  useEffect(() => {
    loadJobs();
    loadCourseSessions();
    startAnimations();
  }, []);

  // Filter jobs based on search query
  useEffect(() => {
    if (jobSearchQuery.trim() === '') {
      setFilteredJobs(jobs);
    } else {
      const filtered = jobs.filter(job => 
        job.name.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
        job.category.toLowerCase().includes(jobSearchQuery.toLowerCase())
      );
      setFilteredJobs(filtered);
    }
  }, [jobs, jobSearchQuery]);

  // Debug jobs state changes
  useEffect(() => {
    }, [jobs]);

  const loadJobs = async () => {
    try {
      const jobsData = await JobService.getAllJobs();
      setJobs(jobsData || []);
      setFilteredJobs(jobsData || []);
      } catch (error) {
      console.error('Error loading jobs:', error);
      // Fallback to sample data if Supabase fails
      const fallbackJobs: Job[] = [
        { id: '1', name: 'Jurupulih Fisioterapi', category: 'Clinical', code_prefix: 'U', grades: ['U5', 'U6', 'U7', 'U8'], is_active: true, created_at: '', updated_at: '', notes: null },
        { id: '2', name: 'Jururawat', category: 'Clinical', code_prefix: 'U', grades: ['U5', 'U6', 'U7', 'U8'], is_active: true, created_at: '', updated_at: '', notes: null },
        { id: '3', name: 'Pegawai Perubatan', category: 'Clinical', code_prefix: 'UD', grades: ['UD9', 'UD10', 'UD12', 'UD13', 'UD14', 'UD15'], is_active: true, created_at: '', updated_at: '', notes: null },
        { id: '4', name: 'Pegawai Farmasi', category: 'Clinical', code_prefix: 'UF', grades: ['UF9', 'UF10', 'UF12', 'UF13', 'UF14'], is_active: true, created_at: '', updated_at: '', notes: null },
        { id: '5', name: 'Pegawai Pergigian', category: 'Clinical', code_prefix: 'UG', grades: ['UG9', 'UG10', 'UG12', 'UG13', 'UG14', 'UG15'], is_active: true, created_at: '', updated_at: '', notes: null },
      ];
      setJobs(fallbackJobs);
      setFilteredJobs(fallbackJobs);
      }
  };

  const loadCourseSessions = async () => {
    try {
      const courseSessionsData = await CourseSessionService.getCourseSessionOptions();
      setCourseSessions(courseSessionsData);
      } catch (error) {
      console.error('Error loading course sessions:', error);
      // Fallback to sample data if Supabase fails
      const fallbackCourseSessions: CourseSessionOption[] = [
        { id: '1', label: 'BLS Siri 1 2025 (25 spots available)', value: 'BLS Siri 1 2025', is_available: true, available_spots: 25 },
        { id: '2', label: 'BLS Siri 2 2025 (30 spots available)', value: 'BLS Siri 2 2025', is_available: true, available_spots: 30 },
        { id: '3', label: 'BLS Siri 3 2025 (20 spots available)', value: 'BLS Siri 3 2025', is_available: true, available_spots: 20 },
      ];
      setCourseSessions(fallbackCourseSessions);
      }
  };

  // Load job grades for a specific job
  const loadJobGrades = async (jobId: string) => {
    try {
      const grades = await JobService.getJobGrades(jobId);
      setJobGrades(grades);
    } catch (error) {
      console.error('Error loading job grades:', error);
      // Fallback to finding grades from local jobs data
      const selectedJob = jobs.find(job => job.id === jobId);
      if (selectedJob && selectedJob.grades) {
        setJobGrades(selectedJob.grades);
      } else {
        setJobGrades([]);
      }
    }
  };


  const startAnimations = () => {
    // Entrance animations
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

    // Continuous animations
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();

    // Particle animations
    const createParticle = (animValue: Animated.Value, delay: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createParticle(particle1, 0, 8000).start();
    createParticle(particle2, 1000, 10000).start();
    createParticle(particle3, 2000, 12000).start();
    createParticle(particle4, 1500, 9000).start();
    createParticle(particle5, 3000, 11000).start();
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Check if all required fields are filled
  const isFormComplete = () => {
    return (
      formData.email.trim() !== '' &&
      formData.name.trim() !== '' &&
      formData.phoneNumber.trim() !== '' &&
      formData.icNumber.trim() !== '' &&
      formData.job.trim() !== '' &&
      formData.grade.trim() !== '' &&
      formData.tempatBertugas.trim() !== '' &&
      formData.lastBlsAttempt.trim() !== '' &&
      formData.asthma.trim() !== '' &&
      formData.allergic.trim() !== '' &&
      formData.pregnant.trim() !== '' &&
      formData.courseSessionId.trim() !== '' &&
      // Conditional fields
      (formData.allergic !== 'Yes' || formData.allergicWith.trim() !== '') &&
      (formData.pregnant !== 'Yes' || formData.pregnantWeeks.trim() !== '')
    );
  };

  // Validate form with detailed error messages
  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    // Required field validations
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
      newErrors.icNumber = 'Please enter a valid IC number (12 digits or YYMMDD-XX-XXXX)';
    }

    if (!formData.job.trim()) {
      newErrors.job = 'Job position is required';
    }

    if (!formData.grade.trim()) {
      newErrors.grade = 'Grade is required';
    }

    if (!formData.tempatBertugas.trim()) {
      newErrors.tempatBertugas = 'Workplace is required';
    }

    if (!formData.lastBlsAttempt.trim()) {
      newErrors.lastBlsAttempt = 'Last BLS attempt is required';
    }

    if (!formData.asthma.trim()) {
      newErrors.asthma = 'Asthma status is required';
    }

    if (!formData.allergic.trim()) {
      newErrors.allergic = 'Allergy status is required';
    }

    if (!formData.pregnant.trim()) {
      newErrors.pregnant = 'Pregnancy status is required';
    }

    if (!formData.courseSessionId.trim()) {
      newErrors.courseSessionId = 'Course session is required';
    }

    // Conditional validations
    if (formData.allergic === 'Yes' && !formData.allergicWith.trim()) {
      newErrors.allergicWith = 'Please specify what you are allergic to';
    }

    if (formData.pregnant === 'Yes' && !formData.pregnantWeeks.trim()) {
      newErrors.pregnantWeeks = 'Please specify pregnancy weeks';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Test removed - no longer needed
    
    // Use existing validation
    if (!validateForm()) {
      setModalMessage('Please fill in all required fields');
      setShowErrorModal(true);
      return;
    }
    
    // Show confirmation dialog using custom modal with Yes/No buttons
    setModalTitle('📝 Confirm Registration');
    setModalMessage(`Are you sure you want to register this participant?\n\n` +
      `Name: ${formData.name}\n` +
      `Email: ${formData.email}\n` +
      `IC: ${formData.icNumber}\n` +
      `Position: ${formData.job} ${formData.grade}`);
    setOnConfirm(() => () => {
      setShowConfirmModal(false);
      performRegistration();
    });
    setShowConfirmModal(true);
  };

  const performRegistration = async () => {
    setIsSubmitting(true);
    
    try {
      // Prepare profile data for Supabase
      const profileData: CreateProfile = {
        email: formData.email,
        name: formData.name,
        phone_number: formData.phoneNumber,
        ic_number: formData.icNumber,
        job_position_id: formData.jobId,
        job_position_name: `${formData.job} ${formData.grade}`, // Combine job + grade when saving
        grade: '', // No longer used - grade is part of job_position_name
        category: formData.category as 'Clinical' | 'Non-Clinical', // Pass category from form
        tempat_bertugas: formData.tempatBertugas,
        last_bls_attempt: formData.lastBlsAttempt,
        has_asthma: formData.asthma === 'Yes',
        has_allergies: formData.allergic === 'Yes',
        allergies_description: formData.allergic === 'Yes' ? formData.allergicWith : undefined,
        is_pregnant: formData.pregnant === 'Yes',
        pregnancy_weeks: formData.pregnant === 'Yes' ? parseInt(formData.pregnantWeeks) || undefined : undefined,
        user_type: 'participant',
        status: 'pending',
        payment_status: 'pending',
        course_session_id: formData.courseSessionId,
        notes: `Registered via mobile app on ${new Date().toLocaleDateString()} for ${formData.courseSessionName}`
      };
      
      // Save to Supabase profiles table
      const savedProfile = await ProfileService.createProfile(profileData);
      // Success feedback
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Removed notification feedback
      
      // Show success modal
      setModalMessage(`🎉 Registration Successful!\n\nParticipant "${formData.name}" has been registered successfully!`);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('=== Registration error occurred ===');
      console.error('Error details:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Removed notification feedback
      
      // Show error modal
      setModalMessage(`❌ Registration Failed\n\nError: ${error?.message || 'Unknown error occurred'}`);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleInputFocus = (inputType: string) => {
    setFocusedInput(inputType);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleInputBlur = () => {
    setFocusedInput(null);
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      phoneNumber: '',
      icNumber: '',
      job: '',
      jobId: '',
      grade: '',
      category: '',
      tempatBertugas: '',
      lastBlsAttempt: '',
      asthma: '',
      allergic: '',
      allergicWith: '',
      pregnant: '',
      pregnantWeeks: '',
      courseSessionId: '',
      courseSessionName: ''
    });
    setErrors({});
    setJobGrades([]);
    setJobSearchQuery('');
    setFocusedInput(null);
    };

  const handleJobSelect = (job: Job) => {
    handleInputChange('job', job.name);
    handleInputChange('jobId', job.id);
    handleInputChange('category', job.category); // Auto-populate category from job
    handleInputChange('grade', ''); // Clear grade when job changes
    loadJobGrades(job.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCourseSessionSelect = (courseSession: CourseSessionOption) => {
    handleInputChange('courseSessionId', courseSession.id);
    handleInputChange('courseSessionName', courseSession.value);
    setShowCourseSessionModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Modern Elegant Background */}
      <Animated.View style={styles.backgroundContainer}>
        <LinearGradient 
          colors={["#0f0f23", "#1a1a2e", "#16213e", "#0f3460"]} 
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Elegant gradient overlay */}
        <Animated.View style={[
          styles.animatedGradient,
          {
            opacity: shimmerAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.2, 0.4, 0.2]
            }),
          }
        ]}>
          <LinearGradient 
            colors={["rgba(99, 102, 241, 0.1)", "rgba(139, 92, 246, 0.1)", "rgba(6, 182, 212, 0.1)"]} 
            style={styles.backgroundGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>

        {/* Floating particles */}
        <Animated.View style={[
          styles.particle,
          styles.particle1,
          {
            transform: [
              {
                translateY: particle1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -200]
                })
              },
              {
                translateX: particle1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 150]
                })
              },
              {
                rotate: particle1.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }
            ],
            opacity: particle1.interpolate({
              inputRange: [0, 0.3, 0.7, 1],
              outputRange: [0, 1, 0.8, 0]
            })
          }
        ]} />

        <Animated.View style={[
          styles.particle,
          styles.particle2,
          {
            transform: [
              {
                translateY: particle2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -180]
                })
              },
              {
                translateX: particle2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -120]
                })
              },
              {
                scale: particle2.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.5, 1.5, 0.5]
                })
              }
            ],
            opacity: particle2.interpolate({
              inputRange: [0, 0.2, 0.8, 1],
              outputRange: [0, 0.9, 1, 0]
            })
          }
        ]} />

        <Animated.View style={[
          styles.particle,
          styles.particle3,
          {
            transform: [
              {
                translateY: particle3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -220]
                })
              },
              {
                translateX: particle3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 100]
                })
              }
            ],
            opacity: particle3.interpolate({
              inputRange: [0, 0.4, 0.6, 1],
              outputRange: [0, 1, 0.7, 0]
            })
          }
        ]} />

        <Animated.View style={[
          styles.particle,
          styles.particle4,
          {
            transform: [
              {
                translateY: particle4.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -160]
                })
              },
              {
                translateX: particle4.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -80]
                })
              }
            ],
            opacity: particle4.interpolate({
              inputRange: [0, 0.3, 0.7, 1],
              outputRange: [0, 0.8, 1, 0]
            })
          }
        ]} />

        <Animated.View style={[
          styles.particle,
          styles.particle5,
          {
            transform: [
              {
                translateY: particle5.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -190]
                })
              },
              {
                translateX: particle5.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 110]
                })
              }
            ],
            opacity: particle5.interpolate({
              inputRange: [0, 0.25, 0.75, 1],
              outputRange: [0, 1, 0.6, 0]
            })
          }
        ]} />
      </Animated.View>

      {/* Modern Header */}
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
          <Animated.View style={[
            styles.headerIcon,
            {
              transform: [
                { scale: pulseAnim },
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                }
              ]
            }
          ]}>
            <LinearGradient 
              colors={["#00ff88", "#5b73ff", "#00d4ff", "#ff0080"]} 
              style={styles.headerIconGradient}
            >
              <Ionicons name="person-add" size={24} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>✨ Register Participant</Text>
            <Text style={styles.headerSubtitle}>Join our BLS training program</Text>
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
                style={styles.textInput}
                placeholder="Enter email address"
                placeholderTextColor="#888"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Full Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>👋 Full Name <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter full name"
                placeholderTextColor="#888"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
                autoCapitalize="words"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>📱 Phone Number <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter phone number"
                placeholderTextColor="#888"
                value={formData.phoneNumber}
                onChangeText={(text) => handleInputChange('phoneNumber', text)}
                keyboardType="phone-pad"
              />
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
            </View>

            {/* IC Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🆔 IC Number <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TextInput
                style={styles.textInput}
                placeholder="123456-78-9012"
                placeholderTextColor="#888"
                value={formData.icNumber}
                onChangeText={(text) => handleInputChange('icNumber', text)}
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
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => {
                  setShowJobModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.dropdownText, !formData.job && styles.placeholderText]}>
                  {formData.job || 'Select job position'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#ffffff" />
              </TouchableOpacity>
              {errors.job && <Text style={styles.errorText}>{errors.job}</Text>}
            </View>

            {/* Grade Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>⭐ Grade <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TouchableOpacity 
                style={[styles.dropdownButton, !formData.jobId && styles.disabledButton]}
                onPress={() => {
                  if (formData.jobId) {
                    setShowGradeModal(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                disabled={!formData.jobId}
              >
                <Text style={[styles.dropdownText, !formData.grade && styles.placeholderText]}>
                  {formData.grade || (formData.jobId ? 'Select grade' : 'Select job first')}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#ffffff" />
              </TouchableOpacity>
              {errors.grade && <Text style={styles.errorText}>{errors.grade}</Text>}
            </View>

            {/* Category Display - Auto-filled from job */}
            {formData.category && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>🏷️ Category</Text>
                <View style={styles.categoryDisplayContainer}>
                  <Text style={styles.categoryDisplayText}>
                    {formData.category === 'Clinical' ? '🏥 Clinical' : '📋 Non-Clinical'}
                  </Text>
                  <View style={[
                    styles.categoryBadge,
                    { backgroundColor: formData.category === 'Clinical' ? '#10b981' : '#6366f1' }
                  ]}>
                    <Text style={styles.categoryBadgeText}>
                      {formData.category}
                    </Text>
                  </View>
                </View>
              </View>
            )}


            {/* Tempat Bertugas */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🏢 Tempat Bertugas</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter workplace location"
                placeholderTextColor="#888"
                value={formData.tempatBertugas}
                onChangeText={(text) => handleInputChange('tempatBertugas', text)}
                autoCapitalize="words"
              />
              {errors.tempatBertugas && <Text style={styles.errorText}>{errors.tempatBertugas}</Text>}
            </View>
          </View>

          {/* BLS Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🏥 BLS Information</Text>
            
            {/* Course Session Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>📚 Course Session <Text style={styles.requiredAsterisk}>*</Text></Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => {
                  setShowCourseSessionModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.dropdownText, !formData.courseSessionName && styles.placeholderText]}>
                  {formData.courseSessionName || 'Select course session'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#ffffff" />
              </TouchableOpacity>
              {errors.courseSessionId && <Text style={styles.errorText}>{errors.courseSessionId}</Text>}
            </View>
            
            {/* Last BLS Attempt */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>📅 Last BLS Attempt</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => {
                  setShowBlsModal(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.dropdownText, !formData.lastBlsAttempt && styles.placeholderText]}>
                  {formData.lastBlsAttempt || 'Select last BLS attempt'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#ffffff" />
              </TouchableOpacity>
              {errors.lastBlsAttempt && <Text style={styles.errorText}>{errors.lastBlsAttempt}</Text>}
            </View>
          </View>

          {/* Medical Information Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🏥 Medical Information</Text>
            
            {/* Asthma */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🌬️ Asthma</Text>
              <View style={styles.radioGroup}>
                {['Yes', 'No'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.radioOption}
                    onPress={() => {
                      handleInputChange('asthma', option);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View style={[
                      styles.radioCircle,
                      formData.asthma === option && styles.radioCircleSelected
                    ]}>
                      {formData.asthma === option && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.asthma && <Text style={styles.errorText}>{errors.asthma}</Text>}
            </View>

            {/* Allergic */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🤧 Allergic</Text>
              <View style={styles.radioGroup}>
                {['Yes', 'No'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.radioOption}
                    onPress={() => {
                      handleInputChange('allergic', option);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View style={[
                      styles.radioCircle,
                      formData.allergic === option && styles.radioCircleSelected
                    ]}>
                      {formData.allergic === option && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.allergic && <Text style={styles.errorText}>{errors.allergic}</Text>}
            </View>

            {/* Allergic With What - Conditional */}
            {formData.allergic === 'Yes' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>🤧 Allergic With What?</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Describe your allergies"
                  placeholderTextColor="#888"
                  value={formData.allergicWith}
                  onChangeText={(text) => handleInputChange('allergicWith', text)}
                  autoCapitalize="sentences"
                />
                {errors.allergicWith && <Text style={styles.errorText}>{errors.allergicWith}</Text>}
              </View>
            )}

            {/* Pregnant */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🤱 Pregnant</Text>
              <View style={styles.radioGroup}>
                {['Yes', 'No'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.radioOption}
                    onPress={() => {
                      handleInputChange('pregnant', option);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View style={[
                      styles.radioCircle,
                      formData.pregnant === option && styles.radioCircleSelected
                    ]}>
                      {formData.pregnant === option && <View style={styles.radioInner} />}
                    </View>
                    <Text style={styles.radioLabel}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.pregnant && <Text style={styles.errorText}>{errors.pregnant}</Text>}
            </View>

            {/* Pregnant Weeks - Conditional */}
            {formData.pregnant === 'Yes' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>🤱 How Many Weeks?</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter number of weeks"
                  placeholderTextColor="#888"
                  value={formData.pregnantWeeks}
                  onChangeText={(text) => handleInputChange('pregnantWeeks', text)}
                  keyboardType="numeric"
                />
                {errors.pregnantWeeks && <Text style={styles.errorText}>{errors.pregnantWeeks}</Text>}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton, 
              (isSubmitting || !isFormComplete()) && styles.submitButtonDisabled
            ]}
            onPress={() => {
              // Test removed - no longer needed
              
              // Call handleSubmit after a short delay
              setTimeout(() => {
                handleSubmit();
              }, 1000);
            }}
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
                <Text style={styles.submitButtonText}>✨ Register Participant</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Modals */}
      <Modal
        visible={showJobModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowJobModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎯 Select Job Position</Text>
              <TouchableOpacity onPress={() => {
                setShowJobModal(false);
                setJobSearchQuery(''); // Clear search when modal is closed
              }} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search job positions..."
                placeholderTextColor="#666"
                value={jobSearchQuery}
                onChangeText={setJobSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {jobSearchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setJobSearchQuery('')}
                  style={styles.clearSearchButton}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            
            <ScrollView style={styles.modalOptions}>
              {filteredJobs.length === 0 ? (
                <View style={styles.modalOption}>
                  <Text style={styles.modalOptionText}>
                    {jobs.length === 0 ? 'Loading job positions...' : 'No jobs found matching your search'}
                  </Text>
                </View>
              ) : (
                filteredJobs.map((job, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalOption}
                    onPress={() => {
                      handleJobSelect(job);
                      setShowJobModal(false);
                      setJobSearchQuery(''); // Clear search when job is selected
                    }}
                  >
                    <View style={styles.jobOptionContent}>
                      <Text style={styles.modalOptionText}>{job.name}</Text>
                      <Text style={styles.jobCategoryText}>{job.category}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#ffffff" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Grade Modal */}
      <Modal
        visible={showGradeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGradeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>⭐ Select Grade</Text>
              <TouchableOpacity onPress={() => setShowGradeModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              {jobGrades.map((grade, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalOption}
                  onPress={() => {
                    handleInputChange('grade', grade);
                    setShowGradeModal(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.modalOptionText}>{grade}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#ffffff" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>


      <Modal
        visible={showBlsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBlsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 Select Last BLS Attempt</Text>
              <TouchableOpacity onPress={() => setShowBlsModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              {yearOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalOption}
                  onPress={() => {
                    handleInputChange('lastBlsAttempt', option);
                    setShowBlsModal(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={styles.modalOptionText}>{option}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#ffffff" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* BLS Attempt Modal */}
      <Modal
        visible={showBlsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBlsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📅 Last BLS Attempt</Text>
              <TouchableOpacity onPress={() => setShowBlsModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  handleInputChange('lastBlsAttempt', 'First Time');
                  setShowBlsModal(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.modalOptionText}>First Time</Text>
                <Ionicons name="chevron-forward" size={16} color="#ffffff" />
              </TouchableOpacity>
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <TouchableOpacity
                    key={year}
                    style={styles.modalOption}
                    onPress={() => {
                      handleInputChange('lastBlsAttempt', year.toString());
                      setShowBlsModal(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={styles.modalOptionText}>{year}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#ffffff" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Course Session Modal */}
      <Modal
        visible={showCourseSessionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCourseSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📚 Select Course Session</Text>
              <TouchableOpacity onPress={() => setShowCourseSessionModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              {courseSessions.length === 0 ? (
                <View style={styles.modalOption}>
                  <Text style={styles.modalOptionText}>Loading course sessions...</Text>
                </View>
              ) : (
                courseSessions.map((courseSession, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.modalOption,
                      !courseSession.is_available && styles.disabledOption
                    ]}
                    onPress={() => {
                      if (courseSession.is_available) {
                        handleCourseSessionSelect(courseSession);
                      }
                    }}
                    disabled={!courseSession.is_available}
                  >
                    <View style={styles.courseSessionOptionContent}>
                      <Text style={[
                        styles.modalOptionText,
                        !courseSession.is_available && styles.disabledText
                      ]}>
                        {courseSession.label}
                      </Text>
                      {courseSession.registration_deadline && (
                        <Text style={styles.courseSessionDeadline}>
                          Registration closes: {new Date(courseSession.registration_deadline).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    {courseSession.is_available ? (
                      <Ionicons name="chevron-forward" size={16} color="#ffffff" />
                    ) : (
                      <Ionicons name="close-circle" size={16} color="#666" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
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
                  resetForm(); // Reset form after successful registration
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
                    onPress={() => {
                      setShowConfirmModal(false);
                    }}
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
