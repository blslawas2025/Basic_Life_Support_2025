import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, TextInput, Alert, Modal, FlatList } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { QuestionService } from "../services/QuestionService";
import { QuestionPoolService } from "../services/QuestionPoolService";
import { Question, QuestionWithOptions, QuestionStats, QuestionFilters, BulkQuestionOperation } from "../types/Question";

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

interface ManageQuestionScreenProps {
  onBack: () => void;
  onNavigateToUploadQuestions?: () => void;
  onNavigateToPreTest?: () => void;
  onNavigateToPostTest?: () => void;
  onNavigateToTestSettings?: () => void;
  onNavigateToQuestionPools?: () => void;
  onNavigateToAccessControl?: () => void;
  onNavigateToResults?: () => void;
}

export default function ManageQuestionScreen({ onBack, onNavigateToUploadQuestions, onNavigateToPreTest, onNavigateToPostTest, onNavigateToTestSettings, onNavigateToQuestionPools, onNavigateToAccessControl, onNavigateToResults }: ManageQuestionScreenProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showQuestionsList, setShowQuestionsList] = useState<boolean>(false);
  const [availableQuestionSets, setAvailableQuestionSets] = useState<string[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionData, setEditingQuestionData] = useState<Partial<Question>>({});
  const [showRenameModal, setShowRenameModal] = useState<boolean>(false);
  const [renamingSetName, setRenamingSetName] = useState<string>('');
  const [newSetName, setNewSetName] = useState<string>('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
    fetchQuestions();
  }, []);


  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm, selectedCategory, selectedDifficulty, selectedType]);

  useEffect(() => {
    }, [editingQuestionId, editingQuestionData]);

  const startAnimations = () => {
    Animated.parallel([
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
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous animations
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
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
  };

  const extractQuestionSets = (questions: Question[]): string[] => {
    const questionSets = new Set<string>();
    
    questions.forEach(question => {
      // Check tags field for question set names
      if (question.tags) {
        if (Array.isArray(question.tags)) {
          question.tags.forEach((tag: string) => {
            if (tag && typeof tag === 'string' && tag.trim()) {
              questionSets.add(tag.trim());
            }
          });
        } else if (typeof question.tags === 'string' && question.tags) {
          const trimmedTag = (question.tags as string).trim();
          if (trimmedTag) {
            questionSets.add(trimmedTag);
          }
        }
      }
      
    });
    
    return Array.from(questionSets).sort();
  };

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const [questionsData, statsData] = await Promise.all([
        QuestionService.getAllQuestions(),
        QuestionService.getQuestionStats()
      ]);
      
      // Extract available question sets
      const questionSets = extractQuestionSets(questionsData);
      setQuestions(questionsData);
      setQuestionStats(statsData);
      setAvailableQuestionSets(questionSets);
    } catch (error) {
      console.error('Error fetching questions:', error);
      Alert.alert('Error', 'Failed to fetch questions');
    } finally {
      setIsLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = questions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Question set filter (based on tags field and test_type)
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(q => {
        // Check if tags field contains the selected question set name
        if (q.tags && Array.isArray(q.tags)) {
          const match = q.tags.some((tag: string) => typeof tag === 'string' && tag.includes(selectedCategory));
          return match;
        }
        // Fallback: check if tags is a string
        if (typeof q.tags === 'string' && q.tags) {
          const lowerTags = (q.tags as string).toLowerCase();
          const lowerCategory = selectedCategory.toLowerCase();
          const match = lowerTags.includes(lowerCategory);
          return match;
        }
        
        // Additional fallback: check test_type field for Pre/Post test
        if (q.test_type) {
          if (selectedCategory.includes('Pre Test') && q.test_type === 'pre_test') {
            return true;
          }
          if (selectedCategory.includes('Post Test') && q.test_type === 'post_test') {
            return true;
          }
        }
        
        return false;
      });
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.difficulty_level === selectedDifficulty);
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(q => q.question_type === selectedType);
    }

    setFilteredQuestions(filtered);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await QuestionService.deleteQuestion(questionId);
              await fetchQuestions();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error deleting question:', error);
              Alert.alert('Error', 'Failed to delete question');
            }
          }
        }
      ]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.size === 0) return;

    Alert.alert(
      'Delete Questions',
      `Are you sure you want to delete ${selectedQuestions.size} questions? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const operation: BulkQuestionOperation = {
                question_ids: Array.from(selectedQuestions),
                operation: 'delete'
              };
              await QuestionService.bulkQuestionOperation(operation);
              setSelectedQuestions(new Set());
              setShowBulkActions(false);
              await fetchQuestions();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error bulk deleting questions:', error);
              Alert.alert('Error', 'Failed to delete questions');
            }
          }
        }
      ]
    );
  };

  const handleBulkActivate = async () => {
    if (selectedQuestions.size === 0) return;

    try {
      const operation: BulkQuestionOperation = {
        question_ids: Array.from(selectedQuestions),
        operation: 'activate'
      };
      await QuestionService.bulkQuestionOperation(operation);
      setSelectedQuestions(new Set());
      setShowBulkActions(false);
      await fetchQuestions();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error bulk activating questions:', error);
      Alert.alert('Error', 'Failed to activate questions');
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedQuestions.size === 0) return;

    try {
      const operation: BulkQuestionOperation = {
        question_ids: Array.from(selectedQuestions),
        operation: 'deactivate'
      };
      await QuestionService.bulkQuestionOperation(operation);
      setSelectedQuestions(new Set());
      setShowBulkActions(false);
      await fetchQuestions();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error bulk deactivating questions:', error);
      Alert.alert('Error', 'Failed to deactivate questions');
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    setSelectedType('all');
    setShowFilters(false);
  };

  const handleRenameSet = (setName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRenamingSetName(setName);
    setNewSetName(setName);
    setShowRenameModal(true);
  };

  const handleConfirmRename = async () => {
    if (!newSetName.trim() || newSetName.trim() === renamingSetName) {
      setShowRenameModal(false);
      return;
    }

    try {
      // Find all questions with the old set name in their tags
      const questionsToUpdate = questions.filter(question => {
        if (question.tags && Array.isArray(question.tags)) {
          return question.tags.some(tag => tag === renamingSetName);
        }
        return false;
      });

      // Update each question's tags
      for (const question of questionsToUpdate) {
        const updatedTags = question.tags.map(tag => 
          tag === renamingSetName ? newSetName.trim() : tag
        );
        
        await QuestionService.updateQuestion(question.id, {
          tags: updatedTags
        });
      }

      // Refresh the questions and question sets
      await fetchQuestions();
      
      // Update selected category if it was the renamed set
      if (selectedCategory === renamingSetName) {
        setSelectedCategory(newSetName.trim());
      }

      setShowRenameModal(false);
      Alert.alert('Success', `Question set "${renamingSetName}" renamed to "${newSetName.trim()}"`);
    } catch (error) {
      console.error('Error renaming question set:', error);
      Alert.alert('Error', 'Failed to rename question set');
    }
  };

  const handleCancelRename = () => {
    setShowRenameModal(false);
    setRenamingSetName('');
    setNewSetName('');
  };

  const startEditingQuestion = (question: Question) => {
    setEditingQuestionId(question.id);
    setEditingQuestionData({
      question_text: question.question_text,
      question_text_en: question.question_text_en,
      option_a: question.option_a,
      option_a_en: question.option_a_en,
      option_b: question.option_b,
      option_b_en: question.option_b_en,
      option_c: question.option_c,
      option_c_en: question.option_c_en,
      option_d: question.option_d,
      option_d_en: question.option_d_en,
      correct_answer: question.correct_answer,
      difficulty_level: question.difficulty_level,
      points: question.points,
      explanation: question.explanation,
    });
    
    };

  const cancelEditing = () => {
    setEditingQuestionId(null);
    setEditingQuestionData({});
  };

  const saveQuestionEdit = async (questionId: string) => {
    try {
      const updateData = {
        question_text: editingQuestionData.question_text,
        question_text_en: editingQuestionData.question_text_en,
        option_a: editingQuestionData.option_a,
        option_a_en: editingQuestionData.option_a_en,
        option_b: editingQuestionData.option_b,
        option_b_en: editingQuestionData.option_b_en,
        option_c: editingQuestionData.option_c,
        option_c_en: editingQuestionData.option_c_en,
        option_d: editingQuestionData.option_d,
        option_d_en: editingQuestionData.option_d_en,
        correct_answer: editingQuestionData.correct_answer,
        difficulty_level: editingQuestionData.difficulty_level,
        points: editingQuestionData.points,
        explanation: editingQuestionData.explanation || undefined,
      };

      await QuestionService.updateQuestion(questionId, updateData);
      
      // Refresh questions list
      await fetchQuestions();
      
      // Clear editing state
      setEditingQuestionId(null);
      setEditingQuestionData({});
      
      Alert.alert('Success', 'Question updated successfully!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error updating question:', error);
      Alert.alert('Error', 'Failed to update question');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const changeCorrectAnswer = (questionId: string, newAnswer: string) => {
    setEditingQuestionData(prev => ({
      ...prev,
      correct_answer: newAnswer
    }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#00ff88';
      case 'medium': return '#ffaa00';
      case 'hard': return '#ff6b6b';
      default: return '#ffffff';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic_life_support': return '#00d4ff';
      case 'first_aid': return '#5b73ff';
      case 'emergency_response': return '#ff0080';
      case 'medical_knowledge': return '#00ff88';
      case 'general': return '#ffaa00';
      default: return '#ffffff';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'radio-button-on';
      case 'true_false': return 'checkmark-circle';
      case 'short_answer': return 'create';
      case 'essay': return 'document-text';
      default: return 'help-circle';
    }
  };

  const extractEssentialInfo = (text: string) => {
    // Extract the first meaningful part before the first " / "
    const parts = text.split(' / ');
    if (parts.length > 0) {
      // Return only the first part (usually the percentage or main answer)
      return parts[0].trim();
    }
    return text;
  };

  const renderCleanAnswerChoice = (optionText: string, label: string) => {
    const essentialInfo = extractEssentialInfo(optionText);
    const hasMoreInfo = optionText.includes(' / ') && optionText.split(' / ').length > 1;
    
    return (
      <View style={styles.cleanAnswerChoice}>
        <Text style={styles.cleanAnswerLabel}>{label}.</Text>
        <View style={styles.cleanAnswerContent}>
          <Text style={styles.cleanAnswerText}>{essentialInfo}</Text>
          {hasMoreInfo && (
            <TouchableOpacity 
              style={styles.moreInfoButton}
              onPress={() => {
                // Show full details in an alert
                Alert.alert(
                  'Full Answer Details',
                  optionText,
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text style={styles.moreInfoText}>More details</Text>
              <Ionicons name="information-circle-outline" size={14} color="#00d4ff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderQuestionCard = ({ item }: { item: Question }) => (
    <TouchableOpacity
      style={[
        styles.questionCard,
        selectedQuestions.has(item.id) && styles.selectedQuestionCard
      ]}
      onPress={() => toggleQuestionSelection(item.id)}
      onLongPress={() => {
        setPreviewQuestion(item);
        setShowPreviewModal(true);
      }}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={selectedQuestions.has(item.id) 
          ? ['rgba(0, 255, 136, 0.2)', 'rgba(0, 255, 136, 0.1)']
          : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
        }
        style={styles.questionCardGradient}
      >
        <View style={styles.questionCardHeader}>
          <View style={styles.questionCardLeft}>
            <View style={[styles.questionTypeIcon, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
              <Ionicons name={getTypeIcon(item.question_type) as any} size={20} color={getCategoryColor(item.category)} />
            </View>
            <View style={styles.questionCardInfo}>
              <Text style={styles.questionText}>
                {item.question_text}
              </Text>
              <View style={styles.questionMeta}>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty_level) + '20' }]}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty_level) }]}>
                    {item.difficulty_level.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
                  <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
                    {item.category.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.pointsText}>{item.points} pts</Text>
              </View>
            </View>
          </View>
          <View style={styles.questionCardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setEditingQuestion(item);
                setShowEditModal(true);
              }}
            >
              <Ionicons name="create" size={18} color="#00d4ff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteQuestion(item.id)}
            >
              <Ionicons name="trash" size={18} color="#ff6b6b" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.questionCardFooter}>
          <Text style={styles.questionDate}>
            Created: {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <View style={styles.questionStatus}>
            <View style={[
              styles.statusDot,
              { backgroundColor: item.is_active ? '#00ff88' : '#ff6b6b' }
            ]} />
            <Text style={styles.statusText}>
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background */}
      <Animated.View style={styles.backgroundContainer}>
        <LinearGradient 
          colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#0a0a0a"]} 
          style={styles.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Animated.View style={[
          styles.animatedGradient,
          {
            opacity: shimmerAnim.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [0.3, 0.7, 0.4, 0.8, 0.3]
            }),
          }
        ]}>
          <LinearGradient 
            colors={["#00d4ff", "#5b73ff", "#00ff88", "#ff0080", "#ffaa00", "#00d4ff"]} 
            style={styles.backgroundGradient}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        </Animated.View>
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
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Animated.View style={[
            styles.headerIcon,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}>
            <LinearGradient 
              colors={["#00ff88", "#5b73ff", "#00d4ff"]} 
              style={styles.headerIconGradient}
            >
              <Ionicons name="help-circle" size={24} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Manage Questions</Text>
            <Text style={styles.headerSubtitle}>View, edit, and manage all questions</Text>
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Stats Overview */}
        {questionStats && (
          <Animated.View style={[
            styles.statsContainer,
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
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{questionStats.total}</Text>
                <Text style={styles.statLabel}>Total Questions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{questionStats.active}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{questionStats.inactive}</Text>
                <Text style={styles.statLabel}>Inactive</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* BLS Test and BLS Quiz Cards */}
        <Animated.View style={[
          styles.mainCardsContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [60, 0]
              }) }
            ]
          }
        ]}>
          {/* BLS Test Card */}
          <Animated.View style={[
            styles.blsCard,
            {
              transform: [
                { translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [80, 0]
                }) }
              ]
            }
          ]}>
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.05)']}
              style={styles.blsCardGradient}
            >
              <View style={styles.blsCardHeader}>
                <View style={[styles.blsCardIcon, { backgroundColor: 'rgba(34, 197, 94, 0.3)' }]}>
                  <Ionicons name="school" size={32} color="#22c55e" />
                </View>
                <View style={styles.blsCardTitleContainer}>
                  <Text style={styles.blsCardTitle}>BLS Test</Text>
                  <Text style={styles.blsCardSubtitle}>Duration: 30 minutes • 30 questions • Clinical: 25/30, Non-clinical: 20/30</Text>
                </View>
              </View>
              
              {/* Elegant Action Cards for BLS Test */}
              <View style={styles.elegantActionsContainer}>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.elegantActionCard, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (onNavigateToUploadQuestions) {
                        onNavigateToUploadQuestions();
                      }
                    }}
                  >
                    <View style={[styles.elegantIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                      <Ionicons name="cloud-upload-outline" size={24} color="#22c55e" />
                    </View>
                    <Text style={styles.elegantActionTitle}>Upload Questions</Text>
                    <Text style={styles.elegantActionSubtitle}>Add new test questions</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.elegantActionCard, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      fetchQuestions();
                      setShowQuestionsList(true);
                    }}
                  >
                    <View style={[styles.elegantIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                      <Ionicons name="list-outline" size={24} color="#22c55e" />
                    </View>
                    <Text style={styles.elegantActionTitle}>Manage Questions</Text>
                    <Text style={styles.elegantActionSubtitle}>Edit or delete questions</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.elegantActionCard, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (onNavigateToPreTest) {
                        onNavigateToPreTest();
                      } else {
                        Alert.alert('Pre Test', 'Navigate to pre test management');
                      }
                    }}
                  >
                    <View style={[styles.elegantIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                      <Ionicons name="play-circle-outline" size={24} color="#22c55e" />
                    </View>
                    <Text style={styles.elegantActionTitle}>Pre Test</Text>
                    <Text style={styles.elegantActionSubtitle}>Start assessment</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.elegantActionCard, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (onNavigateToPostTest) {
                        onNavigateToPostTest();
                      } else {
                        Alert.alert('Post Test', 'Navigate to post test management');
                      }
                    }}
                  >
                    <View style={[styles.elegantIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                      <Ionicons name="checkmark-circle-outline" size={24} color="#22c55e" />
                    </View>
                    <Text style={styles.elegantActionTitle}>Post Test</Text>
                    <Text style={styles.elegantActionSubtitle}>Complete assessment</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.elegantSettingsCard, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (onNavigateToTestSettings) {
                      onNavigateToTestSettings();
                    } else {
                      Alert.alert('Test Settings', 'Configure test parameters');
                    }
                  }}
                >
                  <View style={[styles.elegantIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.3)' }]}>
                    <Ionicons name="settings-outline" size={24} color="#22c55e" />
                  </View>
                  <View style={styles.elegantSettingsContent}>
                    <Text style={styles.elegantSettingsTitle}>Test Settings</Text>
                    <Text style={styles.elegantSettingsSubtitle}>Configure timer, warnings & more</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#22c55e" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.elegantSettingsCard, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (onNavigateToQuestionPools) {
                      onNavigateToQuestionPools();
                    } else {
                      Alert.alert('Question Pools', 'Manage question sets and pools');
                    }
                  }}
                >
                  <View style={[styles.elegantIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.3)' }]}>
                    <Ionicons name="library-outline" size={24} color="#8b5cf6" />
                  </View>
                  <View style={styles.elegantSettingsContent}>
                    <Text style={styles.elegantSettingsTitle}>Question Pools</Text>
                    <Text style={styles.elegantSettingsSubtitle}>Manage question sets and pools</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8b5cf6" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.elegantSettingsCard, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (onNavigateToAccessControl) {
                      onNavigateToAccessControl();
                    } else {
                      Alert.alert('Access Control', 'Manage test access permissions');
                    }
                  }}
                >
                  <View style={[styles.elegantIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.3)' }]}>
                    <Ionicons name="shield-checkmark-outline" size={24} color="#ef4444" />
                  </View>
                  <View style={styles.elegantSettingsContent}>
                    <Text style={styles.elegantSettingsTitle}>Access Control</Text>
                    <Text style={styles.elegantSettingsSubtitle}>Manage test access permissions</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ef4444" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.elegantSettingsCard, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    if (onNavigateToResults) {
                      onNavigateToResults();
                    } else {
                      Alert.alert('Results & Analytics', 'View test results and statistics');
                    }
                  }}
                >
                  <View style={[styles.elegantIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.3)' }]}>
                    <Ionicons name="analytics-outline" size={24} color="#3b82f6" />
                  </View>
                  <View style={styles.elegantSettingsContent}>
                    <Text style={styles.elegantSettingsTitle}>Results & Analytics</Text>
                    <Text style={styles.elegantSettingsSubtitle}>View participant results and statistics</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* BLS Quiz Card */}
          <Animated.View style={[
            styles.blsCard,
            {
              transform: [
                { translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0]
                }) }
              ]
            }
          ]}>
            <LinearGradient
              colors={['rgba(168, 85, 247, 0.15)', 'rgba(168, 85, 247, 0.05)']}
              style={styles.blsCardGradient}
            >
              <View style={styles.blsCardHeader}>
                <View style={[styles.blsCardIcon, { backgroundColor: 'rgba(168, 85, 247, 0.3)' }]}>
                  <Ionicons name="help-circle" size={32} color="#a855f7" />
                </View>
                <View style={styles.blsCardTitleContainer}>
                  <Text style={styles.blsCardTitle}>BLS Quiz</Text>
                  <Text style={styles.blsCardSubtitle}>Duration: 30 minutes • 30 questions • Clinical: 25/30, Non-clinical: 20/30</Text>
                </View>
              </View>
              
              {/* Elegant Action Cards for BLS Quiz */}
              <View style={styles.elegantActionsContainer}>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.elegantActionCard, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      Alert.alert('Quiz Upload', 'Upload quiz questions (different from test questions)');
                    }}
                  >
                    <View style={[styles.elegantIconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                      <Ionicons name="cloud-upload-outline" size={24} color="#a855f7" />
                    </View>
                    <Text style={styles.elegantActionTitle}>Upload Quiz</Text>
                    <Text style={styles.elegantActionSubtitle}>Add practice questions</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.elegantActionCard, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      Alert.alert('View/Edit/Delete Quiz', 'Navigate to quiz management');
                    }}
                  >
                    <View style={[styles.elegantIconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                      <Ionicons name="list-outline" size={24} color="#a855f7" />
                    </View>
                    <Text style={styles.elegantActionTitle}>Manage Quiz</Text>
                    <Text style={styles.elegantActionSubtitle}>Edit or delete questions</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.elegantActionCard, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      Alert.alert('Quiz', 'Navigate to quiz management');
                    }}
                  >
                    <View style={[styles.elegantIconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                      <Ionicons name="help-circle-outline" size={24} color="#a855f7" />
                    </View>
                    <Text style={styles.elegantActionTitle}>Start Quiz</Text>
                    <Text style={styles.elegantActionSubtitle}>Practice session</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.elegantActionCard, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      Alert.alert('Quiz Settings', 'Configure quiz parameters');
                    }}
                  >
                    <View style={[styles.elegantIconContainer, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                      <Ionicons name="settings-outline" size={24} color="#a855f7" />
                    </View>
                    <Text style={styles.elegantActionTitle}>Quiz Settings</Text>
                    <Text style={styles.elegantActionSubtitle}>Configure options</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Animated.ScrollView>

      {/* Preview Modal */}
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View style={styles.previewModalContainer}>
          <LinearGradient
            colors={["#0a0a0a", "#1a1a2e", "#16213e"]}
            style={styles.previewModalBackground}
          />
          
          {/* Header */}
          <View style={styles.previewModalHeader}>
            <TouchableOpacity onPress={() => setShowPreviewModal(false)} style={styles.previewCloseButton}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.previewModalTitle}>Question Preview</Text>
            <TouchableOpacity 
              onPress={() => {
                setEditingQuestion(previewQuestion);
                setShowPreviewModal(false);
                setShowEditModal(true);
              }} 
              style={styles.previewEditButton}
            >
              <Ionicons name="create" size={20} color="#00d4ff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.previewModalContent} showsVerticalScrollIndicator={false}>
            {previewQuestion && (
              <>
                {/* Question Text */}
                <View style={styles.previewSection}>
                  <Text style={styles.previewSectionTitle}>Question</Text>
                  <View style={styles.previewQuestionContainer}>
                    {(() => {
                      const textParts = previewQuestion.question_text.split(' / ');
                      if (textParts.length === 2) {
                        return (
                          <View>
                            <Text style={[styles.previewQuestionText, styles.previewMalayText]}>
                              {textParts[0]}
                            </Text>
                            <Text style={[styles.previewQuestionText, styles.previewEnglishText]}>
                              {textParts[1]}
                            </Text>
                          </View>
                        );
                      } else {
                        return (
                          <Text style={styles.previewQuestionText}>
                            {previewQuestion.question_text}
                          </Text>
                        );
                      }
                    })()}
                  </View>
                </View>

                {/* Answer Choices - Clean Display */}
                {(previewQuestion.option_a || previewQuestion.option_b || previewQuestion.option_c || previewQuestion.option_d) && (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewSectionTitle}>Answer Choices</Text>
                    <View style={styles.cleanAnswerChoices}>
                      {previewQuestion.option_a && (
                        <View style={[
                          styles.cleanAnswerChoice,
                          previewQuestion.correct_answer === 'A' && styles.previewCorrectAnswer
                        ]}>
                          {renderCleanAnswerChoice(previewQuestion.option_a, 'A')}
                        </View>
                      )}
                      {previewQuestion.option_b && (
                        <View style={[
                          styles.cleanAnswerChoice,
                          previewQuestion.correct_answer === 'B' && styles.previewCorrectAnswer
                        ]}>
                          {renderCleanAnswerChoice(previewQuestion.option_b, 'B')}
                        </View>
                      )}
                      {previewQuestion.option_c && (
                        <View style={[
                          styles.cleanAnswerChoice,
                          previewQuestion.correct_answer === 'C' && styles.previewCorrectAnswer
                        ]}>
                          {renderCleanAnswerChoice(previewQuestion.option_c, 'C')}
                        </View>
                      )}
                      {previewQuestion.option_d && (
                        <View style={[
                          styles.cleanAnswerChoice,
                          previewQuestion.correct_answer === 'D' && styles.previewCorrectAnswer
                        ]}>
                          {renderCleanAnswerChoice(previewQuestion.option_d, 'D')}
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Question Details */}
                <View style={styles.previewSection}>
                  <Text style={styles.previewSectionTitle}>Question Details</Text>
                  <View style={styles.previewDetailsGrid}>
                    <View style={styles.previewDetailItem}>
                      <Text style={styles.previewDetailLabel}>Type:</Text>
                      <Text style={styles.previewDetailValue}>
                        {previewQuestion.question_type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.previewDetailItem}>
                      <Text style={styles.previewDetailLabel}>Difficulty:</Text>
                      <Text style={[styles.previewDetailValue, { color: getDifficultyColor(previewQuestion.difficulty_level) }]}>
                        {previewQuestion.difficulty_level.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.previewDetailItem}>
                      <Text style={styles.previewDetailLabel}>Category:</Text>
                      <Text style={[styles.previewDetailValue, { color: getCategoryColor(previewQuestion.category) }]}>
                        {previewQuestion.category.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.previewDetailItem}>
                      <Text style={styles.previewDetailLabel}>Points:</Text>
                      <Text style={styles.previewDetailValue}>{previewQuestion.points} pts</Text>
                    </View>
                    <View style={styles.previewDetailItem}>
                      <Text style={styles.previewDetailLabel}>Status:</Text>
                      <Text style={[styles.previewDetailValue, { color: previewQuestion.is_active ? '#00ff88' : '#ff6b6b' }]}>
                        {previewQuestion.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                    <View style={styles.previewDetailItem}>
                      <Text style={styles.previewDetailLabel}>Created:</Text>
                      <Text style={styles.previewDetailValue}>
                        {new Date(previewQuestion.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Explanation */}
                {previewQuestion.explanation && (
                  <View style={styles.previewSection}>
                    <Text style={styles.previewSectionTitle}>Explanation</Text>
                    <View style={styles.previewExplanationContainer}>
                      <Text style={styles.previewExplanationText}>
                        {previewQuestion.explanation}
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Questions List Modal */}
      <Modal
        visible={showQuestionsList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQuestionsList(false)}
      >
        <View style={styles.questionsModalContainer}>
          <LinearGradient
            colors={["#0a0a0a", "#1a1a2e", "#16213e"]}
            style={styles.questionsModalBackground}
          />
          
          {/* Header */}
          <View style={styles.questionsModalHeader}>
            <TouchableOpacity onPress={() => setShowQuestionsList(false)} style={styles.questionsCloseButton}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.questionsModalTitle}>Questions Management</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowQuestionsList(false);
                if (onNavigateToUploadQuestions) {
                  onNavigateToUploadQuestions();
                }
              }} 
              style={styles.questionsUploadButton}
            >
              <Ionicons name="cloud-upload" size={20} color="#22c55e" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.questionsModalContent} showsVerticalScrollIndicator={false}>
            {/* Search and Filters */}
            <View style={styles.questionsSearchContainer}>
              <TextInput
                style={styles.questionsSearchInput}
                placeholder="Search questions..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
              <TouchableOpacity
                style={styles.questionsFilterButton}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Ionicons name="filter" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Filters */}
            {showFilters && (
              <View style={styles.questionsFiltersContainer}>
                <Text style={styles.questionsFilterTitle}>Filter by Question Set</Text>
                
                {/* All Sets Button */}
                <View style={styles.questionsFiltersRow}>
                  <TouchableOpacity
                    style={[styles.questionsFilterChip, selectedCategory === 'all' && styles.questionsFilterChipActive]}
                    onPress={() => setSelectedCategory('all')}
                  >
                    <Text style={[styles.questionsFilterChipText, selectedCategory === 'all' && styles.questionsFilterChipTextActive]}>All Sets</Text>
                  </TouchableOpacity>
                </View>

                {/* Dynamic Question Set Filters */}
                {availableQuestionSets.length > 0 && (
                  <View style={styles.questionsFiltersRow}>
                    {availableQuestionSets.map((setName, index) => (
                      <View key={setName} style={styles.questionsFilterChipContainer}>
                        <TouchableOpacity
                          style={[
                            styles.questionsFilterChip, 
                            selectedCategory === setName && styles.questionsFilterChipActive
                          ]}
                          onPress={() => setSelectedCategory(setName)}
                        >
                          <Text style={[
                            styles.questionsFilterChipText, 
                            selectedCategory === setName && styles.questionsFilterChipTextActive
                          ]}>
                            {setName}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.questionsFilterRenameButton}
                          onPress={() => handleRenameSet(setName)}
                        >
                          <Ionicons name="pencil" size={14} color="#8b5cf6" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {availableQuestionSets.length === 0 && (
                  <View style={styles.questionsFiltersRow}>
                    <Text style={styles.questionsNoSetsText}>No question sets found. Upload questions with tags to see filter options.</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.questionsClearFiltersButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.questionsClearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Questions List - Organized by Test Type */}
            {isLoading ? (
              <View style={styles.questionsLoadingContainer}>
                <Text style={styles.questionsLoadingText}>Loading questions...</Text>
              </View>
            ) : (
              <View style={styles.questionsOrganizedContainer}>
                {/* Pre Test Section */}
                <View style={styles.questionsSection}>
                  <View style={styles.questionsSectionHeader}>
                    <View style={[styles.questionsSectionIcon, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                      <Ionicons name="play-circle" size={20} color="#22c55e" />
                    </View>
                    <Text style={styles.questionsSectionTitle}>Pre Test Questions</Text>
                    <Text style={styles.questionsSectionCount}>
                      {filteredQuestions.filter(q => q.test_type === 'pre_test').length} questions
                    </Text>
                  </View>
                  
                  {filteredQuestions.filter(q => q.test_type === 'pre_test').length > 0 ? (
                    <View style={styles.questionsSectionList}>
                      {filteredQuestions.filter(q => q.test_type === 'pre_test').map((question, index) => {
                        return (
                        <View key={question.id} style={styles.questionsOrganizedItem}>
                          <LinearGradient
                            colors={['rgba(34, 197, 94, 0.1)', 'rgba(34, 197, 94, 0.05)']}
                            style={styles.questionsOrganizedItemGradient}
                          >
                            <View style={styles.questionsOrganizedHeader}>
                              <View style={styles.questionsOrganizedLeft}>
                                <Text style={styles.questionsOrganizedNumber}>{index + 1}</Text>
                                <View style={styles.questionsOrganizedInfo}>
                                  <View style={styles.questionsBilingualContainer}>
                                    {(() => {
                                  const isEditing = editingQuestionId === question.id;
                                  return isEditing;
                                })() ? (
                                      <>
                                        <TextInput
                                          style={styles.questionsEditInput}
                                          value={editingQuestionData.question_text || ''}
                                          onChangeText={(text) => setEditingQuestionData(prev => ({ ...prev, question_text: text }))}
                                          multiline
                                          placeholder="Enter question text..."
                                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                        />
                                        <TextInput
                                          style={styles.questionsEditInputEnglish}
                                          value={editingQuestionData.question_text_en || ''}
                                          onChangeText={(text) => setEditingQuestionData(prev => ({ ...prev, question_text_en: text }))}
                                          multiline
                                          placeholder="Enter English translation..."
                                          placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <Text style={styles.questionsOrganizedText}>
                                          {question.question_text}
                                        </Text>
                                        {question.question_text_en && (
                                          <Text style={styles.questionsOrganizedTextEnglish}>
                                            {question.question_text_en}
                                          </Text>
                                        )}
                                      </>
                                    )}
                                  </View>
                                  <View style={styles.questionsOrganizedMeta}>
                                    <View style={[styles.questionsOrganizedBadge, { backgroundColor: getDifficultyColor(question.difficulty_level) + '20' }]}>
                                      <Text style={[styles.questionsOrganizedBadgeText, { color: getDifficultyColor(question.difficulty_level) }]}>
                                        {question.difficulty_level.toUpperCase()}
                                      </Text>
                                    </View>
                                    <Text style={styles.questionsOrganizedPoints}>{question.points} pts</Text>
                                  </View>
                                </View>
                              </View>
                              <View style={styles.questionsOrganizedActions}>
                                {(() => {
                                  const isEditing = editingQuestionId === question.id;
                                  return isEditing;
                                })() ? (
                                  <>
                                    <TouchableOpacity
                                      style={styles.questionsOrganizedActionButton}
                                      onPress={() => saveQuestionEdit(question.id)}
                                    >
                                      <Ionicons name="checkmark" size={16} color="#22c55e" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.questionsOrganizedActionButton}
                                      onPress={cancelEditing}
                                    >
                                      <Ionicons name="close" size={16} color="#ff6b6b" />
                                    </TouchableOpacity>
                                  </>
                                ) : (
                                  <>
                                    <TouchableOpacity
                                      style={styles.questionsOrganizedActionButton}
                                      onPress={() => {
                                        startEditingQuestion(question);
                                      }}
                                    >
                                      <Ionicons name="create" size={16} color="#00d4ff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.questionsOrganizedActionButton}
                                      onPress={() => handleDeleteQuestion(question.id)}
                                    >
                                      <Ionicons name="trash" size={16} color="#ff6b6b" />
                                    </TouchableOpacity>
                                  </>
                                )}
                              </View>
                            </View>
                            
                            {/* Answer Choices */}
                            {(question.option_a || question.option_b || question.option_c || question.option_d) && (
                              <View style={styles.questionsOrganizedAnswers}>
                                <Text style={styles.questionsOrganizedAnswersTitle}>Answer Choices:</Text>
                                <View style={styles.questionsOrganizedAnswersList}>
                                  {question.option_a && (
                                    <View style={[
                                      styles.questionsOrganizedAnswer,
                                      question.correct_answer === 'A' && styles.questionsOrganizedAnswerCorrect
                                    ]}>
                                      <TouchableOpacity
                                        style={styles.questionsOrganizedAnswerLabel}
                                        onPress={() => editingQuestionId === question.id && changeCorrectAnswer(question.id, 'A')}
                                        disabled={editingQuestionId !== question.id}
                                      >
                                        <Text style={[
                                          styles.questionsOrganizedAnswerLabelText,
                                          (editingQuestionId === question.id ? editingQuestionData.correct_answer : question.correct_answer) === 'A' && styles.questionsOrganizedAnswerLabelTextCorrect
                                        ]}>A.</Text>
                                      </TouchableOpacity>
                                      <View style={styles.questionsBilingualAnswerContainer}>
                                        {(() => {
                                  const isEditing = editingQuestionId === question.id;
                                  return isEditing;
                                })() ? (
                                          <>
                                            <TextInput
                                              style={[
                                                styles.questionsEditAnswerInput,
                                                editingQuestionData.correct_answer === 'A' && styles.questionsEditAnswerInputCorrect
                                              ]}
                                              value={editingQuestionData.option_a || ''}
                                              onChangeText={(text) => setEditingQuestionData(prev => ({ ...prev, option_a: text }))}
                                              multiline
                                              placeholder="Option A..."
                                              placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                            />
                                            <TextInput
                                              style={[
                                                styles.questionsEditAnswerInputEnglish,
                                                editingQuestionData.correct_answer === 'A' && styles.questionsEditAnswerInputCorrect
                                              ]}
                                              value={editingQuestionData.option_a_en || ''}
                                              onChangeText={(text) => setEditingQuestionData(prev => ({ ...prev, option_a_en: text }))}
                                              multiline
                                              placeholder="Option A English..."
                                              placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                            />
                                          </>
                                        ) : (
                                          <>
                                            <Text style={[
                                              styles.questionsOrganizedAnswerText,
                                              question.correct_answer === 'A' && styles.questionsOrganizedAnswerTextCorrect
                                            ]}>{question.option_a}</Text>
                                            {question.option_a_en && (
                                              <Text style={[
                                                styles.questionsOrganizedAnswerTextEnglish,
                                                question.correct_answer === 'A' && styles.questionsOrganizedAnswerTextCorrect
                                              ]}>{question.option_a_en}</Text>
                                            )}
                                          </>
                                        )}
                                      </View>
                                      {question.correct_answer === 'A' && (
                                        <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                                      )}
                                    </View>
                                  )}
                                  {question.option_b && (
                                    <View style={[
                                      styles.questionsOrganizedAnswer,
                                      question.correct_answer === 'B' && styles.questionsOrganizedAnswerCorrect
                                    ]}>
                                      <TouchableOpacity
                                        style={styles.questionsOrganizedAnswerLabel}
                                        onPress={() => editingQuestionId === question.id && changeCorrectAnswer(question.id, 'B')}
                                        disabled={editingQuestionId !== question.id}
                                      >
                                        <Text style={[
                                          styles.questionsOrganizedAnswerLabelText,
                                          (editingQuestionId === question.id ? editingQuestionData.correct_answer : question.correct_answer) === 'B' && styles.questionsOrganizedAnswerLabelTextCorrect
                                        ]}>B.</Text>
                                      </TouchableOpacity>
                                      <View style={styles.questionsBilingualAnswerContainer}>
                                        <Text style={[
                                          styles.questionsOrganizedAnswerText,
                                          question.correct_answer === 'B' && styles.questionsOrganizedAnswerTextCorrect
                                        ]}>{question.option_b}</Text>
                                        {question.option_b_en && (
                                          <Text style={[
                                            styles.questionsOrganizedAnswerTextEnglish,
                                            question.correct_answer === 'B' && styles.questionsOrganizedAnswerTextCorrect
                                          ]}>{question.option_b_en}</Text>
                                        )}
                                      </View>
                                      {question.correct_answer === 'B' && (
                                        <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                                      )}
                                    </View>
                                  )}
                                  {question.option_c && (
                                    <View style={[
                                      styles.questionsOrganizedAnswer,
                                      question.correct_answer === 'C' && styles.questionsOrganizedAnswerCorrect
                                    ]}>
                                      <TouchableOpacity
                                        style={styles.questionsOrganizedAnswerLabel}
                                        onPress={() => editingQuestionId === question.id && changeCorrectAnswer(question.id, 'C')}
                                        disabled={editingQuestionId !== question.id}
                                      >
                                        <Text style={[
                                          styles.questionsOrganizedAnswerLabelText,
                                          (editingQuestionId === question.id ? editingQuestionData.correct_answer : question.correct_answer) === 'C' && styles.questionsOrganizedAnswerLabelTextCorrect
                                        ]}>C.</Text>
                                      </TouchableOpacity>
                                      <View style={styles.questionsBilingualAnswerContainer}>
                                        <Text style={[
                                          styles.questionsOrganizedAnswerText,
                                          question.correct_answer === 'C' && styles.questionsOrganizedAnswerTextCorrect
                                        ]}>{question.option_c}</Text>
                                        {question.option_c_en && (
                                          <Text style={[
                                            styles.questionsOrganizedAnswerTextEnglish,
                                            question.correct_answer === 'C' && styles.questionsOrganizedAnswerTextCorrect
                                          ]}>{question.option_c_en}</Text>
                                        )}
                                      </View>
                                      {question.correct_answer === 'C' && (
                                        <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                                      )}
                                    </View>
                                  )}
                                  {question.option_d && (
                                    <View style={[
                                      styles.questionsOrganizedAnswer,
                                      question.correct_answer === 'D' && styles.questionsOrganizedAnswerCorrect
                                    ]}>
                                      <TouchableOpacity
                                        style={styles.questionsOrganizedAnswerLabel}
                                        onPress={() => editingQuestionId === question.id && changeCorrectAnswer(question.id, 'D')}
                                        disabled={editingQuestionId !== question.id}
                                      >
                                        <Text style={[
                                          styles.questionsOrganizedAnswerLabelText,
                                          (editingQuestionId === question.id ? editingQuestionData.correct_answer : question.correct_answer) === 'D' && styles.questionsOrganizedAnswerLabelTextCorrect
                                        ]}>D.</Text>
                                      </TouchableOpacity>
                                      <View style={styles.questionsBilingualAnswerContainer}>
                                        <Text style={[
                                          styles.questionsOrganizedAnswerText,
                                          question.correct_answer === 'D' && styles.questionsOrganizedAnswerTextCorrect
                                        ]}>{question.option_d}</Text>
                                        {question.option_d_en && (
                                          <Text style={[
                                            styles.questionsOrganizedAnswerTextEnglish,
                                            question.correct_answer === 'D' && styles.questionsOrganizedAnswerTextCorrect
                                          ]}>{question.option_d_en}</Text>
                                        )}
                                      </View>
                                      {question.correct_answer === 'D' && (
                                        <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                                      )}
                                    </View>
                                  )}
                                </View>
                              </View>
                            )}
                          </LinearGradient>
                        </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.questionsEmptySection}>
                      <Ionicons name="play-circle-outline" size={32} color="rgba(34, 197, 94, 0.3)" />
                      <Text style={styles.questionsEmptyText}>No Pre Test questions found</Text>
                    </View>
                  )}
                </View>

                {/* Post Test Section */}
                <View style={styles.questionsSection}>
                  <View style={styles.questionsSectionHeader}>
                    <View style={[styles.questionsSectionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                      <Ionicons name="checkmark-circle" size={20} color="#ef4444" />
                    </View>
                    <Text style={styles.questionsSectionTitle}>Post Test Questions</Text>
                    <Text style={styles.questionsSectionCount}>
                      {filteredQuestions.filter(q => q.test_type === 'post_test').length} questions
                    </Text>
                  </View>
                  
                  {filteredQuestions.filter(q => q.test_type === 'post_test').length > 0 ? (
                    <View style={styles.questionsSectionList}>
                      {filteredQuestions.filter(q => q.test_type === 'post_test').map((question, index) => {
                        return (
                        <View key={question.id} style={styles.questionsOrganizedItem}>
                          <LinearGradient
                            colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
                            style={styles.questionsOrganizedItemGradient}
                          >
                            <View style={styles.questionsOrganizedHeader}>
                              <View style={styles.questionsOrganizedLeft}>
                                <Text style={styles.questionsOrganizedNumber}>{index + 1}</Text>
                                <View style={styles.questionsOrganizedInfo}>
                                  <View style={styles.questionsBilingualContainer}>
                                    {(() => {
                                  const isEditing = editingQuestionId === question.id;
                                  return isEditing;
                                })() ? (
                                      <>
                                        <TextInput
                                          style={styles.questionsEditInput}
                                          value={editingQuestionData.question_text || ''}
                                          onChangeText={(text) => setEditingQuestionData(prev => ({ ...prev, question_text: text }))}
                                          multiline
                                          placeholder="Enter question text..."
                                          placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                        />
                                        <TextInput
                                          style={styles.questionsEditInputEnglish}
                                          value={editingQuestionData.question_text_en || ''}
                                          onChangeText={(text) => setEditingQuestionData(prev => ({ ...prev, question_text_en: text }))}
                                          multiline
                                          placeholder="Enter English translation..."
                                          placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <Text style={styles.questionsOrganizedText}>
                                          {question.question_text}
                                        </Text>
                                        {question.question_text_en && (
                                          <Text style={styles.questionsOrganizedTextEnglish}>
                                            {question.question_text_en}
                                          </Text>
                                        )}
                                      </>
                                    )}
                                  </View>
                                  <View style={styles.questionsOrganizedMeta}>
                                    <View style={[styles.questionsOrganizedBadge, { backgroundColor: getDifficultyColor(question.difficulty_level) + '20' }]}>
                                      <Text style={[styles.questionsOrganizedBadgeText, { color: getDifficultyColor(question.difficulty_level) }]}>
                                        {question.difficulty_level.toUpperCase()}
                                      </Text>
                                    </View>
                                    <Text style={styles.questionsOrganizedPoints}>{question.points} pts</Text>
                                  </View>
                                </View>
                              </View>
                              <View style={styles.questionsOrganizedActions}>
                                {(() => {
                                  const isEditing = editingQuestionId === question.id;
                                  return isEditing;
                                })() ? (
                                  <>
                                    <TouchableOpacity
                                      style={styles.questionsOrganizedActionButton}
                                      onPress={() => saveQuestionEdit(question.id)}
                                    >
                                      <Ionicons name="checkmark" size={16} color="#22c55e" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.questionsOrganizedActionButton}
                                      onPress={cancelEditing}
                                    >
                                      <Ionicons name="close" size={16} color="#ff6b6b" />
                                    </TouchableOpacity>
                                  </>
                                ) : (
                                  <>
                                    <TouchableOpacity
                                      style={styles.questionsOrganizedActionButton}
                                      onPress={() => {
                                        startEditingQuestion(question);
                                      }}
                                    >
                                      <Ionicons name="create" size={16} color="#00d4ff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.questionsOrganizedActionButton}
                                      onPress={() => handleDeleteQuestion(question.id)}
                                    >
                                      <Ionicons name="trash" size={16} color="#ff6b6b" />
                                    </TouchableOpacity>
                                  </>
                                )}
                              </View>
                            </View>
                            
                            {/* Answer Choices */}
                            {(question.option_a || question.option_b || question.option_c || question.option_d) && (
                              <View style={styles.questionsOrganizedAnswers}>
                                <Text style={styles.questionsOrganizedAnswersTitle}>Answer Choices:</Text>
                                <View style={styles.questionsOrganizedAnswersList}>
                                  {question.option_a && (
                                    <View style={[
                                      styles.questionsOrganizedAnswer,
                                      question.correct_answer === 'A' && styles.questionsOrganizedAnswerCorrect
                                    ]}>
                                      <TouchableOpacity
                                        style={styles.questionsOrganizedAnswerLabel}
                                        onPress={() => editingQuestionId === question.id && changeCorrectAnswer(question.id, 'A')}
                                        disabled={editingQuestionId !== question.id}
                                      >
                                        <Text style={[
                                          styles.questionsOrganizedAnswerLabelText,
                                          (editingQuestionId === question.id ? editingQuestionData.correct_answer : question.correct_answer) === 'A' && styles.questionsOrganizedAnswerLabelTextCorrect
                                        ]}>A.</Text>
                                      </TouchableOpacity>
                                      <Text style={[
                                        styles.questionsOrganizedAnswerText,
                                        question.correct_answer === 'A' && styles.questionsOrganizedAnswerTextCorrect
                                      ]}>{question.option_a}</Text>
                                      {question.correct_answer === 'A' && (
                                        <Ionicons name="checkmark-circle" size={16} color="#ef4444" />
                                      )}
                                    </View>
                                  )}
                                  {question.option_b && (
                                    <View style={[
                                      styles.questionsOrganizedAnswer,
                                      question.correct_answer === 'B' && styles.questionsOrganizedAnswerCorrect
                                    ]}>
                                      <TouchableOpacity
                                        style={styles.questionsOrganizedAnswerLabel}
                                        onPress={() => editingQuestionId === question.id && changeCorrectAnswer(question.id, 'B')}
                                        disabled={editingQuestionId !== question.id}
                                      >
                                        <Text style={[
                                          styles.questionsOrganizedAnswerLabelText,
                                          (editingQuestionId === question.id ? editingQuestionData.correct_answer : question.correct_answer) === 'B' && styles.questionsOrganizedAnswerLabelTextCorrect
                                        ]}>B.</Text>
                                      </TouchableOpacity>
                                      <Text style={[
                                        styles.questionsOrganizedAnswerText,
                                        question.correct_answer === 'B' && styles.questionsOrganizedAnswerTextCorrect
                                      ]}>{question.option_b}</Text>
                                      {question.correct_answer === 'B' && (
                                        <Ionicons name="checkmark-circle" size={16} color="#ef4444" />
                                      )}
                                    </View>
                                  )}
                                  {question.option_c && (
                                    <View style={[
                                      styles.questionsOrganizedAnswer,
                                      question.correct_answer === 'C' && styles.questionsOrganizedAnswerCorrect
                                    ]}>
                                      <TouchableOpacity
                                        style={styles.questionsOrganizedAnswerLabel}
                                        onPress={() => editingQuestionId === question.id && changeCorrectAnswer(question.id, 'C')}
                                        disabled={editingQuestionId !== question.id}
                                      >
                                        <Text style={[
                                          styles.questionsOrganizedAnswerLabelText,
                                          (editingQuestionId === question.id ? editingQuestionData.correct_answer : question.correct_answer) === 'C' && styles.questionsOrganizedAnswerLabelTextCorrect
                                        ]}>C.</Text>
                                      </TouchableOpacity>
                                      <Text style={[
                                        styles.questionsOrganizedAnswerText,
                                        question.correct_answer === 'C' && styles.questionsOrganizedAnswerTextCorrect
                                      ]}>{question.option_c}</Text>
                                      {question.correct_answer === 'C' && (
                                        <Ionicons name="checkmark-circle" size={16} color="#ef4444" />
                                      )}
                                    </View>
                                  )}
                                  {question.option_d && (
                                    <View style={[
                                      styles.questionsOrganizedAnswer,
                                      question.correct_answer === 'D' && styles.questionsOrganizedAnswerCorrect
                                    ]}>
                                      <TouchableOpacity
                                        style={styles.questionsOrganizedAnswerLabel}
                                        onPress={() => editingQuestionId === question.id && changeCorrectAnswer(question.id, 'D')}
                                        disabled={editingQuestionId !== question.id}
                                      >
                                        <Text style={[
                                          styles.questionsOrganizedAnswerLabelText,
                                          (editingQuestionId === question.id ? editingQuestionData.correct_answer : question.correct_answer) === 'D' && styles.questionsOrganizedAnswerLabelTextCorrect
                                        ]}>D.</Text>
                                      </TouchableOpacity>
                                      <Text style={[
                                        styles.questionsOrganizedAnswerText,
                                        question.correct_answer === 'D' && styles.questionsOrganizedAnswerTextCorrect
                                      ]}>{question.option_d}</Text>
                                      {question.correct_answer === 'D' && (
                                        <Ionicons name="checkmark-circle" size={16} color="#ef4444" />
                                      )}
                                    </View>
                                  )}
                                </View>
                              </View>
                            )}
                          </LinearGradient>
                        </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.questionsEmptySection}>
                      <Ionicons name="checkmark-circle-outline" size={32} color="rgba(239, 68, 68, 0.3)" />
                      <Text style={styles.questionsEmptyText}>No Post Test questions found</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Rename Question Set Modal */}
      <Modal
        visible={showRenameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelRename}
      >
        <View style={styles.renameModalOverlay}>
          <View style={styles.renameModalContainer}>
            <View style={styles.renameModalHeader}>
              <Ionicons name="pencil" size={24} color="#8b5cf6" />
              <Text style={styles.renameModalTitle}>Rename Question Set</Text>
            </View>
            
            <Text style={styles.renameModalSubtitle}>
              Rename "{renamingSetName}" to a new name
            </Text>
            
            <TextInput
              style={styles.renameModalInput}
              placeholder="Enter new question set name"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={newSetName}
              onChangeText={setNewSetName}
              autoFocus={true}
            />
            
            <View style={styles.renameModalButtons}>
              <TouchableOpacity
                style={[styles.renameModalButton, styles.renameCancelButton]}
                onPress={handleCancelRename}
              >
                <Text style={styles.renameCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.renameModalButton, styles.renameConfirmButton]}
                onPress={handleConfirmRename}
                disabled={!newSetName.trim() || newSetName.trim() === renamingSetName}
              >
                <Text style={styles.renameConfirmButtonText}>Rename</Text>
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
  animatedGradient: {
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
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 255, 136, 0.4)',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  backButton: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
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
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 24,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 24,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  bulkActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  bulkActionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  bulkActionsButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 24,
  },
  bulkActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  questionsContainer: {
    flex: 1,
  },
  questionsList: {
    gap: 24,
  },
  questionCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedQuestionCard: {
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  questionCardGradient: {
    padding: 24,
  },
  questionCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  questionCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  questionTypeIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  questionCardInfo: {
    flex: 1,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 16,
    marginBottom: 24,
  },
  questionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  difficultyBadge: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  difficultyText: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoryBadge: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  questionCardActions: {
    flexDirection: 'row',
    gap: 24,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  questionCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionDate: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  questionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 24,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 24,
    marginBottom: 24,
  },
  noDataSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Section Title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  // Main Actions Section
  mainActionsContainer: {
    marginBottom: 24,
  },
  mainActionsGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  mainActionCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  mainActionIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  mainActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  mainActionSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Assessment Section
  assessmentSection: {
    marginBottom: 24,
  },
  assessmentGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  assessmentCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  assessmentIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  assessmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  assessmentSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  // Settings Section
  settingsSection: {
    marginBottom: 24,
  },
  settingsGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  settingsCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  settingsSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  // Preview Modal Styles
  previewModalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  previewModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  previewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 136, 0.3)',
  },
  previewCloseButton: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  previewEditButton: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.4)',
  },
  previewModalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  previewQuestionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewQuestionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    lineHeight: 16,
  },
  previewMalayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 16,
    marginBottom: 24,
  },
  previewEnglishText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#b0b0b0',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  previewAnswerChoices: {
    gap: 24,
  },
  previewAnswerChoice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'flex-start',
  },
  previewCorrectAnswer: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  previewAnswerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00d4ff',
    marginRight: 24,
    minWidth: 24,
  },
  previewAnswerText: {
    flex: 1,
  },
  previewAnswerTextContent: {
    fontSize: 16,
    color: '#d0d0d0',
    lineHeight: 16,
    marginBottom: 24,
  },
  previewMalayAnswer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 16,
    marginBottom: 24,
  },
  previewEnglishAnswer: {
    fontSize: 16,
    fontWeight: '400',
    color: '#b0b0b0',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  previewDetailsGrid: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewDetailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  previewDetailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'right',
    flex: 1,
    marginLeft: 24,
  },
  previewExplanationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewExplanationText: {
    fontSize: 16,
    color: '#d0d0d0',
    lineHeight: 16,
  },
  // Clean Answer Choice Styles
  cleanAnswerChoices: {
    gap: 24,
  },
  cleanAnswerChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cleanAnswerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00d4ff',
    marginRight: 24,
    minWidth: 24,
  },
  cleanAnswerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cleanAnswerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  moreInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    gap: 24,
  },
  moreInfoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#00d4ff',
  },
  // Category Cards Styles
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    gap: 24,
  },
  categoryCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  categoryCardGradient: {
    padding: 24,
    alignItems: 'center',
    minHeight: 24,
    justifyContent: 'center',
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
    textAlign: 'center',
  },
  categorySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 16,
  },
  categoryCount: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    textAlign: 'center',
  },
  // BLS Cards Styles
  mainCardsContainer: {
    gap: 24,
  },
  blsCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  blsCardGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  blsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  blsCardIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  blsCardTitleContainer: {
    flex: 1,
  },
  blsCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 24,
  },
  blsCardSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  blsCardActions: {
    gap: 24,
  },
  blsActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  blsActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  // Elegant Action Cards Styles
  elegantActionsContainer: {
    marginTop: 24,
    gap: 24,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 24,
  },
  elegantActionCard: {
    flex: 1,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  elegantIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  elegantActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  elegantActionSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
  elegantSettingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  elegantSettingsContent: {
    flex: 1,
    marginLeft: 24,
  },
  elegantSettingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  elegantSettingsSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
  },
  // Questions List Modal Styles
  questionsModalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  questionsModalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  questionsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(34, 197, 94, 0.3)',
  },
  questionsCloseButton: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionsModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  questionsUploadButton: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  questionsModalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  questionsSearchContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 24,
  },
  questionsSearchInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  questionsFilterButton: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  questionsFiltersContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionsFilterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
  },
  questionsFiltersRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  questionsFilterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  questionsFilterChipActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  questionsFilterChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  questionsFilterChipTextActive: {
    color: '#22c55e',
  },
  questionsClearFiltersButton: {
    alignSelf: 'flex-start',
    paddingVertical: 24,
  },
  questionsClearFiltersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  questionsNoSetsText: {
    color: '#cccccc',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  questionsLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  questionsLoadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  questionsListContainer: {
    gap: 24,
  },
  questionsListItem: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questionsListItemSelected: {
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  questionsListItemGradient: {
    padding: 24,
  },
  questionsListItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  questionsListItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  questionsListItemIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  questionsListItemInfo: {
    flex: 1,
  },
  questionsListItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 16,
    marginBottom: 24,
  },
  questionsListItemMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  questionsListItemBadge: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  questionsListItemBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  questionsListItemPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  questionsListItemActions: {
    flexDirection: 'row',
    gap: 24,
  },
  questionsListItemActionButton: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  questionsNoDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  questionsNoDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 24,
    marginBottom: 24,
  },
  questionsNoDataSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Organized Questions Styles
  questionsOrganizedContainer: {
    gap: 24,
  },
  questionsSection: {
    gap: 24,
  },
  questionsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionsSectionIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  questionsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  questionsSectionCount: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  questionsSectionList: {
    gap: 24,
  },
  questionsOrganizedItem: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  questionsOrganizedItemGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionsOrganizedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  questionsOrganizedLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  questionsOrganizedNumber: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  questionsOrganizedInfo: {
    flex: 1,
  },
  questionsOrganizedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 16,
    marginBottom: 24,
  },
  questionsOrganizedMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  questionsOrganizedBadge: {
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  questionsOrganizedBadgeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  questionsOrganizedPoints: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  questionsOrganizedActions: {
    flexDirection: 'row',
    gap: 24,
  },
  questionsOrganizedActionButton: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  questionsOrganizedAnswers: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionsOrganizedAnswersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  questionsOrganizedAnswersList: {
    gap: 24,
  },
  questionsOrganizedAnswer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionsOrganizedAnswerCorrect: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  questionsOrganizedAnswerLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    marginRight: 24,
    minWidth: 24,
  },
  questionsOrganizedAnswerLabelCorrect: {
    color: '#22c55e',
  },
  questionsOrganizedAnswerText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    flex: 1,
    lineHeight: 16,
  },
  questionsOrganizedAnswerTextCorrect: {
    color: '#ffffff',
    fontWeight: '600',
  },
  questionsEmptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  questionsEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 24,
  },
  questionsBilingualContainer: {
    marginBottom: 4,
  },
  questionsOrganizedTextEnglish: {
    fontSize: 16,
    color: '#888888',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 16,
  },
  questionsBilingualAnswerContainer: {
    flex: 1,
  },
  questionsOrganizedAnswerTextEnglish: {
    fontSize: 16,
    color: '#888888',
    fontStyle: 'italic',
    marginTop: 2,
    lineHeight: 16,
  },
  questionsEditInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 8,
  },
  questionsEditInputEnglish: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 10,
    color: '#888888',
    fontSize: 16,
    fontStyle: 'italic',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 4,
  },
  questionsEditAnswerInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    padding: 8,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 4,
    flex: 1,
  },
  questionsEditAnswerInputEnglish: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    padding: 6,
    color: '#888888',
    fontSize: 16,
    fontStyle: 'italic',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 2,
    flex: 1,
  },
  questionsEditAnswerInputCorrect: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: '#22c55e',
  },
  questionsOrganizedAnswerLabelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  questionsOrganizedAnswerLabelTextCorrect: {
    color: '#22c55e',
  },
  // Question Set Rename Styles
  questionsFilterChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    marginBottom: 24,
  },
  questionsFilterRenameButton: {
    marginLeft: 24,
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  // Rename Modal Styles
  renameModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  renameModalContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  renameModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 24,
  },
  renameModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  renameModalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    lineHeight: 16,
  },
  renameModalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 24,
  },
  renameModalButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  renameModalButton: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  renameCancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  renameConfirmButton: {
    backgroundColor: '#8b5cf6',
  },
  renameCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  renameConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
