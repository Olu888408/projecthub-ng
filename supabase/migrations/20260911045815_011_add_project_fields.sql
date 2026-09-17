/*
# Migration 11: Add project fields for detailed request form

## Overview
Adds columns to the projects table to support the detailed project request form:
- service_id: links to services table
- university, department, course, level, supervisor: academic info
- deadline: project deadline

## Changes
- ALTER TABLE projects ADD COLUMN service_id, university, department, course, level, supervisor, deadline
- Add foreign key for service_id
- Add index on service_id
*/

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS university text DEFAULT '',
  ADD COLUMN IF NOT EXISTS department text DEFAULT '',
  ADD COLUMN IF NOT EXISTS course text DEFAULT '',
  ADD COLUMN IF NOT EXISTS level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS supervisor text DEFAULT '',
  ADD COLUMN IF NOT EXISTS deadline date;

CREATE INDEX IF NOT EXISTS idx_projects_service_id ON public.projects(service_id);

-- Update settings to include WhatsApp numbers
INSERT INTO public.settings (key, value)
VALUES
  ('whatsapp_primary', '09160661570'),
  ('whatsapp_secondary', '09073396693'),
  ('business_address', 'Lagos, Nigeria')
ON CONFLICT (key) DO NOTHING;
