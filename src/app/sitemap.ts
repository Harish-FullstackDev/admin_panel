import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.supportstudio.tech';

  // 1. Core Corporate Directory (Static)
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/aboutus',
    '/services',
    '/solutions',
    '/contact-us',
    '/careers',
    '/bookacall',
    '/trustcenter',
    '/privacyPolicy',
    '/termsOfService',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Dynamic Service Discovery (Relational Fetch)
  let serviceRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('slug, updated_at')
      .eq('is_active', true);

    if (error) throw error;

    if (services) {
      serviceRoutes = services.map((service: any) => ({
        url: `${baseUrl}/services/${service.slug}`,
        lastModified: new Date(service.updated_at).toISOString(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Sitemap dynamic fetch failed (falling back to static only):', error);
  }

  return [...staticRoutes, ...serviceRoutes];
}
