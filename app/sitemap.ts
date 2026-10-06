import type { MetadataRoute } from 'next';
import { getPublishedBlogPosts } from '../lib/backend-db';
import { fhaPrograms } from '../lib/programs';
import { SITE_URL } from '../lib/seo';

const staticRoutes = [
  '/',
  '/about',
  '/impact',
  '/founders',
  '/programs',
  '/blog',
  '/contact',
  '/donate',
  '/terms',
  '/cookies',
];

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogStories = await getPublishedBlogPosts();
  return [
    ...staticRoutes.map((path) => ({ url: new URL(path, SITE_URL).toString() })),
    ...fhaPrograms.map(({ slug }) => ({ url: new URL(`/programs/${slug}`, SITE_URL).toString() })),
    ...blogStories.map(({ slug }) => ({ url: new URL(`/blog/${slug}`, SITE_URL).toString() })),
  ];
}
