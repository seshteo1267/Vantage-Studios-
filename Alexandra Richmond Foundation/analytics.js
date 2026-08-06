/* =========================================================================
   THE ALEXANDRA RICHMOND FOUNDATION — ANALYTICS
   =========================================================================
   One file, one paste. Nothing is tracked until a token is filled in below.

   RECOMMENDED: Cloudflare Web Analytics
     - Free, and the Foundation's domain is already on Cloudflare
     - Cookieless. It sets no cookies and stores no personal data, so the
       site does NOT need a cookie consent banner under GDPR/ePrivacy.
       That matters here: visitors researching a cancer diagnosis should
       not be tracked, and a consent banner on a memorial site is grim.

   TO TURN IT ON:
     1. dash.cloudflare.com -> Analytics & Logs -> Web Analytics
     2. Add a site -> alexandrarichmondfoundation.org
     3. It shows a snippet containing "token": "abc123..."
     4. Paste ONLY that token string below, save, re-deploy.

   GA4 is supported as an alternative, but it sets cookies and would oblige
   the Foundation to add a consent banner. Prefer Cloudflare unless the
   client specifically needs Google Analytics.
   ========================================================================= */
window.ARF_ANALYTICS = {

  // 'cloudflare' | 'ga4' | 'none'
  provider: 'cloudflare',

  /* ⬇⬇⬇  PASTE THE CLOUDFLARE WEB ANALYTICS TOKEN HERE  ⬇⬇⬇ */
  cloudflareToken: '449313a4fd484847bf3ea1fbf6415593',
  /* ⬆⬆⬆  that is the only required change  ⬆⬆⬆ */

  // Only used if provider is switched to 'ga4'
  ga4MeasurementId: '',      // e.g. 'G-XXXXXXXXXX'

  // Honour browser privacy signals. Leave true.
  respectPrivacySignals: true
};

(function () {
  var c = window.ARF_ANALYTICS || {};

  // Never load a tracker for visitors who have asked not to be tracked.
  if (c.respectPrivacySignals) {
    var dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1' ||
              navigator.msDoNotTrack === '1' || navigator.globalPrivacyControl === true;
    if (dnt) return;
  }

  if (c.provider === 'cloudflare' && c.cloudflareToken) {
    var s = document.createElement('script');
    // Cloudflare issues this snippet as type="module"; module scripts are
    // deferred by default, so this matches their beacon exactly.
    s.type = 'module';
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: c.cloudflareToken }));
    document.head.appendChild(s);
    return;
  }

  if (c.provider === 'ga4' && c.ga4MeasurementId) {
    var g = document.createElement('script');
    g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(c.ga4MeasurementId);
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    // anonymize_ip is the default in GA4; set explicitly for clarity.
    window.gtag('config', c.ga4MeasurementId, { anonymize_ip: true });
    return;
  }

  // No provider configured — stay completely inert. No requests, no errors.
})();
