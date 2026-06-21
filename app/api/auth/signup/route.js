import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Handles two real signup flows:
//
// 1. "new_hospital" — someone signing up as a Hospital Admin for a brand
//    new hospital. Creates the hospital row AND the admin's account in one
//    transaction-ish flow. This is the self-serve onboarding path.
//
// 2. "join_hospital" — someone (doctor/nurse/patient) signing up against
//    an existing hospital, identified by a join code. We use the
//    hospital's id (shown to staff by their admin) as a simple join code
//    for now — see note in the README about hardening this later with a
//    real invite-token system.
//
// Super Admin accounts are deliberately NOT creatable here — see
// supabase/schema_v2.sql's bootstrap note for how that's done manually.
export async function POST(req) {
  try {
    const sb = supabaseAdmin();
    const body = await req.json();
    const { mode, email, password, fullName, phone, role } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'Email, password, and full name are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    let hospitalId = null;

    if (mode === 'new_hospital') {
      if (!body.hospitalName) {
        return NextResponse.json({ error: 'Hospital name is required.' }, { status: 400 });
      }
      const { data: hospital, error: hErr } = await sb
        .from('hospitals')
        .insert({ name: body.hospitalName, city: body.city || null, state: body.state || null, plan: 'trial', status: 'active' })
        .select()
        .single();
      if (hErr) throw hErr;
      hospitalId = hospital.id;
    } else if (mode === 'join_hospital') {
      if (!body.hospitalId) {
        return NextResponse.json({ error: 'Hospital join code is required.' }, { status: 400 });
      }
      const { data: hospital, error: hErr } = await sb.from('hospitals').select('id, status').eq('id', body.hospitalId).single();
      if (hErr || !hospital) {
        return NextResponse.json({ error: 'No hospital found for that join code. Double-check it with your hospital admin.' }, { status: 400 });
      }
      if (hospital.status === 'suspended') {
        return NextResponse.json({ error: 'This hospital account is currently suspended.' }, { status: 403 });
      }
      hospitalId = hospital.id;
    } else {
      return NextResponse.json({ error: 'Invalid signup mode.' }, { status: 400 });
    }

    const finalRole = mode === 'new_hospital' ? 'admin' : (role || 'patient');
    if (!['admin', 'doctor', 'nurse', 'patient'].includes(finalRole)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    // Create the real auth user. The DB trigger (handle_new_user) reads
    // user_metadata and creates the matching user_profiles row automatically.
    const { data: created, error: authErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email verification for this app; flip to false if you want real verification emails
      user_metadata: {
        hospital_id: hospitalId,
        role: finalRole,
        full_name: fullName,
        phone: phone || null,
      },
    });

    if (authErr) {
      // Roll back the hospital we just created if user creation failed,
      // so we don't leave orphaned hospitals around on repeated failed signups.
      if (mode === 'new_hospital' && hospitalId) {
        await sb.from('hospitals').delete().eq('id', hospitalId);
      }
      if (authErr.message?.toLowerCase().includes('already registered') || authErr.message?.toLowerCase().includes('already exists')) {
        return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
      }
      throw authErr;
    }

    // If this is a doctor signing up, also create their public `doctors`
    // row and link it, so they show up as bookable immediately.
    if (finalRole === 'doctor') {
      const { data: doctorRow, error: docErr } = await sb
        .from('doctors')
        .insert({ hospital_id: hospitalId, name: fullName, speciality: body.speciality || 'General Medicine', fee: body.fee || 500, avatar_initials: fullName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() })
        .select()
        .single();
      if (docErr) {
        // The auth account already exists at this point — don't fail the
        // whole signup over this, but surface it so it's visible rather
        // than silently leaving the account without a linked doctor row.
        console.error('Failed to create doctor row during signup:', docErr.message);
      } else if (doctorRow) {
        await sb.from('user_profiles').update({ doctor_id: doctorRow.id }).eq('id', created.user.id);
      }
    }

    // If this is a patient signing up, create their `patients` row too.
    // Retry the UHID a couple times in the unlikely case of a collision
    // with the (hospital_id, uhid) uniqueness constraint.
    if (finalRole === 'patient') {
      let patientRow = null;
      let lastErr = null;
      for (let attempt = 0; attempt < 3 && !patientRow; attempt++) {
        const uhid = `${(body.stateCode || 'AP')}-${Math.floor(20000 + Math.random() * 9999)}`;
        const { data, error: pErr } = await sb
          .from('patients')
          .insert({ hospital_id: hospitalId, uhid, name: fullName, mobile: phone || null, status: 'OPD' })
          .select()
          .single();
        if (data) patientRow = data;
        else lastErr = pErr;
      }
      if (patientRow) {
        await sb.from('user_profiles').update({ patient_id: patientRow.id }).eq('id', created.user.id);
      } else {
        console.error('Failed to create patient row during signup after retries:', lastErr?.message);
      }
    }

    return NextResponse.json({ data: { userId: created.user.id, hospitalId, role: finalRole } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
