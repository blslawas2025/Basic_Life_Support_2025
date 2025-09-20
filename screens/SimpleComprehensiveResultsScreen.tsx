import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';

interface SimpleComprehensiveResultsScreenProps {
  onBack: () => void;
}

interface ResultData {
  id: string;
  participantName: string;
  testType: string;
  score: number;
  percentage: number;
  status: 'Pass' | 'Fail' | 'Pending';
  date: string;
  duration: string;
}

export default function SimpleComprehensiveResultsScreen({ onBack }: SimpleComprehensiveResultsScreenProps) {
  const [results, setResults] = useState<ResultData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Pass' | 'Fail' | 'Pending'>('all');
  const [selectedResult, setSelectedResult] = useState<ResultData | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Demo data
  useEffect(() => {
    setResults([
      {
        id: '1',
        participantName: 'MUHSINAH BINTI ABDUL SHOMAD',
        testType: 'Pre-Test',
        score: 85,
        percentage: 85,
        status: 'Pass',
        date: '2024-01-15',
        duration: '25 minutes'
      },
      {
        id: '2',
        participantName: 'Ahmad Bin Hassan',
        testType: 'Post-Test',
        score: 92,
        percentage: 92,
        status: 'Pass',
        date: '2024-01-16',
        duration: '22 minutes'
      },
      {
        id: '3',
        participantName: 'Siti Noor Aishah',
        testType: 'Pre-Test',
        score: 65,
        percentage: 65,
        status: 'Fail',
        date: '2024-01-17',
        duration: '30 minutes'
      },
      {
        id: '4',
        participantName: 'Muhammad Ali Rahman',
        testType: 'Post-Test',
        score: 78,
        percentage: 78,
        status: 'Pass',
        date: '2024-01-18',
        duration: '28 minutes'
      },
      {
        id: '5',
        participantName: 'Fatimah Zahra',
        testType: 'Pre-Test',
        score: 0,
        percentage: 0,
        status: 'Pending',
        date: '2024-01-19',
        duration: '-'
      }
    ]);
  }, []);

  const filteredResults = results.filter(result => {
    const matchesSearch = result.participantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || result.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statistics = {
    total: results.length,
    passed: results.filter(r => r.status === 'Pass').length,
    failed: results.filter(r => r.status === 'Fail').length,
    pending: results.filter(r => r.status === 'Pending').length,
    averageScore: Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
  };

  const handleResultPress = (result: ResultData) => {
    setSelectedResult(result);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedResult(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pass': return '#27ae60';
      case 'Fail': return '#e74c3c';
      case 'Pending': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pass': return '✅';
      case 'Fail': return '❌';
      case 'Pending': return '⏳';
      default: return '❓';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📊 Comprehensive Results</Text>
        <Text style={styles.subtitle}>Test results and analytics</Text>
      </View>

      {/* Statistics Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScrollView}>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#3498db' }]}>
            <Text style={styles.statNumber}>{statistics.total}</Text>
            <Text style={styles.statLabel}>Total Tests</Text>
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
            <Text style={styles.statNumber}>{statistics.averageScore}%</Text>
            <Text style={styles.statLabel}>Average</Text>
          </View>
        </View>
      </ScrollView>

      {/* Search and Filter */}
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
            {['all', 'Pass', 'Fail', 'Pending'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  { backgroundColor: filterStatus === status ? '#3498db' : '#f8f9fa' }
                ]}
                onPress={() => setFilterStatus(status as any)}
              >
                <Text style={[
                  styles.filterButtonText,
                  { color: filterStatus === status ? '#fff' : '#666' }
                ]}>
                  {status === 'all' ? 'All' : status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Results List */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {filteredResults.map((result) => (
          <TouchableOpacity
            key={result.id}
            style={styles.resultCard}
            onPress={() => handleResultPress(result)}
            activeOpacity={0.7}
          >
            <View style={styles.resultHeader}>
              <Text style={styles.participantName}>{result.participantName}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(result.status) }]}>
                <Text style={styles.statusText}>{getStatusIcon(result.status)} {result.status}</Text>
              </View>
            </View>
            
            <View style={styles.resultDetails}>
              <Text style={styles.testType}>📝 {result.testType}</Text>
              <Text style={styles.score}>🎯 Score: {result.score}% ({result.percentage}/100)</Text>
              <Text style={styles.date}>📅 {result.date}</Text>
              <Text style={styles.duration}>⏱️ Duration: {result.duration}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {filteredResults.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No results found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'No test results available'}
            </Text>
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
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Test Result Details</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>✕ Close</Text>
              </TouchableOpacity>
            </View>

            {selectedResult && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailName}>{selectedResult.participantName}</Text>
                
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>📝 Test Information</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Test Type:</Text>
                    <Text style={styles.detailValue}>{selectedResult.testType}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Date:</Text>
                    <Text style={styles.detailValue}>{selectedResult.date}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration:</Text>
                    <Text style={styles.detailValue}>{selectedResult.duration}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>🎯 Results</Text>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Score:</Text>
                    <Text style={[styles.detailValue, { fontSize: 20, fontWeight: 'bold' }]}>
                      {selectedResult.score}%
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedResult.status) }]}>
                      <Text style={styles.statusText}>
                        {getStatusIcon(selectedResult.status)} {selectedResult.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
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
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    fontSize: 16,
    color: '#7f8c8d',
  },
  statsScrollView: {
    maxHeight: 120,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  statCard: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    borderBottomColor: '#eee',
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
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10,
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
  resultDetails: {
    gap: 5,
  },
  testType: {
    fontSize: 14,
    color: '#3498db',
  },
  score: {
    fontSize: 14,
    color: '#e67e22',
    fontWeight: '600',
  },
  date: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  duration: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalContent: {
    flexGrow: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  detailsContainer: {
    padding: 20,
  },
  detailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
});
