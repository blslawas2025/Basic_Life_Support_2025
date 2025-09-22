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

interface ResultViewScreenProps {
  onBack: () => void;
  resultId?: string;
}

interface QuestionResult {
  id: string;
  questionText: string;
  questionTextEn?: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  difficultyLevel: 'easy' | 'medium' | 'hard';
  category: string;
  points: number;
  correctAnswer: string;
  participantAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  explanation?: string;
}

interface ParticipantResult {
  id: string;
  participantName: string;
  participantEmail: string;
  testType: 'pre_test' | 'post_test';
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  submittedAt: string;
  questions: QuestionResult[];
  overallPerformance: {
    accuracy: number;
    averageTimePerQuestion: number;
    categoryBreakdown: { [category: string]: { correct: number; total: number } };
    difficultyBreakdown: { [difficulty: string]: { correct: number; total: number } };
  };
}

export default function ResultViewScreen({ onBack, resultId }: ResultViewScreenProps) {
  const [participantResult, setParticipantResult] = useState<ParticipantResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionResult | null>(null);
  const [showQuestionDetail, setShowQuestionDetail] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'question' | 'correctness' | 'time' | 'category'>('question');
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadParticipantResult();
    startAnimations();
  }, [resultId]);

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

  const loadParticipantResult = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - in real implementation, fetch from API
      const mockResult: ParticipantResult = {
        id: resultId || 'mock_result_1',
        participantName: 'John Doe',
        participantEmail: 'john.doe@example.com',
        testType: 'pre_test',
        score: 22,
        totalQuestions: 30,
        correctAnswers: 22,
        timeTaken: 1200,
        submittedAt: '2024-01-15T10:30:00Z',
        questions: generateMockQuestions(),
        overallPerformance: {
          accuracy: 73.3,
          averageTimePerQuestion: 40,
          categoryBreakdown: {}, // This should be calculated dynamically from actual data
          difficultyBreakdown: {}, // This should be calculated dynamically from actual data
        },
      };
      
      setParticipantResult(mockResult);
    } catch (error) {
      console.error('Error loading participant result:', error);
      Alert.alert('Error', 'Failed to load participant result');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockQuestions = (): QuestionResult[] => {
    const questions: QuestionResult[] = [];
    // Get categories and difficulties dynamically from actual data
    const categories = ['basic_life_support', 'first_aid', 'emergency_response', 'medical_knowledge']; // This should come from database
    const difficulties = ['easy', 'medium', 'hard']; // This should come from database
    
    for (let i = 1; i <= 30; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      const correctAnswer = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
      const participantAnswer = Math.random() > 0.3 ? correctAnswer : ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
      
      questions.push({
        id: `q_${i}`,
        questionText: `Question ${i}: What is the correct procedure for ${category.replace('_', ' ')}?`,
        questionTextEn: `Question ${i}: What is the correct procedure for ${category.replace('_', ' ')}?`,
        questionType: 'multiple_choice',
        difficultyLevel: difficulty as 'easy' | 'medium' | 'hard',
        category,
        points: 1,
        correctAnswer,
        participantAnswer,
        isCorrect: participantAnswer === correctAnswer,
        timeSpent: Math.floor(Math.random() * 60) + 20,
        options: {
          A: `Option A for question ${i}`,
          B: `Option B for question ${i}`,
          C: `Option C for question ${i}`,
          D: `Option D for question ${i}`,
        },
        explanation: `This is the explanation for question ${i}. The correct answer is ${correctAnswer} because...`,
      });
    }
    
    return questions;
  };

  const getFilteredQuestions = () => {
    if (!participantResult) return [];
    
    let filtered = participantResult.questions;
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(q => q.category === filterCategory);
    }
    
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficultyLevel === filterDifficulty);
    }
    
    // Sort questions
    switch (sortBy) {
      case 'correctness':
        filtered = filtered.sort((a, b) => Number(b.isCorrect) - Number(a.isCorrect));
        break;
      case 'time':
        filtered = filtered.sort((a, b) => b.timeSpent - a.timeSpent);
        break;
      case 'category':
        filtered = filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
      default:
        filtered = filtered.sort((a, b) => parseInt(a.id.split('_')[1]) - parseInt(b.id.split('_')[1]));
    }
    
    return filtered;
  };

  const getAnswerColor = (isCorrect: boolean) => {
    return isCorrect ? '#22c55e' : '#ef4444';
  };

  const getAnswerIcon = (isCorrect: boolean) => {
    return isCorrect ? 'checkmark-circle' : 'close-circle';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleQuestionPress = (question: QuestionResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedQuestion(question);
    setShowQuestionDetail(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading participant result...</Text>
      </View>
    );
  }

  if (!participantResult) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Result Not Found</Text>
        <Text style={styles.errorText}>The requested participant result could not be found.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onBack}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredQuestions = getFilteredQuestions();
  const categories = [...new Set(participantResult.questions.map(q => q.category))];
  const difficulties = [...new Set(participantResult.questions.map(q => q.difficultyLevel))];

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
            <Text style={styles.headerTitle}>Result View</Text>
            <Text style={styles.headerSubtitle}>{participantResult.participantName}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.analysisButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowAnalysis(true);
            }}
          >
            <Ionicons name="analytics" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Result Summary */}
        <Animated.View style={[
          styles.summaryContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.sectionTitle}>📊 Result Summary</Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{participantResult.correctAnswers}/{participantResult.totalQuestions}</Text>
              <Text style={styles.summaryLabel}>Score</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{participantResult.overallPerformance.accuracy.toFixed(1)}%</Text>
              <Text style={styles.summaryLabel}>Accuracy</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{formatTime(participantResult.timeTaken)}</Text>
              <Text style={styles.summaryLabel}>Time Taken</Text>
            </View>
            
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{participantResult.overallPerformance.averageTimePerQuestion}s</Text>
              <Text style={styles.summaryLabel}>Avg/Question</Text>
            </View>
          </View>
        </Animated.View>

        {/* Filters and Sorting */}
        <Animated.View style={[
          styles.filtersContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.sectionTitle}>🔍 Filters & Sorting</Text>
          
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterButtons}>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      filterCategory === 'all' && styles.filterButtonActive
                    ]}
                    onPress={() => setFilterCategory('all')}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      filterCategory === 'all' && styles.filterButtonTextActive
                    ]}>All</Text>
                  </TouchableOpacity>
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterButton,
                        filterCategory === category && styles.filterButtonActive
                      ]}
                      onPress={() => setFilterCategory(category)}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        filterCategory === category && styles.filterButtonTextActive
                      ]}>
                        {category.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
          
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Difficulty</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterDifficulty === 'all' && styles.filterButtonActive
                  ]}
                  onPress={() => setFilterDifficulty('all')}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterDifficulty === 'all' && styles.filterButtonTextActive
                  ]}>All</Text>
                </TouchableOpacity>
                {difficulties.map(difficulty => (
                  <TouchableOpacity
                    key={difficulty}
                    style={[
                      styles.filterButton,
                      filterDifficulty === difficulty && styles.filterButtonActive
                    ]}
                    onPress={() => setFilterDifficulty(difficulty)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      filterDifficulty === difficulty && styles.filterButtonTextActive
                    ]}>
                      {difficulty.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          
          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.filterButtons}>
                {[
                  { key: 'question', label: 'Question #' },
                  { key: 'correctness', label: 'Correctness' },
                  { key: 'time', label: 'Time' },
                  { key: 'category', label: 'Category' },
                ].map(sort => (
                  <TouchableOpacity
                    key={sort.key}
                    style={[
                      styles.filterButton,
                      sortBy === sort.key && styles.filterButtonActive
                    ]}
                    onPress={() => setSortBy(sort.key as any)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      sortBy === sort.key && styles.filterButtonTextActive
                    ]}>
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Questions List */}
        <Animated.View style={[
          styles.questionsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.sectionTitle}>
            📝 Questions ({filteredQuestions.length})
          </Text>
          
          <FlatList
            data={filteredQuestions}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.questionCard}
                onPress={() => handleQuestionPress(item)}
              >
                <View style={styles.questionHeader}>
                  <View style={styles.questionNumber}>
                    <Text style={styles.questionNumberText}>{index + 1}</Text>
                  </View>
                  
                  <View style={styles.questionInfo}>
                    <Text style={styles.questionText} numberOfLines={2}>
                      {item.questionText}
                    </Text>
                    
                    <View style={styles.questionMeta}>
                      <View style={[
                        styles.categoryBadge,
                        { backgroundColor: getDifficultyColor(item.difficultyLevel) + '20' }
                      ]}>
                        <Text style={[
                          styles.categoryBadgeText,
                          { color: getDifficultyColor(item.difficultyLevel) }
                        ]}>
                          {item.difficultyLevel.toUpperCase()}
                        </Text>
                      </View>
                      
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>
                          {item.category.replace('_', ' ').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.questionActions}>
                    <View style={[
                      styles.answerIndicator,
                      { backgroundColor: getAnswerColor(item.isCorrect) + '20' }
                    ]}>
                      <Ionicons
                        name={getAnswerIcon(item.isCorrect)}
                        size={20}
                        color={getAnswerColor(item.isCorrect)}
                      />
                    </View>
                    
                    <Text style={styles.timeText}>
                      {item.timeSpent}s
                    </Text>
                  </View>
                </View>
                
                <View style={styles.answerRow}>
                  <View style={styles.answerItem}>
                    <Text style={styles.answerLabel}>Correct:</Text>
                    <Text style={[styles.answerValue, { color: '#22c55e' }]}>
                      {item.correctAnswer}
                    </Text>
                  </View>
                  
                  <View style={styles.answerItem}>
                    <Text style={styles.answerLabel}>Answered:</Text>
                    <Text style={[
                      styles.answerValue,
                      { color: getAnswerColor(item.isCorrect) }
                    ]}>
                      {item.participantAnswer}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      </ScrollView>

      {/* Question Detail Modal */}
      <Modal
        visible={showQuestionDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuestionDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.questionDetailModal}>
            {selectedQuestion && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Question Detail</Text>
                  <TouchableOpacity
                    onPress={() => setShowQuestionDetail(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalContent}>
                  <Text style={styles.questionDetailText}>
                    {selectedQuestion.questionText}
                  </Text>
                  
                  <View style={styles.optionsContainer}>
                    {Object.entries(selectedQuestion.options).map(([key, value]) => (
                      <View
                        key={key}
                        style={[
                          styles.optionItem,
                          selectedQuestion.correctAnswer === key && styles.correctOption,
                          selectedQuestion.participantAnswer === key && selectedQuestion.participantAnswer !== selectedQuestion.correctAnswer && styles.incorrectOption,
                        ]}
                      >
                        <Text style={[
                          styles.optionKey,
                          selectedQuestion.correctAnswer === key && styles.correctOptionText,
                          selectedQuestion.participantAnswer === key && selectedQuestion.participantAnswer !== selectedQuestion.correctAnswer && styles.incorrectOptionText,
                        ]}>
                          {key}
                        </Text>
                        <Text style={[
                          styles.optionText,
                          selectedQuestion.correctAnswer === key && styles.correctOptionText,
                          selectedQuestion.participantAnswer === key && selectedQuestion.participantAnswer !== selectedQuestion.correctAnswer && styles.incorrectOptionText,
                        ]}>
                          {value}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.answerSummary}>
                    <Text style={styles.answerSummaryTitle}>Answer Summary</Text>
                    <View style={styles.answerSummaryRow}>
                      <Text style={styles.answerSummaryLabel}>Correct Answer:</Text>
                      <Text style={[styles.answerSummaryValue, { color: '#22c55e' }]}>
                        {selectedQuestion.correctAnswer}
                      </Text>
                    </View>
                    <View style={styles.answerSummaryRow}>
                      <Text style={styles.answerSummaryLabel}>Participant Answer:</Text>
                      <Text style={[
                        styles.answerSummaryValue,
                        { color: getAnswerColor(selectedQuestion.isCorrect) }
                      ]}>
                        {selectedQuestion.participantAnswer}
                      </Text>
                    </View>
                    <View style={styles.answerSummaryRow}>
                      <Text style={styles.answerSummaryLabel}>Time Spent:</Text>
                      <Text style={styles.answerSummaryValue}>
                        {selectedQuestion.timeSpent} seconds
                      </Text>
                    </View>
                  </View>
                  
                  {selectedQuestion.explanation && (
                    <View style={styles.explanationContainer}>
                      <Text style={styles.explanationTitle}>Explanation</Text>
                      <Text style={styles.explanationText}>
                        {selectedQuestion.explanation}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Analysis Modal */}
      <Modal
        visible={showAnalysis}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAnalysis(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.analysisModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Performance Analysis</Text>
              <TouchableOpacity
                onPress={() => setShowAnalysis(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>Category Performance</Text>
                {Object.keys(participantResult.overallPerformance.categoryBreakdown).length > 0 ? (
                  Object.entries(participantResult.overallPerformance.categoryBreakdown).map(([category, data]) => (
                    <View key={category} style={styles.analysisItem}>
                      <Text style={styles.analysisLabel}>
                        {category.replace('_', ' ').toUpperCase()}
                      </Text>
                      <View style={styles.analysisBar}>
                        <View 
                          style={[
                            styles.analysisBarFill,
                            { width: `${(data.correct / data.total) * 100}%` }
                          ]}
                        />
                      </View>
                      <Text style={styles.analysisValue}>
                        {data.correct}/{data.total} ({(data.correct / data.total * 100).toFixed(1)}%)
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No category data available</Text>
                )}
              </View>
              
              <View style={styles.analysisSection}>
                <Text style={styles.analysisSectionTitle}>Difficulty Performance</Text>
                {Object.keys(participantResult.overallPerformance.difficultyBreakdown).length > 0 ? (
                  Object.entries(participantResult.overallPerformance.difficultyBreakdown).map(([difficulty, data]) => (
                    <View key={difficulty} style={styles.analysisItem}>
                      <Text style={styles.analysisLabel}>
                        {difficulty.toUpperCase()}
                      </Text>
                      <View style={styles.analysisBar}>
                        <View 
                          style={[
                            styles.analysisBarFill,
                            { 
                              width: `${(data.correct / data.total) * 100}%`,
                              backgroundColor: getDifficultyColor(difficulty)
                            }
                          ]}
                        />
                      </View>
                      <Text style={styles.analysisValue}>
                        {data.correct}/{data.total} ({(data.correct / data.total * 100).toFixed(1)}%)
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No difficulty data available</Text>
                )}
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  header: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
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
  analysisButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filterRow: {
    marginBottom: 8,
  },
  filterGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  questionsContainer: {
    marginBottom: 12,
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questionNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  questionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  questionInfo: {
    flex: 1,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
  },
  questionMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  questionActions: {
    alignItems: 'center',
    gap: 6,
  },
  answerIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  answerLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  answerValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  questionDetailModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '90%',
  },
  analysisModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    padding: 10,
  },
  modalContent: {
    padding: 12,
  },
  questionDetailText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 16,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  correctOption: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  incorrectOption: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionKey: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    marginRight: 8,
    minWidth: 18,
  },
  correctOptionText: {
    color: '#22c55e',
  },
  incorrectOptionText: {
    color: '#ef4444',
  },
  optionText: {
    flex: 1,
    fontSize: 12,
    color: '#1f2937',
  },
  answerSummary: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  answerSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  answerSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerSummaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  answerSummaryValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  explanationContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  explanationText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },
  analysisSection: {
    marginBottom: 12,
  },
  analysisSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  analysisItem: {
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  analysisBar: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  analysisBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 6,
  },
  analysisValue: {
    fontSize: 12,
    color: '#6b7280',
  },
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
