import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Modal, Alert } from 'react-native';
import { ComprehensiveResultsService, ComprehensiveResult } from '../services/ComprehensiveResultsService';

interface ComprehensiveResultsScreenProps {
  onBack: () => void;
}

interface MockResult {
  id: string;
  participantName: string;
  icNumber?: string;
  testType: 'pre' | 'post' | 'checklist';
  score: number;
  percentage: number;
  totalQuestions?: number;
  correctAnswers?: number;
  status: 'Pass' | 'Fail' | 'Pending';
  date: string;
  duration: string;
  category: 'Clinical' | 'Non-Clinical';
  certified: boolean;
  remedialAllowed: boolean;
}

export default function ComprehensiveResultsScreen({ onBack }: ComprehensiveResultsScreenProps) {
  const [results, setResults] = useState<MockResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<MockResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<MockResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pre' | 'post' | 'remedial'>('all');

  useEffect(() => {
    if (dataLoaded) {
    filterResults();
    }
  }, [results, searchQuery, filterStatus, dataLoaded]);

  const loadResults = async () => {
    try {
      setLoading(true);
      
      // Load actual data from Supabase
      const comprehensiveResults = await ComprehensiveResultsService.getAllComprehensiveResults();
      
      // Convert to MockResult format for compatibility
      const convertedResults: MockResult[] = [];
      
      // Create separate entries for pre-test and post-test results
      comprehensiveResults.forEach((result, index) => {
        // Pre-test entry
        if (result.pre_test.status !== 'NOT_TAKEN') {
          convertedResults.push({
            id: `${result.participant_id}-pre`,
            participantName: result.participant_name || 'Unknown',
            icNumber: result.participant_ic_number || '',
            testType: 'pre',
            score: result.pre_test.percentage || 0,
            percentage: result.pre_test.percentage || 0,
            totalQuestions: result.pre_test.total_questions || 30,
            correctAnswers: result.pre_test.score || 0,
            status: result.pre_test.status === 'PASS' ? 'Pass' : 'Fail',
            date: result.pre_test.submitted_at ? result.pre_test.submitted_at.split('T')[0] : new Date().toISOString().split('T')[0],
            duration: 'N/A',
            category: result.participant_category as 'Clinical' | 'Non-Clinical',
            certified: result.pre_test.status === 'PASS',
            remedialAllowed: result.pre_test.status === 'FAIL'
          });
        }
        
        // Post-test entry
        if (result.post_test.status !== 'NOT_TAKEN') {
          convertedResults.push({
            id: `${result.participant_id}-post`,
            participantName: result.participant_name || 'Unknown',
            icNumber: result.participant_ic_number || '',
            testType: 'post',
            score: result.post_test.percentage || 0,
            percentage: result.post_test.percentage || 0,
            totalQuestions: result.post_test.total_questions || 30,
            correctAnswers: result.post_test.score || 0,
            status: result.post_test.status === 'PASS' ? 'Pass' : 'Fail',
            date: result.post_test.submitted_at ? result.post_test.submitted_at.split('T')[0] : new Date().toISOString().split('T')[0],
            duration: 'N/A',
            category: result.participant_category as 'Clinical' | 'Non-Clinical',
            certified: result.post_test.status === 'PASS',
            remedialAllowed: result.post_test.status === 'FAIL'
          });
        }
      });
      
      setResults(convertedResults);
      
    } catch (error) {
      console.error('Error loading results:', error);
      Alert.alert('Error', 'Failed to load results.');
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

  const filterResults = () => {
    let filtered = results;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(result =>
        result.participantName.toLowerCase().includes(query)
      );
    }

    // Apply tab-specific filters
    if (filterStatus === 'pre') {
      filtered = filtered.filter(result => result.testType === 'pre');
      filtered = filtered.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return b.score - a.score;
      });
    } else if (filterStatus === 'post') {
      filtered = filtered.filter(result => result.testType === 'post');
      filtered = filtered.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return b.score - a.score;
      });
    } else if (filterStatus === 'remedial') {
      const participantMap = new Map();
      filtered.forEach(result => {
        if (!participantMap.has(result.participantName)) {
          participantMap.set(result.participantName, result);
        }
      });
      filtered = Array.from(participantMap.values());
      filtered = filtered.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.participantName.localeCompare(b.participantName);
      });
    } else {
      filtered = filtered.sort((a, b) => a.participantName.localeCompare(b.participantName));
    }

    setFilteredResults(filtered);
  };

  const getClinicalResults = () => filteredResults.filter(result => result.category === 'Clinical');
  const getNonClinicalResults = () => filteredResults.filter(result => result.category === 'Non-Clinical');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pass': return '#27ae60';
      case 'Fail': return '#e74c3c';
      case 'Pending': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const statistics = {
    total: dataLoaded ? results.length : 0,
    passed: dataLoaded ? results.filter(r => r.status === 'Pass').length : 0,
    failed: dataLoaded ? results.filter(r => r.status === 'Fail').length : 0,
    pending: dataLoaded ? results.filter(r => r.status === 'Pending').length : 0,
    certified: dataLoaded ? results.filter(r => r.certified).length : 0,
    averageScore: dataLoaded && results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length) : 0
  };

  const handleResultPress = (result: MockResult) => {
    setSelectedResult(result);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedResult(null);
  };

  const renderResultRow = (result: MockResult, index: number) => (
    <TouchableOpacity
      key={`${result.id}-${index}`}
      style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}
      onPress={() => handleResultPress(result)}
      activeOpacity={0.7}
    >
      <Text style={[styles.tableCellText, styles.rankColumn]}>{index + 1}</Text>
      <Text style={[styles.tableCellText, styles.nameColumn]} numberOfLines={2}>{result.participantName}</Text>
      <Text style={[styles.tableCellText, styles.icColumn]}>{result.icNumber}</Text>
      <Text style={[styles.tableCellText, styles.jobColumn]}>{result.category}</Text>
      <View style={[styles.resultColumn, { alignItems: 'center' }]}>
        <Text style={[styles.tableCellText, { color: getStatusColor(result.status), fontWeight: 'bold', fontSize: 13 }]}>
          {result.correctAnswers || 0}/{result.totalQuestions || 30}
        </Text>
        <Text style={[styles.tableCellText, { color: getStatusColor(result.status), fontSize: 11 }]}>
          ({result.score}%)
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(result.status), paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginTop: 2 }]}>
          <Text style={[styles.statusText, { fontSize: 10 }]}>{result.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
    );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📊 Comprehensive Results</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🚀 LATEST VERSION - REAL DATA + SIDE-BY-SIDE LAYOUT 🚀</Text>
        <Text style={styles.subtitle}>Deployed: {new Date().toLocaleString()} - Real Supabase data with side-by-side tables!</Text>
      </View>

      {/* Statistics */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScrollView}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#3498db' }]}>
            <Text style={styles.statNumber}>{statistics.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#27ae60' }]}>
            <Text style={styles.statNumber}>{statistics.passed}</Text>
            <Text style={styles.statLabel}>Passed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#e74c3c' }]}>
            <Text style={styles.statNumber}>{statistics.failed}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#f39c12' }]}>
            <Text style={styles.statNumber}>{statistics.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#9b59b6' }]}>
            <Text style={styles.statNumber}>{statistics.certified}</Text>
            <Text style={styles.statLabel}>Certified</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#34495e' }]}>
            <Text style={styles.statNumber}>{statistics.averageScore}%</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
        </View>
      </ScrollView>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search participants..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
          <View style={styles.filterButtons}>
            {[
              { key: 'all', label: 'All Results' },
              { key: 'pre', label: 'Pre Test' },
              { key: 'post', label: 'Post Test' },
              { key: 'remedial', label: 'Remedial (Pass/Fail)' }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  { backgroundColor: filterStatus === filter.key ? '#3498db' : '#f8f9fa' }
                ]}
                onPress={() => {
                  setFilterStatus(filter.key as any);
                  if (!dataLoaded) {
                    loadResults();
                  }
                }}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: filterStatus === filter.key ? '#fff' : '#666' }
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Results */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {!dataLoaded ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>📋 Click a tab above to load data</Text>
            <Text style={styles.emptySubtitle}>Select All Results, Pre Test, Post Test, or Remedial</Text>
          </View>
        ) : filteredResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filter</Text>
          </View>
        ) : (filterStatus === 'pre' || filterStatus === 'post') ? (
          <View>
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>📊 {filterStatus === 'pre' ? 'Pre Test' : 'Post Test'} Results</Text>
              <Text style={styles.emptySubtitle}>Results shown by category side by side</Text>
            </View>
              
            {/* Side by Side Tables Container */}
            <View style={styles.sideBySideContainer}>
              {/* Clinical Table */}
              <View style={styles.sideBySideTable}>
                <Text style={styles.tableTitle}>Clinical Participants</Text>
                <View style={styles.separateTableHeader}>
                  <Text style={[styles.tableHeaderText, styles.rankColumn]}>Rank</Text>
                  <Text style={[styles.tableHeaderText, styles.nameColumn]}>Name</Text>
                  <Text style={[styles.tableHeaderText, styles.icColumn]}>IC</Text>
                  <Text style={[styles.tableHeaderText, styles.jobColumn]}>Category</Text>
                  <Text style={[styles.tableHeaderText, styles.resultColumn]}>Result</Text>
                </View>
                
                {getClinicalResults().length === 0 ? (
                  <View style={styles.emptyTableRow}>
                    <Text style={styles.emptyTableText}>No clinical participants found</Text>
                  </View>
                ) : (
                  getClinicalResults().map((result, index) => renderResultRow(result, index))
                )}
              </View>

              {/* Non-Clinical Table */}
              <View style={styles.sideBySideTable}>
                <Text style={styles.tableTitle}>Non-Clinical Participants</Text>
                <View style={styles.separateTableHeader}>
                  <Text style={[styles.tableHeaderText, styles.rankColumn]}>Rank</Text>
                  <Text style={[styles.tableHeaderText, styles.nameColumn]}>Name</Text>
                  <Text style={[styles.tableHeaderText, styles.icColumn]}>IC</Text>
                  <Text style={[styles.tableHeaderText, styles.jobColumn]}>Category</Text>
                  <Text style={[styles.tableHeaderText, styles.resultColumn]}>Result</Text>
                </View>
                
                {getNonClinicalResults().length === 0 ? (
                  <View style={styles.emptyTableRow}>
                    <Text style={styles.emptyTableText}>No non-clinical participants found</Text>
                  </View>
                ) : (
                  getNonClinicalResults().map((result, index) => renderResultRow(result, index))
                )}
              </View>
            </View>
          </View>
        ) : (
          // All Results or Remedial - show comprehensive table
          <View style={styles.comprehensiveTableContainer}>
            <Text style={styles.emptyTitle}>📋 {filterStatus === 'all' ? 'All Results' : 'Remedial Status'} Table</Text>
            <Text style={styles.emptySubtitle}>Comprehensive view of all participant data</Text>
          </View>
        )}
      </ScrollView>

      {/* Result Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Test Result Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          
          {selectedResult && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalParticipantName}>{selectedResult.participantName}</Text>
              
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>📊 Test Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Test Type:</Text>
                  <Text style={styles.detailValue}>{selectedResult.testType.toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>{selectedResult.category}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Score:</Text>
                  <Text style={[styles.detailValue, { fontSize: 20, fontWeight: 'bold' }]}>
                    {selectedResult.score}%
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedResult.status) }]}>
                    <Text style={styles.statusText}>{selectedResult.status}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6c757d',
  },
  statsScrollView: {
    maxHeight: 120,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  statCard: {
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 15,
  },
  filterScrollView: {
    maxHeight: 50,
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#7f8c8d',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  separateTableContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginVertical: 10,
    overflow: 'hidden',
  },
  sideBySideContainer: {
    flexDirection: 'row',
    marginVertical: 10,
    paddingHorizontal: 5,
  },
  sideBySideTable: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
    marginHorizontal: 5,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  separateTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6c7ae0',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: '#f8f9fa',
  },
  oddRow: {
    backgroundColor: '#fff',
  },
  tableCellText: {
    fontSize: 12,
    color: '#2c3e50',
    textAlign: 'center',
  },
  rankColumn: {
    width: 60,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  nameColumn: {
    width: 200,
    paddingHorizontal: 4,
  },
  icColumn: {
    width: 120,
    paddingHorizontal: 4,
  },
  jobColumn: {
    width: 100,
    paddingHorizontal: 4,
  },
  resultColumn: {
    width: 120,
    paddingHorizontal: 4,
  },
  emptyTableRow: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  comprehensiveTableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalParticipantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 30,
  },
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
    textAlign: 'right',
  },
});
