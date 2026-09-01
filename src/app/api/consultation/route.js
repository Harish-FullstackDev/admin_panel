import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseClient';

// GET /api/consultation — Retrieve all consultation requests
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('lead_source', 'Consultation Request')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/consultation] Query failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('[GET /api/consultation] Unhandled exception:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/consultation
// Fields: email (required), message (optional)
export async function POST(req) {
  try {
    const body = await req.json();
    const { email, message } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const leadId = crypto.randomUUID();

    const { error: leadError } = await supabase.from('leads').insert({
      id: leadId,
      first_name: 'Consultation',
      last_name: 'Request',
      email: email.trim().toLowerCase(),
      problem_summary: message?.trim() || null,
      lead_source: 'Consultation Request',
      consent_given: true,
      status: 'New',
    });

    if (leadError) {
      console.error('[POST /api/consultation] Lead insert failed:', leadError);
      if (leadError.code === '23505') {
        return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
      }
      return NextResponse.json(
        { error: 'Failed to save email or send notification.' },
        { status: 500 }
      );
    }

    // Create a linked inquiry record for tracking
    const { error: inquiryError } = await supabase.from('inquiries').insert({
      lead_id: leadId,
      inquiry_type: 'Direct Email',
      message: message?.trim() || 'No additional message provided.',
      utm_metadata: {},
    });

    if (inquiryError) {
      console.warn('[POST /api/consultation] Inquiry insert failed (non-fatal):', inquiryError);
    }

    console.log(`[POST /api/consultation] Consultation request captured. Lead ID: ${leadId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Email saved and notification sent successfully.',
        data: { id: leadId },
      },
      { status: 201 }
    );

  } catch (err) {
    console.error('[POST /api/consultation] Unhandled exception:', err.message);
    return NextResponse.json({ error: 'Failed to save email or send notification.' }, { status: 500 });
  }
}