import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, Alert, ActivityIndicator, Modal, TextInput } from "react-native";
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

interface TestInterfaceScreenProps {
  onBack: () => void;
  onShowResults: (results: any) => void;
  onNavigateToPools?: () => void;
  testType: 'pre' | 'post';
  userName: string;
  userId: string;
  courseSessionId?: string;
  isSuperAdmin?: boolean;
}

export default function TestInterfaceScreen({ onBack, onShowResults, onNavigateToPools, testType, userName, userId, courseSessionId, isSuperAdmin = false }: TestInterfaceScreenProps) {
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
              setError(`No question pool assigned for ${testType} test. Please assign a pool first.`);
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
          console.warn('Server fetch failed, trying offline cache:', serverError);
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
            
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
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
          <Ionicons name="arrow-back" size={getResponsiveSize(24, 26, 28)} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {isReviewMode ? 'Review Mode' : (testType === 'pre' ? 'Pre Test' : 'Post Test')}
            </Text>
            <Text style={styles.headerSubtitle}>Question {currentQuestionIndex + 1} of {displayQuestions.length}</Text>
          </View>
          
          <View style={styles.headerActions}>
            <View style={styles.timerAndStatusContainer}>
              <View style={[styles.timerContainer, { backgroundColor: getTimeColor() + '20' }]}>
                <Ionicons name="time" size={getResponsiveSize(16, 18, 20)} color={getTimeColor()} />
                <Text style={[styles.timerText, { color: getTimeColor() }]}>
                  {formatTime(timeLeft)}
                </Text>
              </View>
              {accessControlEnabled && !isSuperAdmin && (
                <View style={styles.accessControlIndicator}>
                  <Ionicons name="shield-checkmark" size={getResponsiveSize(16, 18, 20)} color="#00ff88" />
                  <Text style={styles.accessControlText}>Access Controlled</Text>
                </View>
              )}
              
              {/* Super Admin Indicator */}
              {isSuperAdmin && (
                <View style={styles.superAdminIndicator}>
                  <Ionicons name="star" size={getResponsiveSize(16, 18, 20)} color="#ffd700" />
                  <Text style={styles.superAdminText}>Super Admin</Text>
                </View>
              )}
              
              {/* Offline Status Indicator */}
              {isOffline && (
                <View style={styles.offlineStatusContainer}>
                  <Ionicons name="cloud-offline" size={getResponsiveSize(14, 16, 18)} color="#ff6b6b" />
                  <Text style={styles.offlineStatusText}>Offline</Text>
                </View>
              )}
              
              {/* Sync Status Indicator */}
              {isSyncing && (
                <View style={styles.syncStatusContainer}>
                  <ActivityIndicator size="small" color="#00d4ff" />
                  <Text style={styles.syncStatusText}>Syncing...</Text>
                </View>
              )}
            </View>
            
            {!isReviewMode && (
              <View style={styles.questionActions}>
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
                    size={getResponsiveSize(16, 18, 20)} 
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
                    size={getResponsiveSize(16, 18, 20)} 
                    color={flaggedQuestions.has(currentQuestion.id) ? "#ff6b6b" : "#666"} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleSkipQuestion}
                >
                  <Ionicons name="play-skip-forward" size={getResponsiveSize(16, 18, 20)} color="#ffaa00" />
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
                      size={getResponsiveSize(10, 12, 14)} 
                      color="#ff6b6b" 
                      style={styles.questionNavIcon}
                    />
                  )}
                  {isSkipped && (
                    <Ionicons 
                      name="play-skip-forward" 
                      size={getResponsiveSize(10, 12, 14)} 
                      color="#ffaa00" 
                      style={styles.questionNavIcon}
                    />
                  )}
                  {isAnswered && !isSkipped && (
                    <Ionicons 
                      name="checkmark" 
                      size={getResponsiveSize(10, 12, 14)} 
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
              size={getResponsiveSize(12, 14, 16)} 
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
            ]
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
                <Ionicons name="arrow-back" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
                <Text style={styles.navButtonText}>Exit Review</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={handleSubmitTest}
              >
                <Text style={styles.navButtonText}>Submit Test</Text>
                <Ionicons name="checkmark-circle" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
                onPress={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <Ionicons name="chevron-back" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
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
                  size={getResponsiveSize(20, 22, 24)} 
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
              <Ionicons name="eye" size={getResponsiveSize(20, 22, 24)} color="#00d4ff" />
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
              <Ionicons name="cloud-upload" size={getResponsiveSize(16, 18, 20)} color="#00d4ff" />
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
              <Ionicons name="warning" size={getResponsiveSize(24, 26, 28)} color="#ff6b6b" />
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
                  size={getResponsiveSize(16, 18, 20)} 
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
          <Ionicons name="alert-circle" size={getResponsiveSize(48, 52, 56)} color="#ff6b6b" />
          <Text style={styles.enhancedErrorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.enhancedErrorText}>{error}</Text>
            
            <View style={styles.enhancedErrorActions}>
              <TouchableOpacity
                style={[styles.errorButton, styles.enhancedRetryButton]}
                onPress={handleRetry}
              >
                <Ionicons name="refresh" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
                <Text style={styles.enhancedRetryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.errorButton, styles.errorBackButton]}
                onPress={onBack}
              >
                <Ionicons name="arrow-back" size={getResponsiveSize(20, 22, 24)} color="#666" />
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
            <Ionicons name="checkmark-circle" size={getResponsiveSize(60, 70, 80)} color="#00ff88" />
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
              <Ionicons name="shield-checkmark" size={getResponsiveSize(32, 36, 40)} color="#667eea" />
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
                <Ionicons name="send" size={getResponsiveSize(16, 18, 20)} color="#ffffff" />
                <Text style={styles.submitAccessButtonText}>Request Access</Text>
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
    paddingHorizontal: getResponsivePadding(),
    paddingTop: getResponsiveSize(25, 30, 35),
    paddingBottom: getResponsiveSize(20, 25, 30),
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 255, 136, 0.4)',
  },
  backButton: {
    padding: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(12, 14, 16),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: getResponsiveSize(15, 18, 20),
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(8, 10, 12),
  },
  questionActions: {
    flexDirection: 'row',
    gap: getResponsiveSize(4, 6, 8),
  },
  actionButton: {
    width: getResponsiveSize(36, 40, 44),
    height: getResponsiveSize(36, 40, 44),
    borderRadius: getResponsiveSize(18, 20, 22),
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
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    paddingVertical: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(20, 24, 28),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '700',
    marginLeft: getResponsiveSize(6, 8, 10),
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: getResponsiveSize(20, 25, 30),
    paddingBottom: getResponsiveSize(40, 50, 60),
  },
  questionCard: {
    marginBottom: getResponsiveSize(20, 25, 30),
    borderRadius: getResponsiveSize(16, 20, 24),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  questionCardGradient: {
    padding: getResponsiveSize(20, 24, 28),
  },
  questionText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: getResponsiveFontSize(24, 26, 28),
  },
  dualLanguageQuestionText: {
    fontSize: getResponsiveFontSize(15, 17, 19),
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: getResponsiveFontSize(22, 24, 26),
  },
  optionsContainer: {
    marginBottom: getResponsiveSize(20, 25, 30),
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getResponsiveSize(12, 14, 16),
    marginBottom: getResponsiveSize(12, 16, 20),
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
    padding: getResponsiveSize(16, 20, 24),
  },
  optionLetter: {
    width: getResponsiveSize(32, 36, 40),
    height: getResponsiveSize(32, 36, 40),
    borderRadius: getResponsiveSize(16, 18, 20),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSize(12, 16, 20),
  },
  selectedOptionLetter: {
    backgroundColor: '#00ff88',
  },
  optionLetterText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '700',
    color: '#ffffff',
  },
  selectedOptionLetterText: {
    color: '#000000',
  },
  optionText: {
    flex: 1,
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: getResponsiveFontSize(20, 22, 24),
  },
  dualLanguageOptionText: {
    flex: 1,
    fontSize: getResponsiveFontSize(13, 15, 17),
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: getResponsiveFontSize(18, 20, 22),
  },
  selectedOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSize(20, 25, 30),
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(12, 14, 16),
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
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
    marginHorizontal: getResponsiveSize(6, 8, 10),
  },
  exitReviewButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  reviewModeContainer: {
    marginTop: getResponsiveSize(15, 18, 20),
    alignItems: 'center',
  },
  reviewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(25, 30, 35),
    borderWidth: 1,
    borderColor: '#00d4ff',
    gap: getResponsiveSize(8, 10, 12),
  },
  reviewModeText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#00d4ff',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: getResponsiveSize(6, 8, 10),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(3, 4, 5),
    overflow: 'hidden',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: getResponsiveSize(3, 4, 5),
  },
  progressText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(),
  },
  completedTitle: {
    fontSize: getResponsiveFontSize(24, 28, 32),
    fontWeight: '900',
    color: '#ffffff',
    marginTop: getResponsiveSize(20, 24, 28),
    textAlign: 'center',
  },
  completedSubtitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: getResponsiveSize(8, 10, 12),
    textAlign: 'center',
  },
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(),
  },
  loadingText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#ffffff',
    marginTop: getResponsiveSize(20, 24, 28),
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(),
  },
  errorActions: {
    flexDirection: 'row',
    gap: getResponsiveSize(12, 14, 16),
    marginTop: getResponsiveSize(24, 28, 32),
  },
  assignPoolButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    paddingVertical: getResponsiveSize(12, 14, 16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getResponsiveSize(8, 10, 12),
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
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
    marginTop: getResponsiveSize(20, 24, 28),
    textAlign: 'center',
  },
  errorText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: getResponsiveSize(12, 16, 20),
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(20, 22, 24),
  },
  retryButton: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    paddingHorizontal: getResponsiveSize(24, 28, 32),
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(12, 14, 16),
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    marginTop: getResponsiveSize(20, 24, 28),
  },
  retryButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#00ff88',
  },
  errorBackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: getResponsiveSize(24, 28, 32),
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(12, 14, 16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: getResponsiveSize(12, 16, 20),
  },
  errorBackButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
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
    borderRadius: getResponsiveSize(20, 24, 28),
    padding: getResponsiveSize(24, 28, 32),
    marginHorizontal: getResponsiveSize(20, 24, 28),
    maxWidth: getResponsiveSize(400, 450, 500),
    width: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(16, 18, 20),
    gap: getResponsiveSize(8, 10, 12),
  },
  confirmationTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
  },
  confirmationText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#cccccc',
    lineHeight: getResponsiveSize(24, 26, 28),
    marginBottom: getResponsiveSize(20, 24, 28),
  },
  confirmationStats: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(16, 18, 20),
    marginBottom: getResponsiveSize(20, 24, 28),
  },
  confirmationStatText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#aaaaaa',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: getResponsiveSize(12, 14, 16),
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(12, 14, 16),
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
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
  },
  submitButtonText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
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
    padding: getResponsiveSize(32, 36, 40),
  },
  enhancedLoadingText: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '600',
    color: '#ffffff',
    marginTop: getResponsiveSize(16, 18, 20),
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#aaaaaa',
    marginTop: getResponsiveSize(8, 10, 12),
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
    padding: getResponsiveSize(32, 36, 40),
    marginHorizontal: getResponsiveSize(20, 24, 28),
  },
  enhancedErrorTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
    marginTop: getResponsiveSize(16, 18, 20),
    textAlign: 'center',
  },
  enhancedErrorText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    color: '#aaaaaa',
    marginTop: getResponsiveSize(8, 10, 12),
    textAlign: 'center',
    lineHeight: getResponsiveSize(24, 26, 28),
  },
  enhancedErrorActions: {
    flexDirection: 'row',
    gap: getResponsiveSize(12, 14, 16),
    marginTop: getResponsiveSize(24, 28, 32),
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(12, 14, 16),
    gap: getResponsiveSize(8, 10, 12),
  },
  enhancedRetryButton: {
    backgroundColor: '#00d4ff',
  },
  enhancedRetryButtonText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#ffffff',
  },
  backButtonText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
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
    padding: getResponsiveSize(32, 36, 40),
  },
  submissionText: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '600',
    color: '#ffffff',
    marginTop: getResponsiveSize(16, 18, 20),
    textAlign: 'center',
  },
  submissionSubtext: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#aaaaaa',
    marginTop: getResponsiveSize(8, 10, 12),
    textAlign: 'center',
  },
  // Question Navigation Styles
  questionNavContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: getResponsiveSize(8, 10, 12),
  },
  questionNavScroll: {
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    gap: getResponsiveSize(6, 8, 10),
  },
  questionNavItem: {
    width: getResponsiveSize(40, 44, 48),
    height: getResponsiveSize(40, 44, 48),
    borderRadius: getResponsiveSize(20, 22, 24),
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
    fontSize: getResponsiveFontSize(14, 16, 18),
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
    borderRadius: getResponsiveSize(6, 7, 8),
    padding: 1,
  },
  // Question Navigation Legend Styles
  questionNavLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: getResponsiveSize(6, 8, 10),
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    gap: getResponsiveSize(16, 20, 24),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(4, 6, 8),
  },
  legendDot: {
    width: getResponsiveSize(8, 10, 12),
    height: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(4, 5, 6),
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
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#aaaaaa',
    fontWeight: '500',
  },
  languageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(12, 14, 16),
    gap: getResponsiveSize(4, 6, 8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  languageIndicatorText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
  },
  // Completion Status Styles
  completionStatusContainer: {
    marginTop: getResponsiveSize(12, 16, 20),
    alignItems: 'center',
  },
  completionStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingVertical: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(20, 24, 28),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  completionStatusText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    fontWeight: '600',
  },
  completionWarningText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#ffaa00',
    marginTop: getResponsiveSize(4, 6, 8),
    fontWeight: '500',
  },
  disabledButtonText: {
    color: '#666666',
  },
  // Confirmation Dialog Completion Styles
  completionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(8, 10, 12),
    marginTop: getResponsiveSize(8, 10, 12),
    gap: getResponsiveSize(6, 8, 10),
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
    fontSize: getResponsiveFontSize(12, 14, 16),
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
    gap: getResponsiveSize(8, 10, 12),
  },
  offlineStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: getResponsiveSize(6, 8, 10),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(8, 10, 12),
    gap: getResponsiveSize(4, 6, 8),
  },
  offlineStatusText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#ff6b6b',
    fontWeight: '600',
  },
  syncStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    paddingHorizontal: getResponsiveSize(6, 8, 10),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(8, 10, 12),
    gap: getResponsiveSize(4, 6, 8),
  },
  syncStatusText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#00d4ff',
    fontWeight: '600',
  },
  syncButtonContainer: {
    marginTop: getResponsiveSize(12, 16, 20),
    alignItems: 'center',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingVertical: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(20, 24, 28),
    borderWidth: 1,
    borderColor: '#00d4ff',
    gap: getResponsiveSize(6, 8, 10),
  },
  syncButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
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
    padding: getResponsiveSize(32, 36, 40),
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: getResponsiveSize(20, 24, 28),
    borderWidth: 2,
    borderColor: '#00ff88',
    maxWidth: getResponsiveSize(300, 350, 400),
    width: '90%',
  },
  successMessageText: {
    fontSize: getResponsiveFontSize(18, 22, 26),
    fontWeight: '700',
    color: '#00ff88',
    textAlign: 'center',
    marginTop: getResponsiveSize(16, 20, 24),
    lineHeight: getResponsiveSize(26, 30, 34),
  },
  // Access Request Modal Styles
  accessRequestModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: getResponsiveSize(16, 20, 24),
    padding: getResponsiveSize(24, 28, 32),
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
  accessRequestHeader: {
    alignItems: 'center',
    marginBottom: getResponsiveSize(16, 18, 20),
  },
  accessRequestTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
    marginTop: getResponsiveSize(8, 10, 12),
    textAlign: 'center',
  },
  accessRequestMessage: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: getResponsiveSize(20, 22, 24),
    marginBottom: getResponsiveSize(16, 18, 20),
  },
  accessRequestInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 14, 16),
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    textAlignVertical: 'top',
    marginBottom: getResponsiveSize(20, 24, 28),
    minHeight: getResponsiveSize(80, 90, 100),
  },
  accessRequestButtons: {
    flexDirection: 'row',
    gap: getResponsiveSize(12, 14, 16),
  },
  accessRequestButton: {
    flex: 1,
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(8, 10, 12),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: getResponsiveSize(6, 8, 10),
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
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
  submitAccessButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
  // Access Control Indicator
  accessControlIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderRadius: getResponsiveSize(6, 8, 10),
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    marginLeft: getResponsiveSize(8, 10, 12),
    gap: getResponsiveSize(4, 6, 8),
  },
  accessControlText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#00ff88',
  },
  // Super Admin Indicator
  superAdminIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: getResponsiveSize(6, 8, 10),
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    marginLeft: getResponsiveSize(8, 10, 12),
    gap: getResponsiveSize(4, 6, 8),
  },
  superAdminText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#ffd700',
  },
});
