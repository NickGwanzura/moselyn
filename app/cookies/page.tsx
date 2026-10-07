import { createPageMetadata } from '../../lib/seo';

export const metadata = createPageMetadata({ title: 'Cookie Policy', description: 'Learn how Finding Hope Africa uses browser storage, cookies, and third-party content on this website.', path: '/cookies' });

export default function CookiePolicyPage() {
  return <main className="legal-page">
    <section className="page-hero legal-hero">
      <p className="eyebrow">Finding Hope Africa</p>
      <h1>Cookie Policy</h1>
      <p>How this website uses cookies and similar browser storage.</p>
    </section>
    <article className="legal-copy">
      <p className="legal-updated">Last updated: October 3, 2026</p>
      <h2>What we use</h2>
      <p>This website does not use analytics or advertising cookies. We count approximate views of public blog stories using daily totals stored on our server. These totals do not identify individual visitors and may include repeat visits or search engine crawlers. The cookie notice uses your browser’s local storage to remember when you dismiss it, so it does not need to be shown again on every page visit.</p>
      <h2>Donation checkout</h2>
      <p>If you choose to donate, you will be sent to Authorize.Net’s hosted payment service to complete checkout. Authorize.Net may use cookies or similar technologies on its service. Those technologies are governed by Authorize.Net’s own privacy and cookie information, and are outside Finding Hope Africa’s control.</p>
      <h2>External content</h2>
      <p>Some images on this website are delivered by Unsplash. Your browser requests those images from Unsplash, which may process technical information under its own policies.</p>
      <h2>Your choices</h2>
      <p>You can clear or block local storage and cookies through your browser settings. Blocking browser storage may cause this notice to appear again. Blog view totals are stored on the server and are not controlled by browser cookies or local storage.</p>
      <h2>Contact</h2>
      <p>Questions about this policy can be sent to <a href="mailto:info@findinghopeafrica.org">info@findinghopeafrica.org</a>.</p>
    </article>
  </main>;
}
