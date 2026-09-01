// Static data for the Case Studies page.
// Schema intentionally mirrors the Supabase blogs shape for rendering compatibility.

export const caseStudiesData = [
   {
    id: 1,
    slug: "sap-s4hana-migration-gcc",
    title: "SAP S/4HANA Migration in the GCC: Turning ZATCA E-Invoicing Compliance into a Digital Transformation Advantage",
    type: "Case Study",
    category: "Enterprise Software",
    summary:
      "Saudi Arabia's ZATCA e-invoicing mandate changed how finance and IT teams inside SAP-run enterprises talk to each other. What started as a tax compliance requirement is now forcing a harder look at core ERP data, invoice workflows, and system architecture. Enterprises in the UAE, Qatar, and Bahrain are watching closely, since similar real-time reporting requirements are following the same trajectory across the region.",
    cover_image: "/ServicePage/HANA.png",
    publish_date: "2026-04-27",
    author: "Tharanidharen, Graphic Designer",
    metaLine: "Enterprise Software · 7 minute read",
    tags: ["SAP S/4HANA", "ZATCA", "E-Invoicing", "GCC", "Digital Transformation", "ERP"],
    highlights: [
      { label: "Target Region", value: "GCC" },
      { label: "Compliance Focus", value: "ZATCA E-Invoicing" },
      { label: "Core Technology", value: "SAP S/4HANA" },
    ],
    sections: [
      {
        heading: "Why Compliance Projects Alone Don't Solve the Underlying Problem",
        content:
          "Most SAP landscapes across the GCC were built up over a decade or more, often across separate instances for different countries or business units. E-invoicing mandates simply surface problems that were already there. Common patterns include:\n\n- Vendor, material, and tax master data maintained inconsistently across business units and country instances\n- Manual reconciliation between invoicing, tax reporting, and the finance close process\n- Heavy custom code layered onto SAP ECC over ten or more years of use\n- Separate localized instances for Saudi Arabia, the UAE, and other GCC markets, each patched on its own schedule\n- Limited real-time visibility into tax exposure and compliance status at the group level\n\nThese issues don't go away once ZATCA compliance is achieved. They resurface with the next mandate, the next audit, or the next attempt to consolidate reporting across markets. This is the case for treating the current moment as an opportunity to move to SAP S/4HANA, rather than as a reason to add another layer on top of ECC.\n\nThree forces are converging at the same time driving SAP S/4HANA adoption:\n\n- SAP's mainstream maintenance for ECC 6.0 ends in 2027, with extended maintenance available afterward at additional cost and reduced innovation\n- National digital transformation strategies, including Saudi Arabia's Vision 2030, are pushing government and private-sector enterprises toward modern, cloud-capable systems\n- Tax authorities such as ZATCA in Saudi Arabia and the Federal Tax Authority in the UAE are moving toward real-time or near real-time invoice and tax reporting\n\nTogether, they make a stronger case for planning the move to SAP S/4HANA now, with compliance built into the design rather than added after go-live.",
      },
      {
        heading: "What SAP S/4HANA Changes at the Core",
        content:
          "SAP S/4HANA is SAP's next-generation ERP suite, built on an in-memory database (SAP HANA) that processes transactions and analytics in the same system, instead of moving data between separate operational and reporting layers.\n\nFor a finance or tax team, this means invoice status, VAT position, and reporting obligations can be checked in real time rather than reconstructed at month-end. For an IT team, it means a smaller technical footprint, standardized data models, and a platform SAP continues to invest in for the next decade.",
      },
      {
        heading: "Building Compliance Into the Migration",
        content:
          "Start With a Clean Core: A clean core keeps custom code out of the standard SAP system and pushes extensions to a separate layer, using SAP's Business Technology Platform where needed. This makes future upgrades, including the next mandate SAP or a regulator introduces, far less disruptive.\n\nTreat Localization as Configuration, Not Custom Code: ZATCA e-invoicing, VAT reporting, and similar GCC requirements are increasingly available through SAP's standard localization and Document and Reporting Compliance capabilities. Configuring these as intended, instead of building bespoke ABAP around them, keeps the system upgradeable and audit-ready.\n\nConnect Tax Reporting to the Migration Roadmap Early: E-invoicing and VAT reporting requirements should sit inside the functional design of the migration from day one, not arrive as a parallel workstream managed by a different team. This avoids rework and keeps the go-live date realistic.",
      },
      {
        heading: "A Practical Framework for GCC Enterprises Considering the Move",
        content:
          "- Assess: review current ECC customizations, master data quality, and country-specific compliance gaps\n- Clean: retire unused custom code and standardize master data before migration, not after\n- Migrate: move to SAP S/4HANA using the conversion path suited to the current landscape, whether greenfield, brownfield, or a hybrid selective approach\n- Localize: configure ZATCA, VAT, and other GCC-specific reporting using standard SAP capabilities\n- Optimize: use the improved data foundation for real-time reporting, analytics, and future automation\n\nPlanning the Move: Compliance mandates like ZATCA e-invoicing are a forcing function, not the goal. Enterprises that treat the mandate as a reason to fix master data, retire technical debt, and move to SAP S/4HANA end up with a platform that can absorb the next regulatory change with configuration, not another emergency project.",
      },
      {
        heading: "FAQ's",
        content:
          "1. Does an SAP S/4HANA migration automatically ensure ZATCA compliance?\nNo. SAP S/4HANA provides the platform and standard localization tools, including Document and Reporting Compliance, but ZATCA compliance still requires correct configuration, master data quality, and integration with an accredited e-invoicing solution provider.\n\n2. Can existing ECC customizations be carried over to SAP S/4HANA?\nSome can, but a straight lift-and-shift of old custom code usually recreates the same maintenance burden in the new system. Most migrations use the move as an opportunity to review which customizations are still needed and which can be retired or replaced with standard functionality.\n\n3. How long does a typical SAP S/4HANA migration take for a mid-size GCC enterprise?\nTimelines vary with scope and landscape complexity, but a mid-size enterprise migrating a single-country instance typically plans for nine to eighteen months from assessment through go-live, with compliance localization run as a parallel workstream.\n\n4. Is a full greenfield reimplementation always the right approach?\nNot always. Enterprises with heavily customized, stable ECC environments sometimes benefit more from a brownfield conversion or a selective data transition, which preserves historical data and proven processes while still moving to the new platform.",
      },
    ],
  },
  {
    id: 2,
    slug: "fintech-ux-wireframing-accelerator",
    title: "How Ascendus Slashed a FinTech Client's Development Rework by 60% Through UX First Wireframing",
    type: "Case Study",
    category: "Financial Technology",
    summary:
      "A fast growing FinTech startup engaged Ascendus to bring structure to a product that had stalled in development. By introducing a disciplined, UX first wireframing process before any code was written, the team eliminated the root cause of scope creep and expensive late stage rework.",
    cover_image: "/ServicePage/software-delivery-team.jpg",
    publish_date: "2026-05-12",
    author: "Harish, Fullstack developer",
    metaLine: "Financial Technology · 10 week engagement",
    tags: ["UX Design", "Wireframing", "Product Engineering", "FinTech", "Agile"],
    highlights: [
      { label: "Development Rework", value: "-60%" },
      { label: "Time to Prototype", value: "3 weeks" },
      { label: "Stakeholder Approval Rounds", value: "1 (vs. 6 previously)" },
    ],
    sections: [
      {
        heading: "The Challenge",
        content:
          "The client had been building a personal finance management app for nearly eight months. Despite a capable development team and a clear product vision at the executive level, the project had delivered only 40% of its planned feature set and was burning through sprint capacity fixing features that had already shipped. Stakeholder reviews were exposing structural navigation problems that required reworking screens that had taken weeks to build.\n\nWhen Ascendus was brought in, the root diagnosis was immediate: the team had moved from brief requirements documents directly into code, skipping the wireframing and user flow design phase entirely. Every misaligned assumption about user behaviour was coded, tested, and released before it was caught.",
      },
      {
        heading: "The Approach",
        content:
          "Ascendus introduced a four stage wireframing methodology before any new feature entered development.\n\nFirst, we ran a one week discovery sprint to define the target users, their core jobs to be done, and the critical user flows that the app needed to serve. This gave us a shared vocabulary between product, design, and engineering.\n\nSecond, the team produced low fidelity paper and whiteboard sketches of every key screen. These were reviewed and iterated in two days, a process that would have taken six weeks if done with coded interfaces.\n\nThird, we built mid fidelity digital wireframes in Figma, capturing layout, navigation hierarchy, and interaction patterns without investing time in visual design. These were tested with five representative users to identify friction points before any development decision was committed.\n\nFinally, the approved wireframes became the single source of truth for sprint planning. Every story was scoped against the wireframe. Developers knew exactly what they were building before the sprint began.",
      },
      {
        heading: "The Results",
        content:
          "The first feature set built under the new process shipped with zero structural rework requests from stakeholders, a first for the project. Development velocity increased by 35% because engineers were no longer context switching to respond to design changes mid sprint.\n\nOver the ten week engagement, the client reduced development rework by 60% compared to the previous eight month average. The wireframing investment, three weeks of designer and product time, saved an estimated fourteen weeks of engineering rework. Time to prototype dropped from an informal, unpredictable process to a repeatable three week cycle.",
      },
      {
        heading: "Key Lessons",
        content:
          "The engagement reinforced a principle that Ascendus applies across every product engagement: the cost of fixing a problem scales exponentially with how late in the development cycle it is discovered. A structure problem caught on a paper sketch costs thirty minutes. The same problem caught after a sprint of coding costs days.\n\nWireframing is not a design luxury. It is the most cost efficient quality gate available to any software team. For FinTech clients in particular, where regulatory requirements demand precise UI behaviour and user trust depends on clear, intuitive interfaces, a UX first wireframing process is not optional. It is the foundation that everything else is built on.",
      },
    ],
  },
  {
    id: 3,
    slug: "healthcare-mobile-security-architecture",
    title: "Securing a Healthcare Mobile Platform: Ascendus Implements Zero Compromise Security Architecture",
    type: "Case Study",
    category: "Healthcare & Life Sciences",
    summary:
      "A regional healthcare provider needed to launch a patient facing mobile application that handled sensitive medical records and prescription data. Ascendus designed and implemented an end to end mobile security architecture that ensured regulatory compliance, protected patient data, and passed a third party penetration test with zero critical findings.",
    cover_image: "/trustcenter/BackgroundImage.png",
    publish_date: "2026-07-21",
    author: "Dhanoosh, Frontend Developer",
    metaLine: "Healthcare & Life Sciences · 14 week engagement",
    tags: ["Mobile Security", "Healthcare", "Compliance", "Encryption", "Penetration Testing"],
    highlights: [
      { label: "Critical Pen Test Findings", value: "0" },
      { label: "Security Vulnerabilities Remediated", value: "23" },
      { label: "Compliance Frameworks Met", value: "HIPAA + ISO 27001" },
    ],
    sections: [
      {
        heading: "The Challenge",
        content:
          "The client, a regional healthcare network operating across four states, had developed a patient portal mobile application that allowed users to view lab results, manage prescriptions, and communicate with clinical staff. Before launch, an internal review flagged significant security gaps: data was being stored unencrypted in local device storage, API tokens were embedded in the application binary, session management had no timeout enforcement, and the app requested twelve device permissions, most of which were unnecessary for its core functionality.\n\nA failed internal security review delayed the launch by three months. Ascendus was engaged to design and implement a production ready security architecture and bring the application to a state where it could pass independent third party penetration testing.",
      },
      {
        heading: "The Security Architecture",
        content:
          "Ascendus structured the remediation programme around five pillars:\n\n 1. Data Encryption and Secure Storage:  All patient data persisted on device was encrypted using AES 256 via the platform's secure enclave APIs. Keychain (iOS) and Android Keystore were used for credential storage, replacing the plain text SharedPreferences implementation.\n\n 2. Secure API Communication:  The hardcoded API tokens were replaced with a short lived JWT authentication flow backed by OAuth 2.0. All API calls were enforced over TLS 1.3 with certificate pinning to prevent man in the middle interception.\n\n 3. Code Obfuscation and Tamper Detection:  ProGuard and R8 were applied to the Android build. Runtime integrity checks were added to detect rooted or jailbroken devices and warn users before sensitive operations were performed.\n\n 4. Principle of Least Privilege:  The permission manifest was reduced from twelve to four permissions, camera (for document upload), biometric authentication, push notifications, and secure storage, with clear user facing rationale for each.\n\n 5. Continuous Security Testing:  SAST scanning was integrated into the CI/CD pipeline using a static analysis tool configured with OWASP Mobile Top 10 rules. Every pull request was gated on a clean scan result before merging.",
      },
      {
        heading: "The Results",
        content:
          "The application passed independent third party penetration testing with zero critical or high severity findings, a result the testing firm noted was uncommon for healthcare mobile apps at first engagement. Twenty three pre existing vulnerabilities identified in the initial assessment were fully remediated.\n\nThe application was granted approval to handle Protected Health Information under HIPAA, and the security architecture was also independently verified against ISO 27001 controls. The client launched on schedule and has had no security incidents in the six months since deployment.",
      },
      {
        heading: "Why Security Cannot Be an Afterthought",
        content:
          "The cost of the remediation programme, fourteen weeks of specialist effort, was approximately four times what a Secure by Design approach from the project's inception would have cost. This is the consistent pattern Ascendus observes across healthcare and financial services mobile projects: security bolted on at the end requires expensive architectural changes, not just configuration updates.\n\nFor any application that touches sensitive personal data, our recommendation is to embed security requirements into the product definition phase, run SAST from the first sprint, and treat penetration testing as a confirmation step, not a discovery step. The goal is to reach the pen test already knowing what the testers will find, because your process has already found and fixed it.",
      },
    ],
  },
 
];

export const getCaseStudyBySlug = (slug) =>
  caseStudiesData.find((item) => item.slug === slug) || null;
