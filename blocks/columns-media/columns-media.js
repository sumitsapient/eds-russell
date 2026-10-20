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
  const img = cell.querySelector('picture img, :scope > p > img, :scope > img');
  if (!img) return false;
  return !cell.textContent.trim();
}

/**
 * Side-by-side text and image layout.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-media-row');
    const cells = [...row.children];
    row.classList.add(`columns-media-${cells.length}-cols`);

    cells.forEach((cell, i) => {
      if (isImageCell(cell)) {
        cell.classList.add('columns-media-image');
        if (i === 0) row.classList.add('columns-media-image-first');
        replaceWithPicture(cell, [
          { media: '(min-width: 900px)', width: '1200' },
          { width: '750' },
        ]);
      } else {
        cell.classList.add('columns-media-text');
        // standalone links (paragraph holds only the link) render as CTA pills
        cell.querySelectorAll(':scope > p').forEach((p) => {
          const links = p.querySelectorAll('a');
          if (links.length === 1 && p.textContent.trim() === links[0].textContent.trim()) {
            p.classList.add('columns-media-cta');
            links[0].classList.add('columns-media-cta-link');
          }
        });
      }
    });
  });
}
