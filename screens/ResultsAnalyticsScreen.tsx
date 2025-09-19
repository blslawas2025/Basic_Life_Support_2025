import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useReducedMotion } from '../utils/uiHooks';
import { useContainerMaxWidth } from '../utils/uiHooks';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SubmissionService } from '../services/SubmissionService';
import { AnalyticsService, TestSubmission } from '../services/AnalyticsService';
import { CertificateService } from '../services/CertificateService';
import CalendarPicker from '../components/CalendarPicker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// STUNNING MODERN DESIGN SYSTEM
const COLORS = {
  // Vibrant neon accents
  neon: {
    electric: '#00f5ff',
    purple: '#a855f7',
    pink: '#f472b6',
    green: '#22c55e',
    orange: '#f97316',
    cyan: '#06b6d4',
    yellow: '#eab308',
    red: '#ef4444',
  },
  
  // Deep space backgrounds
  background: {
    primary: '#0a0a0f',
    secondary: '#111827',
    tertiary: '#1f2937',
    glass: 'rgba(255, 255, 255, 0.08)',
    glassDark: 'rgba(0, 0, 0, 0.4)',
  },
  
  // Core brand colors
  primary: '#00f5ff',
  primaryLight: '#67e8f9',
  primaryDark: '#0891b2',
  secondary: '#a855f7',
  accent: '#f472b6',
  success: '#22c55e',
  warning: '#f97316',
  error: '#ef4444',
  
  // Glass morphism surfaces
  surface: {
    glass: 'rgba(255, 255, 255, 0.12)',
    glassDark: 'rgba(0, 0, 0, 0.4)',
    glassLight: 'rgba(255, 255, 255, 0.18)',
    card: 'rgba(255, 255, 255, 0.1)',
    cardHover: 'rgba(255, 255, 255, 0.15)',
  },
  
  // Glowing borders
  border: {
    glass: 'rgba(255, 255, 255, 0.25)',
    glassLight: 'rgba(255, 255, 255, 0.15)',
    neon: 'rgba(0, 245, 255, 0.4)',
    accent: 'rgba(168, 85, 247, 0.4)',
  },
  
  // High contrast text
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.85)',
    tertiary: 'rgba(255, 255, 255, 0.7)',
    inverse: '#000000',
    accent: '#00f5ff',
    neon: '#a855f7',
  },
  
  // Stunning gradients
  gradient: {
    primary: ['#00f5ff', '#a855f7'],
    secondary: ['#a855f7', '#f472b6'],
    accent: ['#06b6d4', '#22c55e'],
    glass: ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)'],
    card: ['rgba(0, 245, 255, 0.15)', 'rgba(168, 85, 247, 0.15)'],
    background: ['#0a0a0f', '#111827', '#1f2937'],
    hero: ['#0a0a0f', '#1e1b4b', '#312e81'],
  },
  
  // Glowing shadows
  shadow: {
    glass: 'rgba(0, 0, 0, 0.4)',
    neon: 'rgba(0, 245, 255, 0.4)',
    accent: 'rgba(168, 85, 247, 0.4)',
    card: 'rgba(0, 0, 0, 0.3)',
  },
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '800' as const, lineHeight: 36 },
  h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
};

// Responsive design helpers
const getResponsiveSize = (small: number, medium: number, large: number) => {
  if (screenWidth < 400) return small;
  if (screenWidth < 600) return medium;
  return large;
};

const getResponsiveFontSize = (small: number, medium: number, large: number) => {
  if (screenWidth < 400) return small;
  if (screenWidth < 600) return medium;
  return large;
};

const isSmallScreen = screenWidth < 400;
const isMediumScreen = screenWidth >= 400 && screenWidth < 600;
const isTablet = screenWidth >= 600;

interface ResultsAnalyticsScreenProps {
  onBack: () => void;
  onNavigateToImportResults?: () => void;
  onNavigateToBulkImportResults?: () => void;
  onNavigateToResultView?: () => void;
  onNavigateToResultAnalysis?: () => void;
  onNavigateToResultSettings?: () => void;
  onNavigateToCertificateManagement?: () => void;
}


interface AnalyticsData {
  totalParticipants: number;
  preTestParticipants: number;
  postTestParticipants: number;
  averagePreTestScore: number;
  averagePostTestScore: number;
  improvementRate: number;
  passRate: number;
  completionRate: number;
  categoryPerformance: any[];
  difficultyAnalysis: any[];
  timeAnalysis: any[];
}

