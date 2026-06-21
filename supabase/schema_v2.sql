-- =====================================================================
-- MediFlow — Schema v2: Multi-hospital + real Supabase Auth
-- =====================================================================
-- IMPORTANT: This is a NEW schema for a fresh Supabase project, or for a
-- project where you're okay wiping existing demo data. It is NOT an
-- in-place migration of your v1 schema (the one with single-hospital
-- tables and no auth). If you already ran schema.sql before and have
-- real data you care about, talk to me before running this — don't just
-- paste and run.
--
-- For a fresh start: Supabase Dashboard -> SQL Editor -> New query ->
-- paste this whole file -> Run.
-- =====================================================================

create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. HOSPITALS (the new top-level entity everything is scoped to)
-- =====================================================================
create table if not exists hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text,
  state text,
  plan text default 'trial', -- trial | clinic | hospital | enterprise
  status text default 'active', -- active | suspended
  created_at timestamptz default now()
);

-- =====================================================================
-- 2. USER PROFILES — one row per real auth.users account.
-- This is the source of truth for "what role does this person have, and
-- at which hospital" — never trust a role claimed by the client.
-- =====================================================================
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  hospital_id uuid references hospitals(id) on delete cascade, -- null for super_admin
  role text not null check (role in ('super_admin','admin','doctor','nurse','patient')),
  full_name text not null,
  phone text,
  -- For doctor/patient roles, link to their corresponding domain row so
  -- e.g. a doctor's user_profile points at their doctors table entry.
  doctor_id uuid,
  patient_id uuid,
  created_at timestamptz default now()
);

-- =====================================================================
-- 3. DOMAIN TABLES — same as v1, but every one now carries hospital_id
-- =====================================================================
create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  name text not null,
  speciality text not null,
  speciality_te text,
  rating numeric(2,1) default 4.5,
  experience_years int default 1,
  fee int default 500,
  avatar_initials text,
  color text default '#01A7A6',
  created_at timestamptz default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  uhid text not null,
  name text not null,
  mobile text,
  age int,
  gender text,
  blood_group text,
  allergies text,
  chronic_conditions text,
  emergency_contact text,
  status text default 'OPD',
  created_at timestamptz default now(),
  unique (hospital_id, uhid)
);

create table if not exists family_links (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,
  member_patient_id uuid references patients(id) on delete cascade,
  relation text,
  created_at timestamptz default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,
  doctor_id uuid references doctors(id) on delete cascade,
  appointment_date date not null default current_date,
  appointment_time text not null,
  reason text,
  status text default 'confirmed',
  created_at timestamptz default now()
);

create table if not exists consultations (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  patient_id uuid references patients(id) on delete cascade,
  doctor_id uuid references doctors(id) on delete cascade,
  symptoms text,
  diagnosis text,
  notes text,
  ai_generated boolean default false,
  created_at timestamptz default now()
);

create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  consultation_id uuid references consultations(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,
  doctor_id uuid references doctors(id) on delete cascade,
  medicines jsonb not null default '[]',
  created_at timestamptz default now()
);

create table if not exists wards (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  name text not null,
  total_beds int not null default 10
);

create table if not exists beds (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  ward_id uuid references wards(id) on delete cascade,
  bed_number int not null,
  status text default 'available',
  patient_id uuid references patients(id) on delete set null,
  note text,
  updated_at timestamptz default now()
);

create table if not exists nurse_tasks (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  title text not null,
  task_time text,
  done boolean default false,
  created_at timestamptz default now()
);

create table if not exists pharmacy_stock (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  medicine_name text not null,
  quantity int not null default 0,
  expiry_date date,
  low_stock_threshold int default 50,
  created_at timestamptz default now()
);

create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,
  consultation_fee int default 0,
  lab_charges int default 0,
  medicine_charges int default 0,
  room_charges int default 0,
  total int generated always as (consultation_fee + lab_charges + medicine_charges + room_charges) stored,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists health_records (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,
  record_type text not null,
  doctor_id uuid references doctors(id),
  status text default 'Reviewed',
  created_at timestamptz default now()
);

create table if not exists ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,
  role text not null,
  content text not null,
  lang text default 'en',
  created_at timestamptz default now()
);

