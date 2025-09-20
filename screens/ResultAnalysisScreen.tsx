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
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AnalyticsService } from '../services/AnalyticsService';
import { supabase } from '../services/supabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

interface ResultAnalysisScreenProps {
  onBack: () => void;
}

interface AnalysisData {
  preTestStats: {
    totalParticipants: number;
    passed: number;
    failed: number;
    passRate: number;
    averageScore: number;
    averageTime: number;
    scoreDistribution: { range: string; count: number }[];
    categoryPerformance: { category: string; passRate: number; averageScore: number }[];
    difficultyPerformance: { difficulty: string; passRate: number; averageScore: number }[];
  };
  postTestStats: {
    totalParticipants: number;
    passed: number;
    failed: number;
    passRate: number;
    averageScore: number;
    averageTime: number;
    scoreDistribution: { range: string; count: number }[];
    categoryPerformance: { category: string; passRate: number; averageScore: number }[];
    difficultyPerformance: { difficulty: string; passRate: number; averageScore: number }[];
  };
  comparison: {
    improvementRate: number;
    scoreImprovement: number;
    timeImprovement: number;
    passRateImprovement: number;
    categoryImprovements: { category: string; improvement: number }[];
    difficultyImprovements: { difficulty: string; improvement: number }[];
  };
  trends: {
    dailyStats: { date: string; preTestPassRate: number; postTestPassRate: number }[];
    weeklyStats: { week: string; preTestPassRate: number; postTestPassRate: number }[];
    monthlyStats: { month: string; preTestPassRate: number; postTestPassRate: number }[];
  };
}

// Helper function to calculate test statistics
const calculateTestStatistics = (submissions: any[]) => {
  if (!submissions || submissions.length === 0) {
    return {
      totalParticipants: 0,
      passed: 0,
      failed: 0,
      passRate: 0,
      averageScore: 0,
      averageTime: 0,
      scoreDistribution: [],
      categoryPerformance: [],
      difficultyPerformance: [],
    };
  }

  const totalParticipants = submissions.length;
  const passed = submissions.filter(s => {
    const isPass = s.score >= (s.job_category === 'Clinical' ? 25 : 20);
    return isPass;
  }).length;
  const failed = totalParticipants - passed;
  const passRate = totalParticipants > 0 ? (passed / totalParticipants) * 100 : 0;
  
  const averageScore = submissions.reduce((sum, s) => sum + s.score, 0) / totalParticipants;
  const averageTime = submissions.reduce((sum, s) => sum + s.time_taken_seconds, 0) / totalParticipants;

  // Calculate score distribution
  const scoreRanges = [
    { range: '0-10', min: 0, max: 10 },
    { range: '11-15', min: 11, max: 15 },
    { range: '16-20', min: 16, max: 20 },
    { range: '21-25', min: 21, max: 25 },
    { range: '26-30', min: 26, max: 30 },
  ];

  const scoreDistribution = scoreRanges.map(range => ({
    range: range.range,
    count: submissions.filter(s => s.score >= range.min && s.score <= range.max).length
  }));

  return {
    totalParticipants,
    passed,
    failed,
    passRate,
    averageScore,
    averageTime,
    scoreDistribution,
    categoryPerformance: [],
    difficultyPerformance: [],
  };
};

// Helper function to calculate comparison statistics
const calculateComparisonStats = (preTestStats: any, postTestStats: any) => {
  const passRateImprovement = postTestStats.passRate - preTestStats.passRate;
  const scoreImprovement = postTestStats.averageScore - preTestStats.averageScore;
  const timeImprovement = preTestStats.averageTime - postTestStats.averageTime; // Positive means faster
  
  return {
    improvementRate: passRateImprovement,
    scoreImprovement,
    timeImprovement,
    passRateImprovement,
    categoryImprovements: [],
    difficultyImprovements: [],
  };
};

