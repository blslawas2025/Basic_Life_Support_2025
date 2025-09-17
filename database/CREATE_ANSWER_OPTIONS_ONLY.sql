-- Quick script to create only the answer_options table
-- Run this in your Supabase SQL editor if you only need the answer_options table

-- Create answer_options table
CREATE TABLE IF NOT EXISTS public.answer_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_text_en TEXT, -- English translation of the option
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_answer_options_question_id ON public.answer_options(question_id);
CREATE INDEX IF NOT EXISTS idx_answer_options_is_correct ON public.answer_options(is_correct);
CREATE INDEX IF NOT EXISTS idx_answer_options_order_index ON public.answer_options(order_index);

-- Enable Row Level Security (RLS)
ALTER TABLE public.answer_options ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read answer options" ON public.answer_options
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert answer options" ON public.answer_options
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update answer options" ON public.answer_options
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete answer options" ON public.answer_options
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to automatically update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_answer_options_updated_at
    BEFORE UPDATE ON public.answer_options
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Verify table creation
SELECT 'Answer options table created successfully' as status;
