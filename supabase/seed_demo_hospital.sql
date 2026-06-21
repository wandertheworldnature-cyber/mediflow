-- =====================================================================
-- MediFlow — Seed data for the demo hospital
-- Run this AFTER schema_v2.sql, in a separate query.
-- It looks up "Sri Sai Multispeciality Hospital" by name (seeded in
-- schema_v2.sql) and attaches sample doctors/wards/beds/pharmacy to it.
-- Safe to re-run — uses ON CONFLICT / existence checks where it matters.
-- =====================================================================

do $$
declare
  h_id uuid;
begin
  select id into h_id from hospitals where name = 'Sri Sai Multispeciality Hospital' limit 1;

  if h_id is null then
    raise exception 'Demo hospital not found — run schema_v2.sql first.';
  end if;

  -- Doctors
  insert into doctors (hospital_id, name, speciality, speciality_te, rating, experience_years, fee, avatar_initials, color)
  select h_id, x.name, x.speciality, x.speciality_te, x.rating, x.exp, x.fee, x.avatar, x.color
  from (values
    ('Dr. Srinivas Rao', 'Cardiology', 'కార్డియాలజీ', 4.8, 14, 600, 'SR', '#01A7A6'),
    ('Dr. Lakshmi Prasanna', 'Pediatrics', 'పీడియాట్రిక్స్', 4.9, 9, 450, 'LP', '#0B5BC4'),
    ('Dr. Kiran Kumar', 'Orthopedics', 'ఆర్థోపెడిక్స్', 4.6, 11, 500, 'KK', '#2FB59B'),
    ('Dr. Anitha Reddy', 'Neurology', 'న్యూరాలజీ', 4.9, 17, 800, 'AR', '#FFB020'),
    ('Dr. Vamsi Krishna', 'Dental', 'డెంటల్', 4.7, 6, 350, 'VK', '#E0473E')
  ) as x(name, speciality, speciality_te, rating, exp, fee, avatar, color)
  where not exists (select 1 from doctors d where d.hospital_id = h_id and d.name = x.name);

  -- Wards
  insert into wards (hospital_id, name, total_beds)
  select h_id, x.name, x.total
  from (values ('Ward A — General', 15), ('Ward B — ICU', 10), ('Ward C — Maternity', 12)) as x(name, total)
  where not exists (select 1 from wards w where w.hospital_id = h_id and w.name = x.name);

  -- Beds (6 demo beds per ward)
  insert into beds (hospital_id, ward_id, bed_number, status)
  select h_id, w.id, gs, case when gs <= 4 then 'occupied' when gs = 5 then 'cleaning' else 'available' end
  from wards w, generate_series(1,6) gs
  where w.hospital_id = h_id
    and not exists (select 1 from beds b where b.ward_id = w.id);

  -- Pharmacy stock
  insert into pharmacy_stock (hospital_id, medicine_name, quantity, expiry_date, low_stock_threshold)
  select h_id, x.name, x.qty, x.expiry::date, x.threshold
  from (values
    ('Paracetamol 500mg', 450, '2027-12-01', 50),
    ('Amoxicillin 250mg', 38, '2027-03-01', 50),
    ('Insulin Glargine', 12, '2026-09-01', 20),
    ('Atorvastatin 10mg', 210, '2028-06-01', 50),
    ('ORS Sachets', 600, '2027-11-01', 100)
  ) as x(name, qty, expiry, threshold)
  where not exists (select 1 from pharmacy_stock p where p.hospital_id = h_id and p.medicine_name = x.name);

  -- Nurse tasks
  insert into nurse_tasks (hospital_id, title, task_time, done)
  select h_id, x.title, x.task_time, x.done
  from (values
    ('Medicine round — Ward A', '2:00 PM', false),
    ('Vitals check — Bed A2, A5', '2:30 PM', false),
    ('Discharge follow-up — Ward A', '3:00 PM', false),
    ('Vitals check — ICU all beds', '1:00 PM', true)
  ) as x(title, task_time, done)
  where not exists (select 1 from nurse_tasks t where t.hospital_id = h_id and t.title = x.title);

  -- A few demo patients
  insert into patients (hospital_id, uhid, name, mobile, age, gender, blood_group, allergies, chronic_conditions, emergency_contact, status)
  select h_id, x.uhid, x.name, x.mobile, x.age, x.gender, x.bg, x.allergies, x.chronic, x.emergency, x.status
  from (values
    ('AP-22450', 'Ramesh Babu Naidu', '9000123456', 41, 'M', 'B+', 'Penicillin', 'Type 2 Diabetes', '+91 90001 23456', 'OPD'),
    ('AP-22451', 'Ravi Teja', '9876543210', 34, 'M', 'O+', 'None', 'None', '+91 98765 43211', 'Admitted'),
    ('AP-22452', 'Lakshmi Devi', '9988776655', 61, 'F', 'A+', 'Sulfa drugs', 'Hypertension', '+91 99887 76656', 'OPD'),
    ('AP-22453', 'Kumar Swamy', '9123456780', 45, 'M', 'B-', 'None', 'None', '+91 91234 56781', 'OPD'),
    ('AP-22454', 'Sita Mahalakshmi', '9001122334', 29, 'F', 'AB+', 'None', 'None', '+91 90011 22335', 'Discharged')
  ) as x(uhid, name, mobile, age, gender, bg, allergies, chronic, emergency, status)
  where not exists (select 1 from patients p where p.hospital_id = h_id and p.uhid = x.uhid);

end $$;