-- =====================================================================
-- 4. Helper function: looks up the calling user's profile. Used inside
-- RLS policies so each table can check "does this row's hospital_id match
-- the caller's hospital_id" without repeating a subquery everywhere.
-- =====================================================================
create or replace function auth_profile()
returns table (role text, hospital_id uuid, doctor_id uuid, patient_id uuid)
language sql security definer stable as $$
  select role, hospital_id, doctor_id, patient_id
  from user_profiles
  where id = auth.uid()
$$;

-- =====================================================================
-- 5. Row Level Security — this is the real access control layer now.
-- Pattern: super_admin sees everything; everyone else is scoped to their
-- own hospital_id. Patients are further scoped to their own patient_id
-- on patient-owned tables where that matters.
-- =====================================================================
alter table hospitals enable row level security;
alter table user_profiles enable row level security;
alter table doctors enable row level security;
alter table patients enable row level security;
alter table family_links enable row level security;
alter table appointments enable row level security;
alter table consultations enable row level security;
alter table prescriptions enable row level security;
alter table wards enable row level security;
alter table beds enable row level security;
alter table nurse_tasks enable row level security;
alter table pharmacy_stock enable row level security;
alter table bills enable row level security;
alter table health_records enable row level security;
alter table ai_chat_messages enable row level security;

-- Hospitals: super_admin manages all; staff can read their own hospital.
create policy "super_admin_all_hospitals" on hospitals for all
  using (exists (select 1 from auth_profile() where role = 'super_admin'))
  with check (exists (select 1 from auth_profile() where role = 'super_admin'));
create policy "staff_read_own_hospital" on hospitals for select
  using (id in (select hospital_id from auth_profile()));

-- user_profiles: people can read their own profile; super_admin reads all;
-- hospital admins can read profiles within their hospital (for staff mgmt).
create policy "read_own_profile" on user_profiles for select
  using (id = auth.uid());
create policy "super_admin_all_profiles" on user_profiles for all
  using (exists (select 1 from auth_profile() where role = 'super_admin'))
  with check (exists (select 1 from auth_profile() where role = 'super_admin'));
create policy "admin_read_hospital_profiles" on user_profiles for select
  using (hospital_id in (select hospital_id from auth_profile() where role = 'admin'));

-- Generic pattern applied to every hospital-scoped table: super_admin sees
-- all; everyone else only sees/writes rows in their own hospital_id.
do $$
declare
  t text;
  tables text[] := array[
    'doctors','patients','family_links','appointments','consultations',
    'prescriptions','wards','beds','nurse_tasks','pharmacy_stock','bills',
    'health_records','ai_chat_messages'
  ];
begin
  foreach t in array tables loop
    execute format($p$
      create policy "hospital_scoped_all_%1$s" on %1$s for all
      using (
        hospital_id in (select hospital_id from auth_profile())
        or exists (select 1 from auth_profile() where role = 'super_admin')
      )
      with check (
        hospital_id in (select hospital_id from auth_profile())
        or exists (select 1 from auth_profile() where role = 'super_admin')
      );
    $p$, t);
  end loop;
end $$;

-- =====================================================================
-- 6. Auto-create a user_profiles row whenever someone signs up via
-- Supabase Auth. Role/hospital_id/full_name are passed in via the
-- signup call's "options.data" and land in raw_user_meta_data.
-- =====================================================================
create or replace function handle_new_user()
returns trigger
language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, hospital_id, role, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'hospital_id', '')::uuid,
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================================
-- 7. Seed: one demo hospital + a super_admin bootstrap note.
-- =====================================================================
insert into hospitals (name, city, state, plan, status)
values ('Sri Sai Multispeciality Hospital', 'Vijayawada', 'Andhra Pradesh', 'hospital', 'active')
on conflict do nothing;

-- NOTE on creating your first Super Admin account:
-- Super Admin accounts are NOT created through the public signup form
-- (on purpose — you don't want random visitors signing up as Super Admin).
-- After running this schema, sign up normally once through the app as a
-- Hospital Admin (or any role) to create your auth.users row, then run:
--
--   update user_profiles set role = 'super_admin', hospital_id = null
--   where id = 'paste-your-user-id-here';
--
-- Find your user id in Supabase Dashboard -> Authentication -> Users.
