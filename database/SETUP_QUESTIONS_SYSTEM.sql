-- Complete setup script for Questions system
-- Run this script in your Supabase SQL editor

-- ==============================================
-- 1. CREATE QUESTIONS TABLE
-- ==============================================

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

-- ==============================================
-- 2. CREATE INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON public.questions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_questions_test_type ON public.questions(test_type);
CREATE INDEX IF NOT EXISTS idx_questions_course_session ON public.questions(course_session_id);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON public.questions(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions(created_at);

-- ==============================================
-- 3. CREATE UPDATE TRIGGER
-- ==============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ==============================================

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read questions" ON public.questions;
DROP POLICY IF EXISTS "Allow authenticated users to insert questions" ON public.questions;
DROP POLICY IF EXISTS "Allow authenticated users to update questions" ON public.questions;
DROP POLICY IF EXISTS "Allow authenticated users to delete questions" ON public.questions;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read questions" ON public.questions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert questions" ON public.questions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update questions" ON public.questions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete questions" ON public.questions
    FOR DELETE USING (auth.role() = 'authenticated');

-- ==============================================
-- 5. ADD COMMENTS
-- ==============================================

COMMENT ON TABLE public.questions IS 'Stores questions for the Basic Life Support training system with bilingual support';
COMMENT ON COLUMN public.questions.question_text IS 'Question text in Malay (primary language)';
COMMENT ON COLUMN public.questions.question_text_en IS 'Question text in English (secondary language)';
COMMENT ON COLUMN public.questions.correct_answer IS 'Correct answer choice (A, B, C, or D)';
COMMENT ON COLUMN public.questions.option_a IS 'Option A text in Malay';
COMMENT ON COLUMN public.questions.option_a_en IS 'Option A text in English';
COMMENT ON COLUMN public.questions.test_type IS 'Type of test: pre_test or post_test';
COMMENT ON COLUMN public.questions.tags IS 'Array of tags for question categorization';

-- ==============================================
-- 6. INSERT SAMPLE QUESTIONS
-- ==============================================

-- Clear existing sample data (optional - remove if you want to keep existing data)
-- DELETE FROM public.questions WHERE created_by IS NULL;

-- Insert sample questions based on NCORT standards
INSERT INTO public.questions (
    question_text,
    question_text_en,
    question_type,
    difficulty_level,
    category,
    points,
    time_limit_seconds,
    correct_answer,
    option_a,
    option_a_en,
    option_b,
    option_b_en,
    option_c,
    option_c_en,
    option_d,
    option_d_en,
    explanation,
    test_type,
    tags
) VALUES 
-- Question 1
(
    'Udara atmosfera mengandungi oksigen sebanyak :-',
    'Atmospheric air contains oxygen at approximately :-',
    'multiple_choice',
    'easy',
    'basic_life_support',
    10,
    30,
    'A',
    '21%',
    '21%',
    '16%',
    '16%',
    '12%',
    '12%',
    '8%',
    '8%',
    'Udara atmosfera mengandungi 21% oksigen, 78% nitrogen dan 1% gas lain.',
    'pre_test',
    ARRAY['oxygen', 'atmosphere', 'basic']
),

-- Question 2
(
    'Udara yang dihembus dari paru-paru seseorang semasa melakukan CPR mengandungi oksigen sebanyak :-',
    'Air exhaled from the lungs during CPR contains oxygen at approximately :-',
    'multiple_choice',
    'easy',
    'basic_life_support',
    10,
    30,
    'B',
    '21%',
    '21%',
    '16%',
    '16%',
    '12%',
    '12%',
    '8%',
    '8%',
    'Udara yang dihembus masih mengandungi 16% oksigen, cukup untuk menyelamatkan nyawa.',
    'pre_test',
    ARRAY['cpr', 'oxygen', 'rescue_breathing']
),

-- Question 3
(
    'Apakah yang perlu dilakukan kepada seseorang yang baru lemas di air ?',
    'What should be done to someone who has just drowned in water?',
    'multiple_choice',
    'easy',
    'basic_life_support',
    10,
    30,
    'C',
    'Mengurut perut',
    'Massage the stomach',
    'Menggantung terbalik',
    'Hang upside down',
    'Membuka saluran pernafasan dan memeriksa pernafasan',
    'Open airway and check breathing',
    'Memberi minum air',
    'Give water to drink',
    'Langkah pertama adalah membuka saluran pernafasan dan memeriksa pernafasan.',
    'pre_test',
    ARRAY['drowning', 'airway', 'emergency']
),

-- Question 4
(
    'Berikut adalah faktor- faktor risiko tercekik kecuali :',
    'The following are risk factors for choking except:',
    'multiple_choice',
    'easy',
    'basic_life_support',
    10,
    30,
    'D',
    'Makan terlalu cepat',
    'Eating too fast',
    'Minum alkohol',
    'Drinking alcohol',
    'Mengunyah tidak sempurna',
    'Incomplete chewing',
    'Minum air yang banyak',
    'Drinking plenty of water',
    'Minum air yang banyak bukan faktor risiko tercekik, sebaliknya membantu.',
    'pre_test',
    ARRAY['choking', 'risk_factors', 'prevention']
),

-- Question 5
(
    'Apakah kadar tekanan dada kepada hembusan pernafasan untuk mangsa dewasa ?',
    'What is the ratio of chest compressions to rescue breaths for adult victims?',
    'multiple_choice',
    'easy',
    'basic_life_support',
    10,
    30,
    'A',
    '30:2',
    '30:2',
    '15:2',
    '15:2',
    '5:1',
    '5:1',
    '3:1',
    '3:1',
    'Untuk mangsa dewasa, nisbah yang betul adalah 30 tekanan dada kepada 2 hembusan pernafasan.',
    'pre_test',
    ARRAY['cpr', 'adult', 'ratio', 'compression']
);

-- ==============================================
-- 7. VERIFICATION QUERIES
-- ==============================================

-- Verify table creation
SELECT 'Questions table created successfully' as status;

-- Verify sample data
SELECT 
    COUNT(*) as total_questions,
    COUNT(CASE WHEN test_type = 'pre_test' THEN 1 END) as pre_test_questions,
    COUNT(CASE WHEN test_type = 'post_test' THEN 1 END) as post_test_questions
FROM public.questions;

-- Show sample question
SELECT 
    question_text,
    question_text_en,
    correct_answer,
    option_a,
    option_a_en
FROM public.questions 
LIMIT 1;
