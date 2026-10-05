import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CandidateDatabase } from '@/types/candidateDatabase.types';

// Single HCM project: candidates, internal users, jobs and all recruitment data.
const hcmUrl =
  process.env.NEXT_PUBLIC_CANDIDATE_SUPABASE_URL || 'https://placeholder-project-dummy.supabase.co';
const hcmPublishableKey =
  process.env.NEXT_PUBLIC_CANDIDATE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_dummy';

export const CANDIDATE_RESUME_BUCKET = 'resumes';
export const INTERNAL_SESSION_COOKIE = 'hcm_session';

// Separate storage keys keep a candidate session and an internal session in
// the same browser from overwriting each other.
export const candidateSupabase: SupabaseClient<CandidateDatabase> =
  createClient<CandidateDatabase>(hcmUrl, hcmPublishableKey, {
    auth: { persistSession: true, storageKey: 'ascendus-candidate-auth' },
  });

export const internalSupabase: SupabaseClient = createClient(hcmUrl, hcmPublishableKey, {
  auth: { persistSession: true, storageKey: 'ascendus-internal-auth' },
});

function serviceKey() {
  const key = process.env.CANDIDATE_SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('CANDIDATE_SUPABASE_SERVICE_ROLE_KEY missing in environment variables.');
  return key;
}

const serverOptions = { auth: { autoRefreshToken: false, persistSession: false } };

export const createCandidateAdminClient = (): SupabaseClient<CandidateDatabase> =>
  createClient<CandidateDatabase>(hcmUrl, serviceKey(), serverOptions);

// Untyped: HCM tables are not in CandidateDatabase and are used from JS routes.
export const createHcmAdminClient = (): SupabaseClient =>
  createClient(hcmUrl, serviceKey(), serverOptions);
