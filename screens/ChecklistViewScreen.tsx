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
  SafeAreaView,
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

interface ChecklistViewScreenProps {
  onBack: () => void;
  checklistType: string;
  onRefresh?: () => void;
}

interface ChecklistSection {
  section: string;
  items: (ChecklistItemData & { completed: boolean })[];
}

export default function ChecklistViewScreen({ onBack, checklistType, onRefresh }: ChecklistViewScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showParticipantSelector, setShowParticipantSelector] = useState(false);
  const [comment, setComment] = useState('');
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Use global state for checklist data
  const { data: checklistItems, refresh: refreshChecklistData, isLoading: isDataLoading } = useChecklistState(checklistType);

  // Process global state data into sections
  const sections = React.useMemo(() => {
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
    
    return result;
  }, [checklistItems, checklistType, completedItems]);

  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  const loadChecklist = useCallback(async () => {
    try {
      setError(null);
      const result = await refreshChecklistData(() => ChecklistItemService.getChecklistItemsByType(checklistType));

      if (result.success && result.items && result.items.length > 0) {
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
        ]).start();
      } else {
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
  }, [checklistType]);

  const loadParticipants = async () => {
    try {
      const profiles = await ProfileService.getAllProfiles();
      const participantProfiles = profiles.filter(profile => 
        profile.user_type === 'participant' && profile.status === 'approved'
      );
      setParticipants(participantProfiles);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const handleManualRefresh = async () => {
    await loadChecklist();
  };

  const filteredParticipants = participants.filter(participant =>
    participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    participant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (participant.job_position_name && participant.job_position_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleItem = (itemId: string) => {
    const newCompletedItems = new Set(completedItems);
    if (newCompletedItems.has(itemId)) {
      newCompletedItems.delete(itemId);
    } else {
      newCompletedItems.add(itemId);
    }
    setCompletedItems(newCompletedItems);
  };

  const getSectionProgress = (section: ChecklistSection) => {
    const completed = section.items.filter(item => item.completed).length;
    const total = section.items.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const getOverallProgress = () => {
    const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);
    const completedItems = sections.reduce((sum, section) => 
      sum + section.items.filter(item => item.completed).length, 0);
    
    const allCompulsoryItems = sections.flatMap(s => s.items.filter(item => item.is_compulsory));
    const compulsoryCompleted = allCompulsoryItems.length > 0 ? allCompulsoryItems.every(item => item.completed) : true;
    
    let canPass = false;
    let status = 'INCOMPLETE';
    
    if (checklistType === 'adult choking' || checklistType === 'infant choking') {
      const requiredItems = 4;
      canPass = completedItems >= requiredItems;
    } else {
      canPass = compulsoryCompleted;
    }
    
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

  const handleSubmit = async () => {
    if (!selectedParticipant) {
      alert('Please select a participant first');
      return;
    }

    const confirmMessage = `Are you sure you want to submit this assessment for ${selectedParticipant.name}?\n\nScore: ${Math.round(overallProgress.percentage)}%\nStatus: ${overallProgress.status}\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
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

      if (overallProgress.status === 'PASS') {
        const validation = ChecklistResultService.validatePassStatus(sectionResults);
        if (!validation.isValid) {
          alert(`❌ Invalid PASS Status!\n\nCannot submit as PASS. The following compulsory items are not completed:\n\n${validation.missingCompulsory.join('\n')}\n\nPlease complete all compulsory items or change the status to FAIL.`);
          return;
        }
      }

      const assessmentData = {
        participant_id: selectedParticipant.id,
        participant_name: selectedParticipant.name,
        participant_email: selectedParticipant.email,
        participant_ic: selectedParticipant.ic_number,
        participant_job: selectedParticipant.job_position_name,
        participant_workplace: selectedParticipant.tempat_bertugas,
        checklist_type: checklistType,
        overall_score: Math.round(overallProgress.percentage),
        overall_status: overallProgress.status,
        section_results: sectionResults,
        instructor_comments: comment.trim() || null,
        assessment_date: new Date().toISOString(),
        created_by: 'instructor',
        metadata: {
          total_items: overallProgress.total,
          completed_items: overallProgress.completed,
          compulsory_completed: overallProgress.compulsoryCompleted,
          can_pass: overallProgress.canPass
        }
      };

      const result = await ChecklistResultService.submitAssessment(assessmentData);
      
      if (result.success) {
        alert(`✅ Assessment submitted successfully!\n\nParticipant: ${selectedParticipant.name}\nScore: ${Math.round(overallProgress.percentage)}%\nStatus: ${overallProgress.status}`);
        
        // Reset form
        setCompletedItems(new Set());
        setComment('');
        setSelectedParticipant(null);
        
        // Trigger refresh if callback provided
        if (onRefresh) {
          onRefresh();
        }
      } else {
        throw new Error(result.error || 'Failed to submit assessment');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert(`❌ Failed to submit assessment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const formatSectionName = (section: string) => {
    return section.toUpperCase().replace(/([A-Z])/g, ' $1').trim();
  };

  const overallProgress = getOverallProgress();

  if (isDataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
        <View style={styles.loadingContainer}>
          <Ionicons name="list" size={60} color="#fff" />
          <Text style={styles.loadingText}>Loading checklist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={60} color="#ff6b6b" />
          <Text style={styles.loadingText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadChecklist()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.background} />

      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleManualRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {checklistType === 'two man cpr' ? 'Two Man CPR' : 
             checklistType === 'one man cpr' ? 'One Man CPR' : 
             checklistType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'CPR Checklist'}
          </Text>
          <Text style={styles.headerSubtitle}>
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
          <Text style={styles.badgeText}>{Math.round(overallProgress.percentage)}%</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${overallProgress.percentage}%` }]} />
        </View>
      </View>

      {/* SCROLLABLE CONTENT - EVERYTHING INSIDE */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Participant Selector - NOW SCROLLS WITH CONTENT */}
        <View style={styles.participantSection}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.8)']}
            style={styles.participantCard}
          >
            <View style={styles.participantHeader}>
              <Text style={styles.participantTitle}>📋 Participant Details</Text>
              <TouchableOpacity
                onPress={() => setShowParticipantSelector(!showParticipantSelector)}
                style={styles.searchButton}
              >
                <Ionicons name="search" size={20} color="#667eea" />
                <Text style={styles.searchButtonText}>Select</Text>
              </TouchableOpacity>
            </View>

            {selectedParticipant ? (
              <View style={styles.selectedParticipant}>
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
                </View>
              </View>
            ) : (
              <View style={styles.noParticipantSelected}>
                <Ionicons name="person-add" size={24} color="#999" />
                <Text style={styles.noParticipantText}>Tap "Select" to choose a participant</Text>
              </View>
            )}

            {showParticipantSelector && (
              <View style={styles.participantSelector}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={16} color="#999" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search participants..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                  />
                </View>
                
                <ScrollView style={styles.participantList} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                  {filteredParticipants.length > 0 ? (
                    filteredParticipants.map((participant) => (
                      <TouchableOpacity
                        key={participant.id}
                        onPress={() => {
                          setSelectedParticipant(participant);
                          setShowParticipantSelector(false);
                          setSearchQuery('');
                        }}
                        style={styles.participantItem}
                      >
                        <Text style={styles.participantItemName}>{participant.name}</Text>
                        <Text style={styles.participantItemDetails}>
                          {participant.job_position_name} • {participant.email}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        {searchQuery ? 'No participants found' : 'No participants available'}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Checklist Sections - NOW PROPERLY SCROLLABLE */}
        {sections.map((section, sectionIndex) => {
          const sectionProgress = getSectionProgress(section);
          return (
            <View key={section.section} style={styles.sectionContainer}>
              <LinearGradient
                colors={section.items.some(item => item.is_compulsory)
                  ? ['rgba(255, 245, 157, 0.95)', 'rgba(255, 245, 157, 0.8)'] 
                  : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.8)']
                }
                style={styles.sectionCard}
              >
                {/* Section Header */}
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={styles.sectionNumberBadge}>
                      <Text style={styles.sectionNumber}>{sectionIndex + 1}</Text>
                    </View>
                    <Text style={styles.sectionTitle}>{formatSectionName(section.section)}</Text>
                  </View>
                  
                  <View style={styles.sectionProgress}>
                    <Text style={styles.sectionProgressText}>
                      {sectionProgress.completed}/{sectionProgress.total}
                    </Text>
                    <View style={styles.sectionProgressBar}>
                      <View style={[styles.sectionProgressFill, { width: `${sectionProgress.percentage}%` }]} />
                    </View>
                  </View>
                </View>

                {/* Section Items */}
                <View style={styles.itemsList}>
                  {section.items.map((item, itemIndex) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.checklistItem,
                        item.completed && styles.checklistItemCompleted,
                        item.is_compulsory && styles.compulsoryItem
                      ]}
                      onPress={() => toggleItem(item.id || '')}
                      activeOpacity={0.7}
                    >
                      <View style={styles.itemHeader}>
                        <View style={styles.itemNumber}>
                          <Text style={styles.itemNumberText}>{itemIndex + 1}.{item.order_index || 1}</Text>
                        </View>
                        
                        <View style={styles.itemContent}>
                          <Text style={[
                            styles.itemText,
                            item.completed && styles.itemTextCompleted
                          ]}>
                            {item.item}
                          </Text>
                          
                          {item.is_compulsory && (
                            <View style={styles.compulsoryBadge}>
                              <Text style={styles.compulsoryText}>COMPULSORY</Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={[
                          styles.checkbox,
                          item.completed && styles.checkboxCompleted
                        ]}>
                          {item.completed && (
                            <Ionicons name="checkmark" size={16} color="#fff" />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </LinearGradient>
            </View>
          );
        })}

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.8)']}
            style={styles.commentsCard}
          >
            <Text style={styles.commentsTitle}>💬 Instructor Comments</Text>
            <TextInput
              style={styles.commentsInput}
              placeholder="Add any additional comments or observations..."
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
            />
          </LinearGradient>
        </View>

        {/* Submit Section */}
        <View style={styles.submitSection}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.8)']}
            style={styles.submitCard}
          >
            <View style={styles.submitSummary}>
              <Text style={styles.submitTitle}>📊 Assessment Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Progress:</Text>
                <Text style={styles.summaryValue}>
                  {overallProgress.completed}/{overallProgress.total} ({Math.round(overallProgress.percentage)}%)
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Status:</Text>
                <Text style={[
                  styles.summaryValue,
                  { color: overallProgress.status === 'PASS' ? '#27ae60' : overallProgress.status === 'FAIL' ? '#e74c3c' : '#f39c12' }
                ]}>
                  {overallProgress.status}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedParticipant || overallProgress.completed === 0) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!selectedParticipant || overallProgress.completed === 0}
            >
              <LinearGradient
                colors={(!selectedParticipant || overallProgress.completed === 0) 
                  ? ['#bdc3c7', '#95a5a6'] 
                  : ['#667eea', '#764ba2']
                }
                style={styles.submitButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Assessment</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            {selectedParticipant && (
              <Text style={styles.submitNote}>
                Assessment will be saved for {selectedParticipant.name}
              </Text>
            )}
          </LinearGradient>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Fixed Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  refreshButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  compulsoryWarning: {
    fontSize: 12,
    color: '#ffeb3b',
    fontWeight: '600',
  },
  progressBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  badgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Progress Bar
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  // Scrollable Content
  scrollContainer: {
    flex: 1,
  },
  // Participant Section
  participantSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  participantCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102,126,234,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 5,
  },
  searchButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedParticipant: {
    backgroundColor: 'rgba(102,126,234,0.05)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.2)',
  },
  participantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  participantDetailsGrid: {
    gap: 6,
  },
  participantDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  participantDetailText: {
    fontSize: 14,
    color: '#666',
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
  noParticipantSelected: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  noParticipantText: {
    color: '#999',
    fontSize: 14,
  },
  participantSelector: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(102,126,234,0.2)',
    paddingTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248,249,250,0.8)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  participantList: {
    maxHeight: 200,
  },
  participantItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(102,126,234,0.1)',
  },
  participantItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  participantItemDetails: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    color: '#999',
    fontSize: 14,
  },
  // Section Styles
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionNumberBadge: {
    backgroundColor: '#667eea',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  sectionProgress: {
    alignItems: 'flex-end',
  },
  sectionProgressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  sectionProgressBar: {
    width: 60,
    height: 4,
    backgroundColor: 'rgba(102,126,234,0.2)',
    borderRadius: 2,
  },
  sectionProgressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 2,
  },
  // Items List
  itemsList: {
    gap: 8,
  },
  checklistItem: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.2)',
  },
  checklistItemCompleted: {
    backgroundColor: 'rgba(39,174,96,0.1)',
    borderColor: '#27ae60',
  },
  compulsoryItem: {
    borderColor: '#f39c12',
    borderWidth: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemNumber: {
    backgroundColor: 'rgba(102,126,234,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  itemNumberText: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
    marginBottom: 4,
  },
  itemTextCompleted: {
    color: '#27ae60',
    fontWeight: '600',
  },
  compulsoryBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  compulsoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  // Comments Section
  commentsSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  commentsCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  commentsInput: {
    backgroundColor: 'rgba(248,249,250,0.8)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(102,126,234,0.2)',
  },
  // Submit Section
  submitSection: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  submitCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitSummary: {
    marginBottom: 16,
  },
  submitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  submitButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  // Loading/Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 50,
  },
});
