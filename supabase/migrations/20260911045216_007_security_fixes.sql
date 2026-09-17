/*
# Security Hardening: Fix SECURITY DEFINER function exposures

## Overview
Fixes 8 security advisor findings:
1. rate_limit_log: RLS enabled with no policies — revoke grants so only service role can access
2. update_updated_at: mutable search_path — set explicit search_path
3. handle_new_user: SECURITY DEFINER callable by anon/authenticated — revoke EXECUTE from PUBLIC
4. is_admin: SECURITY DEFINER callable by anon/authenticated — revoke EXECUTE from anon
5. protect_project_fields: SECURITY DEFINER callable by anon/authenticated — revoke EXECUTE from PUBLIC

## Changes
- REVOKE EXECUTE on handle_new_user, protect_project_fields from PUBLIC (keep for authenticated only where needed)
- REVOKE EXECUTE on is_admin from anon (anon doesn't have a profile, so is_admin returns false anyway)
- Set search_path = public on update_updated_at
- REVOKE all on rate_limit_log from anon, authenticated (service role only)
*/

-- Fix 1: update_updated_at — set explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix 2: is_admin — revoke from anon (anon users have no profile, this is safe to restrict)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- Fix 3: handle_new_user — this is a trigger function, only called by the trigger on auth.users
-- Revoke from PUBLIC so it can't be called directly via REST API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Fix 4: protect_project_fields — this is a trigger function, only called by the trigger on projects
-- Revoke from PUBLIC so it can't be called directly via REST API
REVOKE EXECUTE ON FUNCTION public.protect_project_fields() FROM PUBLIC;

-- Fix 5: rate_limit_log — service role only, no anon/authenticated access
REVOKE ALL ON public.rate_limit_log FROM anon;
REVOKE ALL ON public.rate_limit_log FROM authenticated;
