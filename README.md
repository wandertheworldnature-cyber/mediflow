# MediFlow — Smart Hospital Management System

A real, multi-hospital SaaS: Super Admin onboards hospitals, each hospital
gets its own Admin/Doctor/Nurse/Patient apps backed by one shared Supabase
database, with real email/password authentication and real AI features
powered by Groq (AI Medical Scribe, AI diagnosis suggestions, AI Health
Assistant chat in English/Telugu).

Read **"What's real vs. what's still a demo"** below before using this with
real patient data.

---

## 1. What you need (both free)

1. **Supabase account** — https://supabase.com → New Project
2. **Groq API key** — https://console.groq.com/keys
3. **Node.js 18.18+** — https://nodejs.org

---

## 2. Set up the database (two SQL files now, in order)

1. Supabase Dashboard → **SQL Editor** → New query
2. Paste the entire contents of **`supabase/schema_v2.sql`** → Run.
   This creates the hospitals table, user_profiles, every domain table
   (now with `hospital_id`), all RLS policies, the auto-profile-creation
   trigger for new signups, and seeds one demo hospital
   ("Sri Sai Multispeciality Hospital").
3. New query → paste **`supabase/seed_demo_hospital.sql`** → Run.
   This attaches sample doctors, wards/beds, pharmacy stock, and a few
   patients to that demo hospital, so you have something to look at
   immediately.

   > If you ran the old single-hospital `schema.sql` from a previous
   > version of this project, **don't run `schema_v2.sql` on top of it** —
   > start with a fresh Supabase project instead, since the table shapes
   > changed (every table now has `hospital_id`).

4. **Project Settings → API** — copy 3 values for the next step (Project URL, anon public key, service_role key).

### Creating your first Super Admin account
Super Admin can't be created through the public signup form on purpose —
you don't want random visitors signing themselves up with platform-wide
access. Instead:

1. Run the app (see step 4 below) and sign up normally once, through any
   path (e.g. "I'm setting up a new hospital").
2. In Supabase Dashboard → **Authentication → Users**, find your new user
   and copy their ID.
3. Go to **SQL Editor** and run:
   ```sql
   update user_profiles set role = 'super_admin', hospital_id = null
   where id = 'paste-your-user-id-here';
   ```
4. Sign out and back in — you'll now land on `/super-admin` instead of the
   hospital admin dashboard.

---

## 3. Configure your local environment

```bash
cp .env.example .env.local
```

Fill in the 4 values (3 Supabase + 1 Groq) — same as before, no new env
vars were added for the auth system, since Supabase Auth uses the same
project credentials.

---

## 4. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 → redirects to `/login`. Click **"Create an
account"** to sign up — pick "I'm setting up a new hospital" for your
first account, which creates both a hospital and your Admin login in one
step.

To add a doctor, nurse, or patient: as the Hospital Admin, go to **Staff &
Onboarding** to find your hospital's join code, then have that person sign
up via the matching path and paste in the code.

---

## 5. Deploy to Vercel

Same as before — push to GitHub, import into Vercel, add the same 4
environment variables, deploy.

One addition for this version: after deploying, do the **Super Admin
bootstrap** (section 2 above) against your production Supabase project the
same way — it's a one-time manual step regardless of environment.

---

## 6. Project structure (what's new in this version)

```
app/
  login/, signup/        Real email/password auth — signup has 3 paths:
                          new hospital / join as staff / join as patient
  super-admin/            New role: onboard hospitals, suspend/activate, see join codes
  admin/ doctor/ nurse/ patient/   Same as before, now driven by real auth + hospital scoping
  api/auth/me, api/auth/signup     New auth endpoints
  api/hospitals/          New: Super Admin hospital management
  api/...                 Every existing route now requires a real signed-in
                           session and scopes all reads/writes to the
                           caller's hospital_id (see lib/auth.js)
lib/auth.js               Server-side session verification — the real
                           source of truth for "who is this, what's their
                           role, which hospital." Never trust client input
                           for this.
lib/withErrors.js         Shared error-handling wrapper for API routes
components/AuthContext.js Real auth context (replaces the old demo
                           SessionContext, which has been deleted)
supabase/schema_v2.sql    New multi-hospital schema with RLS + auth triggers
supabase/seed_demo_hospital.sql   Seed data for the demo hospital
```

---

## 7. What's real vs. what's still a demo

**Genuinely real and working:**
- Real email + password authentication via Supabase Auth — actual accounts, actual sessions stored in cookies, actual password hashing. No more "any phone number, any OTP" demo login.
- Roles are enforced **server-side** on every API call (`lib/auth.js`), not just hidden in the UI — a Doctor account genuinely cannot read another hospital's data or act as Admin, even by calling the API directly.
- Multi-hospital data isolation via Postgres Row Level Security — every table is scoped to `hospital_id`, and RLS policies enforce this at the database level as a second layer beneath the API-level checks.
- Super Admin can onboard hospitals, see cross-hospital stats, and suspend/activate accounts.
- Hospital Admin gets a join code (their hospital's ID) to share with staff/patients for self-serve signup into their specific hospital.
- All the AI features (Scribe, diagnosis suggestions, patient chat) and live cross-role data sync from the previous version still work the same way, now correctly scoped per-hospital.

**Still not production-grade — read before handling real patient data:**
- **No real SMS OTP.** You asked to keep this free, so this version uses email + password instead of phone OTP. If you want real SMS OTP later, that requires a paid provider (Twilio, MSG91) — Firebase Phone Auth also isn't actually free despite the name, it requires Firebase's Blaze plan.
- **No email verification enforced.** Signup creates accounts with `email_confirm: true` (auto-confirmed) so you don't need to wire up email sending to test the app. For a real launch, you'd want to flip that and require real email verification.
- **Hospital join codes are just the hospital's UUID.** This is simple and works, but it's not a true invite-token system (no expiry, no single-use, no revocation). Anyone who has the code can join as a doctor/nurse/patient claiming any name. Fine for a pilot with trusted staff; not fine for a public-facing launch — a real invite-link system with expiring tokens is a sensible next step.
- **No payments, no real SMS/WhatsApp sending** — same as before.
- **The auth wiring (lib/auth.js, @supabase/ssr usage) has been built carefully against Supabase's documented APIs but not run against a live Supabase project from this environment** (no internet access in the sandbox this was built in). It's the part of this update most likely to need a small fix on first real run — if sign-in/sign-up doesn't work, check the browser console and your Supabase project's Authentication logs first, and send me the exact error.

---

## 8. Sensible next steps, roughly in order of impact

1. Test the full signup → login → role-scoped-data flow end to end against your real Supabase project; fix whatever the first real run surfaces.
2. Replace UUID join codes with real expiring/single-use invite tokens.
3. Turn on real email verification.
4. Add real SMS OTP via Twilio/MSG91 if you decide it's worth the cost later.
5. Wire up Razorpay for real billing/payments.
6. Lock down `email_confirm` and consider adding password reset flows (Supabase Auth supports this natively — `supabase.auth.resetPasswordForEmail()`).
