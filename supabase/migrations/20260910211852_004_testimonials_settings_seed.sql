/*
# Migration 4: Testimonials, Legal Pages, Settings, Rate Limit Log, Seed Data

## Overview
Creates testimonials, legal_pages, settings, rate_limit_log tables, plus seed data
for packages, legal pages, and site settings.

## New Tables
1. testimonials: id, name, university, content, rating, is_approved
2. legal_pages: id, slug, title, content
3. settings: id, key, value
4. rate_limit_log: id, identifier, action (no RLS policies — service role only)

## Security
- testimonials: public read approved; admin full CRUD
- legal_pages: public read; admin full CRUD
- settings: public read; admin insert/update
- rate_limit_log: no policies (service role only via edge functions)

## Seed Data
- 3 packages (Starter, Standard, Premium)
- 3 legal pages (privacy, terms, refund)
- 6 site settings keys
*/

-- ============================================================================
-- TESTIMONIALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  university text DEFAULT '',
  content text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_approved_testimonials" ON public.testimonials;
CREATE POLICY "public_read_approved_testimonials"
  ON public.testimonials FOR SELECT
  TO anon, authenticated
  USING (is_approved = true OR public.is_admin());

DROP POLICY IF EXISTS "admin_insert_testimonials" ON public.testimonials;
CREATE POLICY "admin_insert_testimonials"
  ON public.testimonials FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_testimonials" ON public.testimonials;
CREATE POLICY "admin_update_testimonials"
  ON public.testimonials FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_testimonials" ON public.testimonials;
CREATE POLICY "admin_delete_testimonials"
  ON public.testimonials FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- LEGAL PAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.legal_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_legal_pages" ON public.legal_pages;
CREATE POLICY "public_read_legal_pages"
  ON public.legal_pages FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_insert_legal_pages" ON public.legal_pages;
CREATE POLICY "admin_insert_legal_pages"
  ON public.legal_pages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_legal_pages" ON public.legal_pages;
CREATE POLICY "admin_update_legal_pages"
  ON public.legal_pages FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_legal_pages" ON public.legal_pages;
CREATE POLICY "admin_delete_legal_pages"
  ON public.legal_pages FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP TRIGGER IF EXISTS legal_pages_updated_at ON public.legal_pages;
CREATE TRIGGER legal_pages_updated_at
  BEFORE UPDATE ON public.legal_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_settings" ON public.settings;
CREATE POLICY "public_read_settings"
  ON public.settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_insert_settings" ON public.settings;
CREATE POLICY "admin_insert_settings"
  ON public.settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_settings" ON public.settings;
CREATE POLICY "admin_update_settings"
  ON public.settings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS settings_updated_at ON public.settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- RATE LIMIT LOG (no policies — service role only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action ON public.rate_limit_log(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at ON public.rate_limit_log(created_at);

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO public.packages (title, description, price, features, is_active, display_order)
VALUES
  ('Starter', 'Basic project assistance with topic selection and outline', 5000.00, ARRAY['Topic selection','Project outline','1 revision','Email support'], true, 1),
  ('Standard', 'Complete project writing with research and formatting', 15000.00, ARRAY['Full project writing','Research included','3 revisions','Email + WhatsApp support','Plagiarism check'], true, 2),
  ('Premium', 'Full-service package with defense preparation and presentation', 30000.00, ARRAY['Everything in Standard','Defense preparation','Slide presentation','Unlimited revisions','Priority support','Certificate of originality'], true, 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.legal_pages (slug, title, content)
VALUES
  ('privacy-policy', 'Privacy Policy', 'ProjectHub NG is committed to protecting your privacy. We collect information you provide during registration and project submission. We use this data to deliver our services and improve your experience. We do not share your data with third parties except as required by law.'),
  ('terms-of-service', 'Terms of Service', 'By using ProjectHub NG, you agree to our terms. All projects are for educational reference purposes. Plagiarism is not condoned. Payments are non-refundable once work has commenced. You are responsible for the accuracy of information provided.'),
  ('refund-policy', 'Refund Policy', 'Refunds are available within 24 hours of payment if work has not commenced. Once a project has been assigned and work begun, payments are non-refundable. Refund requests should be sent to support.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.settings (key, value)
VALUES
  ('site_name', 'ProjectHub NG'),
  ('site_description', 'Nigeria''s premier platform for academic project assistance'),
  ('whatsapp_number', ''),
  ('contact_email', ''),
  ('contact_phone', ''),
  ('paystack_public_key', '')
ON CONFLICT (key) DO NOTHING;
