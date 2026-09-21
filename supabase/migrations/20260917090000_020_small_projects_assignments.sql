/*
# Migration 020: Small Projects & Assignments feature

## Overview
Adds a new "tasks" concept (assignments, mini-projects, coursework, practicals)
that is intentionally separate from the existing "projects" (final-year
project) table, but reuses the same patterns: private per-student ownership,
admin oversight via is_admin(), the same storage bucket for attachments
(under a tasks/ prefix), and the existing messages/payments tables extended
to optionally reference a task instead of a project.

## New Tables
- tasks: student-submitted small assignments/coursework requests
- task_files: attachments on a task, mirrors project_files

## Changes to existing tables
- messages.project_id is now nullable; messages.task_id (nullable) added.
  A CHECK constraint requires exactly one of the two to be set, so existing
  project-based messaging is completely unaffected.
- payments.project_id is now nullable; payments.task_id (nullable) added.
  Same CHECK constraint pattern.

## Security
- tasks: students see/manage own; admins see/manage all (same pattern as
  projects). Status/admin_notes/assigned_admin_id protected from student
  edits via trigger, same as protect_project_fields.
- task_files: same ownership pattern as project_files.
- Storage: existing project-files bucket reused; policies extended to also
  match a tasks/{taskId}/... path prefix, scoped by task ownership.
- Rate limiting: task creation gets the same check_rate_limit() protection
  already used for project creation (10 per user per day).
*/

-- ============================================================================
-- TASKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  course text DEFAULT '',
  department text DEFAULT '',
  category text NOT NULL DEFAULT 'Other',
  description text DEFAULT '',
  deadline date,
  budget numeric(10,2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'in_progress', 'completed', 'cancelled')),
  admin_notes text DEFAULT '',
  assigned_admin_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasks" ON public.tasks;
CREATE POLICY "select_own_tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "insert_own_tasks" ON public.tasks;
CREATE POLICY "insert_own_tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasks" ON public.tasks;
CREATE POLICY "update_own_tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "delete_own_tasks" ON public.tasks;
CREATE POLICY "delete_own_tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Protect status/admin_notes/assigned_admin_id from student edits (same
-- pattern as protect_project_fields)
CREATE OR REPLACE FUNCTION public.protect_task_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Students cannot change task status';
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

REVOKE EXECUTE ON FUNCTION public.protect_task_fields() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.protect_task_fields() FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_task_fields() FROM authenticated;

DROP TRIGGER IF EXISTS protect_task_fields_trigger ON public.tasks;
CREATE TRIGGER protect_task_fields_trigger
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.protect_task_fields();

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);

-- Rate limit task creation, same as project creation (10 per user per day)
CREATE OR REPLACE FUNCTION public.enforce_task_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.check_rate_limit(NEW.user_id::text, 'task_create', 10, 1440) THEN
    RAISE EXCEPTION 'Too many task requests today. Please try again tomorrow or contact support.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_task_rate_limit() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_task_rate_limit ON public.tasks;
CREATE TRIGGER trg_task_rate_limit
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_task_rate_limit();

-- ============================================================================
-- TASK FILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.task_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint DEFAULT 0,
  file_type text DEFAULT '',
  uploaded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.task_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_task_files" ON public.task_files;
CREATE POLICY "select_own_task_files"
  ON public.task_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND (t.user_id = auth.uid() OR public.is_admin()))
  );

DROP POLICY IF EXISTS "insert_own_task_files" ON public.task_files;
CREATE POLICY "insert_own_task_files"
  ON public.task_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND (t.user_id = auth.uid() OR public.is_admin()))
  );

DROP POLICY IF EXISTS "delete_own_task_files" ON public.task_files;
CREATE POLICY "delete_own_task_files"
  ON public.task_files FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR public.is_admin()
  );

CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON public.task_files(task_id);

-- ============================================================================
-- EXTEND MESSAGES + PAYMENTS TO OPTIONALLY REFERENCE A TASK
-- ============================================================================
ALTER TABLE public.messages ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_one_parent_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_one_parent_check
  CHECK ((project_id IS NOT NULL AND task_id IS NULL) OR (project_id IS NULL AND task_id IS NOT NULL));

DROP POLICY IF EXISTS "select_own_messages" ON public.messages;
CREATE POLICY "select_own_messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id
    OR auth.uid() = recipient_id
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "insert_own_messages" ON public.messages;
CREATE POLICY "insert_own_messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      (project_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.user_id = auth.uid() OR public.is_admin())
      ))
      OR
      (task_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.tasks t WHERE t.id = task_id AND (t.user_id = auth.uid() OR public.is_admin())
      ))
    )
  );

ALTER TABLE public.payments ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_one_parent_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_one_parent_check
  CHECK ((project_id IS NOT NULL AND task_id IS NULL) OR (project_id IS NULL AND task_id IS NOT NULL));

-- select/insert policies on payments already only check user_id, no change
-- needed there; the admin UPDATE policy from migration 014 already covers
-- payments regardless of whether they're for a project or a task.

CREATE INDEX IF NOT EXISTS idx_messages_task_id ON public.messages(task_id);
CREATE INDEX IF NOT EXISTS idx_payments_task_id ON public.payments(task_id);

-- ============================================================================
-- STORAGE: extend project-files bucket policies to also cover tasks/ paths
-- ============================================================================
DROP POLICY IF EXISTS "Users upload project files" ON storage.objects;
CREATE POLICY "Users upload project files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND (
      ((storage.foldername(name))[1] = 'tasks' AND EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id::text = (storage.foldername(name))[2]
        AND (t.user_id = auth.uid() OR public.is_admin())
      ))
      OR
      ((storage.foldername(name))[1] != 'tasks' AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id::text = (storage.foldername(name))[1]
        AND (p.user_id = auth.uid() OR public.is_admin())
      ))
    )
  );

DROP POLICY IF EXISTS "Users read project files" ON storage.objects;
CREATE POLICY "Users read project files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND (
      ((storage.foldername(name))[1] = 'tasks' AND EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id::text = (storage.foldername(name))[2]
        AND (t.user_id = auth.uid() OR public.is_admin())
      ))
      OR
      ((storage.foldername(name))[1] != 'tasks' AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id::text = (storage.foldername(name))[1]
        AND (p.user_id = auth.uid() OR public.is_admin())
      ))
    )
  );

-- ============================================================================
-- STORAGE DELETE: migration 015 scoped delete to project_files.uploaded_by
-- only, which doesn't cover task attachments (those live in task_files).
-- Extend it to check whichever table actually matches the path.
-- ============================================================================
DROP POLICY IF EXISTS "Users delete project files" ON storage.objects;
CREATE POLICY "Users delete project files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND (
      EXISTS (
        SELECT 1 FROM public.project_files pf
        WHERE pf.file_path = storage.objects.name
        AND (pf.uploaded_by = auth.uid() OR public.is_admin())
      )
      OR
      EXISTS (
        SELECT 1 FROM public.task_files tf
        WHERE tf.file_path = storage.objects.name
        AND (tf.uploaded_by = auth.uid() OR public.is_admin())
      )
    )
  );

-- ============================================================================
-- DASHBOARD SUMMARY RATE LIMIT SUPPORT: reuse existing check_rate_limit
-- (no new function needed; enforce_task_rate_limit above handles it)
-- ============================================================================
