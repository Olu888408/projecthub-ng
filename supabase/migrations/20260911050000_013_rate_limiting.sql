/*
# Migration 013: Enforce rate limiting

## Overview
The `rate_limit_log` table existed from migration 004 but nothing ever wrote
to it or checked it — meaning contact form spam, rapid project creation, and
message flooding were all technically unprotected. This migration adds a
reusable rate-limit check function and wires it into three of the most
spam/abuse-prone insert paths: contact_messages, projects, and messages.

## Design
- `public.check_rate_limit(identifier, action, max_count, window_minutes)`
  counts matching rows in rate_limit_log within the time window, logs the
  current attempt, and returns true/false.
- BEFORE INSERT triggers call this function and RAISE EXCEPTION when the
  limit is exceeded, which Postgres surfaces as an error the frontend can
  catch and show as "Too many requests. Please try again later."
- Limits chosen are generous enough not to block normal use:
  - Contact form: 5 submissions per email per hour
  - Project creation: 10 per user per day
  - Messages: 40 per user per hour
*/

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action text,
  p_max_count integer,
  p_window_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.rate_limit_log
  WHERE identifier = p_identifier
    AND action = p_action
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;

  IF v_count >= p_max_count THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_log (identifier, action) VALUES (p_identifier, p_action);
  RETURN true;
END;
$$;

-- Only allow this to run as a trigger, not to be called directly by anon/authenticated
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, integer, integer) FROM PUBLIC;

-- ── Contact form: 5 per email per hour ──────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_contact_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.check_rate_limit(lower(NEW.email), 'contact_message', 5, 60) THEN
    RAISE EXCEPTION 'Too many requests. Please try again later.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_contact_rate_limit() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_contact_rate_limit ON public.contact_messages;
CREATE TRIGGER trg_contact_rate_limit
  BEFORE INSERT ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_contact_rate_limit();

-- ── Project creation: 10 per user per day ───────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_project_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.check_rate_limit(NEW.user_id::text, 'project_create', 10, 1440) THEN
    RAISE EXCEPTION 'Too many project requests today. Please try again tomorrow or contact support.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_project_rate_limit() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_project_rate_limit ON public.projects;
CREATE TRIGGER trg_project_rate_limit
  BEFORE INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_project_rate_limit();

-- ── Messages: 40 per user per hour ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_message_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.check_rate_limit(NEW.sender_id::text, 'message_send', 40, 60) THEN
    RAISE EXCEPTION 'Too many messages sent. Please slow down and try again shortly.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_message_rate_limit() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_message_rate_limit ON public.messages;
CREATE TRIGGER trg_message_rate_limit
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_message_rate_limit();

-- Service role (used by edge functions) bypasses these triggers implicitly
-- since it inserts via service-role client, but edge functions themselves
-- (paystack-init, etc.) should rely on Supabase's own platform-level rate
-- limiting for now — a dedicated per-endpoint limiter can be added later
-- using the same check_rate_limit() function if needed.
