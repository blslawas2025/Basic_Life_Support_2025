import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { BulkImportService, ImportTestResult } from '../services/BulkImportService';

interface BulkImportResultsScreenProps {
  onBack: () => void;
}

export default function BulkImportResultsScreen({ onBack }: BulkImportResultsScreenProps) {
  const [csvData, setCsvData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [previewData, setPreviewData] = useState<ImportTestResult[]>([]);

  const handleParseData = () => {
    try {
      const parsed = BulkImportService.parseCSVData(csvData);
      setPreviewData(parsed);
      Alert.alert('Success', `Parsed ${parsed.length} rows of data`);
    } catch (error) {
      Alert.alert('Error', 'Failed to parse CSV data');
    }
  };

  const handleImportData = async () => {
    if (previewData.length === 0) {
      Alert.alert('Error', 'No data to import. Please parse the CSV data first.');
      return;
    }

    setIsImporting(true);
    try {
      const result = await BulkImportService.importTestResults(previewData);
      setImportResult(result);
      
      if (result.success) {
        Alert.alert(
          'Import Successful',
          `Successfully imported ${result.importedResults} test results for ${result.matchedProfiles} participants.`
        );
      } else {
        Alert.alert(
          'Import Completed with Errors',
          `Imported ${result.importedResults} results. ${result.errors.length} errors occurred.`
        );
      }
    } catch (error) {
      Alert.alert('Import Failed', 'An error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  const sampleCSV = `email,name,ic,pre test,post test
john.doe@gmail.com,JOHN DOE,123456789012,20,25
jane.smith@gmail.com,JANE SMITH,123456789013,18,22`;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8b5cf6', '#7c3aed']}
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
          
          <Text style={styles.headerTitle}>Bulk Import Results</Text>
          
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Import Test Results</Text>
          <Text style={styles.sectionSubtitle}>
            Paste your CSV data below. The format should be: email, name, ic, pre test, post test
          </Text>

          <TextInput
            style={styles.textArea}
            value={csvData}
            onChangeText={setCsvData}
            placeholder={sampleCSV}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleParseData}
            >
              <Ionicons name="eye" size={20} color="#8b5cf6" />
              <Text style={styles.secondaryButtonText}>Parse Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleImportData}
              disabled={isImporting || previewData.length === 0}
            >
              {isImporting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="cloud-upload" size={20} color="#ffffff" />
              )}
              <Text style={styles.primaryButtonText}>
                {isImporting ? 'Importing...' : 'Import Results'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {previewData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview Data</Text>
            <Text style={styles.sectionSubtitle}>
              {previewData.length} rows ready for import
            </Text>
            
            <View style={styles.previewContainer}>
              {previewData.slice(0, 5).map((row, index) => (
                <View key={index} style={styles.previewRow}>
                  <Text style={styles.previewText}>
                    {row.name} - Pre: {row.preTest}, Post: {row.postTest}
                  </Text>
                </View>
              ))}
              {previewData.length > 5 && (
                <Text style={styles.moreText}>... and {previewData.length - 5} more rows</Text>
              )}
            </View>
          </View>
        )}

        {importResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Import Results</Text>
            
            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total Rows:</Text>
                <Text style={styles.resultValue}>{importResult.totalRows}</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Matched Profiles:</Text>
                <Text style={styles.resultValue}>{importResult.matchedProfiles}</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Imported Results:</Text>
                <Text style={styles.resultValue}>{importResult.importedResults}</Text>
              </View>
              
              {importResult.unmatchedEmails.length > 0 && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Unmatched Emails:</Text>
                  <Text style={styles.resultValue}>{importResult.unmatchedEmails.length}</Text>
                </View>
              )}
            </View>

            {importResult.errors.length > 0 && (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>Errors:</Text>
                {importResult.errors.slice(0, 5).map((error: string, index: number) => (
                  <Text key={index} style={styles.errorText}>• {error}</Text>
                ))}
                {importResult.errors.length > 5 && (
                  <Text style={styles.moreText}>... and {importResult.errors.length - 5} more errors</Text>
                )}
              </View>
            )}
          </View>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 120,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#8b5cf6',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#8b5cf6',
    fontWeight: '600',
  },
  previewContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewRow: {
    paddingVertical: 4,
  },
  previewText: {
    fontSize: 14,
    color: '#1f2937',
  },
  moreText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  resultLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginBottom: 2,
  },
});

