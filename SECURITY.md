# ProjectHub NG — Security Overview

This document describes the current security posture of the application: what
is implemented, what was found and fixed during review, what remains
configurable, and what still needs attention before a full production launch.

**This application is not claimed to be "100% secure."** No software is.
This is a realistic account of what has been checked and hardened.

---

## 1. Security Architecture

- **Frontend**: React + TypeScript + Vite, static-hosted (e.g. Netlify).
- **Backend**: Supabase (Postgres + Auth + Storage), accessed directly from
  the frontend using the public anon key, gated entirely by Row Level
  Security — there is no custom backend server for most operations.
- **Privileged operations** (payment initialization/verification, WhatsApp
  sending) run in Supabase Edge Functions, which are the only place the
  service-role key and third-party secrets are used.

## 2. Authentication

- Supabase Auth is the sole authentication authority. No custom password
  storage, hashing, or reset-token handling exists in this codebase.
- Supports email/password sign-up, login, logout, password reset, and email
  verification, all via Supabase's built-in flows.
- Sessions are managed by Supabase's client SDK (secure, httpOnly-backed
  session handling); no tokens are placed in URLs.

## 3. Authorization Model

- Two roles: `student` (default) and `admin`.
- Role is stored in `profiles.role` and can **never** be set by a client
  during sign-up — the database trigger that creates a profile on signup
  always assigns `student`, regardless of what the client sends.
- Role-escalation is blocked by the `update_own_profile` RLS policy's
  `WITH CHECK` clause, which requires the new row's `role` to match the
  caller's existing role — not by a separate trigger (an earlier version of
  this document incorrectly described this as a dedicated
  `prevent_role_self_escalation` trigger; no such trigger exists, the
  RLS `WITH CHECK` clause is the actual mechanism, see migration 001).
- Admin routes (`/admin/*`) are protected in the frontend via `AdminRoute`,
  **and** the same authorization is enforced at the database level through
  RLS — frontend route protection is a convenience, not the security
  boundary.

## 4. Row Level Security (RLS)

RLS is enabled on every user-facing table: `profiles`, `projects`,
`project_files`, `project_status_history`, `payments`, `messages`,
`notifications`, `contact_messages`, `testimonials`, `legal_pages`,
`settings`, `services`, `packages`, `rate_limit_log`.

General pattern:
- Students can read/write only rows they own (`user_id = auth.uid()` or
  equivalent).
- Admins (checked via `is_admin()`, a `SECURITY DEFINER` function with a
  locked-down `search_path`) can read/manage all rows in
  operationally-relevant tables.
- `SECURITY DEFINER` functions (`is_admin`, `handle_new_user`,
  `protect_project_fields`, `check_rate_limit`, and the rate-limit trigger
  functions) have `EXECUTE` revoked from `PUBLIC`/`anon` so they cannot be
  called directly via the REST API — they only run as triggers or from
  other trusted functions.

## 5. File Security

- Files live in a **private** Supabase Storage bucket (`project-files`,
  `public: false`) — never a public bucket.
- Upload is restricted by an explicit MIME-type allow-list (PDF, Office
  formats, CSV, TXT, JPG, PNG) and a 50MB size limit, enforced both
  client-side (`validateFile`) and via the bucket's own `allowed_mime_types`
  configuration server-side.
- Filenames are sanitized (`sanitizeFilename`) before being used in storage
  paths, and paths are always `${projectId}/${timestamp}_${safeName}` —
  never a raw user-supplied path — which prevents path traversal.
- Storage RLS policies scope read/write/delete to the file's owning
  project's `user_id`, or an admin.
- Downloads use short-lived signed URLs (1 hour), not permanent public
  links.

## 6. Payment Security

- Paystack's **secret key** is only ever read via `Deno.env.get()` inside
  edge functions — never present in frontend code or committed to Git.
- **Fixed during this review**: `paystack-init` previously accepted a
  client-supplied `amount` and only checked it was `> 0`, without comparing
  it to the actual package price. It now always resolves the amount from the
  project's assigned package in the database, ignoring any amount the client
  sends.
- Payment success is only ever recorded after either (a) the Paystack
  webhook's HMAC-SHA512 signature is verified against the raw request body,
  or (b) `paystack-verify` independently calls Paystack's own verification
  endpoint — the frontend's payment callback is never trusted on its own.
- **Fixed in migration 014**: the payments table originally had no UPDATE
  policy at all ("immutable from the client" by design), which meant the
  admin's manual Confirm/Reject buttons for bank-transfer payments
  (AdminPaymentsPage) silently failed with a permissions error every time.
  Migration 014 adds an admin-only UPDATE policy so that manual
  confirmation flow actually works. This is a separate, admin-driven path
  from the Paystack-verified flow above — it exists specifically for the
  Opay bank-transfer payments this product also accepts, where there's no
  webhook to verify against and a human has to confirm the transfer landed.
- **Known gap**: payment status changes made via the admin Confirm/Reject
  buttons are not yet logged to a dedicated audit table (unlike project
  status changes, which get a row in `project_status_history`). Worth
  adding before this workflow sees heavy real-money use.
- No card numbers, CVV, or PINs are ever stored — Paystack's hosted checkout
  handles all of that.

## 7. WhatsApp Integration

- **Fixed during this review**: `whatsapp-send` previously accepted any
  non-empty Authorization header without validating it. It now verifies the
  token against Supabase Auth and confirms the caller's profile role is
  `admin` before sending anything.
