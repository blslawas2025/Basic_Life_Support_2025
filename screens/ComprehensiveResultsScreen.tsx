import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ComprehensiveResultsService, ComprehensiveResult } from '../services/ComprehensiveResultsService';
import CalendarPicker from '../components/CalendarPicker';

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

interface ComprehensiveResultsScreenProps {
  onBack: () => void;
}

export default function ComprehensiveResultsScreen({ onBack }: ComprehensiveResultsScreenProps) {
  const [results, setResults] = useState<ComprehensiveResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ComprehensiveResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [remedialFilter, setRemedialFilter] = useState('all');
  const [certifiedFilter, setCertifiedFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState('');
  const [selectedResult, setSelectedResult] = useState<ComprehensiveResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  
  // Dropdown options
  const dropdownOptions = {
    remedial: [
      { value: 'all', label: 'All' },
      { value: 'ALLOWED', label: 'Allow' },
      { value: 'NOT_ALLOWED', label: 'Not Allow' }
    ],
    certified: [
      { value: 'all', label: 'All' },
      { value: 'CERTIFIED', label: 'Certified' },
      { value: 'NOT_CERTIFIED', label: 'Not Certified' }
    ],
    category: [
      { value: 'all', label: 'All' },
      { value: 'Clinical', label: 'Clinical' },
      { value: 'Non-Clinical', label: 'Non-Clinical' }
    ],
    dateRange: [
      { value: 'all', label: 'All Time' },
      { value: 'today', label: 'Today' },
      { value: '7days', label: '7 Days' },
      { value: '30days', label: '30 Days' },
      { value: 'custom', label: 'Custom' }
    ]
  };
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Helper functions for dropdowns
  const getCurrentFilterValue = (filterType: string) => {
    switch (filterType) {
      case 'remedial':
        return remedialFilter;
      case 'certified':
        return certifiedFilter;
      case 'category':
        return categoryFilter;
      case 'dateRange':
        return dateRangeFilter;
      default:
        return 'all';
    }
  };

  const getCurrentFilterLabel = (filterType: string) => {
    const currentValue = getCurrentFilterValue(filterType);
    const options = dropdownOptions[filterType as keyof typeof dropdownOptions];
    const option = options.find(opt => opt.value === currentValue);
    return option ? option.label : 'All';
  };

  const handleDropdownSelect = (filterType: string, value: string) => {
    switch (filterType) {
      case 'remedial':
        setRemedialFilter(value);
        break;
      case 'certified':
        setCertifiedFilter(value);
        break;
      case 'category':
        setCategoryFilter(value);
        break;
      case 'dateRange':
        if (value === 'custom') {
          setShowDatePicker(true);
        } else {
          setDateRangeFilter(value);
        }
        break;
    }
    setShowDropdown(false);
    setActiveDropdown('');
  };

  useEffect(() => {
    loadData();
    startAnimations();
  }, []);

  useEffect(() => {
    filterResults();
  }, [results, searchQuery, categoryFilter, statusFilter, remedialFilter, certifiedFilter, dateRangeFilter, customStartDate, customEndDate]);

  // Add focus listener to refresh data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      console.log('🔄 Screen focused - refreshing data');
      loadData();
    });

    return unsubscribe;
  }, [navigation]);

  // Set up real-time subscription for data changes
  useEffect(() => {
    console.log('🔄 Setting up real-time subscription...');
    const unsubscribe = ComprehensiveResultsService.subscribeToChanges((newResults) => {
      console.log('📊 Real-time update received:', newResults.length, 'results');
      setResults(newResults);
      // Also refresh statistics
      ComprehensiveResultsService.getComprehensiveStatistics().then(setStatistics);
    });

    return () => {
      console.log('🔄 Cleaning up real-time subscription');
      unsubscribe();
    };
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
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading comprehensive results...');
      
      // Clear existing data first
      setResults([]);
      setStatistics(null);
      
      const [resultsData, statsData] = await Promise.all([
        ComprehensiveResultsService.getAllComprehensiveResults(),
        ComprehensiveResultsService.getComprehensiveStatistics()
      ]);

      setResults(resultsData);
      setStatistics(statsData);
      console.log(`📊 Loaded ${resultsData.length} comprehensive results`);
      
      // Force filter refresh after data load
      setTimeout(() => {
        filterResults();
      }, 100);
      
    } catch (error) {
      console.error('Error loading comprehensive results:', error);
      Alert.alert('Error', 'Failed to load comprehensive results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterResults = () => {
    let filtered = results;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(result =>
        result.participant_name.toLowerCase().includes(query) ||
        result.participant_ic_number.toLowerCase().includes(query) ||
        result.participant_job_position.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(result => result.participant_category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(result => {
        return (
          result.pre_test.status === statusFilter ||
          result.post_test.status === statusFilter ||
          result.one_man_cpr.status === statusFilter ||
          result.two_man_cpr.status === statusFilter ||
          result.infant_cpr.status === statusFilter ||
          result.infant_choking.status === statusFilter ||
          result.adult_choking.status === statusFilter
        );
      });
    }

    // Remedial filter
    if (remedialFilter !== 'all') {
      filtered = filtered.filter(result => result.remedial.status === remedialFilter);
    }

    // Certified filter
    if (certifiedFilter !== 'all') {
      filtered = filtered.filter(result => result.certified.status === certifiedFilter);
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (dateRangeFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            startDate = new Date(customStartDate);
            endDate = new Date(customEndDate);
          } else {
            break; // No custom dates provided, show all
          }
          break;
        default:
          break; // Unknown filter, show all
      }

      if (dateRangeFilter !== 'all' && (dateRangeFilter !== 'custom' || (customStartDate && customEndDate))) {
        filtered = filtered.filter(result => {
          // Check if any assessment was submitted within the date range
          return (
            (result.pre_test.submitted_at && new Date(result.pre_test.submitted_at) >= startDate && new Date(result.pre_test.submitted_at) <= endDate) ||
            (result.post_test.submitted_at && new Date(result.post_test.submitted_at) >= startDate && new Date(result.post_test.submitted_at) <= endDate) ||
            (result.one_man_cpr.submitted_at && new Date(result.one_man_cpr.submitted_at) >= startDate && new Date(result.one_man_cpr.submitted_at) <= endDate) ||
            (result.two_man_cpr.submitted_at && new Date(result.two_man_cpr.submitted_at) >= startDate && new Date(result.two_man_cpr.submitted_at) <= endDate) ||
            (result.infant_cpr.submitted_at && new Date(result.infant_cpr.submitted_at) >= startDate && new Date(result.infant_cpr.submitted_at) <= endDate) ||
            (result.infant_choking.submitted_at && new Date(result.infant_choking.submitted_at) >= startDate && new Date(result.infant_choking.submitted_at) <= endDate) ||
            (result.adult_choking.submitted_at && new Date(result.adult_choking.submitted_at) >= startDate && new Date(result.adult_choking.submitted_at) <= endDate)
          );
        });
      }
    }

    setFilteredResults(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return '#22c55e';
      case 'FAIL': return '#ef4444';
      case 'INCOMPLETE': return '#f59e0b';
      case 'NOT_TAKEN': return '#9ca3af';
      case 'ALLOWED': return '#22c55e';
      case 'NOT_ALLOWED': return '#ef4444';
      case 'CERTIFIED': return '#22c55e';
      case 'NOT_CERTIFIED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return 'checkmark-circle';
      case 'FAIL': return 'close-circle';
      case 'INCOMPLETE': return 'time';
      case 'NOT_TAKEN': return 'remove-circle-outline';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleResultPress = (result: ComprehensiveResult) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedResult(null);
  };

  const renderStatisticsCard = () => {
    if (!statistics) return null;

    return (
      <Animated.View style={[
        styles.statsContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.8)']}
          style={styles.statsCard}
        >
          <View style={styles.statsHeader}>
            <Ionicons name="analytics" size={getResponsiveSize(14, 16, 18)} color="#667eea" />
            <Text style={styles.statsTitle}>Overall Statistics</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Participants</Text>
              <Text style={styles.statNumber}>{statistics.totalParticipants}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Pre Test Passed</Text>
              <Text style={[styles.statNumber, { color: '#22c55e' }]}>
                {statistics.testStats.preTestPassed}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Post Test Passed</Text>
              <Text style={[styles.statNumber, { color: '#22c55e' }]}>
                {statistics.testStats.postTestPassed}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>CPR Passed</Text>
              <Text style={[styles.statNumber, { color: '#22c55e' }]}>
                {statistics.checklistStats.oneManCprPassed + statistics.checklistStats.twoManCprPassed}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Remedial Allowed</Text>
              <Text style={[styles.statNumber, { color: '#22c55e' }]}>
                {statistics.statusStats.remedialAllowed}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Certified</Text>
              <Text style={[styles.statNumber, { color: '#22c55e' }]}>
                {statistics.statusStats.certified}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderCell, styles.nameColumn]}>Name</Text>
      <Text style={[styles.tableHeaderCell, styles.icColumn]}>IC</Text>
      <Text style={[styles.tableHeaderCell, styles.jobColumn]}>Job</Text>
      <Text style={[styles.tableHeaderCell, styles.assessmentColumn]}>Pre Test</Text>
      <Text style={[styles.tableHeaderCell, styles.assessmentColumn]}>Post Test</Text>
      <Text style={[styles.tableHeaderCell, styles.assessmentColumn]}>One Man CPR</Text>
      <Text style={[styles.tableHeaderCell, styles.assessmentColumn]}>Two Man CPR</Text>
      <Text style={[styles.tableHeaderCell, styles.assessmentColumn]}>Infant CPR</Text>
      <Text style={[styles.tableHeaderCell, styles.assessmentColumn]}>Infant Choking</Text>
      <Text style={[styles.tableHeaderCell, styles.assessmentColumn]}>Adult Choking</Text>
      <Text style={[styles.tableHeaderCell, styles.statusColumn]}>Remedial</Text>
      <Text style={[styles.tableHeaderCell, styles.statusColumn]}>Certified</Text>
    </View>
  );

  const renderTableRow = (result: ComprehensiveResult) => (
    <TouchableOpacity
      key={result.participant_id}
      style={styles.tableRow}
      onPress={() => handleResultPress(result)}
      activeOpacity={0.8}
    >
      <Text style={[styles.tableCell, styles.nameColumn]} numberOfLines={2}>
        {result.participant_name}
      </Text>
      <Text style={[styles.tableCell, styles.icColumn]} numberOfLines={1}>
        {result.participant_ic_number}
      </Text>
      <Text style={[styles.tableCell, styles.jobColumn]} numberOfLines={2}>
        {result.participant_job_position}
      </Text>
      {renderTestCell(result.pre_test)}
      {renderTestCell(result.post_test)}
      {renderChecklistCell(result.one_man_cpr)}
      {renderChecklistCell(result.two_man_cpr)}
      {renderChecklistCell(result.infant_cpr)}
      {renderChecklistCell(result.infant_choking)}
      {renderChecklistCell(result.adult_choking)}
      {renderStatusCell(result.remedial)}
      {renderStatusCell(result.certified)}
    </TouchableOpacity>
  );

  const renderTestCell = (test: any) => (
    <View style={[styles.tableCell, styles.assessmentColumn]}>
      <View style={styles.assessmentCell}>
        <View style={[
          styles.statusIndicator, 
          { backgroundColor: getStatusColor(test.status) }
        ]} />
        <Text style={[
          styles.statusText, 
          { color: getStatusColor(test.status) }
        ]}>
          {test.status === 'NOT_TAKEN' ? 'Not Taken' : test.status}
        </Text>
        {test.percentage !== null && (
          <Text style={styles.percentageText}>
            {test.percentage}%
          </Text>
        )}
      </View>
    </View>
  );

  const renderChecklistCell = (checklist: any) => (
    <View style={[styles.tableCell, styles.assessmentColumn]}>
      <View style={styles.assessmentCell}>
        <View style={[
          styles.statusIndicator, 
          { backgroundColor: getStatusColor(checklist.status) }
        ]} />
        <Text style={[
          styles.statusText, 
          { color: getStatusColor(checklist.status) }
        ]}>
          {checklist.status === 'NOT_TAKEN' ? 'Not Taken' : checklist.status}
        </Text>
        <Text style={styles.percentageText}>
          {checklist.completion_percentage}%
        </Text>
      </View>
    </View>
  );

  const renderStatusCell = (status: any) => (
    <View style={[styles.tableCell, styles.statusColumn]}>
      <View style={styles.statusCell}>
        <View style={[
          styles.statusIndicator, 
          { backgroundColor: getStatusColor(status.status) }
        ]} />
        <Text style={[
          styles.statusText, 
          { color: getStatusColor(status.status) }
        ]}>
          {status.status === 'ALLOWED' ? 'Allowed' : 
           status.status === 'NOT_ALLOWED' ? 'Not Allowed' :
           status.status === 'CERTIFIED' ? 'Certified' : 'Not Certified'}
        </Text>
      </View>
    </View>
  );

  const renderDetailModal = () => {
    if (!selectedResult) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showDetailModal}
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Participant Details</Text>
              <TouchableOpacity onPress={closeDetailModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Participant Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>{selectedResult.participant_name}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>IC Number:</Text>
                  <Text style={styles.detailValue}>{selectedResult.participant_ic_number}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Job Position:</Text>
                  <Text style={styles.detailValue}>{selectedResult.participant_job_position}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>{selectedResult.participant_category}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Test Results</Text>
                <View style={styles.assessmentGrid}>
                  <View style={styles.assessmentCard}>
                    <Text style={styles.assessmentTitle}>Pre Test</Text>
                    <View style={styles.assessmentStatus}>
                      <View style={[
                        styles.statusIndicator, 
                        { backgroundColor: getStatusColor(selectedResult.pre_test.status) }
                      ]} />
                      <Text style={[
                        styles.assessmentStatusText, 
                        { color: getStatusColor(selectedResult.pre_test.status) }
                      ]}>
                        {selectedResult.pre_test.status === 'NOT_TAKEN' ? 'Not Taken' : selectedResult.pre_test.status}
                      </Text>
                    </View>
                    {selectedResult.pre_test.percentage !== null && (
                      <Text style={styles.assessmentScore}>
                        {selectedResult.pre_test.score}/{selectedResult.pre_test.total_questions} ({selectedResult.pre_test.percentage}%)
                      </Text>
                    )}
                    <Text style={styles.assessmentDate}>
                      {formatDate(selectedResult.pre_test.submitted_at)}
                    </Text>
                  </View>

                  <View style={styles.assessmentCard}>
                    <Text style={styles.assessmentTitle}>Post Test</Text>
                    <View style={styles.assessmentStatus}>
                      <View style={[
                        styles.statusIndicator, 
                        { backgroundColor: getStatusColor(selectedResult.post_test.status) }
                      ]} />
                      <Text style={[
                        styles.assessmentStatusText, 
                        { color: getStatusColor(selectedResult.post_test.status) }
                      ]}>
                        {selectedResult.post_test.status === 'NOT_TAKEN' ? 'Not Taken' : selectedResult.post_test.status}
                      </Text>
                    </View>
                    {selectedResult.post_test.percentage !== null && (
                      <Text style={styles.assessmentScore}>
                        {selectedResult.post_test.score}/{selectedResult.post_test.total_questions} ({selectedResult.post_test.percentage}%)
                      </Text>
                    )}
                    <Text style={styles.assessmentDate}>
                      {formatDate(selectedResult.post_test.submitted_at)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Checklist Results</Text>
                <View style={styles.checklistGrid}>
                  {[
                    { title: 'One Man CPR', data: selectedResult.one_man_cpr },
                    { title: 'Two Man CPR', data: selectedResult.two_man_cpr },
                    { title: 'Infant CPR', data: selectedResult.infant_cpr },
                    { title: 'Infant Choking', data: selectedResult.infant_choking },
                    { title: 'Adult Choking', data: selectedResult.adult_choking },
                  ].map((checklist, index) => (
                    <View key={index} style={styles.checklistCard}>
                      <Text style={styles.checklistTitle}>{checklist.title}</Text>
                      <View style={styles.checklistStatus}>
                        <View style={[
                          styles.statusIndicator, 
                          { backgroundColor: getStatusColor(checklist.data.status) }
                        ]} />
                        <Text style={[
                          styles.checklistStatusText, 
                          { color: getStatusColor(checklist.data.status) }
                        ]}>
                          {checklist.data.status === 'NOT_TAKEN' ? 'Not Taken' : checklist.data.status}
                        </Text>
                      </View>
                      <Text style={styles.checklistPercentage}>
                        {checklist.data.completion_percentage}%
                      </Text>
                      <Text style={styles.checklistDate}>
                        {formatDate(checklist.data.submitted_at)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Status Summary</Text>
                <View style={styles.statusSummaryGrid}>
                  <View style={styles.statusSummaryCard}>
                    <Text style={styles.statusSummaryTitle}>Remedial Status</Text>
                    <View style={styles.statusSummaryStatus}>
                      <View style={[
                        styles.statusIndicator, 
                        { backgroundColor: getStatusColor(selectedResult.remedial.status) }
                      ]} />
                      <Text style={[
                        styles.statusSummaryText, 
                        { color: getStatusColor(selectedResult.remedial.status) }
                      ]}>
                        {selectedResult.remedial.status === 'ALLOWED' ? 'Allowed' : 'Not Allowed'}
                      </Text>
                    </View>
                    <Text style={styles.statusSummaryReason}>
                      {selectedResult.remedial.reason}
                    </Text>
                  </View>

                  <View style={styles.statusSummaryCard}>
                    <Text style={styles.statusSummaryTitle}>Certification Status</Text>
                    <View style={styles.statusSummaryStatus}>
                      <View style={[
                        styles.statusIndicator, 
                        { backgroundColor: getStatusColor(selectedResult.certified.status) }
                      ]} />
                      <Text style={[
                        styles.statusSummaryText, 
                        { color: getStatusColor(selectedResult.certified.status) }
                      ]}>
                        {selectedResult.certified.status === 'CERTIFIED' ? 'Certified' : 'Not Certified'}
                      </Text>
                    </View>
                    <Text style={styles.statusSummaryReason}>
                      {selectedResult.certified.reason}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient 
          colors={["#0a0a0a", "#1a1a2e", "#16213e"]} 
          style={styles.background}
        />
        <View style={styles.loadingContainer}>
          <Ionicons name="analytics" size={48} color="#00d4ff" />
          <Text style={styles.loadingText}>Loading comprehensive results...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background */}
      <LinearGradient 
        colors={["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460", "#533483", "#0a0a0a"]} 
        style={styles.background}
      />

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
          <View style={styles.headerIcon}>
            <LinearGradient 
              colors={["#00d4ff", "#5b73ff", "#00ff88", "#ff0080"]} 
              style={styles.headerIconGradient}
            >
              <Ionicons name="analytics" size={getResponsiveSize(28, 32, 36)} color="#ffffff" />
            </LinearGradient>
          </View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Comprehensive Results</Text>
            <Text style={styles.headerSubtitle}>All tests and checklists combined</Text>
          </View>
          
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Search and Filter Bar */}
      <Animated.View style={[
        styles.searchContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0]
            }) }
          ]
        }
      ]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search participants..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.refreshButton, refreshing && styles.refreshButtonDisabled]}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color={refreshing ? "#9ca3af" : "#6b7280"} 
            />
            {refreshing && (
              <View style={styles.refreshIndicator}>
                <Ionicons name="sync" size={12} color="#3b82f6" />
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Compact Filter Panel */}
      {showFilters && (
        <Animated.View style={styles.filterPanel}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filters</Text>
            <TouchableOpacity
              style={styles.closeFilterButton}
              onPress={() => setShowFilters(false)}
            >
              <Ionicons name="close" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterContent}>
            <View style={styles.filterRow}>
              {/* Remedial Filter */}
              <View style={styles.filterField}>
                <Text style={styles.filterLabel}>Remedial</Text>
                <TouchableOpacity
                  style={styles.filterDropdown}
                  onPress={() => {
                    setActiveDropdown('remedial');
                    setShowDropdown(true);
                  }}
                >
                  <Text style={styles.filterDropdownText}>
                    {getCurrentFilterLabel('remedial')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Certified Filter */}
              <View style={styles.filterField}>
                <Text style={styles.filterLabel}>Certified</Text>
                <TouchableOpacity
                  style={styles.filterDropdown}
                  onPress={() => {
                    setActiveDropdown('certified');
                    setShowDropdown(true);
                  }}
                >
                  <Text style={styles.filterDropdownText}>
                    {getCurrentFilterLabel('certified')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Category Filter */}
              <View style={styles.filterField}>
                <Text style={styles.filterLabel}>Category</Text>
                <TouchableOpacity
                  style={styles.filterDropdown}
                  onPress={() => {
                    setActiveDropdown('category');
                    setShowDropdown(true);
                  }}
                >
                  <Text style={styles.filterDropdownText}>
                    {getCurrentFilterLabel('category')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Date Range Filter */}
              <View style={styles.filterField}>
                <Text style={styles.filterLabel}>Date Range</Text>
                <TouchableOpacity
                  style={styles.filterDropdown}
                  onPress={() => {
                    setActiveDropdown('dateRange');
                    setShowDropdown(true);
                  }}
                >
                  <Text style={styles.filterDropdownText}>
                    {getCurrentFilterLabel('dateRange')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Clear Button */}
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setStatusFilter('all');
                setRemedialFilter('all');
                setCertifiedFilter('all');
                setDateRangeFilter('all');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
            >
              <Ionicons name="refresh" size={16} color="#6b7280" />
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Custom Date Picker Modal */}
      {/* Calendar Pickers */}
      <CalendarPicker
        visible={showStartDatePicker}
        onClose={() => setShowStartDatePicker(false)}
        onDateSelect={(date) => {
          setCustomStartDate(date);
          setShowStartDatePicker(false);
        }}
        title="Select Start Date"
        initialDate={customStartDate ? new Date(customStartDate) : new Date()}
      />

      <CalendarPicker
        visible={showEndDatePicker}
        onClose={() => setShowEndDatePicker(false)}
        onDateSelect={(date) => {
          setCustomEndDate(date);
          setShowEndDatePicker(false);
        }}
        title="Select End Date"
        initialDate={customEndDate ? new Date(customEndDate) : new Date()}
        minDate={customStartDate ? new Date(customStartDate) : undefined}
      />

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics */}
        {renderStatisticsCard()}

        {/* Results Table */}
        <Animated.View style={[
          styles.resultsContainer,
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
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              Comprehensive Results ({filteredResults.length} participants)
            </Text>
          </View>

          {filteredResults.length > 0 ? (
            <View style={styles.tableContainer}>
              <View style={styles.table}>
                {renderTableHeader()}
                {filteredResults.map(renderTableRow)}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No results found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery 
                  ? 'Try adjusting your search criteria' 
                  : 'No participants have completed assessments yet'
                }
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Detail Modal */}
      {renderDetailModal()}

      {/* Dropdown Modal */}
      {showDropdown && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={showDropdown}
          onRequestClose={() => setShowDropdown(false)}
        >
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setShowDropdown(false)}
          >
            <View style={styles.dropdownContainer}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>
                  Select {activeDropdown.charAt(0).toUpperCase() + activeDropdown.slice(1)}
                </Text>
                <TouchableOpacity
                  style={styles.dropdownCloseButton}
                  onPress={() => setShowDropdown(false)}
                >
                  <Ionicons name="close" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.dropdownOptions}>
                {dropdownOptions[activeDropdown as keyof typeof dropdownOptions]?.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOption,
                      getCurrentFilterValue(activeDropdown) === option.value && styles.dropdownOptionSelected
                    ]}
                    onPress={() => handleDropdownSelect(activeDropdown, option.value)}
                  >
                    <Text style={[
                      styles.dropdownOptionText,
                      getCurrentFilterValue(activeDropdown) === option.value && styles.dropdownOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {getCurrentFilterValue(activeDropdown) === option.value && (
                      <Ionicons name="checkmark" size={16} color="#3b82f6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(),
    paddingTop: getResponsiveSize(25, 30, 35),
    paddingBottom: getResponsiveSize(20, 25, 30),
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0, 212, 255, 0.4)',
    shadowColor: '#00d4ff',
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
    shadowColor: '#00d4ff',
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
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(),
    paddingVertical: getResponsiveSize(15, 18, 20),
    gap: getResponsiveSize(12, 16, 20),
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(15, 18, 20),
    paddingVertical: getResponsiveSize(12, 14, 16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: getResponsiveSize(8, 12, 16),
  },
  searchInput: {
    flex: 1,
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#1a1a1a',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(8, 10, 12),
  },
  refreshButton: {
    padding: getResponsiveSize(12, 14, 16),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: getResponsiveSize(12, 14, 16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 2,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButton: {
    padding: getResponsiveSize(12, 14, 16),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: getResponsiveSize(12, 14, 16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // Compact Filter Panel Styles
  filterPanel: {
    marginHorizontal: getResponsivePadding(),
    marginBottom: getResponsiveSize(12, 16, 20),
    backgroundColor: '#ffffff',
    borderRadius: getResponsiveSize(12, 14, 16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(16, 18, 20),
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filterTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#1f2937',
  },
  closeFilterButton: {
    padding: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(6, 8, 10),
    backgroundColor: '#f9fafb',
  },
  filterContent: {
    padding: getResponsiveSize(16, 18, 20),
  },
  filterRow: {
    flexDirection: 'row',
    gap: getResponsiveSize(12, 14, 16),
    marginBottom: getResponsiveSize(12, 14, 16),
  },
  filterField: {
    flex: 1,
  },
  filterLabel: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveSize(10, 12, 14),
    paddingHorizontal: getResponsiveSize(12, 14, 16),
    backgroundColor: '#f9fafb',
    borderRadius: getResponsiveSize(8, 10, 12),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: getResponsiveSize(40, 44, 48),
  },
  filterDropdownText: {
    fontSize: getResponsiveFontSize(13, 14, 16),
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(10, 12, 14),
    paddingHorizontal: getResponsiveSize(16, 18, 20),
    backgroundColor: '#f3f4f6',
    borderRadius: getResponsiveSize(8, 10, 12),
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: getResponsiveSize(6, 8, 10),
    alignSelf: 'center',
  },
  clearAllText: {
    fontSize: getResponsiveFontSize(13, 14, 16),
    fontWeight: '500',
    color: '#6b7280',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: getResponsivePadding(),
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  statsCard: {
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(8, 10, 12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  statsTitle: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: getResponsiveSize(4, 6, 8),
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveSize(4, 6, 8),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: getResponsiveFontSize(8, 10, 12),
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: getResponsiveSize(2, 4, 6),
  },
  statNumber: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '700',
    color: '#1a1a1a',
  },
  resultsContainer: {
    paddingHorizontal: getResponsiveSize(8, 12, 16), // Reduced padding for more space
    paddingBottom: getResponsiveSize(30, 35, 40),
  },
  resultsHeader: {
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  resultsTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#ffffff',
  },
  tableContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: getResponsiveSize(12, 14, 16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 0, // Remove any horizontal margins
  },
  table: {
    width: '100%', // Use full available width
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#667eea',
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(8, 10, 12),
  },
  tableHeaderCell: {
    fontSize: getResponsiveFontSize(11, 13, 15),
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: getResponsiveSize(6, 8, 10),
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(8, 10, 12),
  },
  tableCell: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#1a1a1a',
    paddingHorizontal: getResponsiveSize(6, 8, 10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Column widths - using flex for better space utilization
  nameColumn: {
    flex: 2.5,
    textAlign: 'left',
    minWidth: 120,
  },
  icColumn: {
    flex: 1.8,
    textAlign: 'center',
    minWidth: 100,
  },
  jobColumn: {
    flex: 2.2,
    textAlign: 'left',
    minWidth: 120,
  },
  assessmentColumn: {
    flex: 1.2,
    textAlign: 'center',
    minWidth: 90,
  },
  statusColumn: {
    flex: 1.3,
    textAlign: 'center',
    minWidth: 100,
  },
  // Assessment cell styles
  assessmentCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  statusText: {
    fontSize: getResponsiveFontSize(9, 11, 13),
    fontWeight: '600',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  percentageText: {
    fontSize: getResponsiveFontSize(8, 10, 12),
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: getResponsiveSize(40, 50, 60),
    paddingHorizontal: getResponsiveSize(20, 24, 28),
  },
  emptyStateText: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: getResponsiveSize(16, 20, 24),
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#6b7280',
    marginTop: getResponsiveSize(8, 10, 12),
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: getResponsiveSize(16, 18, 20),
    margin: getResponsiveSize(20, 24, 28),
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsiveSize(20, 24, 28),
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: getResponsiveSize(4, 6, 8),
  },
  modalBody: {
    flex: 1,
    padding: getResponsiveSize(20, 24, 28),
  },
  detailSection: {
    marginBottom: getResponsiveSize(20, 24, 28),
  },
  detailSectionTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: getResponsiveSize(12, 16, 20),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(8, 10, 12),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#6b7280',
    flex: 1,
  },
  detailValue: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#1a1a1a',
    flex: 2,
    textAlign: 'right',
  },
  assessmentGrid: {
    flexDirection: 'row',
    gap: getResponsiveSize(12, 16, 20),
  },
  assessmentCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 14, 16),
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  assessmentTitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  assessmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  assessmentStatusText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    marginLeft: getResponsiveSize(6, 8, 10),
  },
  assessmentScore: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#6b7280',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  assessmentDate: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#9ca3af',
  },
  checklistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSize(8, 12, 16),
  },
  checklistCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 14, 16),
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  checklistTitle: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  checklistStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  checklistStatusText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '600',
    marginLeft: getResponsiveSize(4, 6, 8),
  },
  checklistPercentage: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#6b7280',
    marginBottom: getResponsiveSize(2, 4, 6),
  },
  checklistDate: {
    fontSize: getResponsiveFontSize(8, 10, 12),
    color: '#9ca3af',
  },
  // Status Summary Styles
  statusSummaryGrid: {
    flexDirection: 'row',
    gap: getResponsiveSize(12, 16, 20),
  },
  statusSummaryCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 14, 16),
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusSummaryTitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  statusSummaryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  statusSummaryText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    marginLeft: getResponsiveSize(6, 8, 10),
  },
  statusSummaryReason: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#6b7280',
    lineHeight: getResponsiveFontSize(14, 16, 18),
  },
  // Date Picker Modal Styles
  datePickerModal: {
    backgroundColor: '#ffffff',
    borderRadius: getResponsiveSize(16, 18, 20),
    margin: getResponsiveSize(20, 24, 28),
    maxHeight: '60%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsiveSize(20, 24, 28),
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  datePickerTitle: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '700',
    color: '#1a1a1a',
  },
  datePickerContent: {
    padding: getResponsiveSize(20, 24, 28),
  },
  dateInputContainer: {
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  dateInputLabel: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#374151',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 14, 16),
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#1a1a1a',
    backgroundColor: '#f9fafb',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveSize(16, 20, 24),
  },
  datePickerButton: {
    flex: 1,
    padding: getResponsiveSize(12, 14, 16),
    borderRadius: getResponsiveSize(8, 10, 12),
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
    marginHorizontal: getResponsiveSize(4, 6, 8),
    alignItems: 'center',
  },
  datePickerButtonPrimary: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  datePickerButtonText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#374151',
  },
  datePickerButtonTextPrimary: {
    color: '#ffffff',
  },
  // Dropdown Modal Styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    backgroundColor: '#ffffff',
    borderRadius: getResponsiveSize(12, 14, 16),
    marginHorizontal: getResponsiveSize(20, 24, 28),
    maxHeight: '70%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSize(16, 18, 20),
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '600',
    color: '#1f2937',
  },
  dropdownCloseButton: {
    padding: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(6, 8, 10),
    backgroundColor: '#f3f4f6',
  },
  dropdownOptions: {
    maxHeight: getResponsiveSize(300, 350, 400),
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSize(16, 18, 20),
    paddingVertical: getResponsiveSize(12, 14, 16),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownOptionSelected: {
    backgroundColor: '#f0f9ff',
  },
  dropdownOptionText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  dropdownOptionTextSelected: {
    color: '#1e40af',
    fontWeight: '600',
  },
});
