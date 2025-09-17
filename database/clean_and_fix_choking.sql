-- Complete cleanup and fix for choking checklists
-- This script removes all existing data and applies the correct structure

-- Step 1: Drop the existing constraint
ALTER TABLE checklist_item DROP CONSTRAINT IF EXISTS checklist_item_section_check;

-- Step 2: Delete ALL existing choking data to start fresh
DELETE FROM checklist_item WHERE checklist_type IN ('adult choking', 'infant choking');

-- Step 3: Add the new constraint with correct sections
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

-- Step 4: Insert the correct Adult Choking data
INSERT INTO checklist_item (checklist_type, section, item, is_compulsory, order_index) VALUES
-- ASSESS SEVERITY section
('adult choking', 'assess severity', 'Ask: Are you choking? Are you ok?', true, 1),
('adult choking', 'assess severity', 'Mild - effective cough', false, 2),
('adult choking', 'assess severity', 'Severe - the cough becomes ineffective', true, 3),

-- MILD CHOKING section
('adult choking', 'mild choking', 'Encourage the victim to cough', true, 4),

-- SEVERE CHOKING section
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

-- VICTIM UNCONSCIOUS section
('adult choking', 'victim unconscious', 'Start CPR', true, 15),
('adult choking', 'victim unconscious', 'During airway opening, check for foreign body, do not perform a blind finger sweep.', true, 16);

-- Step 5: Insert the correct Infant Choking data (keeping original structure for now)
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

-- Step 6: Verify the data
SELECT 
  checklist_type, 
  section, 
  COUNT(*) as item_count,
  STRING_AGG(item, ' | ' ORDER BY order_index) as items
FROM checklist_item 
WHERE checklist_type IN ('adult choking', 'infant choking')
GROUP BY checklist_type, section 
ORDER BY checklist_type, section;
