import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, ScrollView, Switch, Alert, Modal, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

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

interface ChecklistSettingsScreenProps {
  onBack: () => void;
}

interface TimerSettings {
  overallTestTimer: number; // in minutes
  enableVisualCountdown: boolean;
  enableAutoSubmit: boolean;
  timeWarnings: {
    tenMinutes: boolean;
    fiveMinutes: boolean;
    oneMinute: boolean;
  };
  countdownStyle: 'progress_bar' | 'circular' | 'both';
  warningSound: boolean;
  warningVibration: boolean;
}

interface SubmissionSettings {
  enableOneTimeSubmission: boolean;
  singleAttempt: boolean;
  submissionLock: boolean;
  progressTracking: boolean;
  resultsLock: boolean;
  showResultsAfterSubmission: boolean;
  adminControlledRetake: boolean;
  allowRetake: boolean;
  maxRetakeAttempts: number;
  retakeCooldownHours: number;
}

interface SessionManagementSettings {
  randomQuestionSelection: boolean;
  questionShuffling: boolean;
  progressSaving: boolean;
  sessionRecovery: boolean;
  autoSaveInterval: number; // in minutes
  maxIncompleteSessions: number;
  sessionTimeout: number; // in hours
  allowResumeFromAnywhere: boolean;
  clearProgressOnRetake: boolean;
}

interface LanguageSettings {
  enableBilingual: boolean;
  defaultLanguage: 'primary' | 'secondary' | 'dual';
  showLanguageToggle: boolean;
  primaryLanguageName: string;
  secondaryLanguageName: string;
  allowLanguageSwitch: boolean;
  enableDualLanguage: boolean;
}

interface OfflineSettings {
  enableOfflineMode: boolean;
  autoCacheQuestions: boolean;
  cacheExpirationHours: number;
  autoSyncOnReconnect: boolean;
  maxCacheSize: number; // in MB
  enableProgressBackup: boolean;
  backupInterval: number; // in minutes
  clearCacheOnSync: boolean;
}

interface SubmissionSettings {
  enableSubmissionConfirmation: boolean;
  confirmationMessage: string;
  successMessage: string;
  showSuccessMessage: boolean;
  successMessageDuration: number; // in seconds
  enableHapticFeedback: boolean;
  enableSoundFeedback: boolean;
}

interface QuestionPoolSettings {
  enableQuestionPools: boolean;
  defaultPoolId: string | null;
  allowPoolSelection: boolean;
  requirePoolSelection: boolean;
  showPoolInfo: boolean;
  randomizeWithinPool: boolean;
  poolSelectionMode: 'admin' | 'user' | 'both';
  autoAssignPools: boolean;
  poolAssignmentRules: {
    preTestPoolId: string | null;
    postTestPoolId: string | null;
    fallbackToAll: boolean;
  };
}

interface OneManCPRSettings {
  enableParticipantSelection: boolean;
  requireParticipantSelection: boolean;
  enableComments: boolean;
  maxCommentLength: number;
  enableCompulsorySections: boolean;
  compulsorySections: string[];
  enablePassFailLogic: boolean;
  enableProgressTracking: boolean;
  enableAssessmentSubmission: boolean;
  enableFormReset: boolean;
  showParticipantDetails: boolean;
  enableSearchFunction: boolean;
  enableStatusIndicators: boolean;
  enableModernDesign: boolean;
  enableAnimations: boolean;
  enableHapticFeedback: boolean;
  enableSoundFeedback: boolean;
}

interface ChecklistManagementSettings {
  enableChecklistManagement: boolean;
  availableChecklistTypes: string[];
  defaultChecklistType: string;
  enableChecklistCreation: boolean;
  enableChecklistEditing: boolean;
  enableChecklistDeletion: boolean;
  enableBulkOperations: boolean;
  enableChecklistImport: boolean;
  enableChecklistExport: boolean;
  enableVersionControl: boolean;
  enableChecklistTemplates: boolean;
  enableChecklistSharing: boolean;
  enableChecklistBackup: boolean;
  enableChecklistRestore: boolean;
  enableChecklistValidation: boolean;
  enableChecklistTesting: boolean;
  enableChecklistPublishing: boolean;
  enableChecklistArchiving: boolean;
  enableChecklistStatistics: boolean;
  enableChecklistAnalytics: boolean;
}

interface ChecklistTypeSettings {
  checklistType: string;
  displayName: string;
  description: string;
  isActive: boolean;
  isCompulsory: boolean;
  passCriteria: {
    type: 'percentage' | 'count' | 'sections';
    value: number;
    description: string;
  };
  sectionSettings: {
    sectionName: string;
    isCompulsory: boolean;
    displayOrder: number;
    color: string;
  }[];
  itemSettings: {
    enableItemManagement: boolean;
    enableItemReordering: boolean;
    enableItemGrouping: boolean;
    enableItemValidation: boolean;
  };
  submissionSettings: {
    enableSubmission: boolean;
    requireComments: boolean;
    enableDraftSaving: boolean;
    enableAutoSave: boolean;
  };
}

