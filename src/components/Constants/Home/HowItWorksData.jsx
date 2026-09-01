import { HiOutlineCog } from "react-icons/hi2";
//implementation
import Build from "../../../assets/Home/howItWorksIcon/Implementation/Build.svg";
import deployImp from "../../../assets/Home/howItWorksIcon/Implementation/deploy.svg";
import Discovery from "../../../assets/Home/howItWorksIcon/Implementation/Discovery.svg";
import Solution from "../../../assets/Home/howItWorksIcon/Implementation/Solution.svg";
//migration
import readiness from "../../../assets/Home/howItWorksIcon/Migration/readiness.svg";
import migration_planning from "../../../assets/Home/howItWorksIcon/Migration/migration_planning.svg";
import go_live from "../../../assets/Home/howItWorksIcon/Migration/go_live.svg";
import data_migration from "../../../assets/Home/howItWorksIcon/Migration/data_migration.svg";
//Cloud_Transformation
import cloud_assessment from "../../../assets/Home/howItWorksIcon/Cloud_Transformation/cloud_assessment.svg";
import migration from "../../../assets/Home/howItWorksIcon/Cloud_Transformation/migration.svg";
import optimize from "../../../assets/Home/howItWorksIcon/Cloud_Transformation/optimize.svg";
import roadmap_architecture from "../../../assets/Home/howItWorksIcon/Cloud_Transformation/roadmap_architecture.svg";
//Digital_Transformation
import automation from "../../../assets/Home/howItWorksIcon/Digital_Transformation/automation.svg";
import compiance from "../../../assets/Home/howItWorksIcon/Digital_Transformation/compiance.svg";
import integration from "../../../assets/Home/howItWorksIcon/Digital_Transformation/integration.svg";
import security from "../../../assets/Home/howItWorksIcon/Digital_Transformation/security.svg";
//Rollout_Upgradation
import configuration from "../../../assets/Home/howItWorksIcon/Rollout_Upgradation/configuration-33.svg";
import data_training from "../../../assets/Home/howItWorksIcon/Rollout_Upgradation/data_training.svg";
import deployUp from "../../../assets/Home/howItWorksIcon/Rollout_Upgradation/deploy.svg";
import localization from "../../../assets/Home/howItWorksIcon/Rollout_Upgradation/localization.svg";
//AMS
import application_support from "../../../assets/Home/howItWorksIcon/AMS/application_support.svg";
import reporting from "../../../assets/Home/howItWorksIcon/AMS/reporting.svg";
import transistion from "../../../assets/Home/howItWorksIcon/AMS/transistion.svg";
import continuous_improvement from "../../../assets/Home/howItWorksIcon/AMS/continuous_improvement.svg";
export const implementationSteps = [
  {
    head: "Step 01",
    title: "Discovery & Requirements",
    description:
      "Define goals, evaluate current processes,<br /> and gather detailed requirements.",
    icon: Discovery,
  },
  {
    head: "Step 02",
    title: "Solution Blueprint",
    description:
      "Design the target architecture, workflows,<br /> and integration plan.",
    icon: Solution,
  },
  {
  head: "Step 03",
  title: "Build & Test",
  description: "Develop, configure, and thoroughly test<br />with end-user validation.",
  icon: Build,
},
  {
    head: "Step 04",
    title: "Deploy & Support",
    description:
      "Execute cutover, train users, and provide ongoing go-live support.",
    icon: deployImp,
  },
];

export const migrationSteps = [
  {
    head: "Step 01",
    title: "Readiness Assessment",
    description: "Analyze system, custom code,<br /> and data footprint.",
    icon: readiness,
  },
  {
    head: "Step 02",
    title: "Migration Planning",
    description: "Plan timelines, tools,<br /> and downtime strategy.",
    icon: migration_planning,
  },
  {
    head: "Step 03",
    title: "Data Migration & Validation",
    description: "Migrate, cleanse, and validate<br /> data with test runs.",
    icon: data_migration,
  },
  {
    head: "Step 04",
    title: " Go-Live & Stabilization",
    description: "Cutover execution with<br /> monitoring and support.",
    icon: go_live,
  },
];

export const cloudTransformationSteps = [
  {
    head: "Step 01",
    title: "Cloud Assessment",
    description: "Evaluate workloads and select<br /> suitable cloud model.",
    icon: cloud_assessment,
  },
  {
    head: "Step 02",
    title: "Roadmap & Architecture",
    description: "Design secure, scalable architecture<br /> and migration plan.",
    icon: roadmap_architecture,
  },
  {
    head: "Step 03",
    title: "Migration & Modernization",
    description: "Move workloads and<br /> modernize applications.",
    icon: migration,
  },
  {
    head: "Step 04",
    title: "Optimize & Operate",
    description: "Continuous monitoring, governance,<br /> and cost control.",
    icon: optimize,
  },
];

export const digitalTransformationSteps = [
  {
    head: "Step 01",
    title: "Compliance Check",
    description:
      "Review and align business processes with government and industry e-invoicing regulations.",
    icon: compiance,
  },
  {
    head: "Step 02",
    title: "Integration Setup",
    description:
      "Seamlessly connect ERP systems to e-invoice portals and ensure secure, reliable data flow.",
    icon: integration,
  },
  {
    head: "Step 03",
    title: "Automation & Tracking",
    description:
      "Automate invoice generation, validation, and tracking with advanced monitoring tools.",
    icon: automation,
  },
  {
    head: "Step 04",
    title: "Security & Protection",
    description:
      "Implement robust cybersecurity frameworks to protect data and enterprise operations.",
    icon: security,
  },
];

export const rolloutUpgradationSteps = [
  {
    head: "Step 01",
    title: "Localization Assessment",
    description: "Adapt global template to local <br />regulations.",
    icon: localization,
  },
  {
    head: "Step 02",
    title: "Configuration",
    description: "Customize processes for regional <br />requirements.",
    icon: configuration,
  },
  {
    head: "Step 03",
    title: "Data & Training",
    description: "Migrate local data and train <br />users.",
    icon: data_training,
  },
  {
    head: "Step 04",
    title: "Deployment",
    description: "Go-live with monitoring and quick issue resolution.",
    icon: deployUp,
  },
];

export const amsSteps = [
  {
    head: "Step 01",
    title: "Transition & SLA Setup",
    description: "Define governance, SLAs,and <br />knowledge transfer.",
    icon: transistion,
  },
  {
    head: "Step 02",
    title: "Application Support",
    description: "Day-to-day monitoring, issue resolution, <br />and updates.",
    icon: application_support,
  },
  {
    head: "Step 03",
    title: "Continuous Improvement",
    description: "Optimize processes with patches <br />and enhancements.",
    icon: continuous_improvement,
  },
  {
    head: "Step 04",
    title: "Reporting & Governance",
    description: "Regular KPIs and reviews to align <br />IT with business.",
    icon: reporting,
  },
];

export const allSteps = {
  Implementation: implementationSteps,
  Migration: migrationSteps,
  "Cloud Transformation": cloudTransformationSteps,
  "Digital Transformation": digitalTransformationSteps,
  "Rollout & Upgradation": rolloutUpgradationSteps,
  "Application Management Services (AMS)": amsSteps,
};
