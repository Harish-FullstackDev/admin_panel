import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project-dummy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) {
  console.warn(
    'Missing Supabase frontend environment variables. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are populated.'
  );
}

// 1. STANDARD CLIENT INSTANCE (For Frontend / Client-side usage)
// Safe, generic anonymous client constrained by RLS policies
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: { persistSession: true }
  }
);

// 2. ADMIN ISOLATED CLIENT (For Backend / Next.js Server Components / Route Handlers)
// Bypasses Row-Level Security for critical pipeline operations
export const createAdminClient = (): SupabaseClient<Database> => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('FATAL: SUPABASE_SERVICE_ROLE_KEY missing in environment variables. Cannot initialize secure Admin Client.');
  }

  return createClient<Database>(
    supabaseUrl || '',
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false // Never persist sessions in server-side functions
      }
    }
  );
};
