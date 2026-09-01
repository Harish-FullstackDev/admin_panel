// Local mock data for the Whitepapers page.
// TODO: replace with a database-backed fetch (see src/app/api/blog/route.js for the Supabase pattern).

export const whitepapersData = [
  {
    id: 1,
    slug: "executives-guide-sap-clean-core-strategy",
    title: "The Executive's Guide to SAP Clean Core Strategy",
    type: "Whitepaper",
    category: "Enterprise Transformation",
    summary:
      "A practical framework for leadership teams to classify, retain, or retire SAP customizations before migrating to S/4HANA — without losing competitive differentiation.",
    cover_image: "/blog/2807cc98147a21e2764581df7af98cfbb12fa24a.jpg",
    publish_date: "2026-01-20",
    author: "Harish, Fullstack developer",
    metaLine: "18 pages · PDF",
    tags: ["Clean Core", "SAP S/4HANA", "Enterprise Transformation"],
    fileInfo: "18 pages · PDF · Updated January 2026",
    downloadUrl: "#",
    sections: [
      {
        heading: "Executive Summary",
        content:
          "Clean Core has moved from a technical buzzword to a board-level strategic decision. This paper gives executives a structured way to evaluate which customizations genuinely protect competitive advantage and which simply add upgrade risk and cost.",
      },
      {
        heading: "Key Findings",
        content:
          "Organizations that classify custom code before migration cut their S/4HANA project timelines by an average of 20-30%. Fewer than one in five legacy customizations, once audited, are found to deliver measurable business differentiation — the rest can be retired or replaced with standard SAP functionality or BTP extensions.",
      },
      {
        heading: "The Three-Lane Framework",
        content:
          "We recommend sorting every custom object into one of three lanes: Retain (core differentiator, keep in the core system), Extend (move to SAP BTP as a side-by-side extension), or Retire (replace with standard SAP capability). This paper walks through the decision criteria and governance model for each lane.",
      },
      {
        heading: "Recommendations",
        content:
          "Start the classification exercise at least two quarters before any migration project kicks off, involve business process owners directly rather than delegating entirely to IT, and revisit the classification annually as SAP's standard functionality continues to expand.",
      },
    ],
  },
  {
    id: 2,
    slug: "building-business-case-s4hana-migration",
    title: "Building a Business Case for S/4HANA Migration",
    type: "Whitepaper",
    category: "Enterprise Transformation",
    summary:
      "A step-by-step model for quantifying the ROI of an S/4HANA migration, including total cost of ownership, risk-adjusted benefits, and a sample business case template.",
    cover_image: "/blog/d315b1f54a5c717d8114b27effb0c7859d99ecb9.jpg",
    publish_date: "2025-12-08",
    author: "Ascendus Advisory Research",
    metaLine: "22 pages · PDF",
    tags: ["SAP S/4HANA", "ROI", "Finance"],
    fileInfo: "22 pages · PDF · Updated December 2025",
    downloadUrl: "#",
    sections: [
      {
        heading: "Executive Summary",
        content:
          "CFOs are frequently asked to approve multi-year SAP migration budgets without a clear, defensible ROI model. This paper provides a repeatable methodology for building that business case.",
      },
      {
        heading: "Key Findings",
        content:
          "Benefits from an S/4HANA migration typically fall into three categories: hard cost savings (infrastructure, license consolidation), productivity gains (faster close, automated workflows), and risk avoidance (extended mainstream support, reduced security exposure from end-of-life systems).",
      },
      {
        heading: "The Business Case Template",
        content:
          "We include a downloadable model structure covering current-state TCO, target-state TCO, one-time migration cost, and a risk-adjusted payback period calculation, along with guidance on how conservative to be with benefit assumptions when presenting to a finance committee.",
      },
    ],
  },
  {
    id: 3,
    slug: "intelligent-automation-finance-operations-framework",
    title: "Intelligent Automation in Finance Operations: A Practical Framework",
    type: "Whitepaper",
    category: "Intelligent Automation",
    summary:
      "How finance leaders can identify, prioritize, and automate high-volume manual processes such as invoice matching, reconciliation, and reporting.",
    cover_image: "/ServicePage/DesignerSAP.jpeg",
    publish_date: "2025-10-30",
    author: "Ascendus Intelligent Automation Research",
    metaLine: "16 pages · PDF",
    tags: ["Intelligent Automation", "Finance Operations", "RPA"],
    fileInfo: "16 pages · PDF · Updated October 2025",
    downloadUrl: "#",
    sections: [
      {
        heading: "Executive Summary",
        content:
          "Not every manual finance process is a good automation candidate. This paper provides a scoring framework based on process volume, rule complexity, and exception rate to prioritize automation investment.",
      },
      {
        heading: "Key Findings",
        content:
          "Processes with high volume and low rule complexity — such as three-way invoice matching — deliver automation ROI in under six months in most cases studied. Processes with frequent judgment calls require a human-in-the-loop design rather than full automation.",
      },
      {
        heading: "Recommendations",
        content:
          "Begin with a two-week discovery sprint to map candidate processes against the scoring framework, pilot the top-scoring process first to build organizational trust in automation, and instrument every automated workflow with exception monitoring from day one.",
      },
    ],
  },
  {
    id: 4,
    slug: "cybersecurity-readiness-cloud-erp",
    title: "Cybersecurity Readiness for Cloud ERP Environments",
    type: "Whitepaper",
    category: "Cybersecurity",
    summary:
      "A readiness checklist for securing SAP landscapes as they move to the cloud, covering identity governance, data residency, and threat monitoring.",
    cover_image: "/ServicePage/Card_BG_S.webp",
    publish_date: "2025-09-15",
    author: "Ascendus Cybersecurity Research",
    metaLine: "20 pages · PDF",
    tags: ["Cybersecurity", "Cloud ERP", "Compliance"],
    fileInfo: "20 pages · PDF · Updated September 2025",
    downloadUrl: "#",
    sections: [
      {
        heading: "Executive Summary",
        content:
          "Moving SAP to the cloud shifts, but does not eliminate, security responsibility. This paper outlines what enterprises must own directly versus what the hyperscaler or SAP manages under a shared responsibility model.",
      },
      {
        heading: "Key Findings",
        content:
          "Identity and access governance remains the leading cause of SAP security incidents even in cloud deployments. Data residency requirements also vary significantly by region and are frequently underestimated during migration planning.",
      },
      {
        heading: "The Readiness Checklist",
        content:
          "The paper includes a 40-point checklist spanning identity governance, encryption and key management, network segmentation, logging and threat monitoring, and incident response planning specific to SAP cloud landscapes.",
      },
    ],
  },
  {
    id: 5,
    slug: "data-intelligence-sap-predictive-insight",
    title: "Data Intelligence: Turning SAP Data into Predictive Insight",
    type: "Whitepaper",
    category: "Data Intelligence",
    summary:
      "How enterprises can move beyond descriptive SAP reporting to predictive analytics using embedded AI and modern data platforms.",
    cover_image: "/SolutionPage/researchsolution.png",
    publish_date: "2025-07-28",
    author: "Ascendus Data Intelligence Research",
    metaLine: "19 pages · PDF",
    tags: ["Data Intelligence", "AI", "Analytics"],
    fileInfo: "19 pages · PDF · Updated July 2025",
    downloadUrl: "#",
    sections: [
      {
        heading: "Executive Summary",
        content:
          "Most SAP customers still use their ERP primarily for descriptive reporting. This paper explores the architecture and organizational changes required to shift toward predictive and prescriptive analytics.",
      },
      {
        heading: "Key Findings",
        content:
          "Enterprises with a unified data layer connecting SAP and non-SAP sources see predictive model accuracy improve by 25-35% compared to those modeling on SAP data in isolation.",
      },
      {
        heading: "Recommendations",
        content:
          "Invest first in a governed, unified data foundation before layering on predictive models, prioritize use cases with a clear operational owner who will act on the predictions, and treat model monitoring as an ongoing operational discipline rather than a one-time project.",
      },
    ],
  },
  {
    id: 6,
    slug: "future-of-b2b-customer-experience",
    title: "The Future of Customer Experience in B2B Commerce",
    type: "Whitepaper",
    category: "Customer Experience",
    summary:
      "How B2B buyers now expect consumer-grade digital experiences, and what enterprises must change in their commerce architecture to deliver them.",
    cover_image: "/SolutionPage/Website.png",
    publish_date: "2025-05-19",
    author: "Ascendus Customer Experience Research",
    metaLine: "15 pages · PDF",
    tags: ["Customer Experience", "B2B Commerce", "SAP Commerce Cloud"],
    fileInfo: "15 pages · PDF · Updated May 2025",
    downloadUrl: "#",
    sections: [
      {
        heading: "Executive Summary",
        content:
          "B2B buyers increasingly compare their procurement experience to consumer platforms like Amazon. This paper examines what that shift means for enterprise commerce architecture and sales operating models.",
      },
      {
        heading: "Key Findings",
        content:
          "Self-service ordering now accounts for the majority of reorder volume among enterprises that have modernized their B2B commerce platforms, freeing sales teams to focus on new business and complex accounts.",
      },
      {
        heading: "Recommendations",
        content:
          "Prioritize real-time pricing and inventory accuracy over adding new storefront features, give sales teams visibility into self-service order activity rather than treating it as a separate channel, and design approval workflows that match how buying committees actually operate.",
      },
    ],
  },
];

export const getWhitepaperBySlug = (slug) =>
  whitepapersData.find((item) => item.slug === slug) || null;
