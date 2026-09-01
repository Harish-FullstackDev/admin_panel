import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { email, consent_given } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    if (!consent_given) {
      return NextResponse.json({ error: 'Consent is required for newsletter subscription.' }, { status: 400 });
    }

    const supabase = createAdminClient() as any; // eslint-disable-line
    const leadId = crypto.randomUUID();

    // 1. Create/Update Lead 
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .upsert({
        email: email.trim().toLowerCase(),
        first_name: 'Newsletter',
        last_name: 'Subscriber',
        lead_source: 'Newsletter Subscription',
        consent_given: true,
        status: 'New'
      }, { onConflict: 'email' })
      .select('id')
      .single();

    if (leadError) {
        console.error('Newsletter Lead Error:', leadError);
        throw leadError;
    }

    // 2. Create Inquiry record
    const { error: inquiryError } = await supabase
      .from('inquiries')
      .insert({
        lead_id: leadData.id,
        inquiry_type: 'Newsletter',
        message: 'Newsletter subscription request.',
        utm_metadata: { segment: 'general_newsletter' }
      });

    if (inquiryError) {
      console.warn('Newsletter inquiry log failed:', inquiryError);
    }

    return NextResponse.json({ success: true, message: 'Successfully subscribed to the newsletter.' }, { status: 201 });

  } catch (err: any) {
    console.error('Newsletter API Error:', err);
    return NextResponse.json({ error: err.message || 'Server error during subscription.' }, { status: 500 });
  }
}