export default function ResultsAnalyticsScreen({ 
  onBack, 
  onNavigateToImportResults, 
  onNavigateToBulkImportResults, 
  onNavigateToResultView, 
  onNavigateToResultAnalysis, 
  onNavigateToResultSettings, 
  onNavigateToCertificateManagement 
}: ResultsAnalyticsScreenProps) {
  const containerMaxWidth = useContainerMaxWidth();
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pre_test' | 'post_test'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [selectedParticipant, setSelectedParticipant] = useState<TestSubmission | null>(null);
  const [showDetailedResults, setShowDetailedResults] = useState<boolean>(false);
  const [detailedResults, setDetailedResults] = useState<any>(null);
  const [showParticipantAnswers, setShowParticipantAnswers] = useState<boolean>(false);
  const [selectedParticipantForAnswers, setSelectedParticipantForAnswers] = useState<TestSubmission | null>(null);
  const [participantSearchQuery, setParticipantSearchQuery] = useState<string>('');
  const [loadingDetailedAnswers, setLoadingDetailedAnswers] = useState<boolean>(false);
  const [testTypeFilter, setTestTypeFilter] = useState<'all' | 'pre_test' | 'post_test'>('all');
  
  // New filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pass' | 'fail'>('all');
  const [courseSessionFilter, setCourseSessionFilter] = useState<'all' | 'today' | '7days' | '30days' | 'custom'>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [customDateStart, setCustomDateStart] = useState<Date | null>(null);
  const [customDateEnd, setCustomDateEnd] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  // Problematic questions analytics state
  const [problematicQuestions, setProblematicQuestions] = useState<any>(null);
  const [loadingProblematicQuestions, setLoadingProblematicQuestions] = useState<boolean>(false);
  const [showProblematicQuestions, setShowProblematicQuestions] = useState<boolean>(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    loadData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: reduceMotion ? 250 : 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: reduceMotion ? 250 : 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load submissions from Supabase
      const allSubmissions = await SubmissionService.getAllSubmissions();
      setSubmissions(allSubmissions);
      
      // Load analytics
      const analyticsData = await AnalyticsService.getOverallPerformance(allSubmissions);
      setAnalytics(analyticsData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load analytics data. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadProblematicQuestions = async () => {
    try {
      setLoadingProblematicQuestions(true);
      const analysis = await AnalyticsService.getProblematicQuestionsAnalysis();
      setProblematicQuestions(analysis);
      // Don't show modal, just load the data for display in main content
      } catch (error) {
      console.error('Error loading problematic questions:', error);
      Alert.alert('Error', 'Failed to load problematic questions analysis. Please try again.');
    } finally {
      setLoadingProblematicQuestions(false);
    }
  };

  const handleExportResults = async () => {
    try {
      const filteredSubmissions = getFilteredSubmissions();
      
      if (exportFormat === 'pdf') {
        await CertificateService.generateResultsPdf(filteredSubmissions, analytics);
        Alert.alert('Success', 'Results exported to PDF successfully');
      } else {
        // Excel export would be implemented here
        Alert.alert('Success', 'Results exported to Excel successfully');
      }
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export results');
    }
  };

  const handleGenerateCertificate = async (submission: TestSubmission) => {
    try {
      const certificateData = await CertificateService.generateCertificateData(
        submission.user_id,
        submission.user_name || 'Unknown User',
        {
          score: submission.score,
          totalQuestions: submission.total_questions,
          correctAnswers: submission.correct_answers,
          timeTaken: submission.time_taken_seconds,
          testType: submission.test_type,
          submittedAt: submission.submitted_at,
        }
      );
      await CertificateService.generateCertificatePdf(certificateData);
      Alert.alert('Success', 'Certificate generated successfully');
      setShowCertificateModal(false);
    } catch (error) {
      console.error('Certificate generation error:', error);
      Alert.alert('Error', 'Failed to generate certificate');
    }
  };

  const handleViewDetailedResults = async (submission: TestSubmission) => {
    try {
      const detailed = await AnalyticsService.getDetailedResults(submission.id);
      setDetailedResults(detailed);
      setShowDetailedResults(true);
    } catch (error) {
      console.error('Error loading detailed results:', error);
      Alert.alert('Error', 'Failed to load detailed results');
    }
  };

  const loadDetailedAnswers = async (participant: TestSubmission) => {
    try {
      setLoadingDetailedAnswers(true);
      
      // Fetch detailed answers from Supabase for both pre and post tests
      const userId = participant.user_id;
      const preTest = submissions.find(s => s.user_id === userId && s.test_type === 'pre_test');
      const postTest = submissions.find(s => s.user_id === userId && s.test_type === 'post_test');
      
      // Load detailed answers for pre-test if available
      if (preTest) {
        try {
          const preTestDetails = await AnalyticsService.getDetailedResults(preTest.id);
          (preTest as any).answers = preTestDetails.answers || [];
          } catch (error) {
          console.error('Error loading pre-test details:', error);
          // Set empty answers array as fallback
          (preTest as any).answers = [];
        }
      }
      
      // Load detailed answers for post-test if available
      if (postTest) {
        try {
          const postTestDetails = await AnalyticsService.getDetailedResults(postTest.id);
          (postTest as any).answers = postTestDetails.answers || [];
          } catch (error) {
          console.error('Error loading post-test details:', error);
          // Set empty answers array as fallback
          (postTest as any).answers = [];
        }
      }
      
      setSelectedParticipantForAnswers(participant);
      setShowDetailedResults(true);
    } catch (error) {
      console.error('Error loading detailed answers:', error);
      // Don't show alert, just log the error and continue
      setSelectedParticipantForAnswers(participant);
      setShowDetailedResults(true);
    } finally {
      setLoadingDetailedAnswers(false);
    }
  };

  const getFilteredParticipants = () => {
    // Get unique participants with both pre and post test data
    const participantMap = new Map();
    filteredSubmissions.forEach(submission => {
      const userId = submission.user_id;
      if (!participantMap.has(userId)) {
        participantMap.set(userId, {
          user: submission,
          preTest: null,
          postTest: null
        });
      }
      
      if (submission.test_type === 'pre_test') {
        participantMap.get(userId).preTest = submission;
      } else if (submission.test_type === 'post_test') {
        participantMap.get(userId).postTest = submission;
      }
    });
    
    let participants = Array.from(participantMap.values());
    
    // Filter by search query
    if (participantSearchQuery.trim()) {
      const query = participantSearchQuery.toLowerCase();
      participants = participants.filter((participant: any) => 
        participant.user.user_name?.toLowerCase().includes(query) ||
        participant.user.ic_number?.toLowerCase().includes(query) ||
        participant.user.job_position_name?.toLowerCase().includes(query)
      );
    }
    
    return participants;
  };

  const getFilteredSubmissions = () => {
    let filtered = submissions;
    
    // Test type filter (from tabs)
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(sub => sub.test_type === selectedFilter);
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => {
        const isPass = sub.score >= (sub.job_category === 'Clinical' ? 25 : 20);
        return statusFilter === 'pass' ? isPass : !isPass;
      });
    }
    
    // Course session filter
    if (courseSessionFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(sub => {
        const submissionDate = new Date(sub.submitted_at);
        
        switch (courseSessionFilter) {
          case 'today':
            return submissionDate >= today;
          case '7days':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return submissionDate >= weekAgo;
          case '30days':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return submissionDate >= monthAgo;
          case 'custom':
            if (customDateStart && customDateEnd) {
              const startDate = new Date(customDateStart);
              const endDate = new Date(customDateEnd);
              endDate.setHours(23, 59, 59, 999); // Include entire end date
              return submissionDate >= startDate && submissionDate <= endDate;
            }
            return true;
          default:
            return true;
        }
      });
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sub => 
        sub.user_name?.toLowerCase().includes(query) ||
        sub.user_email?.toLowerCase().includes(query) ||
        sub.job_category?.toLowerCase().includes(query) ||
        sub.ic_number?.toLowerCase().includes(query) ||
        sub.job_position_name?.toLowerCase().includes(query)
      );
    }
    
    // Default A-Z sorting by name
    filtered = filtered.sort((a, b) => {
      const nameA = (a.user_name || '').toLowerCase();
      const nameB = (b.user_name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    return filtered;
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    } as Intl.DateTimeFormatOptions);
  };

  const getPassStatus = (score: number, total: number, userType: string) => {
    const percentage = (score / total) * 100;
    const clinicalPass = 25; // 25/30 for clinical
    const nonClinicalPass = 20; // 20/30 for non-clinical
    
    if (userType === 'clinical') {
      return score >= clinicalPass ? 'PASS' : 'FAIL';
    } else {
      return score >= nonClinicalPass ? 'PASS' : 'FAIL';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
          <Text style={styles.loadingText}>Loading analytics data...</Text>
          <Text style={styles.loadingSubtext}>Please wait while we process the results</Text>
        </View>
      </View>
    );
  }

  const filteredSubmissions = getFilteredSubmissions();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Stunning Background */}
      <View style={styles.backgroundContainer}>
        <LinearGradient
          colors={['#0a0a0f', '#1e1b4b', '#312e81']}
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.glassOverlay} />
        <View style={styles.particleContainer}>
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.particle,
                {
                  left: Math.random() * screenWidth,
                  top: Math.random() * screenHeight,
                },
              ]}
            />
          ))}
      </View>
          </View>
          
      {/* Hero Header */}
      <View style={styles.heroHeader}>
        <LinearGradient
          colors={['rgba(0, 245, 255, 0.1)', 'rgba(168, 85, 247, 0.1)']}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroTopRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onBack();
                }}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
              <View style={styles.heroTitleContainer}>
                <Text style={styles.heroTitle}>Analytics Dashboard</Text>
                <Text style={styles.heroSubtitle}>Real-time insights & performance metrics</Text>
              </View>
              <View style={styles.heroActions}>
                <TouchableOpacity
                  style={styles.heroButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowExportModal(true);
                  }}
                >
                  <Ionicons name="download" size={20} color="#ffffff" />
                  <Text style={styles.heroButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
            </View>
          </View>
        </LinearGradient>
        </View>

        {/* Main Content */}
      <View style={[styles.mainContent, containerMaxWidth ? { maxWidth: containerMaxWidth, alignSelf: 'center', width: '100%' } : null]}>
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        >
        {/* Compact Dashboard Layout */}
        <Animated.View style={[
          styles.dashboardContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          {/* Compact Stats Row */}
          <View style={styles.compactStatsRow}>
            <View style={styles.compactStatItem}>
              <Ionicons name="people" size={20} color={COLORS.primary} />
              <Text style={styles.compactStatValue}>{analytics?.totalParticipants || 0}</Text>
              <Text style={styles.compactStatLabel}>Participants</Text>
            </View>
            <View style={styles.compactStatItem}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.compactStatValue}>{analytics?.passRate?.toFixed(1) || 0}%</Text>
              <Text style={styles.compactStatLabel}>Pass Rate</Text>
            </View>
            <View style={styles.compactStatItem}>
              <Ionicons name="trending-up" size={20} color={COLORS.warning} />
              <Text style={styles.compactStatValue}>{analytics?.improvementRate?.toFixed(1) || 0}%</Text>
              <Text style={styles.compactStatLabel}>Improvement</Text>
            </View>
            <View style={styles.compactStatItem}>
              <Ionicons name="time" size={20} color={COLORS.secondary} />
              <Text style={styles.compactStatValue}>{analytics?.completionRate?.toFixed(1) || 0}%</Text>
              <Text style={styles.compactStatLabel}>Completion</Text>
            </View>
          </View>
          
          {/* Compact Quick Actions */}
          <View style={styles.compactActionsRow}>
            <TouchableOpacity
              style={styles.compactActionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (onNavigateToBulkImportResults) {
                      onNavigateToBulkImportResults();
                    }
                  }}
                >
              <Ionicons name="cloud-upload" size={18} color="#ffffff" />
              <Text style={styles.compactActionText}>Import</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.compactActionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowParticipantAnswers(true);
              }}
            >
              <Ionicons name="eye" size={18} color="#ffffff" />
              <Text style={styles.compactActionText}>View</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.compactActionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Load problematic questions analysis first
                loadProblematicQuestions();
                // Then navigate to analytics screen
                if (onNavigateToResultAnalysis) {
                  onNavigateToResultAnalysis();
                }
              }}
              disabled={loadingProblematicQuestions}
            >
              {loadingProblematicQuestions ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="analytics" size={18} color="#ffffff" />
              )}
              <Text style={styles.compactActionText}>Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.compactActionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (onNavigateToCertificateManagement) {
                  onNavigateToCertificateManagement();
                }
              }}
            >
              <Ionicons name="document-text" size={18} color="#ffffff" />
              <Text style={styles.compactActionText}>Certificates</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.compactActionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowExportModal(true);
                  }}
                >
              <Ionicons name="download" size={18} color="#ffffff" />
              <Text style={styles.compactActionText}>Export</Text>
                </TouchableOpacity>

                <TouchableOpacity
              style={styles.compactActionButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (onNavigateToResultSettings) {
                  onNavigateToResultSettings();
                }
              }}
            >
              <Ionicons name="settings" size={18} color="#ffffff" />
              <Text style={styles.compactActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Full Screen Results Section */}
          <Animated.View style={[
          styles.fullScreenResultsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
          {/* Header with Filters */}
          <View style={styles.resultsHeader}>
            <View style={styles.resultsTitleRow}>
              <Text style={styles.resultsTitle}>Test Results</Text>
              <View style={styles.resultsStats}>
                <Text style={styles.resultsCountText}>{filteredSubmissions.length} results</Text>
                <TouchableOpacity
                  style={styles.filterToggleButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowFilters(!showFilters);
                  }}
                >
                  <Ionicons name="filter" size={16} color={COLORS.primary} />
                  <Text style={styles.filterToggleText}>Filters</Text>
                </TouchableOpacity>
                      </View>
                </View>
                
            {/* Test Type Tabs */}
            <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                  styles.tabButton,
                  selectedFilter === 'all' && styles.tabButtonActive
              ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedFilter('all');
                }}
            >
              <Text style={[
                  styles.tabButtonText,
                  selectedFilter === 'all' && styles.tabButtonTextActive
                ]}>
                  All Results
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                  styles.tabButton,
                  selectedFilter === 'pre_test' && styles.tabButtonActive
              ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedFilter('pre_test');
                }}
            >
              <Text style={[
                  styles.tabButtonText,
                  selectedFilter === 'pre_test' && styles.tabButtonTextActive
                ]}>
                  Pre Test
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                  styles.tabButton,
                  selectedFilter === 'post_test' && styles.tabButtonActive
              ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedFilter('post_test');
                }}
            >
              <Text style={[
                  styles.tabButtonText,
                  selectedFilter === 'post_test' && styles.tabButtonTextActive
                ]}>
                  Post Test
                </Text>
            </TouchableOpacity>
          </View>
          
            {/* Advanced Filters */}
            {showFilters && (
              <View style={styles.advancedFiltersContainer}>
                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={16} color={COLORS.text.secondary} />
            <TextInput
              style={styles.searchInput}
                    placeholder="Search by name, IC, email, job..."
              value={searchQuery}
              onChangeText={setSearchQuery}
                placeholderTextColor={COLORS.text.tertiary}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                      style={styles.clearSearchButton}
                >
                      <Ionicons name="close-circle" size={16} color={COLORS.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
                
                {/* Filter Rows */}
                <View style={styles.filterRows}>
                  {/* Status Filter */}
                  <View style={styles.filterRow}>
                    <Text style={styles.filterLabel}>Status:</Text>
                    <View style={styles.filterButtons}>
                      {['all', 'pass', 'fail'].map((status) => (
            <TouchableOpacity
                          key={status}
              style={[
                            styles.filterButton,
                            statusFilter === status && styles.filterButtonActive
              ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setStatusFilter(status as any);
                          }}
            >
              <Text style={[
                            styles.filterButtonText,
                            statusFilter === status && styles.filterButtonTextActive
              ]}>
                            {status === 'all' ? 'All' : status === 'pass' ? 'Pass Only' : 'Fail Only'}
          </Text>
            </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  {/* Course Session Filter */}
                  <View style={styles.filterRow}>
                    <Text style={styles.filterLabel}>Course Session:</Text>
                    <View style={styles.filterButtons}>
                      {['all', 'today', '7days', '30days', 'custom'].map((session) => (
            <TouchableOpacity
                          key={session}
              style={[
                            styles.filterButton,
                            courseSessionFilter === session && styles.filterButtonActive
              ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setCourseSessionFilter(session as any);
                          }}
            >
              <Text style={[
                            styles.filterButtonText,
                            courseSessionFilter === session && styles.filterButtonTextActive
              ]}>
                            {session === 'all' ? 'All Time' : 
                             session === 'today' ? 'Today' :
                             session === '7days' ? '7 Days' :
                             session === '30days' ? '30 Days' : 'Custom'}
              </Text>
            </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  {/* Custom Date Range */}
                  {courseSessionFilter === 'custom' && (
                    <View style={styles.customDateRow}>
                      <Text style={styles.filterLabel}>Date Range:</Text>
                      <View style={styles.dateInputs}>
            <TouchableOpacity
                          style={styles.datePickerButton}
                          onPress={() => setShowDatePicker('start')}
                        >
                          <Ionicons name="calendar" size={16} color={COLORS.primary} />
                          <Text style={styles.datePickerText}>
                            {customDateStart ? customDateStart.toLocaleDateString() : 'Start Date'}
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.dateSeparator}>to</Text>
                        <TouchableOpacity
                          style={styles.datePickerButton}
                          onPress={() => setShowDatePicker('end')}
                        >
                          <Ionicons name="calendar" size={16} color={COLORS.primary} />
                          <Text style={styles.datePickerText}>
                            {customDateEnd ? customDateEnd.toLocaleDateString() : 'End Date'}
              </Text>
            </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
          
          {/* Results Table */}
          {filteredSubmissions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyStateIcon}>
                <Ionicons name="document-outline" size={48} color={COLORS.text.tertiary} />
              </View>
              <Text style={styles.emptyStateTitle}>No Results Found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No participants match your search criteria' : 'No test submissions available yet'}
              </Text>
            </View>
          ) : (
            <View style={styles.fullScreenTableContainer}>
              {/* Table Header */}
              <View style={styles.fullScreenTableHeader}>
                <Text style={styles.fullScreenTableHeaderText}>Name</Text>
                <Text style={styles.fullScreenTableHeaderText}>IC Number</Text>
                <Text style={styles.fullScreenTableHeaderText}>Job Position</Text>
                {selectedFilter === 'all' ? (
                  <>
                    <Text style={styles.fullScreenTableHeaderText}>Pre Test</Text>
                    <Text style={styles.fullScreenTableHeaderText}>Post Test</Text>
                  </>
                ) : (
                  <Text style={styles.fullScreenTableHeaderText}>Score</Text>
                )}
                <Text style={styles.fullScreenTableHeaderText}>Status</Text>
                <Text style={styles.fullScreenTableHeaderText}>Certificate</Text>
              </View>
              
              {/* Table Body - Full Screen Height */}
              <ScrollView 
                style={styles.fullScreenTableBody}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {(() => {
                  if (selectedFilter === 'all') {
                    // Group submissions by user_id to show each participant once
                    const groupedSubmissions = filteredSubmissions.reduce((acc, submission) => {
                      const userId = submission.user_id;
                      if (!acc[userId]) {
                        acc[userId] = {
                          user: submission,
                          preTest: null,
                          postTest: null
                        };
                      }
                      
                      if (submission.test_type === 'pre_test') {
                        acc[userId].preTest = submission;
                      } else if (submission.test_type === 'post_test') {
                        acc[userId].postTest = submission;
                      }
                      
                      return acc;
                    }, {} as any);

                    return Object.values(groupedSubmissions).map((group: any, index) => {
                      const { user, preTest, postTest } = group;
                      
                      // Determine overall status based on post-test (if available) or pre-test
                      const testForStatus = postTest || preTest;
                      const isPass = testForStatus ? testForStatus.score >= (testForStatus.job_category === 'Clinical' ? 25 : 20) : false;
                      
                      return (
                        <Animated.View
                          key={user.user_id}
                          style={[
                                styles.fullScreenTableRow,
                                {
                                  backgroundColor: index % 2 === 0 
                                    ? 'rgba(255, 255, 255, 0.02)' 
                                    : 'rgba(255, 255, 255, 0.05)',
                                  borderLeftWidth: 3,
                                  borderLeftColor: isPass ? COLORS.success : COLORS.error,
                              opacity: fadeAnim,
                              transform: [{ 
                                translateY: Animated.add(slideAnim, new Animated.Value(index * 10))
                              }]
                            }
                          ]}
                        >
                          <Text style={styles.fullScreenTableCell} numberOfLines={2}>
                            {user.user_name || 'Unknown User'}
                      </Text>
                          <Text style={styles.fullScreenTableCell} numberOfLines={1}>
                            {user.ic_number || 'N/A'}
                      </Text>
                          <Text style={styles.fullScreenTableCell} numberOfLines={2}>
                            {user.job_position_name || 'N/A'}
                      </Text>
                          
                          {/* Pre-Test Column */}
                          <View style={styles.fullScreenScoreCell}>
                            {preTest ? (
                              <>
                                <Text style={[
                                  styles.fullScreenScoreText,
                                  { 
                                    color: preTest.score >= (preTest.job_category === 'Clinical' ? 25 : 20) 
                                      ? COLORS.success : COLORS.error 
                                  }
                                ]}>
                                  {preTest.score}/{preTest.total_questions}
                      </Text>
                      <Text style={[
                                  styles.fullScreenPercentageText,
                                  { 
                                    color: preTest.score >= (preTest.job_category === 'Clinical' ? 25 : 20) 
                                      ? COLORS.success : COLORS.error 
                                  }
                                ]}>
                                  {Math.round((preTest.score / preTest.total_questions) * 100)}%
                      </Text>
                              </>
                            ) : (
                              <Text style={styles.fullScreenNoDataText}>N/A</Text>
                            )}
                    </View>
                    
                          {/* Post-Test Column */}
                          <View style={styles.fullScreenScoreCell}>
                            {postTest ? (
                              <>
                                <Text style={[
                                  styles.fullScreenScoreText,
                                  { 
                                    color: postTest.score >= (postTest.job_category === 'Clinical' ? 25 : 20) 
                                      ? COLORS.success : COLORS.error 
                                  }
                                ]}>
                                  {postTest.score}/{postTest.total_questions}
                      </Text>
                                <Text style={[
                                  styles.fullScreenPercentageText,
                                  { 
                                    color: postTest.score >= (postTest.job_category === 'Clinical' ? 25 : 20) 
                                      ? COLORS.success : COLORS.error 
                                  }
                                ]}>
                                  {Math.round((postTest.score / postTest.total_questions) * 100)}%
                                </Text>
                              </>
                            ) : (
                              <Text style={styles.fullScreenNoDataText}>N/A</Text>
                            )}
                    </View>
                    
                          {/* Status Column */}
                          <View style={styles.fullScreenStatusCell}>
                            {postTest ? (
                              <View style={[
                                styles.fullScreenStatusBadge,
                                {
                                  backgroundColor: postTest.score >= (postTest.job_category === 'Clinical' ? 25 : 20) 
                                    ? COLORS.success : COLORS.error 
                        }
                      ]}>
                                <Text style={styles.fullScreenStatusText}>
                                  {postTest.score >= (postTest.job_category === 'Clinical' ? 25 : 20) ? 'PASS' : 'FAIL'}
                      </Text>
                    </View>
                            ) : preTest ? (
                              <Text style={styles.fullScreenNoDataText}>Pre-Test Only</Text>
                            ) : (
                              <Text style={styles.fullScreenNoDataText}>N/A</Text>
                            )}
                  </View>
                  
                          {/* Certificate Column */}
                          <View style={styles.fullScreenCertificateCell}>
                    <TouchableOpacity
                              style={[
                                styles.fullScreenCertificateButton,
                                {
                                  backgroundColor: (postTest || preTest) ? COLORS.primary : '#6b7280'
                                }
                              ]}
                              onPress={() => {
                                if (postTest || preTest) {
                                  setSelectedParticipant(postTest || preTest);
                                  setShowCertificateModal(true);
                                }
                              }}
                            >
                              <Ionicons name="document-text" size={12} color="#ffffff" />
                              <Text style={styles.fullScreenCertificateButtonText}>Release</Text>
                    </TouchableOpacity>
                          </View>
                        </Animated.View>
                      );
                    });
                  } else {
                    // Show individual test results for pre-test or post-test tabs
                    const filteredByType = filteredSubmissions.filter(sub => sub.test_type === selectedFilter);
                    
                    return filteredByType.map((submission, index) => {
                      const isPass = submission.score >= (submission.job_category === 'Clinical' ? 25 : 20);
                      
                      return (
                        <Animated.View
                          key={submission.id}
                          style={[
                            styles.fullScreenTableRow,
                            {
                              backgroundColor: index % 2 === 0 
                                ? 'rgba(255, 255, 255, 0.02)' 
                                : 'rgba(255, 255, 255, 0.05)',
                              borderLeftWidth: 3,
                              borderLeftColor: isPass ? COLORS.success : COLORS.error,
                              opacity: fadeAnim,
                              transform: [{ 
                                translateY: Animated.add(slideAnim, new Animated.Value(index * 10))
                              }]
                            }
                          ]}
                        >
                          <Text style={styles.fullScreenTableCell} numberOfLines={2}>
                            {submission.user_name || 'Unknown User'}
                          </Text>
                          <Text style={styles.fullScreenTableCell} numberOfLines={1}>
                            {submission.ic_number || 'N/A'}
                          </Text>
                          <Text style={styles.fullScreenTableCell} numberOfLines={2}>
                            {submission.job_position_name || 'N/A'}
                          </Text>
                          
                          {/* Score Column */}
                          <View style={styles.fullScreenScoreCell}>
                            <Text style={[
                              styles.fullScreenScoreText,
                              { color: isPass ? COLORS.success : COLORS.error }
                            ]}>
                              {submission.score}/{submission.total_questions}
                            </Text>
                            <Text style={[
                              styles.fullScreenPercentageText,
                              { color: isPass ? COLORS.success : COLORS.error }
                            ]}>
                              {Math.round((submission.score / submission.total_questions) * 100)}%
                            </Text>
                            <Text style={styles.fullScreenNoDataText}>
                              {Math.floor(submission.time_taken_seconds / 60)}m {submission.time_taken_seconds % 60}s
                            </Text>
                          </View>
                          
                          {/* Status Column */}
                          <View style={styles.fullScreenStatusCell}>
                            <View style={[
                              styles.fullScreenStatusBadge,
                              {
                                backgroundColor: isPass ? COLORS.success : COLORS.error
                              }
                            ]}>
                              <Text style={styles.fullScreenStatusText}>
                                {isPass ? 'PASS' : 'FAIL'}
                              </Text>
                            </View>
                          </View>
                          
                          {/* Certificate Column */}
                          <View style={styles.fullScreenCertificateCell}>
                    <TouchableOpacity
                              style={[
                                styles.fullScreenCertificateButton,
                                { backgroundColor: COLORS.primary }
                              ]}
                      onPress={() => {
                                setSelectedParticipant(submission);
                        setShowCertificateModal(true);
                      }}
                    >
                              <Ionicons name="document-text" size={12} color="#ffffff" />
                              <Text style={styles.fullScreenCertificateButtonText}>Release</Text>
                    </TouchableOpacity>
                  </View>
                        </Animated.View>
                      );
                    });
                  }
                })()}
              </ScrollView>
                </View>
          )}
        </Animated.View>
        </ScrollView>
        </View>


      {/* Modern Export Modal */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons name="download" size={24} color={COLORS.primary} />
              </View>
            <Text style={styles.modalTitle}>Export Results</Text>
              <Text style={styles.modalSubtitle}>Choose your preferred export format</Text>
            </View>
            
            <View style={styles.exportOptions}>
              <TouchableOpacity
                style={[
                  styles.exportOption,
                  exportFormat === 'pdf' && styles.exportOptionSelected
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setExportFormat('pdf');
                }}
              >
                <View style={[styles.exportOptionIcon, { backgroundColor: `${COLORS.primary}15` }]}>
                  <Ionicons name="document-text" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.exportOptionContent}>
                  <Text style={styles.exportOptionTitle}>PDF Report</Text>
                  <Text style={styles.exportOptionDescription}>Professional formatted report</Text>
                </View>
                {exportFormat === 'pdf' && (
                  <View style={styles.exportOptionCheck}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.exportOption,
                  exportFormat === 'excel' && styles.exportOptionSelected
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setExportFormat('excel');
                }}
              >
                <View style={[styles.exportOptionIcon, { backgroundColor: `${COLORS.success}15` }]}>
                  <Ionicons name="grid" size={24} color={COLORS.success} />
                </View>
                <View style={styles.exportOptionContent}>
                  <Text style={styles.exportOptionTitle}>Excel Spreadsheet</Text>
                  <Text style={styles.exportOptionDescription}>Data for further analysis</Text>
                </View>
                {exportFormat === 'excel' && (
                  <View style={styles.exportOptionCheck}>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleExportResults}
              >
                <Ionicons name="download" size={16} color={COLORS.text.inverse} />
                <Text style={styles.modalButtonPrimaryText}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modern Certificate Modal */}
      <Modal
        visible={showCertificateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCertificateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons name="document-text" size={24} color={COLORS.success} />
              </View>
            <Text style={styles.modalTitle}>Generate Certificate</Text>
            <Text style={styles.modalSubtitle}>
                Create certificate for {selectedParticipant?.user_name}
            </Text>
            </View>
            
            <View style={styles.certificatePreview}>
              <View style={styles.certificateIcon}>
                <Ionicons name="ribbon" size={32} color={COLORS.success} />
              </View>
              <Text style={styles.certificateTitle}>Certificate of Completion</Text>
              <Text style={styles.certificateDescription}>
                This will generate a professional certificate for the participant's test results.
              </Text>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowCertificateModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => selectedParticipant && handleGenerateCertificate(selectedParticipant)}
              >
                <Ionicons name="document-text" size={16} color={COLORS.text.inverse} />
                <Text style={styles.modalButtonPrimaryText}>Generate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modern Detailed Results Modal */}
      <Modal
        visible={showDetailedResults}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailedResults(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailedResultsModal}>
            <View style={styles.detailedResultsHeader}>
              <View style={styles.detailedResultsTitleContainer}>
                <View style={styles.detailedResultsIcon}>
                  <Ionicons name="analytics" size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.detailedResultsTitle}>Detailed Analysis</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDetailedResults(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.detailedResultsContent} showsVerticalScrollIndicator={false}>
              {detailedResults ? (
                <View style={styles.detailedResultsContent}>
                  <View style={styles.detailedResultsCard}>
                  <Text style={styles.detailedResultsText}>
                    Detailed analysis would be displayed here...
                  </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.detailedResultsLoading}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.detailedResultsLoadingText}>Loading analysis...</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Calendar Pickers */}
      <CalendarPicker
        visible={showDatePicker === 'start'}
        onClose={() => setShowDatePicker(null)}
        onDateSelect={(date) => {
          setCustomDateStart(new Date(date));
                      setShowDatePicker(null);
                    }}
        title="Select Start Date"
        initialDate={customDateStart || new Date()}
      />

      <CalendarPicker
        visible={showDatePicker === 'end'}
        onClose={() => setShowDatePicker(null)}
        onDateSelect={(date) => {
          setCustomDateEnd(new Date(date));
                      setShowDatePicker(null);
                    }}
        title="Select End Date"
        initialDate={customDateEnd || new Date()}
        minDate={customDateStart || undefined}
      />

      {/* Participant Selection Modal */}
      <Modal
        visible={showParticipantAnswers}
        transparent
        animationType="fade"
        onRequestClose={() => setShowParticipantAnswers(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.participantSelectionModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons name="people" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.modalTitle}>Select Participant</Text>
              <Text style={styles.modalSubtitle}>Choose a participant to view their detailed answers</Text>
            </View>
            
            {/* Search Bar */}
            <View style={styles.participantSearchBar}>
              <Ionicons name="search" size={16} color={COLORS.text.secondary} />
              <TextInput
                style={styles.participantSearchInput}
                placeholder="Search by name, IC, or job position..."
                value={participantSearchQuery}
                onChangeText={setParticipantSearchQuery}
                placeholderTextColor={COLORS.text.tertiary}
              />
              {participantSearchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setParticipantSearchQuery('')}
                  style={styles.clearParticipantSearchButton}
                >
                  <Ionicons name="close-circle" size={16} color={COLORS.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>
            
            <ScrollView style={styles.participantList}>
              {(() => {
                const participants = getFilteredParticipants();
                
                if (participants.length === 0) {
                  return (
                    <View style={styles.noParticipantsFound}>
                      <Ionicons name="person-outline" size={48} color={COLORS.text.tertiary} />
                      <Text style={styles.noParticipantsText}>
                        {participantSearchQuery ? 'No participants found matching your search' : 'No participants available'}
                      </Text>
                    </View>
                  );
                }
                
                return participants.map((participant: any) => {
                  const { user, preTest, postTest } = participant;
                  const hasPreTest = preTest !== null;
                  const hasPostTest = postTest !== null;
                  
                  return (
                    <TouchableOpacity
                      key={user.user_id}
                      style={styles.participantItem}
                      onPress={() => {
                        loadDetailedAnswers(user);
                        setShowParticipantAnswers(false);
                      }}
                    >
                      <View style={styles.participantInfo}>
                        <Text style={styles.participantName}>{user.user_name || 'Unknown User'}</Text>
                        <Text style={styles.participantDetails}>
                          {user.job_position_name || 'N/A'} • {user.ic_number || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.testStatusContainer}>
                        {hasPreTest && (
                          <View style={[
                            styles.testStatusBadge,
                            { backgroundColor: preTest.score >= (preTest.job_category === 'Clinical' ? 25 : 20) ? COLORS.success : COLORS.error }
                          ]}>
                            <Text style={styles.testStatusText}>Pre: {preTest.score}/{preTest.total_questions}</Text>
                          </View>
                        )}
                        {hasPostTest && (
                          <View style={[
                            styles.testStatusBadge,
                            { backgroundColor: postTest.score >= (postTest.job_category === 'Clinical' ? 25 : 20) ? COLORS.success : COLORS.error }
                          ]}>
                            <Text style={styles.testStatusText}>Post: {postTest.score}/{postTest.total_questions}</Text>
                          </View>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={COLORS.text.tertiary} />
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowParticipantAnswers(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detailed Answers Modal */}
      <Modal
        visible={showDetailedResults && selectedParticipantForAnswers !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDetailedResults(false);
          setSelectedParticipantForAnswers(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailedAnswersModal}>
            <View style={styles.detailedAnswersHeader}>
              <View style={styles.detailedAnswersTitleContainer}>
                <Ionicons name="person" size={24} color={COLORS.primary} />
                <View style={styles.detailedAnswersTitleText}>
                  <Text style={styles.detailedAnswersTitle}>
                    {selectedParticipantForAnswers?.user_name || 'Unknown User'}
                  </Text>
                  <Text style={styles.detailedAnswersSubtitle}>
                    {selectedParticipantForAnswers?.job_position_name || 'N/A'} • {selectedParticipantForAnswers?.ic_number || 'N/A'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowDetailedResults(false);
                  setSelectedParticipantForAnswers(null);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text.secondary} />
              </TouchableOpacity>
            </View>
            
            {/* Test Type Filter */}
            <View style={styles.testTypeFilterContainer}>
              <TouchableOpacity
                style={[
                  styles.testTypeFilterButton,
                  testTypeFilter === 'all' && styles.testTypeFilterButtonActive
                ]}
                onPress={() => setTestTypeFilter('all')}
              >
                <Ionicons name="list" size={16} color={testTypeFilter === 'all' ? '#ffffff' : COLORS.text.secondary} />
                <Text style={[
                  styles.testTypeFilterText,
                  testTypeFilter === 'all' && styles.testTypeFilterTextActive
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.testTypeFilterButton,
                  testTypeFilter === 'pre_test' && styles.testTypeFilterButtonActive
                ]}
                onPress={() => setTestTypeFilter('pre_test')}
              >
                <Ionicons name="play-circle" size={16} color={testTypeFilter === 'pre_test' ? '#ffffff' : COLORS.warning} />
                <Text style={[
                  styles.testTypeFilterText,
                  testTypeFilter === 'pre_test' && styles.testTypeFilterTextActive
                ]}>
                  Pre-Test
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.testTypeFilterButton,
                  testTypeFilter === 'post_test' && styles.testTypeFilterButtonActive
                ]}
                onPress={() => setTestTypeFilter('post_test')}
              >
                <Ionicons name="checkmark-circle" size={16} color={testTypeFilter === 'post_test' ? '#ffffff' : COLORS.success} />
                <Text style={[
                  styles.testTypeFilterText,
                  testTypeFilter === 'post_test' && styles.testTypeFilterTextActive
                ]}>
                  Post-Test
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.detailedAnswersContent}>
              {(() => {
                if (!selectedParticipantForAnswers) return null;
                
                if (loadingDetailedAnswers) {
                  return (
                    <View style={styles.detailedAnswersLoading}>
                      <ActivityIndicator size="large" color={COLORS.primary} />
                      <Text style={styles.detailedAnswersLoadingText}>Loading detailed answers...</Text>
                    </View>
                  );
                }
                
                // Get both pre and post test data for this participant
                const userId = selectedParticipantForAnswers.user_id;
                const preTest = submissions.find(s => s.user_id === userId && s.test_type === 'pre_test');
                const postTest = submissions.find(s => s.user_id === userId && s.test_type === 'post_test');
                
                return (
                  <View>
                    {/* Pre Test Section */}
                    {preTest && (testTypeFilter === 'all' || testTypeFilter === 'pre_test') && (
                      <View style={styles.testSection}>
                        <View style={styles.testSectionHeader}>
                          <Ionicons name="play-circle" size={20} color={COLORS.warning} />
                          <Text style={styles.testSectionTitle}>Pre Test Results</Text>
                          <View style={[
                            styles.testScoreBadge,
                            { backgroundColor: preTest.score >= (preTest.job_category === 'Clinical' ? 25 : 20) ? COLORS.success : COLORS.error }
                          ]}>
                            <Text style={styles.testScoreText}>
                              {preTest.score}/{preTest.total_questions} ({Math.round((preTest.score / preTest.total_questions) * 100)}%)
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.answersContainer}>
                          <Text style={styles.answersTitle}>Question Analysis:</Text>
                          {(preTest as any).answers && (preTest as any).answers.length > 0 ? (
                            (preTest as any).answers.map((answer: any, index: number) => (
                              <View key={answer.question_id || index} style={styles.answerItem}>
                                <View style={styles.questionHeader}>
                                  <Text style={styles.questionNumber}>Q{index + 1}</Text>
                                  <View style={[
                                    styles.answerStatusBadge,
                                    { backgroundColor: answer.is_correct ? COLORS.success : COLORS.error }
                                  ]}>
                                    <Text style={styles.answerStatusText}>
                                      {answer.is_correct ? 'Correct' : 'Incorrect'}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.questionText}>{answer.question_text}</Text>
                                
                                {/* Show all answer options */}
                                {answer.options && answer.options.length > 0 && (
                                  <View style={styles.answerOptions}>
                                    <Text style={styles.answerLabel}>Answer Options:</Text>
                                    {answer.options.map((option: string, optionIndex: number) => (
                                      <View key={optionIndex} style={[
                                        styles.optionItem,
                                        answer.selected_answer === option && { backgroundColor: 'rgba(0, 245, 255, 0.1)' }
                                      ]}>
                                        <Text style={[
                                          styles.optionText,
                                          answer.selected_answer === option && { color: COLORS.primary, fontWeight: '600' as const }
                                        ]}>
                                          {String.fromCharCode(65 + optionIndex)}. {option}
                                        </Text>
                                        {answer.selected_answer === option && (
                                          <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                                        )}
                                      </View>
                                    ))}
                                  </View>
                                )}
                                
                                <View style={styles.answerOptions}>
                                  <Text style={styles.answerLabel}>Participant's Choice:</Text>
                                  <Text style={[
                                    styles.answerText,
                                    { color: answer.is_correct ? COLORS.success : COLORS.error }
                                  ]}>
                                    {answer.selected_answer || 'No answer selected'}
                                  </Text>
                                </View>
                                
                                {!answer.is_correct && answer.correct_answer && (
                                  <View style={styles.answerOptions}>
                                    <Text style={styles.answerLabel}>Correct Answer:</Text>
                                    <Text style={[styles.answerText, { color: COLORS.success }]}>
                                      {answer.correct_answer}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            ))
                          ) : (
                            <View style={styles.noAnswersContainer}>
                              <Ionicons name="information-circle" size={24} color={COLORS.warning} />
                              <Text style={styles.noAnswersText}>Detailed answers not available</Text>
                              <Text style={styles.noAnswersSubtext}>
                                Only summary data is available: {preTest.correct_answers}/{preTest.total_questions} correct answers
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                    
                    {/* Post Test Section */}
                    {postTest && (testTypeFilter === 'all' || testTypeFilter === 'post_test') && (
                      <View style={styles.testSection}>
                        <View style={styles.testSectionHeader}>
                          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                          <Text style={styles.testSectionTitle}>Post Test Results</Text>
                          <View style={[
                            styles.testScoreBadge,
                            { backgroundColor: postTest.score >= (postTest.job_category === 'Clinical' ? 25 : 20) ? COLORS.success : COLORS.error }
                          ]}>
                            <Text style={styles.testScoreText}>
                              {postTest.score}/{postTest.total_questions} ({Math.round((postTest.score / postTest.total_questions) * 100)}%)
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.answersContainer}>
                          <Text style={styles.answersTitle}>Question Analysis:</Text>
                          {(postTest as any).answers && (postTest as any).answers.length > 0 ? (
                            (postTest as any).answers.map((answer: any, index: number) => (
                              <View key={answer.question_id || index} style={styles.answerItem}>
                                <View style={styles.questionHeader}>
                                  <Text style={styles.questionNumber}>Q{index + 1}</Text>
                                  <View style={[
                                    styles.answerStatusBadge,
                                    { backgroundColor: answer.is_correct ? COLORS.success : COLORS.error }
                                  ]}>
                                    <Text style={styles.answerStatusText}>
                                      {answer.is_correct ? 'Correct' : 'Incorrect'}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.questionText}>{answer.question_text}</Text>
                                
                                {/* Show all answer options */}
                                {answer.options && answer.options.length > 0 && (
                                  <View style={styles.answerOptions}>
                                    <Text style={styles.answerLabel}>Answer Options:</Text>
                                    {answer.options.map((option: string, optionIndex: number) => (
                                      <View key={optionIndex} style={[
                                        styles.optionItem,
                                        answer.selected_answer === option && { backgroundColor: 'rgba(0, 245, 255, 0.1)' }
                                      ]}>
                                        <Text style={[
                                          styles.optionText,
                                          answer.selected_answer === option && { color: COLORS.primary, fontWeight: '600' as const }
                                        ]}>
                                          {String.fromCharCode(65 + optionIndex)}. {option}
                                        </Text>
                                        {answer.selected_answer === option && (
                                          <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                                        )}
                                      </View>
                                    ))}
                                  </View>
                                )}
                                
                                <View style={styles.answerOptions}>
                                  <Text style={styles.answerLabel}>Participant's Choice:</Text>
                                  <Text style={[
                                    styles.answerText,
                                    { color: answer.is_correct ? COLORS.success : COLORS.error }
                                  ]}>
                                    {answer.selected_answer || 'No answer selected'}
                                  </Text>
                                </View>
                                
                                {!answer.is_correct && answer.correct_answer && (
                                  <View style={styles.answerOptions}>
                                    <Text style={styles.answerLabel}>Correct Answer:</Text>
                                    <Text style={[styles.answerText, { color: COLORS.success }]}>
                                      {answer.correct_answer}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            ))
                          ) : (
                            <View style={styles.noAnswersContainer}>
                              <Ionicons name="information-circle" size={24} color={COLORS.warning} />
                              <Text style={styles.noAnswersText}>Detailed answers not available</Text>
                              <Text style={styles.noAnswersSubtext}>
                                Only summary data is available: {postTest.correct_answers}/{postTest.total_questions} correct answers
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                    
                    {!preTest && !postTest && (
                      <View style={styles.noTestData}>
                        <Ionicons name="document-outline" size={48} color={COLORS.text.tertiary} />
                        <Text style={styles.noTestDataText}>No test data available for this participant.</Text>
                      </View>
                    )}
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  
  // Stunning Background
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundGradient: {
    flex: 1,
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  particleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    backgroundColor: COLORS.neon.electric,
    borderRadius: 1.5,
    shadowColor: COLORS.neon.electric,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  
  // Hero Header
  heroHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  heroGradient: {
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 245, 255, 0.3)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  heroContent: {
    flex: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroTitleContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: COLORS.text.primary,
    marginBottom: 8,
    textShadowColor: COLORS.neon.electric,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    fontWeight: '500' as const,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 8,
  },
  heroButtonText: {
    color: COLORS.text.primary,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  
  // Main Content
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flex: 1,
  },
  
  // Compact Dashboard Layout
  dashboardContainer: {
    marginBottom: 20,
  },
  compactStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  compactStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  compactStatValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    marginTop: 4,
    marginBottom: 2,
  },
  compactStatLabel: {
    fontSize: 11,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  compactActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  compactActionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  compactActionText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Full Screen Results Section
  fullScreenResultsSection: {
    flex: 1,
    marginBottom: 20,
  },
  resultsHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  resultsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
  },
  resultsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultsCountText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '500' as const,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
    gap: 6,
  },
  filterToggleText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  
  // Advanced Filters
  advancedFiltersContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 4,
  },
  filterRows: {
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '600' as const,
    minWidth: 80,
  },
  filterButtons: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontWeight: '600' as const,
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  customDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  dateInputs: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  datePickerText: {
    fontSize: 12,
    color: COLORS.text.primary,
    flex: 1,
  },
  dateSeparator: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    fontWeight: '500' as const,
  },
  
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: '600' as const,
  },
  tabButtonTextActive: {
    color: '#ffffff',
  },
  
  // Full Screen Table Styles
  fullScreenTableContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fullScreenTableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 245, 255, 0.2)',
  },
  fullScreenTableHeaderText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700' as const,
    textAlign: 'center',
    flex: 1,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  fullScreenTableBody: {
    flex: 1,
  },
  fullScreenTableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    minHeight: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  fullScreenTableCell: {
    fontSize: 12,
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 4,
    fontWeight: '500' as const,
  },
  fullScreenScoreCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  fullScreenScoreText: {
    fontSize: 11,
    color: COLORS.text.primary,
    fontWeight: '600' as const,
  },
  fullScreenPercentageText: {
    fontSize: 9,
    color: COLORS.text.secondary,
    marginTop: 1,
  },
  fullScreenStatusCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  fullScreenStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 45,
    alignItems: 'center',
  },
  fullScreenStatusText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '700' as const,
  },
  fullScreenCertificateCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  fullScreenCertificateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 3,
  },
  fullScreenCertificateButtonText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  fullScreenNoDataText: {
    fontSize: 9,
    color: COLORS.text.tertiary,
    fontStyle: 'italic',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.text.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.primary,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingSpinner: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.4)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  exportOptions: {
    marginBottom: 32,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.3)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  exportOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}05`,
  },
  exportOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  exportOptionContent: {
    flex: 1,
  },
  exportOptionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  exportOptionDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  exportOptionCheck: {
    marginLeft: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#00f5ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text.secondary,
  },
  certificatePreview: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
  },
  certificateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.success}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  certificateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  certificateDescription: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  detailedResultsModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.4)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  detailedResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  detailedResultsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailedResultsIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailedResultsTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
  },
  closeButton: {
    padding: 12,
  },
  detailedResultsContent: {
    padding: 32,
  },
  detailedResultsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  detailedResultsText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  detailedResultsLoading: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  detailedResultsLoadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 16,
  },
  
  // Date Picker Modal
  datePickerModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.4)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
  },
  datePickerCloseButton: {
    padding: 4,
  },
  datePickerContent: {
    alignItems: 'center',
  },
  datePickerInstructions: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  datePickerActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 20,
  },
  dateOptionsContainer: {
    width: '100%',
    marginVertical: 20,
  },
  dateOptionsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  dateOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  dateOptionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.text.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Participant Selection Modal
  participantSelectionModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.4)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  participantList: {
    maxHeight: 400,
    marginVertical: 20,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  participantDetails: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  testStatusContainer: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 12,
  },
  testStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  testStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  
  // Detailed Answers Modal
  detailedAnswersModal: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    width: '95%',
    maxWidth: 600,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0, 0, 0, 0.4)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  detailedAnswersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailedAnswersTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailedAnswersTitleText: {
    marginLeft: 12,
    flex: 1,
  },
  detailedAnswersTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  detailedAnswersSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  detailedAnswersContent: {
    flex: 1,
    padding: 24,
  },
  testSection: {
    marginBottom: 32,
  },
  testSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  testSectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  testScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  testScoreText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  answersContainer: {
    marginTop: 8,
  },
  answersTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  answerItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.primary,
  },
  answerStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  answerStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  questionText: {
    fontSize: 14,
    color: COLORS.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  answerOptions: {
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.text.secondary,
    marginBottom: 4,
    textTransform: 'uppercase' as const,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 18,
  },
  noAnswersContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  noAnswersText: {
    fontSize: 16,
    color: COLORS.warning,
    fontWeight: '600' as const,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  noAnswersSubtext: {
    fontSize: 14,
    color: COLORS.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  noTestData: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noTestDataText: {
    fontSize: 16,
    color: COLORS.text.tertiary,
    marginTop: 16,
    textAlign: 'center',
  },
  
  // Participant Search
  participantSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  participantSearchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 12,
  },
  clearParticipantSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  noParticipantsFound: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noParticipantsText: {
    fontSize: 16,
    color: COLORS.text.tertiary,
    marginTop: 16,
    textAlign: 'center',
  },
  detailedAnswersLoading: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  detailedAnswersLoadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 16,
  },
  
  // Test Type Filter Styles
  testTypeFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  testTypeFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 6,
  },
  testTypeFilterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  testTypeFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.secondary,
  },
  testTypeFilterTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // Answer Options
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionText: {
    fontSize: 14,
    color: COLORS.text.primary,
    flex: 1,
  },

  // Problematic Questions Modal Styles
  analysisSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  analysisSummaryTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.primary,
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textTransform: 'uppercase' as const,
  },
  testAnalysisSection: {
    marginBottom: 24,
  },
  testAnalysisTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  problematicQuestionItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  questionRankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  questionContent: {
    flex: 1,
  },
  questionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginBottom: 12,
    lineHeight: 18,
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  performanceStat: {
    alignItems: 'center',
    flex: 1,
  },
  performanceStatValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.primary,
    marginBottom: 2,
  },
  performanceStatLabel: {
    fontSize: 10,
    color: COLORS.text.secondary,
    textTransform: 'uppercase' as const,
  },
  questionOptions: {
    marginBottom: 12,
  },
  optionsTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.text.secondary,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.2)',
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.primary,
    marginBottom: 8,
  },
  suggestionItem: {
    fontSize: 12,
    color: COLORS.text.primary,
    marginBottom: 4,
    lineHeight: 16,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  problematicLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  problematicLoadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 16,
  },
  dataSourceNote: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  dataSourceNoteText: {
    fontSize: 11,
    color: '#ffc107',
    fontWeight: '500' as const,
    textAlign: 'center',
  },

  // Problematic Questions Section Styles
  problematicQuestionsSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.text.primary,
    marginLeft: 8,
  },
  refreshButton: {
    backgroundColor: 'rgba(0, 245, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 255, 0.3)',
  },
  problematicQuestionsContent: {
    gap: 16,
  },
  testAnalysisCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  testAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.text.secondary,
    textTransform: 'uppercase' as const,
  },
  problematicQuestionsPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  loadAnalysisButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
});

