import { sampleRUM } from '../../scripts/aem.js';
import {
  markPersonalizationRegion,
  trackTargetConversion,
} from '../../scripts/personalization.js';

/**
 * Decorates the hero block.
 *
 * Expected authored structure (one row, two columns):
 *   | hero                          |
 *   | background image (picture)    | headline + body + CTA links |
 *
 * The picture becomes a full-bleed CSS background.
 * The text content is overlaid on top.
 *
 * Target integration:
 *   - The parent .section is marked as "hero-banner" personalization region
 *   - CTA clicks track as Target conversion goals
 *   - VEC can identify elements via data-personalization-region="hero-banner"
 *
 * @param {Element} block
 */
export default async function decorate(block) {
  // Mark the parent section as a Target personalization region.
  // This hides it until Target has applied its modifications (anti-flicker).
  // The .personalization-pending class in styles.css does the hiding.
  // applyPersonalization() in delayed.js reveals it after Target fires.
  const section = block.closest('.section');
  markPersonalizationRegion(section, 'hero-banner');

  // Move picture out of its cell to become the full-bleed background
  const picture = block.querySelector('picture');
  if (picture) {
    const img = picture.querySelector('img');
    if (img) {
      // Mark as LCP image so browser prioritises it
      img.setAttribute('fetchpriority', 'high');
      img.setAttribute('loading', 'eager');
    }
    // Prepend to block so CSS `position: absolute` stretches it behind text
    block.prepend(picture);
  }

  // Track every CTA click as both a RUM event and a Target conversion goal.
  // In the Target UI, create a "Custom Conversion" metric with goal = "hero-cta-click".
  block.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      const ctaText = link.textContent.trim();
      const ctaUrl = link.href;

      // RUM — feeds the EDS dashboard (Phase 15)
      sampleRUM('click', { source: '.hero a', target: ctaUrl });

      // Target — feeds the A/B test success metric (Phase 14)
      trackTargetConversion('hero-cta-click', { ctaText, ctaUrl });
    });
  });
}
