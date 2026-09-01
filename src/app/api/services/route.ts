import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET /api/services
// Returns a list of active services for dynamic select populations.
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (err: any) {
    console.error('Services API Error:', err);
    return NextResponse.json({ error: 'Failed to fetch services.' }, { status: 500 });
  }
}
