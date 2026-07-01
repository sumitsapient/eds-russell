/**
 * CTA Banner block — full-width call-to-action with optional background image.
 *
 * Authored structure:
 * | CTA Banner         |
 * | --- | --- |
 * | Background Image   | Content (heading, text, buttons) |
 *
 * @param {Element} block The cta-banner block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const row = rows[0];
  const [mediaCell, contentCell] = [...row.children];

  // Build banner structure
  const banner = document.createElement('div');
  banner.className = 'cta-banner-inner';

  // Background image
  if (mediaCell) {
    const picture = mediaCell.querySelector('picture');
    if (picture) {
      const bgContainer = document.createElement('div');
      bgContainer.className = 'cta-banner-bg';
      bgContainer.append(picture);
      banner.append(bgContainer);

      // Mark LCP image as eager if in first section
      const img = picture.querySelector('img');
      if (img && block.closest('.section:first-of-type')) {
        img.loading = 'eager';
        img.fetchpriority = 'high';
      }
    }
  }

  // Content area
  if (contentCell) {
    const content = document.createElement('div');
    content.className = 'cta-banner-content';
    content.innerHTML = contentCell.innerHTML;

    // Ensure button styling
    content.querySelectorAll('p a[href]').forEach((a) => {
      const p = a.closest('p');
      if (p && p.textContent.trim() === a.textContent.trim()) {
        if (!a.classList.contains('button')) {
          a.classList.add('button', 'primary');
          p.classList.add('button-wrapper');
        }
      }
    });

    banner.append(content);
  }

  block.textContent = '';
  block.append(banner);
}

