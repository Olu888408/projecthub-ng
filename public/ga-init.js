// Same-origin GA bootstrap. Loaded with a data-ga-id attribute by
// CookieConsent.tsx after the user accepts analytics cookies. Kept as a
// static file (not an inline <script>) so it's allowed by a strict CSP
// (script-src 'self' https://www.googletagmanager.com) without needing
// 'unsafe-inline'.
(function () {
  var gaId = document.currentScript && document.currentScript.dataset.gaId;
  if (!gaId) return;
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', gaId);
})();
