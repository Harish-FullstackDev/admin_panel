/**
 * SEO Utility for generating JSON-LD Structured Data
 * Target: Enterprise search intent for IT and SAP consulting services.
 */

import { InquiryOrigin } from "@/types/database.types";

export const generateOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Support Studio Technologies",
    "alternateName": "SST Technologies",
    "url": "https://www.supportstudio.tech",
    "logo": "https://www.supportstudio.tech/PartnerLogos/sst-logo.png",
    "description": "Support Studio Technologies (SST) is a premium enterprise IT and SAP consulting firm providing digital transformation, cloud managed services, and S/4HANA migration across the UAE, Saudi Arabia, and the GCC.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Dubai",
      "addressCountry": "AE"
    },
    "sameAs": [
      "https://www.linkedin.com/company/support-studio-technologies",
      "https://twitter.com/SST_Tech"
    ],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+971-XXXX-XXXX", // Tracking in pending_assets.md
        "contactType": "customer service",
        "areaServed": ["AE", "SA", "BH", "QA", "OM", "KW"],
        "availableLanguage": ["en", "ar"]
      }
    ]
  };
};

export const generateBreadcrumbSchema = (crumbs: { name: string; item: string }[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.item.startsWith('http') ? crumb.item : `https://www.supportstudio.tech${crumb.item}`
    }))
  };
};

export const generateServiceSchema = (service: { name: string; description: string; url: string; category?: string }) => {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": service.category || "IT Consulting",
    "provider": {
      "@type": "Organization",
      "name": "Support Studio Technologies",
      "url": "https://www.supportstudio.tech"
    },
    "name": service.name,
    "description": service.description,
    "url": service.url.startsWith('http') ? service.url : `https://www.supportstudio.tech${service.url}`,
    "areaServed": [
      { "@type": "Country", "name": "United Arab Emirates" },
      { "@type": "Country", "name": "Saudi Arabia" },
      { "@type": "Country", "name": "Bahrain" }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Enterprise IT Solutions",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "SAP S/4HANA Consulting"
          }
        }
      ]
    }
  };
};
