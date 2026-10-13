import type { Metadata } from 'next';
import Script from 'next/script';
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
const klaviyoBootstrap = `!function(){if(!window.klaviyo){window._klOnsite=window._klOnsite||[];try{window.klaviyo=new Proxy({},{get:function(n,i){return"push"===i?function(){var n;(n=window._klOnsite).push.apply(n,arguments)}:function(){for(var n=arguments.length,o=new Array(n),w=0;w<n;w++)o[w]=arguments[w];var t="function"==typeof o[o.length-1]?o.pop():void 0,e=new Promise((function(n){window._klOnsite.push([i].concat(o,[function(i){t&&t(i),n(i)}]))}));return e}}})}catch(n){window.klaviyo=window.klaviyo||[],window.klaviyo.push=function(){var n;(n=window._klOnsite).push.apply(n,arguments)}}}}();`;

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><Script id="klaviyo-bootstrap" strategy="beforeInteractive">{klaviyoBootstrap}</Script><Script id="klaviyo-onsite" src="https://static.klaviyo.com/onsite/js/TWRSkS/klaviyo.js?company_id=TWRSkS" strategy="afterInteractive"/><SiteHeader/>{children}<SiteFooter/><CookieNotice/></body></html>;
}
