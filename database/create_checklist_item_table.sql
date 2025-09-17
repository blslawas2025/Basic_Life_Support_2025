-- Create checklist_item table for CPR and choking procedures
CREATE TABLE IF NOT EXISTS checklist_item (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_type TEXT NOT NULL CHECK (checklist_type IN (
    'one man cpr',
    'two man cpr', 
    'infant cpr',
    'adult choking',
    'infant choking'
  )),
  section TEXT NOT NULL CHECK (section IN (
    'danger',
    'respons',
    'shout for help',
    'airway',
    'breathing',
    'circulation',
    'defribillation'
  )),
  item TEXT NOT NULL,
  is_compulsory BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checklist_item_type ON checklist_item(checklist_type);
CREATE INDEX IF NOT EXISTS idx_checklist_item_section ON checklist_item(section);
CREATE INDEX IF NOT EXISTS idx_checklist_item_type_section ON checklist_item(checklist_type, section);
CREATE INDEX IF NOT EXISTS idx_checklist_item_order ON checklist_item(checklist_type, order_index);

-- Enable Row Level Security
ALTER TABLE checklist_item ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON checklist_item
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert sample data for One Man CPR
INSERT INTO checklist_item (checklist_type, section, item, is_compulsory, order_index) VALUES
('one man cpr', 'danger', 'Check for danger to yourself and the victim', true, 1),
('one man cpr', 'respons', 'Check for response - tap shoulders and shout', true, 2),
('one man cpr', 'shout for help', 'Shout for help or call emergency services', true, 3),
('one man cpr', 'airway', 'Open airway using head-tilt chin-lift maneuver', true, 4),
('one man cpr', 'breathing', 'Check for breathing for 10 seconds', true, 5),
('one man cpr', 'circulation', 'Start chest compressions at 100-120 per minute', true, 6),
('one man cpr', 'circulation', 'Compress chest 2 inches deep', true, 7),
('one man cpr', 'breathing', 'Give 2 rescue breaths after 30 compressions', true, 8),
('one man cpr', 'defribillation', 'Use AED if available and follow prompts', false, 9);

-- Insert sample data for Two Man CPR
INSERT INTO checklist_item (checklist_type, section, item, is_compulsory, order_index) VALUES
('two man cpr', 'danger', 'Check for danger to yourself and the victim', true, 1),
('two man cpr', 'respons', 'Check for response - tap shoulders and shout', true, 2),
('two man cpr', 'shout for help', 'One person calls emergency services', true, 3),
('two man cpr', 'airway', 'Open airway using head-tilt chin-lift maneuver', true, 4),
('two man cpr', 'breathing', 'Check for breathing for 10 seconds', true, 5),
('two man cpr', 'circulation', 'First rescuer starts chest compressions', true, 6),
('two man cpr', 'breathing', 'Second rescuer gives rescue breaths', true, 7),
('two man cpr', 'circulation', 'Switch roles every 2 minutes', true, 8),
('two man cpr', 'defribillation', 'Use AED if available and follow prompts', false, 9);

-- Insert sample data for Infant CPR
INSERT INTO checklist_item (checklist_type, section, item, is_compulsory, order_index) VALUES
('infant cpr', 'danger', 'Check for danger to yourself and the infant', true, 1),
('infant cpr', 'respons', 'Check for response - tap feet and shout', true, 2),
('infant cpr', 'shout for help', 'Shout for help or call emergency services', true, 3),
('infant cpr', 'airway', 'Open airway using head-tilt chin-lift maneuver', true, 4),
('infant cpr', 'breathing', 'Check for breathing for 10 seconds', true, 5),
('infant cpr', 'circulation', 'Start chest compressions with 2 fingers', true, 6),
('infant cpr', 'circulation', 'Compress chest 1.5 inches deep', true, 7),
('infant cpr', 'breathing', 'Give 2 gentle rescue breaths after 30 compressions', true, 8);

-- Insert sample data for Adult Choking
INSERT INTO checklist_item (checklist_type, section, item, is_compulsory, order_index) VALUES
('adult choking', 'danger', 'Check for danger to yourself and the victim', true, 1),
('adult choking', 'respons', 'Ask "Are you choking?" and check for response', true, 2),
('adult choking', 'shout for help', 'Call emergency services immediately', true, 3),
('adult choking', 'airway', 'Perform abdominal thrusts (Heimlich maneuver)', true, 4),
('adult choking', 'airway', 'Place hands above navel and pull inward and upward', true, 5),
('adult choking', 'breathing', 'Check if object is expelled', true, 6),
('adult choking', 'circulation', 'If unconscious, start CPR', true, 7);

-- Insert sample data for Infant Choking
INSERT INTO checklist_item (checklist_type, section, item, is_compulsory, order_index) VALUES
('infant choking', 'danger', 'Check for danger to yourself and the infant', true, 1),
('infant choking', 'respons', 'Check if infant can cry or make sounds', true, 2),
('infant choking', 'shout for help', 'Call emergency services immediately', true, 3),
('infant choking', 'airway', 'Support head and neck, place face down on forearm', true, 4),
('infant choking', 'airway', 'Give 5 back blows between shoulder blades', true, 5),
('infant choking', 'breathing', 'Turn infant over, check if object is expelled', true, 6),
('infant choking', 'circulation', 'If unconscious, start infant CPR', true, 7);
