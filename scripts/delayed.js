/**
 * delayed.js — AEP Web SDK (Alloy.js) analytics, consent, and personalization.
 * Loaded 3 seconds after page load to protect Core Web Vitals.
 *
 * Configuration — add these <meta> tags to head.html:
 *   <meta name="aep-org-id"        content="ABCDEF@AdobeOrg">
 *   <meta name="aep-datastream-id" content="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
 *
 * Features:
 *   1. Adobe Client Data Layer (ACDL) — sync with scripts.js init
 *   2. Alloy.js — AEP Web SDK (Analytics + Target + RTCDP)
 *   3. Consent banner — cookie banner drives alloy setConsent
 *   4. CTA click tracking — every .button element
 *   5. Scroll depth tracking — 25 / 50 / 75 / 100%
 *   6. Video engagement — video-embed block play events
 *   7. A/B Experimentation — metadata-driven with Target rendering
 */

const getMeta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || '';

// ── CONFIG ────────────────────────────────────────────────────────────────────
const CONSENT_KEY = 'aep-consent'; // localStorage: "in" | "out"

// ── 1. ADOBE CLIENT DATA LAYER ────────────────────────────────────────────────
// ACDL is already initialized as [] in scripts.js (eager phase).
// Here we push the initial page-load state.
function pushPageLoadEvent() {
  window.adobeDataLayer.push({
    event: 'page loaded',
    web: {
      webPageDetails: {
        name: document.title,
        URL: window.location.href,
        siteSection: window.location.pathname.split('/').filter(Boolean)[0] || 'home',
        template: getMeta('template') || 'default',
      },
      webReferrer: { URL: document.referrer },
    },
    environment: {
      browserDetails: {
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      },
    },
  });
}

// ── 2. AEP WEB SDK (ALLOY.JS) ─────────────────────────────────────────────────

/**
 * Loads the Adobe Launch library (Tag Management).
 * Launch handles alloy.js, Adobe Analytics, and Adobe Target internally —
 * no need to load alloy directly. Our ACDL pushes are picked up by
 * Launch rules via the Adobe Client Data Layer extension.
 *
 * Switch between environments by changing the src URL:
 *   Development: launch-d51eda9acd14-development.min.js
 *   Staging:     launch-d51eda9acd14-staging.min.js
 *   Production:  launch-d51eda9acd14.min.js
 */
function loadLaunch() {
  const script = document.createElement('script');
  script.src = 'https://assets.adobedtm.com/fbbb5a6f6976/13d6954a51d9/launch-d51eda9acd14-development.min.js';
  script.async = true;
  document.head.append(script);
}

// ── 3. CONSENT MANAGEMENT ─────────────────────────────────────────────────────

/**
 * Tells alloy the user's consent decision using the Adobe 1.0 standard.
 * @param {'in'|'out'} value
 */
function setAlloyConsent(value) {
  window.alloy?.('setConsent', {
    consent: [{ standard: 'Adobe', version: '1.0', value: { general: value } }],
  });
}

/**
 * Shows a GDPR/consent banner if the user hasn't decided yet.
 * On accept → setConsent('in') + ACDL event.
 * On decline → setConsent('out') + ACDL event.
 * Skips if consent already stored in localStorage.
 */
function showConsentBanner() {
  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored) {
    // Page reload — sync alloy with the already-stored decision
    setAlloyConsent(stored);
    return;
  }

  const banner = document.createElement('div');
  banner.className = 'consent-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Cookie consent');
  banner.setAttribute('aria-live', 'polite');

  const textEl = document.createElement('p');
  textEl.className = 'consent-banner-text';
  textEl.textContent = getMeta('cookie-banner-text')
    || 'We use Adobe Experience Platform to improve your experience and measure site performance.';

  const actions = document.createElement('div');
  actions.className = 'consent-banner-actions';

  const acceptBtn = document.createElement('button');
  acceptBtn.className = 'button primary';
  acceptBtn.textContent = getMeta('cookie-accept-text') || 'Accept All';

  const declineBtn = document.createElement('button');
  declineBtn.className = 'button secondary';
  declineBtn.textContent = getMeta('cookie-decline-text') || 'Decline';

  const dismiss = (decision) => {
    localStorage.setItem(CONSENT_KEY, decision);
    banner.classList.add('consent-banner-hiding');
    banner.addEventListener('transitionend', () => banner.remove(), { once: true });
    setAlloyConsent(decision);
    window.adobeDataLayer.push({ event: 'consent decision', consent: { value: decision } });
  };

  acceptBtn.addEventListener('click', () => dismiss('in'));
  declineBtn.addEventListener('click', () => dismiss('out'));

  actions.append(acceptBtn, declineBtn);
  banner.append(textEl, actions);
  document.body.append(banner);

  // Slide in on next frame (CSS transition needs one tick to register initial state)
  requestAnimationFrame(() => banner.classList.add('consent-banner-visible'));
}

// ── 4. CUSTOM EVENT TRACKING ─────────────────────────────────────────────────

