import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseClient';

// GET /api/sales/dashboard
// Returns a consolidated analytical view joining inquiries → leads → services.
// Restricted to authenticated admin users (validated via Authorization header bearer token).
export async function GET(request: NextRequest) {
  try {
    // --- Authorization Guard ---
    // In production, validate a Supabase JWT or a secret API key from request headers.
    const authHeader = request.headers.get('authorization');
    const expectedAdminToken = process.env.ADMIN_DASHBOARD_SECRET;

    if (!expectedAdminToken) {
      console.error('[GET /api/sales/dashboard] ADMIN_DASHBOARD_SECRET env var is not set.');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    if (!authHeader || authHeader !== `Bearer ${expectedAdminToken}`) {
      return NextResponse.json({ error: 'Unauthorized. Valid admin credentials are required.' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // --- Parse optional query filters ---
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const limitParam = parseInt(searchParams.get('limit') || '100', 10);
    const offsetParam = parseInt(searchParams.get('offset') || '0', 10);
    const limit = isNaN(limitParam) || limitParam > 500 ? 100 : limitParam;
    const offset = isNaN(offsetParam) ? 0 : offsetParam;

    // --- Deep Relational Fetch in a Single Network Round-Trip ---
    // Joins inquiries ← leads ← marketing_campaigns in one compound Supabase selector.
    let query = supabase
      .from('inquiries')
      .select(
        `
        id,
        inquiry_type,
        message,
        preferred_time,
        utm_metadata,
        created_at,
        leads (
          id,
          first_name,
          last_name,
          email,
          phone,
          company_size,
          lead_source,
          problem_summary,
          status,
          consent_given,
          created_at,
          marketing_campaigns (
            utm_source,
            utm_medium,
            utm_campaign,
            referrer_url,
            created_at
          )
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply optional lead status filter by traversing the relational join
    if (statusFilter) {
      const validStatuses = ['New', 'Contacted', 'Qualified', 'Lost', 'Converted'];
      if (!validStatuses.includes(statusFilter)) {
        return NextResponse.json(
          { error: `Invalid status filter. Must be one of: ${validStatuses.join(', ')}.` },
          { status: 400 }
        );
      }
      // PostgREST syntax for filtering through a foreign table join
      query = query.eq('leads.status', statusFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[GET /api/sales/dashboard] Relational query failed:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve dashboard data.', code: error.code },
        { status: 500 }
      );
    }

    console.log(`[GET /api/sales/dashboard] Successfully returned ${data?.length ?? 0} records.`);

    return NextResponse.json(
      {
        success: true,
        total: count ?? data?.length ?? 0,
        limit,
        offset,
        data: data ?? [],
      },
      { status: 200 }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected server error.';
    console.error('[GET /api/sales/dashboard] Unhandled exception:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
