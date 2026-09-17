/*
# Migration 016: Rate limit payment submissions

## Overview
013_rate_limiting.sql added check_rate_limit() and wired it into
contact_messages, projects, and messages — but not payments, so a student
could submit unlimited "I've sent payment" records for the same project
with no cooldown. This adds the same protection: 5 payment submissions per
user per hour, generous enough for legitimate retries (e.g. re-submitting
after a failed bank transfer) but enough to stop spam.
*/

CREATE OR REPLACE FUNCTION public.enforce_payment_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.check_rate_limit(NEW.user_id::text, 'payment_submit', 5, 60) THEN
    RAISE EXCEPTION 'Too many payment submissions. Please wait a bit and try again, or contact support.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_payment_rate_limit() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_payment_rate_limit ON public.payments;
CREATE TRIGGER trg_payment_rate_limit
  BEFORE INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_payment_rate_limit();
