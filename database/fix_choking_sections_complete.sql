-- Complete fix for choking checklist sections
-- This script ensures choking checklists use the correct sections and updates all existing data

-- First, drop the constraint to allow updates
ALTER TABLE checklist_item DROP CONSTRAINT IF EXISTS checklist_item_section_check;

-- Delete all existing choking data
DELETE FROM checklist_item WHERE checklist_type IN ('adult choking', 'infant choking');

-- Re-add the constraint with correct sections
ALTER TABLE checklist_item ADD CONSTRAINT checklist_item_section_check 
CHECK (section IN (
  'danger',
  'respons', 
  'shout for help',
  'airway',
  'breathing',
  'circulation',
  'defribillation',
  'assess severity',
  'mild choking',
  'severe choking',
  'victim unconscious'
));

-- Insert correct adult choking data
INSERT INTO checklist_item (checklist_type, section, item, is_compulsory, order_index) VALUES
-- 1. Assess the severity
('adult choking', 'assess severity', 'Ask: Are you choking? Are you ok?', false, 1),
('adult choking', 'assess severity', 'Mild - effective cough', false, 2),
('adult choking', 'assess severity', 'Severe - the cough becomes ineffective', false, 3),

-- 2. Mild choking
('adult choking', 'mild choking', 'a. Encourage the victim to cough', false, 4),

-- 3. Severe choking
('adult choking', 'severe choking', 'a. Give 5 back blows:', false, 5),
('adult choking', 'severe choking', 'i. Lean the victim forwards.', false, 6),
('adult choking', 'severe choking', 'ii. Apply blows between the shoulder blades using the heel of one hand', false, 7),
('adult choking', 'severe choking', 'b. If back blows are ineffective, give 5 abdominal thrusts:', false, 8),
('adult choking', 'severe choking', 'i. Stand behind the victim and put both your arms around the upper part of the victim''s abdomen.', false, 9),
('adult choking', 'severe choking', 'ii. Lean the victim forwards.', false, 10),
('adult choking', 'severe choking', 'iii. Clench your fist and place it between the umbilicus (navel) and the ribcage.', false, 11),
('adult choking', 'severe choking', 'iv. Grasp your fist with the other hand and pull sharply inwards and upwards.', false, 12),
('adult choking', 'severe choking', 'c. Continue alternating 5 back blows with 5 abdominal thrusts until it is relieved, or the victim becomes unconscious.', false, 13),
('adult choking', 'severe choking', 'd. Perform chest thrust for pregnant and very obese victims', false, 14),

-- 4. Victim unconscious
('adult choking', 'victim unconscious', 'a. Start CPR', false, 15),
('adult choking', 'victim unconscious', '-During airway opening, check for foreign body, do not perform a blind finger sweep.', false, 16);

-- Insert correct infant choking data
INSERT INTO checklist_item (checklist_type, section, item, is_compulsory, order_index) VALUES
-- 1. Assess the severity
('infant choking', 'assess severity', 'Mild:', false, 1),
('infant choking', 'assess severity', 'coughing effectively (fully responsive, loud cough, taking a breath before coughing), still crying, or speaking', false, 2),
('infant choking', 'assess severity', 'Severe:', false, 3),
('infant choking', 'assess severity', '- ineffective cough, inability to cough, decreasing consciousness, inability to breathe or vocalise, cyanosis.', false, 4),

-- 2. Mild choking
('infant choking', 'mild choking', 'a Encourage the child to cough and continue monitoring the child''s condition', false, 5),

-- 3. Severe choking
('infant choking', 'severe choking', 'a Ask for help', false, 6),
('infant choking', 'severe choking', 'i. second rescuer should call MERS 999, preferably by mobile phone (speaker function).', false, 7),
('infant choking', 'severe choking', 'ii. A single trained rescuer should first proceed with rescue manoeuvres (unless able to call simultaneously with the speaker function activated)', false, 8),
('infant choking', 'severe choking', 'b Perform 5 back blows and followed with 5 chest thrusts', false, 9),
('infant choking', 'severe choking', 'Back Blows', false, 10),
('infant choking', 'severe choking', 'i. Support the infant in a head-downwards, prone position by placing the thumb of one hand at the angle of the lower jaw. Deliver up to 5 sharp back blows with the heel of one hand in the middle of the back between the shoulder blades.', false, 11),
('infant choking', 'severe choking', 'Chest Thrust', false, 12),
('infant choking', 'severe choking', 'i. Turn the infant into a head-downwards supine position and place free arm along the infant''s back and encircling the occiput with your hand.', false, 13),
('infant choking', 'severe choking', 'ii. Place two fingers of the free hand on the lower half of the infant''s sternum (in the same position as for chest compression during CPR).', false, 14),
('infant choking', 'severe choking', 'iii. Deliver up to 5 chest thrusts. These are similar to chest compressions but sharper and delivered at a slower rate.', false, 15),
('infant choking', 'severe choking', 'iv. Continue alternating 5 back blows with 5 chest thrusts until the obstruction is relieved or the infant becomes unconscious.', false, 16),

-- 4. Victim unconscious
('infant choking', 'victim unconscious', 'a. Start CPR', false, 17),
('infant choking', 'victim unconscious', '-During airway opening, check for foreign body, do not perform a blind finger sweep.', false, 18);

-- Verify the data
SELECT 
  checklist_type,
  section,
  COUNT(*) as item_count
FROM checklist_item 
WHERE checklist_type IN ('adult choking', 'infant choking')
GROUP BY checklist_type, section
ORDER BY checklist_type, section;
