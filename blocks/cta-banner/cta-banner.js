/**
 * CTA Banner block — full-width call-to-action with optional background image.
 *
 * Authored structure (one field per row):
 * | CTA Banner          |
 * | ------------------- |
 * | background image    |   ← row 0: backgroundImage (reference)
 * | Heading text        |   ← row 1: heading (text)
 * | Description + CTA   |   ← row 2: description (richtext, may contain a bold link → button)
 *
 * Add a CTA button by putting a bold link in the Description field:
 *   **[Get Started](/page)** → renders as <a class="button primary">
 *
 * @param {Element} block The cta-banner block element
 */
import { decorateButtons, moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];

  // Read each row's first cell (flat model: one property per row)
  const bgCell = rows[0]?.children[0];
  const headingCell = rows[1]?.children[0];
  const descCell = rows[2]?.children[0];

  const banner = document.createElement('div');
  banner.className = 'cta-banner-inner';

  // Background image (row 0)
  const picture = bgCell?.querySelector('picture');
  if (picture) {
    const bgContainer = document.createElement('div');
    bgContainer.className = 'cta-banner-bg';
    if (bgCell) moveInstrumentation(bgCell, bgContainer);
    bgContainer.append(picture);
    banner.append(bgContainer);

    // Mark LCP image as eager if this banner is in the first section
    const img = picture.querySelector('img');
    if (img && block.closest('.section:first-of-type')) {
      img.loading = 'eager';
      img.setAttribute('fetchpriority', 'high');
    }
  }

  // Content area
  const content = document.createElement('div');
  content.className = 'cta-banner-content';

  // Heading (row 1)
  if (headingCell) {
    const heading = document.createElement('h2');
    heading.className = 'cta-banner-heading';
    moveInstrumentation(headingCell, heading);
    while (headingCell.firstChild) heading.append(headingCell.firstChild);
    content.append(heading);
  }

  // Description + CTA (row 2)
  if (descCell) {
    const desc = document.createElement('div');
    desc.className = 'cta-banner-description';
    moveInstrumentation(descCell, desc);
    while (descCell.firstChild) desc.append(descCell.firstChild);
    decorateButtons(desc);
    content.append(desc);
  }

  banner.append(content);
  block.textContent = '';
  block.append(banner);
}
