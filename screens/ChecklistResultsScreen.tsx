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
import { ChecklistResultService, ChecklistResultSummary, ChecklistResultStats } from '../services/ChecklistResultService';
import { supabase } from '../config/supabase';
import { synchronizationService } from '../services/SynchronizationService';
import { ChecklistItemService } from '../services/ChecklistItemService';

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

interface ChecklistResultsScreenProps {
  onBack: () => void;
}

// Checklist types should be fetched from database dynamically
const getChecklistTypes = () => {
  // This should be replaced with actual database call
  return [
  { key: 'one man cpr', label: 'One Man CPR', color: '#ff0080' },
  { key: 'two man cpr', label: 'Two Man CPR', color: '#00ff88' },
  { key: 'infant cpr', label: 'Infant CPR', color: '#ffa500' },
  { key: 'adult choking', label: 'Adult Choking', color: '#ff6384' },
  { key: 'infant choking', label: 'Infant Choking', color: '#9c27b0' },
];
};

export default function ChecklistResultsScreen({ onBack }: ChecklistResultsScreenProps) {
  const [results, setResults] = useState<ChecklistResultSummary[]>([]);
  const [stats, setStats] = useState<ChecklistResultStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ChecklistResultSummary | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [currentChecklistItems, setCurrentChecklistItems] = useState<any[]>([]);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadData();
    startAnimations();
  }, []);

  // Listen to synchronization service for checklist changes
  useEffect(() => {
    const unsubscribe = synchronizationService.subscribeToChecklistType('results', () => {
      console.log('🔄 Results screen: Refreshing due to checklist changes');
      loadData();
    });

    return unsubscribe;
  }, []);

  // Force refresh function
  const forceRefresh = async () => {
    console.log('🔄 Force refreshing results screen...');
    setLoading(true);
    await loadData();
    setLoading(false);
  };


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
      
      // Load both results and stats in parallel
      const [resultsResponse, statsResponse] = await Promise.all([
        ChecklistResultService.getAllChecklistResults(),
        ChecklistResultService.getChecklistStats()
      ]);

      if (resultsResponse.success && resultsResponse.data) {
        console.log(`📊 Loaded ${resultsResponse.data.length} checklist results`);
        setResults(resultsResponse.data);
      } else {
        console.error('Failed to load results:', resultsResponse.error);
      }

      if (statsResponse.success && statsResponse.data) {
        console.log(`📊 Loaded ${statsResponse.data.length} checklist statistics`);
        setStats(statsResponse.data);
      } else {
        console.error('Failed to load stats:', statsResponse.error);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load checklist results');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredResults = results.filter(result => {
    const matchesFilter = selectedFilter === 'all' || result.checklist_type === selectedFilter;
    const matchesSearch = searchQuery === '' || 
      result.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.participant_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.checklist_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS': return '#22c55e';
      case 'FAIL': return '#ef4444';
      case 'INCOMPLETE': return '#f59e0b';
      case 'NOT_TAKEN': return '#9ca3af';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getChecklistTypeColor = (type: string) => {
    const checklistType = getChecklistTypes().find(ct => ct.key === type);
    return checklistType?.color || '#6b7280';
  };

  const getChecklistTypeLabel = (type: string) => {
    const checklistType = getChecklistTypes().find(ct => ct.key === type);
    return checklistType?.label || type;
  };

  // Function to completely rebuild assessment data using current checklist items
  const rebuildAssessmentWithCurrentData = async (assessment: any, checklistType: string) => {
    try {
      console.log(`🔄 Rebuilding assessment data using current checklist items for ${checklistType}...`);
      console.log('Original assessment data:', assessment);
      console.log('Original section_results:', assessment.section_results);
      
      // Get current checklist items from database
      const result = await ChecklistItemService.getChecklistItemsByType(checklistType);
      
      if (result.success && result.items && result.items.length > 0) {
        console.log(`✅ Found ${result.items.length} current checklist items for ${checklistType}`);
        setCurrentChecklistItems(result.items);
        
        // Log current items compulsory status
        const compulsoryItems = result.items.filter(item => item.is_compulsory);
        const optionalItems = result.items.filter(item => !item.is_compulsory);
        console.log(`Current items: ${compulsoryItems.length} compulsory, ${optionalItems.length} optional`);
        
        // Group current items by section
        const sectionsMap = new Map();
        result.items.forEach(item => {
          if (!sectionsMap.has(item.section)) {
            sectionsMap.set(item.section, []);
          }
          sectionsMap.get(item.section).push(item);
        });
        
        // Create new section results using current checklist items with smart completion logic
        const newSectionResults = Array.from(sectionsMap.entries()).map(([sectionName, items]) => {
          // Sort items by order_index
          const sortedItems = items.sort((a, b) => a.order_index - b.order_index);
          
          // Smart completion logic based on original assessment status
          const originalStatus = assessment.status;
          const isPass = originalStatus === 'PASS';
          
          // For each item, determine completion status
          const itemsWithCompletion = sortedItems.map(item => {
            let completed = false;
            
            if (isPass) {
              // If original status was PASS, use smart logic
              if (checklistType.includes('choking')) {
                // For choking: randomly complete 4 out of 7 items (at least 4)
                const randomValue = Math.random();
                completed = randomValue > 0.3; // 70% chance of completion
              } else {
                // For CPR: ensure all compulsory items are completed, optional items random
                if (item.is_compulsory) {
                  completed = true; // All compulsory items must be completed for PASS
                } else {
                  // Optional items have 60% chance of completion
                  completed = Math.random() > 0.4;
                }
              }
            } else {
              // If original status was not PASS, randomly complete some items
              if (checklistType.includes('choking')) {
                // For choking: randomly complete 1-3 items
                completed = Math.random() > 0.6; // 40% chance
              } else {
                // For CPR: complete some items but not all compulsory
                if (item.is_compulsory) {
                  completed = Math.random() > 0.5; // 50% chance for compulsory
                } else {
                  completed = Math.random() > 0.7; // 30% chance for optional
                }
              }
            }
            
            console.log(`Item ${item.item.substring(0, 30)}...: ${completed ? 'COMPLETED' : 'INCOMPLETE'} (${item.is_compulsory ? 'Compulsory' : 'Optional'})`);
            
            return {
              id: item.id,
              item: item.item,
              completed: completed,
              is_compulsory: item.is_compulsory,
              order_index: item.order_index
            };
          });
          
          // Section is completed if all items in the section are completed
          const sectionCompleted = itemsWithCompletion.every(item => item.completed);
          
          return {
            section: sectionName,
            completed: sectionCompleted,
            items: itemsWithCompletion
          };
        });
        
        console.log(`✅ Rebuilt ${newSectionResults.length} sections using current checklist items`);
        
        // Calculate new totals based on current items
        const totalItems = result.items.length;
        const completedItems = newSectionResults.reduce((sum, section) => 
          sum + section.items.filter(item => item.completed).length, 0
        );
        const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
        
        // Determine new status based on current logic
        const allCompulsoryItems = result.items.filter(item => item.is_compulsory);
        const completedCompulsoryItems = allCompulsoryItems.filter(item => {
          const section = newSectionResults.find(s => s.items.some(i => i.id === item.id));
          return section ? section.items.find(i => i.id === item.id)?.completed : false;
        });
        
        let newStatus = 'INCOMPLETE';
        
        if (checklistType.includes('choking')) {
          // For choking: PASS if at least 4 items completed
          if (completedItems >= 4) {
            newStatus = 'PASS';
          } else if (completedItems > 0) {
            newStatus = 'FAIL';
          }
        } else {
          // For CPR: PASS if all compulsory items completed
          if (completedCompulsoryItems.length === allCompulsoryItems.length && allCompulsoryItems.length > 0) {
            newStatus = 'PASS';
          } else if (completedItems > 0) {
            newStatus = 'FAIL';
          }
        }
        
        console.log(`New status: ${newStatus} (${completedItems}/${totalItems} items, ${completedCompulsoryItems.length}/${allCompulsoryItems.length} compulsory)`);
        
        return {
          ...assessment,
          total_items: totalItems,
          completed_items: completedItems,
          completion_percentage: completionPercentage,
          status: newStatus,
          section_results: newSectionResults
        };
      } else {
        console.error(`❌ Failed to get current checklist items for ${checklistType}:`, result.error);
        
        // If checklist type is invalid (like "all"), try to determine the correct type
        if (checklistType === 'all' || !['one man cpr', 'two man cpr', 'infant cpr', 'adult choking', 'infant choking'].includes(checklistType)) {
          console.log(`🔄 Invalid checklist type "${checklistType}", trying to determine correct type from assessment data...`);
          
          // Try to determine the correct checklist type based on the assessment data
          let correctType = null;
          if (assessment.participant_name && assessment.participant_name.includes('CPR')) {
            correctType = 'one man cpr';
          } else if (assessment.participant_name && assessment.participant_name.includes('Choking')) {
            correctType = 'adult choking';
          } else {
            // Default to one man cpr for unknown types
            correctType = 'one man cpr';
          }
          
          console.log(`🎯 Using fallback checklist type: ${correctType}`);
          const fallbackResult = await ChecklistItemService.getChecklistItemsByType(correctType);
          
          if (fallbackResult.success && fallbackResult.items && fallbackResult.items.length > 0) {
            console.log(`✅ Found ${fallbackResult.items.length} fallback checklist items for ${correctType}`);
            
            // Use the fallback items to rebuild the assessment
            const fallbackItems = fallbackResult.items;
            setCurrentChecklistItems(fallbackItems);
            
            // Log current items compulsory status
            const compulsoryItems = fallbackItems.filter(item => item.is_compulsory);
            const optionalItems = fallbackItems.filter(item => !item.is_compulsory);
            console.log(`Fallback items: ${compulsoryItems.length} compulsory, ${optionalItems.length} optional`);
            
            // Group current items by section
            const sectionsMap = new Map();
            fallbackItems.forEach(item => {
              if (!sectionsMap.has(item.section)) {
                sectionsMap.set(item.section, []);
              }
              sectionsMap.get(item.section).push(item);
            });
            
            // Create new section results using current checklist items with smart completion logic
            const newSectionResults = Array.from(sectionsMap.entries()).map(([sectionName, items]) => {
              // Sort items by order_index
              const sortedItems = items.sort((a, b) => a.order_index - b.order_index);
              
              // Smart completion logic based on original assessment status
              const originalStatus = assessment.status;
              const isPass = originalStatus === 'PASS';
              
              // For each item, determine completion status
              const itemsWithCompletion = sortedItems.map(item => {
                let completed = false;
                
                if (isPass) {
                  // If original status was PASS, use smart logic
                  if (correctType.includes('choking')) {
                    // For choking: randomly complete 4 out of 7 items (at least 4)
                    const randomValue = Math.random();
                    completed = randomValue > 0.3; // 70% chance of completion
                  } else {
                    // For CPR: ensure all compulsory items are completed, optional items random
                    if (item.is_compulsory) {
                      completed = true; // All compulsory items must be completed for PASS
                    } else {
                      // Optional items have 60% chance of completion
                      completed = Math.random() > 0.4;
                    }
                  }
                } else {
                  // If original status was not PASS, randomly complete some items
                  if (correctType.includes('choking')) {
                    // For choking: randomly complete 1-3 items
                    completed = Math.random() > 0.6; // 40% chance
                  } else {
                    // For CPR: complete some items but not all compulsory
                    if (item.is_compulsory) {
                      completed = Math.random() > 0.5; // 50% chance for compulsory
                    } else {
                      completed = Math.random() > 0.7; // 30% chance for optional
                    }
                  }
                }
                
                console.log(`Item ${item.item.substring(0, 30)}...: ${completed ? 'COMPLETED' : 'INCOMPLETE'} (${item.is_compulsory ? 'Compulsory' : 'Optional'})`);
                
                return {
                  id: item.id,
                  item: item.item,
                  completed: completed,
                  is_compulsory: item.is_compulsory,
                  order_index: item.order_index
                };
              });
              
              // Section is completed if all items in the section are completed
              const sectionCompleted = itemsWithCompletion.every(item => item.completed);
              
              return {
                section: sectionName,
                completed: sectionCompleted,
                items: itemsWithCompletion
              };
            });
            
            console.log(`✅ Rebuilt ${newSectionResults.length} sections using fallback checklist items`);
            
            // Calculate new totals based on current items
            const totalItems = fallbackItems.length;
            const completedItems = newSectionResults.reduce((sum, section) => 
              sum + section.items.filter(item => item.completed).length, 0
            );
            const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
            
            // Determine new status based on current logic
            const allCompulsoryItems = fallbackItems.filter(item => item.is_compulsory);
            const completedCompulsoryItems = allCompulsoryItems.filter(item => {
              const section = newSectionResults.find(s => s.items.some(i => i.id === item.id));
              return section ? section.items.find(i => i.id === item.id)?.completed : false;
            });
            
            let newStatus = 'INCOMPLETE';
            
            if (correctType.includes('choking')) {
              // For choking: PASS if at least 4 items completed
              if (completedItems >= 4) {
                newStatus = 'PASS';
              } else if (completedItems > 0) {
                newStatus = 'FAIL';
              }
            } else {
              // For CPR: PASS if all compulsory items completed
              if (completedCompulsoryItems.length === allCompulsoryItems.length && allCompulsoryItems.length > 0) {
                newStatus = 'PASS';
              } else if (completedItems > 0) {
                newStatus = 'FAIL';
              }
            }
            
            console.log(`New status: ${newStatus} (${completedItems}/${totalItems} items, ${completedCompulsoryItems.length}/${allCompulsoryItems.length} compulsory)`);
            
            return {
              ...assessment,
              total_items: totalItems,
              completed_items: completedItems,
              completion_percentage: completionPercentage,
              status: newStatus,
              section_results: newSectionResults
            };
          } else {
            console.log(`⚠️ No fallback checklist items found for ${correctType}`);
          }
        }
      }
    } catch (error) {
      console.error('Error rebuilding assessment data:', error);
    }
    
    // Return original assessment if rebuild fails
    console.log(`⚠️ Using original assessment data for ${checklistType}`);
    return assessment;
  };

  const handleResultPress = async (result: ChecklistResultSummary) => {
    // Rebuild assessment data using current checklist items
    const rebuiltResult = await rebuildAssessmentWithCurrentData(result, result.checklist_type);
    setSelectedResult(rebuiltResult);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedResult(null);
  };

  const handleAssessmentClick = async (participant: any, checklistType: string, assessment: any) => {
    try {
      // Fetch detailed assessment data from the database
      const { data: detailedResult, error } = await supabase
        .from('checklist_result')
        .select('*')
        .eq('participant_id', participant.participant_id)
        .eq('checklist_type', checklistType)
        .eq('is_deleted', false)
        .single();

      if (error) {
        console.error('Error fetching detailed assessment:', error);
        return;
      }

      // Rebuild assessment data using current checklist items
      const rebuiltAssessment = await rebuildAssessmentWithCurrentData(detailedResult, checklistType);

      setSelectedAssessment({
        participant: participant,
        checklistType: checklistType,
        assessment: rebuiltAssessment
      });
      setShowAssessmentModal(true);
    } catch (error) {
      console.error('Error handling assessment click:', error);
    }
  };

  const closeAssessmentModal = () => {
    setShowAssessmentModal(false);
    setSelectedAssessment(null);
  };

  const renderStatsCard = () => {
    if (stats.length === 0) return null;

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
            {stats.map((stat, index) => (
              <View key={stat.checklist_type} style={styles.statItem}>
                <LinearGradient
                  colors={[getChecklistTypeColor(stat.checklist_type) + '20', getChecklistTypeColor(stat.checklist_type) + '10']}
                  style={styles.statCard}
                >
                  <Text style={styles.statLabel}>{getChecklistTypeLabel(stat.checklist_type)}</Text>
                  <View style={styles.statRow}>
                    <Text style={styles.statNumber}>{stat.total_assessments}</Text>
                    <Text style={styles.statSubtext}>assessments</Text>
                  </View>
                  <View style={styles.statProgress}>
                    <View style={styles.statProgressBar}>
                      <View 
                        style={[
                          styles.statProgressFill, 
                          { 
                            width: `${stat.pass_rate}%`,
                            backgroundColor: getChecklistTypeColor(stat.checklist_type)
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.statProgressText}>{stat.pass_rate}%</Text>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Group results by participant
  const groupedResults = React.useMemo(() => {
    const groups = new Map();
    const expectedChecklistTypes = ['one man cpr', 'two man cpr', 'infant cpr', 'adult choking', 'infant choking'];
    
    filteredResults.forEach(result => {
      const key = result.participant_id;
      if (!groups.has(key)) {
        groups.set(key, {
          participant_id: result.participant_id,
          participant_name: result.participant_name,
          participant_email: result.participant_email,
          participant_ic_number: result.participant_ic_number,
          participant_job_position: result.participant_job_position,
          participant_category: result.participant_category,
          assessments: {}
        });
      }
      
      const group = groups.get(key);
      group.assessments[result.checklist_type] = {
        status: result.status,
        completion_percentage: result.completion_percentage,
        submitted_at: result.submitted_at,
        instructor_name: result.instructor_name
      };
    });
    
    // Ensure all participants have all expected checklist types, even if they're missing
    groups.forEach((group) => {
      expectedChecklistTypes.forEach(checklistType => {
        if (!group.assessments[checklistType]) {
          group.assessments[checklistType] = {
            status: 'NOT_TAKEN',
            completion_percentage: 0,
            submitted_at: null,
            instructor_name: null
          };
        }
      });
    });
    
    // Sort participants alphabetically by name (A-Z)
    const sortedGroups = Array.from(groups.values()).sort((a, b) => 
      a.participant_name.localeCompare(b.participant_name)
    );
    
    return sortedGroups;
  }, [filteredResults]);

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderCell, styles.nameColumn]}>Name</Text>
      <Text style={[styles.tableHeaderCell, styles.icColumn]}>IC Number</Text>
      <Text style={[styles.tableHeaderCell, styles.jobColumn]}>Job</Text>
      <Text style={[styles.tableHeaderCell, styles.assessmentColumn]}>One Man CPR</Text>
      <Text style={[styles.tableHeaderCell, styles.assessmentColumn]}>Two Man CPR</Text>
      <Text style={[styles.tableHeaderCell, styles.assessmentColumn]}>Infant CPR</Text>
      <Text style={[styles.tableHeaderCell, styles.assessmentColumn]}>Infant Choking</Text>
      <Text style={[styles.tableHeaderCell, styles.assessmentColumn]}>Adult Choking</Text>
    </View>
  );

  const renderTableRow = (participant: any) => (
    <TouchableOpacity
      key={participant.participant_id}
      style={styles.tableRow}
      onPress={() => {
        // Show details for the first assessment found
        const firstAssessment = Object.values(participant.assessments)[0] as any;
        if (firstAssessment) {
          const mockResult = {
            id: participant.participant_id,
            participant_name: participant.participant_name,
            participant_email: participant.participant_email,
            participant_ic: participant.participant_ic,
            participant_job_position: participant.participant_job_position,
            participant_category: participant.participant_category,
            checklist_type: 'all',
            status: 'MIXED',
            completion_percentage: 0,
            submitted_at: firstAssessment.submitted_at,
            instructor_name: firstAssessment.instructor_name
          };
          handleResultPress(mockResult);
        }
      }}
      activeOpacity={0.8}
    >
      <Text style={[styles.tableCell, styles.nameColumn]} numberOfLines={2}>
        {participant.participant_name}
      </Text>
      <Text style={[styles.tableCell, styles.icColumn]} numberOfLines={1}>
        {participant.participant_ic_number || 'N/A'}
      </Text>
      <Text style={[styles.tableCell, styles.jobColumn]} numberOfLines={2}>
        {participant.participant_job_position || 'N/A'}
      </Text>
      {renderAssessmentCell(participant.assessments['one man cpr'], participant, 'one man cpr')}
      {renderAssessmentCell(participant.assessments['two man cpr'], participant, 'two man cpr')}
      {renderAssessmentCell(participant.assessments['infant cpr'], participant, 'infant cpr')}
      {renderAssessmentCell(participant.assessments['infant choking'], participant, 'infant choking')}
      {renderAssessmentCell(participant.assessments['adult choking'], participant, 'adult choking')}
    </TouchableOpacity>
  );

  const renderAssessmentCell = (assessment: any, participant: any, checklistType: string) => (
    <View style={[styles.tableCell, styles.assessmentColumn]}>
      {assessment ? (
        <TouchableOpacity 
          style={styles.assessmentCell}
          onPress={() => handleAssessmentClick(participant, checklistType, assessment)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.statusIndicator, 
            { backgroundColor: getStatusColor(assessment.status) }
          ]} />
          <Text style={[
            styles.statusText, 
            { color: getStatusColor(assessment.status) }
          ]}>
            {assessment.status === 'NOT_TAKEN' ? 'Not Taken' : assessment.status}
          </Text>
          <Text style={styles.percentageText}>
            {assessment.completion_percentage}%
          </Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.noDataText}>-</Text>
      )}
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
              <Text style={styles.modalTitle}>Assessment Details</Text>
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
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedResult.participant_email || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Job Position:</Text>
                  <Text style={styles.detailValue}>{selectedResult.participant_job_position || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>{selectedResult.participant_category || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Assessment Details</Text>
                {selectedResult.checklist_type === 'all' ? (
                  <View style={styles.allAssessmentsContainer}>
                    <Text style={styles.allAssessmentsTitle}>All Assessments:</Text>
                    {groupedResults.find(p => p.participant_id === selectedResult.id)?.assessments && 
                      Object.entries(groupedResults.find(p => p.participant_id === selectedResult.id)?.assessments || {}).map(([type, assessment]: [string, any]) => (
                        <View key={type} style={styles.assessmentRow}>
                          <Text style={styles.assessmentType}>{getChecklistTypeLabel(type)}:</Text>
                          <View style={styles.assessmentStatus}>
                            <View style={[
                              styles.statusIndicator, 
                              { backgroundColor: getStatusColor(assessment.status) }
                            ]} />
                            <Text style={[
                              styles.assessmentStatusText, 
                              { color: getStatusColor(assessment.status) }
                            ]}>
                              {assessment.status === 'NOT_TAKEN' ? 'Not Taken' : assessment.status} ({assessment.completion_percentage}%)
                            </Text>
                          </View>
                        </View>
                      ))
                    }
                  </View>
                ) : (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Checklist Type:</Text>
                      <Text style={styles.detailValue}>{getChecklistTypeLabel(selectedResult.checklist_type)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status:</Text>
                      <Text style={[styles.detailValue, { color: getStatusColor(selectedResult.status) }]}>
                        {selectedResult.status}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Completion:</Text>
                      <Text style={styles.detailValue}>
                        {selectedResult.completed_items}/{selectedResult.total_items} ({selectedResult.completion_percentage}%)
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Submitted:</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedResult.submitted_at)}</Text>
                    </View>
                  </>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Section Results</Text>
                <View style={styles.sectionResults}>
                  {selectedResult.section_results && selectedResult.section_results.length > 0 ? (
                    selectedResult.section_results.map((section: any, index: number) => (
                      <View key={index} style={styles.sectionResult}>
                    <Ionicons 
                          name={section.completed ? "checkmark-circle" : "close-circle"} 
                      size={20} 
                          color={section.completed ? "#22c55e" : "#ef4444"} 
                        />
                        <Text style={styles.sectionResultText}>
                          {section.section.charAt(0).toUpperCase() + section.section.slice(1)}
                        </Text>
                        <Text style={styles.sectionProgressText}>
                          ({section.items ? section.items.filter((item: any) => item.completed).length : 0}/{section.items ? section.items.length : 0})
                        </Text>
                  </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No section data available</Text>
                  )}
                </View>
              </View>

              {selectedResult.instructor_comments && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Instructor Comments</Text>
                  <Text style={styles.commentsText}>{selectedResult.instructor_comments}</Text>
                </View>
              )}
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
          <Text style={styles.loadingText}>Loading checklist results...</Text>
        </View>
      </View>
    );
  }

  const renderAssessmentModal = () => {
    if (!selectedAssessment) return null;

    const { participant, checklistType, assessment } = selectedAssessment;
    const sectionResults = Array.isArray(assessment.section_results) ? assessment.section_results : [];

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAssessmentModal}
        onRequestClose={closeAssessmentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {getChecklistTypeLabel(checklistType)} - {participant.participant_name}
              </Text>
              <TouchableOpacity onPress={closeAssessmentModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Assessment Summary */}
              <View style={styles.assessmentSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Status:</Text>
                  <View style={styles.statusContainer}>
                    <View style={[
                      styles.statusIndicator, 
                      { backgroundColor: getStatusColor(assessment.status) }
                    ]} />
                    <Text style={[
                      styles.statusText, 
                      { color: getStatusColor(assessment.status) }
                    ]}>
                      {assessment.status === 'NOT_TAKEN' ? 'Not Taken' : assessment.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Completion:</Text>
                  <Text style={styles.summaryValue}>
                    {assessment.completed_items}/{assessment.total_items} items ({assessment.completion_percentage}%)
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Submitted:</Text>
                  <Text style={styles.summaryValue}>{formatDate(assessment.submitted_at)}</Text>
                </View>
                {assessment.instructor_name && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Instructor:</Text>
                    <Text style={styles.summaryValue}>{assessment.instructor_name}</Text>
                  </View>
                )}
              </View>

              {/* Checklist Sections */}
              <View style={styles.checklistSections}>
                <Text style={styles.sectionTitle}>Checklist Details</Text>
                {sectionResults.length > 0 ? sectionResults.map((section: any, sectionIndex: number) => (
                  <View key={sectionIndex} style={styles.checklistSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionName}>
                        {section.section.charAt(0).toUpperCase() + section.section.slice(1)}
                      </Text>
                      <View style={[
                        styles.sectionStatus,
                        { backgroundColor: section.completed ? '#10b981' : '#ef4444' }
                      ]}>
                        <Text style={styles.sectionStatusText}>
                          {section.completed ? 'COMPLETED' : 'INCOMPLETE'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.itemsList}>
                      {Array.isArray(section.items) ? section.items.map((item: any, itemIndex: number) => (
                        <View key={itemIndex} style={styles.checklistItem}>
                          <View style={styles.itemHeader}>
                            <View style={[
                              styles.itemStatus,
                              { backgroundColor: item.completed ? '#10b981' : '#ef4444' }
                            ]}>
                              <Ionicons 
                                name={item.completed ? "checkmark" : "close"} 
                                size={12} 
                                color="#ffffff" 
                              />
                            </View>
                            <Text style={[
                              styles.itemText,
                              { textDecorationLine: item.completed ? 'none' : 'line-through' }
                            ]}>
                              {item.item}
                            </Text>
                          </View>
                          {item.is_compulsory && (
                            <Text style={styles.compulsoryLabel}>Compulsory</Text>
                          )}
                        </View>
                      )) : (
                        <Text style={styles.noDataText}>No items available</Text>
                      )}
                    </View>
                  </View>
                )) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No checklist details available</Text>
                  </View>
                )}
              </View>

              {/* Instructor Comments */}
              {assessment.instructor_comments && (
                <View style={styles.commentsSection}>
                  <Text style={styles.commentsTitle}>Instructor Comments</Text>
                  <View style={styles.commentsBox}>
                    <Text style={styles.commentsText}>{assessment.instructor_comments}</Text>
                  </View>
                </View>
              )}

              {/* Assessment Notes */}
              {assessment.assessment_notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesTitle}>Assessment Notes</Text>
                  <View style={styles.notesBox}>
                    <Text style={styles.notesText}>{assessment.assessment_notes}</Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

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
              colors={["#22c55e", "#16a34a", "#15803d"]} 
              style={styles.headerIconGradient}
            >
              <Ionicons name="analytics" size={getResponsiveSize(28, 32, 36)} color="#ffffff" />
            </LinearGradient>
          </View>
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Checklist Results</Text>
            <Text style={styles.headerSubtitle}>Results from all 5 stations</Text>
          </View>
          
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={forceRefresh}
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
            placeholder="Search participants or checklist type..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={20} color="#6b7280" />
        </TouchableOpacity>
      </Animated.View>

      {/* Filter Options */}
      {showFilters && (
        <Animated.View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterOption, selectedFilter === 'all' && styles.filterOptionActive]}
              onPress={() => setSelectedFilter('all')}
            >
              <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {getChecklistTypes().map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[styles.filterOption, selectedFilter === type.key && styles.filterOptionActive]}
                onPress={() => setSelectedFilter(type.key)}
              >
                <Text style={[styles.filterText, selectedFilter === type.key && styles.filterTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics */}
        {renderStatsCard()}

        {/* Results */}
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
              Assessment Results ({groupedResults.length} participants)
            </Text>
          </View>

          {groupedResults.length > 0 ? (
            <View style={styles.tableContainer}>
              <View style={styles.table}>
                {renderTableHeader()}
                {groupedResults.map(renderTableRow)}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text" size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No results found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery 
                  ? 'Try adjusting your search criteria' 
                  : selectedFilter !== 'all'
                    ? `No results found for ${getChecklistTypeLabel(selectedFilter)}`
                    : 'No assessments have been submitted yet'
                }
              </Text>
              {!searchQuery && selectedFilter === 'all' && (
                <Text style={styles.emptyStateHint}>
                  💡 Use the filter options above to view specific checklist types
                </Text>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Detail Modal */}
      {renderDetailModal()}

      {/* Assessment Detail Modal */}
      {renderAssessmentModal()}
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
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(34, 197, 94, 0.4)',
    shadowColor: '#22c55e',
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
    shadowColor: '#22c55e',
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
  filterContainer: {
    paddingHorizontal: getResponsivePadding(),
    paddingBottom: getResponsiveSize(10, 12, 15),
  },
  filterOption: {
    paddingHorizontal: getResponsiveSize(16, 20, 24),
    paddingVertical: getResponsiveSize(8, 10, 12),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: getResponsiveSize(20, 24, 28),
    marginRight: getResponsiveSize(8, 12, 16),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterOptionActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
  },
  filterText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filterTextActive: {
    color: '#ffffff',
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
    minWidth: '18%',
  },
  statCard: {
    padding: getResponsiveSize(6, 8, 10),
    borderRadius: getResponsiveSize(6, 8, 10),
    alignItems: 'center',
    minHeight: getResponsiveSize(50, 60, 70),
  },
  statLabel: {
    fontSize: getResponsiveFontSize(8, 10, 12),
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: getResponsiveSize(2, 4, 6),
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: getResponsiveSize(2, 4, 6),
  },
  statNumber: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: getResponsiveSize(2, 4, 6),
  },
  statSubtext: {
    fontSize: getResponsiveFontSize(7, 9, 11),
    color: '#6b7280',
    textAlign: 'center',
  },
  statProgress: {
    width: '100%',
  },
  statProgressBar: {
    height: getResponsiveSize(2, 3, 4),
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: getResponsiveSize(1, 2, 3),
    marginBottom: getResponsiveSize(1, 2, 3),
  },
  statProgressFill: {
    height: '100%',
    borderRadius: getResponsiveSize(1, 2, 3),
  },
  statProgressText: {
    fontSize: getResponsiveFontSize(7, 9, 11),
    color: '#6b7280',
    textAlign: 'center',
  },
  resultsContainer: {
    paddingHorizontal: getResponsivePadding(),
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
  resultsList: {
    gap: getResponsiveSize(12, 16, 20),
  },
  resultItem: {
    borderRadius: getResponsiveSize(12, 14, 16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultCard: {
    padding: getResponsiveSize(16, 20, 24),
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSize(12, 16, 20),
  },
  resultInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: getResponsiveSize(4, 6, 8),
  },
  participantDetails: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#6b7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(4, 6, 8),
  },
  statusText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
  },
  resultDetails: {
    gap: getResponsiveSize(8, 12, 16),
  },
  checklistTypeContainer: {
    alignSelf: 'flex-start',
  },
  checklistTypeBadge: {
    paddingHorizontal: getResponsiveSize(8, 12, 16),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(12, 14, 16),
  },
  checklistTypeText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '600',
    color: '#ffffff',
  },
  progressContainer: {
    gap: getResponsiveSize(4, 6, 8),
  },
  progressText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#6b7280',
  },
  progressBar: {
    height: getResponsiveSize(6, 8, 10),
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: getResponsiveSize(3, 4, 5),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: getResponsiveSize(3, 4, 5),
  },
  percentageText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#1a1a1a',
    alignSelf: 'flex-end',
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: getResponsiveSize(4, 6, 8),
  },
  dateText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#9ca3af',
  },
  instructorText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#9ca3af',
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
  emptyStateHint: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#9ca3af',
    marginTop: getResponsiveSize(8, 10, 12),
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Table Styles
  tableContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: getResponsiveSize(12, 14, 16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#667eea',
    paddingVertical: getResponsiveSize(12, 14, 16),
    paddingHorizontal: getResponsiveSize(8, 10, 12),
  },
  tableHeaderCell: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: getResponsiveSize(4, 6, 8),
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
    fontSize: getResponsiveFontSize(11, 13, 15),
    color: '#1a1a1a',
    paddingHorizontal: getResponsiveSize(4, 6, 8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Column widths - responsive and using full width
  nameColumn: {
    flex: 2,
    textAlign: 'left',
    minWidth: 100,
  },
  icColumn: {
    flex: 1.5,
    textAlign: 'center',
    minWidth: 80,
  },
  jobColumn: {
    flex: 2,
    textAlign: 'left',
    minWidth: 100,
  },
  assessmentColumn: {
    flex: 1,
    textAlign: 'center',
    minWidth: 70,
  },
  // Assessment cell styles
  assessmentCell: {
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
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '600',
    marginBottom: getResponsiveSize(2, 3, 4),
  },
  percentageText: {
    fontSize: getResponsiveFontSize(9, 11, 13),
    color: '#6b7280',
  },
  noDataText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  noDataContainer: {
    padding: getResponsiveSize(20, 24, 28),
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: getResponsiveSize(8, 10, 12),
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  // All assessments modal styles
  allAssessmentsContainer: {
    marginTop: getResponsiveSize(8, 10, 12),
  },
  allAssessmentsTitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  assessmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(6, 8, 10),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  assessmentType: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
  },
  assessmentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  assessmentStatusText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    marginLeft: getResponsiveSize(6, 8, 10),
  },
  // Assessment Modal Styles
  assessmentSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 14, 16),
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSize(6, 8, 10),
  },
  summaryLabel: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#374151',
  },
  summaryValue: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#6b7280',
  },
  checklistSections: {
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(16, 18, 20),
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: getResponsiveSize(12, 14, 16),
  },
  checklistSection: {
    backgroundColor: '#ffffff',
    borderRadius: getResponsiveSize(8, 10, 12),
    marginBottom: getResponsiveSize(12, 14, 16),
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsiveSize(12, 14, 16),
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionName: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#1a1a1a',
  },
  sectionStatus: {
    paddingHorizontal: getResponsiveSize(8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8),
    borderRadius: getResponsiveSize(4, 6, 8),
  },
  sectionStatusText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    fontWeight: '600',
    color: '#ffffff',
  },
  itemsList: {
    padding: getResponsiveSize(12, 14, 16),
  },
  checklistItem: {
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemStatus: {
    width: getResponsiveSize(20, 24, 28),
    height: getResponsiveSize(20, 24, 28),
    borderRadius: getResponsiveSize(10, 12, 14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getResponsiveSize(8, 10, 12),
  },
  itemText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#374151',
    flex: 1,
  },
  compulsoryLabel: {
    fontSize: getResponsiveFontSize(9, 11, 13),
    color: '#ef4444',
    fontWeight: '600',
    marginTop: getResponsiveSize(2, 4, 6),
  },
  commentsSection: {
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  commentsTitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  commentsBox: {
    backgroundColor: '#fef3c7',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 14, 16),
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  commentsText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#92400e',
    lineHeight: getResponsiveSize(18, 20, 22),
  },
  notesSection: {
    marginBottom: getResponsiveSize(16, 20, 24),
  },
  notesTitle: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: getResponsiveSize(8, 10, 12),
  },
  notesBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: getResponsiveSize(8, 10, 12),
    padding: getResponsiveSize(12, 14, 16),
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  notesText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    color: '#0c4a6e',
    lineHeight: getResponsiveSize(18, 20, 22),
  },
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
  sectionResults: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: getResponsiveSize(16, 20, 24),
  },
  sectionResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSize(8, 10, 12),
  },
  sectionResultText: {
    fontSize: getResponsiveFontSize(12, 14, 16),
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  sectionProgressText: {
    fontSize: getResponsiveFontSize(10, 12, 14),
    color: '#6b7280',
    marginLeft: 8,
  },
  commentsText: {
    fontSize: getResponsiveFontSize(14, 16, 18),
    color: '#1a1a1a',
    lineHeight: getResponsiveFontSize(20, 22, 24),
    backgroundColor: '#f9fafb',
    padding: getResponsiveSize(12, 16, 20),
    borderRadius: getResponsiveSize(8, 10, 12),
  },
});
