import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * True when a cell holds only an image (as <picture> or bare <img> inside <p>).
 * @param {Element} cell
 */
function isImageCell(cell) {
  if (!cell.querySelector('img')) return false;
  return !cell.textContent.trim();
}

/**
 * Builds the card image wrapper, carrying over Universal Editor instrumentation.
 * @param {HTMLImageElement} img
 */
function buildMedia(img) {
  const media = document.createElement('div');
  media.className = 'cards-image-link-image';
  const picture = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
  moveInstrumentation(img, picture.querySelector('img'));
  media.append(picture);
  return media;
}

/**
 * Image cards where the whole card is a single link. Each row is one card:
 * image cell + text cell (title, description, link). The first link in the card
 * becomes the card link; inner anchors are unwrapped to avoid nested links.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-image-link-list';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-image-link-card';
    let media = null;
    const body = document.createElement('div');
    body.className = 'cards-image-link-body';

    // Universal Editor: the text field is a richtext editable; its links must stay intact
    let editableText = false;
    [...row.children].forEach((cell) => {
      if (!media && isImageCell(cell)) {
        media = buildMedia(cell.querySelector('img'));
        moveInstrumentation(cell, media);
      } else {
        // Image authored inside the text cell (bare <img> in <p> or <picture>)
        const img = !media ? cell.querySelector('img') : null;
        if (img) {
          const holder = img.closest('p') || img.closest('picture') || img;
          media = buildMedia(img);
          holder.remove();
        }
        if (cell.dataset.aueType === 'richtext') editableText = true;
        moveInstrumentation(cell, body);
        while (cell.firstChild) body.append(cell.firstChild);
      }
    });

    // keep empty items that Universal Editor instruments, so authors can still select them
    if (!media && !body.textContent.trim() && !row.hasAttribute('data-aue-resource')) return;
    moveInstrumentation(row, li);

    const items = [...body.children];
    const title = items.find((el) => /^H[1-6]$/.test(el.tagName))
      || items.find((el) => el.tagName === 'P' && el.querySelector('strong') && !el.querySelector('a'));
    title?.classList.add('cards-image-link-title');

    const firstLink = body.querySelector('a[href]');
    let container = li;
    if (firstLink && editableText) {
      // In-context editing: keep the authored anchors (no whole-card link) so saving the
      // richtext does not drop them; the CTA keeps its label styling.
      body.querySelectorAll('a').forEach((a) => {
        const p = a.closest('p');
        if (p && p.textContent.trim() === a.textContent.trim() && p !== title) {
          p.classList.add('cards-image-link-cta');
          a.classList.add('cards-image-link-cta-label');
        }
      });
    } else if (firstLink) {
      const cardLink = document.createElement('a');
      cardLink.className = 'cards-image-link-link';
      cardLink.href = firstLink.href;
      if (firstLink.target) cardLink.target = firstLink.target;
      if (firstLink.rel) cardLink.rel = firstLink.rel;

      // A paragraph that is only the link is a CTA label; other anchors become plain text
      body.querySelectorAll('a').forEach((a) => {
        const p = a.closest('p');
        const isCta = p && p.textContent.trim() === a.textContent.trim() && p !== title;
        if (isCta) p.classList.add('cards-image-link-cta');
        const span = document.createElement('span');
        if (isCta) span.className = 'cards-image-link-cta-label';
        span.append(...a.childNodes);
        moveInstrumentation(a, span);
        a.replaceWith(span);
      });
      li.append(cardLink);
      container = cardLink;
    }

    body.querySelectorAll(':scope > p:not(.cards-image-link-title, .cards-image-link-cta)')
      .forEach((p) => p.classList.add('cards-image-link-description'));

    if (media) container.append(media);
    container.append(body);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
