import React, { useState, useRef } from 'react';
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
  Switch,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

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

interface ResultSettingsScreenProps {
  onBack: () => void;
}

interface ResultSettings {
  passThresholds: {
    clinical: number;
    nonClinical: number;
    customThresholds: boolean;
  };
  scoringSettings: {
    pointsPerQuestion: number;
    negativeMarking: boolean;
    partialCredit: boolean;
    timeBonus: boolean;
  };
  displaySettings: {
    showCorrectAnswers: boolean;
    showExplanations: boolean;
    showTimeSpent: boolean;
    showCategoryBreakdown: boolean;
  };
  notificationSettings: {
    notifyOnCompletion: boolean;
    notifyOnFailure: boolean;
    notifyOnRetake: boolean;
    emailNotifications: boolean;
  };
  exportSettings: {
    includePersonalInfo: boolean;
    includeDetailedAnswers: boolean;
    includeAnalytics: boolean;
    defaultFormat: 'pdf' | 'excel';
  };
}

export default function ResultSettingsScreen({ onBack }: ResultSettingsScreenProps) {
  const [settings, setSettings] = useState<ResultSettings>({
    passThresholds: {
      clinical: 25,
      nonClinical: 20,
      customThresholds: false,
    },
    scoringSettings: {
      pointsPerQuestion: 1,
      negativeMarking: false,
      partialCredit: false,
      timeBonus: false,
    },
    displaySettings: {
      showCorrectAnswers: true,
      showExplanations: true,
      showTimeSpent: true,
      showCategoryBreakdown: true,
    },
    notificationSettings: {
      notifyOnCompletion: true,
      notifyOnFailure: true,
      notifyOnRetake: false,
      emailNotifications: true,
    },
    exportSettings: {
      includePersonalInfo: true,
      includeDetailedAnswers: true,
      includeAnalytics: true,
      defaultFormat: 'pdf',
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const updateSetting = (section: keyof ResultSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Save settings logic here
    setHasChanges(false);
    setIsEditing(false);
    Alert.alert('Success', 'Settings saved successfully');
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', onPress: () => {
          // Reset to default settings
          setHasChanges(false);
          setIsEditing(false);
        }},
      ]
    );
  };

  const SettingItem = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {children}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      <LinearGradient colors={['#1e40af', '#3b82f6']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Result Settings</Text>
            <Text style={styles.headerSubtitle}>Configure pass thresholds and display options</Text>
          </View>
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsEditing(!isEditing);
            }}
          >
            <Ionicons name={isEditing ? "checkmark" : "create"} size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Pass Thresholds */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>🎯 Pass Thresholds</Text>
          
          <View style={styles.sectionCard}>
            <SettingItem
              title="Clinical Pass Score"
              subtitle="Minimum score required for clinical staff"
            >
              <TextInput
                style={[styles.numberInput, !isEditing && styles.disabledInput]}
                value={settings.passThresholds.clinical.toString()}
                onChangeText={(text) => updateSetting('passThresholds', 'clinical', parseInt(text) || 0)}
                keyboardType="numeric"
                editable={isEditing}
                maxLength={2}
              />
            </SettingItem>
            
            <SettingItem
              title="Non-Clinical Pass Score"
              subtitle="Minimum score required for non-clinical staff"
            >
              <TextInput
                style={[styles.numberInput, !isEditing && styles.disabledInput]}
                value={settings.passThresholds.nonClinical.toString()}
                onChangeText={(text) => updateSetting('passThresholds', 'nonClinical', parseInt(text) || 0)}
                keyboardType="numeric"
                editable={isEditing}
                maxLength={2}
              />
            </SettingItem>
            
            <SettingItem
              title="Custom Thresholds"
              subtitle="Allow custom pass thresholds per test"
            >
              <Switch
                value={settings.passThresholds.customThresholds}
                onValueChange={(value) => updateSetting('passThresholds', 'customThresholds', value)}
                disabled={!isEditing}
              />
            </SettingItem>
          </View>
        </Animated.View>

        {/* Scoring Settings */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>📊 Scoring Settings</Text>
          
          <View style={styles.sectionCard}>
            <SettingItem
              title="Points per Question"
              subtitle="Points awarded for each correct answer"
            >
              <TextInput
                style={[styles.numberInput, !isEditing && styles.disabledInput]}
                value={settings.scoringSettings.pointsPerQuestion.toString()}
                onChangeText={(text) => updateSetting('scoringSettings', 'pointsPerQuestion', parseInt(text) || 1)}
                keyboardType="numeric"
                editable={isEditing}
                maxLength={2}
              />
            </SettingItem>
            
            <SettingItem
              title="Negative Marking"
              subtitle="Deduct points for incorrect answers"
            >
              <Switch
                value={settings.scoringSettings.negativeMarking}
                onValueChange={(value) => updateSetting('scoringSettings', 'negativeMarking', value)}
                disabled={!isEditing}
              />
            </SettingItem>
            
            <SettingItem
              title="Partial Credit"
              subtitle="Award partial points for partially correct answers"
            >
              <Switch
                value={settings.scoringSettings.partialCredit}
                onValueChange={(value) => updateSetting('scoringSettings', 'partialCredit', value)}
                disabled={!isEditing}
              />
            </SettingItem>
            
            <SettingItem
              title="Time Bonus"
              subtitle="Award bonus points for quick completion"
            >
              <Switch
                value={settings.scoringSettings.timeBonus}
                onValueChange={(value) => updateSetting('scoringSettings', 'timeBonus', value)}
                disabled={!isEditing}
              />
            </SettingItem>
          </View>
        </Animated.View>

        {/* Display Settings */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>👁️ Display Settings</Text>
          
          <View style={styles.sectionCard}>
            <SettingItem
              title="Show Correct Answers"
              subtitle="Display correct answers in results"
            >
              <Switch
                value={settings.displaySettings.showCorrectAnswers}
                onValueChange={(value) => updateSetting('displaySettings', 'showCorrectAnswers', value)}
                disabled={!isEditing}
              />
            </SettingItem>
            
            <SettingItem
              title="Show Explanations"
              subtitle="Display question explanations in results"
            >
              <Switch
                value={settings.displaySettings.showExplanations}
                onValueChange={(value) => updateSetting('displaySettings', 'showExplanations', value)}
                disabled={!isEditing}
              />
            </SettingItem>
            
            <SettingItem
              title="Show Time Spent"
              subtitle="Display time spent per question"
            >
              <Switch
                value={settings.displaySettings.showTimeSpent}
                onValueChange={(value) => updateSetting('displaySettings', 'showTimeSpent', value)}
                disabled={!isEditing}
              />
            </SettingItem>
            
            <SettingItem
              title="Show Category Breakdown"
              subtitle="Display performance by category"
            >
              <Switch
                value={settings.displaySettings.showCategoryBreakdown}
                onValueChange={(value) => updateSetting('displaySettings', 'showCategoryBreakdown', value)}
                disabled={!isEditing}
              />
            </SettingItem>
          </View>
        </Animated.View>

        {/* Notification Settings */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>🔔 Notification Settings</Text>
          
          <View style={styles.sectionCard}>
            <SettingItem
              title="Notify on Completion"
              subtitle="Send notification when test is completed"
            >
              <Switch
                value={settings.notificationSettings.notifyOnCompletion}
                onValueChange={(value) => updateSetting('notificationSettings', 'notifyOnCompletion', value)}
                disabled={!isEditing}
              />
            </SettingItem>
            
            <SettingItem
              title="Notify on Failure"
              subtitle="Send notification when test is failed"
            >
              <Switch
                value={settings.notificationSettings.notifyOnFailure}
                onValueChange={(value) => updateSetting('notificationSettings', 'notifyOnFailure', value)}
                disabled={!isEditing}
              />
            </SettingItem>
            
            <SettingItem
              title="Notify on Retake"
              subtitle="Send notification when retake is available"
            >
              <Switch
                value={settings.notificationSettings.notifyOnRetake}
                onValueChange={(value) => updateSetting('notificationSettings', 'notifyOnRetake', value)}
                disabled={!isEditing}
              />
            </SettingItem>
            
            <SettingItem
              title="Email Notifications"
              subtitle="Send notifications via email"
            >
              <Switch
                value={settings.notificationSettings.emailNotifications}
                onValueChange={(value) => updateSetting('notificationSettings', 'emailNotifications', value)}
                disabled={!isEditing}
              />
            </SettingItem>
          </View>
        </Animated.View>

        {/* Export Settings */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>📤 Export Settings</Text>
          
          <View style={styles.sectionCard}>
            <SettingItem
              title="Include Personal Info"
              subtitle="Include participant information in exports"
            >
              <Switch
                value={settings.exportSettings.includePersonalInfo}
                onValueChange={(value) => updateSetting('exportSettings', 'includePersonalInfo', value)}
                disabled={!isEditing}
              />
            </SettingItem>
            
            <SettingItem
              title="Include Detailed Answers"
              subtitle="Include question-by-question answers in exports"
            >
              <Switch
                value={settings.exportSettings.includeDetailedAnswers}
                onValueChange={(value) => updateSetting('exportSettings', 'includeDetailedAnswers', value)}
                disabled={!isEditing}
              />
            </SettingItem>
            
            <SettingItem
              title="Include Analytics"
              subtitle="Include performance analytics in exports"
            >
              <Switch
                value={settings.exportSettings.includeAnalytics}
                onValueChange={(value) => updateSetting('exportSettings', 'includeAnalytics', value)}
                disabled={!isEditing}
              />
            </SettingItem>
            
            <SettingItem
              title="Default Export Format"
              subtitle="Default format for result exports"
            >
              <View style={styles.formatSelector}>
                <TouchableOpacity
                  style={[
                    styles.formatButton,
                    settings.exportSettings.defaultFormat === 'pdf' && styles.formatButtonActive
                  ]}
                  onPress={() => updateSetting('exportSettings', 'defaultFormat', 'pdf')}
                  disabled={!isEditing}
                >
                  <Text style={[
                    styles.formatButtonText,
                    settings.exportSettings.defaultFormat === 'pdf' && styles.formatButtonTextActive
                  ]}>
                    PDF
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.formatButton,
                    settings.exportSettings.defaultFormat === 'excel' && styles.formatButtonActive
                  ]}
                  onPress={() => updateSetting('exportSettings', 'defaultFormat', 'excel')}
                  disabled={!isEditing}
                >
                  <Text style={[
                    styles.formatButtonText,
                    settings.exportSettings.defaultFormat === 'excel' && styles.formatButtonTextActive
                  ]}>
                    Excel
                  </Text>
                </TouchableOpacity>
              </View>
            </SettingItem>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        {isEditing && (
          <Animated.View style={[styles.actions, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Ionicons name="refresh" size={20} color="#ef4444" />
              <Text style={styles.resetButtonText}>Reset to Default</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!hasChanges}
            >
              <Ionicons name="save" size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: getResponsiveSize(40, 50, 60),
    paddingBottom: getResponsiveSize(16, 20, 24),
    paddingHorizontal: getResponsiveSize(16, 20, 24),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(8, 10, 12),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: getResponsiveSize(16, 20, 24),
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(20, 24, 28),
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  editButton: {
    padding: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(8, 10, 12),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
    paddingHorizontal: getResponsiveSize(16, 20, 24),
  },
  section: {
    marginTop: getResponsiveSize(16, 20, 24),
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: getResponsiveSize(12, 16, 20),
    padding: getResponsiveSize(16, 20, 24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveSize(12, 16, 20),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flex: 1,
    marginRight: getResponsiveSize(12, 16, 20),
  },
  settingTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#6b7280',
  },
  numberInput: {
    width: getResponsiveSize(60, 70, 80),
    height: getResponsiveSize(40, 44, 48),
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: getResponsiveSize(8, 10, 12),
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    textAlign: 'center',
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
  },
  formatSelector: {
    flexDirection: 'row',
    gap: getResponsiveSize(8, 10, 12),
  },
  formatButton: {
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    paddingVertical: getResponsiveSize(6, 8, 10),
    borderRadius: getResponsiveSize(6, 8, 10),
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  formatButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  formatButtonText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#6b7280',
  },
  formatButtonTextActive: {
    color: '#ffffff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveSize(20, 24, 28),
    marginBottom: getResponsiveSize(20, 24, 28),
    gap: getResponsiveSize(12, 16, 20),
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    borderRadius: getResponsiveSize(8, 10, 12),
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#ffffff',
    gap: getResponsiveSize(6, 8, 10),
  },
  resetButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ef4444',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    borderRadius: getResponsiveSize(8, 10, 12),
    backgroundColor: '#3b82f6',
    gap: getResponsiveSize(6, 8, 10),
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
});