- Basic input validation added on phone number format and message length.

## 8. Rate Limiting

- **Added during this review**: a `rate_limit_log`-backed
  `check_rate_limit()` function, wired into database triggers for:
  - Contact form submissions — 5 per email per hour
  - Project creation — 10 per user per day
  - Messages — 40 per user per hour
  - Payment submissions — 5 per user per hour (migration 016)
- These are enforced at the database level (trigger `RAISE EXCEPTION`), so
  they can't be bypassed by calling the Supabase REST API directly, only by
  going through Supabase Auth as a real (rate-limited) user.
- **Not yet covered**: login attempts and password reset requests rely on
  Supabase Auth's own built-in rate limiting (Supabase enforces limits on
  these platform-side). Edge functions (`paystack-init`, `paystack-verify`)
  don't yet have their own explicit rate limit beyond Supabase's platform-
  level limits — the same `check_rate_limit()` function could be called from
  inside them if tighter control is wanted later.

## 9. Input Validation

- Type/length/format validation exists on forms client-side.
- Server-side enforcement relies on Postgres column constraints (`NOT NULL`,
  `CHECK` constraints on `role`, enums on `status`) and RLS `WITH CHECK`
  clauses, rather than a separate validation layer — appropriate given there
  is no custom backend API beyond the edge functions listed above.
- Edge functions validate required fields and reject malformed requests
  (missing `projectId`, invalid phone format, oversized messages, etc.).

## 10. XSS Protection

- No use of `dangerouslySetInnerHTML`, `eval()`, or `new Function()` was
  found anywhere in the codebase. React's default JSX rendering escapes all
  user-supplied content (names, project titles, messages, testimonials)
  automatically.

## 11. CORS

- Edge functions currently return `Access-Control-Allow-Origin: "*"`. This
  is acceptable short-term since every function independently verifies the
  caller's identity via a Supabase session token — origin is not being used
  as a security boundary. **Recommended before full production launch**:
  restrict this to the final production domain once it's finalized.

## 12. Security Headers

- A `_headers` file (Netlify format) has been added, applying:
  `Content-Security-Policy`, `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, and a restrictive `Permissions-Policy`.
- The CSP allows `connect-src` to Supabase (`*.supabase.co`, including
  websockets) and Paystack's API, plus a `frame-src` exception for
  Paystack's hosted checkout iframe. `style-src` includes `'unsafe-inline'`
  as a documented exception (React's inline `style` props require it);
  `script-src` does **not** include `unsafe-inline` or `unsafe-eval`.

## 13. Environment Variables

Public (safe in the browser bundle, `VITE_` prefix required by Vite):
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Server-only (edge function secrets — set via Supabase dashboard, never in
frontend `.env`):
```
SUPABASE_SERVICE_ROLE_KEY
PAYSTACK_SECRET_KEY
WHATSAPP_TOKEN
WHATSAPP_PHONE_NUMBER_ID
```

`.env.example` documents these with placeholders only. `.env` is excluded
via `.gitignore`.

## 14. Dependency Security

Dependency list is small and current as of this review (`@supabase/supabase-js`
2.57.x, React 18.3.x, Vite 5.4.x). No `npm audit` was run as part of this
review (no network access in the review environment) — **run `npm audit` in
your own environment before launch** and address any high/critical findings.
Avoid `npm audit fix --force`, which can silently introduce breaking version
changes — review each fix individually.

## 15. Git & Secret Exposure

- No hard-coded API keys, service-role keys, or Paystack secret keys were
  found anywhere in the tracked source code.
- During the build process (outside this codebase, in chat), a Supabase
  secret key was briefly pasted into a conversation by mistake. **That key
  was rotated/deleted immediately** and is no longer valid. This is noted
  here as a reminder: secret keys should only ever be entered directly into
  Supabase's or Bolt's own secret-management UI, never shared anywhere else,
  including with an AI assistant.

## 16. Production Deployment Checklist

- [ ] Run `npm audit` and address findings
- [ ] Set all server-only secrets in Supabase Edge Function settings (not `.env`)
- [ ] Restrict edge function CORS to the final production domain
- [ ] Confirm `_headers` file is actually served by your host (Netlify picks
      this up automatically; other hosts may need different config)
- [ ] Switch Paystack from test keys to live keys only once ready to accept
      real payments, and re-test the full payment flow
- [ ] Verify email templates/sender domain are configured in Supabase Auth
      settings (affects deliverability of verification/reset emails)
- [ ] Manually test the authorization cases in section "Known Limitations"
      below with two real test accounts (one student, one admin)

## 17. Known Limitations / Not Yet Done

- No dedicated accessibility audit (ARIA labels, focus states, contrast)
  has been performed as part of this security review — worth doing
  separately before public launch.
- Messaging does not use Supabase Realtime; the admin/student message
  thread requires a manual refresh to see new messages. Not a security
  issue, a UX gap.
- No automated security tests (the "Security Testing" scenarios in the
  original spec — authorization bypass attempts, injection attempts, etc.)
  have been executed against a live environment; this review was a static
  code/config audit. Manual testing with two real accounts is recommended
  before launch.
- Security event logging (failed logins, admin actions, etc.) is not yet
  implemented as a distinct audit log — Supabase's own dashboard logs cover
  some of this at the infrastructure level.
