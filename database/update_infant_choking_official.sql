-- Update Infant Choking checklist to match official structure
-- Based on standard infant choking procedures

-- First, delete all existing infant choking data
DELETE FROM checklist_item WHERE checklist_type = 'infant choking';

-- Insert the correct Infant Choking data based on official infant choking procedures
INSERT INTO checklist_item (checklist_type, section, item, is_compulsory, order_index) VALUES

-- 1. ASSESS THE SEVERITY section
('infant choking', 'assess severity', 'Check if infant can cry or make sounds', true, 1),
('infant choking', 'assess severity', 'Mild - effective cough', false, 2),
('infant choking', 'assess severity', 'Severe - ineffective cough, no sound', true, 3),

-- 2. MILD CHOKING section
('infant choking', 'mild choking', 'Encourage the infant to cough', true, 4),

-- 3. SEVERE CHOKING section
('infant choking', 'severe choking', 'Support head and neck with one hand', true, 5),
('infant choking', 'severe choking', 'Place infant face down on your forearm', true, 6),
('infant choking', 'severe choking', 'Give 5 back blows between shoulder blades', true, 7),
('infant choking', 'severe choking', 'Turn infant over, support head and neck', true, 8),
('infant choking', 'severe choking', 'Give 5 chest thrusts:', true, 9),
('infant choking', 'severe choking', 'i. Place 2 fingers on center of chest', true, 10),
('infant choking', 'severe choking', 'ii. Press down 1.5 inches (1/3 depth of chest)', true, 11),
('infant choking', 'severe choking', 'Continue alternating 5 back blows with 5 chest thrusts until object is expelled', true, 12),
('infant choking', 'severe choking', 'If infant becomes unconscious, start infant CPR', true, 13),

-- 4. VICTIM UNCONSCIOUS section
('infant choking', 'victim unconscious', 'Start infant CPR', true, 14),
('infant choking', 'victim unconscious', 'During airway opening, check for foreign body, do not perform a blind finger sweep', true, 15);

-- Update the check constraint to include the new infant choking sections
ALTER TABLE checklist_item DROP CONSTRAINT IF EXISTS checklist_item_section_check;

-- Add new check constraint with correct sections for both choking types
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

-- Verify the data
SELECT 
  checklist_type, 
  section, 
  COUNT(*) as item_count,
  STRING_AGG(item, ' | ' ORDER BY order_index) as items
FROM checklist_item 
WHERE checklist_type IN ('adult choking', 'infant choking')
GROUP BY checklist_type, section 
ORDER BY checklist_type, section;
