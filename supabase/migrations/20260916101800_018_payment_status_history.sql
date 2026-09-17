/*
# Migration 018: Payment status audit trail

## Overview
Now that migration 014 lets admins actually update payment status (fixing
the broken Confirm/Reject buttons), those actions need an audit trail —
unlike project status changes, which already get logged to
project_status_history, payment status changes had no equivalent. This
matters more here since it's moving money.

## New Table
- payment_status_history: id, payment_id, old_status, new_status,
  changed_by, created_at

## Security
- Visible to the payment's owning student and admins (same pattern as
  project_status_history)
- Insert requires the same visibility (effectively admin-only in practice,
  since only admins can update payments per migration 014)
*/

CREATE TABLE IF NOT EXISTS public.payment_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.payment_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payment_history" ON public.payment_status_history;
CREATE POLICY "select_own_payment_history"
  ON public.payment_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.payments p
      WHERE p.id = payment_id AND (p.user_id = auth.uid() OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "admin_insert_payment_history" ON public.payment_status_history;
CREATE POLICY "admin_insert_payment_history"
  ON public.payment_status_history FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_payment_status_history_payment_id ON public.payment_status_history(payment_id);
