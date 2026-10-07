'use client';

import { useEffect, useState } from 'react';
import Link from './site-link';

const noticeKey = 'fha-cookie-notice-dismissed';

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(noticeKey) !== 'true');
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(noticeKey, 'true');
    } catch {
      // The notice still closes for this visit when browser storage is unavailable.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return <aside className="cookie-notice" role="region" aria-label="Cookie notice">
    <div className="cookie-notice-copy">
      <p className="eyebrow">A note about cookies</p>
      <p>We count approximate blog page views as daily totals on our server, without visitor IDs or analytics cookies. Browser storage remembers when you dismiss this notice. Authorize.Net may use its own technologies if you continue to donation checkout.</p>
      <Link href="/cookies">Read our Cookie Policy</Link>
    </div>
    <button className="button button-dark cookie-notice-dismiss" type="button" onClick={dismiss}>Understood</button>
  </aside>;
}
