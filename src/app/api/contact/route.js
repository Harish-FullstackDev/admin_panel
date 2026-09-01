import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseClient';

// Translate Postgres error codes to user-facing messages
function resolveDbError(code, fallback) {
  const errorMap = {
    '23505': 'This email address has already been registered.',
    '23514': 'The email address format provided is invalid.',
    '23503': 'Submission failed due to a reference error. Please try again.',
  };
  return errorMap[code] || fallback || 'Failed to save contact. Please try again later.';
}

// GET /api/contact — Retrieve all leads (admin use only, no auth guard for legacy compat)
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/contact] Query failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('[GET /api/contact] Unhandled exception:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/contact — Insert a contact form submission into Supabase `leads` table
// Accepts the same field names as the legacy MongoDB route to avoid breaking the Form component
export async function POST(req) {
  try {
    const body = await req.json();
    const { firstName, lastName, cmpnyEmail, contactNumber, country, companyName, message } = body;

    // --- Input Validation (mirrors legacy route requirements) ---
    if (!firstName || !lastName || !cmpnyEmail || !contactNumber || !country || !companyName || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cmpnyEmail.trim())) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const leadId = crypto.randomUUID();

    // Map legacy field names to Supabase schema columns
    const { error: leadError } = await supabase.from('leads').insert({
      id: leadId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: cmpnyEmail.trim().toLowerCase(),
      phone: contactNumber.trim(),
      problem_summary: `Country: ${country.trim()} | Company: ${companyName.trim()} | Enquiry: ${message.trim()}`,
      lead_source: 'Contact Page Form',
      consent_given: true, // Form submission implies consent
      status: 'New',
    });

    if (leadError) {
      console.error('[POST /api/contact] Lead insert failed:', leadError);
      return NextResponse.json(
        { error: resolveDbError(leadError.code, leadError.message) },
        { status: leadError.code === '23505' ? 409 : 500 }
      );
    }

    // Log this as an inquiry record as well
    const { error: inquiryError } = await supabase.from('inquiries').insert({
      lead_id: leadId,
      inquiry_type: 'Contact Form',
      message: message.trim(),
      utm_metadata: { company: companyName.trim(), country: country.trim() },
    });

    if (inquiryError) {
      // Non-fatal: lead is already captured, log and continue
      console.warn('[POST /api/contact] Inquiry insert failed (non-fatal):', inquiryError);
    }

    console.log(`[POST /api/contact] Successfully captured contact. Lead ID: ${leadId}`);

    return NextResponse.json(
      { success: true, message: 'Contact saved successfully.', data: { id: leadId } },
      { status: 201 }
    );

  } catch (err) {
    console.error('[POST /api/contact] Unhandled exception:', err.message);

    return NextResponse.json(
      { error: 'Failed to save contact or send email.' },
      { status: 500 }
    );
  }
}