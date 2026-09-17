/*
# Migration 6: Services table

## Overview
Creates the services table for storing academic service offerings by department/category.

## New Tables
- services: id, name, category, description, active, created_at, updated_at

## Security
- Public read (active services only); admin full CRUD
*/

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_services" ON public.services;
CREATE POLICY "public_read_services"
  ON public.services FOR SELECT
  TO anon, authenticated
  USING (active = true OR public.is_admin());

DROP POLICY IF EXISTS "admin_insert_services" ON public.services;
CREATE POLICY "admin_insert_services"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_services" ON public.services;
CREATE POLICY "admin_update_services"
  ON public.services FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_services" ON public.services;
CREATE POLICY "admin_delete_services"
  ON public.services FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS services_updated_at ON public.services;
CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Seed some services
INSERT INTO public.services (name, category, description, active)
VALUES
  ('Civil Engineering', 'Engineering', 'Structural design, transportation, geotechnics, water resources, and construction management research support.', true),
  ('Electrical/Electronics Engineering', 'Engineering', 'Power systems, circuit design, electronics, telecommunications, and control systems project guidance.', true),
  ('Mechanical Engineering', 'Engineering', 'Thermodynamics, fluid mechanics, machine design, manufacturing, and materials engineering support.', true),
  ('Computer Science', 'Computer Science & Technology', 'Algorithms, software development, databases, and computational theory project guidance.', true),
  ('Software Engineering', 'Computer Science & Technology', 'Software architecture, development methodologies, testing, and deployment support.', true),
  ('Accounting', 'Other Departments', 'Financial accounting, auditing, taxation, and financial reporting research support.', true),
  ('Business Administration', 'Other Departments', 'Management, organizational behavior, strategic planning, and business operations project guidance.', true)
ON CONFLICT DO NOTHING;
