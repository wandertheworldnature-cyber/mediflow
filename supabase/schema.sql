-- =====================================================================
-- ⚠️ DEPRECATED — superseded by schema_v2.sql + seed_demo_hospital.sql
-- This was the original single-hospital, no-auth schema. It's kept here
-- only for reference. Do not run this for new setups — use schema_v2.sql.
-- =====================================================================
-- MediFlow — Supabase schema
-- Run this entire file in: Supabase Dashboard -> SQL Editor -> New query
-- =====================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ---------- DOCTORS ----------
create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
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

-- ---------- PATIENTS ----------
create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  uhid text unique not null,
  name text not null,
  mobile text,
  age int,
  gender text,
  blood_group text,
  allergies text,
  chronic_conditions text,
  emergency_contact text,
  status text default 'OPD', -- OPD | Admitted | Discharged
  created_at timestamptz default now()
);

-- ---------- FAMILY LINKS (Family Health Vault) ----------
create table if not exists family_links (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  member_patient_id uuid references patients(id) on delete cascade,
  relation text,
  created_at timestamptz default now()
);

-- ---------- APPOINTMENTS ----------
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  doctor_id uuid references doctors(id) on delete cascade,
  appointment_date date not null default current_date,
  appointment_time text not null,
  reason text,
  status text default 'confirmed', -- confirmed | waiting | completed | cancelled
  created_at timestamptz default now()
);

-- ---------- CONSULTATIONS (OPD/EMR entries) ----------
create table if not exists consultations (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete set null,
  patient_id uuid references patients(id) on delete cascade,
  doctor_id uuid references doctors(id) on delete cascade,
  symptoms text,
  diagnosis text,
  notes text,
  ai_generated boolean default false,
  created_at timestamptz default now()
);

-- ---------- PRESCRIPTIONS ----------
create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid references consultations(id) on delete cascade,
  patient_id uuid references patients(id) on delete cascade,
  doctor_id uuid references doctors(id) on delete cascade,
  medicines jsonb not null default '[]', -- [{name, dosage, duration}]
  created_at timestamptz default now()
);

-- ---------- WARDS & BEDS ----------
create table if not exists wards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  total_beds int not null default 10
);

create table if not exists beds (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid references wards(id) on delete cascade,
  bed_number int not null,
  status text default 'available', -- available | occupied | cleaning
  patient_id uuid references patients(id) on delete set null,
  note text,
  updated_at timestamptz default now()
);

-- ---------- NURSE TASKS ----------
create table if not exists nurse_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  task_time text,
  done boolean default false,
  created_at timestamptz default now()
);

-- ---------- PHARMACY ----------
create table if not exists pharmacy_stock (
  id uuid primary key default gen_random_uuid(),
  medicine_name text not null,
  quantity int not null default 0,
  expiry_date date,
  low_stock_threshold int default 50,
  created_at timestamptz default now()
);

-- ---------- BILLING ----------
create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  consultation_fee int default 0,
  lab_charges int default 0,
  medicine_charges int default 0,
  room_charges int default 0,
  total int generated always as (consultation_fee + lab_charges + medicine_charges + room_charges) stored,
  status text default 'pending', -- pending | paid
  created_at timestamptz default now()
);

-- ---------- HEALTH RECORDS (reports, etc.) ----------
create table if not exists health_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  record_type text not null,
  doctor_id uuid references doctors(id),
  status text default 'Reviewed',
  created_at timestamptz default now()
);

-- ---------- AI ASSISTANT CHAT LOG (per patient) ----------
create table if not exists ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  role text not null, -- user | assistant
  content text not null,
  lang text default 'en',
  created_at timestamptz default now()
);

-- =====================================================================
-- Row Level Security: kept OPEN for this prototype (anon key can read/write).
-- This matches the "demo / shared dataset" use case. For a real production
-- deployment with real patient data, you would lock these down with proper
-- auth-based policies before going live with real PII.
-- =====================================================================
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

