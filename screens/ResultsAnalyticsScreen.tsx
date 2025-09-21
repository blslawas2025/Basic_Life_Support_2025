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
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // New filter states for remedial and certification
  const [remedialFilter, setRemedialFilter] = useState<'all' | 'allowed' | 'not_allowed'>('all');
  const [certificationFilter, setCertificationFilter] = useState<'all' | 'allowed' | 'not_allowed'>('all');

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

  const getFilteredSubmissions = () => {
    let filtered = submissions;
    
    // Remedial filter
    if (remedialFilter !== 'all') {
      filtered = filtered.filter(sub => {
        const isPass = sub.score >= (sub.job_category === 'Clinical' ? 25 : 20);
        if (remedialFilter === 'allowed') {
          return !isPass; // Failed participants are allowed for remedial
        } else if (remedialFilter === 'not_allowed') {
          return isPass; // Passed participants are not allowed for remedial
        }
        return true;
      });
    }
    
    // Certification filter
    if (certificationFilter !== 'all') {
      filtered = filtered.filter(sub => {
        const isPass = sub.score >= (sub.job_category === 'Clinical' ? 25 : 20);
        if (certificationFilter === 'allowed') {
          return isPass; // Passed participants are allowed for certification
        } else if (certificationFilter === 'not_allowed') {
          return !isPass; // Failed participants are not allowed for certification
        }
        return true;
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

  const filteredSubmissions = getFilteredSubmissions();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background.primary} />
      
      {/* Hero Header */}
      <LinearGradient
        colors={COLORS.gradient.hero as any}
        style={styles.heroContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.heroContent, containerMaxWidth ? { maxWidth: containerMaxWidth, alignSelf: 'center', width: '100%' } : null]}>
          <View style={styles.heroHeader}>
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
              <Text style={styles.heroTitle}>All Results</Text>
              <Text style={styles.heroSubtitle}>Results shown by category side by side</Text>
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.heroButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  // Handle export
                }}
              >
                <Ionicons name="download" size={20} color="#ffffff" />
                <Text style={styles.heroButtonText}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>

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
          {/* Filter Buttons */}
          <View style={styles.filterButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                remedialFilter === 'all' && styles.filterButtonActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRemedialFilter('all');
              }}
            >
              <Text style={[
                styles.filterButtonText,
                remedialFilter === 'all' && styles.filterButtonTextActive
              ]}>
                All Remedial
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                remedialFilter === 'allowed' && styles.filterButtonActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRemedialFilter('allowed');
              }}
            >
              <Text style={[
                styles.filterButtonText,
                remedialFilter === 'allowed' && styles.filterButtonTextActive
              ]}>
                Remedial Allowed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                remedialFilter === 'not_allowed' && styles.filterButtonActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRemedialFilter('not_allowed');
              }}
            >
              <Text style={[
                styles.filterButtonText,
                remedialFilter === 'not_allowed' && styles.filterButtonTextActive
              ]}>
                Remedial Not Allowed
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                certificationFilter === 'all' && styles.filterButtonActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCertificationFilter('all');
              }}
            >
              <Text style={[
                styles.filterButtonText,
                certificationFilter === 'all' && styles.filterButtonTextActive
              ]}>
                All Certification
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                certificationFilter === 'allowed' && styles.filterButtonActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCertificationFilter('allowed');
              }}
            >
              <Text style={[
                styles.filterButtonText,
                certificationFilter === 'allowed' && styles.filterButtonTextActive
              ]}>
                Certification Allowed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                certificationFilter === 'not_allowed' && styles.filterButtonActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCertificationFilter('not_allowed');
              }}
            >
              <Text style={[
                styles.filterButtonText,
                certificationFilter === 'not_allowed' && styles.filterButtonTextActive
              ]}>
                Certification Not Allowed
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Results Tables - Side by Side */}
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
            <View style={styles.resultsContainer}>
              {/* Clinical Participants Table */}
              <View style={styles.tableContainer}>
                <Text style={styles.tableTitle}>Clinical Participants</Text>
                <View style={styles.table}>
                  {/* Clinical Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={styles.headerCell}>Rank</Text>
                    <Text style={styles.headerCell}>Name</Text>
                    <Text style={styles.headerCell}>IC</Text>
                    <Text style={styles.headerCell}>Job</Text>
                    <Text style={styles.headerCell}>Category</Text>
                    <Text style={styles.headerCell}>Result</Text>
                    <Text style={styles.headerCell}>Q1</Text>
                    <Text style={styles.headerCell}>Q2</Text>
                    <Text style={styles.headerCell}>Q3</Text>
                    <Text style={styles.headerCell}>Q4</Text>
                    <Text style={styles.headerCell}>Q5</Text>
                    <Text style={styles.headerCell}>Q6</Text>
                    <Text style={styles.headerCell}>Q7</Text>
                  </View>
                  
                  {/* Clinical Table Body */}
                  <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={true}>
                    {(() => {
                      const clinicalSubmissions = filteredSubmissions.filter(sub => sub.job_category === 'Clinical');
                      return clinicalSubmissions.map((submission, index) => {
                        const isPass = submission.score >= 25;
                        return (
                          <View key={submission.id} style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                            <Text style={styles.tableCell}></Text> {/* Rank - empty for now */}
                            <Text style={styles.tableCell} numberOfLines={2}>{submission.user_name || 'Unknown'}</Text>
                            <Text style={styles.tableCell}>{submission.ic_number || 'N/A'}</Text>
                            <Text style={styles.tableCell} numberOfLines={2}>{submission.job_position_name || 'N/A'}</Text>
                            <Text style={styles.tableCell}>Clinical</Text>
                            <Text style={styles.tableCell}>{submission.score}/30 ({Math.round((submission.score / 30) * 100)}%)</Text>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Pass' : 'Fail'}</Text>
                              </View>
                            </View>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Pass' : 'Fail'}</Text>
                              </View>
                            </View>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Pass' : 'Fail'}</Text>
                              </View>
                            </View>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Pass' : 'Fail'}</Text>
                              </View>
                            </View>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Pass' : 'Fail'}</Text>
                              </View>
                            </View>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Yes' : 'No'}</Text>
                              </View>
                            </View>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Yes' : 'No'}</Text>
                              </View>
                            </View>
                          </View>
                        );
                      });
                    })()}
                  </ScrollView>
                </View>
              </View>

              {/* Non-Clinical Participants Table */}
              <View style={styles.tableContainer}>
                <Text style={styles.tableTitle}>Non-Clinical Participants</Text>
                <View style={styles.table}>
                  {/* Non-Clinical Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={styles.headerCell}>Rank</Text>
                    <Text style={styles.headerCell}>Name</Text>
                    <Text style={styles.headerCell}>IC</Text>
                    <Text style={styles.headerCell}>Job</Text>
                    <Text style={styles.headerCell}>Category</Text>
                    <Text style={styles.headerCell}>Result</Text>
                    <Text style={styles.headerCell}>Q1</Text>
                    <Text style={styles.headerCell}>Q2</Text>
                    <Text style={styles.headerCell}>Q3</Text>
                    <Text style={styles.headerCell}>Q4</Text>
                    <Text style={styles.headerCell}>Q5</Text>
                    <Text style={styles.headerCell}>Q6</Text>
                    <Text style={styles.headerCell}>Q7</Text>
                    <Text style={styles.headerCell}>Q8</Text>
                  </View>
                  
                  {/* Non-Clinical Table Body */}
                  <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={true}>
                    {(() => {
                      const nonClinicalSubmissions = filteredSubmissions.filter(sub => sub.job_category === 'Non-Clinical');
                      return nonClinicalSubmissions.map((submission, index) => {
                        const isPass = submission.score >= 20;
                        return (
                          <View key={submission.id} style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
                            <Text style={styles.tableCell}></Text> {/* Rank - empty for now */}
                            <Text style={styles.tableCell} numberOfLines={2}>{submission.user_name || 'Unknown'}</Text>
                            <Text style={styles.tableCell}>{submission.ic_number || 'N/A'}</Text>
                            <Text style={styles.tableCell} numberOfLines={2}>{submission.job_position_name || 'N/A'}</Text>
                            <Text style={styles.tableCell}>Non-Clinical</Text>
                            <Text style={styles.tableCell}>{submission.score}/30 ({Math.round((submission.score / 30) * 100)}%)</Text>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Pass' : 'Fail'}</Text>
                              </View>
                            </View>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Pass' : 'Fail'}</Text>
                              </View>
                            </View>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Pass' : 'Fail'}</Text>
                              </View>
                            </View>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Pass' : 'Fail'}</Text>
                              </View>
                            </View>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Pass' : 'Fail'}</Text>
                              </View>
                            </View>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Yes' : 'No'}</Text>
                              </View>
                            </View>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Yes' : 'No'}</Text>
                              </View>
                            </View>
                            <View style={styles.indicatorCell}>
                              <View style={[styles.indicator, { backgroundColor: isPass ? '#22c55e' : '#ef4444' }]}>
                                <Text style={styles.indicatorText}>{isPass ? 'Yes' : 'No'}</Text>
                              </View>
                            </View>
                          </View>
                        );
                      });
                    })()}
                  </ScrollView>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    fontWeight: '500',
  },
  heroContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  heroContent: {
    paddingHorizontal: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  heroTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  heroButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: '#ffffff',
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    flex: 1,
  },
  resultsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 16,
  },
  tableContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 245, 255, 0.2)',
  },
  table: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 245, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 245, 255, 0.2)',
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    paddingHorizontal: 2,
    flex: 1,
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  oddRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tableCell: {
    fontSize: 10,
    color: COLORS.text.primary,
    paddingHorizontal: 2,
    flex: 1,
    textAlign: 'center',
  },
  indicatorCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  indicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 40,
  },
  indicatorText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  emptyStateText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
