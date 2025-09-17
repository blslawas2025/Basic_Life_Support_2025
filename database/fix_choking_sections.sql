-- Fix choking checklist sections to match actual choking procedures
-- This script updates the database to allow choking-specific sections

-- First, let's drop the existing check constraint on section
ALTER TABLE checklist_item DROP CONSTRAINT IF EXISTS checklist_item_section_check;

-- Add a new check constraint that allows different sections based on checklist type
-- For CPR checklists: danger, respons, shout for help, airway, breathing, circulation, defribillation
-- For choking checklists: danger, respons, airway, breathing (choking-specific)
ALTER TABLE checklist_item ADD CONSTRAINT checklist_item_section_check CHECK (
  (checklist_type IN ('one man cpr', 'two man cpr', 'infant cpr') AND 
   section IN ('danger', 'respons', 'shout for help', 'airway', 'breathing', 'circulation', 'defribillation'))
  OR
  (checklist_type IN ('adult choking', 'infant choking') AND 
   section IN ('danger', 'respons', 'airway', 'breathing'))
);

-- Now let's update the existing choking checklist items to use the correct sections
-- First, delete the existing choking data
DELETE FROM checklist_item WHERE checklist_type IN ('adult choking', 'infant choking');

-- Insert correct Adult Choking data based on the image
INSERT INTO checklist_item (checklist_type, section, item, is_compulsory, order_index) VALUES
-- DANGER section
('adult choking', 'danger', 'Assess the severity: Ask: Are you choking? Are you ok?', true, 1),
('adult choking', 'danger', 'Mild - effective cough', false, 2),
('adult choking', 'danger', 'Severe - the cough becomes ineffective', true, 3),

-- RESPONS section  
('adult choking', 'respons', 'Mild choking: a. Encourage the victim to cough', true, 4),

-- AIRWAY section
('adult choking', 'airway', 'Severe choking: a. Give 5 back blows:', true, 5),
('adult choking', 'airway', 'i. Lean the victim forwards.', true, 6),
('adult choking', 'airway', 'ii. Apply blows between the shoulder blades using the heel of one hand', true, 7),

-- BREATHING section
('adult choking', 'breathing', 'If back blows fail, give 5 abdominal thrusts:', true, 8),
('adult choking', 'breathing', 'i. Stand behind the victim', true, 9),
('adult choking', 'breathing', 'ii. Place hands above the navel', true, 10),
('adult choking', 'breathing', 'iii. Pull inward and upward', true, 11),
('adult choking', 'breathing', 'Continue until object is expelled or victim becomes unconscious', true, 12),
('adult choking', 'breathing', 'If victim becomes unconscious, start CPR', true, 13);

-- Insert correct Infant Choking data
INSERT INTO checklist_item (checklist_type, section, item, is_compulsory, order_index) VALUES
-- DANGER section
('infant choking', 'danger', 'Assess the severity: Check if infant can cry or make sounds', true, 1),
('infant choking', 'danger', 'Mild - effective cough', false, 2),
('infant choking', 'danger', 'Severe - ineffective cough, no sound', true, 3),

-- RESPONS section
('infant choking', 'respons', 'Mild choking: Encourage coughing', true, 4),

-- AIRWAY section
('infant choking', 'airway', 'Severe choking: Support head and neck', true, 5),
('infant choking', 'airway', 'Place infant face down on your forearm', true, 6),
('infant choking', 'airway', 'Give 5 back blows between shoulder blades', true, 7),

-- BREATHING section
('infant choking', 'breathing', 'Turn infant over, check if object is expelled', true, 8),
('infant choking', 'breathing', 'If back blows fail, give 5 chest thrusts:', true, 9),
('infant choking', 'breathing', 'i. Support head and neck', true, 10),
('infant choking', 'breathing', 'ii. Place 2 fingers on center of chest', true, 11),
('infant choking', 'breathing', 'iii. Press down 1.5 inches', true, 12),
('infant choking', 'breathing', 'Continue until object is expelled or infant becomes unconscious', true, 13),
('infant choking', 'breathing', 'If infant becomes unconscious, start infant CPR', true, 14);

-- Create a function to get valid sections for each checklist type
CREATE OR REPLACE FUNCTION get_valid_sections(checklist_type_param TEXT)
RETURNS TEXT[] AS $$
BEGIN
  CASE checklist_type_param
    WHEN 'one man cpr', 'two man cpr', 'infant cpr' THEN
      RETURN ARRAY['danger', 'respons', 'shout for help', 'airway', 'breathing', 'circulation', 'defribillation'];
    WHEN 'adult choking', 'infant choking' THEN
      RETURN ARRAY['danger', 'respons', 'airway', 'breathing'];
    ELSE
      RETURN ARRAY[]::TEXT[];
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Add a comment explaining the new structure
COMMENT ON TABLE checklist_item IS 'Checklist items for CPR and choking procedures. Sections vary by checklist type: CPR uses danger, respons, shout for help, airway, breathing, circulation, defribillation. Choking uses danger, respons, airway, breathing.';
