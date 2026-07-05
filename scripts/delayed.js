/**
 * delayed.js - AEP Web SDK (Alloy.js) analytics, consent, and tracking.
 * Loaded 3 seconds after page load to protect Core Web Vitals.
 *
 * NOTE: A/B Experimentation is handled by @adobe/aem-experimentation plugin
 * in scripts.js (Eager phase) - NOT here. The plugin runs before decorateMain
 * to avoid content flash (FOUC). See EXPERIMENT_PLUGIN in scripts.js.
 */
const getMeta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || '';
// 1. ADOBE CLIENT DATA LAYER
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
// 2. ADOBE LAUNCH
/**
 * Loads the Adobe Launch library (Tag Management).
 * Launch handles alloy.js, Adobe Analytics, and Adobe Target internally.
 */
function loadLaunch() {
  const script = document.createElement('script');
  // eslint-disable-next-line max-len
  script.src = 'https://assets.adobedtm.com/fbbb5a6f6976/13d6954a51d9/launch-d51eda9acd14-development.min.js';
  script.async = true;
  document.head.append(script);
}
// 4. CUSTOM EVENT TRACKING
/**
 * Tracks clicks on every .button element (CTA, nav, etc.).
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
 */
function trackScrollDepth() {
  const milestones = [25, 50, 75, 100];
  const reached = new Set();
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
    }, { once: true });
  });
}
// 6. ACCESSIBILITY AUDIT (DEV / PREVIEW ONLY)
/**
 * Loads axe-core and runs an automated accessibility audit.
 * Only runs on localhost and *.aem.page - never on *.aem.live (production).
 */
function runAccessibilityAudit() {
  const { hostname } = window.location;
  const isDev = hostname === 'localhost' || hostname.includes('.aem.page');
  if (!isDev) return;
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js';
  script.onload = () => {
    window.axe.run().then(({ violations }) => {
      if (!violations.length) {
        // eslint-disable-next-line no-console
        console.info('[a11y] \u2705 No accessibility violations found.');
        return;
      }
      // eslint-disable-next-line no-console
      console.group(`[a11y] \u274C ${violations.length} accessibility violation(s):`);
      violations.forEach(({
        id, impact, description, nodes,
      }) => {
        // eslint-disable-next-line no-console
        console.group(`${(impact || 'unknown').toUpperCase()} \u2014 ${id}`);
        // eslint-disable-next-line no-console
        console.log(description);
        // eslint-disable-next-line no-console
        nodes.forEach((n) => console.log(n.html));
        // eslint-disable-next-line no-console
        console.groupEnd();
      });
      // eslint-disable-next-line no-console
      console.groupEnd();
    });
  };
  document.head.append(script);
}
// INIT
// Apply client-side redirects (CDN handles these in production).
import('./redirects.js').then(({ applyRedirects }) => applyRedirects());

// Phase 14: send structured page-view for Target audience matching, then
// reveal personalization-pending sections after Target applies modifications.
import('./personalization.js').then(({ sendPersonalizationPageView, applyPersonalization }) => {
  sendPersonalizationPageView();
  setTimeout(() => applyPersonalization(), 100);
});

pushPageLoadEvent();
loadLaunch();
trackCTAClicks();
trackScrollDepth();
trackVideoEngagement();
// NOTE: setupExperimentation() removed - handled by @adobe/aem-experimentation
// plugin in scripts.js loadEager() phase. See EXPERIMENT_PLUGIN constant.
runAccessibilityAudit();
