import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, Alert, ActivityIndicator, Modal, TextInput, SafeAreaView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { QuestionService } from "../services/QuestionService";
import { SubmissionService, SubmissionSettings } from "../services/SubmissionService";
import { OfflineService } from "../services/OfflineService";
import { CertificateService } from "../services/CertificateService";
import { AnalyticsService } from "../services/AnalyticsService";
import { QuestionPoolService } from "../services/QuestionPoolService";
import { AccessControlService } from "../services/AccessControlService";
import { Question } from "../types/Question";

interface SessionManagementSettings {
  randomQuestionSelection: boolean;
  questionShuffling: boolean;
  progressSaving: boolean;
  sessionRecovery: boolean;
  autoSaveInterval: number;
  maxIncompleteSessions: number;
  sessionTimeout: number;
  allowResumeFromAnywhere: boolean;
  clearProgressOnRetake: boolean;
}

const { width, height } = Dimensions.get('window');

// Responsive design helpers
const isSmallScreen = width < 430; // broaden to include common 390px phones
const isMediumScreen = width >= 430 && width < 768;
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

interface TestInterfaceScreenProps {
  onBack: () => void;
  onShowResults: (results: any) => void;
  onNavigateToPools?: () => void;
  testType: 'pre' | 'post';
  userName: string;
  userId: string;
  courseSessionId?: string;
  isSuperAdmin?: boolean;
  userRole?: 'admin' | 'staff' | 'user';
}