export default function ResultAnalysisScreen({ onBack }: ResultAnalysisScreenProps) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedTest, setSelectedTest] = useState<'pre' | 'post' | 'comparison'>('comparison');
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadAnalysisData();
    startAnimations();
  }, []);

  const startAnimations = () => {
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
    ]).start();
  };

  const loadAnalysisData = async () => {
    try {
      setIsLoading(true);
      
      // Load real data from Supabase using AnalyticsService
      const problematicQuestionsData = await AnalyticsService.getProblematicQuestionsAnalysis();
      
      // Get real submission data for statistics
      const { data: submissions, error: submissionsError } = await supabase
        .from('test_submissions')
        .select('*')
        .eq('is_completed', true)
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching submissions for statistics:', submissionsError);
        throw new Error('Failed to fetch submission data');
      }

      // Calculate real statistics
      const preTestSubmissions = submissions?.filter(s => s.test_type === 'pre_test') || [];
      const postTestSubmissions = submissions?.filter(s => s.test_type === 'post_test') || [];
      
      console.log(`📊 Found ${submissions?.length || 0} total submissions`);
      console.log(`📊 Pre-test: ${preTestSubmissions.length} submissions`);
      console.log(`📊 Post-test: ${postTestSubmissions.length} submissions`);
      
      // Calculate pre-test statistics
      const preTestStats = calculateTestStatistics(preTestSubmissions);
      
      // Calculate post-test statistics  
      const postTestStats = calculateTestStatistics(postTestSubmissions);
      
      // Calculate comparison statistics
      const comparison = calculateComparisonStats(preTestStats, postTestStats);
      
      console.log('📈 Pre-test stats:', preTestStats);
      console.log('📈 Post-test stats:', postTestStats);
      console.log('📈 Comparison stats:', comparison);

      // Create analysis data structure with real Supabase data
      const analysisData: AnalysisData = {
        preTestStats: {
          ...preTestStats,
          problematicQuestions: problematicQuestionsData.preTest || [],
        },
        postTestStats: {
          ...postTestStats,
          problematicQuestions: problematicQuestionsData.postTest || [],
        },
        comparison: {
          ...comparison,
          problematicQuestions: [...(problematicQuestionsData.preTest || []), ...(problematicQuestionsData.postTest || [])],
        },
        trends: {
          dailyStats: [],
          weeklyStats: [],
          monthlyStats: [],
        },
      };
      
      setAnalysisData(analysisData);
    } catch (error) {
      console.error('Error loading analysis data:', error);
      Alert.alert('Error', 'Failed to load analysis data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDailyStats = () => {
    const stats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      stats.push({
        date: date.toISOString().split('T')[0],
        preTestPassRate: 60 + Math.random() * 20,
        postTestPassRate: 85 + Math.random() * 10,
      });
    }
    return stats;
  };

  const generateWeeklyStats = () => {
    const stats = [];
    for (let i = 3; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      stats.push({
        week: `Week ${4 - i}`,
        preTestPassRate: 60 + Math.random() * 20,
        postTestPassRate: 85 + Math.random() * 10,
      });
    }
    return stats;
  };

  const generateMonthlyStats = () => {
    const stats = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      stats.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        preTestPassRate: 60 + Math.random() * 20,
        postTestPassRate: 85 + Math.random() * 10,
      });
    }
    return stats;
  };

  const getPassRateColor = (passRate: number) => {
    if (passRate >= 80) return '#22c55e';
    if (passRate >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return '#22c55e';
    if (improvement < 0) return '#ef4444';
    return '#6b7280';
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return 'trending-up';
    if (improvement < 0) return 'trending-down';
    return 'remove';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCurrentTrendData = () => {
    if (!analysisData) return [];
    
    switch (selectedTimeframe) {
      case 'daily':
        return analysisData.trends.dailyStats;
      case 'weekly':
        return analysisData.trends.weeklyStats;
      case 'monthly':
        return analysisData.trends.monthlyStats;
      default:
        return analysisData.trends.dailyStats;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading analysis data...</Text>
      </View>
    );
  }

  if (!analysisData) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Analysis Data Not Available</Text>
        <Text style={styles.errorText}>Unable to load analysis data at this time.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadAnalysisData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentTrendData = getCurrentTrendData();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      {/* Header */}
      <LinearGradient
        colors={['#1e40af', '#3b82f6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Result Analysis</Text>
            <Text style={styles.headerSubtitle}>Pre-Test vs Post-Test Performance</Text>
          </View>
          
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowDetailedAnalysis(true);
            }}
          >
            <Ionicons name="stats-chart" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Test Selection */}
        <Animated.View style={[
          styles.sectionContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.sectionTitle}>📊 Analysis View</Text>
          
          <View style={styles.testSelector}>
            <TouchableOpacity
              style={[
                styles.testButton,
                selectedTest === 'pre' && styles.testButtonActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedTest('pre');
              }}
            >
              <Ionicons 
                name="play-circle" 
                size={20} 
                color={selectedTest === 'pre' ? '#ffffff' : '#3b82f6'} 
              />
              <Text style={[
                styles.testButtonText,
                selectedTest === 'pre' && styles.testButtonTextActive
              ]}>
                Pre-Test Only
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.testButton,
                selectedTest === 'post' && styles.testButtonActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedTest('post');
              }}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={selectedTest === 'post' ? '#ffffff' : '#22c55e'} 
              />
              <Text style={[
                styles.testButtonText,
                selectedTest === 'post' && styles.testButtonTextActive
              ]}>
                Post-Test Only
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.testButton,
                selectedTest === 'comparison' && styles.testButtonActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedTest('comparison');
              }}
            >
              <Ionicons 
                name="git-compare" 
                size={20} 
                color={selectedTest === 'comparison' ? '#ffffff' : '#8b5cf6'} 
              />
              <Text style={[
                styles.testButtonText,
                selectedTest === 'comparison' && styles.testButtonTextActive
              ]}>
                Comparison
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Overall Statistics */}
        <Animated.View style={[
          styles.sectionContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.sectionTitle}>📈 Overall Statistics</Text>
          
          {selectedTest === 'comparison' && (
            <View style={styles.comparisonContainer}>
              <View style={styles.comparisonCard}>
                <Text style={styles.comparisonTitle}>Pre-Test</Text>
                <View style={styles.comparisonStats}>
                  <View style={styles.comparisonStat}>
                    <Text style={styles.comparisonStatValue}>{analysisData.preTestStats.passRate.toFixed(1)}%</Text>
                    <Text style={styles.comparisonStatLabel}>Pass Rate</Text>
                  </View>
                  <View style={styles.comparisonStat}>
                    <Text style={styles.comparisonStatValue}>{analysisData.preTestStats.averageScore.toFixed(1)}</Text>
                    <Text style={styles.comparisonStatLabel}>Avg Score</Text>
                  </View>
                  <View style={styles.comparisonStat}>
                    <Text style={styles.comparisonStatValue}>{formatTime(analysisData.preTestStats.averageTime)}</Text>
                    <Text style={styles.comparisonStatLabel}>Avg Time</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.comparisonCard}>
                <Text style={styles.comparisonTitle}>Post-Test</Text>
                <View style={styles.comparisonStats}>
                  <View style={styles.comparisonStat}>
                    <Text style={styles.comparisonStatValue}>{analysisData.postTestStats.passRate.toFixed(1)}%</Text>
                    <Text style={styles.comparisonStatLabel}>Pass Rate</Text>
                  </View>
                  <View style={styles.comparisonStat}>
                    <Text style={styles.comparisonStatValue}>{analysisData.postTestStats.averageScore.toFixed(1)}</Text>
                    <Text style={styles.comparisonStatLabel}>Avg Score</Text>
                  </View>
                  <View style={styles.comparisonStat}>
                    <Text style={styles.comparisonStatValue}>{formatTime(analysisData.postTestStats.averageTime)}</Text>
                    <Text style={styles.comparisonStatLabel}>Avg Time</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {(selectedTest === 'pre' || selectedTest === 'post') && (
            <View style={styles.singleTestContainer}>
              {(() => {
                const stats = selectedTest === 'pre' ? analysisData.preTestStats : analysisData.postTestStats;
                const testName = selectedTest === 'pre' ? 'Pre-Test' : 'Post-Test';
                const testColor = selectedTest === 'pre' ? '#3b82f6' : '#22c55e';
                
                return (
                  <View style={[styles.singleTestCard, { borderLeftColor: testColor }]}>
                    <Text style={styles.singleTestTitle}>{testName} Statistics</Text>
                    <View style={styles.singleTestGrid}>
                      <View style={styles.singleTestStat}>
                        <Text style={styles.singleTestStatValue}>{stats.totalParticipants}</Text>
                        <Text style={styles.singleTestStatLabel}>Total Participants</Text>
                      </View>
                      <View style={styles.singleTestStat}>
                        <Text style={[styles.singleTestStatValue, { color: getPassRateColor(stats.passRate) }]}>
                          {stats.passRate.toFixed(1)}%
                        </Text>
                        <Text style={styles.singleTestStatLabel}>Pass Rate</Text>
                      </View>
                      <View style={styles.singleTestStat}>
                        <Text style={styles.singleTestStatValue}>{stats.averageScore.toFixed(1)}</Text>
                        <Text style={styles.singleTestStatLabel}>Average Score</Text>
                      </View>
                      <View style={styles.singleTestStat}>
                        <Text style={styles.singleTestStatValue}>{formatTime(stats.averageTime)}</Text>
                        <Text style={styles.singleTestStatLabel}>Average Time</Text>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}
        </Animated.View>

        {/* Improvement Analysis */}
        {selectedTest === 'comparison' && (
          <Animated.View style={[
            styles.sectionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <Text style={styles.sectionTitle}>📊 Improvement Analysis</Text>
            
            <View style={styles.improvementGrid}>
              <View style={styles.improvementCard}>
                <View style={styles.improvementHeader}>
                  <Ionicons 
                    name={getImprovementIcon(analysisData.comparison.passRateImprovement)} 
                    size={24} 
                    color={getImprovementColor(analysisData.comparison.passRateImprovement)} 
                  />
                  <Text style={styles.improvementTitle}>Pass Rate</Text>
                </View>
                <Text style={[
                  styles.improvementValue,
                  { color: getImprovementColor(analysisData.comparison.passRateImprovement) }
                ]}>
                  +{analysisData.comparison.passRateImprovement.toFixed(1)}%
                </Text>
              </View>
              
              <View style={styles.improvementCard}>
                <View style={styles.improvementHeader}>
                  <Ionicons 
                    name={getImprovementIcon(analysisData.comparison.scoreImprovement)} 
                    size={24} 
                    color={getImprovementColor(analysisData.comparison.scoreImprovement)} 
                  />
                  <Text style={styles.improvementTitle}>Average Score</Text>
                </View>
                <Text style={[
                  styles.improvementValue,
                  { color: getImprovementColor(analysisData.comparison.scoreImprovement) }
                ]}>
                  +{analysisData.comparison.scoreImprovement.toFixed(1)}
                </Text>
              </View>
              
              <View style={styles.improvementCard}>
                <View style={styles.improvementHeader}>
                  <Ionicons 
                    name={getImprovementIcon(analysisData.comparison.timeImprovement)} 
                    size={24} 
                    color={getImprovementColor(analysisData.comparison.timeImprovement)} 
                  />
                  <Text style={styles.improvementTitle}>Time Efficiency</Text>
                </View>
                <Text style={[
                  styles.improvementValue,
                  { color: getImprovementColor(analysisData.comparison.timeImprovement) }
                ]}>
                  {analysisData.comparison.timeImprovement > 0 ? '+' : ''}{Math.abs(analysisData.comparison.timeImprovement)}s
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Problematic Questions Analysis */}
        <Animated.View style={[
          styles.sectionContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.sectionTitle}>❌ Questions Participants Struggle With</Text>
          
          <View style={styles.problematicQuestionsContainer}>
            {(() => {
              const questions = selectedTest === 'comparison' 
                ? analysisData.comparison.problematicQuestions
                : (selectedTest === 'pre' ? analysisData.preTestStats.problematicQuestions : analysisData.postTestStats.problematicQuestions);
              
              if (!questions || questions.length === 0) {
                return (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No problematic questions data available</Text>
                  </View>
                );
              }
              
              return questions.slice(0, 5).map((question, index) => (
                <View key={question.questionId || index} style={styles.problematicQuestionCard}>
                  <View style={styles.questionHeader}>
                    <View style={styles.questionRank}>
                      <Text style={styles.questionRankText}>#{index + 1}</Text>
                    </View>
                    <View style={styles.questionStats}>
                      <Text style={styles.questionStatText}>
                        {question.correctnessPercentage || 0}% Correct
                      </Text>
                      <Text style={styles.questionStatText}>
                        {question.wrongAttempts || 0} Wrong
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.questionContent}>
                    <Text style={styles.questionText}>
                      {question.questionText || question.question}
                    </Text>
                    
                        <View style={styles.answerChoices}>
                          {question.options && question.options.map((option, choiceIndex) => {
                            const choiceLetter = String.fromCharCode(65 + choiceIndex);
                            const isCorrect = choiceLetter === question.correctAnswer;
                            
                            // Get the percentage for this choice
                            const choiceData = question.answerChoices && question.answerChoices[choiceLetter];
                            const percentage = choiceData ? choiceData.percentage : 0;
                            const count = choiceData ? choiceData.count : 0;
                            
                            // Determine if this is the most chosen answer
                            const allChoices = question.answerChoices ? Object.values(question.answerChoices) : [];
                            const maxPercentage = Math.max(...allChoices.map(c => c.percentage || 0));
                            const isMostChosen = percentage === maxPercentage && percentage > 0;
                            
                            return (
                              <View key={choiceIndex} style={styles.answerChoice}>
                                <View style={[
                                  styles.answerChoiceLabel,
                                  {
                                    backgroundColor: isCorrect ? '#22c55e' : 
                                                    isMostChosen ? '#f97316' : 
                                                    'rgba(255, 255, 255, 0.1)'
                                  }
                                ]}>
                                  <Text style={[
                                    styles.answerChoiceLabelText,
                                    {
                                      color: isCorrect || isMostChosen ? '#ffffff' : '#ffffff'
                                    }
                                  ]}>
                                    {choiceLetter}
                                  </Text>
                                </View>
                                <Text style={styles.answerChoiceText}>
                                  {option}
                                </Text>
                                <View style={styles.answerChoiceStats}>
                                  <Text style={styles.answerChoiceCount}>
                                    {count} ({percentage}%)
                                  </Text>
                                  {isCorrect && (
                                    <Text style={styles.correctAnswerLabel}>✓ Correct</Text>
                                  )}
                                  {isMostChosen && !isCorrect && (
                                    <Text style={styles.mostChosenLabel}>Most Chosen</Text>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                  </View>
                </View>
              ));
            })()}
          </View>
        </Animated.View>

        {/* Additional Problematic Questions */}
        <Animated.View style={[
          styles.sectionContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.sectionTitle}>📊 More Challenging Questions</Text>
          
          <View style={styles.additionalQuestionsContainer}>
            {(() => {
              const questions = selectedTest === 'comparison' 
                ? analysisData.comparison.problematicQuestions
                : (selectedTest === 'pre' ? analysisData.preTestStats.problematicQuestions : analysisData.postTestStats.problematicQuestions);
              
              if (!questions || questions.length <= 5) {
                return (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No additional challenging questions available</Text>
                  </View>
                );
              }
              
              return questions.slice(5, 10).map((question, index) => (
                <View key={question.questionId || (index + 5)} style={styles.problematicQuestionCard}>
                  <View style={styles.questionHeader}>
                    <View style={styles.questionRank}>
                      <Text style={styles.questionRankText}>#{index + 6}</Text>
                    </View>
                    <View style={styles.questionStats}>
                      <Text style={styles.questionStatText}>
                        {question.correctnessPercentage || 0}% Correct
                      </Text>
                      <Text style={styles.questionStatText}>
                        {question.wrongAttempts || 0} Wrong
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.questionContent}>
                    <Text style={styles.questionText}>
                      {question.questionText || question.question}
                    </Text>
                    
                        <View style={styles.answerChoices}>
                          {question.options && question.options.map((option, choiceIndex) => {
                            const choiceLetter = String.fromCharCode(65 + choiceIndex);
                            const isCorrect = choiceLetter === question.correctAnswer;
                            
                            // Get the percentage for this choice
                            const choiceData = question.answerChoices && question.answerChoices[choiceLetter];
                            const percentage = choiceData ? choiceData.percentage : 0;
                            const count = choiceData ? choiceData.count : 0;
                            
                            // Determine if this is the most chosen answer
                            const allChoices = question.answerChoices ? Object.values(question.answerChoices) : [];
                            const maxPercentage = Math.max(...allChoices.map(c => c.percentage || 0));
                            const isMostChosen = percentage === maxPercentage && percentage > 0;
                            
                            return (
                              <View key={choiceIndex} style={styles.answerChoice}>
                                <View style={[
                                  styles.answerChoiceLabel,
                                  {
                                    backgroundColor: isCorrect ? '#22c55e' : 
                                                    isMostChosen ? '#f97316' : 
                                                    'rgba(255, 255, 255, 0.1)'
                                  }
                                ]}>
                                  <Text style={[
                                    styles.answerChoiceLabelText,
                                    {
                                      color: isCorrect || isMostChosen ? '#ffffff' : '#ffffff'
                                    }
                                  ]}>
                                    {choiceLetter}
                                  </Text>
                                </View>
                                <Text style={styles.answerChoiceText}>
                                  {option}
                                </Text>
                                <View style={styles.answerChoiceStats}>
                                  <Text style={styles.answerChoiceCount}>
                                    {count} ({percentage}%)
                                  </Text>
                                  {isCorrect && (
                                    <Text style={styles.correctAnswerLabel}>✓ Correct</Text>
                                  )}
                                  {isMostChosen && !isCorrect && (
                                    <Text style={styles.mostChosenLabel}>Most Chosen</Text>
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                  </View>
                </View>
              ));
            })()}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Detailed Analysis Modal */}
      <Modal
        visible={showDetailedAnalysis}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailedAnalysis(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailedAnalysisModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detailed Analysis</Text>
              <TouchableOpacity
                onPress={() => setShowDetailedAnalysis(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* Overall Performance Summary */}
              <View style={styles.detailedSection}>
                <Text style={styles.detailedSectionTitle}>📊 Performance Summary</Text>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardTitle}>Pre-Test</Text>
                    <Text style={styles.summaryCardValue}>{analysisData.preTestStats.passRate.toFixed(1)}%</Text>
                    <Text style={styles.summaryCardLabel}>Pass Rate</Text>
                    <Text style={styles.summaryCardValue}>{analysisData.preTestStats.averageScore.toFixed(1)}</Text>
                    <Text style={styles.summaryCardLabel}>Avg Score</Text>
                  </View>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardTitle}>Post-Test</Text>
                    <Text style={styles.summaryCardValue}>{analysisData.postTestStats.passRate.toFixed(1)}%</Text>
                    <Text style={styles.summaryCardLabel}>Pass Rate</Text>
                    <Text style={styles.summaryCardValue}>{analysisData.postTestStats.averageScore.toFixed(1)}</Text>
                    <Text style={styles.summaryCardLabel}>Avg Score</Text>
                  </View>
                </View>
              </View>

              {/* Score Distribution Chart */}
              <View style={styles.detailedSection}>
                <Text style={styles.detailedSectionTitle}>📈 Score Distribution</Text>
                <View style={styles.chartContainer}>
                  {analysisData.preTestStats.scoreDistribution.map((range, index) => (
                    <View key={index} style={styles.chartBar}>
                      <Text style={styles.chartBarLabel}>{range.range}</Text>
                      <View style={styles.chartBarContainer}>
                        <View 
                          style={[
                            styles.chartBarFill,
                            { 
                              width: `${Math.max((range.count / Math.max(...analysisData.preTestStats.scoreDistribution.map(r => r.count))) * 100, 5)}%`,
                              backgroundColor: '#3b82f6'
                            }
                          ]}
                        />
                        <Text style={styles.chartBarValue}>{range.count}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Top Problematic Questions */}
              <View style={styles.detailedSection}>
                <Text style={styles.detailedSectionTitle}>❌ Most Problematic Questions</Text>
                {analysisData.comparison.problematicQuestions.slice(0, 3).map((question, index) => (
                  <View key={question.questionId || index} style={styles.detailedQuestionCard}>
                    <View style={styles.detailedQuestionHeader}>
                      <Text style={styles.detailedQuestionNumber}>#{index + 1}</Text>
                      <Text style={styles.detailedQuestionStats}>
                        {question.correctnessPercentage}% Correct • {question.wrongAttempts} Wrong
                      </Text>
                    </View>
                    <Text style={styles.detailedQuestionText} numberOfLines={2}>
                      {question.questionText}
                    </Text>
                    <View style={styles.detailedAnswerChoices}>
                      {question.options && question.options.slice(0, 2).map((option, choiceIndex) => {
                        const choiceLetter = String.fromCharCode(65 + choiceIndex);
                        const choiceData = question.answerChoices && question.answerChoices[choiceLetter];
                        const percentage = choiceData ? choiceData.percentage : 0;
                        const isCorrect = choiceLetter === question.correctAnswer;
                        
                        return (
                          <View key={choiceIndex} style={styles.detailedAnswerChoice}>
                            <Text style={styles.detailedAnswerLetter}>{choiceLetter}</Text>
                            <Text style={styles.detailedAnswerText} numberOfLines={1}>
                              {option.replace(/^[A-D]\.\s*/, '')}
                            </Text>
                            <Text style={styles.detailedAnswerPercentage}>
                              {percentage}%
                            </Text>
                            {isCorrect && <Text style={styles.detailedCorrectMark}>✓</Text>}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>

              {/* Improvement Insights */}
              <View style={styles.detailedSection}>
                <Text style={styles.detailedSectionTitle}>💡 Improvement Insights</Text>
                <View style={styles.insightsContainer}>
                  <View style={styles.insightCard}>
                    <Text style={styles.insightTitle}>Pass Rate Improvement</Text>
                    <Text style={[
                      styles.insightValue,
                      { color: analysisData.comparison.passRateImprovement >= 0 ? '#22c55e' : '#ef4444' }
                    ]}>
                      {analysisData.comparison.passRateImprovement >= 0 ? '+' : ''}{analysisData.comparison.passRateImprovement.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.insightCard}>
                    <Text style={styles.insightTitle}>Score Improvement</Text>
                    <Text style={[
                      styles.insightValue,
                      { color: analysisData.comparison.scoreImprovement >= 0 ? '#22c55e' : '#ef4444' }
                    ]}>
                      {analysisData.comparison.scoreImprovement >= 0 ? '+' : ''}{analysisData.comparison.scoreImprovement.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.insightCard}>
                    <Text style={styles.insightTitle}>Time Efficiency</Text>
                    <Text style={[
                      styles.insightValue,
                      { color: analysisData.comparison.timeImprovement >= 0 ? '#22c55e' : '#ef4444' }
                    ]}>
                      {analysisData.comparison.timeImprovement >= 0 ? '+' : ''}{Math.abs(analysisData.comparison.timeImprovement)}s
                    </Text>
                  </View>
                </View>
              </View>

              {/* Data Source Note */}
              <View style={styles.dataSourceNote}>
                <Text style={styles.dataSourceNoteText}>
                  📊 Data sourced from {analysisData.preTestStats.totalParticipants + analysisData.postTestStats.totalParticipants} completed test submissions
                </Text>
              </View>
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
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 24,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  header: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  detailsButton: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 24,
  },
  testSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 24,
  },
  testButtonActive: {
    backgroundColor: '#3b82f6',
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  testButtonTextActive: {
    color: '#ffffff',
  },
  comparisonContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  comparisonCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  comparisonStats: {
    gap: 24,
  },
  comparisonStat: {
    alignItems: 'center',
  },
  comparisonStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  comparisonStatLabel: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  singleTestContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  singleTestCard: {
    padding: 24,
    borderLeftWidth: 4,
  },
  singleTestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 24,
  },
  singleTestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  singleTestStat: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 24,
  },
  singleTestStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  singleTestStatLabel: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  improvementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  improvementCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  improvementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 24,
  },
  improvementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  improvementValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoryContainer: {
    gap: 24,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  improvementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  improvementBadgeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryPassRate: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryStat: {
    fontSize: 16,
    color: '#6b7280',
  },
  trendsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    padding: 4,
    marginBottom: 24,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeframeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  timeframeButtonTextActive: {
    color: '#1f2937',
  },
  trendsChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 24,
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 24,
  },
  trendLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 24,
    height: '100%',
  },
  trendBar: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 24,
    minHeight: 4,
  },
  trendBarLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailedAnalysisModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 24,
  },
  modalContent: {
    padding: 24,
  },
  detailedAnalysisText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Detailed Analysis Styles
  detailedAnalysisScrollView: {
    flex: 1,
  },
  detailedSection: {
    marginBottom: 24,
  },
  detailedSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 24,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 24,
  },
  summaryCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 24,
  },
  summaryCardLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  chartContainer: {
    gap: 24,
  },
  chartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  chartBarLabel: {
    fontSize: 16,
    color: '#6b7280',
    width: 24,
  },
  chartBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  chartBarFill: {
    height: 24,
    borderRadius: 24,
    minWidth: 4,
  },
  chartBarValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 24,
  },
  detailedQuestionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  detailedQuestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  detailedQuestionNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  detailedQuestionStats: {
    fontSize: 16,
    color: '#6b7280',
  },
  detailedQuestionText: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 24,
    lineHeight: 24,
  },
  detailedAnswerChoices: {
    gap: 24,
  },
  detailedAnswerChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  detailedAnswerLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b7280',
    width: 24,
  },
  detailedAnswerText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  detailedAnswerPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 24,
    textAlign: 'right',
  },
  detailedCorrectMark: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '700',
  },
  insightsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  dataSourceNote: {
    backgroundColor: '#fef3c7',
    borderRadius: 24,
    padding: 24,
    marginTop: 24,
  },
  dataSourceNoteText: {
    fontSize: 16,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Problematic Questions Styles
  problematicQuestionsContainer: {
    gap: 24,
  },
  additionalQuestionsContainer: {
    gap: 24,
  },
  problematicQuestionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  questionRank: {
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  questionRankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  questionStats: {
    flexDirection: 'row',
    gap: 24,
  },
  questionStatText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  questionContent: {
    gap: 24,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    lineHeight: 24,
  },
  answerChoices: {
    gap: 24,
  },
  answerChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  answerChoiceLabel: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  answerChoiceLabelText: {
    fontSize: 16,
    fontWeight: '700',
  },
  answerChoiceText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  answerChoiceStats: {
    alignItems: 'flex-end',
  },
  answerChoiceCount: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  correctAnswerLabel: {
    fontSize: 16,
    color: '#22c55e',
    fontWeight: '600',
    marginTop: 2,
  },
  mostChosenLabel: {
    fontSize: 16,
    color: '#f97316',
    fontWeight: '600',
    marginTop: 2,
  },
  noDataContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
