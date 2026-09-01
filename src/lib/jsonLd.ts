export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Support Studio Technologies",
    "url": "https://www.supportstudio.tech",
    "logo": "https://www.supportstudio.tech/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+971-XX-XXXXXXX",
      "contactType": "customer service",
      "areaServed": ["AE", "SA", "BH", "QA", "OM", "KW"],
      "availableLanguage": ["en", "ar"]
    },
    "sameAs": [
      "https://www.linkedin.com/company/support-studio-technologies",
      "https://twitter.com/SupportStudioTech"
    ]
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export function generateServiceSchema(serviceName: string, description: string, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": serviceName,
    "description": description,
    "provider": {
      "@type": "Organization",
      "name": "Support Studio Technologies",
      "url": "https://www.supportstudio.tech"
    },
    "areaServed": ["AE", "SA", "BH", "QA", "OM", "KW"],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "SAP Ecosystem Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "SAP Implementation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "SAP Integration"
          }
        }
      ]
    },
    "url": url
  };
}
