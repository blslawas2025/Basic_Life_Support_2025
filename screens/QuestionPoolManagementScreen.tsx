import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, Alert, TextInput, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { QuestionPoolService, QuestionPool } from "../services/QuestionPoolService";
import { Question } from "../types/Question";

interface QuestionPoolManagementScreenProps {
  onBack: () => void;
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

export default function QuestionPoolManagementScreen({ onBack }: QuestionPoolManagementScreenProps) {
  const [questionPools, setQuestionPools] = useState<QuestionPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pre_test' | 'post_test'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPool, setEditingPool] = useState<QuestionPool | null>(null);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedPoolQuestions, setSelectedPoolQuestions] = useState<Question[]>([]);
  const [selectedPoolName, setSelectedPoolName] = useState('');
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolDescription, setNewPoolDescription] = useState('');
  const [newPoolTestType, setNewPoolTestType] = useState<'pre_test' | 'post_test' | 'both'>('both');
  const [showQuestionSelection, setShowQuestionSelection] = useState(false);
  const [selectedPoolForQuestions, setSelectedPoolForQuestions] = useState<QuestionPool | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [showPoolSettings, setShowPoolSettings] = useState(false);
  const [preTestPoolId, setPreTestPoolId] = useState<string | null>(null);
  const [postTestPoolId, setPostTestPoolId] = useState<string | null>(null);
  const [showPreTestPoolSelector, setShowPreTestPoolSelector] = useState(false);
  const [showPostTestPoolSelector, setShowPostTestPoolSelector] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [poolToDelete, setPoolToDelete] = useState<QuestionPool | null>(null);
  const [assignedPools, setAssignedPools] = useState<{
    preTest: string | null;
    postTest: string | null;
  }>({
    preTest: null,
    postTest: null,
  });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    startAnimations();
    loadQuestionPools();
    loadCurrentPoolAssignments();
  }, []);

  const loadCurrentPoolAssignments = async () => {
    try {
      // Load current pre-test pool assignment
      const preTestPool = await QuestionPoolService.getAssignedPool('pre_test');
      if (preTestPool) {
        setPreTestPoolId(preTestPool.id);
      }
      
      // Load current post-test pool assignment
      const postTestPool = await QuestionPoolService.getAssignedPool('post_test');
      if (postTestPool) {
        setPostTestPoolId(postTestPool.id);
      }
    } catch (error) {
      console.error('Error loading current pool assignments:', error);
    }
  };

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

  const loadQuestionPools = async () => {
    try {
      setIsLoading(true);
      const pools = await QuestionPoolService.getAllQuestionPools();
      setQuestionPools(pools);
      
      // Auto-sync: Create pools for question sets that don't have pools yet
      await syncQuestionSetsWithPools();
    } catch (error) {
      console.error('Error loading question pools:', error);
      Alert.alert('Error', 'Failed to load question pools');
    } finally {
      setIsLoading(false);
    }
  };

  const syncQuestionSetsWithPools = async () => {
    try {
      // Get all questions with tags
      const { QuestionService } = await import('../services/QuestionService');
      const allQuestions = await QuestionService.getAllQuestions();
      
      // Extract unique question set names from tags
      const questionSetNames = new Set<string>();
      allQuestions.forEach(question => {
        if (question.tags && Array.isArray(question.tags)) {
          question.tags.forEach(tag => {
            if (tag && typeof tag === 'string' && tag.trim()) {
              questionSetNames.add(tag.trim());
            }
          });
        }
      });
      
      // Check which question sets don't have pools yet
      const existingPoolNames = questionPools.map(pool => pool.name);
      const missingPools = Array.from(questionSetNames).filter(setName => 
        !existingPoolNames.includes(setName)
      );
      
      let createdPools = 0;
      
      // Create pools for missing question sets
      for (const setName of missingPools) {
        try {
          // Get questions for this set
          const setQuestions = allQuestions.filter(question => 
            question.tags && question.tags.includes(setName)
          );
          
          if (setQuestions.length > 0) {
            // Determine test type based on questions
            const testTypes = [...new Set(setQuestions.map(q => q.test_type))];
            const poolTestType = testTypes.length === 1 ? testTypes[0] : 'both';
            
            // Create the pool
            const newPool = await QuestionPoolService.createQuestionPool(
              setName,
              `Auto-generated pool for ${setName} (${setQuestions.length} questions)`,
              poolTestType,
              setQuestions.map(q => q.id),
              'admin',
              [setName.toLowerCase().replace(/\s+/g, '-')]
            );
            
            // Add to local state
            setQuestionPools(prev => [...prev, newPool]);
            createdPools++;
          }
        } catch (error) {
          console.warn(`Failed to create pool for ${setName}:`, error);
        }
      }
      
      // Show success message if pools were created
      if (createdPools > 0) {
        Alert.alert(
          'Auto-Sync Complete', 
          `Created ${createdPools} new question pool${createdPools > 1 ? 's' : ''} from existing question sets!`
        );
      } else if (missingPools.length === 0) {
        Alert.alert('Sync Complete', 'All question sets already have pools!');
      }
    } catch (error) {
      console.warn('Failed to sync question sets with pools:', error);
      Alert.alert('Sync Error', 'Failed to sync question sets with pools');
    }
  };

  const handleCreatePool = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingPool(null);
    setNewPoolName('');
    setNewPoolDescription('');
    setNewPoolTestType('both');
    setShowCreateModal(true);
  };

  const handleSavePool = async () => {
    if (!newPoolName.trim()) {
      Alert.alert('Error', 'Please enter a pool name');
      return;
    }

    try {
      if (editingPool) {
        // Update existing pool
        const updatedPool = await QuestionPoolService.updateQuestionPool(editingPool.id, {
          name: newPoolName.trim(),
          description: newPoolDescription.trim(),
          testType: newPoolTestType,
        });

        if (updatedPool) {
          setQuestionPools(prev => 
            prev.map(pool => pool.id === editingPool.id ? updatedPool : pool)
          );
          setShowCreateModal(false);
          Alert.alert('Success', 'Question pool updated successfully!');
        }
      } else {
        // Create a new pool with the form data
        const newPool = await QuestionPoolService.createQuestionPool(
          newPoolName.trim(),
          newPoolDescription.trim(),
          newPoolTestType,
          [], // Empty question IDs for now - questions will be added later
          'admin', // Created by admin
          [] // No tags for now
        );

        // Add the new pool to the list
        setQuestionPools(prev => [...prev, newPool]);
        setShowCreateModal(false);
        
        Alert.alert('Success', 'Question pool created successfully!');
      }
    } catch (error) {
      console.error('Error saving pool:', error);
      Alert.alert('Error', `Failed to ${editingPool ? 'update' : 'create'} question pool`);
    }
  };

  const handleEditPool = (pool: QuestionPool) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingPool(pool);
    setNewPoolName(pool.name);
    setNewPoolDescription(pool.description);
    setNewPoolTestType(pool.testType);
    setShowCreateModal(true);
  };

  const handleDeletePool = (pool: QuestionPool) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Show custom confirmation modal
    setPoolToDelete(pool);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePool = () => {
    if (!poolToDelete) return;
    
    // Remove the pool from the state
    setQuestionPools(prev => {
      const filtered = prev.filter(p => p.id !== poolToDelete.id);
      return filtered;
    });
    
    // Close modal and reset state
    setShowDeleteConfirm(false);
    setPoolToDelete(null);
    
    // Show success message
    Alert.alert('Success', `Pool "${poolToDelete.name}" deleted successfully!`);
  };

  const cancelDeletePool = () => {
    setShowDeleteConfirm(false);
    setPoolToDelete(null);
  };

  const handleAssignPool = (pool: QuestionPool) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Assign Question Pool',
      `Assign "${pool.name}" to which test type?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Pre Test',
          onPress: async () => {
            const success = await QuestionPoolService.assignPoolToTest('pre_test', pool.id);
            if (success) {
              Alert.alert('Success', `Pool "${pool.name}" assigned to Pre Test!`);
            } else {
              Alert.alert('Error', 'Failed to assign pool to Pre Test');
            }
          }
        },
        {
          text: 'Post Test',
          onPress: async () => {
            const success = await QuestionPoolService.assignPoolToTest('post_test', pool.id);
            if (success) {
              Alert.alert('Success', `Pool "${pool.name}" assigned to Post Test!`);
            } else {
              Alert.alert('Error', 'Failed to assign pool to Post Test');
            }
          }
        },
        {
          text: 'Both',
          onPress: async () => {
            const preSuccess = await QuestionPoolService.assignPoolToTest('pre_test', pool.id);
            const postSuccess = await QuestionPoolService.assignPoolToTest('post_test', pool.id);
            if (preSuccess && postSuccess) {
              Alert.alert('Success', `Pool "${pool.name}" assigned to both Pre Test and Post Test!`);
            } else {
              Alert.alert('Error', 'Failed to assign pool to both tests');
            }
          }
        },
      ]
    );
  };

  const handleTogglePoolStatus = async (pool: QuestionPool) => {
    try {
      await QuestionPoolService.updateQuestionPool(pool.id, {
        isActive: !pool.isActive,
      });
      await loadQuestionPools();
    } catch (error) {
      Alert.alert('Error', 'Failed to update question pool status');
    }
  };

  const handleViewQuestions = async (pool: QuestionPool) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const questions = await QuestionPoolService.getQuestionsForPool(pool.id);
      setSelectedPoolQuestions(questions);
      setSelectedPoolName(pool.name);
      setShowQuestionsModal(true);
    } catch (error) {
      console.error('Error loading pool questions:', error);
      Alert.alert('Error', 'Failed to load questions for this pool');
    }
  };

  const handleSelectQuestions = async (pool: QuestionPool) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Load available questions based on pool test type
      const { QuestionService } = await import('../services/QuestionService');
      let questions: Question[] = [];
      
      if (pool.testType === 'pre_test') {
        questions = await QuestionService.getQuestionsByTestType('pre_test');
      } else if (pool.testType === 'post_test') {
        questions = await QuestionService.getQuestionsByTestType('post_test');
      } else {
        // For 'both', get all questions
        questions = await QuestionService.getAllQuestions();
      }
      
      setAvailableQuestions(questions);
      setSelectedPoolForQuestions(pool);
      setSelectedQuestionIds(pool.questionIds); // Pre-select current questions
      setShowQuestionSelection(true);
    } catch (error) {
      console.error('Error loading questions for selection:', error);
      Alert.alert('Error', 'Failed to load questions for selection');
    }
  };

  const handleSaveQuestionSelection = async () => {
    if (!selectedPoolForQuestions) return;

    try {
      // Update the pool with selected questions
      const updatedPool = await QuestionPoolService.updateQuestionPool(selectedPoolForQuestions.id, {
        questionIds: selectedQuestionIds,
      });

      if (updatedPool) {
        setQuestionPools(prev => 
          prev.map(pool => pool.id === selectedPoolForQuestions.id ? updatedPool : pool)
        );
        setShowQuestionSelection(false);
        Alert.alert('Success', 'Questions updated for this pool!');
      }
    } catch (error) {
      console.error('Error updating pool questions:', error);
      Alert.alert('Error', 'Failed to update questions for this pool');
    }
  };

  const handleToggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handlePoolSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowPoolSettings(true);
  };

  const handlePreTestPoolSelect = (poolId: string) => {
    setPreTestPoolId(poolId);
    setShowPreTestPoolSelector(false);
  };

  const handlePostTestPoolSelect = (poolId: string) => {
    setPostTestPoolId(poolId);
    setShowPostTestPoolSelector(false);
  };

  const getPreTestPoolName = () => {
    const pool = questionPools.find(p => p.id === preTestPoolId);
    return pool ? pool.name : 'Select Pool';
  };

  const getPostTestPoolName = () => {
    const pool = questionPools.find(p => p.id === postTestPoolId);
    return pool ? pool.name : 'Select Pool';
  };

  const getAvailablePoolsForPreTest = () => {
    return questionPools.filter(pool => 
      pool.testType === 'pre_test' || pool.testType === 'both'
    );
  };

  const getAvailablePoolsForPostTest = () => {
    return questionPools.filter(pool => 
      pool.testType === 'post_test' || pool.testType === 'both'
    );
  };

  const handleSavePoolSettings = async () => {
    try {
      // Save pre-test pool assignment
      if (preTestPoolId) {
        await QuestionPoolService.assignPoolToTest('pre_test', preTestPoolId);
      }
      
      // Save post-test pool assignment
      if (postTestPoolId) {
        await QuestionPoolService.assignPoolToTest('post_test', postTestPoolId);
      }
      
      // Update local state
      setAssignedPools({
        preTest: preTestPoolId,
        postTest: postTestPoolId,
      });
      
      Alert.alert('Success', 'Pool settings saved successfully!');
      setShowPoolSettings(false);
    } catch (error) {
      console.error('Error saving pool settings:', error);
      Alert.alert('Error', 'Failed to save pool settings. Please try again.');
    }
  };

  const filteredPools = questionPools.filter(pool => {
    const matchesSearch = pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || pool.testType === filterType || pool.testType === 'both';
    return matchesSearch && matchesFilter;
  });

  const renderPoolCard = (pool: QuestionPool) => (
    <Animated.View
      key={pool.id}
      style={[
        styles.poolCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <LinearGradient
        colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
        style={styles.poolCardGradient}
      >
        <View style={styles.poolHeader}>
          <View style={styles.poolTitleContainer}>
            <Text style={styles.poolName}>{pool.name}</Text>
            <View style={styles.poolStatusContainer}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: pool.isActive ? '#00ff88' : '#ff6b6b' }
              ]}>
                <Text style={styles.statusText}>
                  {pool.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.poolActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditPool(pool)}
            >
              <Ionicons name="pencil" size={getResponsiveSize(16, 18, 20)} color="#667eea" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleTogglePoolStatus(pool)}
            >
              <Ionicons 
                name={pool.isActive ? "pause" : "play"} 
                size={getResponsiveSize(16, 18, 20)} 
                color={pool.isActive ? "#ffaa00" : "#00ff88"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleViewQuestions(pool)}
            >
              <Ionicons name="eye" size={getResponsiveSize(16, 18, 20)} color="#00d4ff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSelectQuestions(pool)}
            >
              <Ionicons name="list" size={getResponsiveSize(16, 18, 20)} color="#8b5cf6" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.assignPoolActionButton]}
              onPress={() => handleAssignPool(pool)}
              activeOpacity={0.8}
            >
              <Ionicons name="link" size={getResponsiveSize(16, 18, 20)} color="#00ff88" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                handleDeletePool(pool);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash" size={getResponsiveSize(16, 18, 20)} color="#ff6b6b" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.poolDescription}>{pool.description}</Text>
        
        <View style={styles.poolDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="document-text" size={getResponsiveSize(14, 16, 18)} color="#667eea" />
            <Text style={styles.detailText}>{pool.questionIds.length} questions</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="flag" size={getResponsiveSize(14, 16, 18)} color="#667eea" />
            <Text style={styles.detailText}>
              {pool.testType === 'both' ? 'Pre & Post' : pool.testType === 'pre_test' ? 'Pre Test' : 'Post Test'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="time" size={getResponsiveSize(14, 16, 18)} color="#667eea" />
            <Text style={styles.detailText}>
              {new Date(pool.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.poolTags}>
          {pool.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <View style={styles.loadingContent}>
          <Ionicons name="library" size={getResponsiveSize(48, 56, 64)} color="#667eea" />
          <Text style={styles.loadingText}>Loading Question Pools...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <Animated.View style={[styles.header, { transform: [{ scale: fadeAnim }] }]}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={getResponsiveSize(24, 26, 28)} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Question Pools</Text>
            <Text style={styles.headerSubtitle}>Manage question sets for tests</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.syncButton}
              onPress={syncQuestionSetsWithPools}
            >
              <Ionicons name="refresh" size={getResponsiveSize(24, 26, 28)} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handlePoolSettings}
            >
              <Ionicons name="settings" size={getResponsiveSize(24, 26, 28)} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreatePool}
            >
              <Ionicons name="add" size={getResponsiveSize(24, 26, 28)} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={getResponsiveSize(20, 22, 24)} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search question pools..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.activeFilter]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'pre_test' && styles.activeFilter]}
            onPress={() => setFilterType('pre_test')}
          >
            <Text style={[styles.filterText, filterType === 'pre_test' && styles.activeFilterText]}>
              Pre Test
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'post_test' && styles.activeFilter]}
            onPress={() => setFilterType('post_test')}
          >
            <Text style={[styles.filterText, filterType === 'post_test' && styles.activeFilterText]}>
              Post Test
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredPools.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={getResponsiveSize(64, 72, 80)} color="#666" />
            <Text style={styles.emptyTitle}>No Question Pools Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first question pool to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={handleCreatePool}
              >
                <Ionicons name="add" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
                <Text style={styles.createFirstButtonText}>Create Question Pool</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredPools.map(renderPoolCard)
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Ionicons name="close" size={getResponsiveSize(24, 26, 28)} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingPool ? 'Edit Question Pool' : 'Create Question Pool'}
            </Text>
            <View style={styles.modalPlaceholder} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              {editingPool ? 'Update the question pool details' : 'Set up a new question pool for your tests'}
            </Text>
            
            {/* This would contain the form for creating/editing pools */}
            <View style={styles.modalForm}>
            <Text style={styles.formLabel}>Pool Name</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter pool name"
              value={editingPool?.name || newPoolName}
              onChangeText={editingPool ? undefined : setNewPoolName}
              editable={!editingPool}
            />
            
            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              placeholder="Enter pool description"
              multiline
              numberOfLines={3}
              value={editingPool?.description || newPoolDescription}
              onChangeText={editingPool ? undefined : setNewPoolDescription}
              editable={!editingPool}
            />
            
            <Text style={styles.formLabel}>Test Type</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => setNewPoolTestType('pre_test')}
              >
                <Ionicons 
                  name={newPoolTestType === 'pre_test' ? "radio-button-on" : "radio-button-off"} 
                  size={getResponsiveSize(20, 22, 24)} 
                  color="#667eea" 
                />
                <Text style={styles.radioText}>Pre Test Only</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => setNewPoolTestType('post_test')}
              >
                <Ionicons 
                  name={newPoolTestType === 'post_test' ? "radio-button-on" : "radio-button-off"} 
                  size={getResponsiveSize(20, 22, 24)} 
                  color="#667eea" 
                />
                <Text style={styles.radioText}>Post Test Only</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => setNewPoolTestType('both')}
              >
                <Ionicons 
                  name={newPoolTestType === 'both' ? "radio-button-on" : "radio-button-off"} 
                  size={getResponsiveSize(20, 22, 24)} 
                  color="#667eea" 
                />
                <Text style={styles.radioText}>Both Pre & Post</Text>
              </TouchableOpacity>
            </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSavePool}
            >
              <Text style={styles.saveButtonText}>
                {editingPool ? 'Update Pool' : 'Create Pool'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Questions Modal */}
      <Modal
        visible={showQuestionsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowQuestionsModal(false)}
            >
              <Ionicons name="close" size={getResponsiveSize(24, 26, 28)} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Questions in {selectedPoolName}</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              {selectedPoolQuestions.length} questions found in this pool
            </Text>
            
            {selectedPoolQuestions.length === 0 ? (
              <View style={styles.emptyQuestionsContainer}>
                <Ionicons name="help-circle-outline" size={getResponsiveSize(64, 72, 80)} color="#666" />
                <Text style={styles.emptyQuestionsTitle}>No Questions Found</Text>
                <Text style={styles.emptyQuestionsSubtitle}>
                  This pool doesn't contain any questions yet.
                </Text>
              </View>
            ) : (
              selectedPoolQuestions.map((question, index) => (
                <View key={question.id} style={styles.questionCard}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>Q{index + 1}</Text>
                    <View style={styles.questionMeta}>
                      <Text style={styles.questionCategory}>{question.category || 'Uncategorized'}</Text>
                      <Text style={styles.questionDifficulty}>
                        Level {question.difficulty_level || 'N/A'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.questionText}>
                    {question.question_text || question.question_text_en || 'No question text available'}
                  </Text>
                  
                  <View style={styles.questionOptions}>
                    <Text style={styles.optionText}>
                      A) {question.option_a || question.option_a_en || 'N/A'}
                    </Text>
                    <Text style={styles.optionText}>
                      B) {question.option_b || question.option_b_en || 'N/A'}
                    </Text>
                    <Text style={styles.optionText}>
                      C) {question.option_c || question.option_c_en || 'N/A'}
                    </Text>
                    <Text style={styles.optionText}>
                      D) {question.option_d || question.option_d_en || 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.questionFooter}>
                    <Text style={styles.correctAnswer}>
                      Correct Answer: {question.correct_answer || 'N/A'}
                    </Text>
                    <Text style={styles.questionType}>
                      {question.test_type === 'pre_test' ? 'Pre Test' : 'Post Test'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowQuestionsModal(false)}
            >
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Question Selection Modal */}
      <Modal
        visible={showQuestionSelection}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowQuestionSelection(false)}
            >
              <Ionicons name="close" size={getResponsiveSize(24, 26, 28)} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Questions for {selectedPoolForQuestions?.name}</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Choose which questions to include in this pool ({selectedQuestionIds.length} selected)
            </Text>
            
            {availableQuestions.length === 0 ? (
              <View style={styles.emptyQuestionsContainer}>
                <Ionicons name="help-circle-outline" size={getResponsiveSize(64, 72, 80)} color="#666" />
                <Text style={styles.emptyQuestionsTitle}>No Questions Available</Text>
                <Text style={styles.emptyQuestionsSubtitle}>
                  No questions found for this test type. Please upload questions first.
                </Text>
              </View>
            ) : (
              availableQuestions.map((question, index) => (
                <TouchableOpacity
                  key={question.id}
                  style={[
                    styles.questionSelectionCard,
                    selectedQuestionIds.includes(question.id) && styles.questionSelectionCardSelected
                  ]}
                  onPress={() => handleToggleQuestionSelection(question.id)}
                >
                  <View style={styles.questionSelectionHeader}>
                    <View style={styles.questionSelectionCheckbox}>
                      <Ionicons 
                        name={selectedQuestionIds.includes(question.id) ? "checkbox" : "square-outline"} 
                        size={getResponsiveSize(20, 22, 24)} 
                        color={selectedQuestionIds.includes(question.id) ? "#00ff88" : "#666"} 
                      />
                    </View>
                    <Text style={styles.questionSelectionNumber}>Q{index + 1}</Text>
                    <View style={styles.questionSelectionMeta}>
                      <Text style={styles.questionSelectionCategory}>{question.category || 'Uncategorized'}</Text>
                      <Text style={styles.questionSelectionDifficulty}>
                        Level {question.difficulty_level || 'N/A'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.questionSelectionText} numberOfLines={2}>
                    {question.question_text || question.question_text_en || 'No question text available'}
                  </Text>
                  
                  <Text style={styles.questionSelectionType}>
                    {question.test_type === 'pre_test' ? 'Pre Test' : 'Post Test'}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowQuestionSelection(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveQuestionSelection}
            >
              <Text style={styles.saveButtonText}>Save Selection</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pool Settings Modal */}
      <Modal
        visible={showPoolSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPoolSettings(false)}
            >
              <Ionicons name="close" size={getResponsiveSize(24, 26, 28)} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Pool Settings</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Configure which pools are used for tests
            </Text>
            
            <View style={styles.settingsCard}>
              <Text style={styles.settingsCardTitle}>Test Pool Assignment</Text>
              <Text style={styles.settingsCardDescription}>
                Select which pools will be used for pre-test and post-test
              </Text>
              
              <View style={styles.poolAssignmentContainer}>
                <Text style={styles.assignmentLabel}>Pre Test Pool:</Text>
                <TouchableOpacity 
                  style={styles.poolSelector}
                  onPress={() => setShowPreTestPoolSelector(true)}
                >
                  <Text style={styles.poolSelectorText}>{getPreTestPoolName()}</Text>
                  <Ionicons name="chevron-down" size={16} color="#667eea" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.poolAssignmentContainer}>
                <Text style={styles.assignmentLabel}>Post Test Pool:</Text>
                <TouchableOpacity 
                  style={styles.poolSelector}
                  onPress={() => setShowPostTestPoolSelector(true)}
                >
                  <Text style={styles.poolSelectorText}>{getPostTestPoolName()}</Text>
                  <Ionicons name="chevron-down" size={16} color="#667eea" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPoolSettings(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSavePoolSettings}
            >
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pre Test Pool Selection Modal */}
      <Modal
        visible={showPreTestPoolSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPreTestPoolSelector(false)}
            >
              <Ionicons name="close" size={getResponsiveSize(24, 26, 28)} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Pre Test Pool</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Choose which pool to use for pre-test
            </Text>
            
            {getAvailablePoolsForPreTest().length === 0 ? (
              <View style={styles.emptyQuestionsContainer}>
                <Ionicons name="help-circle-outline" size={getResponsiveSize(64, 72, 80)} color="#666" />
                <Text style={styles.emptyQuestionsTitle}>No Pools Available</Text>
                <Text style={styles.emptyQuestionsSubtitle}>
                  No pre-test pools found. Create a pool first.
                </Text>
              </View>
            ) : (
              getAvailablePoolsForPreTest().map((pool) => (
                <TouchableOpacity
                  key={pool.id}
                  style={[
                    styles.poolSelectionCard,
                    preTestPoolId === pool.id && styles.poolSelectionCardSelected
                  ]}
                  onPress={() => handlePreTestPoolSelect(pool.id)}
                >
                  <View style={styles.poolSelectionHeader}>
                    <View style={styles.poolSelectionCheckbox}>
                      <Ionicons 
                        name={preTestPoolId === pool.id ? "radio-button-on" : "radio-button-off"} 
                        size={getResponsiveSize(20, 22, 24)} 
                        color={preTestPoolId === pool.id ? "#00ff88" : "#666"} 
                      />
                    </View>
                    <Text style={styles.poolSelectionName}>{pool.name}</Text>
                    <Text style={styles.poolSelectionCount}>{pool.questionIds.length} questions</Text>
                  </View>
                  <Text style={styles.poolSelectionDescription}>{pool.description}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Post Test Pool Selection Modal */}
      <Modal
        visible={showPostTestPoolSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPostTestPoolSelector(false)}
            >
              <Ionicons name="close" size={getResponsiveSize(24, 26, 28)} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Post Test Pool</Text>
            <View style={styles.modalPlaceholder} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Choose which pool to use for post-test
            </Text>
            
            {getAvailablePoolsForPostTest().length === 0 ? (
              <View style={styles.emptyQuestionsContainer}>
                <Ionicons name="help-circle-outline" size={getResponsiveSize(64, 72, 80)} color="#666" />
                <Text style={styles.emptyQuestionsTitle}>No Pools Available</Text>
                <Text style={styles.emptyQuestionsSubtitle}>
                  No post-test pools found. Create a pool first.
                </Text>
              </View>
            ) : (
              getAvailablePoolsForPostTest().map((pool) => (
                <TouchableOpacity
                  key={pool.id}
                  style={[
                    styles.poolSelectionCard,
                    postTestPoolId === pool.id && styles.poolSelectionCardSelected
                  ]}
                  onPress={() => handlePostTestPoolSelect(pool.id)}
                >
                  <View style={styles.poolSelectionHeader}>
                    <View style={styles.poolSelectionCheckbox}>
                      <Ionicons 
                        name={postTestPoolId === pool.id ? "radio-button-on" : "radio-button-off"} 
                        size={getResponsiveSize(20, 22, 24)} 
                        color={postTestPoolId === pool.id ? "#00ff88" : "#666"} 
                      />
                    </View>
                    <Text style={styles.poolSelectionName}>{pool.name}</Text>
                    <Text style={styles.poolSelectionCount}>{pool.questionIds.length} questions</Text>
                  </View>
                  <Text style={styles.poolSelectionDescription}>{pool.description}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && poolToDelete && (
        <Modal
          visible={showDeleteConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelDeletePool}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.deleteConfirmModal}>
              <View style={styles.deleteConfirmHeader}>
                <Ionicons name="warning" size={getResponsiveSize(24, 28, 32)} color="#ff6b6b" />
                <Text style={styles.deleteConfirmTitle}>Delete Question Pool</Text>
              </View>
              
              <Text style={styles.deleteConfirmMessage}>
                Are you sure you want to delete "{poolToDelete.name}"?
              </Text>
              <Text style={styles.deleteConfirmSubMessage}>
                This action cannot be undone.
              </Text>
              
              <View style={styles.deleteConfirmButtons}>
                <TouchableOpacity
                  style={[styles.deleteConfirmButton, styles.cancelButton]}
                  onPress={cancelDeletePool}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.deleteConfirmButton, styles.deleteButton]}
                  onPress={confirmDeletePool}
                  activeOpacity={0.7}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    color: '#ffffff',
    marginTop: getResponsiveSize(16, 18, 20),
  },
  header: {
    paddingTop: getResponsiveSize(50, 60, 70),
    paddingBottom: getResponsiveSize(20, 24, 28),
    paddingHorizontal: getResponsiveSize(20, 24, 28),
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(16, 18, 20),
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    borderRadius: getResponsiveSize(16, 20, 24),
  },
  backButton: {
    marginRight: getResponsiveSize(15, 18, 20),
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: getResponsiveSize(4, 6, 8),
  },
  createButton: {
    width: getResponsiveSize(44, 48, 52),
    height: getResponsiveSize(44, 48, 52),
    borderRadius: getResponsiveSize(22, 24, 26),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    marginBottom: getResponsiveSize(20, 24, 28),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(16, 18, 20),
    paddingVertical: getResponsiveSize(12, 14, 16),
    marginBottom: getResponsiveSize(16, 18, 20),
    gap: getResponsiveSize(12, 14, 16),
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#ffffff',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: getResponsiveSize(8, 10, 12),
  },
  filterButton: {
    paddingHorizontal: getResponsiveSize(16, 18, 20),
    paddingVertical: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(20, 24, 28),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilter: {
    backgroundColor: '#667eea',
  },
  filterText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: getResponsiveSize(20, 24, 28),
  },
  poolCard: {
    marginBottom: getResponsiveSize(16, 18, 20),
  },
  poolCardGradient: {
    borderRadius: getResponsiveSize(16, 20, 24),
    padding: getResponsiveSize(20, 24, 28),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSize(12, 14, 16),
  },
  poolTitleContainer: {
    flex: 1,
    marginRight: getResponsiveSize(12, 14, 16),
  },
  poolName: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  poolStatusContainer: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  statusText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#ffffff',
  },
  poolActions: {
    flexDirection: 'row',
    gap: getResponsiveSize(8, 10, 12),
  },
  actionButton: {
    width: getResponsiveSize(36, 40, 44),
    height: getResponsiveSize(36, 40, 44),
    borderRadius: getResponsiveSize(18, 20, 22),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignPoolActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00ff88',
    shadowColor: '#00ff88',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  poolDescription: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: getResponsiveFontSize(20, 22, 24),
    marginBottom: getResponsiveSize(16, 18, 20),
  },
  poolDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSize(16, 18, 20),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(4, 6, 8),
  },
  detailText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.6)',
  },
  poolTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSize(6, 8, 10),
  },
  tag: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  tagText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#667eea',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(60, 80, 100),
  },
  emptyTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
    marginTop: getResponsiveSize(16, 18, 20),
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  emptySubtitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: getResponsiveSize(24, 28, 32),
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: getResponsiveSize(24, 28, 32),
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(25, 30, 35),
    gap: getResponsiveSize(8, 10, 12),
  },
  createFirstButtonText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: getResponsiveSize(50, 60, 70),
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    paddingBottom: getResponsiveSize(20, 24, 28),
  },
  modalCloseButton: {
    width: getResponsiveSize(40, 44, 48),
    height: getResponsiveSize(40, 44, 48),
    borderRadius: getResponsiveSize(20, 22, 24),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
  },
  modalPlaceholder: {
    width: getResponsiveSize(40, 44, 48),
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: getResponsiveSize(20, 24, 28),
  },
  modalSubtitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: getResponsiveSize(24, 28, 32),
  },
  modalForm: {
    gap: getResponsiveSize(20, 24, 28),
  },
  formLabel: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(16, 18, 20),
    paddingVertical: getResponsiveSize(12, 14, 16),
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#ffffff',
  },
  formTextArea: {
    height: getResponsiveSize(80, 90, 100),
    textAlignVertical: 'top',
  },
  radioGroup: {
    gap: getResponsiveSize(12, 14, 16),
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(12, 14, 16),
  },
  radioText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    paddingVertical: getResponsiveSize(20, 24, 28),
    gap: getResponsiveSize(12, 14, 16),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: getResponsiveSize(16, 18, 20),
    borderRadius: getResponsiveSize(12, 14, 16),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
  },
  saveButton: {
    flex: 1,
    paddingVertical: getResponsiveSize(16, 18, 20),
    borderRadius: getResponsiveSize(12, 14, 16),
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyQuestionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(60, 80, 100),
  },
  emptyQuestionsTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
    marginTop: getResponsiveSize(16, 18, 20),
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  emptyQuestionsSubtitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(16, 18, 20),
    marginBottom: getResponsiveSize(12, 14, 16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(12, 14, 16),
  },
  questionNumber: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#667eea',
  },
  questionMeta: {
    flexDirection: 'row',
    gap: getResponsiveSize(8, 10, 12),
  },
  questionCategory: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#00ff88',
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  questionDifficulty: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#ffaa00',
    backgroundColor: 'rgba(255, 170, 0, 0.2)',
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  questionText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#ffffff',
    lineHeight: getResponsiveFontSize(22, 24, 26),
    marginBottom: getResponsiveSize(12, 14, 16),
  },
  questionOptions: {
    marginBottom: getResponsiveSize(12, 14, 16),
  },
  optionText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: getResponsiveSize(4, 6, 8),
    lineHeight: getResponsiveFontSize(20, 22, 24),
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: getResponsiveSize(8, 10, 12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  correctAnswer: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#00ff88',
    fontWeight: '600',
  },
  questionType: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  headerActions: {
    flexDirection: 'row',
    gap: getResponsiveSize(8, 10, 12),
  },
  syncButton: {
    width: getResponsiveSize(44, 48, 52),
    height: getResponsiveSize(44, 48, 52),
    borderRadius: getResponsiveSize(22, 24, 26),
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: getResponsiveSize(44, 48, 52),
    height: getResponsiveSize(44, 48, 52),
    borderRadius: getResponsiveSize(22, 24, 26),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionSelectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(16, 18, 20),
    marginBottom: getResponsiveSize(12, 14, 16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionSelectionCardSelected: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderColor: '#00ff88',
  },
  questionSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(12, 14, 16),
  },
  questionSelectionCheckbox: {
    marginRight: getResponsiveSize(12, 14, 16),
  },
  questionSelectionNumber: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#667eea',
    marginRight: getResponsiveSize(12, 14, 16),
  },
  questionSelectionMeta: {
    flexDirection: 'row',
    gap: getResponsiveSize(8, 10, 12),
  },
  questionSelectionCategory: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#00ff88',
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  questionSelectionDifficulty: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#ffaa00',
    backgroundColor: 'rgba(255, 170, 0, 0.2)',
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  questionSelectionText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#ffffff',
    lineHeight: getResponsiveFontSize(22, 24, 26),
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  questionSelectionType: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(12, 14, 16),
    alignSelf: 'flex-start',
  },
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(20, 24, 28),
    marginBottom: getResponsiveSize(20, 24, 28),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingsCardTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  settingsCardDescription: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: getResponsiveSize(20, 24, 28),
  },
  poolAssignmentContainer: {
    marginBottom: getResponsiveSize(16, 18, 20),
  },
  assignmentLabel: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  poolSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(8, 10, 12),
    paddingHorizontal: getResponsiveSize(16, 18, 20),
    paddingVertical: getResponsiveSize(12, 14, 16),
  },
  poolSelectorText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#ffffff',
  },
  poolSelectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(16, 18, 20),
    marginBottom: getResponsiveSize(12, 14, 16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  poolSelectionCardSelected: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderColor: '#00ff88',
  },
  poolSelectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  poolSelectionCheckbox: {
    marginRight: getResponsiveSize(12, 14, 16),
  },
  poolSelectionName: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  poolSelectionCount: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  poolSelectionDescription: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: getResponsiveFontSize(20, 22, 24),
  },
  // Delete Confirmation Modal Styles
  deleteConfirmModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: getResponsiveSize(16, 20, 24),
    padding: getResponsiveSize(24, 28, 32),
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  deleteConfirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(16, 20, 24),
    gap: getResponsiveSize(12, 14, 16),
  },
  deleteConfirmTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
  },
  deleteConfirmMessage: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#ffffff',
    lineHeight: getResponsiveFontSize(22, 24, 26),
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  deleteConfirmSubMessage: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: getResponsiveFontSize(20, 22, 24),
    marginBottom: getResponsiveSize(24, 28, 32),
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    gap: getResponsiveSize(12, 14, 16),
    justifyContent: 'flex-end',
  },
  deleteConfirmButton: {
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(8, 10, 12),
    minWidth: getResponsiveSize(80, 90, 100),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  cancelButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
  deleteButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
});
