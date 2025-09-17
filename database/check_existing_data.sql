-- Check existing data to identify constraint violations
-- Run this first to see what data exists

-- Check all checklist items by type and section
SELECT 
  checklist_type, 
  section, 
  COUNT(*) as item_count,
  STRING_AGG(item, ' | ' ORDER BY order_index) as items
FROM checklist_item 
GROUP BY checklist_type, section 
ORDER BY checklist_type, section;

-- Check for any choking items with CPR sections (these will cause violations)
SELECT 
  checklist_type, 
  section, 
  item
FROM checklist_item 
WHERE checklist_type IN ('adult choking', 'infant choking') 
AND section IN ('shout for help', 'circulation', 'defribillation');

-- Check for any items with invalid sections
SELECT 
  checklist_type, 
  section, 
  COUNT(*) as count
FROM checklist_item 
WHERE 
  (checklist_type IN ('one man cpr', 'two man cpr', 'infant cpr') 
   AND section NOT IN ('danger', 'respons', 'shout for help', 'airway', 'breathing', 'circulation', 'defribillation'))
  OR
  (checklist_type IN ('adult choking', 'infant choking') 
   AND section NOT IN ('danger', 'respons', 'airway', 'breathing'))
GROUP BY checklist_type, section
ORDER BY checklist_type, section;
