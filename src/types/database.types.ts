export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type IndustryVertical = 'Oil & Gas' | 'Manufacturing' | 'Finance' | 'Healthcare' | 'Retail' | 'Construction' | 'Public Sector';

export type InquiryOrigin = 'Contact Form' | 'Service Detail' | 'Callback Request' | 'Newsletter';

export type JobModeOfWork = 'Remote' | 'Hybrid' | 'On-site';

export type JobTypeOfWork = 'Full-time' | 'Part-time' | 'Contract' | 'Freelancer' | 'Internship';

export type JobStatus = 'Open' | 'Closed' | 'Draft';

export type JobApplicationStatus =
  | 'New'
  | 'Reviewed'
  | 'Shortlisted'
  | 'Interviewing'
  | 'Rejected'
  | 'Hired';

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string; // UUID
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          company: string | null;
          company_size: string | null;
          industry: IndustryVertical | null;
          problem_summary: string | null;
          status: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost' | 'Rejected';
          lead_source: string;
          marketing_campaign_id: string | null;
          consent_given: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          company_size?: string | null;
          industry?: IndustryVertical | null;
          problem_summary?: string | null;
          status?: 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost' | 'Rejected';
          lead_source: string;
          marketing_campaign_id?: string | null;
          consent_given?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['leads']['Insert']>;
      };

      inquiries: {
        Row: {
          id: string;
          lead_id: string;
          service_id: string | null;
          message: string;
          inquiry_type: InquiryOrigin;
          preferred_callback_time: string | null;
          utm_metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          service_id?: string | null;
          message: string;
          inquiry_type: InquiryOrigin;
          preferred_callback_time?: string | null;
          utm_metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['inquiries']['Insert']>;
      };

      services: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          category: string;
          base_price: number | null;
          is_active: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description: string;
          category: string;
          base_price?: number | null;
          is_active?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };

      customers: {
        Row: {
          id: string;
          lead_id: string;
          company_name: string;
          industry: IndustryVertical;
          contact_email: string;
          contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          company_name: string;
          industry: IndustryVertical;
          contact_email: string;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };

      marketing_campaigns: {
        Row: {
          id: string;
          campaign_name: string;
          source: string;
          medium: string | null;
          utm_term: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_name: string;
          source: string;
          medium?: string | null;
          utm_term?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['marketing_campaigns']['Insert']>;
      };

      blogs: {
        Row: {
          id: string;
          title: string;
          slug: string;
          cover_image: string;
          author: string;
          publish_date: string;
          sections: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          cover_image: string;
          author: string;
          publish_date?: string;
          sections?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['blogs']['Insert']>;
      };

      case_studies: {
        Row: {
          id: string;
          slug: string;
          title: string;
          category: string;
          summary: string;
          cover_image: string;
          publish_date: string;
          author: string;
          meta_line: string | null;
          tags: string[];
          highlights: Json;
          sections: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          category: string;
          summary: string;
          cover_image: string;
          publish_date?: string;
          author: string;
          meta_line?: string | null;
          tags: string[];
          highlights?: Json;
          sections?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['case_studies']['Insert']>;
      };

      white_papers: {
        Row: {
          id: string;
          slug: string;
          title: string;
          category: string;
          summary: string;
          cover_image: string;
          publish_date: string;
          author: string;
          meta_line: string | null;
          tags: string[];
          file_info: string | null;
          download_url: string | null;
          sections: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          category: string;
          summary: string;
          cover_image: string;
          publish_date?: string;
          author: string;
          meta_line?: string | null;
          tags: string[];
          file_info?: string | null;
          download_url?: string | null;
          sections?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['white_papers']['Insert']>;
      };

      jobs: {
        Row: {
          id: string;
          title: string;
          slug: string;
          company: string;
          location: string;
          mode_of_work: JobModeOfWork;
          type_of_work: JobTypeOfWork;
          experience_level: string;
          categories: string[];
          about_job: string;
          responsibilities: string[];
          qualifications: string[];
          status: JobStatus;
          posted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          company?: string;
          location: string;
          mode_of_work?: JobModeOfWork;
          type_of_work?: JobTypeOfWork;
          experience_level: string;
          categories?: string[];
          about_job?: string;
          responsibilities?: string[];
          qualifications?: string[];
          status?: JobStatus;
          posted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
      };

      job_applications: {
        Row: {
          id: string;
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
          status: JobApplicationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          position: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          country?: string | null;
          experience?: string | null;
          job_title?: string | null;
          employer?: string | null;
          key_skills?: string | null;
          cover_letter?: string | null;
          resume_path: string;
          resume_filename?: string | null;
          start_date?: string | null;
          current_salary?: string | null;
          expected_salary?: string | null;
          linkedin?: string | null;
          portfolio?: string | null;
          ref_name?: string | null;
          ref_relationship?: string | null;
          ref_email?: string | null;
          ref_phone?: string | null;
          hear_about?: string | null;
          consent_given?: boolean;
          status?: JobApplicationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['job_applications']['Insert']>;
      };
    };
  };
}

