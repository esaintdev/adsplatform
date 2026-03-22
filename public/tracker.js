/**
 * AdTrack Tracker Script v1.0
 * 
 * Embed this script in the <head> of ANY website to track:
 *  - Page visits (auto)
 *  - Custom actions like registrations, downloads (manual trigger)
 * 
 * Usage:
 *   <script src="https://YOUR-ADTRACK-DOMAIN/tracker.js" data-campaign="YOUR_CAMPAIGN_ID"></script>
 *
 * Then in JavaScript on your site:
 *   window.AdsTracker.trackAction('registration');
 *   window.AdsTracker.trackAction('app_download', { plan: 'pro' });
 */
(function () {
  'use strict';

  const script = document.currentScript;
  const campaignId = script ? script.getAttribute('data-campaign') : null;
  const bannerId = script ? script.getAttribute('data-banner') : null;

  // Derive the AdTrack base URL from the script src
  let baseUrl = '';
  if (script && script.src) {
    const url = new URL(script.src);
    baseUrl = url.origin;
  }

  function sendEvent(type, metadata) {
    if (!baseUrl) return;
    const payload = { type, campaignId, bannerId };
    if (metadata) payload.metadata = metadata;

    // Use sendBeacon when available for reliability on page unload
    const url = baseUrl + '/api/track/event';
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () {});
    }
  }

  // Auto-track page visit
  function trackVisit() {
    sendEvent('VISIT', { page: window.location.pathname });
  }

  // Public API
  window.AdsTracker = {
    /**
     * Track a custom action
     * @param {string} actionName  e.g. 'registration', 'app_download'
     * @param {object} [extra]     optional extra metadata
     */
    trackAction: function (actionName, extra) {
      sendEvent('ACTION', Object.assign({ action: actionName }, extra || {}));
    },
  };

  // Fire visit event once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackVisit);
  } else {
    trackVisit();
  }
})();
