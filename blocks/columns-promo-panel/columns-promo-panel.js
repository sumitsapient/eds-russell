import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Replaces an image cell's content with an optimized picture, moving Universal Editor
 * instrumentation from the authored <img> (and its <picture>/<p> wrappers) to the new picture.
 * @param {Element} cell
 * @param {Object[]} breakpoints
 */
function replaceWithPicture(cell, breakpoints) {
  const img = cell.querySelector('img');
  const picture = createOptimizedPicture(img.src, img.alt || '', false, breakpoints);
  moveInstrumentation(img, picture.querySelector('img'));
  for (let el = img.parentElement; el && el !== cell; el = el.parentElement) {
    moveInstrumentation(el, picture);
  }
  cell.replaceChildren(picture);
}

/**
 * True when a cell holds only an image (as <picture> or bare <img> inside <p>).
 * @param {Element} cell
 */
function isImageCell(cell) {
  if (!cell.querySelector('img')) return false;
  return !cell.textContent.trim();
}

/**
 * Adds semantic classes to the text panel: eyebrow, heading, body, CTA.
 * @param {Element} cell
 */
function decorateText(cell) {
  const els = [...cell.children];
  const headingIdx = els.findIndex((el) => /^H[1-6]$/.test(el.tagName));
  let hasCta = false;
  els.forEach((el, i) => {
    if (/^H[1-6]$/.test(el.tagName)) {
      el.classList.add('columns-promo-panel-heading');
      return;
    }
    const link = el.querySelector('a');
    if (!hasCta && el.tagName === 'P' && link && el.textContent.trim() === link.textContent.trim()) {
      el.classList.add('columns-promo-panel-cta');
      hasCta = true;
      return;
    }
    // text after the CTA is a small footnote (e.g. "Alternatively, download this template")
    if (hasCta && el.tagName === 'P') {
      el.classList.add('columns-promo-panel-note');
      return;
    }
    if (headingIdx > 0 && i < headingIdx && el.tagName === 'P') {
      el.classList.add('columns-promo-panel-eyebrow');
    }
  });
}

/**
 * Promo panel: boxed text (optional eyebrow, heading, paragraph, CTA) beside an
 * edge-to-edge image. Cell order controls image placement. Option: `dark`.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-promo-panel-row');
    [...row.children].forEach((cell, i) => {
      if (isImageCell(cell)) {
        cell.classList.add('columns-promo-panel-image');
        if (i === 0) row.classList.add('columns-promo-panel-image-first');
        replaceWithPicture(cell, [
          { media: '(min-width: 900px)', width: '1200' },
          { width: '750' },
        ]);
      } else {
        cell.classList.add('columns-promo-panel-text');
        decorateText(cell);
      }
    });
  });
}
