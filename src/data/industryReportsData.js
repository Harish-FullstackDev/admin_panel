// Local mock data for the Industry Reports page.
// TODO: replace with a database-backed fetch (see src/app/api/blog/route.js for the Supabase pattern).

export const industryReportsData = [
  {
    id: 1,
    slug: "2026-state-of-sap-s4hana-adoption",
    title: "2026 State of SAP S/4HANA Adoption: Global Benchmark Report",
    type: "Industry Report",
    category: "Enterprise Transformation",
    summary:
      "An analysis of S/4HANA adoption rates, migration timelines, and clean core practices across 400+ enterprises worldwide.",
    cover_image: "/Home/Hero-Section-BG.jpg",
    publish_date: "2026-03-02",
    author: "Ascendus Market Research",
    metaLine: "Global · 2026 Edition",
    tags: ["SAP S/4HANA", "Benchmark", "Global"],
    fileInfo: "Global coverage · 400+ enterprises surveyed",
    downloadUrl: "#",
    sections: [
      {
        heading: "Overview",
        content:
          "This benchmark report surveys migration status, timelines, and strategic priorities among 400+ enterprises currently running or planning a move to SAP S/4HANA, spanning manufacturing, retail, financial services, and life sciences.",
      },
      {
        heading: "Key Findings",
        content:
          "58% of surveyed enterprises have completed or are in active migration, up from 41% in last year's edition. Clean core adoption is the single strongest predictor of on-time, on-budget migration outcomes. Organizations citing 'lack of internal skills' as their top barrier grew from 22% to 34% year over year.",
      },
      {
        heading: "Methodology",
        content:
          "Data was collected via a structured survey of IT and finance leaders between October 2025 and January 2026, supplemented by anonymized project timeline data from Ascendus-led engagements and public SAP customer disclosures.",
      },
      {
        heading: "Outlook",
        content:
          "We expect migration momentum to accelerate through 2027 as SAP's mainstream maintenance deadlines approach, with the skills gap — rather than budget — becoming the primary constraint for most enterprises.",
      },
    ],
  },
  {
    id: 2,
    slug: "manufacturing-digital-transformation-outlook-2026",
    title: "Manufacturing Industry Digital Transformation Outlook 2026",
    type: "Industry Report",
    category: "Manufacturing",
    summary:
      "Trends shaping digital transformation investment across manufacturing, from smart factory adoption to supply chain resilience.",
    cover_image: "/ServicePage/software-delivery-team.jpg",
    publish_date: "2026-01-14",
    author: "Ascendus Market Research",
    metaLine: "Global · 2026 Edition",
    tags: ["Manufacturing", "Digital Transformation", "Supply Chain"],
    fileInfo: "Global coverage · Manufacturing sector focus",
    downloadUrl: "#",
    sections: [
      {
        heading: "Overview",
        content:
          "This report examines how manufacturers are prioritizing digital investment in 2026, with particular focus on smart factory technology, supply chain visibility, and ERP modernization.",
      },
      {
        heading: "Key Findings",
        content:
          "Supply chain visibility remains the top-funded initiative for the third consecutive year. Manufacturers with real-time inventory and production data integrated into their ERP reported 30% fewer stockout incidents than peers relying on batch-updated reporting.",
      },
      {
        heading: "Outlook",
        content:
          "Expect continued consolidation of shop-floor IoT platforms with core ERP systems, as manufacturers seek a single source of truth for production, quality, and inventory data rather than siloed MES and ERP reporting.",
      },
    ],
  },
  {
    id: 3,
    slug: "cloud-infrastructure-spending-trends",
    title: "Cloud Infrastructure Spending Trends Across Enterprises",
    type: "Industry Report",
    category: "Cloud Infrastructure",
    summary:
      "A breakdown of enterprise cloud infrastructure budgets, migration priorities, and multi-cloud strategy adoption for the year ahead.",
    cover_image: "/SolutionPage/BusinessTechnology.png",
    publish_date: "2025-11-20",
    author: "Ascendus Market Research",
    metaLine: "Global · 2025 Edition",
    tags: ["Cloud Infrastructure", "IT Budget", "Multi-Cloud"],
    fileInfo: "Global coverage · Cross-industry",
    downloadUrl: "#",
    sections: [
      {
        heading: "Overview",
        content:
          "This report tracks how enterprises are allocating infrastructure budget across public cloud, private cloud, and hybrid environments, with a focus on cost optimization and workload placement strategy.",
      },
      {
        heading: "Key Findings",
        content:
          "Cost optimization overtook new workload migration as the top infrastructure priority for the first time this year. Enterprises running SAP workloads increasingly favor hyperscaler-certified SAP HANA infrastructure over self-managed data center deployments.",
      },
      {
        heading: "Outlook",
        content:
          "FinOps practices are moving from a specialized function to a standard expectation of infrastructure teams, and we expect multi-cloud governance tooling to see the fastest budget growth of any infrastructure category next year.",
      },
    ],
  },
  {
    id: 4,
    slug: "cybersecurity-threat-landscape-enterprise-sap",
    title: "Cybersecurity Threat Landscape for Enterprise SAP Systems",
    type: "Industry Report",
    category: "Cybersecurity",
    summary:
      "An analysis of emerging threat vectors targeting SAP landscapes and how enterprise security teams are adapting their defenses.",
    cover_image: "/ServicePage/Card_BG_S.webp",
    publish_date: "2025-10-05",
    author: "Ascendus Market Research",
    metaLine: "Global · 2025 Edition",
    tags: ["Cybersecurity", "SAP Security", "Threat Intelligence"],
    fileInfo: "Global coverage · Cross-industry",
    downloadUrl: "#",
    sections: [
      {
        heading: "Overview",
        content:
          "This report analyzes reported vulnerabilities and attack patterns targeting SAP environments over the past 12 months, alongside how enterprise security teams are responding.",
      },
      {
        heading: "Key Findings",
        content:
          "Misconfigured identity and access controls remain implicated in the majority of reported SAP-related incidents. Enterprises with automated SAP-specific vulnerability scanning detected and remediated critical issues on average three weeks faster than those relying on generic IT security tooling.",
      },
      {
        heading: "Outlook",
        content:
          "As more SAP workloads move to the cloud, we expect identity governance and continuous configuration monitoring to become baseline requirements rather than advanced security maturity indicators.",
      },
    ],
  },
  {
    id: 5,
    slug: "retail-consumer-goods-ai-adoption-index-2026",
    title: "Retail & Consumer Goods: AI Adoption Index 2026",
    type: "Industry Report",
    category: "Retail & Consumer Goods",
    summary:
      "How retail and consumer goods companies are deploying AI across demand forecasting, personalization, and supply chain planning.",
    cover_image: "/SolutionPage/CUSTOMEREXPERIENCE2.png",
    publish_date: "2025-08-27",
    author: "Ascendus Market Research",
    metaLine: "Global · 2026 Edition",
    tags: ["Retail", "AI Adoption", "Consumer Goods"],
    fileInfo: "Global coverage · Retail & CPG focus",
    downloadUrl: "#",
    sections: [
      {
        heading: "Overview",
        content:
          "This index measures AI adoption maturity across retail and consumer goods companies, scoring organizations on data readiness, use-case deployment, and measured business impact.",
      },
      {
        heading: "Key Findings",
        content:
          "Demand forecasting remains the most widely deployed AI use case, but personalization initiatives show the highest reported revenue impact per dollar invested. Companies scoring highest on data readiness were three times more likely to report positive ROI from AI initiatives.",
      },
      {
        heading: "Outlook",
        content:
          "We expect embedded AI features within core commerce and ERP platforms to close the gap with custom-built models for mid-market retailers who lack dedicated data science teams.",
      },
    ],
  },
  {
    id: 6,
    slug: "financial-services-core-banking-to-cloud",
    title: "Financial Services Modernization Report: Core Banking to Cloud",
    type: "Industry Report",
    category: "Financial Services",
    summary:
      "An examination of how financial institutions are modernizing core banking and finance operations while maintaining regulatory compliance.",
    cover_image: "/SolutionPage/FINANCECONTROLLING.png",
    publish_date: "2025-06-30",
    author: "Ascendus Market Research",
    metaLine: "Global · 2025 Edition",
    tags: ["Financial Services", "Cloud Migration", "Compliance"],
    fileInfo: "Global coverage · Financial Services focus",
    downloadUrl: "#",
    sections: [
      {
        heading: "Overview",
        content:
          "This report examines the pace and approach financial institutions are taking to modernize core banking and finance systems, balancing innovation against regulatory and risk constraints.",
      },
      {
        heading: "Key Findings",
        content:
          "Parallel-run cutover strategies were used in the majority of successful zero-downtime migrations reported this year. Institutions citing regulatory complexity as their top modernization barrier decreased slightly as more regional regulators published cloud-specific compliance guidance.",
      },
      {
        heading: "Outlook",
        content:
          "We expect continued growth in composable finance architectures, where institutions run core ledger functions on a modernized platform while integrating specialized fintech capabilities at the edge.",
      },
    ],
  },
];

export const getIndustryReportBySlug = (slug) =>
  industryReportsData.find((item) => item.slug === slug) || null;
