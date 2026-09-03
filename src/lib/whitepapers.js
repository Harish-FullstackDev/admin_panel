import { whitepapersData, getWhitepaperBySlug as getStaticWhitepaperBySlug } from "@/data/whitepapersData";

export const getAllWhitepapers = async () => whitepapersData;

export const getWhitepaperBySlug = async (slug) => getStaticWhitepaperBySlug(slug);
