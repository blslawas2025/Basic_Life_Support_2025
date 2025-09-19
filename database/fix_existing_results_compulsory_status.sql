-- Fix existing checklist results to have correct compulsory status
-- This script updates the section_results in existing assessments to match current checklist items

-- First, let's see what data we have
SELECT 
  checklist_type,
  COUNT(*) as total_results,
  COUNT(CASE WHEN status = 'PASS' THEN 1 END) as pass_count
FROM checklist_result 
WHERE is_deleted = false
GROUP BY checklist_type;

-- Update section_results for One Man CPR
UPDATE checklist_result 
SET section_results = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'section', section_data.section,
      'completed', section_data.completed,
      'items', jsonb_agg(
        jsonb_build_object(
          'id', item_data.id,
          'item', item_data.item,
          'completed', item_data.completed,
          'is_compulsory', item_data.is_compulsory
        ) ORDER BY item_data.order_index
      )
    )
  )
  FROM (
    SELECT 
      section,
      bool_or(completed) as completed,
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'item', item,
          'completed', completed,
          'is_compulsory', is_compulsory,
          'order_index', order_index
        ) ORDER BY order_index
      ) as items
    FROM checklist_item 
    WHERE checklist_type = 'one man cpr'
    GROUP BY section
  ) section_data
)
WHERE checklist_type = 'one man cpr' 
AND is_deleted = false;

-- Update section_results for Two Man CPR
UPDATE checklist_result 
SET section_results = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'section', section_data.section,
      'completed', section_data.completed,
      'items', jsonb_agg(
        jsonb_build_object(
          'id', item_data.id,
          'item', item_data.item,
          'completed', item_data.completed,
          'is_compulsory', item_data.is_compulsory
        ) ORDER BY item_data.order_index
      )
    )
  )
  FROM (
    SELECT 
      section,
      bool_or(completed) as completed,
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'item', item,
          'completed', completed,
          'is_compulsory', is_compulsory,
          'order_index', order_index
        ) ORDER BY order_index
      ) as items
    FROM checklist_item 
    WHERE checklist_type = 'two man cpr'
    GROUP BY section
  ) section_data
)
WHERE checklist_type = 'two man cpr' 
AND is_deleted = false;

-- Update section_results for Infant CPR
UPDATE checklist_result 
SET section_results = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'section', section_data.section,
      'completed', section_data.completed,
      'items', jsonb_agg(
        jsonb_build_object(
          'id', item_data.id,
          'item', item_data.item,
          'completed', item_data.completed,
          'is_compulsory', item_data.is_compulsory
        ) ORDER BY item_data.order_index
      )
    )
  )
  FROM (
    SELECT 
      section,
      bool_or(completed) as completed,
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'item', item,
          'completed', completed,
          'is_compulsory', is_compulsory,
          'order_index', order_index
        ) ORDER BY order_index
      ) as items
    FROM checklist_item 
    WHERE checklist_type = 'infant cpr'
    GROUP BY section
  ) section_data
)
WHERE checklist_type = 'infant cpr' 
AND is_deleted = false;

-- Update section_results for Adult Choking
UPDATE checklist_result 
SET section_results = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'section', section_data.section,
      'completed', section_data.completed,
      'items', jsonb_agg(
        jsonb_build_object(
          'id', item_data.id,
          'item', item_data.item,
          'completed', item_data.completed,
          'is_compulsory', item_data.is_compulsory
        ) ORDER BY item_data.order_index
      )
    )
  )
  FROM (
    SELECT 
      section,
      bool_or(completed) as completed,
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'item', item,
          'completed', completed,
          'is_compulsory', is_compulsory,
          'order_index', order_index
        ) ORDER BY order_index
      ) as items
    FROM checklist_item 
    WHERE checklist_type = 'adult choking'
    GROUP BY section
  ) section_data
)
WHERE checklist_type = 'adult choking' 
AND is_deleted = false;

-- Update section_results for Infant Choking
UPDATE checklist_result 
SET section_results = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'section', section_data.section,
      'completed', section_data.completed,
      'items', jsonb_agg(
        jsonb_build_object(
          'id', item_data.id,
          'item', item_data.item,
          'completed', item_data.completed,
          'is_compulsory', item_data.is_compulsory
        ) ORDER BY item_data.order_index
      )
    )
  )
  FROM (
    SELECT 
      section,
      bool_or(completed) as completed,
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'item', item,
          'completed', completed,
          'is_compulsory', is_compulsory,
          'order_index', order_index
        ) ORDER BY order_index
      ) as items
    FROM checklist_item 
    WHERE checklist_type = 'infant choking'
    GROUP BY section
  ) section_data
)
WHERE checklist_type = 'infant choking' 
AND is_deleted = false;

-- Verify the updates
SELECT 
  checklist_type,
  COUNT(*) as updated_results
FROM checklist_result 
WHERE is_deleted = false
GROUP BY checklist_type;


