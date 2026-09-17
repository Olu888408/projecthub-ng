import { useEffect, useState } from 'react';

const CONSENT_KEY = 'cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
    else if (stored === 'accepted') loadAnalytics();
  }, []);

  function loadAnalytics() {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (!gaId || document.getElementById('ga-script')) return;
    // Two same-origin/allowlisted <script src="..."> tags — no inline script
    // content, so this works under a CSP with script-src 'self'
    // https://www.googletagmanager.com and no 'unsafe-inline'.
    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
    const init = document.createElement('script');
    init.id = 'ga-init';
    init.src = '/ga-init.js';
    init.dataset.gaId = gaId;
    document.head.appendChild(init);
  }

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
    loadAnalytics();
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 text-white px-4 py-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-slate-300">
          We use essential cookies to keep you signed in, and optional analytics cookies to understand site usage. You can accept or decline analytics cookies below. See our{' '}
          <a href="#/legal/privacy-policy" className="underline hover:text-white">Privacy Policy</a> for details.
        </p>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-800 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}