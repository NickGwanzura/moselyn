import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Use | Finding Hope Africa' };

export default function TermsPage() {
  return <main className="legal-page">
    <section className="page-hero legal-hero">
      <p className="eyebrow">Finding Hope Africa</p>
      <h1>Terms of Use</h1>
      <p>Terms for using the Finding Hope Africa website.</p>
    </section>
    <article className="legal-copy">
      <p className="legal-updated">Last updated: October 3, 2026</p>
      <h2>Using this website</h2>
      <p>You may use this website to learn about Finding Hope Africa, its programmes, and ways to get involved. Please use it lawfully and do not attempt to disrupt, damage, or gain unauthorized access to the site or its services.</p>
      <h2>Website information</h2>
      <p>We aim to keep the information on this website accurate and current. Programme details, impact figures, availability, and plans may change. Contact Finding Hope Africa to confirm current information before relying on it.</p>
      <h2>Donations and payments</h2>
      <p>Donation checkout is for one-time gifts and is handled through Authorize.Net’s hosted payment service. Payment details entered during checkout are subject to the payment provider’s terms and privacy information. If you have a question about a donation or need help correcting a payment, contact Finding Hope Africa at <a href="mailto:info@findinghopeafrica.org">info@findinghopeafrica.org</a>.</p>
      <p>Finding Hope Africa is identified on this website as a registered 501(c)(3) nonprofit. Whether a contribution is deductible depends on applicable law and your circumstances; consult a qualified tax adviser if you need tax advice.</p>
      <h2>Website content</h2>
      <p>Unless otherwise stated, the website’s text, design, and materials are owned by or used with permission by Finding Hope Africa. You may share links to the site. Please contact us before reproducing substantial site content, photographs, or other materials.</p>
      <h2>External services and links</h2>
      <p>This website may link to third-party websites or services, including payment services. Finding Hope Africa does not control their content, availability, or policies. Your use of those services is subject to their terms.</p>
      <h2>Changes and contact</h2>
      <p>We may update these terms as the website changes. The current version will appear on this page with its revision date. Questions can be sent to <a href="mailto:info@findinghopeafrica.org">info@findinghopeafrica.org</a>.</p>
    </article>
  </main>;
}
