import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Alert, ScrollView, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from 'expo-document-picker';
import { FileParser, ParsedFileResult } from '../utils/fileParser';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { ChecklistService, Checklist } from '../services/ChecklistService';

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

interface UploadChecklistScreenProps {
  onBack: () => void;
}

interface ChecklistItem {
  title: string;
  description: string;
  category: string;
  subItems?: string[];
}

interface ChecklistParseResult {
  success: boolean;
  data: ChecklistItem[];
  errors: string[];
  warnings: string[];
}

export default function UploadChecklistScreen({ onBack }: UploadChecklistScreenProps) {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [previewData, setPreviewData] = useState<ChecklistParseResult | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showRawData, setShowRawData] = useState<boolean>(false);
  const [rawFileData, setRawFileData] = useState<any[]>([]);

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

  const handleSelectFile = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setUploadedFile(file);
        setShowPreview(false);
        setPreviewData(null);
        
        // Parse file for preview
        await handlePreviewFile(file);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const parseChecklistFile = async (file: any): Promise<ChecklistParseResult> => {
    try {
      const extension = file.name.toLowerCase().split('.').pop();
      let jsonData: any[] = [];

      if (extension === 'csv') {
        // Parse CSV
        const response = await fetch(file.uri);
        const csvText = await response.text();
        
        return new Promise((resolve) => {
          Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
              const errors: string[] = [];
              const warnings: string[] = [];
              
              // Store raw data for preview
              setRawFileData(results.data);
              
              if (results.errors.length > 0) {
                results.errors.forEach((error: any) => {
                  if (error.type === 'Delimiter') {
                    warnings.push(`Line ${error.row}: ${error.message}`);
                  } else {
                    errors.push(`Line ${error.row}: ${error.message}`);
                  }
                });
              }
              
              // Process the data to create a structured checklist
              const checklistItems: ChecklistItem[] = [];
              
              // First, try to identify the main sections and structure
              let currentSection = '';
              let sectionItems: string[] = [];
              
              for (let i = 0; i < results.data.length; i++) {
                const row = results.data[i];
                const keys = Object.keys(row);
                // Get the main content from the first column or any column with substantial content
                let mainContent = '';
                for (const key of keys) {
                  const value = String(row[key] || '').trim();
                  if (value && value.length > 0) {
                    mainContent = value;
                    break;
                  }
                }
                
                if (!mainContent) continue;
                
                // Check if this is a main section (all caps, short, or contains keywords)
                const isMainSection = /^[A-Z\s:]+$/.test(mainContent) && 
                  (mainContent.length < 50 || 
                   mainContent.includes('DANGER') || 
                   mainContent.includes('RESPONSE') || 
                   mainContent.includes('AIRWAY') || 
                   mainContent.includes('BREATHING') || 
                   mainContent.includes('CIRCULATION') || 
                   mainContent.includes('DEFIBRILATION') ||
                   mainContent.includes('STATION') ||
                   mainContent.includes('SKILL'));
                
                if (isMainSection) {
                  // Save previous section if it exists
                  if (currentSection && sectionItems.length > 0) {
                    checklistItems.push({
                      title: currentSection,
                      description: '',
                      category: 'section',
                      subItems: sectionItems
                    });
                  }
                  
                  // Start new section
                  currentSection = mainContent;
                  sectionItems = [];
                } else {
                  // This is a sub-item or detail
                  sectionItems.push(mainContent);
                }
              }
              
              // Save the last section
              if (currentSection && sectionItems.length > 0) {
                checklistItems.push({
                  title: currentSection,
                  description: '',
                  category: 'section',
                  subItems: sectionItems
                });
              }
              
              // If no structured sections found, create items from all rows
              if (checklistItems.length === 0) {
                for (let i = 0; i < results.data.length; i++) {
                  const row = results.data[i];
                  const keys = Object.keys(row);
                  
                  for (const key of keys) {
                    const value = String(row[key] || '').trim();
                    if (value && value.length > 0) {
                      checklistItems.push({
                        title: value,
                        description: '',
                        category: 'item',
                        subItems: []
                      });
                    }
                  }
                }
              }
              
              resolve({
                success: errors.length === 0,
                data: checklistItems,
                errors,
                warnings
              });
            },
            error: (error: any) => {
              resolve({
                success: false,
                data: [],
                errors: [`CSV parsing error: ${error.message}`],
                warnings: []
              });
            }
          });
        });
      } else if (extension === 'xlsx' || extension === 'xls') {
        // Parse Excel
        const response = await fetch(file.uri);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Store raw data for preview
        setRawFileData(jsonData);
        
        // Process the data to create a structured checklist
        const checklistItems: ChecklistItem[] = [];
        
        // First, try to identify the main sections and structure
        let currentSection = '';
        let sectionItems: string[] = [];
        
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const keys = Object.keys(row);
          // Get the main content from the first column or any column with substantial content
          let mainContent = '';
          for (const key of keys) {
            const value = String(row[key] || '').trim();
            if (value && value.length > 0) {
              mainContent = value;
              break;
            }
          }
          
          if (!mainContent) continue;
          
          // Check if this is a main section (all caps, short, or contains keywords)
          const isMainSection = /^[A-Z\s:]+$/.test(mainContent) && 
            (mainContent.length < 50 || 
             mainContent.includes('DANGER') || 
             mainContent.includes('RESPONSE') || 
             mainContent.includes('AIRWAY') || 
             mainContent.includes('BREATHING') || 
             mainContent.includes('CIRCULATION') || 
             mainContent.includes('DEFIBRILATION') ||
             mainContent.includes('STATION') ||
             mainContent.includes('SKILL'));
          
          if (isMainSection) {
            // Save previous section if it exists
            if (currentSection && sectionItems.length > 0) {
              checklistItems.push({
                title: currentSection,
                description: '',
                category: 'section',
                subItems: sectionItems
              });
            }
            
            // Start new section
            currentSection = mainContent;
            sectionItems = [];
          } else {
            // This is a sub-item or detail
            sectionItems.push(mainContent);
          }
        }
        
        // Save the last section
        if (currentSection && sectionItems.length > 0) {
          checklistItems.push({
            title: currentSection,
            description: '',
            category: 'section',
            subItems: sectionItems
          });
        }
        
        // If no structured sections found, create items from all rows
        if (checklistItems.length === 0) {
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            const keys = Object.keys(row);
            
            for (const key of keys) {
              const value = String(row[key] || '').trim();
              if (value && value.length > 0) {
                checklistItems.push({
                  title: value,
                  description: '',
                  category: 'item',
                  subItems: []
                });
              }
            }
          }
        }
        
        return {
          success: true,
          data: checklistItems,
          errors: [],
          warnings: []
        };
      } else {
        return {
          success: false,
          data: [],
          errors: [`Unsupported file format: ${extension}. Please upload a CSV or Excel file.`],
          warnings: []
        };
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  };

  const handlePreviewFile = async (file: any) => {
    try {
      setIsLoadingPreview(true);
      const result = await parseChecklistFile(file);
      setPreviewData(result);
      setShowPreview(true);
      
      if (!result.success) {
        Alert.alert(
          'Preview Error', 
          `Failed to parse file: ${result.errors.join(', ')}`
        );
      } else {
        if (result.data.length > 0) {
        }
      }
    } catch (error) {
      console.error('Error parsing file for preview:', error);
      Alert.alert('Preview Error', 'Failed to parse file for preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile || !previewData) {
      Alert.alert('No File', 'Please select a file and wait for preview first');
      return;
    }

    try {
      setIsUploading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Convert parsed data to checklist format
      const checklist: Omit<Checklist, 'id' | 'created_at' | 'updated_at'> = {
        name: uploadedFile.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        description: `Uploaded from ${uploadedFile.name}`,
        category: 'uploaded',
        items: previewData.data.map((item, index) => ({
          title: item.title,
          description: item.description,
          category: item.category,
          sub_items: item.subItems || [],
          order_index: index
        }))
      };
      // Save to Supabase
      const result = await ChecklistService.saveChecklist(checklist);
      
      if (result.success) {
        Alert.alert(
          'Upload Successful', 
          `Checklist "${checklist.name}" has been saved successfully with ${checklist.items.length} items!`,
          [
            {
              text: 'OK',
              onPress: () => {
                setUploadedFile(null);
                setPreviewData(null);
                setShowPreview(false);
                setIsUploading(false);
              }
            }
          ]
        );
      } else {
        Alert.alert('Upload Failed', `Failed to save checklist: ${result.error}`);
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      Alert.alert('Upload Failed', 'Failed to upload checklist');
      setIsUploading(false);
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
              <Ionicons name="cloud-upload" size={24} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Upload Checklist</Text>
            <Text style={styles.headerSubtitle}>Import checklist from CSV/Excel files</Text>
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.View style={[
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
      ]}>
        {/* Upload Area */}
        <View style={styles.uploadContainer}>
          <LinearGradient
            colors={['rgba(0, 255, 136, 0.1)', 'rgba(0, 255, 136, 0.05)']}
            style={styles.uploadArea}
          >
            <View style={styles.uploadIcon}>
              <Ionicons name="cloud-upload" size={24} color="#00ff88" />
            </View>
            
            <Text style={styles.uploadTitle}>Select Checklist File</Text>
            <Text style={styles.uploadSubtitle}>
              Choose a CSV or Excel file containing your checklist data
            </Text>
            
            <TouchableOpacity
              style={styles.selectButton}
              onPress={handleSelectFile}
              disabled={isUploading}
            >
              <LinearGradient
                colors={['#00ff88', '#00d4ff']}
                style={styles.selectButtonGradient}
              >
                <Ionicons name="document" size={24} color="#ffffff" />
                <Text style={styles.selectButtonText}>Select File</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {uploadedFile && (
              <View style={styles.fileInfo}>
                <Ionicons name="checkmark-circle" size={20} color="#00ff88" />
                <Text style={styles.fileName}>{uploadedFile.name}</Text>
              </View>
            )}

            {isLoadingPreview && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#00ff88" />
                <Text style={styles.loadingText}>Parsing file for preview...</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Upload Button */}
        {uploadedFile && previewData && previewData.data.length > 0 && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUpload}
            disabled={isUploading}
          >
            <LinearGradient
              colors={isUploading ? ['#666', '#444'] : ['#00d4ff', '#5b73ff']}
              style={styles.uploadButtonGradient}
            >
              {isUploading ? (
                <>
                  <Ionicons name="hourglass" size={24} color="#ffffff" />
                  <Text style={styles.uploadButtonText}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={24} color="#ffffff" />
                  <Text style={styles.uploadButtonText}>Save to Database</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* File Preview */}
        {showPreview && previewData && (
          <View style={styles.previewContainer}>
            <LinearGradient
              colors={['rgba(0, 212, 255, 0.1)', 'rgba(0, 212, 255, 0.05)']}
              style={styles.previewCard}
            >
              <View style={styles.previewHeader}>
                <Ionicons name="eye" size={24} color="#00d4ff" />
                <Text style={styles.previewTitle}>File Preview</Text>
                <View style={styles.previewHeaderButtons}>
                  <TouchableOpacity
                    onPress={() => setShowRawData(!showRawData)}
                    style={[styles.toggleButton, showRawData && styles.toggleButtonActive]}
                  >
                    <Ionicons name="list" size={16} color={showRawData ? "#000000" : "#ffffff"} />
                    <Text style={[styles.toggleButtonText, showRawData && styles.toggleButtonTextActive]}>
                      {showRawData ? 'Formatted' : 'Raw Data'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowPreview(false)}
                    style={styles.closePreviewButton}
                  >
                    <Ionicons name="close" size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.previewStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{previewData.data.length}</Text>
                  <Text style={styles.statLabel}>Items Found</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{previewData.errors.length}</Text>
                  <Text style={styles.statLabel}>Errors</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{previewData.warnings.length}</Text>
                  <Text style={styles.statLabel}>Warnings</Text>
                </View>
              </View>

              {previewData.errors.length > 0 && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorTitle}>Errors:</Text>
                  {previewData.errors.map((error, index) => (
                    <Text key={index} style={styles.errorText}>• {error}</Text>
                  ))}
                </View>
              )}

              {previewData.warnings.length > 0 && (
                <View style={styles.warningContainer}>
                  <Text style={styles.warningTitle}>Warnings:</Text>
                  {previewData.warnings.map((warning, index) => (
                    <Text key={index} style={styles.warningText}>• {warning}</Text>
                  ))}
                </View>
              )}

              {previewData.data.length > 0 && (
                <ScrollView style={styles.previewDataContainer} showsVerticalScrollIndicator={true}>
                  <Text style={styles.previewDataTitle}>
                    {showRawData ? 'Raw File Data (All Content):' : 'Complete File Content Preview:'}
                  </Text>
                  
                  {showRawData ? (
                    <View style={styles.rawDataContainer}>
                      <Text style={styles.rawDataText}>
                        {JSON.stringify(rawFileData, null, 2)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.checklistContainer}>
                      <View style={styles.checklistHeader}>
                        <Text style={styles.checklistHeaderText}>SKILL PERFORMANCE</Text>
                        <View style={styles.checklistHeaderColumns}>
                          <Text style={styles.checklistColumnHeader}>YES</Text>
                          <Text style={styles.checklistColumnHeader}>NO</Text>
                        </View>
                      </View>
                      
                      {previewData.data.map((item, index) => (
                        <View key={index} style={styles.checklistItem}>
                          <View style={styles.checklistItemContent}>
                            <Text style={[
                              styles.checklistItemText,
                              item.category === 'section' ? styles.checklistSectionTitle : styles.checklistItemTitle
                            ]}>
                              {item.title}
                            </Text>
                            {item.subItems && item.subItems.length > 0 && (
                              <View style={styles.subItemsContainer}>
                                {item.subItems.map((subItem, subIndex) => (
                                  <View key={subIndex} style={styles.subItemRow}>
                                    <Text style={styles.subItemNumber}>
                                      {String.fromCharCode(97 + subIndex)}.
                                    </Text>
                                    <Text style={styles.subItemText}>{subItem}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </View>
                          <View style={styles.checklistCheckboxes}>
                            <View style={styles.checkbox}>
                              <Text style={styles.checkboxText}>☐</Text>
                            </View>
                            <View style={styles.checkbox}>
                              <Text style={styles.checkboxText}>☐</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>
              )}
            </LinearGradient>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
            style={styles.instructionsCard}
          >
            <View style={styles.instructionsHeader}>
              <Ionicons name="information-circle" size={24} color="#00d4ff" />
              <Text style={styles.instructionsTitle}>File Format Requirements</Text>
            </View>
            
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
                <Text style={styles.instructionText}>Supported formats: CSV, Excel (.xlsx, .xls)</Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
                <Text style={styles.instructionText}>First row should contain headers</Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
                <Text style={styles.instructionText}>Required columns: Title, Description, Category (or Skill Performance)</Text>
              </View>
              <View style={styles.instructionItem}>
                <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
                <Text style={styles.instructionText}>Maximum file size: 10MB</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  uploadContainer: {
    marginBottom: 24,
  },
  uploadArea: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    marginBottom: 24,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  uploadSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 16,
  },
  selectButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  selectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 24,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 24,
  },
  fileName: {
    fontSize: 16,
    color: '#00ff88',
    fontWeight: '600',
  },
  uploadButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 24,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  instructionsContainer: {
    flex: 1,
  },
  instructionsCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 24,
  },
  instructionsList: {
    gap: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#00ff88',
    fontWeight: '500',
  },
  previewContainer: {
    marginBottom: 24,
  },
  previewCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    marginLeft: 24,
  },
  closePreviewButton: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#00d4ff',
    marginBottom: 24,
  },
  statLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderLeftWidth: 2,
    borderLeftColor: '#ff3b30',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff3b30',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#ff3b30',
    marginBottom: 24,
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderLeftWidth: 2,
    borderLeftColor: '#ff9500',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff9500',
    marginBottom: 24,
  },
  warningText: {
    fontSize: 16,
    color: '#ff9500',
    marginBottom: 24,
  },
  previewDataContainer: {
    maxHeight: 24,
  },
  previewDataTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  previewItem: {
    flexDirection: 'row',
    marginBottom: 24,
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 24,
  },
  previewItemNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00d4ff',
    marginRight: 24,
    minWidth: 24,
  },
  previewItemContent: {
    flex: 1,
  },
  previewItemText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: 24,
    lineHeight: 16,
  },
  previewItemOption: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
    marginLeft: 24,
  },
  previewMoreText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 24,
  },
  checklistContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    overflow: 'hidden',
  },
  checklistHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 255, 0.3)',
  },
  checklistHeaderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'left',
  },
  checklistHeaderColumns: {
    flexDirection: 'row',
    gap: 24,
  },
  checklistColumnHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00d4ff',
    textAlign: 'center',
    minWidth: 24,
  },
  checklistItem: {
    flexDirection: 'row',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'flex-start',
  },
  checklistItemContent: {
    flex: 1,
    marginRight: 24,
  },
  checklistItemText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 24,
    lineHeight: 16,
  },
  checklistSectionTitle: {
    fontSize: 16,
    color: '#00d4ff',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 24,
  },
  checklistItemTitle: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: 24,
  },
  subItemsContainer: {
    marginLeft: 24,
    marginTop: 24,
  },
  subItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  subItemNumber: {
    fontSize: 16,
    color: '#00d4ff',
    fontWeight: '600',
    marginRight: 24,
    minWidth: 24,
  },
  subItemText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  checklistDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 24,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  checklistSubItem: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    marginLeft: 24,
    lineHeight: 16,
  },
  checklistCheckboxes: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
    marginTop: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.5)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    fontSize: 16,
    color: '#00d4ff',
    fontWeight: '600',
  },
  previewHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    gap: 24,
  },
  toggleButtonActive: {
    backgroundColor: '#00d4ff',
    borderColor: '#00d4ff',
  },
  toggleButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#000000',
  },
  rawDataContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  rawDataText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
