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
                console.log(`Row ${i + 1} keys:`, keys);
                console.log(`Row ${i + 1} data:`, row);
                
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
          console.log(`Excel Row ${i + 1} keys:`, keys);
          console.log(`Excel Row ${i + 1} data:`, row);
          
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
      
      console.log('Starting file preview for:', file.name);
      console.log('File URI:', file.uri);
      
      const result = await parseChecklistFile(file);
      console.log('Parse result:', result);
      
      setPreviewData(result);
      setShowPreview(true);
      
      if (!result.success) {
        Alert.alert(
          'Preview Error', 
          `Failed to parse file: ${result.errors.join(', ')}`
        );
      } else {
        console.log(`Successfully parsed ${result.data.length} items`);
        if (result.data.length > 0) {
          console.log('First item:', result.data[0]);
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

      console.log('Saving checklist to database:', checklist);
      
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
              colors={["#00ff88", "#5b73ff", "#00d4ff"]} 
              style={styles.headerIconGradient}
            >
              <Ionicons name="cloud-upload" size={getResponsiveSize(28, 32, 36)} color="#ffffff" />
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
              <Ionicons name="cloud-upload" size={getResponsiveSize(48, 52, 56)} color="#00ff88" />
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
                <Ionicons name="document" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
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
                  <Ionicons name="hourglass" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
                  <Text style={styles.uploadButtonText}>Uploading...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={getResponsiveSize(20, 22, 24)} color="#ffffff" />
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
                <Ionicons name="eye" size={getResponsiveSize(24, 26, 28)} color="#00d4ff" />
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
              <Ionicons name="information-circle" size={getResponsiveSize(24, 26, 28)} color="#00d4ff" />
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
    paddingHorizontal: getResponsivePadding(),
    paddingTop: getResponsiveSize(25, 30, 35),
    paddingBottom: getResponsiveSize(20, 25, 30),
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
    shadowColor: '#00ff88',
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
  content: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: getResponsiveSize(20, 25, 30),
  },
  uploadContainer: {
    marginBottom: getResponsiveSize(20, 25, 30),
  },
  uploadArea: {
    borderRadius: getResponsiveSize(16, 18, 20),
    padding: getResponsiveSize(30, 35, 40),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  uploadTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  uploadSubtitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: getResponsiveSize(20, 25, 30),
    lineHeight: getResponsiveFontSize(20, 22, 24),
  },
  selectButton: {
    borderRadius: getResponsiveSize(12, 14, 16),
    overflow: 'hidden',
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  selectButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(20, 24, 28),
    paddingVertical: getResponsiveSize(12, 14, 16),
    gap: getResponsiveSize(8, 10, 12),
  },
  selectButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#ffffff',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderRadius: getResponsiveSize(8, 10, 12),
    paddingHorizontal: getResponsiveSize(12, 16, 20),
    paddingVertical: getResponsiveSize(8, 10, 12),
    gap: getResponsiveSize(8, 10, 12),
  },
  fileName: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#00ff88',
    fontWeight: '600',
  },
  uploadButton: {
    borderRadius: getResponsiveSize(12, 14, 16),
    overflow: 'hidden',
    marginBottom: getResponsiveSize(20, 25, 30),
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(16, 18, 20),
    gap: getResponsiveSize(8, 10, 12),
  },
  uploadButtonText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
  },
  instructionsContainer: {
    flex: 1,
  },
  instructionsCard: {
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(20, 24, 28),
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  instructionsTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: getResponsiveSize(8, 12, 16),
  },
  instructionsList: {
    gap: getResponsiveSize(8, 12, 16),
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(8, 12, 16),
  },
  instructionText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveSize(12, 16, 20),
    gap: getResponsiveSize(8, 10, 12),
  },
  loadingText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#00ff88',
    fontWeight: '500',
  },
  previewContainer: {
    marginBottom: getResponsiveSize(20, 25, 30),
  },
  previewCard: {
    borderRadius: getResponsiveSize(12, 14, 16),
    padding: getResponsiveSize(16, 20, 24),
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  previewTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    marginLeft: getResponsiveSize(8, 12, 16),
  },
  closePreviewButton: {
    padding: getResponsiveSize(8, 10, 12),
    borderRadius: getResponsiveSize(6, 8, 10),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: getResponsiveSize(4, 6, 8),
    paddingVertical: getResponsiveSize(4, 6, 8),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: getResponsiveSize(4, 6, 8),
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '900',
    color: '#00d4ff',
    marginBottom: getResponsiveSize(1, 2, 3),
  },
  statLabel: {
    fontSize: getResponsiveFontSize(7, 8, 10),
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: getResponsiveSize(4, 6, 8),
    padding: getResponsiveSize(4, 6, 8),
    marginBottom: getResponsiveSize(3, 4, 6),
    borderLeftWidth: 2,
    borderLeftColor: '#ff3b30',
  },
  errorTitle: {
    fontSize: getResponsiveFontSize(9, 10, 12),
    fontWeight: '700',
    color: '#ff3b30',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  errorText: {
    fontSize: getResponsiveFontSize(8, 9, 10),
    color: '#ff3b30',
    marginBottom: getResponsiveSize(1, 2, 3),
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderRadius: getResponsiveSize(4, 6, 8),
    padding: getResponsiveSize(4, 6, 8),
    marginBottom: getResponsiveSize(3, 4, 6),
    borderLeftWidth: 2,
    borderLeftColor: '#ff9500',
  },
  warningTitle: {
    fontSize: getResponsiveFontSize(9, 10, 12),
    fontWeight: '700',
    color: '#ff9500',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  warningText: {
    fontSize: getResponsiveFontSize(8, 9, 10),
    color: '#ff9500',
    marginBottom: getResponsiveSize(1, 2, 3),
  },
  previewDataContainer: {
    maxHeight: getResponsiveSize(120, 150, 180),
  },
  previewDataTitle: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: getResponsiveSize(3, 4, 6),
  },
  previewItem: {
    flexDirection: 'row',
    marginBottom: getResponsiveSize(3, 4, 6),
    padding: getResponsiveSize(4, 6, 8),
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: getResponsiveSize(4, 6, 8),
  },
  previewItemNumber: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '700',
    color: '#00d4ff',
    marginRight: getResponsiveSize(8, 12, 16),
    minWidth: getResponsiveSize(20, 24, 28),
  },
  previewItemContent: {
    flex: 1,
  },
  previewItemText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#ffffff',
    fontWeight: '500',
    marginBottom: getResponsiveSize(6, 8, 10),
    lineHeight: getResponsiveFontSize(16, 18, 20),
  },
  previewItemOption: {
    fontSize: getResponsiveFontSize(11, 13, 15),
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: getResponsiveSize(2, 4, 6),
    marginLeft: getResponsiveSize(8, 12, 16),
  },
  previewMoreText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: getResponsiveSize(8, 12, 16),
  },
  checklistContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: getResponsiveSize(8, 10, 12),
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    overflow: 'hidden',
  },
  checklistHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    paddingVertical: getResponsiveSize(12, 16, 20),
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 212, 255, 0.3)',
  },
  checklistHeaderText: {
    flex: 1,
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'left',
  },
  checklistHeaderColumns: {
    flexDirection: 'row',
    gap: getResponsiveSize(20, 30, 40),
  },
  checklistColumnHeader: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '700',
    color: '#00d4ff',
    textAlign: 'center',
    minWidth: getResponsiveSize(30, 40, 50),
  },
  checklistItem: {
    flexDirection: 'row',
    paddingVertical: getResponsiveSize(4, 6, 8),
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'flex-start',
  },
  checklistItemContent: {
    flex: 1,
    marginRight: getResponsiveSize(12, 16, 20),
  },
  checklistItemText: {
    fontSize: getResponsiveFontSize(13, 15, 17),
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: getResponsiveSize(4, 6, 8),
    lineHeight: getResponsiveFontSize(18, 20, 22),
  },
  checklistSectionTitle: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#00d4ff',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  checklistItemTitle: {
    fontSize: getResponsiveFontSize(9, 11, 13),
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  subItemsContainer: {
    marginLeft: getResponsiveSize(8, 10, 12),
    marginTop: getResponsiveSize(1, 2, 3),
  },
  subItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSize(1, 2, 3),
  },
  subItemNumber: {
    fontSize: getResponsiveFontSize(8, 9, 10),
    color: '#00d4ff',
    fontWeight: '600',
    marginRight: getResponsiveSize(4, 6, 8),
    minWidth: getResponsiveSize(8, 10, 12),
  },
  subItemText: {
    fontSize: getResponsiveFontSize(8, 9, 10),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    flex: 1,
    lineHeight: getResponsiveFontSize(10, 12, 14),
  },
  checklistDescription: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: getResponsiveSize(6, 8, 10),
    lineHeight: getResponsiveFontSize(16, 18, 20),
    fontStyle: 'italic',
  },
  checklistSubItem: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: getResponsiveSize(4, 6, 8),
    marginLeft: getResponsiveSize(12, 16, 20),
    lineHeight: getResponsiveFontSize(16, 18, 20),
  },
  checklistCheckboxes: {
    flexDirection: 'row',
    gap: getResponsiveSize(20, 30, 40),
    alignItems: 'center',
    marginTop: getResponsiveSize(4, 6, 8),
  },
  checkbox: {
    width: getResponsiveSize(14, 16, 18),
    height: getResponsiveSize(14, 16, 18),
    borderRadius: getResponsiveSize(2, 3, 4),
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.5)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    fontSize: getResponsiveFontSize(9, 10, 12),
    color: '#00d4ff',
    fontWeight: '600',
  },
  previewHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(8, 12, 16),
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(8, 12, 16),
    paddingVertical: getResponsiveSize(6, 8, 10),
    borderRadius: getResponsiveSize(6, 8, 10),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
    gap: getResponsiveSize(4, 6, 8),
  },
  toggleButtonActive: {
    backgroundColor: '#00d4ff',
    borderColor: '#00d4ff',
  },
  toggleButtonText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#ffffff',
    fontWeight: '600',
  },
  toggleButtonTextActive: {
    color: '#000000',
  },
  rawDataContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 16, 20),
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
  },
  rawDataText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#ffffff',
    fontFamily: 'monospace',
    lineHeight: getResponsiveFontSize(14, 16, 18),
  },
});
