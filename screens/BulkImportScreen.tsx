import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, ScrollView, Alert, Modal, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
// import DocumentPicker from 'react-native-document-picker'; // Not compatible with web
import { BulkImportService, ImportResult, ImportedParticipant } from '../services/BulkImportService';
import { modernRegisterStyles as styles } from '../styles/RegisterParticipantStyles';

const { width, height } = Dimensions.get('window');

interface BulkImportScreenProps {
  onBack: () => void;
}

export default function BulkImportScreen({ onBack }: BulkImportScreenProps) {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    startAnimations();
  }, []);

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

  const handleFilePicker = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Create a hidden file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,.xlsx,.xls';
      input.style.display = 'none';
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          setSelectedFile({
            name: file.name,
            type: file.type,
            size: file.size,
            file: file
          });
          // Show preview of the file
          await showFilePreview(file);
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      };
      
      // Add to DOM, click, then remove
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    } catch (error) {
      console.error('Error in file picker:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  };

  const parseFile = async (): Promise<ImportedParticipant[]> => {
    if (!selectedFile) {
      throw new Error('No file selected');
    }

    try {
      // Check if it's a real file or mock file
      if (selectedFile.file) {
        // Read the actual file content
        const text = await readFileAsText(selectedFile.file);
        const lines = text.split('\n').filter(line => line.trim());
        const data = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
        
        return BulkImportService.parseFileData(data);
      } else {
        // Fallback to sample data for demo
        const sampleData = [
          ['Email', 'Name', 'Phone Number', 'IC Number', 'Job Position', 'Grade', 'Tempat Bertugas', 'Last BLS Attempt', 'Asthma', 'Allergies', 'Allergies Description', 'Pregnant', 'Pregnancy Weeks', 'Notes'],
          ['john.doe@example.com', 'John Doe', '+60123456789', '901234-56-7890', 'Jururawat', 'U5', 'Hospital KL', '2023', 'No', 'Yes', 'Penicillin', 'No', '', 'Sample participant'],
          ['jane.smith@example.com', 'Jane Smith', '+60198765432', '870123-45-6789', 'Pegawai Perubatan', 'UD41', 'Hospital Putrajaya', 'First Time', 'No', 'No', '', 'Yes', '24', 'Pregnant participant']
        ];
        
        return BulkImportService.parseFileData(sampleData);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      throw new Error('Failed to parse file. Please ensure it\'s a valid CSV format.');
    }
  };

  // Helper function to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  // Get appropriate column width based on header
  const getColumnWidth = (header: string): number => {
    const widths: { [key: string]: number } = {
      'email': 200,
      'full_name': 180,
      'ic': 130,
      'job': 160,
      'grade': 80,
      'phone_number': 140,
      'tempat_bertugas': 150,
      'asma': 80,
      'bls_last_year': 120,
      'alergik': 80,
      'alergik_details': 140,
      'hamil': 80,
      'hamil_weeks': 100,
      'notes': 160,
    };
    return widths[header] || 120;
  };

  // Show file preview before import
  const showFilePreview = async (file: File) => {
    try {
      const text = await readFileAsText(file);
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        Alert.alert('Error', 'The selected file appears to be empty.');
        return;
      }

      // Parse CSV data
      const data = lines.map(line => {
        // Simple CSV parsing - handles quoted fields
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });

      const headers = data[0];
      const rows = data.slice(1, 11); // Show first 10 rows for preview

      setPreviewHeaders(headers);
      setPreviewData(rows);
      setShowPreview(true);

      Alert.alert(
        'File Preview',
        `File "${file.name}" loaded successfully. Preview shows the first 10 rows. Review the data before importing.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Preview', onPress: () => {} }
        ]
      );
    } catch (error) {
      console.error('Error reading file:', error);
      Alert.alert('Error', 'Failed to read the selected file. Please try again.');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please select a file first.');
      return;
    }

    setImporting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Parse the file
      const participants = await parseFile();
      
      if (participants.length === 0) {
        throw new Error('No valid participants found in the file');
      }

      // Perform bulk import
      const result = await BulkImportService.bulkImport(participants);
      
      setImportResult(result);
      setShowResultModal(true);
      
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      console.error('Import error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      Alert.alert(
        'Import Failed',
        error instanceof Error ? error.message : 'Failed to import participants. Please check your file format.',
        [{ text: 'OK' }]
      );
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const template = BulkImportService.generateSampleTemplate();
      
      // Create a blob and download it
      const blob = new Blob([template], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'participant_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Template Downloaded',
        'Sample template has been downloaded to your device. You can now open it and fill in your participant data.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error downloading template:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to download template. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Modern Elegant Background */}
      <Animated.View style={styles.backgroundContainer}>
        <LinearGradient 
          colors={["#0f0f23", "#1a1a2e", "#16213e", "#0f3460"]} 
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
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.2)']}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6']}
              style={styles.headerIconGradient}
            >
              <Ionicons name="cloud-upload" size={24} color="#ffffff" />
            </LinearGradient>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>📊 Bulk Import</Text>
            <Text style={styles.headerSubtitle}>Import participants from Excel/CSV</Text>
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Animated.View style={[
          styles.formContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          {/* Instructions */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📋 Import Instructions</Text>
            <Text style={[styles.inputLabel, { marginBottom: 16, lineHeight: 22 }]}>
              1. Download the sample template below{'\n'}
              2. Fill in your participant data{'\n'}
              3. Save as CSV or Excel format{'\n'}
              4. Upload the file using the button below
            </Text>
          </View>

          {/* Template Download */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📄 Sample Template</Text>
            <TouchableOpacity 
              style={[styles.dropdownButton, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}
              onPress={handleDownloadTemplate}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="download" size={20} color="#6366f1" style={{ marginRight: 12 }} />
                <Text style={[styles.dropdownText, { color: '#6366f1' }]}>
                  Download Sample Template
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6366f1" />
            </TouchableOpacity>
          </View>

          {/* File Selection */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📁 Select File</Text>
            <TouchableOpacity 
              style={[styles.dropdownButton, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}
              onPress={handleFilePicker}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="document" size={20} color="#10b981" style={{ marginRight: 12 }} />
                <Text style={[styles.dropdownText, { color: '#10b981' }]}>
                  {selectedFile ? selectedFile.name : 'Choose Excel/CSV File'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#10b981" />
            </TouchableOpacity>
            {selectedFile && (
              <Text style={[styles.errorText, { color: '#10b981', marginTop: 8 }]}>
                ✓ File selected: {selectedFile.name}
              </Text>
            )}
            
            {/* Instructions Note */}
            <View style={{ 
              backgroundColor: 'rgba(59, 130, 246, 0.1)', 
              padding: 12, 
              borderRadius: 8, 
              marginTop: 12,
              borderLeftWidth: 3,
              borderLeftColor: '#3b82f6'
            }}>
              <Text style={{ color: '#3b82f6', fontSize: 14, fontWeight: '500' }}>
                💡 Click "Choose File" to browse and select your CSV/Excel file, or download the template above to get started
              </Text>
            </View>
          </View>

          {/* Import Button */}
          <TouchableOpacity
            style={[styles.submitButton, (!selectedFile || importing) && styles.submitButtonDisabled]}
            onPress={handleImport}
            disabled={!selectedFile || importing}
          >
            <LinearGradient
              colors={importing ? ['#4a5568', '#718096'] : ['#6366f1', '#8b5cf6', '#06b6d4']}
              style={styles.submitButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {importing ? (
                <Text style={styles.submitButtonText}>⏳ Importing...</Text>
              ) : (
                <Text style={styles.submitButtonText}>🚀 Import Participants</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Import Result Modal */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {importResult?.success ? '✅ Import Successful' : '⚠️ Import Completed'}
              </Text>
              <TouchableOpacity onPress={() => setShowResultModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              {importResult && (
                <View style={{ padding: 16 }}>
                  <Text style={[styles.modalOptionText, { marginBottom: 16 }]}>
                    Total Rows: {importResult.totalRows}
                  </Text>
                  <Text style={[styles.modalOptionText, { marginBottom: 16, color: '#10b981' }]}>
                    Successful: {importResult.successfulImports}
                  </Text>
                  <Text style={[styles.modalOptionText, { marginBottom: 16, color: '#ef4444' }]}>
                    Failed: {importResult.failedImports}
                  </Text>
                  
                  {importResult.errors.length > 0 && (
                    <View style={{ marginTop: 16 }}>
                      <Text style={[styles.modalOptionText, { marginBottom: 12, fontWeight: '700' }]}>
                        Errors:
                      </Text>
                      {importResult.errors.slice(0, 10).map((error, index) => (
                        <Text key={index} style={[styles.modalOptionText, { color: '#ef4444', fontSize: 14 }]}>
                          Row {error.row}: {error.message}
                        </Text>
                      ))}
                      {importResult.errors.length > 10 && (
                        <Text style={[styles.modalOptionText, { color: '#f59e0b', fontSize: 14 }]}>
                          ... and {importResult.errors.length - 10} more errors
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Template Modal */}
      <Modal
        visible={showTemplateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📄 Sample Template</Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              <View style={{ padding: 16 }}>
                <Text style={[styles.modalOptionText, { marginBottom: 16, fontWeight: '700' }]}>
                  Required columns (case-insensitive):
                </Text>
                <Text style={[styles.modalOptionText, { fontSize: 14, lineHeight: 20 }]}>
                  Email, Name{'\n'}
                  Phone Number, IC Number{'\n'}
                  Job Position, Grade{'\n'}
                  Tempat Bertugas{'\n'}
                  Last BLS Attempt{'\n'}
                  Asthma (Yes/No){'\n'}
                  Allergies (Yes/No){'\n'}
                  Allergies Description{'\n'}
                  Pregnant (Yes/No){'\n'}
                  Pregnancy Weeks{'\n'}
                  Notes
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* File Preview Modal */}
      <Modal
        visible={showPreview}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%', width: '95%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 File Preview</Text>
              <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalOptions} horizontal={true}>
              <View style={styles.previewContainer}>
                {/* Headers */}
                <View style={styles.previewRow}>
                  {previewHeaders.map((header, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.previewCell, 
                        styles.previewHeaderCell,
                        { width: getColumnWidth(header) }
                      ]}
                    >
                      <Text style={styles.previewHeaderText}>{header}</Text>
                    </View>
                  ))}
                </View>
                
                {/* Data Rows */}
                {previewData.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.previewRow}>
                    {row.map((cell: string, cellIndex: number) => (
                      <View 
                        key={cellIndex} 
                        style={[
                          styles.previewCell,
                          { width: getColumnWidth(previewHeaders[cellIndex]) }
                        ]}
                      >
                        <Text style={styles.previewCellText}>
                          {cell || '-'}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Text style={styles.previewInfo}>
                Showing first {previewData.length} rows of {selectedFile?.name}
              </Text>
              <View style={styles.previewButtons}>
                <TouchableOpacity
                  style={[styles.previewButton, styles.cancelButton]}
                  onPress={() => {
                    setShowPreview(false);
                    setSelectedFile(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.previewButton, styles.importButton]}
                  onPress={() => {
                    setShowPreview(false);
                    handleImport();
                  }}
                >
                  <Text style={styles.importButtonText}>Import Data</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
