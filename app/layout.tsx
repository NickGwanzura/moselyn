import type { Metadata } from 'next';
import './globals.css';
import { SiteFooter, SiteHeader } from '../components/site-chrome';
import { CookieNotice } from '../components/cookie-notice';
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME, SITE_TITLE, SITE_URL } from '../lib/seo';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: '/',
    locale: 'en_US',
    images: [{ ...DEFAULT_OG_IMAGE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE.url, alt: DEFAULT_OG_IMAGE.alt }],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><SiteHeader/>{children}<SiteFooter/><CookieNotice/></body></html>}
