import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, Alert, TextInput, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useContainerMaxWidth } from "../utils/uiHooks";
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
  const containerMaxWidth = useContainerMaxWidth();
  const [questionPools, setQuestionPools] = useState<QuestionPool[]>([]);
  const [visiblePools, setVisiblePools] = useState<QuestionPool[]>([]);
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
  const [hiddenPoolIds, setHiddenPoolIds] = useState<string[]>([]);
  // Save result modal
  const [showSaveResult, setShowSaveResult] = useState(false);
  const [saveResultTitle, setSaveResultTitle] = useState('');
  const [saveResultMessage, setSaveResultMessage] = useState('');
  const [saveResultType, setSaveResultType] = useState<'success' | 'warning' | 'error'>('success');
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
    // Load hidden pool ids from localStorage first
    try {
      const hidden = localStorage.getItem('hiddenQuestionPoolIds');
      if (hidden) {
        setHiddenPoolIds(JSON.parse(hidden));
      }
    } catch {}
    loadQuestionPools();
    loadCurrentPoolAssignments();
  }, []);

  // Recompute visible pools whenever data or filters change (defensive against stale UI)
  useEffect(() => {
    const nameMatches = (pool: QuestionPool) => {
      const nameLc = (pool.name || '').toLowerCase();
      const descLc = (pool.description || '').toLowerCase();
      return nameLc.includes(searchQuery.toLowerCase()) || descLc.includes(searchQuery.toLowerCase());
    };

    let next: QuestionPool[] = questionPools.filter(nameMatches);

    if (filterType === 'pre_test') {
      next = next.filter(p => p.testType === 'pre_test' || (p.name || '').toLowerCase().includes('pre test'))
                 .filter(p => !((p.name || '').toLowerCase().includes('post test')));
    } else if (filterType === 'post_test') {
      next = next.filter(p => p.testType === 'post_test' || (p.name || '').toLowerCase().includes('post test'))
                 .filter(p => !((p.name || '').toLowerCase().includes('pre test')));
    }

    setVisiblePools(next);
  }, [questionPools, filterType, searchQuery]);

  const loadCurrentPoolAssignments = async () => {
    try {
      console.log('=== Loading Current Pool Assignments ===');
      
      // Load current pre-test pool assignment
      console.log('Loading pre-test pool assignment...');
      const preTestPool = await QuestionPoolService.getAssignedPool('pre_test');
      if (preTestPool) {
        console.log('Found pre-test pool:', preTestPool.name, preTestPool.id);
        setPreTestPoolId(preTestPool.id);
      } else {
        console.log('No pre-test pool assigned');
        setPreTestPoolId(null);
      }
      
      // Load current post-test pool assignment
      console.log('Loading post-test pool assignment...');
      const postTestPool = await QuestionPoolService.getAssignedPool('post_test');
      if (postTestPool) {
        console.log('Found post-test pool:', postTestPool.name, postTestPool.id);
        setPostTestPoolId(postTestPool.id);
      } else {
        console.log('No post-test pool assigned');
        setPostTestPoolId(null);
      }
      
      console.log('Pool assignments loaded successfully');
    } catch (error) {
      console.error('Error loading current pool assignments:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
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
      // Filter out any pools the user chose to hide/delete
      const filtered = pools.filter(p => !hiddenPoolIds.includes(p.id));
      setQuestionPools(filtered);
      setVisiblePools(filtered); // initialize
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
    // Persistently hide this pool so it won't reappear on reload
    try {
      const newHidden = Array.from(new Set([...hiddenPoolIds, poolToDelete.id]));
      setHiddenPoolIds(newHidden);
      localStorage.setItem('hiddenQuestionPoolIds', JSON.stringify(newHidden));
    } catch {}
    
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
      console.log('=== Saving Pool Settings ===');
      console.log('Pre Test Pool ID:', preTestPoolId);
      console.log('Post Test Pool ID:', postTestPoolId);
      
      let successCount = 0;
      let errorCount = 0;
      
      // Save pre-test pool assignment
      if (preTestPoolId) {
        console.log('Saving pre-test pool assignment...');
        const preTestResult = await QuestionPoolService.assignPoolToTest('pre_test', preTestPoolId);
        if (preTestResult) {
          console.log('Pre-test pool assignment saved successfully');
          successCount++;
        } else {
          console.error('Failed to save pre-test pool assignment');
          errorCount++;
        }
      }
      
      // Save post-test pool assignment
      if (postTestPoolId) {
        console.log('Saving post-test pool assignment...');
        const postTestResult = await QuestionPoolService.assignPoolToTest('post_test', postTestPoolId);
        if (postTestResult) {
          console.log('Post-test pool assignment saved successfully');
          successCount++;
        } else {
          console.error('Failed to save post-test pool assignment');
          errorCount++;
        }
      }
      
      // Update local state
      setAssignedPools({
        preTest: preTestPoolId,
        postTest: postTestPoolId,
      });
      
      console.log(`Save completed: ${successCount} successful, ${errorCount} failed`);
      
      if (errorCount === 0) {
        setSaveResultType('success');
        setSaveResultTitle('Success');
        setSaveResultMessage(`Pool settings saved successfully!\n\nPre-test: ${preTestPoolId ? 'Assigned' : 'Not assigned'}\nPost-test: ${postTestPoolId ? 'Assigned' : 'Not assigned'}`);
        setShowSaveResult(true);
        setShowPoolSettings(false);
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
      } else if (successCount > 0) {
        setSaveResultType('warning');
        setSaveResultTitle('Partial Success');
        setSaveResultMessage(`Some pool settings were saved, but ${errorCount} failed. Please try again.`);
        setShowSaveResult(true);
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      } else {
        setSaveResultType('error');
        setSaveResultTitle('Error');
        setSaveResultMessage('Failed to save pool settings. Please check your database connection and try again.');
        setShowSaveResult(true);
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
      }
    } catch (error) {
      console.error('Error saving pool settings:', error);
      setSaveResultType('error');
      setSaveResultTitle('Error');
      setSaveResultMessage(`Failed to save pool settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowSaveResult(true);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
    }
  };

  const filteredPools = questionPools.filter(pool => {
    const nameLc = pool.name.toLowerCase();
    const descLc = pool.description.toLowerCase();
    const matchesSearch = nameLc.includes(searchQuery.toLowerCase()) || descLc.includes(searchQuery.toLowerCase());

    if (filterType === 'pre_test') {
      const tagsLc = (pool.tags || []).map(t => (t || '').toLowerCase());
      const isPre = pool.testType === 'pre_test' || nameLc.includes('pre test') || tagsLc.includes('pre-test');
      const isExplicitPost = nameLc.includes('post test');
      return matchesSearch && isPre && !isExplicitPost;
    }
    if (filterType === 'post_test') {
      const tagsLc = (pool.tags || []).map(t => (t || '').toLowerCase());
      const isPost = pool.testType === 'post_test' || nameLc.includes('post test') || tagsLc.includes('post-test');
      const isExplicitPre = nameLc.includes('pre test');
      return matchesSearch && isPost && !isExplicitPre;
    }
    // All tab -> show everything
    return matchesSearch;
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
              <Ionicons name="pencil" size={24} color="#667eea" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleTogglePoolStatus(pool)}
            >
              <Ionicons 
                name={pool.isActive ? "pause" : "play"} 
                size={24} 
                color={pool.isActive ? "#ffaa00" : "#00ff88"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleViewQuestions(pool)}
            >
              <Ionicons name="eye" size={24} color="#00d4ff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSelectQuestions(pool)}
            >
              <Ionicons name="list" size={24} color="#8b5cf6" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.assignPoolActionButton]}
              onPress={() => handleAssignPool(pool)}
              activeOpacity={0.8}
            >
              <Ionicons name="link" size={24} color="#00ff88" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                handleDeletePool(pool);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash" size={24} color="#ff6b6b" />
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.poolDescription}>{pool.description}</Text>
        
        <View style={styles.poolDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="document-text" size={24} color="#667eea" />
            <Text style={styles.detailText}>{pool.questionIds.length} questions</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="flag" size={24} color="#667eea" />
            <Text style={styles.detailText}>
              {pool.testType === 'both' ? 'Pre & Post' : pool.testType === 'pre_test' ? 'Pre Test' : 'Post Test'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="time" size={24} color="#667eea" />
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
          <Ionicons name="library" size={24} color="#667eea" />
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
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
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
              <Ionicons name="refresh" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handlePoolSettings}
            >
              <Ionicons name="settings" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreatePool}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={24} color="#666" />
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={containerMaxWidth ? { maxWidth: containerMaxWidth, alignSelf: 'center', width: '100%' } : undefined}>
        {visiblePools.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={24} color="#666" />
            <Text style={styles.emptyTitle}>No Question Pools Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first question pool to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={handleCreatePool}
              >
                <Ionicons name="add" size={24} color="#ffffff" />
                <Text style={styles.createFirstButtonText}>Create Question Pool</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          visiblePools.map(renderPoolCard)
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
              <Ionicons name="close" size={24} color="#666" />
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
                  size={24} 
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
                  size={24} 
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
                  size={24} 
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

      {/* Save Result Modal (web-safe) */}
      <Modal
        visible={showSaveResult}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSaveResult(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.resultModal, 
            saveResultType === 'success' ? styles.resultSuccess : 
            saveResultType === 'warning' ? styles.resultWarning : styles.resultError]}
          >
            <View style={styles.resultHeader}>
              <Ionicons 
                name={saveResultType === 'success' ? 'checkmark-circle' : saveResultType === 'warning' ? 'alert-circle' : 'close-circle'}
                size={24}
                color={saveResultType === 'success' ? '#10b981' : saveResultType === 'warning' ? '#f59e0b' : '#ef4444'}
              />
              <Text style={styles.resultTitle}>{saveResultTitle}</Text>
            </View>
            <Text style={styles.resultMessage}>{saveResultMessage}</Text>
            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.resultButton} onPress={() => setShowSaveResult(false)}>
                <Text style={styles.resultButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
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
              <Ionicons name="close" size={24} color="#666" />
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
                <Ionicons name="help-circle-outline" size={24} color="#666" />
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
              <Ionicons name="close" size={24} color="#666" />
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
                <Ionicons name="help-circle-outline" size={24} color="#666" />
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
                        size={24} 
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
              <Ionicons name="close" size={24} color="#666" />
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
              <Ionicons name="close" size={24} color="#666" />
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
                <Ionicons name="help-circle-outline" size={24} color="#666" />
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
                        size={24} 
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
              <Ionicons name="close" size={24} color="#666" />
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
                <Ionicons name="help-circle-outline" size={24} color="#666" />
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
                        size={24} 
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
                <Ionicons name="warning" size={24} color="#ff6b6b" />
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
    fontSize: 16,
    color: '#ffffff',
    marginTop: 24,
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
  createButton: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    marginBottom: 24,
    gap: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  filterButton: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilter: {
    backgroundColor: '#667eea',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeFilterText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  poolCard: {
    marginBottom: 24,
  },
  poolCardGradient: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  poolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  poolTitleContainer: {
    flex: 1,
    marginRight: 24,
  },
  poolName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  poolStatusContainer: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  poolActions: {
    flexDirection: 'row',
    gap: 24,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 24,
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
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
    marginBottom: 24,
  },
  poolDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  detailText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  poolTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  tag: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
  },
  tagText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 24,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    gap: 24,
  },
  createFirstButtonText: {
    fontSize: 16,
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
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  modalCloseButton: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalPlaceholder: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  modalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  modalForm: {
    gap: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    fontSize: 16,
    color: '#ffffff',
  },
  formTextArea: {
    height: 24,
    textAlignVertical: 'top',
  },
  radioGroup: {
    gap: 24,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  radioText: {
    fontSize: 16,
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 24,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyQuestionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyQuestionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 24,
  },
  emptyQuestionsSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
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
    color: '#667eea',
  },
  questionMeta: {
    flexDirection: 'row',
    gap: 24,
  },
  questionCategory: {
    fontSize: 16,
    color: '#00ff88',
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
  },
  questionDifficulty: {
    fontSize: 16,
    color: '#ffaa00',
    backgroundColor: 'rgba(255, 170, 0, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
  },
  questionText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 16,
    marginBottom: 24,
  },
  questionOptions: {
    marginBottom: 24,
  },
  optionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    lineHeight: 16,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  correctAnswer: {
    fontSize: 16,
    color: '#00ff88',
    fontWeight: '600',
  },
  questionType: {
    fontSize: 12,
    color: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  syncButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionSelectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
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
    marginBottom: 24,
  },
  questionSelectionCheckbox: {
    marginRight: 24,
  },
  questionSelectionNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#667eea',
    marginRight: 24,
  },
  questionSelectionMeta: {
    flexDirection: 'row',
    gap: 24,
  },
  questionSelectionCategory: {
    fontSize: 16,
    color: '#00ff88',
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
  },
  questionSelectionDifficulty: {
    fontSize: 16,
    color: '#ffaa00',
    backgroundColor: 'rgba(255, 170, 0, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
  },
  questionSelectionText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 16,
    marginBottom: 24,
  },
  questionSelectionType: {
    fontSize: 16,
    color: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingsCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  settingsCardDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  poolAssignmentContainer: {
    marginBottom: 24,
  },
  assignmentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
  },
  poolSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  poolSelectorText: {
    fontSize: 16,
    color: '#ffffff',
  },
  poolSelectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
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
    marginBottom: 24,
  },
  poolSelectionCheckbox: {
    marginRight: 24,
  },
  poolSelectionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  poolSelectionCount: {
    fontSize: 16,
    color: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
  },
  poolSelectionDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  // Delete Confirmation Modal Styles
  deleteConfirmModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  deleteConfirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 24,
  },
  deleteConfirmTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  deleteConfirmMessage: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 16,
    marginBottom: 24,
  },
  deleteConfirmSubMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    marginBottom: 24,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'flex-end',
  },
  deleteConfirmButton: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    minWidth: 24,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Save result modal styles
  resultModal: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff'
  },
  resultMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: 16,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  resultButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resultButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  resultSuccess: {
    borderColor: 'rgba(16,185,129,0.35)'
  },
  resultWarning: {
    borderColor: 'rgba(245,158,11,0.35)'
  },
  resultError: {
    borderColor: 'rgba(239,68,68,0.35)'
  },
});
