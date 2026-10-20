import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * True when a cell holds only an image (as <picture> or bare <img> inside <p>).
 * @param {Element} cell
 */
function isImageCell(cell) {
  return !!cell.querySelector('img') && !cell.textContent.trim();
}

/**
 * Replaces an image cell's content with an optimized picture, moving Universal Editor
 * instrumentation from the authored <img> (and its <picture>/<p> wrappers).
 * @param {Element} cell
 */
function replaceWithPicture(cell) {
  const img = cell.querySelector('img');
  const picture = createOptimizedPicture(img.src, img.alt || '', false, [
    { media: '(min-width: 1200px)', width: '2000' },
    { media: '(min-width: 600px)', width: '1200' },
    { width: '750' },
  ]);
  moveInstrumentation(img, picture.querySelector('img'));
  for (let el = img.parentElement; el && el !== cell; el = el.parentElement) {
    moveInstrumentation(el, picture);
  }
  cell.replaceChildren(picture);
}

/**
 * Classifies the panel content: heading, lead paragraph, bold sub-headings, CTA.
 * @param {Element} cell
 */
function decoratePanel(cell) {
  const els = [...cell.children];
  const heading = els.find((el) => /^H[1-6]$/.test(el.tagName));
  if (heading) heading.classList.add('columns-overlay-heading');

  const isLinkOnly = (el) => {
    const a = el.querySelector('a');
    return el.tagName === 'P' && a && el.textContent.trim() === a.textContent.trim();
  };
  const isBoldOnly = (el) => {
    const b = el.querySelector('strong, b');
    return el.tagName === 'P' && b && !el.querySelector('a') && el.textContent.trim() === b.textContent.trim();
  };

  els.forEach((el) => {
    if (isBoldOnly(el)) el.classList.add('columns-overlay-subheading');
  });

  // the paragraph right after the heading is the larger lead text
  const lead = heading && heading.nextElementSibling;
  if (lead && lead.tagName === 'P' && !isLinkOnly(lead) && !isBoldOnly(lead)) {
    lead.classList.add('columns-overlay-lead');
  }

  // last link-only paragraph is the CTA: outlined pill unless the author chose a variant
  const cta = [...els].reverse().find(isLinkOnly);
  if (cta) {
    cta.classList.add('columns-overlay-cta');
    const link = cta.querySelector('a');
    link.classList.add('button');
    if (!['primary', 'secondary', 'accent'].some((c) => link.classList.contains(c))) {
      link.classList.add('secondary');
    }
  }
}

/**
 * Columns overlay: a white text panel layered over a full-bleed background photo
 * (stacked below the photo on mobile). Cells: image | rich text, in either order.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-overlay-row');
    [...row.children].forEach((cell) => {
      if (isImageCell(cell)) {
        cell.classList.add('columns-overlay-media');
        replaceWithPicture(cell);
      } else {
        cell.classList.add('columns-overlay-panel');
        decoratePanel(cell);
      }
    });
  });
}
