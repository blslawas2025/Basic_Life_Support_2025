import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../utils/colorScheme';
import { getResponsiveSize } from '../../utils/responsiveHelpers';

interface QuestionFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDifficulty: string;
  onDifficultyChange: (difficulty: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  categories: string[];
  questionStats: any;
}

export default function QuestionFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedType,
  onTypeChange,
  showFilters,
  onToggleFilters,
  categories,
  questionStats,
}: QuestionFiltersProps) {
  const difficulties = ['all', 'easy', 'medium', 'hard'];
  const types = ['all', 'multiple_choice', 'true_false', 'fill_blank'];

  const FilterButton = ({ 
    label, 
    value, 
    isSelected, 
    onPress 
  }: { 
    label: string; 
    value: string; 
    isSelected: boolean; 
    onPress: () => void; 
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        isSelected && styles.filterButtonActive
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.filterButtonText,
        isSelected && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={COLORS.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search questions..."
            placeholderTextColor={COLORS.text.tertiary}
            value={searchTerm}
            onChangeText={onSearchChange}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterToggleButton}
          onPress={onToggleFilters}
        >
          <Ionicons 
            name={showFilters ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={COLORS.text.primary} 
          />
          <Text style={styles.filterToggleText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Options */}
      {showFilters && (
        <LinearGradient
          colors={COLORS.gradient.glass}
          style={styles.filtersContainer}
        >
          {/* Categories */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Categories</Text>
            <View style={styles.filterButtonsContainer}>
              <FilterButton
                label="All"
                value="all"
                isSelected={selectedCategory === 'all'}
                onPress={() => onCategoryChange('all')}
              />
              {categories.map((category) => (
                <FilterButton
                  key={category}
                  label={category}
                  value={category}
                  isSelected={selectedCategory === category}
                  onPress={() => onCategoryChange(category)}
                />
              ))}
            </View>
          </View>

          {/* Difficulty */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Difficulty</Text>
            <View style={styles.filterButtonsContainer}>
              {difficulties.map((difficulty) => (
                <FilterButton
                  key={difficulty}
                  label={difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  value={difficulty}
                  isSelected={selectedDifficulty === difficulty}
                  onPress={() => onDifficultyChange(difficulty)}
                />
              ))}
            </View>
          </View>

          {/* Question Type */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Type</Text>
            <View style={styles.filterButtonsContainer}>
              {types.map((type) => (
                <FilterButton
                  key={type}
                  label={type === 'all' ? 'All' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  value={type}
                  isSelected={selectedType === type}
                  onPress={() => onTypeChange(type)}
                />
              ))}
            </View>
          </View>
        </LinearGradient>
      )}

      {/* Stats Summary */}
      {questionStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{questionStats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{questionStats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{questionStats.inactive}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{questionStats.categories}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface.glass,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border.glass,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    color: COLORS.text.primary,
    fontSize: 16,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface.glass,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.glass,
  },
  filterToggleText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.primary,
    marginLeft: SPACING.xs,
  },
  filtersContainer: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border.glass,
  },
  filterSection: {
    marginBottom: SPACING.md,
  },
  filterSectionTitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  filterButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface.glass,
    borderWidth: 1,
    borderColor: COLORS.border.glass,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary,
  },
  filterButtonTextActive: {
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface.glass,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border.glass,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    marginTop: SPACING.xs,
  },
});
