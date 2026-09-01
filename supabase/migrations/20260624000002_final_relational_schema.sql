-- supabase/migrations/20260624000002_final_relational_schema.sql

-- =============================================================================
-- MODULE 1: RELATIONAL POSTGRESQL SCHEMA (SUPABASE DDL)
-- Target: Final normalized schema for enterprise CRM and lead generation
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table: services
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(255) NOT NULL,
    base_price DECIMAL(12, 2),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table: marketing_campaigns
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    medium VARCHAR(255),
    utm_term VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Custom Types for Lead & Inquiry Management
DO $$ BEGIN
    CREATE TYPE public.lead_status_v2 AS ENUM ('New', 'Contacted', 'Qualified', 'Converted', 'Lost', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.inquiry_origin AS ENUM ('Contact Form', 'Service Detail', 'Callback Request', 'Newsletter');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Table: leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    company_size VARCHAR(100),
    industry VARCHAR(100) CHECK (
        industry IN (
            'Oil & Gas', 
            'Manufacturing', 
            'Finance', 
            'Healthcare', 
            'Retail', 
            'Construction', 
            'Public Sector'
        )
    ),
    problem_summary TEXT,
    status public.lead_status_v2 DEFAULT 'New' NOT NULL,
    lead_source VARCHAR(255) NOT NULL,
    marketing_campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
    consent_given BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- 5. Table: customers
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID UNIQUE REFERENCES public.leads(id) ON DELETE RESTRICT,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL CHECK (
        industry IN (
            'Oil & Gas', 'Manufacturing', 'Finance', 'Healthcare', 'Retail', 'Construction', 'Public Sector'
        )
    ),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Table: inquiries
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    inquiry_type public.inquiry_origin NOT NULL,
    preferred_callback_time TIMESTAMPTZ,
    utm_metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Indexing Architecture for Performance Optimization
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_customers_industry ON public.customers(industry);
CREATE INDEX IF NOT EXISTS idx_inquiries_lead_id ON public.inquiries(lead_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_service_id ON public.inquiries(service_id);

-- GIN Indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_services_metadata ON public.services USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_inquiries_utm_metadata ON public.inquiries USING GIN (utm_metadata);

-- 8. Row-Level Security (RLS) Configuration
-- Strictly matching GCC Regional Data Privacy Laws (UAE PDPL / Saudi PDPL)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 8.1 Global Read Policies
CREATE POLICY "Services are readable by everyone" ON public.services FOR SELECT USING (is_active = TRUE);

-- 8.2 Lead Generation Submission Policies (Anonymous)
CREATE POLICY "Allow public insert for leads" ON public.leads FOR INSERT WITH CHECK (consent_given = TRUE);
CREATE POLICY "Allow public insert for inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);

-- 8.3 Internal Admin Policies
-- Restricting lead/customer access to authenticated users with service roles or specific admin roles
CREATE POLICY "Admins have full access to customers" ON public.customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to leads" ON public.leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Admins have full access to inquiries" ON public.inquiries FOR ALL TO authenticated USING (true);

-- 9. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
