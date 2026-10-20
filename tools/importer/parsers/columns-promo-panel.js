/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-promo-panel.
 * Source: russellinvestments.com — .verticalcardimageright: content (eyebrow span inside the
 * H3, H3 title, description, CTA) beside an image. The navy full-bleed modifier
 * (cmp-vertical-card-image-right--navy-full-bleed) maps to the `dark` variant.
 * Model (xwalk): columns block — one row, cells in source order (text | image). No field hints.
 */

const OVERLAY = '.cmp-leave-site-overlay';

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function linkText(a) {
  const clone = a.cloneNode(true);
  clone.querySelectorAll('.cmp-link__screen-reader-only, .cmp-button__arrow').forEach((n) => n.remove());
  return clean(clone.textContent);
}

function buildTextCell(content, document) {
  const nodes = [];
  const title = content.querySelector('.cmp-vertical-card-image-right__title, h1, h2, h3, h4');
  const eyebrow = content.querySelector('.cmp-vertical-card-image-right__title-pretitle');
  const description = content.querySelector('.cmp-vertical-card-image-right__description');

  if (eyebrow && clean(eyebrow.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(eyebrow.textContent);
    nodes.push(p);
  }
  if (title) {
    const clone = title.cloneNode(true);
    clone.querySelectorAll('.cmp-vertical-card-image-right__title-pretitle').forEach((n) => n.remove());
    if (clean(clone.textContent)) {
      const h3 = document.createElement('h3');
      h3.textContent = clean(clone.textContent);
      nodes.push(h3);
    }
  }
  if (description && clean(description.textContent)) {
    const p = document.createElement('p');
    p.innerHTML = description.innerHTML;
    nodes.push(p);
  }
  const cta = [...content.querySelectorAll('a[href]')]
    .find((a) => !a.closest(OVERLAY) && !(description && description.contains(a)) && linkText(a));
  if (cta) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', cta.getAttribute('href'));
    a.textContent = linkText(cta);
    p.appendChild(a);
    nodes.push(p);
  }
  return nodes;
}

function buildImageCell(wrapper, document) {
  const img = [...wrapper.querySelectorAll('img')]
    .find((i) => i.getAttribute('src') && !i.getAttribute('src').startsWith('data:') && !i.closest(OVERLAY));
  if (!img) return [];
  const image = document.createElement('img');
  image.setAttribute('src', img.getAttribute('src'));
  image.setAttribute('alt', img.getAttribute('alt') || '');
  return [image];
}

export default function parse(element, { document }) {
  const container = element.querySelector('.cmp-vertical-card-image-right__container') || element;
  const row = [];
  let textNodes = null;
  [...container.children].forEach((child) => {
    if (child.matches('.cmp-vertical-card-image-right__content')) {
      const nodes = buildTextCell(child, document);
      if (nodes.length) { row.push(nodes); textNodes = nodes; }
    } else if (child.matches('.cmp-vertical-card-image-right__image-wrapper')) {
      const nodes = buildImageCell(child, document);
      if (nodes.length) row.push(nodes);
    }
  });

  const isDark = element.classList.contains('cmp-vertical-card-image-right--navy-full-bleed')
    || !!element.querySelector('.cmp-vertical-card-image-right--navy-full-bleed');
  const variants = isDark ? ['dark'] : [];

  // Footnote text component placed right after a full-bleed panel (e.g. "Alternatively, download
  // this email template ...") is rendered INSIDE the navy panel on the source (pulled up under
  // the CTA), so it belongs to the panel's text cell.
  const note = element.nextElementSibling;
  if (isDark && textNodes && note && note.matches('.text.cmp-text--footer')) {
    note.querySelectorAll('p').forEach((p) => {
      if (!clean(p.textContent)) return;
      const para = document.createElement('p');
      para.innerHTML = p.innerHTML;
      para.querySelectorAll('.cmp-link__screen-reader-only').forEach((n) => n.remove());
      textNodes.push(para);
    });
    note.remove();
  }

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-promo-panel', variants, cells });
  element.replaceWith(block);
}
