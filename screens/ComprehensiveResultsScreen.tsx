import React, { useState, useEffect } from 'react';
// build-tag: results-v36
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Modal, Alert, useWindowDimensions, Share, Platform } from 'react-native';
import { ComprehensiveResultsService, ComprehensiveResult } from '../services/ComprehensiveResultsService';
import { supabase } from '../services/supabase';

interface ComprehensiveResultsScreenProps {
  onBack: () => void;
  participantId?: string; // mode=participant
  courseSessionId?: string; // mode=session
}

interface MockResult {
  id: string;
  participantName: string;
  icNumber?: string;
  jobPosition?: string;
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
  // Pre and Post test specific data
  preTestScore?: number;
  preTestPercentage?: number;
  preTestTotalQuestions?: number;
  preTestStatus?: 'Pass' | 'Fail' | 'Not Taken';
  postTestScore?: number;
  postTestPercentage?: number;
  postTestTotalQuestions?: number;
  postTestStatus?: 'Pass' | 'Fail' | 'Not Taken';
  // Checklist assessment data
  oneManCprStatus?: 'Pass' | 'Fail' | 'Incomplete' | 'Not Taken';
  twoManCprStatus?: 'Pass' | 'Fail' | 'Incomplete' | 'Not Taken';
  infantCprStatus?: 'Pass' | 'Fail' | 'Incomplete' | 'Not Taken';
  infantChokingStatus?: 'Pass' | 'Fail' | 'Incomplete' | 'Not Taken';
  adultChokingStatus?: 'Pass' | 'Fail' | 'Incomplete' | 'Not Taken';
}

