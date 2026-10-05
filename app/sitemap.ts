import type { MetadataRoute } from 'next';
import { blogStories } from '../lib/blog-stories';
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

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticRoutes.map((path) => ({ url: new URL(path, SITE_URL).toString() })),
    ...fhaPrograms.map(({ slug }) => ({ url: new URL(`/programs/${slug}`, SITE_URL).toString() })),
    ...blogStories.map(({ slug }) => ({ url: new URL(`/blog/${slug}`, SITE_URL).toString() })),
  ];
}
