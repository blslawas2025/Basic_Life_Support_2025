// TypeScript interfaces for Question management
// This matches the Supabase questions table structure

// Question interface matching the Supabase table structure
export interface Question {
  id: string;
  question_text: string;
  question_text_en: string | null;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  difficulty_level: 'easy' | 'medium' | 'hard';
  category: 'basic_life_support' | 'first_aid' | 'emergency_response' | 'medical_knowledge' | 'general';
  points: number;
  time_limit_seconds: number | null;
  explanation: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  tags: string[] | null;
  course_session_id: string | null;
  test_type: 'pre_test' | 'post_test' | null;
  question_set: string | null;
  correct_answer: string | null;
  option_a: string | null;
  option_a_en: string | null;
  option_b: string | null;
  option_b_en: string | null;
  option_c: string | null;
  option_c_en: string | null;
  option_d: string | null;
  option_d_en: string | null;
}

// Interface for creating a new question
export interface CreateQuestion {
  question_text: string;
  question_text_en?: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  difficulty_level: 'easy' | 'medium' | 'hard';
  category: 'basic_life_support' | 'first_aid' | 'emergency_response' | 'medical_knowledge' | 'general';
  points: number;
  time_limit_seconds?: number;
  explanation?: string;
  is_active?: boolean;
  tags?: string[];
  course_session_id?: string;
  test_type?: 'pre_test' | 'post_test';
  question_set?: string;
  correct_answer?: string;
  option_a?: string;
  option_a_en?: string;
  option_b?: string;
  option_b_en?: string;
  option_c?: string;
  option_c_en?: string;
  option_d?: string;
  option_d_en?: string;
}

// Interface for updating a question
export interface UpdateQuestion {
  question_text?: string;
  question_type?: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  difficulty_level?: 'easy' | 'medium' | 'hard';
  category?: 'basic_life_support' | 'first_aid' | 'emergency_response' | 'medical_knowledge' | 'general';
  points?: number;
  time_limit_seconds?: number;
  explanation?: string;
  is_active?: boolean;
  tags?: string[];
  course_session_id?: string;
  test_type?: 'pre_test' | 'post_test';
  question_set?: string;
}

// Answer option interface for multiple choice questions
export interface AnswerOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Interface for creating answer options
export interface CreateAnswerOption {
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

// Complete question with answer options
export interface QuestionWithOptions extends Question {
  answer_options: AnswerOption[];
}

// Question statistics interface
export interface QuestionStats {
  total: number;
  byType: Record<string, number>;
  byDifficulty: Record<string, number>;
  byCategory: Record<string, number>;
  active: number;
  inactive: number;
}

// Question upload result interface
export interface QuestionUploadResult {
  success: boolean;
  message: string;
  stats: {
    totalProcessed: number;
    successful: number;
    failed: number;
    errors: string[];
  };
}

// Question search filters
export interface QuestionFilters {
  question_type?: string;
  difficulty_level?: string;
  category?: string;
  is_active?: boolean;
  course_session_id?: string;
  search_term?: string;
}

// Question bulk operations
export interface BulkQuestionOperation {
  question_ids: string[];
  operation: 'activate' | 'deactivate' | 'delete' | 'change_category' | 'change_difficulty';
  value?: string;
}

// Question import/export formats
export interface QuestionImportFormat {
  question_text: string;
  question_text_en?: string; // English question text for bilingual support
  question_type: string;
  difficulty_level: string;
  category: string;
  points: number;
  time_limit_seconds?: number;
  explanation?: string;
  correct_answer?: string;
  option_a?: string;
  option_a_en?: string; // English option A for bilingual support
  option_b?: string;
  option_b_en?: string; // English option B for bilingual support
  option_c?: string;
  option_c_en?: string; // English option C for bilingual support
  option_d?: string;
  option_d_en?: string; // English option D for bilingual support
  tags?: string;
  test_type?: string;
  question_set?: string;
}

// Processed question for upload screen
export interface ProcessedQuestion extends QuestionImportFormat {
  id: string;
  isEdited: boolean;
  validation: QuestionValidationResult;
}

// Question validation result
export interface QuestionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