export default function ComprehensiveResultsScreen({ onBack, participantId, courseSessionId }: ComprehensiveResultsScreenProps) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 900;
  const isMyResults = !!participantId;
  const [results, setResults] = useState<MockResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<MockResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<MockResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pre' | 'post' | 'remedial' | 'remedial_allowed' | 'remedial_not_allowed'>('all');
  
  // New filter states for remedial and certification
  const [remedialFilter, setRemedialFilter] = useState<'all' | 'allowed' | 'not_allowed'>('all');
  const [certificationFilter, setCertificationFilter] = useState<'all' | 'allowed' | 'not_allowed'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [_, setDummy] = useState(0); // used to trigger UI refresh when needed
  const [resolvedSessionId, setResolvedSessionId] = useState<string | undefined>(undefined);

  // Resolve session id for participant mode if not provided
  useEffect(() => {
    const resolve = async () => {
      try {
        if (!courseSessionId && participantId) {
          const { data, error } = await supabase
            .from('profiles')
            .select('course_session_id')
            .eq('id', participantId)
            .single();
          if (!error && data?.course_session_id) {
            setResolvedSessionId(data.course_session_id as string);
          }
        }
      } catch {}
    };
    resolve();
  }, [participantId, courseSessionId]);

  // Load data on component mount or when session id resolves
  useEffect(() => {
    loadResults();
    setDataLoaded(true); // Auto-load data instead of waiting for tab click
  }, [resolvedSessionId]);

  useEffect(() => {
    if (dataLoaded) {
    filterResults();
    }
  }, [results, searchQuery, remedialFilter, certificationFilter, dataLoaded]);

  const loadResults = async (forceRefresh = false) => {
    try {
      // Check if we have cached data and it's recent (less than 5 minutes old)
      const now = Date.now();
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
      
      if (!forceRefresh && dataLoaded && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('Using cached data');
        return;
      }

      setLoading(true);
      
      // Load actual data from Supabase (prefer resolved session for participant mode)
      const sessionId = courseSessionId || resolvedSessionId;
      const comprehensiveResults = await ComprehensiveResultsService.getAllComprehensiveResults(sessionId, participantId);
      
      // Convert to MockResult format for compatibility - group by participant
          const convertedResults: MockResult[] = [];
          
      // Create single entry per participant with both pre and post test data
      comprehensiveResults.forEach((result, index) => {
        // If no session context but participant mode, only keep the participant
        if (!sessionId && participantId && result.participant_id !== participantId) return;
        const participantResult: MockResult = {
          id: result.participant_id,
          participantName: result.participant_name || 'Unknown',
          icNumber: result.participant_ic_number || '',
          jobPosition: result.participant_job_position || 'N/A',
          testType: 'pre', // Default to pre for compatibility
          score: result.pre_test.percentage || 0,
          percentage: result.pre_test.percentage || 0,
          totalQuestions: result.pre_test.total_questions || 30,
          correctAnswers: result.pre_test.score || 0,
          status: result.pre_test.status === 'PASS' ? 'Pass' : 'Fail',
          date: result.pre_test.submitted_at ? result.pre_test.submitted_at.split('T')[0] : new Date().toISOString().split('T')[0],
          duration: 'N/A',
          category: result.participant_category as 'Clinical' | 'Non-Clinical',
          certified: result.post_test.status === 'PASS' && 
                     result.one_man_cpr.status === 'PASS' &&
                     result.two_man_cpr.status === 'PASS' &&
                     result.infant_cpr.status === 'PASS' &&
                     result.infant_choking.status === 'PASS' &&
                     result.adult_choking.status === 'PASS', // Certified only if post test AND all 5 checklists passed
          remedialAllowed: result.post_test.status === 'PASS', // Remedial only allowed if post-test passed
          // Add pre and post test specific data
          preTestScore: result.pre_test.score || 0,
          preTestPercentage: result.pre_test.percentage || 0,
          preTestTotalQuestions: result.pre_test.total_questions || 30,
          preTestStatus: result.pre_test.status === 'PASS' ? 'Pass' : 'Fail',
          postTestScore: result.post_test.score || 0,
          postTestPercentage: result.post_test.percentage || 0,
          postTestTotalQuestions: result.post_test.total_questions || 30,
          postTestStatus: result.post_test.status === 'PASS' ? 'Pass' : 'Fail',
          // Checklist assessment data
          oneManCprStatus: result.one_man_cpr.status === 'PASS' ? 'Pass' : 
                          result.one_man_cpr.status === 'FAIL' ? 'Fail' : 
                          result.one_man_cpr.status === 'INCOMPLETE' ? 'Incomplete' : 'Not Taken',
          twoManCprStatus: result.two_man_cpr.status === 'PASS' ? 'Pass' : 
                          result.two_man_cpr.status === 'FAIL' ? 'Fail' : 
                          result.two_man_cpr.status === 'INCOMPLETE' ? 'Incomplete' : 'Not Taken',
          infantCprStatus: result.infant_cpr.status === 'PASS' ? 'Pass' : 
                          result.infant_cpr.status === 'FAIL' ? 'Fail' : 
                          result.infant_cpr.status === 'INCOMPLETE' ? 'Incomplete' : 'Not Taken',
          infantChokingStatus: result.infant_choking.status === 'PASS' ? 'Pass' : 
                              result.infant_choking.status === 'FAIL' ? 'Fail' : 
                              result.infant_choking.status === 'INCOMPLETE' ? 'Incomplete' : 'Not Taken',
          adultChokingStatus: result.adult_choking.status === 'PASS' ? 'Pass' : 
                             result.adult_choking.status === 'FAIL' ? 'Fail' : 
                             result.adult_choking.status === 'INCOMPLETE' ? 'Incomplete' : 'Not Taken',
        };
        
        convertedResults.push(participantResult);
      });
      
          setResults(convertedResults);
      
      // Note: Removed verbose debugging logs to improve load performance on web/mobile
      
    } catch (error) {
      console.error('Error loading results:', error);
      Alert.alert('Error', 'Failed to load results.');
    } finally {
      setLoading(false);
      setDataLoaded(true);
      setLastFetchTime(Date.now());
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

    // Apply remedial filter
    if (remedialFilter !== 'all') {
      filtered = filtered.filter(result => {
        const isPass = result.postTestStatus === 'Pass' || (result.postTestPercentage && result.postTestPercentage >= (result.category === 'Clinical' ? 83 : 67));
        if (remedialFilter === 'allowed') {
          return !isPass; // Failed participants are allowed for remedial
        } else if (remedialFilter === 'not_allowed') {
          return isPass; // Passed participants are not allowed for remedial
        }
        return true;
      });
    }
    
    // Apply certification filter
    if (certificationFilter !== 'all') {
      filtered = filtered.filter(result => {
        const isPass = result.postTestStatus === 'Pass' || (result.postTestPercentage && result.postTestPercentage >= (result.category === 'Clinical' ? 83 : 67));
        if (certificationFilter === 'allowed') {
          return isPass; // Passed participants are allowed for certification
        } else if (certificationFilter === 'not_allowed') {
          return !isPass; // Failed participants are not allowed for certification
        }
        return true;
      });
    }

    // Default sorting - by name within category
      filtered = filtered.sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.participantName.localeCompare(b.participantName);
      });

    setFilteredResults(filtered);
  };

  const getClinicalResults = () => {
    return filteredResults
      .filter(result => result.category === 'Clinical')
      .filter(result => (participantId ? result.id === participantId : true))
      .sort((a, b) => {
        const nameA = a.participantName || '';
        const nameB = b.participantName || '';
        return nameA.localeCompare(nameB);
      });
  };
  
  const getNonClinicalResults = () => {
    return filteredResults
      .filter(result => result.category === 'Non-Clinical')
      .filter(result => (participantId ? result.id === participantId : true))
      .sort((a, b) => {
        const nameA = a.participantName || '';
        const nameB = b.participantName || '';
        return nameA.localeCompare(nameB);
      });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pass': return '#27ae60';
      case 'Fail': return '#e74c3c';
      case 'Pending': return '#f39c12';
      case 'Incomplete': return '#f39c12';
      case 'Not Taken': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const renderStatusBadge = (status: string) => {
    const color = getStatusColor(status);
    const text = status === 'Not Taken' ? 'N/A' : status;
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: color, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 6 }]}>
        <Text style={[styles.statusText, { fontSize: 9 }]}>{text}</Text>
      </View>
    );
  };

  // Data sets
  const activeSet = participantId ? filteredResults : results; // used for table view (respects filters)
  const kpiSet = participantId ? results : activeSet; // KPIs/top lists in My Results should use full cohort

  const statistics = {
    total: dataLoaded ? kpiSet.length : 0,
    passed: dataLoaded ? kpiSet.filter(r => r.status === 'Pass').length : 0,
    failed: dataLoaded ? kpiSet.filter(r => r.status === 'Fail').length : 0,
    pending: dataLoaded ? kpiSet.filter(r => r.status === 'Pending').length : 0,
    certified: dataLoaded ? kpiSet.filter(r => r.certified).length : 0,
    averageScore: dataLoaded && kpiSet.length > 0 ? Math.round(kpiSet.reduce((sum, r) => sum + r.score, 0) / kpiSet.length) : 0
  };

  // Top performers (important only)
  const topPre = [...kpiSet]
    .filter(r => typeof r.preTestPercentage === 'number')
    .sort((a, b) => (b.preTestPercentage || 0) - (a.preTestPercentage || 0))
    .slice(0, 3);

  const topPost = [...kpiSet]
    .filter(r => typeof r.postTestPercentage === 'number')
    .sort((a, b) => (b.postTestPercentage || 0) - (a.postTestPercentage || 0))
    .slice(0, 3);

  // Pass counts and percentages for Pre/Post
  const preTaken = kpiSet.filter(r => r.preTestStatus && r.preTestStatus !== 'Not Taken').length;
  const prePassed = kpiSet.filter(r => r.preTestStatus === 'Pass').length;
  const prePassPct = preTaken > 0 ? Math.round((prePassed / preTaken) * 100) : 0;

  const postTaken = kpiSet.filter(r => r.postTestStatus && r.postTestStatus !== 'Not Taken').length;
  const postPassed = kpiSet.filter(r => r.postTestStatus === 'Pass').length;
  const postPassPct = postTaken > 0 ? Math.round((postPassed / postTaken) * 100) : 0;

  // Current participant summary (My Results mode)
  const myResult = participantId ? results.find(r => r.id === participantId) || null : null;

  const handleResultPress = (result: MockResult) => {
    setSelectedResult(result);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedResult(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadResults(true); // Force refresh
    setIsRefreshing(false);
  };

  const handleViewAll = () => {
    // Reset search and filters to show all data
    setSearchQuery('');
    setRemedialFilter('all');
    setCertificationFilter('all');
    setFilterStatus('all');
    setDummy(v => v + 1);
  };

  const handleShareLink = async () => {
    try {
      const url = typeof window !== 'undefined' && window.location ? window.location.href : 'https://basic-life-support-2025.vercel.app/';
      if (Platform.OS !== 'web') {
        await Share.share({ message: url, url });
      } else if (typeof navigator !== 'undefined' && (navigator as any).clipboard) {
        await (navigator as any).clipboard.writeText(url);
        Alert.alert('Link copied', 'The page link has been copied to your clipboard.');
      } else {
        Alert.alert('Share', url);
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to share the link.');
    }
  };

  const handleExportCsv = () => {
    try {
      const rows = [
        ['Name','IC','Job','Category','Pre %','Post %','One Man CPR','Two Man CPR','Infant CPR','Infant Choking','Adult Choking','Certified'],
        ...filteredResults.map(r => [
          r.participantName,
          r.icNumber || '',
          r.jobPosition || '',
          r.category,
          String(r.preTestPercentage ?? ''),
          String(r.postTestPercentage ?? ''),
          r.oneManCprStatus || '',
          r.twoManCprStatus || '',
          r.infantCprStatus || '',
          r.infantChokingStatus || '',
          r.adultChokingStatus || '',
          r.certified ? 'Yes' : 'No'
        ])
      ];
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = isMyResults ? 'my-results.csv' : 'comprehensive-results.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        Alert.alert('Export CSV', 'CSV export is available on the web version.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to export CSV.');
    }
  };

  const renderResultRow = (result: MockResult, index: number) => (
    <TouchableOpacity
      key={`${result.id}-${index}`}
      style={[
        styles.tableRow,
        index % 2 === 0 ? styles.evenRow : styles.oddRow,
        participantId && result.id === participantId ? styles.highlightRow : null
      ]}
      onPress={() => handleResultPress(result)}
      activeOpacity={0.7}
    >
      <Text style={[styles.tableCellText, styles.rankColumn]}>{index + 1}</Text>
      <Text style={[styles.tableCellText, styles.nameColumn]} numberOfLines={2} ellipsizeMode="tail">{participantId && result.id === participantId ? `${result.participantName} (You)` : result.participantName}</Text>
      <Text style={[styles.tableCellText, styles.icColumn]}>{result.icNumber}</Text>
      <Text style={[styles.tableCellText, styles.jobColumn]} numberOfLines={2} ellipsizeMode="tail">{result.jobPosition || 'N/A'}</Text>
      <Text style={[styles.tableCellText, styles.categoryColumn]}>{result.category}</Text>
      {/* Show only relevant test column based on filter */}
      {filterStatus === 'pre' ? (
        /* Pre Test Column Only */
        <View style={[styles.assessmentColumn, { alignItems: 'center' }]}>
          {result.preTestStatus && result.preTestStatus !== 'Not Taken' ? (
            <>
              <Text style={[styles.tableCellText, { color: getStatusColor(result.preTestStatus), fontSize: 11 }]}>
                {result.preTestScore || 0}/{result.preTestTotalQuestions || 30}
              </Text>
              <Text style={[styles.tableCellText, { color: getStatusColor(result.preTestStatus), fontSize: 10 }]}>
                ({result.preTestPercentage || 0}%)
              </Text>
            </>
          ) : (
            <Text style={[styles.tableCellText, { color: '#9ca3af', fontSize: 10 }]}>N/A</Text>
          )}
        </View>
      ) : filterStatus === 'post' ? (
        /* Post Test Column Only */
        <View style={[styles.assessmentColumn, { alignItems: 'center' }]}>
          {result.postTestStatus && result.postTestStatus !== 'Not Taken' ? (
            <>
              <Text style={[styles.tableCellText, { color: getStatusColor(result.postTestStatus), fontSize: 11 }]}>
                {result.postTestScore || 0}/{result.postTestTotalQuestions || 30}
              </Text>
              <Text style={[styles.tableCellText, { color: getStatusColor(result.postTestStatus), fontSize: 10 }]}>
                ({result.postTestPercentage || 0}%)
              </Text>
            </>
          ) : (
            <Text style={[styles.tableCellText, { color: '#9ca3af', fontSize: 10 }]}>N/A</Text>
          )}
        </View>
      ) : (
        /* Both Pre and Post Test Columns */
        <>
          {/* Pre Test Column */}
          <View style={[styles.assessmentColumn, { alignItems: 'center' }]}>
            {result.preTestStatus && result.preTestStatus !== 'Not Taken' ? (
              <>
                <Text style={[styles.tableCellText, { color: getStatusColor(result.preTestStatus), fontSize: 11 }]}>
                  {result.preTestScore || 0}/{result.preTestTotalQuestions || 30}
                </Text>
                <Text style={[styles.tableCellText, { color: getStatusColor(result.preTestStatus), fontSize: 10 }]}>
                  ({result.preTestPercentage || 0}%)
                </Text>
              </>
            ) : (
              <Text style={[styles.tableCellText, { color: '#9ca3af', fontSize: 10 }]}>N/A</Text>
            )}
          </View>
          {/* Post Test Column */}
          <View style={[styles.assessmentColumn, { alignItems: 'center' }]}>
            {result.postTestStatus && result.postTestStatus !== 'Not Taken' ? (
              <>
                <Text style={[styles.tableCellText, { color: getStatusColor(result.postTestStatus), fontSize: 11 }]}>
                  {result.postTestScore || 0}/{result.postTestTotalQuestions || 30}
                </Text>
                <Text style={[styles.tableCellText, { color: getStatusColor(result.postTestStatus), fontSize: 10 }]}>
                  ({result.postTestPercentage || 0}%)
                </Text>
              </>
            ) : (
              <Text style={[styles.tableCellText, { color: '#9ca3af', fontSize: 10 }]}>N/A</Text>
            )}
          </View>
        </>
      )}
      {/* One Man CPR Column */}
      <View style={[styles.assessmentColumn, { alignItems: 'center' }]}>
        {renderStatusBadge(result.oneManCprStatus || 'Not Taken')}
      </View>
      {/* Two Man CPR Column */}
      <View style={[styles.assessmentColumn, { alignItems: 'center' }]}>
        {renderStatusBadge(result.twoManCprStatus || 'Not Taken')}
      </View>
      {/* Infant CPR Column */}
      <View style={[styles.assessmentColumn, { alignItems: 'center' }]}>
        {renderStatusBadge(result.infantCprStatus || 'Not Taken')}
      </View>
      {/* Infant Choking Column */}
      <View style={[styles.assessmentColumn, { alignItems: 'center' }]}>
        {renderStatusBadge(result.infantChokingStatus || 'Not Taken')}
      </View>
      {/* Adult Choking Column */}
      <View style={[styles.assessmentColumn, { alignItems: 'center' }]}>
        {renderStatusBadge(result.adultChokingStatus || 'Not Taken')}
      </View>
      {/* Remedial Column */}
      <View style={[styles.assessmentColumn, { alignItems: 'center' }]}>
        <View style={[styles.statusBadge, { backgroundColor: result.remedialAllowed ? '#27ae60' : '#e74c3c', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 6 }]}>
          <Text style={[styles.statusText, { fontSize: 9 }]}>{result.remedialAllowed ? 'Yes' : 'No'}</Text>
        </View>
      </View>
      {/* Certified Column */}
      <View style={[styles.assessmentColumn, { alignItems: 'center' }]}>
        <View style={[styles.statusBadge, { backgroundColor: result.certified ? '#27ae60' : '#e74c3c', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 6 }]}>
          <Text style={[styles.statusText, { fontSize: 9 }]}>{result.certified ? 'Yes' : 'No'}</Text>
        </View>
      </View>
    </TouchableOpacity>
    );

  if (loading && !dataLoaded) {
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
          <View style={styles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={styles.skeletonRow}>
                <View style={styles.skeletonCell} />
                <View style={styles.skeletonCell} />
                <View style={styles.skeletonCell} />
                <View style={styles.skeletonCell} />
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} testID={isMyResults ? 'my-results-screen' : 'comprehensive-results-screen'} accessibilityLabel={isMyResults ? 'my-results-screen' : 'comprehensive-results-screen'}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isMyResults ? '📊 My Results' : '📊 Comprehensive Results'}</Text>
        <Text style={styles.subtitle}>Test Results and Performance Analytics</Text>
      </View>

      {/* Everything below scrolls together */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {/* Modern KPIs: Pre/Post Passed with % */}
        <View style={styles.modernKpiRow}>
          <View style={[styles.kpiWideCard, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.35)' }]}>
            <Text style={styles.kpiCaption}>Pre Test Passed</Text>
            <Text style={styles.kpiValueLarge}>{prePassed} <Text style={styles.kpiSubValue}>({prePassPct}%)</Text></Text>
            <Text style={styles.kpiLabel}>of {preTaken} taken</Text>
          </View>
          <View style={[styles.kpiWideCard, { backgroundColor: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.35)' }]}>
            <Text style={styles.kpiCaption}>Post Test Passed</Text>
            <Text style={styles.kpiValueLarge}>{postPassed} <Text style={styles.kpiSubValue}>({postPassPct}%)</Text></Text>
            <Text style={styles.kpiLabel}>of {postTaken} taken</Text>
          </View>
          {/* Removed Your Scores card as requested */}
        </View>

        {/* Removed action buttons for My Results */}

        {/* Top performers */}
        <View style={styles.topRow}>
        <View style={styles.topCard}>
          <Text style={styles.topTitle}>Top 3 Pre Test</Text>
          {topPre.length === 0 ? (
            <Text style={styles.topEmpty}>No data</Text>
          ) : topPre.map((p, i) => (
            <View key={`pre-${p.id}-${i}`} style={styles.topItem}>
              <Text style={styles.topRank}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.topName} numberOfLines={1}>{p.participantName}</Text>
                <Text style={styles.topMeta}>{p.category}</Text>
              </View>
              <Text style={styles.topScore}>{p.preTestPercentage}%</Text>
            </View>
          ))}
        </View>
        <View style={styles.topCard}>
          <Text style={styles.topTitle}>Top 3 Post Test</Text>
          {topPost.length === 0 ? (
            <Text style={styles.topEmpty}>No data</Text>
          ) : topPost.map((p, i) => (
            <View key={`post-${p.id}-${i}`} style={styles.topItem}>
              <Text style={styles.topRank}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.topName} numberOfLines={1}>{p.participantName}</Text>
                <Text style={styles.topMeta}>{p.category}</Text>
              </View>
              <Text style={styles.topScore}>{p.postTestPercentage}%</Text>
            </View>
          ))}
        </View>
        </View>

        {/* Removed search and filters for My Results */}

        {/* Results */}
        {!dataLoaded ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>📋 Loading data...</Text>
            <Text style={styles.emptySubtitle}>Please wait while we load the results</Text>
          </View>
        ) : filteredResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filter</Text>
          </View>
        ) : (
          // Side by Side (desktop) or Stacked (mobile) Tables - Clinical and Non-Clinical
          <View style={[
            styles.sideBySideContainer,
            isSmallScreen && { flexDirection: 'column' }
          ]}>
            {/* Clinical Participants Table */}
            <View style={[styles.tableContainer, isSmallScreen && { marginBottom: 16 }]}>
              <Text style={styles.tableTitle}>Clinical Participants</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, styles.rankColumn]}>Rank</Text>
                    <Text style={[styles.tableHeaderText, styles.nameColumn]}>Name</Text>
                    <Text style={[styles.tableHeaderText, styles.icColumn]}>IC</Text>
                    <Text style={[styles.tableHeaderText, styles.jobColumn]}>Job</Text>
                    <Text style={[styles.tableHeaderText, styles.categoryColumn]}>Category</Text>
                    {filterStatus === 'pre' ? (
                      <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Pre Test</Text>
                    ) : filterStatus === 'post' ? (
                      <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Post Test</Text>
                    ) : (
                      <>
                        <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Pre Test</Text>
                        <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Post Test</Text>
                      </>
                    )}
                    <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>One Man CPR</Text>
                    <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Two Man CPR</Text>
                    <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Infant CPR</Text>
                    <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Infant Choking</Text>
                    <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Adult Choking</Text>
                    <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Remedial</Text>
                    <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Certified</Text>
                  </View>
                  
                  {getClinicalResults().length === 0 ? (
                    <View style={styles.emptyTableRow}>
                      <Text style={styles.emptyTableText}>No clinical participants found</Text>
                    </View>
                  ) : (
                    getClinicalResults().map((result, index) => renderResultRow(result, index))
                  )}
                </View>
              </ScrollView>
            </View>

            {/* Non-Clinical Participants Table */}
            <View style={styles.tableContainer}>
              <Text style={styles.tableTitle}>Non-Clinical Participants</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, styles.rankColumn]}>Rank</Text>
                    <Text style={[styles.tableHeaderText, styles.nameColumn]}>Name</Text>
                    <Text style={[styles.tableHeaderText, styles.icColumn]}>IC</Text>
                    <Text style={[styles.tableHeaderText, styles.jobColumn]}>Job</Text>
                    <Text style={[styles.tableHeaderText, styles.categoryColumn]}>Category</Text>
                    {filterStatus === 'pre' ? (
                      <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Pre Test</Text>
                    ) : filterStatus === 'post' ? (
                      <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Post Test</Text>
                    ) : (
                      <>
                        <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Pre Test</Text>
                        <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Post Test</Text>
                      </>
                    )}
                    <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>One Man CPR</Text>
                    <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Two Man CPR</Text>
                    <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Infant CPR</Text>
                    <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Infant Choking</Text>
                    <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Adult Choking</Text>
                    <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Remedial</Text>
                    <Text style={[styles.tableHeaderText, styles.assessmentColumn]}>Certified</Text>
                  </View>
                  
                  {getNonClinicalResults().length === 0 ? (
                    <View style={styles.emptyTableRow}>
                      <Text style={styles.emptyTableText}>No non-clinical participants found</Text>
                    </View>
                  ) : (
                    getNonClinicalResults().map((result, index) => renderResultRow(result, index))
                  )}
                </View>
              </ScrollView>
            </View>
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
    marginBottom: 20,
  },
  skeletonContainer: {
    width: '100%',
  },
  skeletonRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  skeletonCell: {
    height: 20,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginHorizontal: 4,
    flex: 1,
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
  // Modern KPI styles
  modernKpiRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  kpiCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  kpiWideCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  kpiValueLarge: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  kpiSubValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0ea5e9',
  },
  kpiCaption: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '700',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#475569',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  quickButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  quickButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  topCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  topTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  topEmpty: {
    fontSize: 12,
    color: '#64748b',
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  topRank: {
    width: 20,
    textAlign: 'center',
    fontWeight: '800',
    color: '#334155',
  },
  topName: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  topMeta: {
    fontSize: 10,
    color: '#64748b',
  },
  topScore: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0ea5e9',
    minWidth: 36,
    textAlign: 'right',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flex: 1,
    marginRight: 10,
  },
  refreshButton: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  
  // Collapsible Filter Styles
  collapsibleFilterContainer: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterToggleButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  filterToggleIcon: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    width: 20,
    textAlign: 'center',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modernFilterButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    minWidth: 60,
    alignItems: 'center',
  },
  modernFilterButtonActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  modernFilterText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  modernFilterTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // Side by Side Container
  sideBySideContainer: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e40af',
    textAlign: 'center',
    paddingVertical: 16,
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    letterSpacing: 0.5,
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6c7ae0',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
    alignItems: 'center',
    minHeight: 50,
  },
  evenRow: {
    backgroundColor: '#f8f9fa',
  },
  oddRow: {
    backgroundColor: '#fff',
  },
  highlightRow: {
    borderWidth: 1,
    borderColor: '#0ea5e9',
    backgroundColor: '#eff6ff',
  },
  tableCellText: {
    fontSize: 11,
    color: '#2c3e50',
    textAlign: 'center',
    flexWrap: 'wrap',
    lineHeight: 14,
  },
  nameColumn: {
    width: 200,
    paddingHorizontal: 8,
    textAlign: 'left',
    minHeight: 40,
  },
  icColumn: {
    width: 120,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  jobColumn: {
    width: 180,
    paddingHorizontal: 8,
    textAlign: 'left',
    minHeight: 40,
  },
  categoryColumn: {
    width: 120,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  assessmentColumn: {
    width: 80,
    paddingHorizontal: 6,
    textAlign: 'center',
    minHeight: 40,
  },
  rankColumn: {
    width: 60,
    paddingHorizontal: 6,
    textAlign: 'center',
    minHeight: 40,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  table: {
    minWidth: 1100, // Ensure table has minimum width for all columns (200+120+180+120+80*9)
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