export default function ChecklistSettingsScreen({ onBack }: ChecklistSettingsScreenProps) {
  const [settings, setSettings] = useState({
    autoSave: true,
    notifications: true,
    darkMode: true,
    autoBackup: false,
    syncWithCloud: true,
    requireConfirmation: true,
    showProgress: true,
    enableSharing: false
  });

  const [timerSettings, setTimerSettings] = useState<TimerSettings>({
    overallTestTimer: 60, // 60 minutes default
    enableVisualCountdown: true,
    enableAutoSubmit: true,
    timeWarnings: {
      tenMinutes: true,
      fiveMinutes: true,
      oneMinute: true,
    },
    countdownStyle: 'both',
    warningSound: true,
    warningVibration: true,
  });

  const [submissionSettings, setSubmissionSettings] = useState<SubmissionSettings>({
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
    enableSubmissionConfirmation: true,
    confirmationMessage: "Are you sure you want to submit your test? This action cannot be undone.",
    successMessage: "Terima Kasih, Selamat Maju Jaya!",
    showSuccessMessage: true,
    successMessageDuration: 3,
    enableHapticFeedback: true,
    enableSoundFeedback: true,
  });

  const [sessionSettings, setSessionSettings] = useState<SessionManagementSettings>({
    randomQuestionSelection: true,
    questionShuffling: true,
    progressSaving: true,
    sessionRecovery: true,
    autoSaveInterval: 2, // 2 minutes
    maxIncompleteSessions: 3,
    sessionTimeout: 24, // 24 hours
    allowResumeFromAnywhere: true,
    clearProgressOnRetake: false,
  });

  const [languageSettings, setLanguageSettings] = useState<LanguageSettings>({
    enableBilingual: true,
    defaultLanguage: 'primary',
    showLanguageToggle: true,
    primaryLanguageName: 'Bahasa Malaysia',
    secondaryLanguageName: 'English',
    allowLanguageSwitch: true,
    enableDualLanguage: true,
  });

  const [offlineSettings, setOfflineSettings] = useState<OfflineSettings>({
    enableOfflineMode: true,
    autoCacheQuestions: true,
    cacheExpirationHours: 24,
    autoSyncOnReconnect: true,
    maxCacheSize: 100, // 100MB
    enableProgressBackup: true,
    backupInterval: 5, // 5 minutes
    clearCacheOnSync: false,
  });


  const [questionPoolSettings, setQuestionPoolSettings] = useState<QuestionPoolSettings>({
    enableQuestionPools: true,
    defaultPoolId: null,
    allowPoolSelection: true,
    requirePoolSelection: false,
    showPoolInfo: true,
    randomizeWithinPool: true,
    poolSelectionMode: 'admin',
    autoAssignPools: true,
    poolAssignmentRules: {
      preTestPoolId: null,
      postTestPoolId: null,
      fallbackToAll: true,
    },
  });

  const [oneManCPRSettings, setOneManCPRSettings] = useState<OneManCPRSettings>({
    enableParticipantSelection: true,
    requireParticipantSelection: true,
    enableComments: true,
    maxCommentLength: 500,
    enableCompulsorySections: true,
    compulsorySections: ['airway', 'breathing', 'circulation'],
    enablePassFailLogic: true,
    enableProgressTracking: true,
    enableAssessmentSubmission: true,
    enableFormReset: true,
    showParticipantDetails: true,
    enableSearchFunction: true,
    enableStatusIndicators: true,
    enableModernDesign: true,
    enableAnimations: true,
    enableHapticFeedback: true,
    enableSoundFeedback: true,
  });

  const [checklistManagementSettings, setChecklistManagementSettings] = useState<ChecklistManagementSettings>({
    enableChecklistManagement: true,
    availableChecklistTypes: ['one man cpr', 'two man cpr', 'infant cpr', 'adult choking', 'infant choking'],
    defaultChecklistType: 'one man cpr',
    enableChecklistCreation: true,
    enableChecklistEditing: true,
    enableChecklistDeletion: true,
    enableBulkOperations: true,
    enableChecklistImport: true,
    enableChecklistExport: true,
    enableVersionControl: true,
    enableChecklistTemplates: true,
    enableChecklistSharing: true,
    enableChecklistBackup: true,
    enableChecklistRestore: true,
    enableChecklistValidation: true,
    enableChecklistTesting: true,
    enableChecklistPublishing: true,
    enableChecklistArchiving: true,
    enableChecklistStatistics: true,
    enableChecklistAnalytics: true,
  });

  const [checklistTypeSettings, setChecklistTypeSettings] = useState<ChecklistTypeSettings[]>([
    {
      checklistType: 'one man cpr',
      displayName: 'One Man CPR',
      description: 'Basic life support checklist for single rescuer CPR',
      isActive: true,
      isCompulsory: true,
      passCriteria: {
        type: 'sections',
        value: 3,
        description: 'Complete all compulsory sections (Airway, Breathing, Circulation)'
      },
      sectionSettings: [
        { sectionName: 'danger', isCompulsory: false, displayOrder: 1, color: '#667eea' },
        { sectionName: 'respons', isCompulsory: false, displayOrder: 2, color: '#667eea' },
        { sectionName: 'shout for help', isCompulsory: false, displayOrder: 3, color: '#667eea' },
        { sectionName: 'airway', isCompulsory: true, displayOrder: 4, color: '#ff6b6b' },
        { sectionName: 'breathing', isCompulsory: true, displayOrder: 5, color: '#ff6b6b' },
        { sectionName: 'circulation', isCompulsory: true, displayOrder: 6, color: '#ff6b6b' },
        { sectionName: 'defribillation', isCompulsory: false, displayOrder: 7, color: '#667eea' }
      ],
      itemSettings: {
        enableItemManagement: true,
        enableItemReordering: true,
        enableItemGrouping: true,
        enableItemValidation: true
      },
      submissionSettings: {
        enableSubmission: true,
        requireComments: false,
        enableDraftSaving: true,
        enableAutoSave: true
      }
    },
    {
      checklistType: 'two man cpr',
      displayName: 'Two Man CPR',
      description: 'Advanced life support checklist for two rescuer CPR',
      isActive: true,
      isCompulsory: true,
      passCriteria: {
        type: 'sections',
        value: 3,
        description: 'Complete all compulsory sections (Airway, Breathing, Circulation)'
      },
      sectionSettings: [
        { sectionName: 'danger', isCompulsory: false, displayOrder: 1, color: '#667eea' },
        { sectionName: 'respons', isCompulsory: false, displayOrder: 2, color: '#667eea' },
        { sectionName: 'shout for help', isCompulsory: false, displayOrder: 3, color: '#667eea' },
        { sectionName: 'airway', isCompulsory: true, displayOrder: 4, color: '#ff6b6b' },
        { sectionName: 'breathing', isCompulsory: true, displayOrder: 5, color: '#ff6b6b' },
        { sectionName: 'circulation', isCompulsory: true, displayOrder: 6, color: '#ff6b6b' },
        { sectionName: 'defribillation', isCompulsory: false, displayOrder: 7, color: '#667eea' }
      ],
      itemSettings: {
        enableItemManagement: true,
        enableItemReordering: true,
        enableItemGrouping: true,
        enableItemValidation: true
      },
      submissionSettings: {
        enableSubmission: true,
        requireComments: false,
        enableDraftSaving: true,
        enableAutoSave: true
      }
    },
    {
      checklistType: 'infant cpr',
      displayName: 'Infant CPR',
      description: 'Pediatric life support checklist for infant CPR',
      isActive: true,
      isCompulsory: true,
      passCriteria: {
        type: 'sections',
        value: 3,
        description: 'Complete all compulsory sections (Airway, Breathing, Circulation)'
      },
      sectionSettings: [
        { sectionName: 'danger', isCompulsory: false, displayOrder: 1, color: '#667eea' },
        { sectionName: 'respons', isCompulsory: false, displayOrder: 2, color: '#667eea' },
        { sectionName: 'shout for help', isCompulsory: false, displayOrder: 3, color: '#667eea' },
        { sectionName: 'airway', isCompulsory: true, displayOrder: 4, color: '#ff6b6b' },
        { sectionName: 'breathing', isCompulsory: true, displayOrder: 5, color: '#ff6b6b' },
        { sectionName: 'circulation', isCompulsory: true, displayOrder: 6, color: '#ff6b6b' },
        { sectionName: 'defribillation', isCompulsory: false, displayOrder: 7, color: '#667eea' }
      ],
      itemSettings: {
        enableItemManagement: true,
        enableItemReordering: true,
        enableItemGrouping: true,
        enableItemValidation: true
      },
      submissionSettings: {
        enableSubmission: true,
        requireComments: false,
        enableDraftSaving: true,
        enableAutoSave: true
      }
    },
    {
      checklistType: 'adult choking',
      displayName: 'Adult Choking',
      description: 'Emergency response checklist for adult choking incidents',
      isActive: true,
      isCompulsory: false,
      passCriteria: {
        type: 'count',
        value: 4,
        description: 'Complete at least 4 out of 16 items to pass'
      },
      sectionSettings: [
        { sectionName: 'assess the severity', isCompulsory: false, displayOrder: 1, color: '#667eea' },
        { sectionName: 'mild choking', isCompulsory: false, displayOrder: 2, color: '#667eea' },
        { sectionName: 'severe choking', isCompulsory: false, displayOrder: 3, color: '#667eea' },
        { sectionName: 'victim unconscious', isCompulsory: false, displayOrder: 4, color: '#667eea' }
      ],
      itemSettings: {
        enableItemManagement: true,
        enableItemReordering: true,
        enableItemGrouping: true,
        enableItemValidation: true
      },
      submissionSettings: {
        enableSubmission: true,
        requireComments: false,
        enableDraftSaving: true,
        enableAutoSave: true
      }
    },
    {
      checklistType: 'infant choking',
      displayName: 'Infant Choking',
      description: 'Emergency response checklist for infant choking incidents',
      isActive: true,
      isCompulsory: false,
      passCriteria: {
        type: 'count',
        value: 4,
        description: 'Complete at least 4 out of 19 items to pass'
      },
      sectionSettings: [
        { sectionName: 'assess the severity', isCompulsory: false, displayOrder: 1, color: '#667eea' },
        { sectionName: 'mild airway obstruction', isCompulsory: false, displayOrder: 2, color: '#667eea' },
        { sectionName: 'severe airway obstruction', isCompulsory: false, displayOrder: 3, color: '#667eea' },
        { sectionName: 'victim unconscious', isCompulsory: false, displayOrder: 4, color: '#667eea' }
      ],
      itemSettings: {
        enableItemManagement: true,
        enableItemReordering: true,
        enableItemGrouping: true,
        enableItemValidation: true
      },
      submissionSettings: {
        enableSubmission: true,
        requireComments: false,
        enableDraftSaving: true,
        enableAutoSave: true
      }
    }
  ]);

  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showTimerPreview, setShowTimerPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    startAnimations();
  }, []);

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

  const toggleSetting = (key: keyof typeof settings) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all checklist settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              autoSave: true,
              notifications: true,
              darkMode: true,
              autoBackup: false,
              syncWithCloud: true,
              requireConfirmation: true,
              showProgress: true,
              enableSharing: false
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      ]
    );
  };

  const handleSaveSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Settings Saved', 'Your checklist settings have been saved successfully!');
  };

  const updateTimerSetting = (key: keyof TimerSettings, value: any) => {
    setTimerSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateTimeWarning = (warning: keyof TimerSettings['timeWarnings'], value: boolean) => {
    setTimerSettings(prev => ({
      ...prev,
      timeWarnings: {
        ...prev.timeWarnings,
        [warning]: value
      }
    }));
  };

  const updateSubmissionSetting = (key: keyof SubmissionSettings, value: any) => {
    setSubmissionSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateSessionSetting = (key: keyof SessionManagementSettings, value: any) => {
    setSessionSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateLanguageSetting = (key: keyof LanguageSettings, value: any) => {
    setLanguageSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateOfflineSetting = (key: keyof OfflineSettings, value: any) => {
    setOfflineSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateQuestionPoolSetting = (key: keyof QuestionPoolSettings, value: any) => {
    setQuestionPoolSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTimerPreview = () => {
    setPreviewTime(timerSettings.overallTestTimer * 60); // Convert to seconds
    setShowTimerPreview(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const getTimeColor = (timeLeft: number, totalTime: number) => {
    const percentage = (timeLeft / totalTime) * 100;
    if (percentage <= 10) return '#ff4757'; // Red
    if (percentage <= 25) return '#ffa502'; // Orange
    if (percentage <= 50) return '#ffaa00'; // Yellow
    return '#00ff88'; // Green
  };

  const SettingItem = ({ 
    title, 
    description, 
    settingKey, 
    icon, 
    iconColor 
  }: {
    title: string;
    description: string;
    settingKey: keyof typeof settings;
    icon: string;
    iconColor: string;
  }) => (
    <View style={styles.settingItem}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.settingItemGradient}
      >
        <View style={styles.settingItemContent}>
          <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={icon as any} size={getResponsiveSize(20, 22, 24)} color={iconColor} />
          </View>
          
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{title}</Text>
            <Text style={styles.settingDescription}>{description}</Text>
          </View>
          
          <Switch
            value={settings[settingKey]}
            onValueChange={() => toggleSetting(settingKey)}
            trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: 'rgba(139, 92, 246, 0.5)' }}
            thumbColor={settings[settingKey] ? '#8b5cf6' : 'rgba(255, 255, 255, 0.8)'}
            ios_backgroundColor="rgba(255, 255, 255, 0.2)"
          />
        </View>
      </LinearGradient>
    </View>
  );

  const TimerSettingItem = ({ 
    title, 
    description, 
    settingKey, 
    icon, 
    iconColor,
    value,
    onValueChange,
    type = 'switch',
    options
  }: {
    title: string;
    description: string;
    settingKey: string;
    icon: string;
    iconColor: string;
    value: any;
    onValueChange: (value: any) => void;
    type?: 'switch' | 'number' | 'select' | 'text';
    options?: { label: string; value: any }[];
  }) => (
    <View style={styles.settingItem}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.settingItemGradient}
      >
        <View style={styles.settingItemContent}>
          <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={icon as any} size={getResponsiveSize(20, 22, 24)} color={iconColor} />
          </View>
          
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{title}</Text>
            <Text style={styles.settingDescription}>{description}</Text>
          </View>
          
          {type === 'switch' && (
            <Switch
              value={value}
              onValueChange={onValueChange}
              trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: 'rgba(0, 255, 136, 0.5)' }}
              thumbColor={value ? '#00ff88' : 'rgba(255, 255, 255, 0.8)'}
              ios_backgroundColor="rgba(255, 255, 255, 0.2)"
            />
          )}
          
          {type === 'number' && (
            <View style={styles.numberInputContainer}>
              <TouchableOpacity 
                style={styles.numberButton}
                onPress={() => onValueChange(Math.max(1, value - 1))}
              >
                <Ionicons name="remove" size={16} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.numberValue}>{value}</Text>
              <TouchableOpacity 
                style={styles.numberButton}
                onPress={() => onValueChange(Math.min(180, value + 1))}
              >
                <Ionicons name="add" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
          
          {type === 'text' && (
            <TextInput
              style={styles.textInput}
              value={value?.toString() || ''}
              onChangeText={onValueChange}
              placeholder="Enter text"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          )}
          
          {type === 'select' && (
            <View style={styles.selectContainer}>
              <Text style={styles.selectText}>
                {options?.find(opt => opt.value === value)?.label || 'Select option'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#667eea" />
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  const TimerPreview = () => {
    const [timeLeft, setTimeLeft] = useState(previewTime);
    const totalTime = timerSettings.overallTestTimer * 60;
    const progress = (timeLeft / totalTime) * 100;
    const timeColor = getTimeColor(timeLeft, totalTime);

    React.useEffect(() => {
      if (timeLeft > 0) {
        const timer = setTimeout(() => {
          setTimeLeft(timeLeft - 1);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }, [timeLeft]);

    return (
      <View style={styles.timerPreviewContainer}>
        <Text style={styles.timerPreviewTitle}>Timer Preview</Text>
        
        {/* Circular Countdown */}
        {(timerSettings.countdownStyle === 'circular' || timerSettings.countdownStyle === 'both') && (
          <View style={styles.circularTimerContainer}>
            <View style={[styles.circularTimer, { borderColor: timeColor }]}>
              <Text style={[styles.circularTimerText, { color: timeColor }]}>
                {formatTime(timeLeft)}
              </Text>
            </View>
          </View>
        )}

        {/* Progress Bar */}
        {(timerSettings.countdownStyle === 'progress_bar' || timerSettings.countdownStyle === 'both') && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${progress}%`,
                    backgroundColor: timeColor
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressBarText, { color: timeColor }]}>
              {formatTime(timeLeft)} remaining
            </Text>
          </View>
        )}

        {/* Time Warnings */}
        {timerSettings.enableVisualCountdown && (
          <View style={styles.warningsContainer}>
            {timeLeft <= 600 && timerSettings.timeWarnings.tenMinutes && (
              <View style={[styles.warningItem, { backgroundColor: '#ffa502' + '20' }]}>
                <Ionicons name="warning" size={16} color="#ffa502" />
                <Text style={[styles.warningText, { color: '#ffa502' }]}>
                  10 minutes remaining
                </Text>
              </View>
            )}
            {timeLeft <= 300 && timerSettings.timeWarnings.fiveMinutes && (
              <View style={[styles.warningItem, { backgroundColor: '#ffaa00' + '20' }]}>
                <Ionicons name="warning" size={16} color="#ffaa00" />
                <Text style={[styles.warningText, { color: '#ffaa00' }]}>
                  5 minutes remaining
                </Text>
              </View>
            )}
            {timeLeft <= 60 && timerSettings.timeWarnings.oneMinute && (
              <View style={[styles.warningItem, { backgroundColor: '#ff4757' + '20' }]}>
                <Ionicons name="alert-circle" size={16} color="#ff4757" />
                <Text style={[styles.warningText, { color: '#ff4757' }]}>
                  1 minute remaining
                </Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity 
          style={styles.closePreviewButton}
          onPress={() => setShowTimerPreview(false)}
        >
          <Text style={styles.closePreviewButtonText}>Close Preview</Text>
        </TouchableOpacity>
      </View>
    );
  };

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
          <Ionicons name="arrow-back" size={getResponsiveSize(24, 26, 28)} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Animated.View style={[
            styles.headerIcon,
            {
              transform: [{ scale: pulseAnim }]
            }
          ]}>
            <LinearGradient 
              colors={["#8b5cf6", "#ff0080", "#5b73ff"]} 
              style={styles.headerIconGradient}
            >
              <Ionicons name="settings" size={getResponsiveSize(28, 32, 36)} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Checklist Settings</Text>
            <Text style={styles.headerSubtitle}>Configure checklist options</Text>
          </View>
        </View>
      </Animated.View>

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
        {/* General Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>General Settings</Text>
          
          <SettingItem
            title="Auto Save"
            description="Automatically save checklist changes"
            settingKey="autoSave"
            icon="save"
            iconColor="#00ff88"
          />
          
          <SettingItem
            title="Show Progress"
            description="Display completion progress indicators"
            settingKey="showProgress"
            icon="bar-chart"
            iconColor="#00d4ff"
          />
          
          <SettingItem
            title="Require Confirmation"
            description="Ask for confirmation before deleting items"
            settingKey="requireConfirmation"
            icon="shield-checkmark"
            iconColor="#ffaa00"
          />
        </View>

        {/* Notification Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <SettingItem
            title="Push Notifications"
            description="Receive notifications for checklist updates"
            settingKey="notifications"
            icon="notifications"
            iconColor="#ff6b6b"
          />
          
          <SettingItem
            title="Auto Backup"
            description="Automatically backup checklists daily"
            settingKey="autoBackup"
            icon="cloud-upload"
            iconColor="#5b73ff"
          />
        </View>

        {/* Sync & Sharing */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Sync & Sharing</Text>
          
          <SettingItem
            title="Sync with Cloud"
            description="Synchronize checklists across devices"
            settingKey="syncWithCloud"
            icon="cloud"
            iconColor="#00d4ff"
          />
          
          <SettingItem
            title="Enable Sharing"
            description="Allow sharing checklists with others"
            settingKey="enableSharing"
            icon="share"
            iconColor="#ff0080"
          />
        </View>

        {/* Timer Settings */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <LinearGradient 
              colors={["#00ff88", "#00d4ff"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="timer" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Timer Settings (Pre & Post Test)</Text>
          </View>
          
          <TimerSettingItem
            title="Overall Test Timer"
            description={`${timerSettings.overallTestTimer} minutes total time limit`}
            settingKey="overallTestTimer"
            icon="time"
            iconColor="#00ff88"
            value={timerSettings.overallTestTimer}
            onValueChange={(value) => updateTimerSetting('overallTestTimer', value)}
            type="number"
          />
          
          <TimerSettingItem
            title="Visual Countdown"
            description="Show countdown timer during test"
            settingKey="enableVisualCountdown"
            icon="eye"
            iconColor="#00d4ff"
            value={timerSettings.enableVisualCountdown}
            onValueChange={(value) => updateTimerSetting('enableVisualCountdown', value)}
          />
          
          <TimerSettingItem
            title="Auto Submit"
            description="Automatically submit when time runs out"
            settingKey="enableAutoSubmit"
            icon="checkmark-circle"
            iconColor="#ffaa00"
            value={timerSettings.enableAutoSubmit}
            onValueChange={(value) => updateTimerSetting('enableAutoSubmit', value)}
          />
          
          <TimerSettingItem
            title="Countdown Style"
            description="Choose visual countdown display style"
            settingKey="countdownStyle"
            icon="layers"
            iconColor="#8b5cf6"
            value={timerSettings.countdownStyle}
            onValueChange={(value) => updateTimerSetting('countdownStyle', value)}
            type="select"
          />
          
          <TouchableOpacity 
            style={styles.previewButton}
            onPress={handleTimerPreview}
          >
            <LinearGradient
              colors={['rgba(0, 255, 136, 0.2)', 'rgba(0, 212, 255, 0.2)']}
              style={styles.previewButtonGradient}
            >
              <Ionicons name="play-circle" size={getResponsiveSize(20, 22, 24)} color="#00ff88" />
              <Text style={styles.previewButtonText}>Preview Timer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Time Warnings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Time Warnings</Text>
          
          <TimerSettingItem
            title="10 Minutes Warning"
            description="Alert when 10 minutes remaining"
            settingKey="tenMinutes"
            icon="warning"
            iconColor="#ffa502"
            value={timerSettings.timeWarnings.tenMinutes}
            onValueChange={(value) => updateTimeWarning('tenMinutes', value)}
          />
          
          <TimerSettingItem
            title="5 Minutes Warning"
            description="Alert when 5 minutes remaining"
            settingKey="fiveMinutes"
            icon="warning"
            iconColor="#ffaa00"
            value={timerSettings.timeWarnings.fiveMinutes}
            onValueChange={(value) => updateTimeWarning('fiveMinutes', value)}
          />
          
          <TimerSettingItem
            title="1 Minute Warning"
            description="Alert when 1 minute remaining"
            settingKey="oneMinute"
            icon="alert-circle"
            iconColor="#ff4757"
            value={timerSettings.timeWarnings.oneMinute}
            onValueChange={(value) => updateTimeWarning('oneMinute', value)}
          />
        </View>

        {/* Warning Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Warning Settings</Text>
          
          <TimerSettingItem
            title="Warning Sound"
            description="Play sound for time warnings"
            settingKey="warningSound"
            icon="volume-high"
            iconColor="#5b73ff"
            value={timerSettings.warningSound}
            onValueChange={(value) => updateTimerSetting('warningSound', value)}
          />
          
          <TimerSettingItem
            title="Warning Vibration"
            description="Vibrate for time warnings"
            settingKey="warningVibration"
            icon="phone-portrait"
            iconColor="#ff0080"
            value={timerSettings.warningVibration}
            onValueChange={(value) => updateTimerSetting('warningVibration', value)}
          />
        </View>

        {/* One-Time Submission Settings */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <LinearGradient 
              colors={["#ff6b6b", "#ff8e8e"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="lock-closed" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>One-Time Submission Control</Text>
          </View>
          
          <TimerSettingItem
            title="Enable One-Time Submission"
            description="Control submission behavior and retake policies"
            settingKey="enableOneTimeSubmission"
            icon="shield-checkmark"
            iconColor="#ff6b6b"
            value={submissionSettings.enableOneTimeSubmission}
            onValueChange={(value) => updateSubmissionSetting('enableOneTimeSubmission', value)}
          />
          
          <TimerSettingItem
            title="Single Attempt Only"
            description="Users can only take test once per course session"
            settingKey="singleAttempt"
            icon="person-remove"
            iconColor="#ff4757"
            value={submissionSettings.singleAttempt}
            onValueChange={(value) => updateSubmissionSetting('singleAttempt', value)}
          />
          
          <TimerSettingItem
            title="Submission Lock"
            description="Prevent multiple submissions after completion"
            settingKey="submissionLock"
            icon="lock-closed"
            iconColor="#ff6b6b"
            value={submissionSettings.submissionLock}
            onValueChange={(value) => updateSubmissionSetting('submissionLock', value)}
          />
          
          <TimerSettingItem
            title="Progress Tracking"
            description="Track if user has already taken the test"
            settingKey="progressTracking"
            icon="analytics"
            iconColor="#00d4ff"
            value={submissionSettings.progressTracking}
            onValueChange={(value) => updateSubmissionSetting('progressTracking', value)}
          />
          
          <TimerSettingItem
            title="Results Lock"
            description="Show results only after admin releases the score"
            settingKey="resultsLock"
            icon="eye-off"
            iconColor="#8b5cf6"
            value={submissionSettings.resultsLock}
            onValueChange={(value) => updateSubmissionSetting('resultsLock', value)}
          />
          
          <TimerSettingItem
            title="Show Results After Submission"
            description="Display results immediately after test completion"
            settingKey="showResultsAfterSubmission"
            icon="eye"
            iconColor="#00ff88"
            value={submissionSettings.showResultsAfterSubmission}
            onValueChange={(value) => updateSubmissionSetting('showResultsAfterSubmission', value)}
          />
        </View>

        {/* Retake Policy Settings */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Retake Policy</Text>
          
          <TimerSettingItem
            title="Admin Controlled Retake"
            description="Admin controls retake permissions manually"
            settingKey="adminControlledRetake"
            icon="settings"
            iconColor="#ffaa00"
            value={submissionSettings.adminControlledRetake}
            onValueChange={(value) => updateSubmissionSetting('adminControlledRetake', value)}
          />
          
          <TimerSettingItem
            title="Allow Retake"
            description="Enable retake functionality for users"
            settingKey="allowRetake"
            icon="refresh"
            iconColor="#5b73ff"
            value={submissionSettings.allowRetake}
            onValueChange={(value) => updateSubmissionSetting('allowRetake', value)}
          />
          
          <TimerSettingItem
            title="Max Retake Attempts"
            description={`Maximum ${submissionSettings.maxRetakeAttempts} retake attempts allowed`}
            settingKey="maxRetakeAttempts"
            icon="repeat"
            iconColor="#00d4ff"
            value={submissionSettings.maxRetakeAttempts}
            onValueChange={(value) => updateSubmissionSetting('maxRetakeAttempts', value)}
            type="number"
          />
          
          <TimerSettingItem
            title="Retake Cooldown"
            description={`${submissionSettings.retakeCooldownHours} hours cooldown between retakes`}
            settingKey="retakeCooldownHours"
            icon="time"
            iconColor="#ff6b6b"
            value={submissionSettings.retakeCooldownHours}
            onValueChange={(value) => updateSubmissionSetting('retakeCooldownHours', value)}
            type="number"
          />
        </View>

        {/* Test Session Management */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <LinearGradient 
              colors={["#00d4ff", "#5b73ff"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="document-text" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Test Session Management</Text>
          </View>
          
          <TimerSettingItem
            title="Random Question Selection"
            description="Randomize question order for each test attempt"
            settingKey="randomQuestionSelection"
            icon="shuffle"
            iconColor="#00d4ff"
            value={sessionSettings.randomQuestionSelection}
            onValueChange={(value) => updateSessionSetting('randomQuestionSelection', value)}
          />
          
          <TimerSettingItem
            title="Question Shuffling"
            description="Shuffle answer options for each question"
            settingKey="questionShuffling"
            icon="swap-horizontal"
            iconColor="#5b73ff"
            value={sessionSettings.questionShuffling}
            onValueChange={(value) => updateSessionSetting('questionShuffling', value)}
          />
          
          <TimerSettingItem
            title="Progress Saving"
            description="Save progress if user closes app"
            settingKey="progressSaving"
            icon="save"
            iconColor="#00ff88"
            value={sessionSettings.progressSaving}
            onValueChange={(value) => updateSessionSetting('progressSaving', value)}
          />
          
          <TimerSettingItem
            title="Session Recovery"
            description="Allow users to resume incomplete tests"
            settingKey="sessionRecovery"
            icon="refresh-circle"
            iconColor="#ffaa00"
            value={sessionSettings.sessionRecovery}
            onValueChange={(value) => updateSessionSetting('sessionRecovery', value)}
          />
          
          <TimerSettingItem
            title="Auto Save Interval"
            description={`Save progress every ${sessionSettings.autoSaveInterval} minutes`}
            settingKey="autoSaveInterval"
            icon="time"
            iconColor="#ff6b6b"
            value={sessionSettings.autoSaveInterval}
            onValueChange={(value) => updateSessionSetting('autoSaveInterval', value)}
            type="number"
          />
          
          <TimerSettingItem
            title="Max Incomplete Sessions"
            description={`Allow up to ${sessionSettings.maxIncompleteSessions} incomplete sessions per user`}
            settingKey="maxIncompleteSessions"
            icon="folder-open"
            iconColor="#8b5cf6"
            value={sessionSettings.maxIncompleteSessions}
            onValueChange={(value) => updateSessionSetting('maxIncompleteSessions', value)}
            type="number"
          />
          
          <TimerSettingItem
            title="Session Timeout"
            description={`Sessions expire after ${sessionSettings.sessionTimeout} hours`}
            settingKey="sessionTimeout"
            icon="hourglass"
            iconColor="#ff4757"
            value={sessionSettings.sessionTimeout}
            onValueChange={(value) => updateSessionSetting('sessionTimeout', value)}
            type="number"
          />
          
          <TimerSettingItem
            title="Resume From Anywhere"
            description="Allow users to resume from any question"
            settingKey="allowResumeFromAnywhere"
            icon="play-skip-forward"
            iconColor="#00d4ff"
            value={sessionSettings.allowResumeFromAnywhere}
            onValueChange={(value) => updateSessionSetting('allowResumeFromAnywhere', value)}
          />
          
          <TimerSettingItem
            title="Clear Progress on Retake"
            description="Clear saved progress when user retakes test"
            settingKey="clearProgressOnRetake"
            icon="trash"
            iconColor="#ff6b6b"
            value={sessionSettings.clearProgressOnRetake}
            onValueChange={(value) => updateSessionSetting('clearProgressOnRetake', value)}
          />
        </View>

        {/* Language Settings */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <LinearGradient 
              colors={["#ff6b6b", "#ffaa00"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="language" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Language Settings</Text>
          </View>
          
          <TimerSettingItem
            title="Enable Bilingual Support"
            description="Show questions and answers in multiple languages"
            settingKey="enableBilingual"
            icon="globe"
            iconColor="#ff6b6b"
            value={languageSettings.enableBilingual}
            onValueChange={(value) => updateLanguageSetting('enableBilingual', value)}
          />
          
          <TimerSettingItem
            title="Show Language Toggle"
            description="Display language switch button during test"
            settingKey="showLanguageToggle"
            icon="swap-horizontal"
            iconColor="#ffaa00"
            value={languageSettings.showLanguageToggle}
            onValueChange={(value) => updateLanguageSetting('showLanguageToggle', value)}
          />
          
          <TimerSettingItem
            title="Allow Language Switch"
            description="Allow users to switch languages during test"
            settingKey="allowLanguageSwitch"
            icon="refresh"
            iconColor="#00ff88"
            value={languageSettings.allowLanguageSwitch}
            onValueChange={(value) => updateLanguageSetting('allowLanguageSwitch', value)}
          />
          
          <TimerSettingItem
            title="Enable Dual Language Display"
            description="Show both languages simultaneously"
            settingKey="enableDualLanguage"
            icon="globe"
            iconColor="#00ff88"
            value={languageSettings.enableDualLanguage}
            onValueChange={(value) => updateLanguageSetting('enableDualLanguage', value)}
          />
          
          <TimerSettingItem
            title="Primary Language"
            description={`Default language: ${languageSettings.primaryLanguageName}`}
            settingKey="primaryLanguageName"
            icon="flag"
            iconColor="#00d4ff"
            value={languageSettings.primaryLanguageName}
            onValueChange={(value) => updateLanguageSetting('primaryLanguageName', value)}
            type="text"
          />
          
          <TimerSettingItem
            title="Secondary Language"
            description={`Secondary language: ${languageSettings.secondaryLanguageName}`}
            settingKey="secondaryLanguageName"
            icon="flag-outline"
            iconColor="#8b5cf6"
            value={languageSettings.secondaryLanguageName}
            onValueChange={(value) => updateLanguageSetting('secondaryLanguageName', value)}
            type="text"
          />
        </View>

        {/* Offline Support */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <LinearGradient 
              colors={["#8b5cf6", "#06b6d4"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="cloud-offline" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Offline Support</Text>
          </View>
          
          <TimerSettingItem
            title="Enable Offline Mode"
            description="Allow tests to work without internet connection"
            settingKey="enableOfflineMode"
            icon="cloud-offline"
            iconColor="#8b5cf6"
            value={offlineSettings.enableOfflineMode}
            onValueChange={(value) => updateOfflineSetting('enableOfflineMode', value)}
          />
          
          <TimerSettingItem
            title="Auto Cache Questions"
            description="Automatically download questions for offline use"
            settingKey="autoCacheQuestions"
            icon="download"
            iconColor="#06b6d4"
            value={offlineSettings.autoCacheQuestions}
            onValueChange={(value) => updateOfflineSetting('autoCacheQuestions', value)}
          />
          
          <TimerSettingItem
            title="Cache Expiration"
            description={`Questions expire after ${offlineSettings.cacheExpirationHours} hours`}
            settingKey="cacheExpirationHours"
            icon="time"
            iconColor="#ff6b6b"
            value={offlineSettings.cacheExpirationHours}
            onValueChange={(value) => updateOfflineSetting('cacheExpirationHours', value)}
            type="number"
          />
          
          <TimerSettingItem
            title="Auto Sync on Reconnect"
            description="Automatically sync data when connection restored"
            settingKey="autoSyncOnReconnect"
            icon="sync"
            iconColor="#00ff88"
            value={offlineSettings.autoSyncOnReconnect}
            onValueChange={(value) => updateOfflineSetting('autoSyncOnReconnect', value)}
          />
          
          <TimerSettingItem
            title="Max Cache Size"
            description={`Maximum cache size: ${offlineSettings.maxCacheSize}MB`}
            settingKey="maxCacheSize"
            icon="hardware-chip"
            iconColor="#ffaa00"
            value={offlineSettings.maxCacheSize}
            onValueChange={(value) => updateOfflineSetting('maxCacheSize', value)}
            type="number"
          />
          
          <TimerSettingItem
            title="Enable Progress Backup"
            description="Save test progress locally for recovery"
            settingKey="enableProgressBackup"
            icon="save"
            iconColor="#00d4ff"
            value={offlineSettings.enableProgressBackup}
            onValueChange={(value) => updateOfflineSetting('enableProgressBackup', value)}
          />
          
          <TimerSettingItem
            title="Backup Interval"
            description={`Save progress every ${offlineSettings.backupInterval} minutes`}
            settingKey="backupInterval"
            icon="timer"
            iconColor="#ff4757"
            value={offlineSettings.backupInterval}
            onValueChange={(value) => updateOfflineSetting('backupInterval', value)}
            type="number"
          />
          
          <TimerSettingItem
            title="Clear Cache on Sync"
            description="Remove cached data after successful sync"
            settingKey="clearCacheOnSync"
            icon="trash"
            iconColor="#ff6b6b"
            value={offlineSettings.clearCacheOnSync}
            onValueChange={(value) => updateOfflineSetting('clearCacheOnSync', value)}
          />
        </View>

        {/* Submission Settings */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <LinearGradient 
              colors={["#ff6b6b", "#ffaa00"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="checkmark-circle" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Submission Settings</Text>
          </View>
          
          <TimerSettingItem
            title="Enable Submission Confirmation"
            description="Show confirmation alert before submitting test"
            settingKey="enableSubmissionConfirmation"
            icon="warning"
            iconColor="#ff6b6b"
            value={submissionSettings.enableSubmissionConfirmation}
            onValueChange={(value) => updateSubmissionSetting('enableSubmissionConfirmation', value)}
          />
          
          <TimerSettingItem
            title="Confirmation Message"
            description="Customize the confirmation message"
            settingKey="confirmationMessage"
            icon="chatbubble"
            iconColor="#ffaa00"
            value={submissionSettings.confirmationMessage}
            onValueChange={(value) => updateSubmissionSetting('confirmationMessage', value)}
            type="text"
          />
          
          <TimerSettingItem
            title="Success Message"
            description="Customize the success message after submission"
            settingKey="successMessage"
            icon="heart"
            iconColor="#00ff88"
            value={submissionSettings.successMessage}
            onValueChange={(value) => updateSubmissionSetting('successMessage', value)}
            type="text"
          />
          
          <TimerSettingItem
            title="Show Success Message"
            description="Display success message after submission"
            settingKey="showSuccessMessage"
            icon="eye"
            iconColor="#00d4ff"
            value={submissionSettings.showSuccessMessage}
            onValueChange={(value) => updateSubmissionSetting('showSuccessMessage', value)}
          />
          
          <TimerSettingItem
            title="Success Message Duration"
            description={`Show success message for ${submissionSettings.successMessageDuration} seconds`}
            settingKey="successMessageDuration"
            icon="timer"
            iconColor="#8b5cf6"
            value={submissionSettings.successMessageDuration}
            onValueChange={(value) => updateSubmissionSetting('successMessageDuration', value)}
            type="number"
          />
          
          <TimerSettingItem
            title="Enable Haptic Feedback"
            description="Vibrate device on submission"
            settingKey="enableHapticFeedback"
            icon="phone-portrait"
            iconColor="#ff4757"
            value={submissionSettings.enableHapticFeedback}
            onValueChange={(value) => updateSubmissionSetting('enableHapticFeedback', value)}
          />
          
          <TimerSettingItem
            title="Enable Sound Feedback"
            description="Play sound on submission"
            settingKey="enableSoundFeedback"
            icon="volume-high"
            iconColor="#00d4ff"
            value={submissionSettings.enableSoundFeedback}
            onValueChange={(value) => updateSubmissionSetting('enableSoundFeedback', value)}
          />
        </View>

        {/* Question Pool Settings */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <LinearGradient 
              colors={["#8b5cf6", "#06b6d4"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="library" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Question Pool Settings</Text>
          </View>
          
          <TimerSettingItem
            title="Enable Question Pools"
            description="Use question pools to organize test questions"
            settingKey="enableQuestionPools"
            icon="library"
            iconColor="#8b5cf6"
            value={questionPoolSettings.enableQuestionPools}
            onValueChange={(value) => updateQuestionPoolSetting('enableQuestionPools', value)}
          />
          
          <TimerSettingItem
            title="Allow Pool Selection"
            description="Allow users to select question pools"
            settingKey="allowPoolSelection"
            icon="checkmark-circle"
            iconColor="#06b6d4"
            value={questionPoolSettings.allowPoolSelection}
            onValueChange={(value) => updateQuestionPoolSetting('allowPoolSelection', value)}
          />
          
          <TimerSettingItem
            title="Require Pool Selection"
            description="Force users to select a question pool"
            settingKey="requirePoolSelection"
            icon="lock-closed"
            iconColor="#ff6b6b"
            value={questionPoolSettings.requirePoolSelection}
            onValueChange={(value) => updateQuestionPoolSetting('requirePoolSelection', value)}
          />
          
          <TimerSettingItem
            title="Show Pool Information"
            description="Display question pool details to users"
            settingKey="showPoolInfo"
            icon="information-circle"
            iconColor="#00ff88"
            value={questionPoolSettings.showPoolInfo}
            onValueChange={(value) => updateQuestionPoolSetting('showPoolInfo', value)}
          />
          
          <TimerSettingItem
            title="Randomize Within Pool"
            description="Randomize question order within selected pool"
            settingKey="randomizeWithinPool"
            icon="shuffle"
            iconColor="#ffaa00"
            value={questionPoolSettings.randomizeWithinPool}
            onValueChange={(value) => updateQuestionPoolSetting('randomizeWithinPool', value)}
          />
          
          <TimerSettingItem
            title="Pool Selection Mode"
            description={`Current mode: ${questionPoolSettings.poolSelectionMode}`}
            settingKey="poolSelectionMode"
            icon="settings"
            iconColor="#00d4ff"
            value={questionPoolSettings.poolSelectionMode}
            onValueChange={(value) => updateQuestionPoolSetting('poolSelectionMode', value)}
            type="select"
            options={[
              { label: 'Admin Only', value: 'admin' },
              { label: 'User Only', value: 'user' },
              { label: 'Both', value: 'both' },
            ]}
          />
          
          <TimerSettingItem
            title="Auto Assign Pools"
            description="Automatically assign pools based on test type"
            settingKey="autoAssignPools"
            icon="flash"
            iconColor="#ff4757"
            value={questionPoolSettings.autoAssignPools}
            onValueChange={(value) => updateQuestionPoolSetting('autoAssignPools', value)}
          />
          
          <TimerSettingItem
            title="Fallback to All Questions"
            description="Use all questions if pool is empty"
            settingKey="fallbackToAll"
            icon="refresh"
            iconColor="#8b5cf6"
            value={questionPoolSettings.poolAssignmentRules.fallbackToAll}
            onValueChange={(value) => updateQuestionPoolSetting('poolAssignmentRules', {
              ...questionPoolSettings.poolAssignmentRules,
              fallbackToAll: value
            })}
          />
        </View>

        {/* Comprehensive Checklist Management */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <LinearGradient 
              colors={["#667eea", "#764ba2"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="list" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Comprehensive Checklist Management</Text>
          </View>
          
          <TimerSettingItem
            title="Enable Checklist Management"
            description="Master control for all checklist features"
            settingKey="enableChecklistManagement"
            icon="settings"
            iconColor="#667eea"
            value={checklistManagementSettings.enableChecklistManagement}
            onValueChange={(value) => setChecklistManagementSettings(prev => ({ ...prev, enableChecklistManagement: value }))}
          />

          <TimerSettingItem
            title="Enable Checklist Creation"
            description="Allow creating new checklist types"
            settingKey="enableChecklistCreation"
            icon="add-circle"
            iconColor="#667eea"
            value={checklistManagementSettings.enableChecklistCreation}
            onValueChange={(value) => setChecklistManagementSettings(prev => ({ ...prev, enableChecklistCreation: value }))}
          />

          <TimerSettingItem
            title="Enable Checklist Editing"
            description="Allow editing existing checklist items and sections"
            settingKey="enableChecklistEditing"
            icon="create"
            iconColor="#667eea"
            value={checklistManagementSettings.enableChecklistEditing}
            onValueChange={(value) => setChecklistManagementSettings(prev => ({ ...prev, enableChecklistEditing: value }))}
          />

          <TimerSettingItem
            title="Enable Bulk Operations"
            description="Allow bulk editing, deletion, and management of checklist items"
            settingKey="enableBulkOperations"
            icon="layers"
            iconColor="#667eea"
            value={checklistManagementSettings.enableBulkOperations}
            onValueChange={(value) => setChecklistManagementSettings(prev => ({ ...prev, enableBulkOperations: value }))}
          />

          <TimerSettingItem
            title="Enable Checklist Import/Export"
            description="Allow importing and exporting checklist configurations"
            settingKey="enableChecklistImport"
            icon="download"
            iconColor="#667eea"
            value={checklistManagementSettings.enableChecklistImport}
            onValueChange={(value) => setChecklistManagementSettings(prev => ({ ...prev, enableChecklistImport: value, enableChecklistExport: value }))}
          />

          <TimerSettingItem
            title="Enable Checklist Backup/Restore"
            description="Allow backing up and restoring checklist data"
            settingKey="enableChecklistBackup"
            icon="cloud-upload"
            iconColor="#667eea"
            value={checklistManagementSettings.enableChecklistBackup}
            onValueChange={(value) => setChecklistManagementSettings(prev => ({ ...prev, enableChecklistBackup: value, enableChecklistRestore: value }))}
          />

          <TimerSettingItem
            title="Enable Checklist Analytics"
            description="Track usage statistics and performance metrics"
            settingKey="enableChecklistAnalytics"
            icon="analytics"
            iconColor="#667eea"
            value={checklistManagementSettings.enableChecklistAnalytics}
            onValueChange={(value) => setChecklistManagementSettings(prev => ({ ...prev, enableChecklistAnalytics: value, enableChecklistStatistics: value }))}
          />
        </View>

        {/* Individual Checklist Type Management */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <LinearGradient 
              colors={["#ff6b6b", "#ff8e8e"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="heart" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Individual Checklist Type Management</Text>
          </View>
          
          {checklistTypeSettings.map((checklistType, index) => (
            <View key={checklistType.checklistType} style={styles.checklistTypeContainer}>
              <View style={styles.checklistTypeHeader}>
                <View style={styles.checklistTypeInfo}>
                  <Text style={styles.checklistTypeName}>{checklistType.displayName}</Text>
                  <Text style={styles.checklistTypeDescription}>{checklistType.description}</Text>
                  <Text style={styles.checklistTypeCriteria}>
                    Pass Criteria: {checklistType.passCriteria.description}
                  </Text>
                </View>
                <Switch
                  value={checklistType.isActive}
                  onValueChange={(value) => {
                    const updated = [...checklistTypeSettings];
                    updated[index].isActive = value;
                    setChecklistTypeSettings(updated);
                  }}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={checklistType.isActive ? '#f5dd4b' : '#f4f3f4'}
                />
              </View>
              
              <View style={styles.checklistTypeDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{checklistType.checklistType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Compulsory:</Text>
                  <Text style={styles.detailValue}>{checklistType.isCompulsory ? 'Yes' : 'No'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sections:</Text>
                  <Text style={styles.detailValue}>{checklistType.sectionSettings.length}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Item Management:</Text>
                  <Text style={styles.detailValue}>
                    {checklistType.itemSettings.enableItemManagement ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* One Man CPR Checklist Settings */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <LinearGradient 
              colors={["#ff6b6b", "#ff8e8e"]} 
              style={styles.sectionIcon}
            >
              <Ionicons name="heart" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.sectionTitle}>One Man CPR Checklist Settings</Text>
          </View>
          
          <TimerSettingItem
            title="Enable Participant Selection"
            description="Allow selecting participants for assessment"
            settingKey="enableParticipantSelection"
            icon="people"
            iconColor="#ff6b6b"
            value={oneManCPRSettings.enableParticipantSelection}
            onValueChange={(value) => updateOneManCPRSetting('enableParticipantSelection', value)}
          />
          
          <TimerSettingItem
            title="Require Participant Selection"
            description="Must select participant before starting assessment"
            settingKey="requireParticipantSelection"
            icon="person-add"
            iconColor="#ff4757"
            value={oneManCPRSettings.requireParticipantSelection}
            onValueChange={(value) => updateOneManCPRSetting('requireParticipantSelection', value)}
          />
          
          <TimerSettingItem
            title="Show Participant Details"
            description="Display comprehensive participant information"
            settingKey="showParticipantDetails"
            icon="information-circle"
            iconColor="#00d4ff"
            value={oneManCPRSettings.showParticipantDetails}
            onValueChange={(value) => updateOneManCPRSetting('showParticipantDetails', value)}
          />
          
          <TimerSettingItem
            title="Enable Search Function"
            description="Allow searching participants by name, email, or job"
            settingKey="enableSearchFunction"
            icon="search"
            iconColor="#00ff88"
            value={oneManCPRSettings.enableSearchFunction}
            onValueChange={(value) => updateOneManCPRSetting('enableSearchFunction', value)}
          />
          
          <TimerSettingItem
            title="Enable Comments"
            description="Allow instructor comments and feedback"
            settingKey="enableComments"
            icon="chatbubble"
            iconColor="#8b5cf6"
            value={oneManCPRSettings.enableComments}
            onValueChange={(value) => updateOneManCPRSetting('enableComments', value)}
          />
          
          <TimerSettingItem
            title="Max Comment Length"
            description={`${oneManCPRSettings.maxCommentLength} characters maximum`}
            settingKey="maxCommentLength"
            icon="text"
            iconColor="#ffaa00"
            value={oneManCPRSettings.maxCommentLength}
            onValueChange={(value) => updateOneManCPRSetting('maxCommentLength', value)}
            type="number"
          />
          
          <TimerSettingItem
            title="Enable Compulsory Sections"
            description="Require Airway, Breathing & Circulation to pass"
            settingKey="enableCompulsorySections"
            icon="shield-checkmark"
            iconColor="#ff6b6b"
            value={oneManCPRSettings.enableCompulsorySections}
            onValueChange={(value) => updateOneManCPRSetting('enableCompulsorySections', value)}
          />
          
          <TimerSettingItem
            title="Enable Pass/Fail Logic"
            description="INCOMPLETE → FAIL → PASS status progression"
            settingKey="enablePassFailLogic"
            icon="checkmark-done"
            iconColor="#4ecdc4"
            value={oneManCPRSettings.enablePassFailLogic}
            onValueChange={(value) => updateOneManCPRSetting('enablePassFailLogic', value)}
          />
          
          <TimerSettingItem
            title="Enable Progress Tracking"
            description="Show completion percentage and progress"
            settingKey="enableProgressTracking"
            icon="trending-up"
            iconColor="#00d4ff"
            value={oneManCPRSettings.enableProgressTracking}
            onValueChange={(value) => updateOneManCPRSetting('enableProgressTracking', value)}
          />
          
          <TimerSettingItem
            title="Enable Assessment Submission"
            description="Allow submitting completed assessments"
            settingKey="enableAssessmentSubmission"
            icon="send"
            iconColor="#00ff88"
            value={oneManCPRSettings.enableAssessmentSubmission}
            onValueChange={(value) => updateOneManCPRSetting('enableAssessmentSubmission', value)}
          />
          
          <TimerSettingItem
            title="Enable Form Reset"
            description="Reset form after successful submission"
            settingKey="enableFormReset"
            icon="refresh"
            iconColor="#ffaa00"
            value={oneManCPRSettings.enableFormReset}
            onValueChange={(value) => updateOneManCPRSetting('enableFormReset', value)}
          />
          
          <TimerSettingItem
            title="Enable Status Indicators"
            description="Show visual status badges and indicators"
            settingKey="enableStatusIndicators"
            icon="flag"
            iconColor="#ff6b6b"
            value={oneManCPRSettings.enableStatusIndicators}
            onValueChange={(value) => updateOneManCPRSetting('enableStatusIndicators', value)}
          />
          
          <TimerSettingItem
            title="Enable Modern Design"
            description="Use modern UI with gradients and animations"
            settingKey="enableModernDesign"
            icon="sparkles"
            iconColor="#8b5cf6"
            value={oneManCPRSettings.enableModernDesign}
            onValueChange={(value) => updateOneManCPRSetting('enableModernDesign', value)}
          />
          
          <TimerSettingItem
            title="Enable Animations"
            description="Smooth animations and transitions"
            settingKey="enableAnimations"
            icon="flash"
            iconColor="#00d4ff"
            value={oneManCPRSettings.enableAnimations}
            onValueChange={(value) => updateOneManCPRSetting('enableAnimations', value)}
          />
          
          <TimerSettingItem
            title="Enable Haptic Feedback"
            description="Vibration feedback for interactions"
            settingKey="enableHapticFeedback"
            icon="phone-portrait"
            iconColor="#ff0080"
            value={oneManCPRSettings.enableHapticFeedback}
            onValueChange={(value) => updateOneManCPRSetting('enableHapticFeedback', value)}
          />
          
          <TimerSettingItem
            title="Enable Sound Feedback"
            description="Audio feedback for interactions"
            settingKey="enableSoundFeedback"
            icon="volume-high"
            iconColor="#5b73ff"
            value={oneManCPRSettings.enableSoundFeedback}
            onValueChange={(value) => updateOneManCPRSetting('enableSoundFeedback', value)}
          />
        </View>

        {/* Appearance */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <SettingItem
            title="Dark Mode"
            description="Use dark theme for better visibility"
            settingKey="darkMode"
            icon="moon"
            iconColor="#8b5cf6"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSettings}
          >
            <LinearGradient
              colors={['#00ff88', '#00d4ff']}
              style={styles.saveButtonGradient}
            >
              <Ionicons name="checkmark" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save Settings</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetSettings}
          >
            <LinearGradient
              colors={['rgba(255, 107, 107, 0.2)', 'rgba(255, 107, 107, 0.1)']}
              style={styles.resetButtonGradient}
            >
              <Ionicons name="refresh" size={getResponsiveSize(20, 22, 24)} color="#ff6b6b" />
              <Text style={styles.resetButtonText}>Reset to Default</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Info Card */}
        <View style={styles.infoContainer}>
          <LinearGradient
            colors={['rgba(0, 212, 255, 0.1)', 'rgba(0, 212, 255, 0.05)']}
            style={styles.infoCard}
          >
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={getResponsiveSize(24, 26, 28)} color="#00d4ff" />
              <Text style={styles.infoTitle}>Settings Information</Text>
            </View>
            <Text style={styles.infoText}>
              Configure your checklist preferences to personalize your experience. 
              Settings are automatically saved and synced across all your devices.
            </Text>
          </LinearGradient>
        </View>
      </Animated.ScrollView>

      {/* Timer Preview Modal */}
      <Modal
        visible={showTimerPreview}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimerPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TimerPreview />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(),
    paddingTop: getResponsiveSize(25, 30, 35),
    paddingBottom: getResponsiveSize(20, 25, 30),
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(139, 92, 246, 0.4)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  backButton: {
    padding: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(12, 14, 16),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: getResponsiveSize(15, 18, 20),
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
    width: getResponsiveSize(50, 55, 60),
    height: getResponsiveSize(50, 55, 60),
    borderRadius: getResponsiveSize(25, 27, 30),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSize(15, 18, 20),
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  headerIconGradient: {
    width: getResponsiveSize(50, 55, 60),
    height: getResponsiveSize(50, 55, 60),
    borderRadius: getResponsiveSize(25, 27, 30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(22, 26, 30),
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: getResponsiveSize(20, 25, 30),
    paddingBottom: getResponsiveSize(40, 50, 60),
  },
  sectionContainer: {
    marginBottom: getResponsiveSize(20, 25, 30),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(12, 16, 20),
  },
  sectionIcon: {
    width: getResponsiveSize(32, 36, 40),
    height: getResponsiveSize(32, 36, 40),
    borderRadius: getResponsiveSize(16, 18, 20),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSize(12, 16, 20),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  settingItem: {
    marginBottom: getResponsiveSize(12, 16, 20),
    borderRadius: getResponsiveSize(12, 14, 16),
    overflow: 'hidden',
  },
  settingItemGradient: {
    padding: getResponsiveSize(16, 20, 24),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: getResponsiveSize(40, 44, 48),
    height: getResponsiveSize(40, 44, 48),
    borderRadius: getResponsiveSize(20, 22, 24),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getResponsiveSize(12, 16, 20),
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: getResponsiveSize(2, 4, 6),
  },
  settingDescription: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: getResponsiveFontSize(16, 18, 20),
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: getResponsiveSize(12, 16, 20),
    marginBottom: getResponsiveSize(20, 25, 30),
  },
  saveButton: {
    flex: 1,
    borderRadius: getResponsiveSize(12, 14, 16),
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(14, 16, 18),
    gap: getResponsiveSize(8, 10, 12),
  },
  saveButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
  resetButton: {
    flex: 1,
    borderRadius: getResponsiveSize(12, 14, 16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  resetButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(14, 16, 18),
    gap: getResponsiveSize(8, 10, 12),
  },
  resetButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ff6b6b',
  },
  infoContainer: {
    marginTop: getResponsiveSize(20, 25, 30),
  },
  infoCard: {
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(20, 24, 28),
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(12, 16, 20),
  },
  infoTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: getResponsiveSize(8, 12, 16),
  },
  infoText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: getResponsiveFontSize(20, 22, 24),
  },
  // Timer Settings Styles
  numberInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(8, 10, 12),
    paddingHorizontal: getResponsiveSize(8, 10, 12),
  },
  numberButton: {
    width: getResponsiveSize(32, 36, 40),
    height: getResponsiveSize(32, 36, 40),
    borderRadius: getResponsiveSize(16, 18, 20),
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberValue: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
    marginHorizontal: getResponsiveSize(12, 16, 20),
    minWidth: getResponsiveSize(40, 44, 48),
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(8, 10, 12),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(8, 10, 12),
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    minWidth: 120,
    textAlign: 'left',
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(8, 10, 12),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(8, 10, 12),
    minWidth: 120,
  },
  selectText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#ffffff',
    flex: 1,
  },
  previewButton: {
    marginTop: getResponsiveSize(12, 16, 20),
    borderRadius: getResponsiveSize(12, 14, 16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  previewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    gap: getResponsiveSize(8, 10, 12),
  },
  previewButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#00ff88',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(),
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a1a2e',
    borderRadius: getResponsiveSize(16, 18, 20),
    padding: getResponsiveSize(20, 24, 28),
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  // Timer Preview Styles
  timerPreviewContainer: {
    alignItems: 'center',
  },
  timerPreviewTitle: {
    fontSize: getResponsiveFontSize(20, 22, 24),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: getResponsiveSize(20, 24, 28),
    textAlign: 'center',
  },
  circularTimerContainer: {
    marginBottom: getResponsiveSize(20, 24, 28),
  },
  circularTimer: {
    width: getResponsiveSize(120, 140, 160),
    height: getResponsiveSize(120, 140, 160),
    borderRadius: getResponsiveSize(60, 70, 80),
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  circularTimerText: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '900',
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: getResponsiveSize(20, 24, 28),
  },
  progressBar: {
    width: '100%',
    height: getResponsiveSize(8, 10, 12),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(4, 5, 6),
    overflow: 'hidden',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  progressBarFill: {
    height: '100%',
    borderRadius: getResponsiveSize(4, 5, 6),
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBarText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    textAlign: 'center',
  },
  warningsContainer: {
    width: '100%',
    marginBottom: getResponsiveSize(20, 24, 28),
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(8, 10, 12),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(8, 10, 12),
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  warningText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    marginLeft: getResponsiveSize(8, 10, 12),
  },
  closePreviewButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderRadius: getResponsiveSize(12, 14, 16),
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  closePreviewButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ff6b6b',
    textAlign: 'center',
  },
  // Checklist Management Styles
  checklistTypeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(16, 18, 20),
    marginBottom: getResponsiveSize(12, 14, 16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  checklistTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSize(12, 14, 16),
  },
  checklistTypeInfo: {
    flex: 1,
    marginRight: getResponsiveSize(12, 14, 16),
  },
  checklistTypeName: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  checklistTypeDescription: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: getResponsiveSize(4, 6, 8),
    lineHeight: getResponsiveFontSize(16, 18, 20),
  },
  checklistTypeCriteria: {
    fontSize: getResponsiveFontSize(11, 12, 14),
    color: 'rgba(0, 255, 136, 0.8)',
    fontWeight: '600',
  },
  checklistTypeDetails: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 14, 16),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  detailLabel: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#ffffff',
    fontWeight: '600',
  },
});
