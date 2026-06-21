# MediFlow — Smart Hospital Management System

A real, working hospital management web app: Admin panel, Doctor app, Nurse app,
and Patient app, sharing one live Supabase database, with real AI features
powered by Groq (AI Medical Scribe, AI diagnosis suggestions, AI Health
Assistant chat in English/Telugu).

This is a genuine starting point for a real product — not a mockup. Read the
**"What's real vs. what's still a demo"** section below before showing this
to real patients or putting in real medical data.

---

## 1. What you need (both free)

1. **Supabase account** — https://supabase.com → New Project (free tier is enough)
2. **Groq API key** — https://console.groq.com/keys (free tier, generous limits)
3. **Node.js 18.18+** installed locally — https://nodejs.org

---

## 2. Set up the database

1. In your new Supabase project, go to **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this project, copy the entire contents, paste into the SQL editor, and click **Run**.
3. This creates every table (patients, doctors, appointments, beds, wards, prescriptions, etc.), sets up permissive demo-friendly access policies, and seeds it with sample doctors, wards/beds, pharmacy stock, and a few patients.
4. Go to **Project Settings → API**. You'll need three values for the next step:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (click "Reveal") → `SUPABASE_SERVICE_ROLE_KEY` — **keep this secret, never put it in client-side code or commit it**

### Turning on Realtime (so updates appear live across roles)
Go to **Database → Replication** in Supabase, and make sure the tables you care about most (`beds`, `appointments`, `patients`, `nurse_tasks`, `health_records`) have replication toggled on. If you skip this, the app still works — it just falls back to polling every 15 seconds instead of instant updates.

---

## 3. Configure your local environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the three Supabase values from above, plus your Groq key:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=your-groq-key
```

---

## 4. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll land on the login screen. Enter any mobile number, any 4-digit OTP (this is a demo login, see caveats below), then pick a role. If you pick **Patient**, you'll choose which seeded patient profile to act as.

---

## 5. Deploy to Vercel (or Netlify)

### Vercel (recommended — built by the makers of Next.js)
1. Push this project to a GitHub repo.
2. Go to https://vercel.com/new and import the repo.
3. In the project's **Environment Variables** settings, add the same 4 variables from your `.env.local`.
4. Deploy. Vercel auto-detects Next.js — no extra config needed.

### Netlify
1. Push to GitHub, then "Add new site → Import an existing project" in Netlify.
2. Build command: `npm run build` — Netlify's Next.js runtime plugin handles the rest automatically for most Next.js 14 App Router projects.
3. Add the same 4 environment variables in **Site settings → Environment variables**.

Either way: your Groq key and Supabase service role key only ever run on the server (inside `/app/api/*` routes), so they're never exposed to anyone visiting the site.

---

## 6. Project structure

```
app/
  login/              Role + demo OTP login
  admin/              Hospital Admin: dashboard, patients, appointments, billing, pharmacy, AI insights
  doctor/             Doctor: queue, consultation (with real AI diagnosis suggestions), AI Scribe
  nurse/              Nurse: live ward/bed map, task list
  patient/            Patient: home, booking, records, family vault, health card, AI chat assistant
  api/                All backend logic (Next.js API routes) — every database & AI call goes through here
components/           Shared UI: icons, shell/layout pieces, language + session context
hooks/                Reusable hooks: realtime subscriptions, toast notifications, route guards
lib/                  Supabase clients (admin/browser), Groq AI helper functions, fetch wrapper
supabase/schema.sql   Full database schema + seed data — run this once in Supabase's SQL editor
```

---

## 7. What's real vs. what's still a demo

**Genuinely real and working:**
- All data (patients, appointments, consultations, prescriptions, beds, pharmacy, tasks, billing) lives in your real Supabase Postgres database and persists permanently.
- Actions are connected across roles: when a Doctor saves a consultation, it marks the appointment completed, creates a prescription, and adds a health record the Patient can see — all in one real database transaction-ish flow.
- Nurse bed changes (admit/discharge/cleaning) update in real time for Admin's occupancy view via Supabase Realtime (with a polling fallback).
- The AI Medical Scribe, AI diagnosis suggestions, and AI Health Assistant chat all make real calls to Groq's LLM API and return real, freshly generated responses — not canned text.
- The patient AI chat has a basic safety layer: messages matching self-harm/crisis language patterns get routed to crisis helpline information instead of the general model.

**Still a demo / not production-ready — be aware before using this for real patients:**
- **Login is not real authentication.** Any mobile number + any 4-digit code logs you in, and anyone can pick any role including "Doctor" or "Admin." There's no password, no verification, no per-user accounts. Before handling real patient data, replace this with proper auth (Supabase Auth supports real OTP/SMS verification and you can add role-based access control on top).
- **Database access policies are wide open** (`USING (true)`) so the app works simply for a demo. Before going live with real PII, you'll want row-level security policies that actually restrict who can read/write what.
- **AI suggestions are unreviewed by a real clinician** — they're explicitly labeled as suggestions for a doctor to review, but you are responsible for how this is used in any real clinical setting. This is not a regulated medical device.
- **No payments integration** — billing screens calculate totals but don't process real payments (no Razorpay/UPI wired in yet).
- **No SMS/WhatsApp sending** — those buttons currently just show a confirmation toast; wiring up Twilio/WhatsApp Business API is a follow-up step.

---

## 8. Sensible next steps, roughly in order of impact

1. Replace demo login with real Supabase Auth (email/phone OTP) + role-based access control.
2. Lock down RLS policies once real auth exists.
3. Wire up Razorpay for real billing/payments.
4. Build out a full record view (reports/prescriptions/appointments) for each family member in the vault — right now adding a member correctly creates and links their record, but tapping into their full history isn't built yet.
5. Add WhatsApp/SMS sending (Twilio or similar) for invoices and appointment reminders.

If you want help with any of these, just ask — each one is a reasonably scoped follow-up rather than a rebuild.