create policy "public_all_doctors" on doctors for all using (true) with check (true);
create policy "public_all_patients" on patients for all using (true) with check (true);
create policy "public_all_family_links" on family_links for all using (true) with check (true);
create policy "public_all_appointments" on appointments for all using (true) with check (true);
create policy "public_all_consultations" on consultations for all using (true) with check (true);
create policy "public_all_prescriptions" on prescriptions for all using (true) with check (true);
create policy "public_all_wards" on wards for all using (true) with check (true);
create policy "public_all_beds" on beds for all using (true) with check (true);
create policy "public_all_nurse_tasks" on nurse_tasks for all using (true) with check (true);
create policy "public_all_pharmacy_stock" on pharmacy_stock for all using (true) with check (true);
create policy "public_all_bills" on bills for all using (true) with check (true);
create policy "public_all_health_records" on health_records for all using (true) with check (true);
create policy "public_all_ai_chat_messages" on ai_chat_messages for all using (true) with check (true);

-- =====================================================================
-- Seed data
-- =====================================================================
insert into doctors (name, speciality, speciality_te, rating, experience_years, fee, avatar_initials, color) values
('Dr. Srinivas Rao', 'Cardiology', 'కార్డియాలజీ', 4.8, 14, 600, 'SR', '#01A7A6'),
('Dr. Lakshmi Prasanna', 'Pediatrics', 'పీడియాట్రిక్స్', 4.9, 9, 450, 'LP', '#0B5BC4'),
('Dr. Kiran Kumar', 'Orthopedics', 'ఆర్థోపెడిక్స్', 4.6, 11, 500, 'KK', '#2FB59B'),
('Dr. Anitha Reddy', 'Neurology', 'న్యూరాలజీ', 4.9, 17, 800, 'AR', '#FFB020'),
('Dr. Vamsi Krishna', 'Dental', 'డెంటల్', 4.7, 6, 350, 'VK', '#E0473E')
on conflict do nothing;

insert into wards (name, total_beds) values
('Ward A — General', 15),
('Ward B — ICU', 10),
('Ward C — Maternity', 12)
on conflict do nothing;

-- Seed beds for each ward (6 visible beds per ward for the demo board)
insert into beds (ward_id, bed_number, status)
select w.id, gs, case when gs <= 4 then 'occupied' when gs = 5 then 'cleaning' else 'available' end
from wards w, generate_series(1,6) gs
where not exists (select 1 from beds b where b.ward_id = w.id);

insert into pharmacy_stock (medicine_name, quantity, expiry_date, low_stock_threshold) values
('Paracetamol 500mg', 450, '2027-12-01', 50),
('Amoxicillin 250mg', 38, '2027-03-01', 50),
('Insulin Glargine', 12, '2026-09-01', 20),
('Atorvastatin 10mg', 210, '2028-06-01', 50),
('ORS Sachets', 600, '2027-11-01', 100)
on conflict do nothing;

insert into nurse_tasks (title, task_time, done) values
('Medicine round — Ward A', '2:00 PM', false),
('Vitals check — Bed A2, A5', '2:30 PM', false),
('Discharge follow-up — Ward A', '3:00 PM', false),
('Vitals check — ICU all beds', '1:00 PM', true)
on conflict do nothing;

insert into patients (uhid, name, mobile, age, gender, blood_group, allergies, chronic_conditions, emergency_contact, status) values
('AP-22450', 'Ramesh Babu Naidu', '9000123456', 41, 'M', 'B+', 'Penicillin', 'Type 2 Diabetes', '+91 90001 23456', 'OPD'),
('AP-22451', 'Ravi Teja', '9876543210', 34, 'M', 'O+', 'None', 'None', '+91 98765 43211', 'Admitted'),
('AP-22452', 'Lakshmi Devi', '9988776655', 61, 'F', 'A+', 'Sulfa drugs', 'Hypertension', '+91 99887 76656', 'OPD'),
('AP-22453', 'Kumar Swamy', '9123456780', 45, 'M', 'B-', 'None', 'None', '+91 91234 56781', 'OPD'),
('AP-22454', 'Sita Mahalakshmi', '9001122334', 29, 'F', 'AB+', 'None', 'None', '+91 90011 22335', 'Discharged')
on conflict do nothing;
