/*
# Security Fix: Revoke EXECUTE on SECURITY DEFINER functions from anon and authenticated

## Overview
The previous migration revoked from PUBLIC, but anon and authenticated roles
inherit EXECUTE and the linter still flags them. This migration revokes
EXECUTE directly from anon and authenticated on all three SECURITY DEFINER
functions that should only be called by triggers (handle_new_user,
protect_project_fields) or internally by policies (is_admin).

## Changes
- REVOKE EXECUTE on handle_new_user() FROM anon, authenticated
- REVOKE EXECUTE on protect_project_fields() FROM anon, authenticated
- REVOKE EXECUTE on is_admin() FROM authenticated (already revoked from anon)
  is_admin is used in RLS policy USING clauses, which run as the table owner,
  not as the calling role — so revoking EXECUTE from authenticated is safe.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.protect_project_fields() FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_project_fields() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;