export default function TestInterfaceScreen({ onBack, onShowResults, onNavigateToPools, testType, userName, userId, courseSessionId, isSuperAdmin = false, userRole = 'user' }: TestInterfaceScreenProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{[key: string]: string}>({});
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [isTestCompleted, setIsTestCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate a proper UUID if the userId is not a valid UUID
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // Use a valid UUID for the user
  const validUserId = isValidUUID(userId) ? userId : generateUUID();
  const [submissionSettings, setSubmissionSettings] = useState<SubmissionSettings | null>(null);
  const [sessionSettings, setSessionSettings] = useState<SessionManagementSettings | null>(null);
  const [hasAlreadyTaken, setHasAlreadyTaken] = useState(false);
  const [canRetake, setCanRetake] = useState(false);
  const [retakeReason, setRetakeReason] = useState<string | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<{[key: string]: string[]}>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set());
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showSubmissionConfirm, setShowSubmissionConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState<'primary' | 'secondary' | 'dual'>('primary');
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState<any>(null);
  const [submissionUISettings, setSubmissionUISettings] = useState<any>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedQuestionPool, setSelectedQuestionPool] = useState<string | null>(null);
  const [availableQuestionPools, setAvailableQuestionPools] = useState<any[]>([]);
  const [showPoolSelection, setShowPoolSelection] = useState(false);
  const [accessControlEnabled, setAccessControlEnabled] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessRequestId, setAccessRequestId] = useState<string | null>(null);
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Use shuffled questions if session management is enabled, otherwise use original questions
  const displayQuestions = sessionSettings?.randomQuestionSelection ? shuffledQuestions : questions;
  const currentQuestion = displayQuestions[currentQuestionIndex];

  useEffect(() => {
    startAnimations();
    fetchQuestions();
  }, []);

  // Auto-save progress when offline
  useEffect(() => {
    if (isOffline && questions.length > 0) {
      const saveProgress = async () => {
        const testTypeForAPI = testType === 'pre' ? 'pre_test' : 'post_test';
        await OfflineService.saveProgress({
          userId: validUserId,
          testType: testTypeForAPI,
          courseSessionId,
          answers,
          flaggedQuestions: Array.from(flaggedQuestions),
          skippedQuestions: Array.from(skippedQuestions),
          currentQuestionIndex,
          timeLeft,
          startTime: new Date().toISOString()
        });
      };
      
      const interval = setInterval(saveProgress, 30000); // Save every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isOffline, answers, flaggedQuestions, skippedQuestions, currentQuestionIndex, timeLeft, questions.length]);

  useEffect(() => {
    // Timer countdown
    if (timeLeft > 0 && !isTestCompleted && questions.length > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleSubmitTest();
    }
  }, [timeLeft, isTestCompleted, questions.length]);

  // Shuffle array function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Shuffle question options
  const shuffleQuestionOptions = (question: Question): string[] => {
    const options = ['A', 'B', 'C', 'D'];
    return shuffleArray(options);
  };

  // Apply session management settings to questions
  const applySessionManagement = (questions: Question[]) => {
    let processedQuestions = [...questions];
    
    // Random question selection
    if (sessionSettings?.randomQuestionSelection) {
      processedQuestions = shuffleArray(processedQuestions);
    }
    
    setShuffledQuestions(processedQuestions);
    
    // Shuffle answer options for each question
    if (sessionSettings?.questionShuffling) {
      const shuffledOptionsMap: {[key: string]: string[]} = {};
      processedQuestions.forEach(question => {
        shuffledOptionsMap[question.id] = shuffleQuestionOptions(question);
      });
      setShuffledOptions(shuffledOptionsMap);
    }
  };

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check online status
      const online = await OfflineService.isOnline();
      setIsOffline(!online);
      
      // Load session management settings (for now, using default settings)
      const defaultSessionSettings: SessionManagementSettings = {
        randomQuestionSelection: true,
        questionShuffling: true,
        progressSaving: true,
        sessionRecovery: true,
        autoSaveInterval: 2,
        maxIncompleteSessions: 3,
        sessionTimeout: 24,
        allowResumeFromAnywhere: true,
        clearProgressOnRetake: false,
      };
      setSessionSettings(defaultSessionSettings);
      
      const testTypeForAPI = testType === 'pre' ? 'pre_test' : 'post_test';
      
      let fetchedQuestions: Question[] = [];
      
      if (online) {
        // Online: Try to fetch from server
        try {
          // First check if user has already taken the test
          const hasTaken = await SubmissionService.hasUserTakenTest(validUserId, testTypeForAPI, courseSessionId);
          setHasAlreadyTaken(hasTaken);
          
      // Load submission settings (for now, using default settings)
      const defaultSettings: SubmissionSettings = {
        enableOneTimeSubmission: true,
        singleAttempt: true,
        submissionLock: true,
        progressTracking: true,
        resultsLock: true,
        showResultsAfterSubmission: false,
        adminControlledRetake: true,
        allowRetake: false,
        maxRetakeAttempts: 1,
        retakeCooldownHours: 24,
      };
      setSubmissionSettings(defaultSettings);

      // Load submission UI settings
      const defaultSubmissionUISettings = {
        enableSubmissionConfirmation: true,
        confirmationMessage: "Are you sure you want to submit your test? This action cannot be undone.",
        successMessage: "Terima Kasih, Selamat Maju Jaya!",
        showSuccessMessage: true,
        successMessageDuration: 3,
        enableHapticFeedback: true,
        enableSoundFeedback: true,
      };
      setSubmissionUISettings(defaultSubmissionUISettings);
          
          // If user has already taken the test, check retake eligibility
          if (hasTaken) {
            const retakeCheck = await SubmissionService.canUserRetake(validUserId, testTypeForAPI, defaultSettings, courseSessionId);
            setCanRetake(retakeCheck.canRetake);
            setRetakeReason(retakeCheck.reason || null);
            
            if (!retakeCheck.canRetake) {
              setError(`You have already taken this ${testType} test. ${retakeCheck.reason || 'No retakes allowed.'}`);
              return;
            }
          }
          
          // Check access control first (skip for super admin)
          const settings = await AccessControlService.getSettings();
          setAccessControlEnabled(settings.enableApprovalBasedAccess);
          
          if (!isSuperAdmin && settings.enableApprovalBasedAccess && settings.approvalRequiredFor.includes(testTypeForAPI)) {
            // Get assigned pool for access check
            const assignedPool = await QuestionPoolService.getAssignedPool(testTypeForAPI);
            if (!assignedPool) {
              // Show different messages based on user role
              if (userRole === 'admin' || userRole === 'staff' || isSuperAdmin) {
                setError(`No question pool assigned for ${testType} test. Please assign a pool first.`);
              } else {
                setError(`The ${testType} test is currently not available. Please contact your administrator.`);
              }
              return;
            }
            
            // Check access permission
            const accessCheck = await AccessControlService.hasAccess(validUserId, testTypeForAPI, assignedPool.id);
            
            if (!accessCheck.hasAccess) {
              if (accessCheck.reason?.includes('pending')) {
                setError(`Access request is pending approval. Please wait for admin approval.`);
              } else {
                setError(`Access denied: ${accessCheck.reason}. Please request access first.`);
                setShowAccessRequest(true);
              }
              return;
            }
            
            setAccessRequestId(accessCheck.requestId || null);
            setHasAccess(true);
          }
          
          // Get questions from assigned pool only (or all questions for super admin)
          if (isSuperAdmin) {
            // Super admin can access all questions regardless of pool assignment
            const { QuestionService } = await import('../services/QuestionService');
            fetchedQuestions = await QuestionService.getQuestionsByTestType(testTypeForAPI);
          } else {
            const poolQuestions = await QuestionPoolService.getQuestionsFromAssignedPool(testTypeForAPI);
            
            if (poolQuestions.length > 0) {
              fetchedQuestions = poolQuestions;
            } else {
              // No pool assigned - show error message
              setError(`No question pool assigned for ${testType} test. Please assign a pool first.`);
              return;
            }
          }
          
          if (fetchedQuestions.length === 0) {
            setError(`No ${testType} questions found. Please upload questions first.`);
            return;
          }
          
          // Cache questions for offline use
          await OfflineService.cacheQuestions(fetchedQuestions, testTypeForAPI, courseSessionId);
          
        } catch (serverError) {
          // Fall back to offline cache
          const cachedQuestions = await OfflineService.getCachedQuestions(testTypeForAPI, courseSessionId);
          if (cachedQuestions) {
            fetchedQuestions = cachedQuestions;
            setError('Working offline. Using cached questions.');
          } else {
            throw new Error('No internet connection and no cached questions available.');
          }
        }
      } else {
        // Offline: Use cached questions
        const cachedQuestions = await OfflineService.getCachedQuestions(testTypeForAPI, courseSessionId);
        if (cachedQuestions) {
          fetchedQuestions = cachedQuestions;
          setError('Working offline. Using cached questions.');
        } else {
          throw new Error('No internet connection and no cached questions available. Please connect to internet first to download questions.');
        }
      }
      
      setQuestions(fetchedQuestions);
      
      // Apply session management settings
      applySessionManagement(fetchedQuestions);
      
      // Try to restore offline progress
      if (!online) {
        const savedProgress = await OfflineService.getProgress(validUserId, testTypeForAPI, courseSessionId);
        if (savedProgress) {
          setOfflineProgress(savedProgress);
          setAnswers(savedProgress.answers);
          setFlaggedQuestions(new Set(savedProgress.flaggedQuestions));
          setSkippedQuestions(new Set(savedProgress.skippedQuestions));
          setCurrentQuestionIndex(savedProgress.currentQuestionIndex);
          setTimeLeft(savedProgress.timeLeft);
          setSelectedAnswer(savedProgress.answers[displayQuestions[savedProgress.currentQuestionIndex]?.id] || null);
        }
      }
      
      } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 60) return '#ff4757'; // Red
    if (timeLeft <= 300) return '#ffa502'; // Orange
    if (timeLeft <= 600) return '#ffaa00'; // Yellow
    return '#00ff88'; // Green
  };

  const handleAnswerSelect = (answer: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAnswer(answer);
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
    
    // Remove from skipped questions if user answers
    if (skippedQuestions.has(currentQuestion.id)) {
      setSkippedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentQuestion.id);
        return newSet;
      });
    }
  };

  const handleFlagQuestion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.id)) {
        newSet.delete(currentQuestion.id);
      } else {
        newSet.add(currentQuestion.id);
      }
      return newSet;
    });
  };

  const handleSkipQuestion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSkippedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.add(currentQuestion.id);
      return newSet;
    });
    
    // Clear current answer if skipping
    setSelectedAnswer(null);
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQuestion.id];
      return newAnswers;
    });
    
    // Move to next question
    handleNextQuestion();
  };

  const handleNextQuestion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentQuestionIndex < displayQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(answers[displayQuestions[currentQuestionIndex + 1].id] || null);
    } else {
      handleSubmitTest();
    }
  };

  const handlePreviousQuestion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(answers[displayQuestions[currentQuestionIndex - 1].id] || null);
    }
  };

  const handleReviewMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsReviewMode(true);
    setCurrentQuestionIndex(0);
  };

  const handleExitReviewMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsReviewMode(false);
  };

  const handleRequestAccess = async () => {
    try {
      const testTypeForAPI = testType === 'pre' ? 'pre_test' : 'post_test';
      const assignedPool = await QuestionPoolService.getAssignedPool(testTypeForAPI);
      if (!assignedPool) {
        Alert.alert('Error', 'No pool assigned for this test');
        return;
      }

      const result = await AccessControlService.requestAccess(
        validUserId,
        testTypeForAPI,
        assignedPool.id,
        requestReason.trim() || undefined
      );

      if (result.success) {
        Alert.alert('Success', result.message);
        setShowAccessRequest(false);
        setRequestReason('');
        // Reload the test to check for new access
        fetchQuestions();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error requesting access:', error);
      Alert.alert('Error', 'Failed to request access');
    }
  };

  const handleSubmitTest = async () => {
    // Check if all questions are answered
    if (!areAllQuestionsAnswered()) {
      const stats = getCompletionStats();
      Alert.alert(
        'Incomplete Test',
        `You have answered ${stats.answered} out of ${stats.total} questions. Please answer all questions before submitting.`,
        [
          { text: 'Continue Test', style: 'cancel' },
          { 
            text: 'Review Incomplete', 
            onPress: () => {
              // Find first unanswered question and navigate to it
              const firstUnanswered = displayQuestions.findIndex(q => answers[q.id] === undefined);
              if (firstUnanswered !== -1) {
                setCurrentQuestionIndex(firstUnanswered);
                setSelectedAnswer(null);
              }
            }
          }
        ]
      );
      return;
    }

    // Show confirmation alert if enabled
    if (submissionUISettings?.enableSubmissionConfirmation && !showSubmissionConfirm) {
      Alert.alert(
        'Confirm Submission',
        submissionUISettings.confirmationMessage || "Are you sure you want to submit your test? This action cannot be undone.",
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Submit', 
            style: 'destructive',
            onPress: () => {
              setShowSubmissionConfirm(true);
              handleSubmitTest();
            }
          }
        ]
      );
      return;
    }

    if (!showSubmissionConfirm) {
      setShowSubmissionConfirm(true);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setIsTestCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Calculate score
      const correctAnswers = displayQuestions.filter(q => answers[q.id] === q.correct_answer).length;
      const score = Math.round((correctAnswers / displayQuestions.length) * 100);
      const timeTaken = (30 * 60) - timeLeft; // Calculate time taken
      
      const testTypeForAPI = testType === 'pre' ? 'pre_test' : 'post_test';
      
      if (isOffline) {
        // Save submission for offline sync
        await OfflineService.saveOfflineSubmission({
          userId: validUserId,
          testType: testTypeForAPI,
          courseSessionId,
          score,
          totalQuestions: displayQuestions.length,
          correctAnswers,
          timeTaken,
          answers
        });
        
        } else {
        // Save submission to database
        const submission = await SubmissionService.createSubmission(
          validUserId,
          testTypeForAPI,
          score,
          displayQuestions.length,
          correctAnswers,
          timeTaken,
          courseSessionId
        );
        
        }
      
      // Track access usage if access control is enabled
      if (accessControlEnabled && hasAccess && accessRequestId) {
        try {
          const assignedPool = await QuestionPoolService.getAssignedPool(testTypeForAPI);
          if (assignedPool) {
            const usageResult = await AccessControlService.useAccess(
              validUserId,
              testTypeForAPI,
              assignedPool.id
            );
            
            if (usageResult.expired) {
              }
          }
        } catch (error) {
          console.error('Error tracking access usage:', error);
        }
      }
      
      // Show success message if enabled
      if (submissionUISettings?.showSuccessMessage) {
        setShowSuccessMessage(true);
        
        // Auto-hide success message after duration
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, (submissionUISettings.successMessageDuration || 3) * 1000);
      }

      // Prepare results data
      const testResults = {
        score,
        totalQuestions: displayQuestions.length,
        correctAnswers,
        timeTaken,
        answers,
        questions: displayQuestions,
        testType: testTypeForAPI,
        submittedAt: new Date().toISOString(),
        userName,
        userId: validUserId,
        courseSessionId,
      };

      // Show results based on settings
      const showResults = submissionSettings?.showResultsAfterSubmission || false;
      
      if (showResults) {
        Alert.alert(
          'Test Completed!',
          `Your score: ${score}% (${correctAnswers}/${displayQuestions.length} correct)`,
          [
            {
              text: 'View Detailed Results',
              onPress: () => {
                onShowResults(testResults);
              }
            },
            {
              text: 'Finish',
              onPress: onBack
            }
          ]
        );
      } else {
        Alert.alert(
          'Test Completed!',
          'Your test has been submitted successfully. Results will be available after admin review.',
          [
            {
              text: 'View Results',
              onPress: () => {
                onShowResults(testResults);
              }
            },
            {
              text: 'OK',
              onPress: onBack
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error submitting test:', error);
      setIsSubmitting(false);
      setRetryCount(prev => prev + 1);
      
      if (retryCount < 3) {
        Alert.alert(
          'Submission Failed', 
          'Failed to submit test. Would you like to retry?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => handleSubmitTest() }
          ]
        );
      } else {
        Alert.alert(
          'Submission Failed', 
          'Unable to submit test after multiple attempts. Please check your connection and try again later.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    fetchQuestions();
  };

  // Sync offline submissions when connection is restored
  const syncOfflineSubmissions = async () => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      const pendingSubmissions = await OfflineService.getPendingSubmissions();
      
      for (const submission of pendingSubmissions) {
        try {
          await SubmissionService.createSubmission(
            submission.userId,
            submission.testType,
            submission.score,
            submission.totalQuestions,
            submission.correctAnswers,
            submission.timeTaken,
            submission.courseSessionId
          );
          
          // Mark as synced
          const submissionKey = `${OfflineService['SUBMISSION_PREFIX']}${submission.userId}_${submission.submittedAt}`;
          await OfflineService.markSubmissionSynced(submissionKey);
        } catch (error) {
          console.error('Error syncing submission:', error);
        }
      }
      
      // Remove synced submissions
      await OfflineService.removeSyncedSubmissions();
      
      } catch (error) {
      console.error('Error syncing offline submissions:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Check if all questions are answered
  const areAllQuestionsAnswered = () => {
    return displayQuestions.every(question => answers[question.id] !== undefined);
  };

  // Get completion statistics
  const getCompletionStats = () => {
    const answered = displayQuestions.filter(q => answers[q.id] !== undefined).length;
    const total = displayQuestions.length;
    const flagged = flaggedQuestions.size;
    const skipped = skippedQuestions.size;
    
    return { answered, total, flagged, skipped };
  };

  // Toggle language display
  const toggleLanguage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentLanguage(prev => {
      if (prev === 'primary') return 'secondary';
      if (prev === 'secondary') return 'dual';
      return 'primary';
    });
  };

  // Get question text based on current language
  const getQuestionText = (question: Question) => {
    if (currentLanguage === 'secondary' && question.question_text_en) {
      return question.question_text_en;
    }
    if (currentLanguage === 'dual' && question.question_text_en) {
      return `${question.question_text}\n\n${question.question_text_en}`;
    }
    return question.question_text;
  };

  // Get option text based on current language
  const getOptionText = (question: Question, option: string) => {
    const optionKey = `option_${option.toLowerCase()}` as keyof Question;
    const secondaryKey = `${optionKey}_en` as keyof Question;
    
    if (currentLanguage === 'secondary' && question[secondaryKey]) {
      return question[secondaryKey] as string;
    }
    if (currentLanguage === 'dual' && question[secondaryKey]) {
      return `${question[optionKey]}\n${question[secondaryKey]}`;
    }
    return question[optionKey] as string;
  };

  const getOptionStyle = (option: string) => {
    const isSelected = selectedAnswer === option;
    return [
      styles.optionButton,
      isSelected && styles.selectedOption
    ];
  };

  const getOptionTextStyle = (option: string) => {
    const isSelected = selectedAnswer === option;
    return [
      styles.optionText,
      isSelected && styles.selectedOptionText
    ];
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient 
          colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#0a0a0a"]} 
          style={styles.backgroundGradient}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingText}>Loading {testType === 'pre' ? 'Pre' : 'Post'} Test Questions...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    const isNoPoolError = error.includes('No question pool assigned');
    
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient 
          colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#0a0a0a"]} 
          style={styles.backgroundGradient}
        />
        <View style={styles.errorContainer}>
          <Ionicons 
            name={isNoPoolError ? "library-outline" : "alert-circle"} 
            size={80} 
            color={isNoPoolError ? "#ffaa00" : "#ff4757"} 
          />
          <Text style={styles.errorTitle}>
            {isNoPoolError ? 'No Question Pool Assigned' : 'Error Loading Questions'}
          </Text>
          <Text style={styles.errorText}>{error}</Text>
          
          <View style={styles.errorActions}>
            {isNoPoolError && onNavigateToPools ? (
              <TouchableOpacity 
                style={[styles.retryButton, styles.assignPoolButton]} 
                onPress={onNavigateToPools}
                activeOpacity={0.8}
              >
                <Ionicons name="link" size={20} color="#00ff88" />
                <Text style={[styles.retryButtonText, { color: '#00ff88' }]}>Assign Pool</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.retryButton} onPress={fetchQuestions}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
            {!isNoPoolError && (
              <TouchableOpacity 
                style={[styles.retryButton, styles.requestAccessButton]} 
                onPress={() => setShowAccessRequest(true)}
              >
                <Ionicons name="shield-checkmark" size={20} color="#667eea" />
                <Text style={styles.requestAccessButtonText}>Request Access</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Access Request Modal from error state */}
        <Modal
          visible={showAccessRequest}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.accessRequestModal}>
              <View style={styles.accessRequestHeader}>
                <Ionicons name="shield-checkmark" size={24} color="#667eea" />
                <Text style={styles.accessRequestTitle}>Request Test Access</Text>
              </View>
              <Text style={styles.accessRequestMessage}>
                This test requires approval-based access control. Please provide a reason for requesting access to this test.
              </Text>
              <TextInput
                style={styles.accessRequestInput}
                placeholder="Enter reason for test access..."
                placeholderTextColor="rgba(0, 0, 0, 0.5)"
                value={requestReason}
                onChangeText={setRequestReason}
                multiline
                numberOfLines={3}
              />
              <View style={styles.accessRequestButtons}>
                <TouchableOpacity
                  style={[styles.accessRequestButton, styles.cancelAccessButton]}
                  onPress={() => {
                    setShowAccessRequest(false);
                    setRequestReason('');
                  }}
                >
                  <Text style={styles.cancelAccessButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.accessRequestButton, styles.submitAccessButton]}
                  onPress={handleRequestAccess}
                >
                  <Ionicons name="send" size={24} color="#ffffff" />
                  <Text style={styles.submitAccessButtonText}>Request Access</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // No questions state
  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient 
          colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#0a0a0a"]} 
          style={styles.backgroundGradient}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="help-circle" size={80} color="#ffaa00" />
          <Text style={styles.errorTitle}>No Questions Available</Text>
          <Text style={styles.errorText}>
            No {testType === 'pre' ? 'pre-test' : 'post-test'} questions found. 
            Please upload questions first.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isTestCompleted) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <LinearGradient 
          colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#0a0a0a"]} 
          style={styles.backgroundGradient}
        />
        <View style={styles.completedContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#00ff88" />
          <Text style={styles.completedTitle}>Test Completed!</Text>
          <Text style={styles.completedSubtitle}>Great job on completing the {testType === 'pre' ? 'Pre' : 'Post'} Test</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background */}
      <LinearGradient 
        colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#0a0a0a"]} 
        style={styles.backgroundGradient}
      />

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
        
        <View style={[styles.headerContent, isSmallScreen && styles.headerContentCompact]}>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, isSmallScreen && styles.headerTitleCompact]} numberOfLines={1}>
              {isReviewMode ? 'Review Mode' : (testType === 'pre' ? 'Pre Test' : 'Post Test')}
            </Text>
            <Text style={[styles.headerSubtitle, isSmallScreen && styles.headerSubtitleCompact]} numberOfLines={1}>
              Question {currentQuestionIndex + 1} of {displayQuestions.length}
            </Text>
          </View>
          
          <View style={[styles.headerActions, isSmallScreen && styles.headerActionsCompact]}>
            <View style={[styles.timerAndStatusContainer, isSmallScreen && styles.timerAndStatusContainerCompact]}>
              <View style={[styles.timerContainer, isSmallScreen && styles.timerContainerCompact, { backgroundColor: getTimeColor() + '20' }]}>
                <Ionicons name="time" size={isSmallScreen ? 16 : 24} color={getTimeColor()} />
                <Text style={[styles.timerText, isSmallScreen && styles.timerTextCompact, { color: getTimeColor() }]}>
                  {formatTime(timeLeft)}
                </Text>
              </View>
              {accessControlEnabled && !isSuperAdmin && (
                <View style={[styles.accessControlIndicator, isSmallScreen && styles.accessControlIndicatorCompact]}>
                  <Ionicons name="shield-checkmark" size={isSmallScreen ? 16 : 24} color="#00ff88" />
                  <Text style={styles.accessControlText}>Access Controlled</Text>
                </View>
              )}
              
              {/* Super Admin Indicator */}
              {isSuperAdmin && (
                <View style={[styles.superAdminIndicator, isSmallScreen && styles.superAdminIndicatorCompact]}>
                  <Ionicons name="star" size={isSmallScreen ? 16 : 24} color="#ffd700" />
                  <Text style={styles.superAdminText}>Super Admin</Text>
                </View>
              )}
              
              {/* Offline Status Indicator */}
              {isOffline && (
                <View style={[styles.offlineStatusContainer, isSmallScreen && styles.offlineStatusContainerCompact]}>
                  <Ionicons name="cloud-offline" size={isSmallScreen ? 16 : 24} color="#ff6b6b" />
                  <Text style={styles.offlineStatusText}>Offline</Text>
                </View>
              )}
              
              {/* Sync Status Indicator */}
              {isSyncing && (
                <View style={[styles.syncStatusContainer, isSmallScreen && styles.syncStatusContainerCompact]}>
                  <ActivityIndicator size="small" color="#00d4ff" />
                  <Text style={styles.syncStatusText}>Syncing...</Text>
                </View>
              )}
            </View>
            
            {!isReviewMode && (
              <View style={[styles.questionActions, isSmallScreen && styles.questionActionsCompact]}>
                <TouchableOpacity
                  style={[
                    styles.actionButton, 
                    styles.languageButton,
                    currentLanguage === 'dual' && styles.dualLanguageButton
                  ]}
                  onPress={toggleLanguage}
                >
                  <Ionicons 
                    name={
                      currentLanguage === 'primary' ? "flag" : 
                      currentLanguage === 'secondary' ? "language" : 
                      "globe"
                    } 
                    size={isSmallScreen ? 16 : 24} 
                    color={
                      currentLanguage === 'primary' ? "#00d4ff" : 
                      currentLanguage === 'secondary' ? "#ffaa00" : 
                      "#00ff88"
                    } 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, flaggedQuestions.has(currentQuestion.id) && styles.flaggedButton]}
                  onPress={handleFlagQuestion}
                >
                  <Ionicons 
                    name={flaggedQuestions.has(currentQuestion.id) ? "flag" : "flag-outline"} 
                    size={isSmallScreen ? 16 : 24} 
                    color={flaggedQuestions.has(currentQuestion.id) ? "#ff6b6b" : "#666"} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleSkipQuestion}
                >
                  <Ionicons name="play-skip-forward" size={isSmallScreen ? 16 : 24} color="#ffaa00" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Question Navigation Bar */}
      <View style={styles.questionNavContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.questionNavScroll}
        >
          {displayQuestions.map((question, index) => {
            const isAnswered = answers[question.id] !== undefined;
            const isFlagged = flaggedQuestions.has(question.id);
            const isSkipped = skippedQuestions.has(question.id);
            const isCurrent = index === currentQuestionIndex;
            
            return (
              <TouchableOpacity
                key={question.id}
                style={[
                  styles.questionNavItem,
                  isCurrent && styles.currentQuestionNavItem,
                  isAnswered && !isSkipped && styles.answeredQuestionNavItem,
                  isSkipped && styles.skippedQuestionNavItem,
                  isFlagged && styles.flaggedQuestionNavItem,
                ]}
                onPress={() => {
                  if (!isReviewMode) {
                    setCurrentQuestionIndex(index);
                    setSelectedAnswer(answers[question.id] || null);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                disabled={isReviewMode}
              >
                <Text style={[
                  styles.questionNavNumber,
                  isCurrent && styles.currentQuestionNavNumber,
                  isAnswered && !isSkipped && styles.answeredQuestionNavNumber,
                  isSkipped && styles.skippedQuestionNavNumber,
                  isFlagged && styles.flaggedQuestionNavNumber,
                ]}>
                  {index + 1}
                </Text>
                
                {/* Status Icons */}
                <View style={styles.questionNavIcons}>
                  {isFlagged && (
                    <Ionicons 
                      name="flag" 
                      size={24} 
                      color="#ff6b6b" 
                      style={styles.questionNavIcon}
                    />
                  )}
                  {isSkipped && (
                    <Ionicons 
                      name="play-skip-forward" 
                      size={24} 
                      color="#ffaa00" 
                      style={styles.questionNavIcon}
                    />
                  )}
                  {isAnswered && !isSkipped && (
                    <Ionicons 
                      name="checkmark" 
                      size={24} 
                      color="#00ff88" 
                      style={styles.questionNavIcon}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

        {/* Question Navigation Legend */}
        <View style={styles.questionNavLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.answeredLegendDot]} />
            <Text style={styles.legendText}>Answered</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.skippedLegendDot]} />
            <Text style={styles.legendText}>Skipped</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.flaggedLegendDot]} />
            <Text style={styles.legendText}>Flagged</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.currentLegendDot]} />
            <Text style={styles.legendText}>Current</Text>
          </View>
          
          {/* Language Indicator */}
          <View style={styles.languageIndicator}>
            <Ionicons 
              name={
                currentLanguage === 'primary' ? "flag" : 
                currentLanguage === 'secondary' ? "language" : 
                "globe"
              } 
              size={24} 
              color={
                currentLanguage === 'primary' ? "#00d4ff" : 
                currentLanguage === 'secondary' ? "#ffaa00" : 
                "#00ff88"
              } 
            />
            <Text style={[
              styles.languageIndicatorText,
              { 
                color: currentLanguage === 'primary' ? "#00d4ff" : 
                       currentLanguage === 'secondary' ? "#ffaa00" : 
                       "#00ff88"
              }
            ]}>
              {currentLanguage === 'primary' ? 'BM' : 
               currentLanguage === 'secondary' ? 'EN' : 
               'DUAL'}
            </Text>
          </View>
        </View>

      {/* Content */}
      <Animated.ScrollView 
        style={styles.scrollView}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [60, 0]
              }) }
            ],
            paddingBottom: isSmallScreen ? 96 : 64
          }
        ]}
      >
        {/* Question Card */}
        <View style={styles.questionCard}>
          <LinearGradient
            colors={['rgba(0, 255, 136, 0.1)', 'rgba(0, 212, 255, 0.1)']}
            style={styles.questionCardGradient}
          >
            <Text style={currentLanguage === 'dual' ? styles.dualLanguageQuestionText : styles.questionText}>
              {getQuestionText(currentQuestion)}
            </Text>
          </LinearGradient>
        </View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {(sessionSettings?.questionShuffling && shuffledOptions[currentQuestion.id] 
            ? shuffledOptions[currentQuestion.id] 
            : ['A', 'B', 'C', 'D']
          ).map((option) => (
            <TouchableOpacity
              key={option}
              style={getOptionStyle(option)}
              onPress={() => handleAnswerSelect(option)}
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionLetter, selectedAnswer === option && styles.selectedOptionLetter]}>
                  <Text style={[styles.optionLetterText, selectedAnswer === option && styles.selectedOptionLetterText]}>
                    {option}
                  </Text>
                </View>
                <Text style={[
                  getOptionTextStyle(option),
                  currentLanguage === 'dual' && styles.dualLanguageOptionText
                ]}>
                  {getOptionText(currentQuestion, option)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {isReviewMode ? (
            <>
              <TouchableOpacity
                style={[styles.navButton, styles.exitReviewButton]}
                onPress={handleExitReviewMode}
              >
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
                <Text style={styles.navButtonText}>Exit Review</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={handleSubmitTest}
              >
                <Text style={styles.navButtonText}>Submit Test</Text>
                <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
                onPress={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <Ionicons name="chevron-back" size={24} color="#ffffff" />
                <Text style={styles.navButtonText}>Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.navButton, 
                  styles.nextButton,
                  currentQuestionIndex === displayQuestions.length - 1 && !areAllQuestionsAnswered() && styles.disabledButton
                ]}
                onPress={currentQuestionIndex === displayQuestions.length - 1 ? handleSubmitTest : handleNextQuestion}
                disabled={currentQuestionIndex === displayQuestions.length - 1 && !areAllQuestionsAnswered()}
              >
                <Text style={[
                  styles.navButtonText,
                  currentQuestionIndex === displayQuestions.length - 1 && !areAllQuestionsAnswered() && styles.disabledButtonText
                ]}>
                  {currentQuestionIndex === displayQuestions.length - 1 ? 'Submit' : 'Next'}
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={24} 
                  color={currentQuestionIndex === displayQuestions.length - 1 && !areAllQuestionsAnswered() ? "#666" : "#ffffff"} 
                />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Review Mode Button */}
        {!isReviewMode && currentQuestionIndex === displayQuestions.length - 1 && areAllQuestionsAnswered() && (
          <View style={styles.reviewModeContainer}>
            <TouchableOpacity
              style={styles.reviewModeButton}
              onPress={handleReviewMode}
            >
              <Ionicons name="eye" size={24} color="#00d4ff" />
              <Text style={styles.reviewModeText}>Review All Answers</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Completion Status */}
        {!isReviewMode && (
          <View style={styles.completionStatusContainer}>
            <View style={styles.completionStatus}>
              <Text style={styles.completionStatusText}>
                {getCompletionStats().answered} / {getCompletionStats().total} questions answered
              </Text>
              {!areAllQuestionsAnswered() && (
                <Text style={styles.completionWarningText}>
                  Complete all questions to submit
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Offline Sync Button */}
        {!isOffline && !isSyncing && (
          <View style={styles.syncButtonContainer}>
            <TouchableOpacity
              style={styles.syncButton}
              onPress={syncOfflineSubmissions}
            >
              <Ionicons name="cloud-upload" size={24} color="#00d4ff" />
              <Text style={styles.syncButtonText}>Sync Offline Data</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentQuestionIndex + 1) / displayQuestions.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentQuestionIndex + 1} of {displayQuestions.length} questions
          </Text>
        </View>
      </Animated.ScrollView>

      {/* Submission Confirmation Dialog */}
      {showSubmissionConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationDialog}>
            <View style={styles.confirmationHeader}>
              <Ionicons name="warning" size={24} color="#ff6b6b" />
              <Text style={styles.confirmationTitle}>Confirm Submission</Text>
            </View>
            
            <Text style={styles.confirmationText}>
              Are you sure you want to submit your test? This action cannot be undone.
            </Text>
            
            <View style={styles.confirmationStats}>
              <Text style={styles.confirmationStatText}>
                Questions Answered: {getCompletionStats().answered} / {getCompletionStats().total}
              </Text>
              <Text style={styles.confirmationStatText}>
                Flagged Questions: {getCompletionStats().flagged}
              </Text>
              <Text style={styles.confirmationStatText}>
                Skipped Questions: {getCompletionStats().skipped}
              </Text>
              <View style={[
                styles.completionStatusBadge,
                areAllQuestionsAnswered() ? styles.completeBadge : styles.incompleteBadge
              ]}>
                <Ionicons 
                  name={areAllQuestionsAnswered() ? "checkmark-circle" : "warning"} 
                  size={24} 
                  color={areAllQuestionsAnswered() ? "#00ff88" : "#ffaa00"} 
                />
                <Text style={[
                  styles.completionStatusBadgeText,
                  areAllQuestionsAnswered() ? styles.completeBadgeText : styles.incompleteBadgeText
                ]}>
                  {areAllQuestionsAnswered() ? "Complete - Ready to Submit" : "Incomplete - Answer All Questions"}
                </Text>
              </View>
            </View>
            
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.cancelButton]}
                onPress={() => setShowSubmissionConfirm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmationButton, styles.submitButton]}
                onPress={() => {
                  setShowSubmissionConfirm(false);
                  handleSubmitTest();
                }}
              >
                <Text style={styles.submitButtonText}>Submit Test</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Enhanced Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
        <View style={styles.enhancedLoadingContainer}>
          <ActivityIndicator size="large" color="#00d4ff" />
          <Text style={styles.enhancedLoadingText}>Loading questions...</Text>
          <Text style={styles.loadingSubtext}>Please wait while we prepare your test</Text>
        </View>
        </View>
      )}

      {/* Enhanced Error State */}
      {error && (
        <View style={styles.errorOverlay}>
        <View style={styles.enhancedErrorContainer}>
          <Ionicons name="alert-circle" size={24} color="#ff6b6b" />
          <Text style={styles.enhancedErrorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.enhancedErrorText}>{error}</Text>
            
            <View style={styles.enhancedErrorActions}>
              <TouchableOpacity
                style={[styles.errorButton, styles.enhancedRetryButton]}
                onPress={handleRetry}
              >
                <Ionicons name="refresh" size={24} color="#ffffff" />
                <Text style={styles.enhancedRetryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.errorButton, styles.errorBackButton]}
                onPress={onBack}
              >
                <Ionicons name="arrow-back" size={24} color="#666" />
                <Text style={styles.errorBackButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Submission Loading */}
      {isSubmitting && (
        <View style={styles.submissionOverlay}>
          <View style={styles.submissionContainer}>
            <ActivityIndicator size="large" color="#00d4ff" />
            <Text style={styles.submissionText}>Submitting your test...</Text>
            <Text style={styles.submissionSubtext}>Please don't close the app</Text>
          </View>
        </View>
      )}

      {/* Success Message Overlay */}
      {showSuccessMessage && (
        <View style={styles.successOverlay}>
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={24} color="#00ff88" />
            <Text style={styles.successMessageText}>
              {submissionUISettings?.successMessage || "Terima Kasih, Selamat Maju Jaya!"}
            </Text>
          </View>
        </View>
      )}

      {/* Access Request Modal */}
      <Modal
        visible={showAccessRequest}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.accessRequestModal}>
            <View style={styles.accessRequestHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#667eea" />
              <Text style={styles.accessRequestTitle}>Request Test Access</Text>
            </View>
            
            <Text style={styles.accessRequestMessage}>
              This test requires approval-based access control. Please provide a reason for requesting access to this test.
            </Text>
            
            <TextInput
              style={styles.accessRequestInput}
              placeholder="Enter reason for test access..."
              placeholderTextColor="rgba(0, 0, 0, 0.5)"
              value={requestReason}
              onChangeText={setRequestReason}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.accessRequestButtons}>
              <TouchableOpacity
                style={[styles.accessRequestButton, styles.cancelAccessButton]}
                onPress={() => {
                  setShowAccessRequest(false);
                  setRequestReason('');
                }}
              >
                <Text style={styles.cancelAccessButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.accessRequestButton, styles.submitAccessButton]}
                onPress={handleRequestAccess}
              >
                <Ionicons name="send" size={24} color="#ffffff" />
                <Text style={styles.submitAccessButtonText}>Request Access</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
    paddingTop: isSmallScreen ? 12 : 24,
    paddingBottom: isSmallScreen ? 12 : 24,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 255, 136, 0.4)',
  },
  backButton: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 24,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContentCompact: {
    flexWrap: 'wrap',
    rowGap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  headerActionsCompact: {
    flexWrap: 'wrap',
    rowGap: 12,
  },
  questionActions: {
    flexDirection: 'row',
    gap: 24,
  },
  questionActionsCompact: {
    gap: 12,
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  flaggedButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: '#ff6b6b',
  },
  languageButton: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  dualLanguageButton: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderColor: 'rgba(0, 255, 136, 0.3)',
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
  headerTitleCompact: {
    fontSize: 14,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  headerSubtitleCompact: {
    fontSize: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerContainerCompact: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 24,
  },
  timerTextCompact: {
    fontSize: 12,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 24,
  },
  questionCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  questionCardGradient: {
    padding: isSmallScreen ? 16 : 24,
  },
  questionText: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: isSmallScreen ? 20 : 24,
  },
  dualLanguageQuestionText: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: isSmallScreen ? 20 : 24,
  },
  optionsContainer: {
    marginBottom: isSmallScreen ? 16 : 24,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    marginBottom: isSmallScreen ? 12 : 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedOption: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderColor: 'rgba(0, 255, 136, 0.5)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isSmallScreen ? 16 : 24,
  },
  optionLetter: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  selectedOptionLetter: {
    backgroundColor: '#00ff88',
  },
  optionLetterText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  selectedOptionLetterText: {
    color: '#000000',
  },
  optionText: {
    flex: 1,
    fontSize: isSmallScreen ? 14 : 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: isSmallScreen ? 20 : 24,
  },
  dualLanguageOptionText: {
    flex: 1,
    fontSize: isSmallScreen ? 14 : 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: isSmallScreen ? 20 : 24,
  },
  selectedOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: isSmallScreen ? 12 : 24,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isSmallScreen ? 16 : 24,
    paddingVertical: isSmallScreen ? 14 : 24,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  nextButton: {
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: '#ffffff',
    marginHorizontal: isSmallScreen ? 12 : 24,
  },
  exitReviewButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  reviewModeContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  reviewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#00d4ff',
    gap: 24,
  },
  reviewModeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d4ff',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: isSmallScreen ? 12 : 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: isSmallScreen ? 12 : 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 24,
  },
  progressText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 24,
    textAlign: 'center',
  },
  completedSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 24,
    textAlign: 'center',
  },
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 24,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 24,
  },
  assignPoolButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    shadowColor: '#00ff88',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 24,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 16,
  },
  retryButton: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    marginTop: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00ff88',
  },
  requestAccessButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderColor: 'rgba(102, 126, 234, 0.4)',
  },
  requestAccessButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 12,
  },
  errorBackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 24,
  },
  errorBackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Modal and Confirmation Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confirmationDialog: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    maxWidth: 24,
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 24,
  },
  confirmationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  confirmationText: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 24,
    marginBottom: 24,
  },
  confirmationStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  confirmationStatText: {
    fontSize: 16,
    color: '#aaaaaa',
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  submitButton: {
    backgroundColor: '#ff6b6b',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Enhanced Loading States
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  enhancedLoadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  enhancedLoadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 24,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#aaaaaa',
    marginTop: 24,
    textAlign: 'center',
  },
  // Enhanced Error States
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  enhancedErrorContainer: {
    alignItems: 'center',
    padding: 24,
    marginHorizontal: 24,
  },
  enhancedErrorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 24,
    textAlign: 'center',
  },
  enhancedErrorText: {
    fontSize: 16,
    color: '#aaaaaa',
    marginTop: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  enhancedErrorActions: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 24,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    gap: 24,
  },
  enhancedRetryButton: {
    backgroundColor: '#00d4ff',
  },
  enhancedRetryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  // Submission Loading
  submissionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  submissionContainer: {
    alignItems: 'center',
    padding: 24,
  },
  submissionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 24,
    textAlign: 'center',
  },
  submissionSubtext: {
    fontSize: 16,
    color: '#aaaaaa',
    marginTop: 24,
    textAlign: 'center',
  },
  // Question Navigation Styles
  questionNavContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 24,
  },
  questionNavScroll: {
    paddingHorizontal: 24,
    gap: 24,
  },
  questionNavItem: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  currentQuestionNavItem: {
    backgroundColor: 'rgba(0, 212, 255, 0.3)',
    borderColor: '#00d4ff',
    transform: [{ scale: 1.1 }],
  },
  answeredQuestionNavItem: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderColor: '#00ff88',
  },
  skippedQuestionNavItem: {
    backgroundColor: 'rgba(255, 170, 0, 0.2)',
    borderColor: '#ffaa00',
  },
  flaggedQuestionNavItem: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: '#ff6b6b',
  },
  questionNavNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  currentQuestionNavNumber: {
    color: '#00d4ff',
    fontWeight: '700',
  },
  answeredQuestionNavNumber: {
    color: '#00ff88',
  },
  skippedQuestionNavNumber: {
    color: '#ffaa00',
  },
  flaggedQuestionNavNumber: {
    color: '#ff6b6b',
  },
  questionNavIcons: {
    position: 'absolute',
    top: -2,
    right: -2,
    flexDirection: 'row',
    gap: 1,
  },
  questionNavIcon: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 24,
    padding: 1,
  },
  // Question Navigation Legend Styles
  questionNavLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  legendDot: {
    width: 24,
    height: 24,
    borderRadius: 24,
  },
  answeredLegendDot: {
    backgroundColor: '#00ff88',
  },
  skippedLegendDot: {
    backgroundColor: '#ffaa00',
  },
  flaggedLegendDot: {
    backgroundColor: '#ff6b6b',
  },
  currentLegendDot: {
    backgroundColor: '#00d4ff',
  },
  legendText: {
    fontSize: 16,
    color: '#aaaaaa',
    fontWeight: '500',
  },
  languageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    gap: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  languageIndicatorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Completion Status Styles
  completionStatusContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  completionStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  completionStatusText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  completionWarningText: {
    fontSize: 16,
    color: '#ffaa00',
    marginTop: 24,
    fontWeight: '500',
  },
  disabledButtonText: {
    color: '#666666',
  },
  // Confirmation Dialog Completion Styles
  completionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    marginTop: 24,
    gap: 24,
  },
  completeBadge: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  incompleteBadge: {
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 0, 0.3)',
  },
  completionStatusBadgeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completeBadgeText: {
    color: '#00ff88',
  },
  incompleteBadgeText: {
    color: '#ffaa00',
  },
  // Offline Support Styles
  timerAndStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  timerAndStatusContainerCompact: {
    gap: 12,
  },
  offlineStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    gap: 24,
  },
  offlineStatusContainerCompact: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  offlineStatusText: {
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  syncStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    gap: 24,
  },
  syncStatusContainerCompact: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  syncStatusText: {
    fontSize: 16,
    color: '#00d4ff',
    fontWeight: '600',
  },
  syncButtonContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#00d4ff',
    gap: 24,
  },
  syncButtonText: {
    fontSize: 16,
    color: '#00d4ff',
    fontWeight: '600',
  },
  // Success Message Styles
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  successContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#00ff88',
    maxWidth: 24,
    width: '90%',
  },
  successMessageText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00ff88',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 24,
  },
  // Access Request Modal Styles
  accessRequestModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  accessRequestHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  accessRequestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 24,
    textAlign: 'center',
  },
  accessRequestMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  accessRequestInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    fontSize: 16,
    color: '#ffffff',
    textAlignVertical: 'top',
    marginBottom: 24,
    minHeight: 24,
  },
  accessRequestButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  accessRequestButton: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 24,
  },
  cancelAccessButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  submitAccessButton: {
    backgroundColor: '#667eea',
  },
  cancelAccessButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  submitAccessButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Access Control Indicator
  accessControlIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    marginLeft: 24,
    gap: 24,
  },
  accessControlIndicatorCompact: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginLeft: 12,
    gap: 12,
  },
  accessControlText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00ff88',
  },
  // Super Admin Indicator
  superAdminIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    marginLeft: 24,
    gap: 24,
  },
  superAdminIndicatorCompact: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginLeft: 12,
    gap: 12,
  },
  superAdminText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffd700',
  },
});
