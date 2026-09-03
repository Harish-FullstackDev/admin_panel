import { caseStudiesData, getCaseStudyBySlug as getStaticCaseStudyBySlug } from "@/data/caseStudiesData";

export const getAllCaseStudies = async () => caseStudiesData;

export const getCaseStudyBySlug = async (slug) => getStaticCaseStudyBySlug(slug);
