const API_URLS = {
  sandbox: 'https://apitest.authorize.net/xml/v1/request.api',
  production: 'https://api.authorize.net/xml/v1/request.api',
} as const;

const PAYMENT_URLS = {
  sandbox: 'https://test.authorize.net/payment/payment',
  production: 'https://accept.authorize.net/payment/payment',
} as const;

export async function POST(request: Request) {
  const loginId = process.env.AUTHORIZE_NET_API_LOGIN_ID;
  const transactionKey = process.env.AUTHORIZE_NET_TRANSACTION_KEY;
  const mode = process.env.AUTHORIZE_NET_MODE === 'production' ? 'production' : 'sandbox';

  if (!loginId || !transactionKey) {
    return Response.json({ error: 'Authorize.Net checkout is not configured yet. Please contact us to arrange your donation.' }, { status: 503 });
  }

  let amount: number;
  try {
    const body = await request.json() as { amount?: unknown };
    amount = typeof body.amount === 'number' ? body.amount : Number.NaN;
  } catch {
    return Response.json({ error: 'Enter a valid donation amount.' }, { status: 400 });
  }

  if (!Number.isFinite(amount) || Math.round(amount * 100) !== amount * 100 || amount < 1 || amount > 10000) {
    return Response.json({ error: 'Choose an amount from $1 to $10,000 USD.' }, { status: 400 });
  }

  const payload = {
    getHostedPaymentPageRequest: {
      merchantAuthentication: { name: loginId, transactionKey },
      transactionRequest: {
        transactionType: 'authCaptureTransaction',
        amount: amount.toFixed(2),
        order: { description: 'Donation to Finding Hope Africa' },
      },
      hostedPaymentSettings: {
        setting: [
          { settingName: 'hostedPaymentButtonOptions', settingValue: JSON.stringify({ text: 'Donate securely' }) },
          { settingName: 'hostedPaymentPaymentOptions', settingValue: JSON.stringify({ showCreditCard: true, showBankAccount: false, cardCodeRequired: true }) },
          { settingName: 'hostedPaymentReturnOptions', settingValue: JSON.stringify({ showReceipt: true }) },
          { settingName: 'hostedPaymentOrderOptions', settingValue: JSON.stringify({ show: true, merchantName: 'Finding Hope Africa' }) },
          { settingName: 'hostedPaymentStyleOptions', settingValue: JSON.stringify({ bgColor: '#7A3B2E' }) },
        ],
      },
    },
  };

  try {
    const gatewayResponse = await fetch(API_URLS[mode], {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!gatewayResponse.ok) throw new Error(`Authorize.Net returned HTTP ${gatewayResponse.status}`);
    const result = await gatewayResponse.json() as {
      token?: string;
      messages?: { resultCode?: string };
    };
    if (result.messages?.resultCode !== 'Ok' || !result.token) {
      console.error('Authorize.Net did not issue a hosted checkout token.');
      return Response.json({ error: 'Authorize.Net could not start checkout. Please try again or contact us.' }, { status: 502 });
    }
    return Response.json({ token: result.token, paymentUrl: PAYMENT_URLS[mode] }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('Authorize.Net checkout token request failed:', error);
    return Response.json({ error: 'We could not connect to Authorize.Net. Please try again shortly.' }, { status: 502 });
  }
}
