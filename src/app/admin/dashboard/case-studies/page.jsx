"use client";

import React from "react";
import InsightsListing from "@/components/Insights/InsightsListing";
// import backgroundImage from "../../../../public/ServicePage/software-delivery-team.jpg";
import backgroundImage from "@/assets/Insights/CaseStudies_Hero.webp";
import { caseStudiesData } from "@/data/caseStudiesData";

export default function CaseStudiesPage() {
    return (
        <InsightsListing
            items={caseStudiesData}
            basePath="/case-studies"
            backgroundImage={backgroundImage}
            subtitle="Proven Outcomes"
            title="Case Studies"
            description="Real Solutions. Measurable Impact. Built For Enterprise Transformation."
            highlights={[
                "Real-world SAP transformations",
                "Measurable business outcomes",
                "Cross-industry expertise",
                "Proven migration frameworks",
                "Client-validated results",
            ]}
            emptyStateText="No case studies published yet. Please check back soon."
        />
    );
}
