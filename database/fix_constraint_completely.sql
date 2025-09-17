-- Complete fix for choking checklists constraint
-- This script removes constraint, adds data, then adds constraint back

-- Step 1: Drop the existing constraint completely
ALTER TABLE checklist_item DROP CONSTRAINT IF EXISTS checklist_item_section_check;

-- Step 2: Delete all existing choking data
DELETE FROM checklist_item WHERE checklist_type IN ('adult choking', 'infant choking');

-- Step 3: Insert Adult Choking data (without constraint)
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

-- Step 4: Insert Infant Choking data (without constraint)
INSERT INTO checklist_item (checklist_type, section, item, is_compulsory, order_index) VALUES
-- ASSESS SEVERITY section
('infant choking', 'assess severity', 'Check if infant can cry or make sounds', true, 1),
('infant choking', 'assess severity', 'Mild - effective cough', false, 2),
('infant choking', 'assess severity', 'Severe - ineffective cough, no sound', true, 3),

-- MILD CHOKING section
('infant choking', 'mild choking', 'Encourage the infant to cough', true, 4),

-- SEVERE CHOKING section
('infant choking', 'severe choking', 'Support head and neck with one hand', true, 5),
('infant choking', 'severe choking', 'Place infant face down on your forearm', true, 6),
('infant choking', 'severe choking', 'Give 5 back blows between shoulder blades', true, 7),
('infant choking', 'severe choking', 'Turn infant over, support head and neck', true, 8),
('infant choking', 'severe choking', 'Give 5 chest thrusts:', true, 9),
('infant choking', 'severe choking', 'i. Place 2 fingers on center of chest', true, 10),
('infant choking', 'severe choking', 'ii. Press down 1.5 inches (1/3 depth of chest)', true, 11),
('infant choking', 'severe choking', 'Continue alternating 5 back blows with 5 chest thrusts until object is expelled', true, 12),
('infant choking', 'severe choking', 'If infant becomes unconscious, start infant CPR', true, 13),

-- VICTIM UNCONSCIOUS section
('infant choking', 'victim unconscious', 'Start infant CPR', true, 14),
('infant choking', 'victim unconscious', 'During airway opening, check for foreign body, do not perform a blind finger sweep', true, 15);

-- Step 5: Now add the constraint back with all the correct sections
ALTER TABLE checklist_item ADD CONSTRAINT checklist_item_section_check CHECK (
  (checklist_type IN ('one man cpr', 'two man cpr', 'infant cpr') AND 
   section IN ('danger', 'respons', 'shout for help', 'airway', 'breathing', 'circulation', 'defribillation'))
  OR
  (checklist_type = 'adult choking' AND 
   section IN ('assess severity', 'mild choking', 'severe choking', 'victim unconscious'))
  OR
  (checklist_type = 'infant choking' AND 
   section IN ('assess severity', 'mild choking', 'severe choking', 'victim unconscious'))
);

-- Step 6: Verify everything worked
SELECT 
  checklist_type, 
  section, 
  COUNT(*) as item_count
FROM checklist_item 
WHERE checklist_type IN ('adult choking', 'infant choking')
GROUP BY checklist_type, section 
ORDER BY checklist_type, section;
