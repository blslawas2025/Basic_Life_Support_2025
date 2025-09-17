-- Update Adult Choking checklist to match official structure
-- Based on the official "SKILL TEST FOR ADULT CHOKING" document

-- First, delete all existing adult choking data
DELETE FROM checklist_item WHERE checklist_type = 'adult choking';

-- Insert the correct Adult Choking data based on official checklist
INSERT INTO checklist_item (checklist_type, section, item, is_compulsory, order_index) VALUES

-- 1. ASSESS THE SEVERITY section
('adult choking', 'assess severity', 'Ask: Are you choking? Are you ok?', true, 1),
('adult choking', 'assess severity', 'Mild - effective cough', false, 2),
('adult choking', 'assess severity', 'Severe - the cough becomes ineffective', true, 3),

-- 2. MILD CHOKING section
('adult choking', 'mild choking', 'Encourage the victim to cough', true, 4),

-- 3. SEVERE CHOKING section
('adult choking', 'severe choking', 'Give 5 back blows:', true, 5),
('adult choking', 'severe choking', 'i. Lean the victim forwards.', true, 6),
('adult choking', 'severe choking', 'ii. Apply blows between the shoulder blades using the heel of one hand', true, 7),
('adult choking', 'severe choking', 'If back blows are ineffective, give 5 abdominal thrusts:', true, 8),
('adult choking', 'severe choking', 'i. Stand behind the victim and put both your arms around the upper part of the victim''s abdomen.', true, 9),
('adult choking', 'severe choking', 'ii. Lean the victim forwards.', true, 10),
('adult choking', 'severe choking', 'iii. Clench your fist and place it between the umbilicus (navel) and the ribcage.', true, 11),
('adult choking', 'severe choking', 'iv. Grasp your fist with the other hand and pull sharply inwards and upwards.', true, 12),
('adult choking', 'severe choking', 'Continue alternating 5 back blows with 5 abdominal thrusts until it is relieved, or the victim becomes unconscious.', true, 13),
('adult choking', 'severe choking', 'Perform chest thrust for pregnant and very obese victims', false, 14),

-- 4. VICTIM UNCONSCIOUS section
('adult choking', 'victim unconscious', 'Start CPR', true, 15),
('adult choking', 'victim unconscious', 'During airway opening, check for foreign body, do not perform a blind finger sweep.', true, 16);

-- Update the check constraint to allow the new choking sections
ALTER TABLE checklist_item DROP CONSTRAINT IF EXISTS checklist_item_section_check;

-- Add new check constraint with correct choking sections
ALTER TABLE checklist_item ADD CONSTRAINT checklist_item_section_check CHECK (
  (checklist_type IN ('one man cpr', 'two man cpr', 'infant cpr') AND 
   section IN ('danger', 'respons', 'shout for help', 'airway', 'breathing', 'circulation', 'defribillation'))
  OR
  (checklist_type = 'adult choking' AND 
   section IN ('assess severity', 'mild choking', 'severe choking', 'victim unconscious'))
  OR
  (checklist_type = 'infant choking' AND 
   section IN ('danger', 'respons', 'airway', 'breathing'))
);

-- Verify the data
SELECT checklist_type, section, COUNT(*) as item_count
FROM checklist_item 
WHERE checklist_type = 'adult choking'
GROUP BY checklist_type, section 
ORDER BY checklist_type, section;
