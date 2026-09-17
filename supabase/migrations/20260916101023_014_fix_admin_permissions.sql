/*
# Migration 014: Fix admin permission gaps

## Overview
Two admin-facing features are currently non-functional because RLS never
granted admins the access their UI assumes they have:

1. payments had no UPDATE policy at all (by original design, "immutable
   from the client") — but AdminPaymentsPage's Confirm/Reject buttons call
   `supabase.from('payments').update(...)` directly from the browser as an
   admin. Every click fails with a permission error.

2. The project-files storage bucket's INSERT policy, and the project_files
   table's INSERT policy, only allow the project's owning student
   (`p.user_id = auth.uid()`) — unlike their SELECT/DELETE counterparts,
   which correctly include `OR public.is_admin()`. AdminProjectDetailPage's
   "Upload Deliverable" flow fails at both layers for every admin.

## Changes
- Add an admin-only UPDATE policy on public.payments
- Add `OR public.is_admin()` to the storage.objects INSERT policy for the
  project-files bucket
- Add `OR public.is_admin()` to project_files' insert_own_project_files policy
*/

-- ── 1. Allow admins to update payment status ────────────────────────
DROP POLICY IF EXISTS "admin_update_payments" ON public.payments;
CREATE POLICY "admin_update_payments"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 2. Allow admins to upload project files (storage) ───────────────
DROP POLICY IF EXISTS "Users upload project files" ON storage.objects;
CREATE POLICY "Users upload project files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND (p.user_id = auth.uid() OR public.is_admin())
    )
  );

-- ── 3. Allow admins to insert project_files rows ────────────────────
DROP POLICY IF EXISTS "insert_own_project_files" ON public.project_files;
CREATE POLICY "insert_own_project_files"
  ON public.project_files FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND (p.user_id = auth.uid() OR public.is_admin())
    )
  );
