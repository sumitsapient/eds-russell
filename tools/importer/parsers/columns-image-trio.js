/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-image-trio.
 * Source: russellinvestments.com — .fullbleedimagesdouble / .cmp-full-bleed-images-double:
 * two photos and a card (H3 heading + CTA link).
 * Model (xwalk): columns block — one row: image | card (h3 + link) | image. No field hints.
 */

const OVERLAY = '.cmp-leave-site-overlay';

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function linkText(a) {
  const clone = a.cloneNode(true);
  clone.querySelectorAll('.cmp-link__screen-reader-only, .cmp-button__arrow, a').forEach((n) => n.remove());
  return clean(clone.textContent);
}

function toImage(img, document) {
  const image = document.createElement('img');
  image.setAttribute('src', img.getAttribute('src'));
  image.setAttribute('alt', img.getAttribute('alt') || '');
  return image;
}

export default function parse(element, { document }) {
  const root = element.querySelector('.cmp-full-bleed-images-double') || element;
  const images = [...root.querySelectorAll('.cmp-full-bleed-images-double__images img')]
    .filter((img) => img.getAttribute('src') && !img.getAttribute('src').startsWith('data:'));
  const card = root.querySelector('.cmp-full-bleed-images-double__card');

  const cardNodes = [];
  if (card) {
    const heading = card.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading && clean(heading.textContent)) {
      const h3 = document.createElement('h3');
      h3.textContent = clean(heading.textContent);
      cardNodes.push(h3);
    }
    const cta = [...card.querySelectorAll('a[href]')].find((a) => !a.closest(OVERLAY) && linkText(a));
    if (cta) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', cta.getAttribute('href'));
      a.textContent = linkText(cta);
      p.appendChild(a);
      cardNodes.push(p);
    }
  }

  const row = [
    images[0] ? [toImage(images[0], document)] : '',
    cardNodes.length ? cardNodes : '',
    images[1] ? [toImage(images[1], document)] : '',
  ];

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-image-trio', cells });
  element.replaceWith(block);
}
