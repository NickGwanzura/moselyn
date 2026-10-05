import type { Metadata } from 'next';

export const SITE_URL = 'https://findinghopeafrica.org';
export const SITE_NAME = 'Finding Hope Africa';
export const SITE_TITLE = 'Finding Hope Africa | Rescue. Rebuild. Reintegrate.';
export const DEFAULT_DESCRIPTION = 'Finding Hope Africa walks with Zimbabwe’s orphaned, poor, and vulnerable children and families until each one finds hope and purpose.';
export const DEFAULT_OG_IMAGE = {
  url: '/hero-fha.png',
  width: 1376,
  height: 768,
  alt: 'Children embracing in Zimbabwe, representing the work of Finding Hope Africa',
} as const;

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
};

export function createPageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE.url,
  imageAlt = DEFAULT_OG_IMAGE.alt,
  type = 'website',
}: PageMetadataOptions): Metadata {
  const absoluteTitle = `${title} | ${SITE_NAME}`;
  const imageUrl = new URL(image, SITE_URL).toString();
  const isDefaultImage = image === DEFAULT_OG_IMAGE.url;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title: absoluteTitle,
      description,
      url: path,
      locale: 'en_US',
      images: [{
        url: imageUrl,
        ...(isDefaultImage ? { width: DEFAULT_OG_IMAGE.width, height: DEFAULT_OG_IMAGE.height } : {}),
        alt: imageAlt,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: absoluteTitle,
      description,
      images: [{ url: imageUrl, alt: imageAlt }],
    },
  };
}
