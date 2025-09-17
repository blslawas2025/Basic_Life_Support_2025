import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../utils/colorScheme';
import { getResponsiveSize } from '../../utils/responsiveHelpers';
import { TestSubmission } from '../../services/AnalyticsService';

interface SubmissionsTableProps {
  submissions: TestSubmission[];
  isLoading: boolean;
  onViewDetails: (submission: TestSubmission) => void;
  onGenerateCertificate: (submission: TestSubmission) => void;
}

export default function SubmissionsTable({ 
  submissions, 
  isLoading, 
  onViewDetails, 
  onGenerateCertificate 
}: SubmissionsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pre_test' | 'post_test'>('all');

  const getFilteredSubmissions = () => {
    let filtered = submissions;

    // Filter by test type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(submission => submission.test_type === selectedFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(submission => 
        submission.user_name.toLowerCase().includes(query) ||
        submission.user_email.toLowerCase().includes(query) ||
        (submission.job_position_name && submission.job_position_name.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const filteredSubmissions = getFilteredSubmissions();

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.neon.green;
    if (score >= 60) return COLORS.neon.orange;
    return COLORS.neon.red;
  };

  const getTestTypeIcon = (testType: string) => {
    return testType === 'pre_test' ? 'play-outline' : 'checkmark-circle-outline';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading submissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test Submissions</Text>
      
      {/* Search and Filter Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search participants..."
            placeholderTextColor={COLORS.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filterContainer}>
          {(['all', 'pre_test', 'post_test'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === filter && styles.filterButtonTextActive
              ]}>
                {filter === 'all' ? 'All' : filter === 'pre_test' ? 'Pre-Test' : 'Post-Test'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={styles.headerText}>Participant</Text>
        <Text style={styles.headerText}>Test Type</Text>
        <Text style={styles.headerText}>Score</Text>
        <Text style={styles.headerText}>Time</Text>
        <Text style={styles.headerText}>Actions</Text>
      </View>

      {/* Table Content */}
      <ScrollView style={styles.tableContent} showsVerticalScrollIndicator={false}>
        {filteredSubmissions.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Ionicons name="document-outline" size={48} color={COLORS.text.tertiary} />
            <Text style={styles.noDataText}>No submissions found</Text>
          </View>
        ) : (
          filteredSubmissions.map((submission) => (
            <LinearGradient
              key={submission.id}
              colors={COLORS.gradient.glass}
              style={styles.tableRow}
            >
              <View style={styles.cell}>
                <Text style={styles.cellText} numberOfLines={1}>
                  {submission.user_name}
                </Text>
                <Text style={styles.cellSubText} numberOfLines={1}>
                  {submission.user_email}
                </Text>
              </View>
              
              <View style={styles.cell}>
                <Ionicons 
                  name={getTestTypeIcon(submission.test_type)} 
                  size={16} 
                  color={COLORS.neon.electric} 
                />
                <Text style={styles.cellText}>
                  {submission.test_type === 'pre_test' ? 'Pre-Test' : 'Post-Test'}
                </Text>
              </View>
              
              <View style={styles.cell}>
                <Text style={[
                  styles.scoreText,
                  { color: getScoreColor(submission.score) }
                ]}>
                  {submission.score}%
                </Text>
              </View>
              
              <View style={styles.cell}>
                <Text style={styles.cellText}>
                  {Math.floor(submission.time_taken_seconds / 60)}m {submission.time_taken_seconds % 60}s
                </Text>
              </View>
              
              <View style={styles.actionsCell}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onViewDetails(submission)}
                >
                  <Ionicons name="eye-outline" size={16} color={COLORS.neon.electric} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onGenerateCertificate(submission)}
                >
                  <Ionicons name="document-text-outline" size={16} color={COLORS.neon.green} />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  controlsContainer: {
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface.glass,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border.glass,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    color: COLORS.text.primary,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface.glass,
    borderWidth: 1,
    borderColor: COLORS.border.glass,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
  },
  filterButtonTextActive: {
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface.glass,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border.glass,
  },
  headerText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  tableContent: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.glass,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  cellText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  cellSubText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  scoreText: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: 'bold',
  },
  actionsCell: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface.glass,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  noDataText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.tertiary,
    marginTop: SPACING.md,
  },
});
