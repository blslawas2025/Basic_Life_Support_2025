import { useState, useEffect } from 'react';
import { QuestionService } from '../services/QuestionService';
import { Question, QuestionStats, QuestionFilters } from '../types/Question';

export const useQuestionManagement = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Selection states
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState<boolean>(false);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [questionsData, statsData] = await Promise.all([
        QuestionService.getAllQuestions(),
        QuestionService.getQuestionStats()
      ]);
      
      setQuestions(questionsData);
      setQuestionStats(statsData);
    } catch (err) {
      console.error('Error loading questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = questions;

    // Filter by search term
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(question =>
        question.question_text.toLowerCase().includes(query) ||
        (question.question_text_en && question.question_text_en.toLowerCase().includes(query)) ||
        question.category.toLowerCase().includes(query) ||
        question.tags?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(question => question.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(question => question.difficulty_level === selectedDifficulty);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(question => question.question_type === selectedType);
    }

    setFilteredQuestions(filtered);
  };

  const handleSelectQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    setSelectedQuestions(new Set(filteredQuestions.map(q => q.id)));
    setShowBulkActions(true);
  };

  const handleDeselectAll = () => {
    setSelectedQuestions(new Set());
    setShowBulkActions(false);
  };

  const handleBulkDelete = async () => {
    try {
      const selectedIds = Array.from(selectedQuestions);
      await QuestionService.bulkDeleteQuestions(selectedIds);
      await loadQuestions();
      setSelectedQuestions(new Set());
      setShowBulkActions(false);
    } catch (err) {
      console.error('Error deleting questions:', err);
      setError('Failed to delete questions');
    }
  };

  const handleBulkActivate = async () => {
    try {
      const selectedIds = Array.from(selectedQuestions);
      await QuestionService.bulkUpdateQuestions(selectedIds, { is_active: true });
      await loadQuestions();
      setSelectedQuestions(new Set());
      setShowBulkActions(false);
    } catch (err) {
      console.error('Error activating questions:', err);
      setError('Failed to activate questions');
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      const selectedIds = Array.from(selectedQuestions);
      await QuestionService.bulkUpdateQuestions(selectedIds, { is_active: false });
      await loadQuestions();
      setSelectedQuestions(new Set());
      setShowBulkActions(false);
    } catch (err) {
      console.error('Error deactivating questions:', err);
      setError('Failed to deactivate questions');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await QuestionService.deleteQuestion(questionId);
      await loadQuestions();
      setSelectedQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('Failed to delete question');
    }
  };

  const getCategories = () => {
    const categories = new Set(questions.map(q => q.category));
    return Array.from(categories).sort();
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    filterQuestions();
  }, [questions, searchTerm, selectedCategory, selectedDifficulty, selectedType]);

  return {
    // Data
    questions,
    filteredQuestions,
    questionStats,
    isLoading,
    error,
    
    // Filters
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedType,
    setSelectedType,
    showFilters,
    setShowFilters,
    
    // Selection
    selectedQuestions,
    showBulkActions,
    
    // Actions
    loadQuestions,
    handleSelectQuestion,
    handleSelectAll,
    handleDeselectAll,
    handleBulkDelete,
    handleBulkActivate,
    handleBulkDeactivate,
    handleDeleteQuestion,
    getCategories,
  };
};
