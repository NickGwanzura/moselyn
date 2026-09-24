'use client';

import { useState, type FormEvent } from 'react';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';

const presets = [25, 50, 100, 250];

export default function DonationCheckout() {
  const [amount, setAmount] = useState('50');
  const [custom, setCustom] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function beginCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const donationAmount = Number(isCustom ? custom : amount);
    if (!Number.isFinite(donationAmount) || donationAmount < 1 || donationAmount > 10000 || Math.round(donationAmount * 100) !== donationAmount * 100) {
      setError('Enter an amount from $1 to $10,000 USD, with no more than two decimal places.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/authorize-net/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount: donationAmount }),
      });
      const data = await response.json() as { token?: string; paymentUrl?: string; error?: string };
      if (!response.ok || !data.token || !data.paymentUrl) throw new Error(data.error || 'Unable to start secure checkout.');

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.paymentUrl;
      const token = document.createElement('input');
      token.type = 'hidden';
      token.name = 'token';
      token.value = data.token;
      form.appendChild(token);
      document.body.appendChild(form);
      form.submit();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to start secure checkout.');
      setLoading(false);
    }
  }

  return <form className="donation-form" onSubmit={beginCheckout}>
    <fieldset><legend>Choose a one-time donation</legend><div className="donation-amounts">{presets.map(value => <button type="button" key={value} className={!isCustom && Number(amount) === value ? 'amount-option selected' : 'amount-option'} onClick={() => { setAmount(String(value)); setIsCustom(false); }}>{`$${value}`}</button>)}<button type="button" className={isCustom ? 'amount-option selected' : 'amount-option'} onClick={() => setIsCustom(true)}>Other</button></div></fieldset>
    {isCustom && <label className="custom-amount">Donation amount (USD)<span><b>$</b><input type="number" min="1" max="10000" step="0.01" value={custom} onChange={event => setCustom(event.target.value)} placeholder="Enter amount" required /></span></label>}
    <button className="button button-dark checkout-button" type="submit" disabled={loading}>{loading ? 'Connecting securely…' : 'Continue to Authorize.Net'} {!loading && <ArrowUpRight size={17}/>}</button>
    <p className="secure-note"><LockKeyhole size={15}/> Secure, one-time card payment handled by Authorize.Net.</p>
    {error && <p className="checkout-error" role="alert">{error}</p>}
  </form>;
}
