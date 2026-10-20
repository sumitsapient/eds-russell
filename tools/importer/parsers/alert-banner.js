/* eslint-disable */
/* global WebImporter */

/**
 * Parser for alert-banner.
 * Source: russellinvestments.com — .alertbanner > section.cmp-alert-banner:
 *   .cmp-alert-banner__icon-and-link > img.cmp-alert-banner__icon + a.cmp-alert-banner__link (notice)
 *   button.cmp-alert-banner__close-button (not authored; the block builds its own close button)
 * Model (xwalk): icon (reference) + iconAlt (collapsed into the img alt) + text (richtext).
 * One row per field: row 1 icon, row 2 notice text.
 */

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const banner = element.querySelector('.cmp-alert-banner') || element;
  const cells = [];

  // Row 1: optional icon
  const icon = [...banner.querySelectorAll('img')]
    .find((i) => i.getAttribute('src') && !i.getAttribute('src').startsWith('data:') && !i.closest('button'));
  if (icon) {
    const frag = document.createDocumentFragment();
    const img = document.createElement('img');
    img.setAttribute('src', icon.getAttribute('src'));
    img.setAttribute('alt', icon.getAttribute('alt') || '');
    frag.appendChild(document.createComment(' field:icon '));
    frag.appendChild(img);
    cells.push([frag]);
  } else {
    cells.push(['']);
  }

  // Row 2: notice text (keeps the link around the message when the source has one)
  const container = banner.querySelector('.cmp-alert-banner__icon-and-link') || banner;
  const p = document.createElement('p');
  const link = container.querySelector('a[href]');
  if (link) {
    const a = document.createElement('a');
    a.setAttribute('href', link.getAttribute('href'));
    a.textContent = clean(link.textContent);
    p.appendChild(a);
  } else {
    const clone = container.cloneNode(true);
    clone.querySelectorAll('img, button').forEach((n) => n.remove());
    p.textContent = clean(clone.textContent);
  }
  if (clean(p.textContent)) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:text '));
    frag.appendChild(p);
    cells.push([frag]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'alert-banner', cells });
  element.replaceWith(block);
}
