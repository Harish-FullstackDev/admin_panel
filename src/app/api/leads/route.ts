import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Enterprise Lead Ingestion Endpoint
 * Validates and stores leads and associated inquiries into Supabase.
 * Matching: GCC Regional Data Privacy Laws & EU GDPR.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Technical Validation
    const requiredFields = ['first_name', 'last_name', 'email', 'consent_given', 'inquiry_type'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Field '${field}' is mandatory for enterprise ingestion.` }, { status: 400 });
      }
    }

    if (!body.consent_given) {
      return NextResponse.json({ error: 'Explicit data processing consent is required under UAE/Saudi PDPL.' }, { status: 400 });
    }

    // 2. Lead Ingestion (with Campaign Attribution)
    const { data: lead, error: leadError } = await (supabase as any)
      .from('leads')
      .upsert({
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email.toLowerCase(),
        phone: body.phone,
        company: body.company,
        industry: body.industry,
        problem_summary: body.problem_summary,
        lead_source: body.lead_source || 'Web Channel',
        consent_given: body.consent_given,
        status: 'New'
      })
      .select('id')
      .single();

    if (leadError || !lead) {
      console.error('Lead Ingestion Error:', leadError);
      return NextResponse.json({ code: leadError?.code, error: leadError?.message || 'Lead capture failed.' }, { status: 500 });
    }

    // 3. Inquiry Documentation
    const { error: inquiryError } = await (supabase as any)
      .from('inquiries')
      .insert({
        lead_id: (lead as any).id,
        service_id: body.service_id || null,
        message: body.problem_summary || body.message || 'No specific technical message provided.',
        inquiry_type: body.inquiry_type,
        preferred_callback_time: body.preferred_callback_time || null,
        utm_metadata: {
          utm_source: body.utm_source,
          utm_medium: body.utm_medium,
          utm_campaign: body.utm_campaign,
          referrer_url: body.referrer_url,
          timestamp: new Date().toISOString()
        }
      });

    if (inquiryError) {
      console.error('Inquiry Persistence Error:', inquiryError);
      // We don't fail the whole request if the inquiry log fails, but we should inform local logs.
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Enterprise requirement captured successfully.',
      reference_id: lead.id 
    }, { status: 201 });

  } catch (err: any) {
    console.error('API Handler Critical Failure:', err);
    return NextResponse.json({ error: 'Internal system fault. Please contact SST technical support.' }, { status: 500 });
  }
}
