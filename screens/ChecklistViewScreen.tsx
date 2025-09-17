import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
  Animated,
  Platform,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { ChecklistItemService, ChecklistItemData } from '../services/ChecklistItemService';
import { ProfileService, Profile } from '../services/ProfileService';
import { ChecklistResultService, ChecklistResult } from '../services/ChecklistResultService';
import { useChecklistState } from '../services/ChecklistStateManager';
import { synchronizationService } from '../services/SynchronizationService';

const { width } = Dimensions.get('window');

// Cross-platform BlurView component - simplified for web compatibility
const ConditionalBlurView = ({ children, intensity, style }: { children: React.ReactNode, intensity: number, style: any }) => {
  // Always use fallback for maximum compatibility
  return (
    <View style={[style, { 
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
    }]}>
      {children}
    </View>
  );
};

interface ChecklistViewScreenProps {
  onBack: () => void;
  checklistType: string;
  onRefresh?: () => void; // Add refresh callback
}

interface ChecklistSection {
  section: string;
  items: (ChecklistItemData & { completed: boolean })[];
}

export default function ChecklistViewScreen({ onBack, checklistType, onRefresh }: ChecklistViewScreenProps) {
  console.log(`🔍 ChecklistViewScreen: Rendering with checklistType: ${checklistType}`);
  
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showParticipantSelector, setShowParticipantSelector] = useState(false);
  const [comment, setComment] = useState('');
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Use global state for checklist data
  const { data: checklistItems, refresh: refreshChecklistData, isLoading: isDataLoading } = useChecklistState(checklistType);
  
  console.log(`🔍 ChecklistViewScreen: Global state data for ${checklistType}:`, {
    itemsCount: checklistItems?.length || 0,
    isLoading: isDataLoading,
    firstItem: checklistItems?.[0] ? {
      type: checklistItems[0].checklist_type,
      section: checklistItems[0].section,
      item: checklistItems[0].item.substring(0, 30) + '...'
    } : null
  });

  // Process global state data into sections
  const sections = React.useMemo(() => {
    console.log('🔍 Processing sections from checklistItems:', checklistItems?.length || 0, 'items');
    console.log('🔍 Checklist type:', checklistType);
    console.log('🔍 First few items:', checklistItems?.slice(0, 3).map(item => ({ 
      type: item.checklist_type, 
      section: item.section, 
      item: item.item.substring(0, 30) + '...' 
    })));
    
    if (!checklistItems || checklistItems.length === 0) return [];
    
        // Group items by section
    const groupedItems = checklistItems.reduce((acc, item) => {
          if (!acc[item.section]) {
            acc[item.section] = [];
          }
          acc[item.section].push({ 
            ...item, 
            completed: completedItems.has(item.id || '') 
          });
          return acc;
        }, {} as Record<string, (ChecklistItemData & { completed: boolean })[]>);

        // Convert to sections array
    const result = Object.entries(groupedItems).map(([section, items]) => ({
          section,
          items: items.sort((a, b) => a.order_index - b.order_index),
        }));

    console.log('🔍 Processed sections:', result.length, 'sections');
    result.forEach(section => {
      console.log(`  - ${section.section}: ${section.items.length} items`);
    });
    
    return result;
  }, [checklistItems, checklistType, completedItems]);
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  const loadChecklist = useCallback(async () => {
    try {
      setError(null);
      console.log('🔄 Loading checklist for type:', checklistType);
      
      // Use global state refresh
      const result = await refreshChecklistData(() => ChecklistItemService.getChecklistItemsByType(checklistType));
      
      console.log('🔄 Service result:', {
        success: result.success,
        itemsCount: result.items?.length || 0,
        error: result.error
      });
      
      if (result.success && result.items && result.items.length > 0) {
        console.log('✅ Checklist loaded successfully:', result.items.length, 'items');
        console.log('✅ First few items:', result.items.slice(0, 3).map(item => ({
          type: item.checklist_type,
          section: item.section,
          item: item.item.substring(0, 30) + '...'
        })));
        
        // Animate in after loading
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
          })
        ]).start(() => {
          console.log('Animations completed');
        });
      } else {
        console.log('❌ No checklist data found for:', checklistType);
        setError(`No checklist data found for ${checklistType}`);
      }
    } catch (error) {
      console.error('❌ Error loading checklist:', error);
      setError(`Failed to load checklist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [checklistType, refreshChecklistData, fadeAnim, slideAnim]);

  useEffect(() => {
    loadChecklist();
    loadParticipants();
  }, [checklistType]); // Only depend on checklistType, not loadChecklist

  const loadParticipants = async () => {
    try {
      console.log('Loading participants...');
      const profiles = await ProfileService.getAllProfiles();
      console.log('Loaded profiles:', profiles.length);
      
      // Filter only participants
      const participantProfiles = profiles.filter(profile => 
        profile.user_type === 'participant' && profile.status === 'approved'
      );
      
      console.log('Filtered participants:', participantProfiles.length);
      setParticipants(participantProfiles);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    await loadChecklist();
  };

  const filteredParticipants = participants.filter(participant =>
    participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    participant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (participant.job_position_name && participant.job_position_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = async () => {
    if (!selectedParticipant) {
      alert('Please select a participant first');
      return;
    }

    // Show confirmation alert
    const confirmMessage = `Are you sure you want to submit this assessment for ${selectedParticipant.name}?\n\nScore: ${Math.round(overallProgress.percentage)}%\nStatus: ${overallProgress.status}\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return; // User cancelled
    }

    try {
      // Prepare section results
      const sectionResults = sections.map(section => ({
        section: section.section,
        completed: section.items.every(item => item.completed),
        items: section.items.map(item => ({
          id: item.id,
          item: item.item,
          completed: item.completed,
          is_compulsory: item.is_compulsory
        }))
      }));

      // Validate PASS status - ensure all compulsory items are completed
      if (overallProgress.status === 'PASS') {
        const validation = ChecklistResultService.validatePassStatus(sectionResults);
        if (!validation.isValid) {
          alert(`❌ Invalid PASS Status!\n\nCannot submit as PASS. The following compulsory items are not completed:\n\n${validation.missingCompulsory.join('\n')}\n\nPlease complete all compulsory items or change the status to FAIL.`);
          return;
        }
      }

      // Prepare assessment data for database
      const assessmentData = {
        participant_id: selectedParticipant.id,
        participant_name: selectedParticipant.name,
        participant_email: selectedParticipant.email,
        participant_ic_number: selectedParticipant.ic_number || undefined,
        participant_phone_number: selectedParticipant.phone_number || undefined,
        participant_job_position: selectedParticipant.job_position_name || undefined,
        participant_category: selectedParticipant.category || undefined,
        participant_workplace: selectedParticipant.tempat_bertugas || undefined,
        participant_pregnancy_status: selectedParticipant.is_pregnant,
        participant_pregnancy_weeks: selectedParticipant.pregnancy_weeks || undefined,
        participant_allergies: selectedParticipant.has_allergies,
        participant_allergies_description: selectedParticipant.allergies_description || undefined,
        participant_asthma_status: selectedParticipant.has_asthma,
        checklist_type: checklistType,
        checklist_version: '1.0',
        total_items: overallProgress.total,
        completed_items: overallProgress.completed,
        completion_percentage: overallProgress.percentage,
        status: overallProgress.status as 'INCOMPLETE' | 'FAIL' | 'PASS',
        can_pass: overallProgress.canPass,
        all_compulsory_completed: overallProgress.canPass,
        section_results: sectionResults,
        instructor_comments: comment,
        submitted_at: new Date().toISOString(),
        assessment_duration_seconds: 0, // Could be calculated if we track start time
        retake_count: 0, // Could be fetched from previous assessments
        is_retake: false
      };

      console.log('Submitting assessment to database:', assessmentData);
      
      // Submit to database using synchronization service
      const result = await synchronizationService.saveAndSync(async () => {
        return await ChecklistResultService.submitChecklistResult(assessmentData);
      }, 'results');
      
      if (result.success) {
        // Show success alert
        const successMessage = `✅ Assessment submitted successfully!\n\nParticipant: ${selectedParticipant.name}\nScore: ${Math.round(overallProgress.percentage)}%\nStatus: ${overallProgress.status}\n\nAssessment ID: ${result.data?.id?.substring(0, 8)}...`;
        alert(successMessage);
        
        // Reset form
        setComment('');
        // Note: In a real implementation, you would reset the sections state here
        setSelectedParticipant(null);
      } else {
        // Show error alert
        alert(`❌ Failed to submit assessment!\n\nError: ${result.error}\n\nPlease try again.`);
      }
      
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert(`❌ Error submitting assessment!\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again.`);
    }
  };

  const toggleItem = (sectionIndex: number, itemIndex: number) => {
    console.log(`Toggling item ${sectionIndex}.${itemIndex}`);
    console.log('Current sections:', sections.length);
    console.log('Current item state:', sections[sectionIndex]?.items[itemIndex]?.completed);
    
    // Check if sections and items exist
    if (!sections[sectionIndex] || !sections[sectionIndex].items[itemIndex]) {
      console.error('Invalid section or item index');
      return;
    }
    
    const item = sections[sectionIndex].items[itemIndex];
    const itemId = item.id || '';
    
    // Update the local completed state
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        console.log(`Item ${sectionIndex}.${itemIndex} marked as incomplete`);
      } else {
        newSet.add(itemId);
        console.log(`Item ${sectionIndex}.${itemIndex} marked as completed`);
      }
      return newSet;
    });
  };

  const getSectionProgress = (section: ChecklistSection) => {
    const completed = section.items.filter(item => item.completed).length;
    const total = section.items.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const getOverallProgress = () => {
    const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);
    const completedItems = sections.reduce(
      (sum, section) => sum + section.items.filter(item => item.completed).length,
      0
    );
    
    // Use database data for all checklist types - no hardcoded logic
    const allCompulsoryItems = sections.flatMap(section => 
      section.items.filter(item => item.is_compulsory)
    );
    const completedCompulsoryItems = allCompulsoryItems.filter(item => item.completed);
    
    let status = 'INCOMPLETE';
    let canPass = false;
    let compulsoryCompleted = false;
    
    // Check if all compulsory items are completed
    compulsoryCompleted = allCompulsoryItems.length > 0 ? allCompulsoryItems.every(item => item.completed) : true;
    
    // For choking checklists, use 4 out of total items logic if no compulsory items defined
    if (checklistType === 'adult choking' || checklistType === 'infant choking') {
      const requiredItems = 4;
      canPass = completedItems >= requiredItems;
    } else {
      // For other checklists, use compulsory items logic - ALL compulsory items must be completed
      canPass = compulsoryCompleted;
    }
    
    // Status calculation: PASS only if canPass is true AND at least one item is completed
    if (completedItems > 0) {
      status = canPass ? 'PASS' : 'FAIL';
    } else {
      status = 'INCOMPLETE';
    }
    
    return { 
      completed: completedItems, 
      total: totalItems, 
      percentage: totalItems > 0 ? (completedItems / totalItems) * 100 : 0,
      compulsoryCompleted,
      canPass,
      status
    };
  };

  const formatSectionName = (section: string) => {
    // Use database section names directly - no hardcoded mapping
    return section.toUpperCase().replace(/([A-Z])/g, ' $1').trim();
  };

  const overallProgress = getOverallProgress();

  if (isDataLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient 
          colors={["#0a0a0a", "#1a1a2e", "#16213e"]} 
          style={styles.background}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading checklist...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <LinearGradient 
          colors={["#0a0a0a", "#1a1a2e", "#16213e"]} 
          style={styles.background}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Error: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadChecklist()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Modern Background */}
      <LinearGradient 
        colors={["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe", "#00f2fe"]} 
        style={styles.background}
      >
        <View style={styles.backgroundOverlay} />
      </LinearGradient>

      {/* Modern Header */}
      <View style={styles.modernHeader}>
        <TouchableOpacity onPress={onBack} style={styles.modernBackButton}>
              <LinearGradient colors={['#ff6b6b', '#ee5a52']} style={styles.backButtonGradient}>
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleManualRefresh} style={styles.refreshButton}>
              <LinearGradient colors={['#4ecdc4', '#44a08d']} style={styles.refreshButtonGradient}>
                <Ionicons name="refresh" size={24} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
          <Text style={styles.modernHeaderTitle}>
            {checklistType === 'two man cpr' ? 'Two Man CPR' : 
             checklistType === 'one man cpr' ? 'One Man CPR' : 
             checklistType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'CPR Checklist'}
          </Text>
          <Text style={styles.modernHeaderSubtitle}>
                {overallProgress.completed}/{overallProgress.total} completed • {Math.round(overallProgress.percentage)}%
              </Text>
          {!overallProgress.canPass && (
            <Text style={styles.compulsoryWarning}>
              {checklistType === 'adult choking' || checklistType === 'infant choking' 
                ? `⚠️ Complete at least 4 out of ${overallProgress.total} items to pass`
                : `⚠️ Complete all compulsory items to pass (${sections.flatMap(s => s.items.filter(item => item.is_compulsory)).length} required)`
              }
            </Text>
          )}
            </View>

        <View style={styles.progressBadge}>
          <LinearGradient colors={['#4ecdc4', '#44a08d']} style={styles.badgeGradient}>
            <Text style={styles.badgeText}>{Math.round(overallProgress.percentage)}%</Text>
              </LinearGradient>
            </View>
          </View>

      {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <LinearGradient
            colors={['#ff9a9e', '#fecfef']}
              style={[styles.progressFill, { width: `${overallProgress.percentage}%` }]}
            />
          </View>
        </View>

      {/* Participant Selector */}
      <View style={styles.participantSection}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.8)']}
          style={styles.participantCard}
        >
          <View style={styles.participantHeader}>
            <Text style={styles.participantTitle}>Participant Details</Text>
            <TouchableOpacity
              onPress={() => setShowParticipantSelector(!showParticipantSelector)}
              style={styles.searchButton}
            >
              <Ionicons name="search" size={20} color="#667eea" />
            </TouchableOpacity>
          </View>

          {selectedParticipant ? (
            <View style={styles.selectedParticipant}>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{selectedParticipant.name}</Text>
                
                <View style={styles.participantDetailsGrid}>
                  <View style={styles.participantDetailRow}>
                    <Ionicons name="mail" size={16} color="#667eea" />
                    <Text style={styles.participantDetailText}>{selectedParticipant.email}</Text>
                  </View>
                  
                  <View style={styles.participantDetailRow}>
                    <Ionicons name="card" size={16} color="#667eea" />
                    <Text style={styles.participantDetailText}>
                      IC: {selectedParticipant.ic_number || 'Not provided'}
                    </Text>
                  </View>
                  
                  <View style={styles.participantDetailRow}>
                    <Ionicons name="call" size={16} color="#667eea" />
                    <Text style={styles.participantDetailText}>
                      {selectedParticipant.phone_number || 'No phone number'}
                    </Text>
                  </View>
                  
                  <View style={styles.participantDetailRow}>
                    <Ionicons name="briefcase" size={16} color="#667eea" />
                    <Text style={styles.participantDetailText}>
                      {selectedParticipant.job_position_name} • {selectedParticipant.category}
                    </Text>
                  </View>
                  
                  <View style={styles.participantDetailRow}>
                    <Ionicons name="location" size={16} color="#667eea" />
                    <Text style={styles.participantDetailText}>
                      {selectedParticipant.tempat_bertugas || 'Workplace not specified'}
                    </Text>
                  </View>
                  
                  {selectedParticipant.is_pregnant && (
                    <View style={styles.participantDetailRow}>
                      <Ionicons name="heart" size={16} color="#ff6b6b" />
                      <Text style={[styles.participantDetailText, styles.pregnancyText]}>
                        Pregnant {selectedParticipant.pregnancy_weeks ? `(${selectedParticipant.pregnancy_weeks} weeks)` : ''}
                      </Text>
                    </View>
                  )}
                  
                  {selectedParticipant.has_allergies && (
                    <View style={styles.participantDetailRow}>
                      <Ionicons name="warning" size={16} color="#ff9500" />
                      <Text style={[styles.participantDetailText, styles.allergyText]}>
                        Allergies: {selectedParticipant.allergies_description || 'Not specified'}
                      </Text>
                    </View>
                  )}
                  
                  {selectedParticipant.has_asthma && (
                    <View style={styles.participantDetailRow}>
                      <Ionicons name="medical" size={16} color="#ff6b6b" />
                      <Text style={[styles.participantDetailText, styles.medicalText]}>
                        Has Asthma
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedParticipant(null)}
                style={styles.clearButton}
              >
                <Ionicons name="close" size={20} color="#ff6b6b" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowParticipantSelector(true)}
              style={styles.selectParticipantButton}
            >
              <Ionicons name="person-add" size={24} color="#ffffff" />
              <Text style={styles.selectParticipantText}>Select Participant</Text>
            </TouchableOpacity>
          )}

          {showParticipantSelector && (
            <View style={styles.participantSelector}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search participants..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#999"
                />
              </View>
              
              <ScrollView style={styles.participantList} showsVerticalScrollIndicator={false}>
                {filteredParticipants.length > 0 ? (
                  filteredParticipants.map((participant) => (
                    <TouchableOpacity
                      key={participant.id}
                      onPress={() => {
                        console.log('Selected participant:', participant.name);
                        setSelectedParticipant(participant);
                        setShowParticipantSelector(false);
                        setSearchQuery('');
                      }}
                      style={styles.participantItem}
                    >
                      <View style={styles.participantItemInfo}>
                        <Text style={styles.participantItemName}>{participant.name}</Text>
                        <Text style={styles.participantItemDetails}>
                          {participant.job_position_name} • {participant.email}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#666" />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="people" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>
                      {participants.length === 0 
                        ? 'No participants found. Please add participants first.'
                        : 'No participants match your search.'
                      }
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      Total participants: {participants.length}
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Modern Content */}
      <ScrollView style={styles.modernContent} showsVerticalScrollIndicator={false}>
        {sections.map((section, sectionIndex) => {
          const sectionProgress = getSectionProgress(section);
          return (
            <View key={section.section} style={[
              styles.modernSectionContainer,
              // Check if any item in this section is compulsory (from database)
              section.items.some(item => item.is_compulsory) && 
              styles.compulsorySectionContainer
            ]}>
              {/* Modern Section Header */}
                <LinearGradient
                colors={section.items.some(item => item.is_compulsory)
                  ? ['rgba(255, 245, 157, 0.95)', 'rgba(255, 245, 157, 0.8)'] 
                  : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.8)']
                }
                style={styles.modernSectionHeader}
              >
                <View style={styles.sectionTitleRow}>
                    <LinearGradient 
                      colors={['#667eea', '#764ba2']} 
                    style={styles.sectionNumberBadge}
                    >
                      <Text style={styles.sectionNumberText}>{sectionIndex + 1}</Text>
                    </LinearGradient>
                  <View style={styles.sectionTitleContainer}>
                    <Text style={styles.modernSectionTitle}>
                      {formatSectionName(section.section)}
                    </Text>
                    {section.items.some(item => item.is_compulsory) && (
                  <LinearGradient 
                        colors={['#ff6b6b', '#ee5a52']} 
                        style={styles.compulsoryBadge}
                  >
                        <Ionicons name="star" size={12} color="#ffffff" />
                        <Text style={styles.compulsoryText}>Required</Text>
                  </LinearGradient>
                    )}
                  </View>
                </View>
                </LinearGradient>

              {/* Modern Items */}
              <View style={[
                styles.modernItemsContainer,
                section.items.some(item => item.is_compulsory) && 
                styles.compulsoryItemsContainer
              ]}>
                  {section.items.map((item, itemIndex) => {
                    const itemNumber = `${sectionIndex + 1}.${itemIndex + 1}`;
                    // Use the database is_compulsory field instead of section-based logic
                    const isCompulsorySection = item.is_compulsory;
                    return (
                    <View key={item.id} style={[
                      styles.modernItemRow,
                      !isCompulsorySection && styles.optionalItemRow
                    ]}>
                        <View style={styles.itemContent}>
                          <LinearGradient 
                            colors={isCompulsorySection ? ['#667eea', '#764ba2'] : ['#9ca3af', '#6b7280']} 
                          style={styles.itemNumberBadge}
                          >
                            <Text style={styles.itemNumberText}>{itemNumber}</Text>
                          </LinearGradient>
                          
                          <View style={styles.itemTextContainer}>
                            <Text style={[
                              styles.modernItemText,
                              item.completed && styles.itemTextCompleted,
                              !isCompulsorySection && styles.optionalItemText
                            ]}>
                              {item.item}
                            </Text>
                            {isCompulsorySection ? (
                              <View style={styles.compulsoryBadge}>
                                <Text style={styles.compulsoryText}>Compulsory</Text>
                              </View>
                            ) : (
                              <View style={styles.optionalBadge}>
                                <Text style={styles.optionalText}>Optional</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        
                        <TouchableOpacity
                          onPress={() => {
                            console.log(`TouchableOpacity pressed for item ${sectionIndex}.${itemIndex}`);
                            toggleItem(sectionIndex, itemIndex);
                          }}
                          style={styles.modernToggleContainer}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={item.completed ? ['#4ecdc4', '#44a08d'] : ['#e0e0e0', '#bdbdbd']}
                          style={styles.modernToggle}
                          >
                          <View style={[
                              styles.toggleThumb,
                              {
                              transform: [{ translateX: item.completed ? 22 : 2 }]
                              }
                            ]}>
                              {item.completed && (
                                <Ionicons name="checkmark" size={16} color="#4ecdc4" />
                              )}
                          </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
            </View>
          );
        })}

        {/* Modern Summary */}
        <View style={styles.modernSummary}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.8)']}
              style={styles.summaryCard}
            >
              <LinearGradient 
                colors={['#667eea', '#764ba2']} 
                style={styles.summaryIcon}
              >
                <Ionicons name="trophy" size={32} color="#ffffff" />
              </LinearGradient>
              
            <Text style={styles.modernSummaryTitle}>Progress Summary</Text>
              
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{overallProgress.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{overallProgress.completed}</Text>
                  <Text style={styles.statLabel}>Done</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{overallProgress.total - overallProgress.completed}</Text>
                  <Text style={styles.statLabel}>Left</Text>
                </View>
              </View>
              
              <LinearGradient 
              colors={overallProgress.status === 'PASS' ? ['#4ecdc4', '#44a08d'] : overallProgress.status === 'FAIL' ? ['#ff6b6b', '#ee5a52'] : ['#ff9500', '#ff6b6b']} 
                style={styles.summaryPercentageBadge}
              >
                <Text style={styles.summaryPercentage}>
                {overallProgress.status} • {Math.round(overallProgress.percentage)}%
                </Text>
              </LinearGradient>
            
            {overallProgress.status === 'FAIL' && (
              <Text style={styles.compulsoryNote}>
                Complete all compulsory items to pass
              </Text>
            )}
            
            {overallProgress.status === 'INCOMPLETE' && (
              <Text style={styles.incompleteNote}>
                Start the assessment by checking off completed items
              </Text>
            )}
            </LinearGradient>
        </View>

        {/* Comment Section */}
        <View style={styles.commentSection}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.8)']}
            style={styles.commentCard}
          >
            <View style={styles.commentHeader}>
              <Ionicons name="chatbubble" size={24} color="#667eea" />
              <Text style={styles.commentTitle}>Instructor Comments</Text>
            </View>
            
            <TextInput
              style={styles.commentInput}
              placeholder="Add your comments, observations, or feedback about this participant's performance..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
              textAlignVertical="top"
            />
            
            <View style={styles.commentFooter}>
              <Text style={styles.commentCounter}>
                {comment.length}/500 characters
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            onPress={handleSubmit}
            style={styles.submitButton}
            disabled={!selectedParticipant}
          >
            <LinearGradient
              colors={selectedParticipant ? ['#4ecdc4', '#44a08d'] : ['#ccc', '#999']}
              style={styles.submitButtonGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
              <Text style={styles.submitButtonText}>
                {selectedParticipant ? `Submit Assessment (${overallProgress.status})` : 'Select Participant First'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {selectedParticipant && (
            <Text style={styles.submitNote}>
              Assessment will be saved for {selectedParticipant.name}
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  // Modern Header Styles
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modernBackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden',
  },
  backButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden',
  },
  refreshButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  modernHeaderTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
  modernHeaderSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  compulsoryWarning: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffeb3b',
    marginTop: 4,
  },
  progressBadge: {
    alignItems: 'center',
  },
  badgeGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Progress Bar
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  // Modern Content
  modernContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modernSectionContainer: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  compulsorySectionContainer: {
    borderWidth: 2,
    borderColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
    shadowOpacity: 0.3,
  },
  modernSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  modernSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  sectionProgressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sectionProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Modern Items
  modernItemsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  compulsoryItemsContainer: {
    backgroundColor: 'rgba(255, 245, 157, 0.95)',
  },
  modernItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  optionalItemRow: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    opacity: 0.8,
  },
  optionalItemText: {
    color: '#6b7280',
    opacity: 0.8,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  modernItemText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 24,
    fontWeight: '500',
    flex: 1,
  },
  itemTextContainer: {
    flex: 1,
  },
  compulsoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#ff6b6b',
  },
  compulsoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  optionalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    backgroundColor: '#e5e7eb',
  },
  optionalText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  itemTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
    opacity: 0.6,
  },
  modernToggleContainer: {
    marginLeft: 16,
    padding: 8, // Add padding for better touch area
    minWidth: 50, // Ensure minimum touch width
    minHeight: 44, // Ensure minimum touch height (iOS guidelines)
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  // Modern Summary
  modernSummary: {
    marginVertical: 24,
    marginBottom: 40,
  },
  summaryCard: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  summaryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modernSummaryTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 24,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
    lineHeight: 36,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  summaryPercentageBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  summaryPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
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
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  compulsoryNote: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 12,
  },
  incompleteNote: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff9500',
    textAlign: 'center',
    marginTop: 12,
  },
  // Participant Selector Styles
  participantSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  participantCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  participantTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  searchButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  selectedParticipant: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  participantDetailsGrid: {
    gap: 8,
  },
  participantDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  participantDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  pregnancyText: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  allergyText: {
    color: '#ff9500',
    fontWeight: '600',
  },
  medicalText: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  selectParticipantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#667eea',
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  selectParticipantText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
  },
  participantSelector: {
    marginTop: 15,
    maxHeight: 300,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  participantList: {
    maxHeight: 200,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  participantItemInfo: {
    flex: 1,
  },
  participantItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  participantItemDetails: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  // Comment Section Styles
  commentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  commentCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 10,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f9f9f9',
    minHeight: 100,
    maxHeight: 150,
  },
  commentFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  commentCounter: {
    fontSize: 12,
    color: '#999',
  },
  // Submit Section Styles
  submitSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  submitButton: {
    width: '100%',
    marginBottom: 10,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#4ecdc4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 10,
  },
  submitNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