/**
 * Tracks clicks on every .button element (CTA, nav, etc.).
 * Fires ACDL event + alloy web.webInteraction.linkClicks XDM event.
 */
function trackCTAClicks() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('a.button, button.button');
    if (!btn) return;

    const ctaData = {
      text: btn.textContent.trim(),
      url: btn.href || '',
      section: btn.closest('[id]')?.id
        || btn.closest('.section')?.dataset?.id
        || '',
    };

    window.adobeDataLayer.push({ event: 'cta clicked', cta: ctaData });

    window.alloy?.('sendEvent', {
      xdm: {
        eventType: 'web.webInteraction.linkClicks',
        web: {
          webInteraction: {
            name: ctaData.text,
            URL: ctaData.url,
            linkClicks: { value: 1 },
            type: btn.tagName === 'BUTTON' ? 'other' : 'exit',
          },
        },
      },
    });
  });
}

/**
 * Tracks scroll depth at 25%, 50%, 75%, 100%.
 * Each milestone fires once per page view.
 * Maps to AA events via data.__adobe.analytics.
 */
function trackScrollDepth() {
  const milestones = [25, 50, 75, 100];
  const reached = new Set();

  // AA event mapping: 25%→event1, 50%→event2, 75%→event3, 100%→event4
  const eventMap = {
    25: 'event1', 50: 'event2', 75: 'event3', 100: 'event4',
  };

  window.addEventListener('scroll', () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = Math.round((window.scrollY / docHeight) * 100);

    milestones.forEach((milestone) => {
      if (pct >= milestone && !reached.has(milestone)) {
        reached.add(milestone);
        window.adobeDataLayer.push({ event: 'scroll depth', scrollDepth: { percent: milestone } });
        window.alloy?.('sendEvent', {
          xdm: {
            eventType: 'web.webInteraction.linkClicks',
            web: {
              webInteraction: {
                name: `Scroll ${milestone}%`,
                linkClicks: { value: 1 },
                type: 'other',
              },
            },
          },
          data: {
            __adobe: { analytics: { eVar1: `${milestone}%`, events: eventMap[milestone] } },
          },
        });
      }
    });
  }, { passive: true });
}

/**
 * Tracks the first play on each video-embed block.
 * Fires ACDL event + alloy media.play XDM event.
 */
function trackVideoEngagement() {
  document.querySelectorAll('.video-embed-placeholder').forEach((placeholder) => {
    placeholder.addEventListener('click', () => {
      const embed = placeholder.closest('.video-embed');
      const videoSrc = embed?.querySelector('iframe')?.src
        || embed?.querySelector('video source')?.src
        || 'unknown';

      window.adobeDataLayer.push({ event: 'video play', video: { url: videoSrc } });

      window.alloy?.('sendEvent', {
        xdm: {
          eventType: 'media.play',
          media: {
            mediaTimed: {
              primaryAssetReference: { _id: videoSrc }, // eslint-disable-line no-underscore-dangle
              impressions: { value: 1 },
            },
          },
        },
      });
    }, { once: true }); // fire only on first play per block
  });
}

// ── 5. A/B EXPERIMENTATION ───────────────────────────────────────────────────

/**
 * Metadata-driven A/B experimentation with Adobe Target.
 *
 * How it works:
 *   1. Author sets "experiment: my-test-id" in Page Properties
 *   2. Code randomly assigns "control" or "variant-a" (50/50)
 *   3. Assignment stored in sessionStorage (consistent in-session)
 *   4. data-experiment + data-variant added to <body>
 *   5. CSS in blocks can show/hide content per variant:
 *        body[data-variant="variant-a"] .my-block .variant-content { display: block; }
 *   6. alloy sendEvent fires — Target can override with server-side decisioning
 *
 * For QA: set "experiment-variant: variant-a" in Page Properties to force a variant.
 */
function setupExperimentation() {
  const experimentId = getMeta('experiment');
  if (!experimentId) return;

  const storageKey = `exp-${experimentId}`;
  const forcedVariant = getMeta('experiment-variant');

  const variant = forcedVariant
    || sessionStorage.getItem(storageKey)
    || (Math.random() < 0.5 ? 'control' : 'variant-a');

  if (!forcedVariant) sessionStorage.setItem(storageKey, variant);

  document.body.dataset.experiment = experimentId;
  document.body.dataset.variant = variant;

  window.adobeDataLayer.push({ event: 'experiment assigned', experiment: { id: experimentId, variant } });

  window.alloy?.('sendEvent', {
    xdm: { eventType: 'decisioning.propositionDisplay' },
    data: {
      __adobe: { analytics: { eVar2: experimentId, eVar3: variant, events: 'event5' } },
    },
  });
}

// ── INIT ─────────────────────────────────────────────────────────────────────
pushPageLoadEvent();
loadLaunch();
showConsentBanner();
trackCTAClicks();
trackScrollDepth();
trackVideoEngagement();
setupExperimentation();
