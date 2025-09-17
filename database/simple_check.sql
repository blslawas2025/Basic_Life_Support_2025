-- Simple check to see existing data
-- Run this first to understand what data exists

-- Check all checklist items by type and section
SELECT 
  checklist_type, 
  section, 
  COUNT(*) as item_count
FROM checklist_item 
GROUP BY checklist_type, section 
ORDER BY checklist_type, section;

-- Check for any choking items that might cause issues
SELECT 
  checklist_type, 
  section, 
  item
FROM checklist_item 
WHERE checklist_type IN ('adult choking', 'infant choking')
ORDER BY checklist_type, section, order_index;

