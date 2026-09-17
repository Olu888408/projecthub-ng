/*
# Migration 019: Restrict project_status_history inserts to admins

## Overview
The original insert_project_history policy (migration 002) allowed the
project owner (the student) to insert history rows for their own project —
with any old_status/new_status values they chose, completely independent
of the project's actual protected `status` column. A student could insert
a fake row claiming their project went from request_submitted to completed
without that ever really happening, since only the projects table itself
is protected by a trigger — the history log wasn't.

## Changes
- Restrict project_status_history INSERT to admins only. The only place
  in the app that writes to this table is AdminProjectDetailPage's
  handleSave, which only runs for admins anyway — students never needed
  insert access here, only the SELECT (read) access they already have.
*/

DROP POLICY IF EXISTS "insert_project_history" ON public.project_status_history;
CREATE POLICY "insert_project_history"
  ON public.project_status_history FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());
