import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, Alert, Share } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Question } from "../types/Question";

interface TestResultsScreenProps {
  onBack: () => void;
  testResults: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number;
    answers: {[key: string]: string};
    questions: Question[];
    testType: 'pre_test' | 'post_test';
    submittedAt: string;
  };
}

const { width, height } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = width < 375;
const isMediumScreen = width >= 375 && width < 414;
const isLargeScreen = width >= 414;

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

export default function TestResultsScreen({ onBack, testResults }: TestResultsScreenProps) {
  const [currentView, setCurrentView] = useState<'overview' | 'detailed' | 'analytics'>('overview');
  const [showCertificate, setShowCertificate] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#00ff88';
    if (score >= 60) return '#ffaa00';
    return '#ff6b6b';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    return 'F';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleShare = async () => {
    try {
      const message = `I completed the ${testResults.testType === 'pre_test' ? 'Pre' : 'Post'} Test with a score of ${testResults.score}%! 🎉`;
      await Share.share({
        message,
        title: 'Test Results',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleGenerateCertificate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCertificate(true);
  };

  const renderOverview = () => (
    <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Score Card */}
      <View style={styles.scoreCard}>
        <LinearGradient
          colors={['rgba(0, 255, 136, 0.1)', 'rgba(0, 212, 255, 0.1)']}
          style={styles.scoreCardGradient}
        >
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreTitle}>Test Completed!</Text>
            <Text style={styles.testTypeText}>
              {testResults.testType === 'pre_test' ? 'Pre Test' : 'Post Test'}
            </Text>
          </View>
          
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreText, { color: getScoreColor(testResults.score) }]}>
              {testResults.score}%
            </Text>
            <Text style={styles.gradeText}>
              Grade: {getScoreGrade(testResults.score)}
            </Text>
          </View>
          
          <View style={styles.scoreStats}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color="#00ff88" />
              <Text style={styles.statText}>{testResults.correctAnswers} Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="close-circle" size={24} color="#ff6b6b" />
              <Text style={styles.statText}>{testResults.totalQuestions - testResults.correctAnswers} Incorrect</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time" size={24} color="#00d4ff" />
              <Text style={styles.statText}>{formatTime(testResults.timeTaken)}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.detailedButton]}
          onPress={() => setCurrentView('detailed')}
        >
          <Ionicons name="list" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Detailed Results</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.analyticsButton]}
          onPress={() => setCurrentView('analytics')}
        >
          <Ionicons name="analytics" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.certificateButton]}
          onPress={handleGenerateCertificate}
        >
          <Ionicons name="ribbon" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Certificate</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
        >
          <Ionicons name="share" size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderDetailedResults = () => (
    <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Question-by-Question Breakdown</Text>
        
        {testResults.questions.map((question, index) => {
          const userAnswer = testResults.answers[question.id];
          const isCorrect = userAnswer === question.correct_answer;
          
          return (
            <View key={question.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>Q{index + 1}</Text>
                <View style={[styles.statusBadge, { backgroundColor: isCorrect ? '#00ff88' : '#ff6b6b' }]}>
                  <Ionicons 
                    name={isCorrect ? "checkmark" : "close"} 
                    size={24} 
                    color="#ffffff" 
                  />
                </View>
              </View>
              
              <Text style={styles.questionText}>{question.question_text}</Text>
              
              <View style={styles.optionsContainer}>
                {['A', 'B', 'C', 'D'].map((option) => {
                  const optionText = question[`option_${option.toLowerCase()}` as keyof Question] as string;
                  const isUserAnswer = userAnswer === option;
                  const isCorrectAnswer = question.correct_answer === option;
                  
                  return (
                    <View
                      key={option}
                      style={[
                        styles.optionItem,
                        isUserAnswer && styles.userAnswer,
                        isCorrectAnswer && styles.correctAnswer,
                        isUserAnswer && !isCorrect && styles.incorrectAnswer
                      ]}
                    >
                      <Text style={styles.optionLetter}>{option}</Text>
                      <Text style={styles.optionText}>{optionText}</Text>
                      {isUserAnswer && (
                        <Ionicons 
                          name={isCorrect ? "checkmark-circle" : "close-circle"} 
                          size={24} 
                          color={isCorrect ? "#00ff88" : "#ff6b6b"} 
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );

  const renderAnalytics = () => (
    <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Performance Analytics</Text>
        
        {/* Performance Metrics */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsTitle}>Performance Metrics</Text>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Accuracy Rate</Text>
            <Text style={[styles.metricValue, { color: getScoreColor(testResults.score) }]}>
              {testResults.score}%
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Questions per Minute</Text>
            <Text style={styles.metricValue}>
              {(testResults.totalQuestions / (testResults.timeTaken / 60)).toFixed(1)}
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Time per Question</Text>
            <Text style={styles.metricValue}>
              {formatTime(Math.floor(testResults.timeTaken / testResults.totalQuestions))}
            </Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsTitle}>Category Performance</Text>
          
          {(() => {
            // Get unique categories from the actual questions data
            const categories = [...new Set(testResults.questions.map(q => q.category))];
            
            return categories.map((category) => {
              const categoryQuestions = testResults.questions.filter(q => q.category === category);
              const categoryCorrect = categoryQuestions.filter(q => testResults.answers[q.id] === q.correct_answer).length;
              const categoryScore = categoryQuestions.length > 0 ? Math.round((categoryCorrect / categoryQuestions.length) * 100) : 0;
              
              return (
                <View key={category} style={styles.categoryItem}>
                  <Text style={styles.categoryLabel}>
                    {category.replace('_', ' ').toUpperCase()}
                  </Text>
                  <View style={styles.categoryProgress}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${categoryScore}%`,
                            backgroundColor: getScoreColor(categoryScore)
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.categoryScore}>{categoryScore}%</Text>
                  </View>
                </View>
              );
            });
          })()}
        </View>

        {/* Difficulty Analysis */}
        <View style={styles.analyticsCard}>
          <Text style={styles.analyticsTitle}>Difficulty Analysis</Text>
          
          {(() => {
            // Get unique difficulty levels from the actual questions data
            const difficulties = [...new Set(testResults.questions.map(q => q.difficulty_level))];
            
            return difficulties.map((difficulty) => {
              const difficultyQuestions = testResults.questions.filter(q => q.difficulty_level === difficulty);
              const difficultyCorrect = difficultyQuestions.filter(q => testResults.answers[q.id] === q.correct_answer).length;
              const difficultyScore = difficultyQuestions.length > 0 ? Math.round((difficultyCorrect / difficultyQuestions.length) * 100) : 0;
              
              return (
                <View key={difficulty} style={styles.difficultyItem}>
                  <Text style={styles.difficultyLabel}>
                    {difficulty.toUpperCase()}
                  </Text>
                  <View style={styles.difficultyStats}>
                    <Text style={styles.difficultyCount}>{difficultyQuestions.length} questions</Text>
                    <Text style={[styles.difficultyScore, { color: getScoreColor(difficultyScore) }]}>
                      {difficultyScore}%
                    </Text>
                  </View>
                </View>
              );
            });
          })()}
        </View>
      </ScrollView>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <Animated.View style={[styles.header, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Test Results</Text>
            <Text style={styles.headerSubtitle}>
              {testResults.testType === 'pre_test' ? 'Pre Test' : 'Post Test'} - {new Date(testResults.submittedAt).toLocaleDateString()}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, currentView === 'overview' && styles.activeTab]}
          onPress={() => setCurrentView('overview')}
        >
          <Ionicons 
            name="home" 
            size={24} 
            color={currentView === 'overview' ? '#667eea' : '#666'} 
          />
          <Text style={[styles.tabText, currentView === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, currentView === 'detailed' && styles.activeTab]}
          onPress={() => setCurrentView('detailed')}
        >
          <Ionicons 
            name="list" 
            size={24} 
            color={currentView === 'detailed' ? '#667eea' : '#666'} 
          />
          <Text style={[styles.tabText, currentView === 'detailed' && styles.activeTabText]}>
            Detailed
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, currentView === 'analytics' && styles.activeTab]}
          onPress={() => setCurrentView('analytics')}
        >
          <Ionicons 
            name="analytics" 
            size={24} 
            color={currentView === 'analytics' ? '#667eea' : '#666'} 
          />
          <Text style={[styles.tabText, currentView === 'analytics' && styles.activeTabText]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {currentView === 'overview' && renderOverview()}
      {currentView === 'detailed' && renderDetailedResults()}
      {currentView === 'analytics' && renderAnalytics()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  backButton: {
    marginRight: 24,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 24,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#667eea',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scoreCard: {
    marginBottom: 24,
  },
  scoreCardGradient: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scoreHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  testTypeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 24,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800',
  },
  gradeText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 24,
  },
  scoreStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 24,
  },
  statText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  actionButtons: {
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 24,
  },
  detailedButton: {
    backgroundColor: '#667eea',
  },
  analyticsButton: {
    backgroundColor: '#8b5cf6',
  },
  certificateButton: {
    backgroundColor: '#ff6b6b',
  },
  shareButton: {
    backgroundColor: '#00d4ff',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00d4ff',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    gap: 24,
  },
  questionText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 16,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 24,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 24,
  },
  userAnswer: {
    borderColor: '#00d4ff',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
  correctAnswer: {
    borderColor: '#00ff88',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  incorrectAnswer: {
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00d4ff',
    width: 24,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  analyticsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  metricLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  categoryItem: {
    marginBottom: 24,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
  },
  categoryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  progressBar: {
    flex: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 24,
  },
  categoryScore: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    minWidth: 24,
    textAlign: 'right',
  },
  difficultyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  difficultyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  difficultyCount: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  difficultyScore: {
    fontSize: 16,
    fontWeight: '700',
  },
});
