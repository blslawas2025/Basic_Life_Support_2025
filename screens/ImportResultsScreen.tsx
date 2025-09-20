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
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import CalendarPicker from '../components/CalendarPicker';
import * as FileSystem from 'expo-file-system';

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

interface ImportResultsScreenProps {
  onBack: () => void;
}

interface ImportResult {
  id: string;
  participantName: string;
  participantEmail: string;
  testType: 'pre_test' | 'post_test';
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  submittedAt: string;
  answers: { [questionId: string]: string };
  isValid: boolean;
  errors: string[];
}

export default function ImportResultsScreen({ onBack }: ImportResultsScreenProps) {
  const [importMode, setImportMode] = useState<'single' | 'bulk'>('single');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [importedResults, setImportedResults] = useState<ImportResult[]>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [importStatus, setImportStatus] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  // Single import form data
  const [singleImportData, setSingleImportData] = useState({
    participantName: '',
    participantEmail: '',
    testType: 'pre_test' as 'pre_test' | 'post_test',
    score: '',
    totalQuestions: '30',
    correctAnswers: '',
    timeTaken: '',
    submittedAt: new Date().toISOString().split('T')[0],
  });

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
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
  }, []);

  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        await processBulkImport(file.uri);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const processBulkImport = async (fileUri: string) => {
    try {
      setIsLoading(true);
      setImportStatus('Reading file...');
      
      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const results = parseCSVContent(fileContent);
      
      setImportedResults(results);
      setShowPreview(true);
      setImportStatus('File processed successfully');
    } catch (error) {
      console.error('Error processing file:', error);
      Alert.alert('Error', 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  };

  const parseCSVContent = (content: string): ImportResult[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const results: ImportResult[] = [];
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map(col => col.trim().replace(/"/g, ''));
      
      if (columns.length >= 8) {
        const result: ImportResult = {
          id: `import_${Date.now()}_${i}`,
          participantName: columns[0] || 'Unknown',
          participantEmail: columns[1] || '',
          testType: columns[2] as 'pre_test' | 'post_test' || 'pre_test',
          score: parseInt(columns[3]) || 0,
          totalQuestions: parseInt(columns[4]) || 30,
          correctAnswers: parseInt(columns[5]) || 0,
          timeTaken: parseInt(columns[6]) || 0,
          submittedAt: columns[7] || new Date().toISOString(),
          answers: {},
          isValid: true,
          errors: [],
        };
        
        // Validate result
        const validation = validateImportResult(result);
        result.isValid = validation.isValid;
        result.errors = validation.errors;
        
        results.push(result);
      }
    }
    
    return results;
  };

  const validateImportResult = (result: ImportResult): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!result.participantName.trim()) {
      errors.push('Participant name is required');
    }
    
    if (!result.participantEmail.trim() || !result.participantEmail.includes('@')) {
      errors.push('Valid email is required');
    }
    
    if (result.score < 0 || result.score > result.totalQuestions) {
      errors.push('Score must be between 0 and total questions');
    }
    
    if (result.correctAnswers < 0 || result.correctAnswers > result.totalQuestions) {
      errors.push('Correct answers must be between 0 and total questions');
    }
    
    if (result.timeTaken < 0) {
      errors.push('Time taken must be positive');
    }
    
    if (!result.testType || !['pre_test', 'post_test'].includes(result.testType)) {
      errors.push('Test type must be pre_test or post_test');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleSingleImport = async () => {
    try {
      setIsLoading(true);
      setImportStatus('Validating data...');
      
      const result: ImportResult = {
        id: `single_${Date.now()}`,
        participantName: singleImportData.participantName,
        participantEmail: singleImportData.participantEmail,
        testType: singleImportData.testType,
        score: parseInt(singleImportData.score) || 0,
        totalQuestions: parseInt(singleImportData.totalQuestions) || 30,
        correctAnswers: parseInt(singleImportData.correctAnswers) || 0,
        timeTaken: parseInt(singleImportData.timeTaken) || 0,
        submittedAt: singleImportData.submittedAt,
        answers: {},
        isValid: true,
        errors: [],
      };
      
      const validation = validateImportResult(result);
      result.isValid = validation.isValid;
      result.errors = validation.errors;
      
      if (!result.isValid) {
        setValidationErrors(result.errors);
        Alert.alert('Validation Error', result.errors.join('\n'));
        return;
      }
      
      setImportedResults([result]);
      setShowPreview(true);
      setImportStatus('Data validated successfully');
    } catch (error) {
      console.error('Error importing single result:', error);
      Alert.alert('Error', 'Failed to import result');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkImport = async () => {
    try {
      setIsLoading(true);
      setImportProgress(0);
      setImportStatus('Importing results...');
      
      const validResults = importedResults.filter(result => result.isValid);
      const invalidResults = importedResults.filter(result => !result.isValid);
      
      if (invalidResults.length > 0) {
        Alert.alert(
          'Invalid Results Found',
          `${invalidResults.length} results have validation errors. Do you want to import only valid results?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Import Valid Only', onPress: () => importValidResults(validResults) },
          ]
        );
        return;
      }
      
      await importValidResults(validResults);
    } catch (error) {
      console.error('Error importing bulk results:', error);
      Alert.alert('Error', 'Failed to import results');
    } finally {
      setIsLoading(false);
    }
  };

  const importValidResults = async (results: ImportResult[]) => {
    try {
      setImportStatus('Saving to database...');
      
      // Simulate import process
      for (let i = 0; i < results.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setImportProgress(((i + 1) / results.length) * 100);
        setImportStatus(`Importing result ${i + 1} of ${results.length}...`);
      }
      
      setImportStatus(`Successfully imported ${results.length} results`);
      Alert.alert('Success', `Successfully imported ${results.length} results`);
      
      // Reset form
      setImportedResults([]);
      setShowPreview(false);
      setSingleImportData({
        participantName: '',
        participantEmail: '',
        testType: 'pre_test',
        score: '',
        totalQuestions: '30',
        correctAnswers: '',
        timeTaken: '',
        submittedAt: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error saving results:', error);
      Alert.alert('Error', 'Failed to save results to database');
    }
  };

  const getValidationColor = (isValid: boolean) => {
    return isValid ? '#22c55e' : '#ef4444';
  };

  const getValidationIcon = (isValid: boolean) => {
    return isValid ? 'checkmark-circle' : 'close-circle';
  };

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
            <Text style={styles.headerTitle}>Import Results</Text>
            <Text style={styles.headerSubtitle}>Import single or bulk test results</Text>
          </View>
          
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              Alert.alert(
                'Import Help',
                'Single Import: Enter individual result data manually\n\nBulk Import: Upload CSV file with columns:\nName, Email, Test Type, Score, Total Questions, Correct Answers, Time Taken, Submitted At'
              );
            }}
          >
            <Ionicons name="help-circle-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Import Mode Selection */}
        <Animated.View style={[
          styles.sectionContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <Text style={styles.sectionTitle}>📥 Import Mode</Text>
          
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                importMode === 'single' && styles.modeButtonActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setImportMode('single');
              }}
            >
              <Ionicons 
                name="person-add" 
                size={24} 
                color={importMode === 'single' ? '#ffffff' : '#3b82f6'} 
              />
              <Text style={[
                styles.modeButtonText,
                importMode === 'single' && styles.modeButtonTextActive
              ]}>
                Single Import
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modeButton,
                importMode === 'bulk' && styles.modeButtonActive
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setImportMode('bulk');
              }}
            >
              <Ionicons 
                name="cloud-upload" 
                size={24} 
                color={importMode === 'bulk' ? '#ffffff' : '#3b82f6'} 
              />
              <Text style={[
                styles.modeButtonText,
                importMode === 'bulk' && styles.modeButtonTextActive
              ]}>
                Bulk Import
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Single Import Form */}
        {importMode === 'single' && (
          <Animated.View style={[
            styles.sectionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <Text style={styles.sectionTitle}>👤 Single Result Import</Text>
            
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Participant Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={singleImportData.participantName}
                  onChangeText={(text) => setSingleImportData(prev => ({ ...prev, participantName: text }))}
                  placeholder="Enter participant name"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.textInput}
                  value={singleImportData.participantEmail}
                  onChangeText={(text) => setSingleImportData(prev => ({ ...prev, participantEmail: text }))}
                  placeholder="Enter email address"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Test Type *</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      singleImportData.testType === 'pre_test' && styles.radioButtonActive
                    ]}
                    onPress={() => setSingleImportData(prev => ({ ...prev, testType: 'pre_test' }))}
                  >
                    <Text style={[
                      styles.radioButtonText,
                      singleImportData.testType === 'pre_test' && styles.radioButtonTextActive
                    ]}>
                      Pre-Test
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      singleImportData.testType === 'post_test' && styles.radioButtonActive
                    ]}
                    onPress={() => setSingleImportData(prev => ({ ...prev, testType: 'post_test' }))}
                  >
                    <Text style={[
                      styles.radioButtonText,
                      singleImportData.testType === 'post_test' && styles.radioButtonTextActive
                    ]}>
                      Post-Test
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Score *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={singleImportData.score}
                    onChangeText={(text) => setSingleImportData(prev => ({ ...prev, score: text }))}
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Total Questions</Text>
                  <TextInput
                    style={styles.textInput}
                    value={singleImportData.totalQuestions}
                    onChangeText={(text) => setSingleImportData(prev => ({ ...prev, totalQuestions: text }))}
                    placeholder="30"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Correct Answers *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={singleImportData.correctAnswers}
                    onChangeText={(text) => setSingleImportData(prev => ({ ...prev, correctAnswers: text }))}
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Time Taken (seconds)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={singleImportData.timeTaken}
                    onChangeText={(text) => setSingleImportData(prev => ({ ...prev, timeTaken: text }))}
                    placeholder="0"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Submitted Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {singleImportData.submittedAt ? 
                      new Date(singleImportData.submittedAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 
                      'Select Date'
                    }
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#00d4ff" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.importButton}
                onPress={handleSingleImport}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={20} color="#ffffff" />
                    <Text style={styles.importButtonText}>Import Single Result</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Bulk Import */}
        {importMode === 'bulk' && (
          <Animated.View style={[
            styles.sectionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <Text style={styles.sectionTitle}>📁 Bulk Import</Text>
            
            <View style={styles.bulkImportContainer}>
              <TouchableOpacity
                style={styles.filePickerButton}
                onPress={handleFilePicker}
                disabled={isLoading}
              >
                <Ionicons name="document-outline" size={48} color="#3b82f6" />
                <Text style={styles.filePickerText}>
                  {selectedFile ? selectedFile.name : 'Select CSV File'}
                </Text>
                <Text style={styles.filePickerSubtext}>
                  Supported formats: CSV, Excel
                </Text>
              </TouchableOpacity>
              
              {selectedFile && (
                <View style={styles.fileInfo}>
                  <Text style={styles.fileInfoText}>
                    File: {selectedFile.name}
                  </Text>
                  <Text style={styles.fileInfoText}>
                    Size: {(selectedFile.size / 1024).toFixed(2)} KB
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Import Progress */}
        {isLoading && (
          <Animated.View style={[
            styles.sectionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <Text style={styles.sectionTitle}>⏳ Import Progress</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${importProgress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{importProgress.toFixed(0)}%</Text>
            </View>
            
            <Text style={styles.statusText}>{importStatus}</Text>
          </Animated.View>
        )}

        {/* Preview Results */}
        {showPreview && importedResults.length > 0 && (
          <Animated.View style={[
            styles.sectionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <View style={styles.previewHeader}>
              <Text style={styles.sectionTitle}>👀 Preview Results</Text>
              <Text style={styles.previewCount}>
                {importedResults.length} result{importedResults.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <FlatList
              data={importedResults}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={[
                  styles.resultPreviewCard,
                  { borderLeftColor: getValidationColor(item.isValid) }
                ]}>
                  <View style={styles.resultPreviewHeader}>
                    <View style={styles.resultPreviewInfo}>
                      <Text style={styles.resultPreviewName}>{item.participantName}</Text>
                      <Text style={styles.resultPreviewEmail}>{item.participantEmail}</Text>
                    </View>
                    
                    <View style={styles.resultPreviewBadges}>
                      <View style={[
                        styles.testTypeBadge,
                        { backgroundColor: item.testType === 'pre_test' ? '#3b82f6' : '#22c55e' }
                      ]}>
                        <Text style={styles.testTypeBadgeText}>
                          {item.testType === 'pre_test' ? 'Pre-Test' : 'Post-Test'}
                        </Text>
                      </View>
                      
                      <View style={[
                        styles.validationBadge,
                        { backgroundColor: getValidationColor(item.isValid) }
                      ]}>
                        <Ionicons 
                          name={getValidationIcon(item.isValid)} 
                          size={16} 
                          color="#ffffff" 
                        />
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.resultPreviewStats}>
                    <Text style={styles.resultPreviewStat}>
                      Score: {item.score}/{item.totalQuestions}
                    </Text>
                    <Text style={styles.resultPreviewStat}>
                      Correct: {item.correctAnswers}
                    </Text>
                    <Text style={styles.resultPreviewStat}>
                      Time: {Math.floor(item.timeTaken / 60)}:{(item.timeTaken % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                  
                  {!item.isValid && item.errors.length > 0 && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorTitle}>Validation Errors:</Text>
                      {item.errors.map((error, index) => (
                        <Text key={index} style={styles.errorText}>• {error}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            />
            
            <View style={styles.previewActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#6b7280' }]}
                onPress={() => {
                  setShowPreview(false);
                  setImportedResults([]);
                }}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
                onPress={handleBulkImport}
                disabled={isLoading}
              >
                <Text style={styles.actionButtonText}>Import Results</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Calendar Picker */}
      <CalendarPicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={(date) => {
          setSingleImportData(prev => ({ ...prev, submittedAt: date }));
          setShowDatePicker(false);
        }}
        title="Select Submitted Date"
        initialDate={singleImportData.submittedAt ? new Date(singleImportData.submittedAt) : new Date()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  helpButton: {
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
  modeSelector: {
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
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 24,
  },
  modeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 24,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  radioButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  radioButtonTextActive: {
    color: '#3b82f6',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 24,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  bulkImportContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filePickerButton: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 24,
    backgroundColor: '#f9fafb',
    minWidth: 200,
  },
  filePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginTop: 24,
    textAlign: 'center',
  },
  filePickerSubtext: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 24,
    textAlign: 'center',
  },
  fileInfo: {
    marginTop: 24,
    padding: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    width: '100%',
  },
  fileInfoText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  progressContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBar: {
    height: 24,
    backgroundColor: '#e5e7eb',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 24,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 24,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  previewCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  resultPreviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  resultPreviewInfo: {
    flex: 1,
  },
  resultPreviewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  resultPreviewEmail: {
    fontSize: 16,
    color: '#6b7280',
  },
  resultPreviewBadges: {
    flexDirection: 'row',
    gap: 24,
  },
  testTypeBadge: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
  },
  testTypeBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  validationBadge: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultPreviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  resultPreviewStat: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 24,
    padding: 24,
    marginTop: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 24,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  dateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#ffffff',
    flex: 1,
  },
});
