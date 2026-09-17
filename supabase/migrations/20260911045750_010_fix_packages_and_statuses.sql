/*
# Migration 10: Fix package prices, names, features, and expand project statuses

## Overview
1. Updates the 3 seeded packages to match the prompt specification:
   - Basic: ₦40,000 — Research Support (Chapter 1-5 guidance, lit review, referencing, formatting, basic consultation)
   - Standard: ₦65,000 — Complete Research Support (Full research support, ch 1-5, referencing, formatting, questionnaire guidance, data collection, tables/charts)
   - Premium: ₦80,000 — Full Project + Defense Preparation (Complete research support, questionnaire guidance, presentation slides, defense prep, likely Q&A, project explanation, consultation)
2. Expands project status CHECK constraint to include all 10 statuses from the prompt:
   - request_submitted, under_review, consultation, in_progress, awaiting_info, presentation_prep, completed, closed, cancelled
   (pending and review are kept for backward compat, mapped to request_submitted and under_review)

## Changes
- UPDATE packages SET title, description, price, features
- ALTER projects status CHECK constraint (drop old, add new)
- Update existing projects with old statuses to new ones
*/

-- Update packages to match prompt
UPDATE public.packages SET
  title = 'Basic',
  description = 'Research Support',
  price = 40000.00,
  features = ARRAY[
    'Chapter 1-5 guidance',
    'Literature review support',
    'Referencing',
    'Formatting',
    'Basic consultation'
  ],
  display_order = 1
WHERE title = 'Starter';

UPDATE public.packages SET
  title = 'Standard',
  description = 'Complete Research Support',
  price = 65000.00,
  features = ARRAY[
    'Full research support',
    'Chapter 1-5 guidance',
    'Referencing',
    'Formatting',
    'Questionnaire guidance',
    'Data collection guidance',
    'Tables/charts guidance',
    'Detailed research support'
  ],
  display_order = 2
WHERE title = 'Standard';

UPDATE public.packages SET
  title = 'Premium',
  description = 'Full Project + Defense Preparation',
  price = 80000.00,
  features = ARRAY[
    'Complete research support',
    'Questionnaire guidance',
    'Presentation slides',
    'Defense preparation',
    'Likely questions and answers',
    'Project explanation',
    'Consultation throughout'
  ],
  display_order = 3
WHERE title = 'Premium';

-- Expand project statuses
-- First update any existing projects with old statuses
UPDATE public.projects SET status = 'request_submitted' WHERE status = 'pending';
UPDATE public.projects SET status = 'under_review' WHERE status = 'review';
UPDATE public.project_status_history SET old_status = 'request_submitted' WHERE old_status = 'pending';
UPDATE public.project_status_history SET old_status = 'under_review' WHERE old_status = 'review';
UPDATE public.project_status_history SET new_status = 'request_submitted' WHERE new_status = 'pending';
UPDATE public.project_status_history SET new_status = 'under_review' WHERE new_status = 'review';

-- Drop old constraint and add new one with all statuses
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check
  CHECK (status IN (
    'request_submitted',
    'under_review',
    'consultation',
    'in_progress',
    'awaiting_info',
    'presentation_prep',
    'completed',
    'closed',
    'cancelled'
  ));

-- Update default status
ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'request_submitted';
