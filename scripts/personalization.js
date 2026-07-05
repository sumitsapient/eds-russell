/**
 * personalization.js - Adobe Target integration for EDS.
 *
 * Works alongside Adobe Launch (which loads alloy.js and configures Target).
 * This module handles three jobs:
 *
 *   1. ANTI-FLICKER  - mark sections as "pending", reveal after Target fires
 *   2. CONVERSION    - tell Target when a goal (CTA click, form submit) is hit
 *   3. PAGE VIEW     - push a structured page-view event that Launch sends to Target
 *
 * Launch requirement: in your "Send Event" action, set renderDecisions = true.
 * This tells alloy to request Target offers and apply them automatically.
 *
 * Why a separate module?
 *   Personalization logic is self-contained and reusable across blocks.
 *   Blocks import only the functions they need instead of duplicating alloy calls.
 */

// Maximum ms to wait for Target to apply modifications before revealing content.
// If Target/Launch hasn't fired within this time, show the content anyway.
const REVEAL_TIMEOUT_MS = 2000;

/**
 * Marks an element as a Target personalization region.
 *
 * - Adds data-personalization-region attribute (used by Target VEC to identify
 *   the element when building activities)
 * - Adds .personalization-pending class so CSS hides the element until
 *   Target has applied its modifications (prevents flicker)
 *
 * @param {Element} el - The DOM element (typically a .section)
 * @param {string} regionName - Unique name, e.g. 'hero-banner', 'sidebar-promo'
 *
 * @example
 * // In hero.js decorate():
 * const section = block.closest('.section');
 * markPersonalizationRegion(section, 'hero-banner');
 */
export function markPersonalizationRegion(el, regionName) {
  if (!el) return;
  el.dataset.personalizationRegion = regionName;
  el.classList.add('personalization-pending');
}

/**
 * Reveals all elements that were hidden for personalization.
 * Called after alloy/Target has applied modifications, or on timeout.
 */
function revealAll() {
  document.querySelectorAll('.personalization-pending').forEach((el) => {
    el.classList.remove('personalization-pending');
    el.classList.add('personalization-applied');
  });
}

/**
 * Triggers a Target sendEvent with renderDecisions: true, then reveals
 * personalization regions after Target has applied its offers.
 *
 * Call this AFTER Launch (alloy.js) has loaded, i.e. in delayed.js.
 * If no personalization regions exist on the page, does nothing.
 *
 * The race between alloy and REVEAL_TIMEOUT_MS ensures the page never stays
 * hidden forever if Target is slow or unavailable.
 */
export async function applyPersonalization() {
  const regions = document.querySelectorAll('[data-personalization-region]');
  if (!regions.length) return;

  const alloyReady = window.alloy
    ? window.alloy('sendEvent', {
      renderDecisions: true,
      xdm: {
        eventType: 'decisioning.propositionFetch',
        web: {
          webPageDetails: {
            URL: window.location.href,
            name: document.title,
          },
        },
      },
    }).catch(() => null)
    : Promise.resolve(null);

  const safetyTimeout = new Promise((resolve) => {
    setTimeout(resolve, REVEAL_TIMEOUT_MS);
  });

  await Promise.race([alloyReady, safetyTimeout]);
  revealAll();
}

/**
 * Tracks a Target conversion goal.
 *
 * Maps to a "Custom Conversion" metric in your Target activity.
 * Works two ways:
 *  - window._satellite.track() for Launch rules that listen for this event
 *  - window.alloy sendEvent for direct alloy (non-Launch) setups
 *
 * @param {string} goalName - The goal identifier set in your Target activity
 * @param {Object} [params] - Optional key/value parameters passed to Target
 *
 * @example
 * // Track a CTA click as a Target goal
 * trackTargetConversion('hero-cta-click', { ctaText: 'Get Started' });
 *
 * // Track a form submission
 * trackTargetConversion('newsletter-signup');
 */
export function trackTargetConversion(goalName, params = {}) {
  // Path 1: Adobe Launch - fire a custom satellite event.
  // Create a Launch rule: Event = "Direct Call", Identifier = "target-conversion"
  // Action = "Send Event" with renderDecisions = true + mbox params from %event.detail%
  // eslint-disable-next-line no-underscore-dangle
  window._satellite?.track('target-conversion', { goal: goalName, ...params });

  // Path 2: Direct alloy call (fallback / non-Launch setups)
  window.alloy?.('sendEvent', {
    xdm: { eventType: 'decisioning.propositionInteract' },
    data: {
      __adobe: {
        target: { mbox: goalName, ...params },
      },
    },
  });
}

/**
 * Sends a structured page-view event that Launch can use for Target
 * "landing page" conditions and audience matching.
 *
 * Adds page context (section, template, locale) that Target audience rules
 * can match against, e.g. "show this offer only on pages with section=insights".
 *
 * Call this once per page load in delayed.js, AFTER loadLaunch().
 *
 * @param {Object} [extra] - Additional page parameters for Target
 */
export function sendPersonalizationPageView(extra = {}) {
  const section = window.location.pathname.split('/').filter(Boolean)[0] || 'home';
  const template = document.querySelector('meta[name="template"]')?.content || 'default';
  const locale = document.documentElement.lang || 'en';
  const experiment = document.body.dataset.experiment || '';
  const variant = document.body.dataset.variant || '';

  // ACDL push - Launch picks this up via Adobe Client Data Layer extension.
  // Your Launch "Target Page Load" rule fires on event = "target page view".
  window.adobeDataLayer?.push({
    event: 'target page view',
    page: {
      name: document.title,
      section,
      template,
      locale,
      experiment,
      variant,
      ...extra,
    },
  });
}
