-- supabase/migrations/20260621_initial_schema.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: services
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 2: marketing_campaigns
CREATE TABLE public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    medium VARCHAR(255),
    utm_term VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Custom ENUM for lead status
CREATE TYPE public.lead_status AS ENUM ('New', 'In Progress', 'Converted', 'Rejected');

-- Table 3: leads
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    company_size VARCHAR(100),
    problem_summary TEXT,
    status public.lead_status DEFAULT 'New' NOT NULL,
    lead_source VARCHAR(255) NOT NULL,
    marketing_campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
    consent_given BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 4: customers
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID UNIQUE REFERENCES public.leads(id) ON DELETE SET NULL,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL CHECK (
        industry IN (
            'Oil & Gas', 
            'Manufacturing & Logistics', 
            'Finance & Banking', 
            'Healthcare', 
            'Retail & FMCG', 
            'Construction & Real Estate', 
            'Public Sector & Education'
        )
    ),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 5: inquiries
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    inquiry_type VARCHAR(255) NOT NULL,
    preferred_callback_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add Indexes for Performance
CREATE INDEX idx_services_slug ON public.services(slug);
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_customers_industry ON public.customers(industry);
CREATE INDEX idx_inquiries_lead_id ON public.inquiries(lead_id);
CREATE INDEX idx_inquiries_service_id ON public.inquiries(service_id);

-- Setup Row Level Security (RLS) policies
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Allow public read access to services (needed for frontend mapping)
CREATE POLICY "Public profiles are viewable by everyone."
ON public.services FOR SELECT
USING ( true );

-- Public can insert leads (if using anon key) but can't view them
CREATE POLICY "Public can insert leads"
ON public.leads FOR INSERT
WITH CHECK ( true );

-- Public can insert inquiries
CREATE POLICY "Public can insert inquiries"
ON public.inquiries FOR INSERT
WITH CHECK ( true );
