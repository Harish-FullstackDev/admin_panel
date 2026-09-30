import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CandidateDatabase } from '@/types/candidateDatabase.types';

const candidateUrl =
  process.env.NEXT_PUBLIC_CANDIDATE_SUPABASE_URL || 'https://placeholder-project-dummy.supabase.co';
const candidatePublishableKey =
  process.env.NEXT_PUBLIC_CANDIDATE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_dummy';

export const CANDIDATE_RESUME_BUCKET = 'resumes';

// Separate storageKey keeps candidate sessions apart from the admin project's
// client in the same browser.
export const candidateSupabase: SupabaseClient<CandidateDatabase> =
  createClient<CandidateDatabase>(candidateUrl, candidatePublishableKey, {
    auth: { persistSession: true, storageKey: 'ascendus-candidate-auth' },
  });

export const createCandidateAdminClient = (): SupabaseClient<CandidateDatabase> => {
  const serviceRoleKey = process.env.CANDIDATE_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('CANDIDATE_SUPABASE_SERVICE_ROLE_KEY missing in environment variables.');
  }
  return createClient<CandidateDatabase>(candidateUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};
