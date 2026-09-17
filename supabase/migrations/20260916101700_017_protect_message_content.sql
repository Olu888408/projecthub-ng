/*
# Migration 017: Restrict message updates to read_at only

## Overview
The messages UPDATE policy (migration 003) allows either the sender or
recipient to update a row they're part of, but doesn't restrict which
columns can change — meaning either party could technically edit the
message `content` itself after the fact, not just mark it as read. That
was clearly the intent (the only place the frontend calls .update() on
messages is to set read_at), but RLS policies alone can't compare old vs
new column values, so this needs a trigger — same pattern already used for
protect_project_fields.

## Changes
- Add a trigger that blocks changes to any message column except read_at,
  for everyone including admins (there's no legitimate reason to ever edit
  message content or reassign sender/recipient after the fact).
*/

CREATE OR REPLACE FUNCTION public.protect_message_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    RAISE EXCEPTION 'Message content cannot be edited';
  END IF;
  IF NEW.sender_id IS DISTINCT FROM OLD.sender_id THEN
    RAISE EXCEPTION 'Message sender cannot be changed';
  END IF;
  IF NEW.recipient_id IS DISTINCT FROM OLD.recipient_id THEN
    RAISE EXCEPTION 'Message recipient cannot be changed';
  END IF;
  IF NEW.project_id IS DISTINCT FROM OLD.project_id THEN
    RAISE EXCEPTION 'Message project cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_message_fields() FROM PUBLIC;

DROP TRIGGER IF EXISTS protect_message_fields_trigger ON public.messages;
CREATE TRIGGER protect_message_fields_trigger
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.protect_message_fields();
