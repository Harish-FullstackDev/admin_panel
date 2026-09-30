export type ApplicationStatus =
  | 'New'
  | 'Reviewed'
  | 'Shortlisted'
  | 'Interviewing'
  | 'Rejected'
  | 'Hired';

type ApplicationRow = {
  id: string;
  candidate_id: string | null;
  job_id: string | null;
  job_slug: string | null;
  position: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  experience: string | null;
  job_title: string | null;
  employer: string | null;
  key_skills: string | null;
  cover_letter: string | null;
  resume_path: string;
  resume_filename: string | null;
  start_date: string | null;
  current_salary: string | null;
  expected_salary: string | null;
  linkedin: string | null;
  portfolio: string | null;
  ref_name: string | null;
  ref_relationship: string | null;
  ref_email: string | null;
  ref_phone: string | null;
  hear_about: string | null;
  consent_given: boolean;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  country: string | null;
  linkedin: string | null;
  portfolio: string | null;
  key_skills: string | null;
  experience: string | null;
  resume_path: string | null;
  resume_filename: string | null;
  created_at: string;
  updated_at: string;
};

type Nullable<T> = { [K in keyof T]?: T[K] | null };

export interface CandidateDatabase {
  public: {
    Tables: {
      candidate_profiles: {
        Row: ProfileRow;
        Insert: Nullable<Omit<ProfileRow, 'id' | 'email'>> & { id: string; email: string };
        Update: Nullable<ProfileRow>;
        Relationships: [];
      };
      applications: {
        Row: ApplicationRow;
        Insert: Nullable<
          Omit<ApplicationRow, 'position' | 'first_name' | 'last_name' | 'email' | 'resume_path'>
        > & {
          position: string;
          first_name: string;
          last_name: string;
          email: string;
          resume_path: string;
        };
        Update: Nullable<ApplicationRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
