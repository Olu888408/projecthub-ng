/*
# Migration 2: Packages, Projects, Project Files, Project Status History

## Overview
Creates packages, projects, project_files, and project_status_history tables.
Uses a trigger (not RLS WITH CHECK) to prevent students from changing status/admin_notes/assigned_admin_id.

## New Tables
1. packages: service pricing tiers
2. projects: student project submissions
3. project_status_history: audit trail of status changes
4. project_files: uploaded files for projects

## Security
- packages: public read (active only); admin full CRUD
- projects: students see/update own; admins see all. Trigger enforces field-level protection.
- project_status_history: visible to project owner and admins
- project_files: visible to project owner and admins; insert by owner only
*/

-- ============================================================================
-- PACKAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  features text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_packages" ON public.packages;
CREATE POLICY "public_read_packages"
  ON public.packages FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "admin_insert_packages" ON public.packages;
CREATE POLICY "admin_insert_packages"
  ON public.packages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_packages" ON public.packages;
CREATE POLICY "admin_update_packages"
  ON public.packages FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_packages" ON public.packages;
CREATE POLICY "admin_delete_packages"
  ON public.packages FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS packages_updated_at ON public.packages;
CREATE TRIGGER packages_updated_at
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- PROJECTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  package_id uuid REFERENCES public.packages(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'completed', 'cancelled')),
  admin_notes text DEFAULT '',
  assigned_admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_projects" ON public.projects;
CREATE POLICY "select_own_projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_projects" ON public.projects;
CREATE POLICY "insert_own_projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_projects" ON public.projects;
CREATE POLICY "update_own_projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "delete_own_projects" ON public.projects;
CREATE POLICY "delete_own_projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Trigger: prevent students from changing protected fields
CREATE OR REPLACE FUNCTION public.protect_project_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Students cannot change project status';
    END IF;
    IF NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
      RAISE EXCEPTION 'Students cannot change admin notes';
    END IF;
    IF NEW.assigned_admin_id IS DISTINCT FROM OLD.assigned_admin_id THEN
      RAISE EXCEPTION 'Students cannot change assigned admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_project_fields_trigger ON public.projects;
CREATE TRIGGER protect_project_fields_trigger
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.protect_project_fields();

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- ============================================================================
-- PROJECT STATUS HISTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.project_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.project_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_project_history" ON public.project_status_history;
CREATE POLICY "select_own_project_history"
  ON public.project_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND (p.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "insert_project_history" ON public.project_status_history;
CREATE POLICY "insert_project_history"
  ON public.project_status_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND (p.user_id = auth.uid() OR public.is_admin())
    )
  );

-- ============================================================================
-- PROJECT FILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint DEFAULT 0,
  file_type text DEFAULT '',
  uploaded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_project_files" ON public.project_files;
CREATE POLICY "select_own_project_files"
  ON public.project_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND (p.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "insert_own_project_files" ON public.project_files;
CREATE POLICY "insert_own_project_files"
  ON public.project_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_project_files" ON public.project_files;
CREATE POLICY "delete_own_project_files"
  ON public.project_files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND (p.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
