import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseClient';

// GET /api/bookacall — Retrieve all book-a-call leads
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('lead_source', 'Book a Call')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/bookacall] Query failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('[GET /api/bookacall] Unhandled exception:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/bookacall
// Fields: name, email, companyName, country, message
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, companyName, country, message } = body;

    if (!name || !email || !companyName || !country || !message) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const leadId = crypto.randomUUID();

    // Split name into first/last for the normalized schema
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'N/A';

    const { error: leadError } = await supabase.from('leads').insert({
      id: leadId,
      first_name: firstName,
      last_name: lastName,
      email: email.trim().toLowerCase(),
      problem_summary: `Company: ${companyName.trim()} | Country: ${country.trim()} | Message: ${message.trim()}`,
      lead_source: 'Book a Call',
      consent_given: true,
      status: 'New',
    });

    if (leadError) {
      console.error('[POST /api/bookacall] Lead insert failed:', leadError);
      if (leadError.code === '23505') {
        return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to save your request. Please try again.' }, { status: 500 });
    }

    // Log as inquiry
    const { error: inquiryError } = await supabase.from('inquiries').insert({
      lead_id: leadId,
      inquiry_type: 'Contact Form',
      message: message.trim(),
      utm_metadata: { company: companyName.trim(), country: country.trim() },
    });

    if (inquiryError) {
      console.warn('[POST /api/bookacall] Inquiry insert failed (non-fatal):', inquiryError);
    }

    console.log(`[POST /api/bookacall] Lead captured. ID: ${leadId}`);

    return NextResponse.json(
      { success: true, message: 'Contact saved successfully.', data: { id: leadId } },
      { status: 201 }
    );

  } catch (err) {
    console.error('[POST /api/bookacall] Unhandled exception:', err.message);
    return NextResponse.json({ error: 'Failed to save contact or send email.' }, { status: 500 });
  }
}