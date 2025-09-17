// Question Service Functions for managing questions and answers
// This file handles all database operations for the questions and answer_options tables

import { Question, CreateQuestion, UpdateQuestion, AnswerOption, CreateAnswerOption, QuestionWithOptions, QuestionStats, QuestionUploadResult, QuestionFilters, BulkQuestionOperation, QuestionImportFormat, QuestionValidationResult } from '../types/Question';
import { supabase } from './supabase';

// Question Service Class
export class QuestionService {
  // Create a new question
  static async createQuestion(questionData: CreateQuestion): Promise<Question> {
    try {
      const insertData = {
        question_text: questionData.question_text,
        question_text_en: questionData.question_text_en || null,
        question_type: questionData.question_type,
        difficulty_level: questionData.difficulty_level,
        category: questionData.category,
        points: questionData.points,
        time_limit_seconds: questionData.time_limit_seconds || null,
        explanation: questionData.explanation || null,
        is_active: questionData.is_active !== undefined ? questionData.is_active : true,
        tags: questionData.tags || null,
        test_type: questionData.test_type || 'pre_test',
        correct_answer: questionData.correct_answer || null,
        option_a: questionData.option_a || null,
        option_a_en: questionData.option_a_en || null,
        option_b: questionData.option_b || null,
        option_b_en: questionData.option_b_en || null,
        option_c: questionData.option_c || null,
        option_c_en: questionData.option_c_en || null,
        option_d: questionData.option_d || null,
        option_d_en: questionData.option_d_en || null,
        course_session_id: questionData.course_session_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null, // Will be set by the current user
      };
      
      const { data, error } = await supabase
        .from('questions')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to create question: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }

  // Get all questions
  static async getAllQuestions(): Promise<Question[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch questions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  // Get questions by test type (pre_test or post_test)
  static async getQuestionsByTestType(testType: 'pre_test' | 'post_test'): Promise<Question[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('test_type', testType)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch ${testType} questions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error(`Error fetching ${testType} questions:`, error);
      throw error;
    }
  }

  // Get question by ID
  static async getQuestionById(id: string): Promise<Question | null> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching question:', error);
      return null;
    }
  }

  // Get question with answer options
  static async getQuestionWithOptions(id: string): Promise<QuestionWithOptions | null> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          answer_options (*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching question with options:', error);
      return null;
    }
  }

  // Update question
  static async updateQuestion(id: string, updates: UpdateQuestion): Promise<Question> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  }

  // Delete question (soft delete by setting is_active to false)
  static async deleteQuestion(id: string): Promise<void> {
    try {
      await this.updateQuestion(id, { is_active: false });
      } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  }

  // Permanently delete question
  static async permanentlyDeleteQuestion(id: string): Promise<void> {
    try {
      // First delete answer options
      const { error: optionsError } = await supabase
        .from('answer_options')
        .delete()
        .eq('question_id', id);

      if (optionsError) {
        console.error('Error deleting answer options:', optionsError);
        throw optionsError;
      }

      // Then delete the question
      const { error: questionError } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (questionError) {
        console.error('Error deleting question:', questionError);
        throw questionError;
      }

      } catch (error) {
      console.error('Error permanently deleting question:', error);
      throw error;
    }
  }

  // Search questions with filters
  static async searchQuestions(filters: QuestionFilters): Promise<Question[]> {
    try {
      let query = supabase
        .from('questions')
        .select('*');

      // Apply filters
      if (filters.question_type) {
        query = query.eq('question_type', filters.question_type);
      }
      if (filters.difficulty_level) {
        query = query.eq('difficulty_level', filters.difficulty_level);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }
      if (filters.course_session_id) {
        query = query.eq('course_session_id', filters.course_session_id);
      }
      if (filters.search_term) {
        query = query.or(`question_text.ilike.%${filters.search_term}%,explanation.ilike.%${filters.search_term}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to search questions: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error searching questions:', error);
      throw error;
    }
  }

  // Get question statistics
  static async getQuestionStats(): Promise<QuestionStats> {
    try {
      const questions = await this.getAllQuestions();
      
      const stats: QuestionStats = {
        total: questions.length,
        byType: {},
        byDifficulty: {},
        byCategory: {},
        active: 0,
        inactive: 0,
      };
      
      questions.forEach(question => {
        // Count by type
        stats.byType[question.question_type] = (stats.byType[question.question_type] || 0) + 1;
        
        // Count by difficulty
        stats.byDifficulty[question.difficulty_level] = (stats.byDifficulty[question.difficulty_level] || 0) + 1;
        
        // Count by category
        stats.byCategory[question.category] = (stats.byCategory[question.category] || 0) + 1;
        
        // Count active/inactive
        if (question.is_active) {
          stats.active++;
        } else {
          stats.inactive++;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error fetching question stats:', error);
      throw error;
    }
  }

  // Create answer option
  static async createAnswerOption(questionId: string, optionData: CreateAnswerOption): Promise<AnswerOption> {
    try {
      const insertData = {
        question_id: questionId,
        option_text: optionData.option_text,
        is_correct: optionData.is_correct,
        order_index: optionData.order_index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('answer_options')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to create answer option: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Error creating answer option:', error);
      throw error;
    }
  }

  // Update answer option
  static async updateAnswerOption(id: string, updates: Partial<CreateAnswerOption>): Promise<AnswerOption> {
    try {
      const { data, error } = await supabase
        .from('answer_options')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating answer option:', error);
      throw error;
    }
  }

  // Delete answer option
  static async deleteAnswerOption(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('answer_options')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error deleting answer option:', error);
      throw error;
    }
  }

  // Bulk operations on questions
  static async bulkQuestionOperation(operation: BulkQuestionOperation): Promise<{
    success: boolean;
    message: string;
    stats: { processed: number; successful: number; failed: number };
  }> {
    try {
      let processed = 0;
      let successful = 0;
      let failed = 0;

      for (const questionId of operation.question_ids) {
        try {
          let updateData: UpdateQuestion = {};
          
          switch (operation.operation) {
            case 'activate':
              updateData = { is_active: true };
              break;
            case 'deactivate':
              updateData = { is_active: false };
              break;
            case 'delete':
              await this.deleteQuestion(questionId);
              break;
            case 'change_category':
              if (operation.value) {
                updateData = { category: operation.value as any };
              }
              break;
            case 'change_difficulty':
              if (operation.value) {
                updateData = { difficulty_level: operation.value as any };
              }
              break;
          }

          if (Object.keys(updateData).length > 0) {
            await this.updateQuestion(questionId, updateData);
          }

          successful++;
        } catch (error) {
          console.error(`Error processing question ${questionId}:`, error);
          failed++;
        }
        processed++;
      }

      return {
        success: true,
        message: `Bulk operation completed. ${successful} successful, ${failed} failed.`,
        stats: { processed, successful, failed }
      };
    } catch (error) {
      console.error('Error in bulk question operation:', error);
      return {
        success: false,
        message: `Bulk operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stats: { processed: 0, successful: 0, failed: 0 }
      };
    }
  }

  // Upload questions from CSV/Excel format
  static async uploadQuestions(questions: QuestionImportFormat[]): Promise<QuestionUploadResult> {
    try {
      const result: QuestionUploadResult = {
        success: true,
        message: 'Questions uploaded successfully',
        stats: {
          totalProcessed: questions.length,
          successful: 0,
          failed: 0,
          errors: []
        }
      };

      // Process questions in batches to avoid overwhelming the database
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < questions.length; i += batchSize) {
        batches.push(questions.slice(i, i + batchSize));
      }

      for (const [batchIndex, batch] of batches.entries()) {
        for (const [index, questionData] of batch.entries()) {
          const globalIndex = batchIndex * batchSize + index;
          
          try {
            // Validate question data
            const validation = this.validateQuestionData(questionData);
            if (!validation.isValid) {
              result.stats.failed++;
              result.stats.errors.push(`Question ${globalIndex + 1}: ${validation.errors.join(', ')}`);
              continue;
            }

            // Create question
            const question = await this.createQuestion({
              question_text: questionData.question_text,
              question_text_en: questionData.question_text_en,
              question_type: questionData.question_type as any,
              difficulty_level: questionData.difficulty_level as any,
              category: questionData.category as any,
              points: questionData.points,
              time_limit_seconds: questionData.time_limit_seconds,
              explanation: questionData.explanation,
              tags: questionData.tags ? questionData.tags.split(',').map(t => t.trim()) : undefined,
              test_type: questionData.test_type as any,
              correct_answer: questionData.correct_answer,
              option_a: questionData.option_a,
              option_a_en: questionData.option_a_en,
              option_b: questionData.option_b,
              option_b_en: questionData.option_b_en,
              option_c: questionData.option_c,
              option_c_en: questionData.option_c_en,
              option_d: questionData.option_d,
              option_d_en: questionData.option_d_en,
            });

            // Create answer options for multiple choice questions
            if (questionData.question_type === 'multiple_choice') {
              const options = [
                { text: questionData.option_a, isCorrect: questionData.correct_answer === 'A' },
                { text: questionData.option_b, isCorrect: questionData.correct_answer === 'B' },
                { text: questionData.option_c, isCorrect: questionData.correct_answer === 'C' },
                { text: questionData.option_d, isCorrect: questionData.correct_answer === 'D' },
              ].filter(opt => opt.text && opt.text.trim() !== '');

              // Create all options in parallel
              const optionPromises = options.map((opt, i) => 
                this.createAnswerOption(question.id, {
                  option_text: opt.text!,
                  is_correct: opt.isCorrect,
                  order_index: i + 1,
                })
              );

              await Promise.all(optionPromises);
            }

            result.stats.successful++;
            } catch (error) {
            result.stats.failed++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            result.stats.errors.push(`Question ${globalIndex + 1}: ${errorMessage}`);
            console.error(`Error processing question ${globalIndex + 1}:`, error);
          }
        }
      }

      if (result.stats.failed > 0) {
        result.success = result.stats.successful > 0;
        result.message = `Upload completed: ${result.stats.successful} successful, ${result.stats.failed} failed`;
      }

      return result;
    } catch (error) {
      console.error('Error uploading questions:', error);
      return {
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        stats: {
          totalProcessed: 0,
          successful: 0,
          failed: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      };
    }
  }

  // Validate question data
  private static validateQuestionData(data: QuestionImportFormat): QuestionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.question_text || data.question_text.trim().length === 0) {
      errors.push('Question text is required');
    }

    if (!data.question_type || !['multiple_choice', 'true_false', 'short_answer', 'essay'].includes(data.question_type)) {
      errors.push('Valid question type is required');
    }

    if (!data.difficulty_level || !['easy', 'medium', 'hard'].includes(data.difficulty_level)) {
      errors.push('Valid difficulty level is required');
    }

    if (!data.category || !['basic_life_support', 'first_aid', 'emergency_response', 'medical_knowledge', 'general'].includes(data.category)) {
      errors.push('Valid category is required');
    }

    if (!data.points || data.points <= 0) {
      errors.push('Points must be a positive number');
    }

    if (data.question_type === 'multiple_choice') {
      if (!data.correct_answer || !['A', 'B', 'C', 'D'].includes(data.correct_answer)) {
        errors.push('Correct answer (A, B, C, or D) is required for multiple choice questions');
      }
      if (!data.option_a || !data.option_b) {
        errors.push('At least options A and B are required for multiple choice questions');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Get questions by course session
  static async getQuestionsByCourseSession(courseSessionId: string): Promise<Question[]> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('course_session_id', courseSessionId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch questions by course session: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching questions by course session:', error);
      throw error;
    }
  }

  // Get random questions for quiz
  static async getRandomQuestions(count: number, filters?: QuestionFilters): Promise<Question[]> {
    try {
      let query = supabase
        .from('questions')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters?.question_type) {
        query = query.eq('question_type', filters.question_type);
      }
      if (filters?.difficulty_level) {
        query = query.eq('difficulty_level', filters.difficulty_level);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.course_session_id) {
        query = query.eq('course_session_id', filters.course_session_id);
      }

      const { data, error } = await query.limit(count);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to fetch random questions: ${error.message}`);
      }

      // Shuffle the results
      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    } catch (error) {
      console.error('Error fetching random questions:', error);
      throw error;
    }
  }
}
