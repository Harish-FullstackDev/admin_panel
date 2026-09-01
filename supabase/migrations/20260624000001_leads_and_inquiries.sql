-- =============================================================================
-- MODULE 2: SUPABASE POSTGRESQL TARGET DDL
-- Target: Lead Generation and Inquiries Tables 
-- =============================================================================

-- CLEAN START: Drop existing tables so we avoid missing column errors
DROP TABLE IF EXISTS public.inquiries CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;

-- 1. Table Enums & Custom Types (Safe Creation)
DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('New', 'Contacted', 'Qualified', 'Lost', 'Converted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE inquiry_type AS ENUM ('Contact Form', 'Callback Request', 'Direct Email', 'Other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE company_size_tier AS ENUM ('1-50', '51-200', '201-1000', '1000+');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Table Definitions

-- Table: leads
CREATE TABLE public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_size company_size_tier,
    lead_source VARCHAR(100), -- E.g., 'Contact Form', 'Callback Request'
    problem_summary TEXT, -- Added to match frontend form payload
    status lead_status DEFAULT 'New'::lead_status NOT NULL,
    consent_given BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]*[A-Za-z]+$')
);

-- Table: inquiries
CREATE TABLE public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL,
    inquiry_type inquiry_type NOT NULL,
    message TEXT,
    preferred_time VARCHAR(100),
    utm_metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Foreign Key Constraint
    CONSTRAINT fk_lead
        FOREIGN KEY (lead_id)
        REFERENCES public.leads (id)
        ON DELETE CASCADE
);

-- 3. Indexing Architecture
-- B-Tree index for Foreign Key (optimization for JOINs)
CREATE INDEX idx_inquiries_lead_id ON public.inquiries USING btree (lead_id);

-- Lookup index for frequent email searches
CREATE INDEX idx_leads_email ON public.leads USING btree (email);

-- Lookup index for filtering via specific status
CREATE INDEX idx_leads_status ON public.leads USING btree (status);

-- GIN Index for rapid JSONB key/value querying
CREATE INDEX idx_inquiries_utm_metadata ON public.inquiries USING gin (utm_metadata);

-- Trigger to auto-update 'updated_at' on leads
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to prevent duplicates on rerun
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- 4. Supabase RLS (Row-Level Security)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist to prevent duplicate object errors on rerun
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow public insert to leads" ON public.leads;
DROP POLICY IF EXISTS "Allow public insert to inquiries" ON public.inquiries;

-- Only authenticated internal users/admins can read everything
CREATE POLICY "Admins can view all leads" ON public.leads
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all inquiries" ON public.inquiries
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Allow public inserts (Anonymous lead generation from the custom website forms)
CREATE POLICY "Allow public insert to leads" ON public.leads
    FOR INSERT TO public
    WITH CHECK (true);

CREATE POLICY "Allow public insert to inquiries" ON public.inquiries
    FOR INSERT TO public
    WITH CHECK (true);
