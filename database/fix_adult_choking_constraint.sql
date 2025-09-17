-- Fix the check constraint to include the new adult choking sections
-- The constraint is rejecting "assess severity" because it's not in the allowed list

-- First, drop the existing constraint
ALTER TABLE checklist_item DROP CONSTRAINT IF EXISTS checklist_item_section_check;

-- Add the corrected constraint with all valid sections
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

-- Now insert the adult choking data
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

-- Verify the data was inserted correctly
SELECT checklist_type, section, COUNT(*) as item_count
FROM checklist_item 
WHERE checklist_type = 'adult choking'
GROUP BY checklist_type, section 
ORDER BY checklist_type, section;
