import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Alert, Modal, ScrollView, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';
import { FileParser, ParsedFileResult } from '../utils/fileParser';
import { QuestionImportFormat } from '../types/Question';
import { supabase } from '../services/supabase';

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

interface UploadQuestionsScreenProps {
  onBack: () => void;
}

interface SelectedFile {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

interface PreviewQuestion extends QuestionImportFormat {
  id: string;
  validationErrors?: string[];
  isValid?: boolean;
  correct_answer?: string;
}

export default function UploadQuestionsScreen({ onBack }: UploadQuestionsScreenProps) {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<PreviewQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [showImportAlert, setShowImportAlert] = useState<boolean>(false);
  const [parsingErrors, setParsingErrors] = useState<string[]>([]);
  const [parsingWarnings, setParsingWarnings] = useState<string[]>([]);
  const [questionSetName, setQuestionSetName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'pre_test' | 'post_test'>('pre_test');
  const [showSaveMenu, setShowSaveMenu] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [currentQuestionText, setCurrentQuestionText] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simple fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderProgressBar = () => {
    if (!isLoading && !importSuccess && totalQuestions === 0) return null;

    const progressPercentage = importSuccess ? 100 : Math.round((currentQuestionIndex / totalQuestions) * 100);
    const progressWidth = importSuccess ? 100 : (currentQuestionIndex / totalQuestions) * 100;

    return (
      <View style={[styles.progressContainer, importSuccess && styles.progressContainerSuccess]}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>
            {importSuccess ? '✅ Import Successful!' : 'Importing Questions'}
          </Text>
          <Text style={[styles.progressPercentage, importSuccess && styles.progressPercentageSuccess]}>
            {progressPercentage}%
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBarFill,
                importSuccess && styles.progressBarFillSuccess,
                { width: `${progressWidth}%` }
              ]}
            />
          </View>
        </View>
        
        <View style={styles.progressDetails}>
          {importSuccess ? (
            <Text style={styles.successMessage}>
              {successMessage}
            </Text>
          ) : (
            <>
              <Text style={styles.progressCounter}>
                {currentQuestionIndex} of {totalQuestions} questions
              </Text>
              {currentQuestionText && (
                <Text style={styles.currentQuestionText}>
                  {truncateText(currentQuestionText, 80)}
                </Text>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  const renderAnswerChoice = (optionText: string, optionTextEn: string | undefined, label: string, questionId: string, isSelected: boolean) => {
    return (
      <TouchableOpacity 
        style={[styles.answerChoice, isSelected && styles.answerChoiceSelected]}
        onPress={() => handleAnswerSelection(questionId, label)}
      >
        <Text style={[styles.answerChoiceLabel, isSelected && styles.answerChoiceLabelSelected]}>{label}.</Text>
        <View style={styles.answerChoiceContent}>
          <Text style={[styles.answerChoiceText, isSelected && styles.answerChoiceTextSelected]}>{optionText}</Text>
          {optionTextEn && (
            <Text style={[styles.answerChoiceTextEn, isSelected && styles.answerChoiceTextEnSelected]}>{optionTextEn}</Text>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#00ff88" style={styles.correctAnswerIcon} />
        )}
      </TouchableOpacity>
    );
  };

  const handleAnswerSelection = (questionId: string, answer: string) => {
    setPreviewQuestions(prev => 
      prev.map(q => 
        q.id === questionId 
          ? { ...q, correct_answer: answer }
          : q
      )
    );
  };

  const handleFileUpload = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        // Store selected file
        setSelectedFile({
          uri: file.uri,
          name: file.name || 'Unknown File',
          size: file.size || 0,
          mimeType: file.mimeType || 'unknown'
        });
        
        // Parse the actual file
        await parseUploadedFile(file.uri, file.name || 'Unknown File');
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  const parseUploadedFile = async (fileUri: string, fileName: string) => {
    try {
      setIsParsing(true);
      setParsingErrors([]);
      setParsingWarnings([]);
      setPreviewQuestions([]);
      
      // Parse the file using our FileParser utility
      const parseResult: ParsedFileResult = await FileParser.parseFile(fileUri, fileName);
      
      if (!parseResult.success) {
        setParsingErrors(parseResult.errors);
        Alert.alert(
          'File Parsing Error', 
          `Failed to parse the file:\n\n${parseResult.errors.join('\n')}`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Validate the parsed questions
      const validation = FileParser.validateQuestions(parseResult.data);
      
      // Convert to preview questions with validation info
      const previewQuestions: PreviewQuestion[] = parseResult.data.map((question, index) => {
        const invalidQuestion = validation.invalid.find(inv => inv.question === question);
        return {
          ...question,
          id: `preview-${index}`,
          isValid: !invalidQuestion,
          validationErrors: invalidQuestion?.errors || []
        };
      });
      
      setPreviewQuestions(previewQuestions);
      setParsingErrors(parseResult.errors);
      setParsingWarnings(parseResult.warnings);
      
      // Show success message for file parsing
      const validCount = previewQuestions.filter(q => q.isValid).length;
      const invalidCount = previewQuestions.filter(q => !q.isValid).length;
      
      if (validCount > 0) {
        Alert.alert(
          '✅ File Parsed Successfully!',
          `Successfully parsed ${previewQuestions.length} questions from your file.\n\n✅ Valid: ${validCount} questions\n${invalidCount > 0 ? `❌ Invalid: ${invalidCount} questions` : ''}\n\nYou can now review and select correct answers before importing.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ No Valid Questions Found',
          `The file was parsed but no valid questions were found.\n\n❌ Invalid: ${invalidCount} questions\n\nPlease check your file format and ensure it contains properly formatted questions.`,
          [{ text: 'OK' }]
        );
      }
      
      // Show warnings if any
      if (parseResult.warnings.length > 0) {
        Alert.alert(
          '⚠️ File Parsing Warnings', 
          `The file was parsed with some warnings:\n\n${parseResult.warnings.join('\n')}`,
          [{ text: 'OK' }]
        );
      }
      
      } catch (error) {
      console.error('Error parsing file:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      setParsingErrors([`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      Alert.alert('Error', 'Failed to parse the uploaded file. Please check the file format and try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = () => {
    setShowImportAlert(true);
  };

  const confirmImport = async () => {
    try {
      setIsLoading(true);
      setShowImportAlert(false);
      // Show upload started alert
      Alert.alert(
        '📤 Upload Started',
        `Starting upload of ${previewQuestions.filter(q => q.isValid).length} questions...\n\nPlease wait while we process your questions.`,
        [{ text: 'OK' }]
      );
      
      // Add a small delay to ensure the alert is shown
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Validate required fields
      if (!questionSetName.trim()) {
        Alert.alert('Missing Information', 'Please enter a question set name.');
        setIsLoading(false);
        return;
      }
      
      // Filter out invalid questions
      const validQuestions = previewQuestions.filter(q => q.isValid);
      
      if (validQuestions.length === 0) {
        Alert.alert(
          'No Valid Questions', 
          'All questions have validation errors. Please fix the issues and try again.',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }
      
      // Check if all questions have correct answers
      const questionsWithoutAnswers = validQuestions.filter(q => !q.correct_answer);
      if (questionsWithoutAnswers.length > 0) {
        Alert.alert(
          'Missing Correct Answers', 
          `Please select correct answers for all questions. ${questionsWithoutAnswers.length} question(s) are missing correct answers.`,
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }
      
      // Convert to QuestionImportFormat for import
      const questionsToImport: QuestionImportFormat[] = validQuestions.map(q => ({
        question_text: q.question_text,
        question_text_en: q.question_text_en,
        question_type: q.question_type,
        difficulty_level: q.difficulty_level,
        category: q.category,
        points: q.points,
        time_limit_seconds: q.time_limit_seconds,
        explanation: q.explanation,
        correct_answer: q.correct_answer,
        option_a: q.option_a,
        option_a_en: q.option_a_en,
        option_b: q.option_b,
        option_b_en: q.option_b_en,
        option_c: q.option_c,
        option_c_en: q.option_c_en,
        option_d: q.option_d,
        option_d_en: q.option_d_en,
        tags: questionSetName.trim() || q.tags,
        test_type: selectedCategory
      }));
      
      // Import using QuestionService
      let result;
      try {
        const { QuestionService } = await import('../services/QuestionService');
        // Test connection first
        const { data: testData, error: testError } = await supabase
          .from('questions')
          .select('count')
          .limit(1);
        
        if (testError) {
          throw new Error(`Database connection failed: ${testError.message}`);
        }
        
        // Set up progress tracking
        setTotalQuestions(questionsToImport.length);
        setCurrentQuestionIndex(0);
        setImportProgress(0);
        
        // Create progress tracking upload function
        const uploadWithProgress = async (questions: any[]) => {
          let successful = 0;
          let failed = 0;
          const errors: string[] = [];
          
          // Process questions one by one to track progress
          for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            setCurrentQuestionIndex(i);
            setCurrentQuestionText(question.question_text);
            
            try {
              // Create question using QuestionService
              await QuestionService.createQuestion({
                question_text: question.question_text,
                question_text_en: question.question_text_en,
                question_type: question.question_type as any,
                difficulty_level: question.difficulty_level as any,
                category: question.category as any,
                points: question.points,
                time_limit_seconds: question.time_limit_seconds,
                explanation: question.explanation,
                tags: question.tags ? [question.tags] : undefined,
                test_type: question.test_type as any,
                correct_answer: question.correct_answer,
                option_a: question.option_a,
                option_a_en: question.option_a_en,
                option_b: question.option_b,
                option_b_en: question.option_b_en,
                option_c: question.option_c,
                option_c_en: question.option_c_en,
                option_d: question.option_d,
                option_d_en: question.option_d_en,
              });
              
              successful++;
            } catch (error) {
              failed++;
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              errors.push(`Question ${i + 1}: ${errorMessage}`);
            }
            
            // Add small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          return {
            success: successful > 0,
            message: `Upload completed: ${successful} successful, ${failed} failed`,
            stats: {
              totalProcessed: questions.length,
              successful,
              failed,
              errors
            }
          };
        };
        
        // Add timeout to prevent hanging
        const uploadPromise = uploadWithProgress(questionsToImport);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
        );
        
        result = await Promise.race([uploadPromise, timeoutPromise]);
        } catch (importError) {
        console.error('Error during import process:', importError);
        throw new Error(`Import process failed: ${importError instanceof Error ? importError.message : 'Unknown error'}`);
      }
      
      // Add a small delay to ensure the loading state is visible
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (result.success) {
        // Auto-create question pool for the uploaded questions
        try {
          const { QuestionPoolService } = await import('../services/QuestionPoolService');
          
          // Get the question IDs that were just created
          const { data: createdQuestions, error: fetchError } = await supabase
            .from('questions')
            .select('id')
            .eq('tags', questionSetName.trim())
            .eq('test_type', selectedCategory);
          
          if (!fetchError && createdQuestions && createdQuestions.length > 0) {
            const questionIds = createdQuestions.map(q => q.id);
            
            // Create question pool
            await QuestionPoolService.createQuestionPool(
              questionSetName.trim(),
              `Questions for ${questionSetName} - ${selectedCategory.replace('_', ' ').toUpperCase()} (${questionIds.length} questions)`,
              selectedCategory,
              questionIds,
              'admin', // Created by admin
              [questionSetName.trim().toLowerCase().replace(/\s+/g, '-')] // Tags
            );
          }
        } catch (poolError) {
          console.warn('Failed to auto-create question pool:', poolError);
          // Don't fail the entire import if pool creation fails
        }

        const finalSuccessMessage = result.stats.failed > 0 
          ? `Successfully imported ${result.stats.successful} out of ${result.stats.totalProcessed} questions!\n\n📝 Question Set: "${questionSetName}"\n📋 Category: ${selectedCategory.replace('_', ' ').toUpperCase()}\n🏊 Question Pool: Auto-created\n\n⚠️ ${result.stats.failed} questions failed to import due to validation errors.`
          : `🎉 All questions imported successfully!\n\n📝 Question Set: "${questionSetName}"\n📋 Category: ${selectedCategory.replace('_', ' ').toUpperCase()}\n🏊 Question Pool: Auto-created\n✅ Total: ${result.stats.successful} questions`;
        
        // Set success state and show in progress bar
        setImportSuccess(true);
        setSuccessMessage(finalSuccessMessage);
        setCurrentQuestionIndex(totalQuestions); // Show 100% complete
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          // Reset all states
          setSelectedFile(null);
          setPreviewQuestions([]);
          setParsingErrors([]);
          setParsingWarnings([]);
          setQuestionSetName('');
          setSelectedCategory('pre_test');
          setImportProgress(0);
          setCurrentQuestionIndex(0);
          setTotalQuestions(0);
          setCurrentQuestionText('');
          setImportSuccess(false);
          setSuccessMessage('');
          
          // Go back to previous screen
          onBack();
        }, 3000);
        
      } else {
        Alert.alert(
          '❌ Upload Failed', 
          `Failed to import questions:\n\n${result.message}\n\nPlease check your data and try again.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error importing questions:', error);
      console.error('Error details:', error);
      
      // Show error alert
      Alert.alert(
        '❌ Import Failed', 
        `An error occurred during import:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check your data and try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      // Always ensure loading state is reset
      setIsLoading(false);
      
      // Reset progress state (but keep success state if import was successful)
      if (!importSuccess) {
        setImportProgress(0);
        setCurrentQuestionIndex(0);
        setTotalQuestions(0);
        setCurrentQuestionText('');
        setImportSuccess(false);
        setSuccessMessage('');
      }
    }
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
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
          </View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Upload Questions</Text>
            <Text style={styles.headerSubtitle}>Import questions from CSV/Excel files</Text>
          </View>
        </View>
      </Animated.View>

      {/* Save Menu */}
      {previewQuestions.length > 0 && (
        <Animated.View style={[styles.saveMenu, { opacity: fadeAnim }]}>
          <View style={styles.saveMenuContent}>
            <View style={styles.saveMenuHeader}>
              <Ionicons name="settings" size={20} color="#00d4ff" />
              <Text style={styles.saveMenuTitle}>Save Questions</Text>
            </View>
            
            <View style={styles.saveMenuFields}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Question Set Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={questionSetName}
                  onChangeText={setQuestionSetName}
                  placeholder="Enter question set name..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryButtons}>
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      selectedCategory === 'pre_test' && styles.categoryButtonActive
                    ]}
                    onPress={() => setSelectedCategory('pre_test')}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      selectedCategory === 'pre_test' && styles.categoryButtonTextActive
                    ]}>
                      Pre Test
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      selectedCategory === 'post_test' && styles.categoryButtonActive
                    ]}
                    onPress={() => setSelectedCategory('post_test')}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      selectedCategory === 'post_test' && styles.categoryButtonTextActive
                    ]}>
                      Post Test
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Content */}
      <Animated.ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Upload Section */}
        <Animated.View style={[styles.uploadSection, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleFileUpload}
            activeOpacity={0.8}
            disabled={isParsing}
          >
            <LinearGradient
              colors={isParsing 
                ? ['rgba(255, 170, 0, 0.2)', 'rgba(255, 170, 0, 0.1)']
                : ['rgba(0, 255, 136, 0.2)', 'rgba(0, 255, 136, 0.1)']
              }
              style={styles.uploadButtonGradient}
            >
              {isParsing ? (
                <>
                  <Ionicons name="hourglass" size={32} color="#ffaa00" />
                  <Text style={styles.uploadButtonText}>Parsing File...</Text>
                  <Text style={styles.uploadButtonSubtext}>Please wait while we process your file</Text>
                </>
              ) : (
                <>
                  <Text style={styles.uploadButtonText}>Choose File</Text>
                  <Text style={styles.uploadButtonSubtext}>CSV or Excel files</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* File Preview Section */}
        {selectedFile && (
          <Animated.View style={[styles.previewSection, { opacity: fadeAnim }]}>
            <View style={styles.fileInfo}>
              <View style={styles.fileIcon}>
                <Ionicons name="document" size={24} color="#00d4ff" />
              </View>
              <View style={styles.fileDetails}>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>
                  {(selectedFile.size / 1024).toFixed(1)} KB • {previewQuestions.length} questions
                </Text>
              </View>
            </View>

            <ScrollView style={styles.previewList} showsVerticalScrollIndicator={false}>
              {previewQuestions.map((question, index) => (
                <View key={question.id} style={styles.questionItem}>
                  <View style={styles.questionHeader}>
                    <View style={styles.questionNumber}>
                      <Text style={styles.questionNumberText}>{index + 1}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.questionText}>{question.question_text}</Text>
                  {question.question_text_en && (
                    <Text style={styles.questionTextEn}>{question.question_text_en}</Text>
                  )}
                  
                  {/* Answer Choices */}
                  <View style={styles.answerChoices}>
                    {question.option_a && renderAnswerChoice(question.option_a, question.option_a_en, 'A', question.id, question.correct_answer === 'A')}
                    {question.option_b && renderAnswerChoice(question.option_b, question.option_b_en, 'B', question.id, question.correct_answer === 'B')}
                    {question.option_c && renderAnswerChoice(question.option_c, question.option_c_en, 'C', question.id, question.correct_answer === 'C')}
                    {question.option_d && renderAnswerChoice(question.option_d, question.option_d_en, 'D', question.id, question.correct_answer === 'D')}
                  </View>
                  
                  {!question.isValid && question.validationErrors && question.validationErrors.length > 0 && (
                    <View style={styles.validationErrors}>
                      <Text style={styles.validationErrorTitle}>Validation Errors:</Text>
                      {question.validationErrors.map((error, errorIndex) => (
                        <Text key={errorIndex} style={styles.validationErrorText}>
                          • {error}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.importButton}
              onPress={handleImport}
              disabled={isLoading || previewQuestions.filter(q => q.isValid).length === 0 || !questionSetName.trim()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={previewQuestions.filter(q => q.isValid).length === 0 || !questionSetName.trim()
                  ? ['rgba(107, 114, 128, 0.8)', 'rgba(107, 114, 128, 0.6)']
                  : previewQuestions.filter(q => q.isValid && !q.correct_answer).length > 0
                    ? ['rgba(255, 170, 0, 0.8)', 'rgba(255, 170, 0, 0.6)']
                    : ['rgba(0, 255, 136, 0.8)', 'rgba(0, 255, 136, 0.6)']
                }
                style={styles.importButtonGradient}
              >
                <Ionicons 
                  name={isLoading ? "hourglass" : "download"} 
                  size={20} 
                  color="#ffffff" 
                />
                <Text style={styles.importButtonText}>
                  {isLoading 
                    ? 'Importing...' 
                    : previewQuestions.filter(q => q.isValid).length === 0
                      ? 'No Valid Questions'
                      : previewQuestions.filter(q => q.isValid && !q.correct_answer).length > 0
                        ? `Select Correct Answers (${previewQuestions.filter(q => q.isValid && !q.correct_answer).length} remaining)`
                        : `Import ${previewQuestions.filter(q => q.isValid).length} Questions`
                  }
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

      </Animated.ScrollView>

      {/* Import Confirmation Modal */}
      <Modal
        visible={showImportAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImportAlert(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['rgba(0, 212, 255, 0.9)', 'rgba(0, 212, 255, 0.7)']}
              style={styles.modalGradient}
            >
              <View style={styles.modalHeader}>
                <Ionicons name="warning" size={32} color="#ffffff" />
                <Text style={styles.modalTitle}>Confirm Import</Text>
              </View>
              <Text style={styles.modalMessage}>
                Are you sure you want to import {previewQuestions.length} questions from "{selectedFile?.name}"? 
                This action cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowImportAlert(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={confirmImport}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                    Import
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
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
  uploadSection: {
    marginBottom: 24,
  },
  uploadButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  uploadButtonGradient: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 24,
  },
  uploadButtonSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Preview Section Styles
  previewSection: {
    marginBottom: 24,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fileIcon: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 24,
  },
  fileSize: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  previewList: {
    maxHeight: isTablet ? height * 0.6 : 24,
    marginBottom: 24,
  },
  questionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 24,
  },
  questionNumber: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 212, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 212, 255, 0.5)',
  },
  questionNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    lineHeight: 16,
    marginBottom: 24,
  },
  questionTextEn: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 16,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  answerChoices: {
    marginBottom: 24,
  },
  answerChoice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingVertical: 24,
  },
  answerChoiceLabel: {
    fontSize: 16,
    color: '#00d4ff',
    fontWeight: '700',
    marginRight: 24,
    minWidth: 24,
  },
  answerChoiceContent: {
    flex: 1,
  },
  answerChoiceText: {
    fontSize: 16,
    color: '#d0d0d0',
    lineHeight: 16,
    marginBottom: 24,
  },
  answerChoiceTextEn: {
    fontSize: 16,
    color: 'rgba(208, 208, 208, 0.7)',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  importButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  importButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 24,
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 24,
  },
  modalMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalButtonPrimary: {
    backgroundColor: 'rgba(0, 255, 136, 0.8)',
    borderColor: 'rgba(0, 255, 136, 1)',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalButtonTextPrimary: {
    color: '#ffffff',
  },
  // Validation Error Styles
  validationErrors: {
    marginTop: 24,
    padding: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  validationErrorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 24,
  },
  validationErrorText: {
    fontSize: 16,
    color: 'rgba(239, 68, 68, 0.8)',
    lineHeight: 16,
    marginBottom: 24,
  },
  // Save Menu Styles
  saveMenu: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 212, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  saveMenuContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  saveMenuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 24,
  },
  saveMenuFields: {
    gap: 24,
  },
  inputGroup: {
    gap: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(0, 212, 255, 0.3)',
    borderColor: 'rgba(0, 212, 255, 0.6)',
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  // Answer Selection Styles
  answerChoiceSelected: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderColor: 'rgba(0, 255, 136, 0.3)',
    borderWidth: 2,
  },
  answerChoiceLabelSelected: {
    color: '#00ff88',
  },
  answerChoiceTextSelected: {
    color: '#ffffff',
  },
  answerChoiceTextEnSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  correctAnswerIcon: {
    marginLeft: 24,
  },
  // Progress Bar Styles
  progressContainer: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 212, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00ff88',
  },
  progressBarContainer: {
    marginBottom: 24,
  },
  progressBarBackground: {
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 24,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  progressDetails: {
    gap: 24,
  },
  progressCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  currentQuestionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  // Success State Styles
  progressContainerSuccess: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderBottomColor: 'rgba(0, 255, 136, 0.3)',
  },
  progressPercentageSuccess: {
    color: '#00ff88',
  },
  progressBarFillSuccess: {
    backgroundColor: '#00ff88',
    shadowColor: '#00ff88',
  },
  successMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 16,
  },
});
