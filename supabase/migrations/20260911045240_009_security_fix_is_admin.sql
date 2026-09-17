/*
# Security Fix: Recreate is_admin() and revoke all EXECUTE grants

## Overview
The is_admin() SECURITY DEFINER function is still callable by anon and authenticated
even after REVOKE, because the function may have been recreated by migration 007
which reset grants. This migration recreates the function and then explicitly
revokes EXECUTE from all roles that shouldn't call it directly.

is_admin() is used inside RLS policy USING clauses, which execute as the table
owner (bypassing the caller's role), so revoking EXECUTE from anon/authenticated
does not affect policy behavior — only prevents direct REST API calls.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
