/*
# Migration 5: Create project-files storage bucket

## Overview
Creates a private Supabase Storage bucket for project file uploads.
Private buckets require signed URLs for access — files are never publicly accessible.

## Storage
- Bucket name: project-files
- Public: false (private — signed URLs required)
- Allowed MIME types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, CSV, TXT, JPG, JPEG, PNG
- Max file size: 50MB

## Security
- Storage RLS policies ensure users can only access files for their own projects.
- Admins can access all files.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-files',
  'project-files',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can upload to their own project paths
DROP POLICY IF EXISTS "Users upload project files" ON storage.objects;
CREATE POLICY "Users upload project files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND p.user_id = auth.uid()
    )
  );

-- Storage RLS: users can read their own project files
DROP POLICY IF EXISTS "Users read project files" ON storage.objects;
CREATE POLICY "Users read project files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND (p.user_id = auth.uid() OR public.is_admin())
    )
  );

-- Storage RLS: users can delete their own project files
DROP POLICY IF EXISTS "Users delete project files" ON storage.objects;
CREATE POLICY "Users delete project files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id::text = (storage.foldername(name))[1]
      AND (p.user_id = auth.uid() OR public.is_admin())
    )
  );
