import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../utils/colorScheme';
import { getResponsiveSize } from '../../utils/responsiveHelpers';
import { Question } from '../../types/Question';

interface QuestionListProps {
  questions: Question[];
  selectedQuestions: Set<string>;
  onSelectQuestion: (questionId: string) => void;
  onEditQuestion: (question: Question) => void;
  onPreviewQuestion: (question: Question) => void;
  onDeleteQuestion: (questionId: string) => void;
  isLoading: boolean;
}

export default function QuestionList({
  questions,
  selectedQuestions,
  onSelectQuestion,
  onEditQuestion,
  onPreviewQuestion,
  onDeleteQuestion,
  isLoading,
}: QuestionListProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return COLORS.neon.green;
      case 'medium': return COLORS.neon.orange;
      case 'hard': return COLORS.neon.red;
      default: return COLORS.neon.electric;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'radio-button-on-outline';
      case 'true_false': return 'checkmark-circle-outline';
      case 'fill_blank': return 'create-outline';
      default: return 'help-circle-outline';
    }
  };

  const renderQuestionItem = ({ item }: { item: Question }) => {
    const isSelected = selectedQuestions.has(item.id);
    
    return (
      <LinearGradient
        colors={isSelected ? COLORS.gradient.primary : COLORS.gradient.glass}
        style={[styles.questionCard, isSelected && styles.selectedCard]}
      >
        <TouchableOpacity
          style={styles.questionContent}
          onPress={() => onSelectQuestion(item.id)}
        >
          <View style={styles.questionHeader}>
            <View style={styles.questionInfo}>
              <Text style={styles.questionText} numberOfLines={2}>
                {item.question_text}
              </Text>
              <View style={styles.questionMeta}>
                <View style={styles.metaItem}>
                  <Ionicons 
                    name={getTypeIcon(item.question_type)} 
                    size={16} 
                    color={COLORS.text.tertiary} 
                  />
                  <Text style={styles.metaText}>{item.question_type.replace('_', ' ')}</Text>
                </View>
                <View style={styles.metaItem}>
                  <View 
                    style={[
                      styles.difficultyBadge, 
                      { backgroundColor: getDifficultyColor(item.difficulty_level) }
                    ]} 
                  />
                  <Text style={styles.metaText}>{item.difficulty_level}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="folder-outline" size={16} color={COLORS.text.tertiary} />
                  <Text style={styles.metaText}>{item.category}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.questionActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onPreviewQuestion(item)}
              >
                <Ionicons name="eye-outline" size={18} color={COLORS.neon.electric} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEditQuestion(item)}
              >
                <Ionicons name="create-outline" size={18} color={COLORS.neon.orange} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onDeleteQuestion(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.neon.red} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading questions...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="help-circle-outline" size={64} color={COLORS.text.tertiary} />
        <Text style={styles.emptyTitle}>No Questions Found</Text>
        <Text style={styles.emptySubtitle}>
          Add some questions to get started with your question bank
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={questions}
      renderItem={renderQuestionItem}
      keyExtractor={(item) => item.id}
      style={styles.list}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.lg,
  },
  questionCard: {
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.glass,
    shadowColor: COLORS.shadow.glass,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: COLORS.border.neon,
    shadowColor: COLORS.shadow.neon,
    shadowOpacity: 0.3,
  },
  questionContent: {
    padding: SPACING.md,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  questionInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  questionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  questionMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.tertiary,
    textTransform: 'capitalize',
  },
  difficultyBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  questionActions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface.glass,
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
});
