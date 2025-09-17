-- Create questions table for Basic Life Support system
-- This table supports bilingual questions (Malay and English)

CREATE TABLE IF NOT EXISTS public.questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Question content (bilingual support)
    question_text TEXT NOT NULL,
    question_text_en TEXT,
    
    -- Question metadata
    question_type VARCHAR(50) DEFAULT 'multiple_choice',
    difficulty_level VARCHAR(20) DEFAULT 'easy',
    category VARCHAR(100) DEFAULT 'basic_life_support',
    points INTEGER DEFAULT 10,
    time_limit_seconds INTEGER DEFAULT 30,
    
    -- Correct answer and options (bilingual support)
    correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    option_a TEXT,
    option_a_en TEXT,
    option_b TEXT,
    option_b_en TEXT,
    option_c TEXT,
    option_c_en TEXT,
    option_d TEXT,
    option_d_en TEXT,
    
    -- Additional fields
    explanation TEXT,
    is_active BOOLEAN DEFAULT true,
    tags TEXT[],
    test_type VARCHAR(20) DEFAULT 'pre_test' CHECK (test_type IN ('pre_test', 'post_test')),
    
    -- Course session relationship
    course_session_id UUID REFERENCES public.course_sessions(id) ON DELETE SET NULL,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_questions_test_type ON public.questions(test_type);
CREATE INDEX IF NOT EXISTS idx_questions_course_session ON public.questions(course_session_id);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON public.questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read questions
CREATE POLICY "Allow authenticated users to read questions" ON public.questions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert questions
CREATE POLICY "Allow authenticated users to insert questions" ON public.questions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update questions
CREATE POLICY "Allow authenticated users to update questions" ON public.questions
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete questions
CREATE POLICY "Allow authenticated users to delete questions" ON public.questions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE public.questions IS 'Stores questions for the Basic Life Support training system with bilingual support';
COMMENT ON COLUMN public.questions.question_text IS 'Question text in Malay (primary language)';
COMMENT ON COLUMN public.questions.question_text_en IS 'Question text in English (secondary language)';
COMMENT ON COLUMN public.questions.correct_answer IS 'Correct answer choice (A, B, C, or D)';
COMMENT ON COLUMN public.questions.option_a IS 'Option A text in Malay';
COMMENT ON COLUMN public.questions.option_a_en IS 'Option A text in English';
COMMENT ON COLUMN public.questions.test_type IS 'Type of test: pre_test or post_test';
COMMENT ON COLUMN public.questions.tags IS 'Array of tags for question categorization';
