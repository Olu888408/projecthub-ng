/*
# Migration 015: Restrict file deletion to the uploader (or admin)

## Overview
Previously, project_files and the project-files storage bucket allowed
DELETE by the *project owner* (the student), regardless of who actually
uploaded the file. That meant a student could delete admin-uploaded
deliverables from their own project — the frontend now hides that button,
but the RLS policy itself needs tightening so it can't be done via a
direct API call either.

## Changes
- project_files DELETE: now requires uploaded_by = auth.uid() (the student
  can delete their own uploads) OR public.is_admin() (admins can delete
  anything, including cleaning up their own deliverables)
- storage.objects DELETE for the project-files bucket: same restriction,
  matched against project_files.uploaded_by for the corresponding row
*/

DROP POLICY IF EXISTS "delete_own_project_files" ON public.project_files;
CREATE POLICY "delete_own_project_files"
  ON public.project_files FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users delete project files" ON storage.objects;
CREATE POLICY "Users delete project files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND EXISTS (
      SELECT 1 FROM public.project_files pf
      WHERE pf.file_path = storage.objects.name
      AND (pf.uploaded_by = auth.uid() OR public.is_admin())
    )
  );
