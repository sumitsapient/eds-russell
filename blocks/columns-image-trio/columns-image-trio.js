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
  return !!cell.querySelector('img') && !cell.textContent.trim();
}

/**
 * Image | text panel | image layout.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-image-trio-row');
    [...row.children].forEach((cell) => {
      if (isImageCell(cell)) {
        cell.classList.add('columns-image-trio-image');
        replaceWithPicture(cell, [
          { media: '(min-width: 900px)', width: '800' },
          { width: '750' },
        ]);
      } else {
        cell.classList.add('columns-image-trio-panel');
        // standalone CTA links render as the arrow text link (source .cmp-button--tertiary)
        cell.querySelectorAll('p > a:only-child').forEach((a) => {
          if (a.closest('p').textContent.trim() === a.textContent.trim()) {
            a.classList.add('link-arrow');
          }
        });
      }
    });
  });
}
