import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * True when a cell (or element) holds an image and no text.
 * @param {Element} el
 */
function isMediaOnly(el) {
  return !!el.querySelector('img') && !el.textContent.trim();
}

/**
 * Builds an optimized picture from an authored <img>.
 * @param {HTMLImageElement} img
 */
function toPicture(img) {
  const picture = createOptimizedPicture(img.src, img.alt || '', false, [
    { media: '(min-width: 900px)', width: '1200' },
    { width: '750' },
  ]);
  moveInstrumentation(img, picture.querySelector('img'));
  return picture;
}

/**
 * Moves the child nodes of a cell into a target wrapper. Bare text (UE text fields)
 * is wrapped in a paragraph.
 * @param {Element} cell
 * @param {Element} target
 */
function moveContent(cell, target) {
  // Universal Editor: the field's instrumentation moves with its content
  moveInstrumentation(cell, target);
  if (!cell.children.length && cell.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = cell.textContent.trim();
    target.append(p);
    return;
  }
  while (cell.firstChild) target.append(cell.firstChild);
}

/**
 * Callout panel: rich text (heading + paragraphs / list), optional image and
 * optional note (e.g. a chart disclaimer).
 * Rows: text, image (optional), note (optional). When the image is authored inside
 * the text, the content after it becomes the note.
 * Options: default light-blue takeaways panel, `chart` (light-grey chart panel),
 * `rule` (orange top rule, no panel).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const body = document.createElement('div');
  body.className = 'callout-takeaways-body';
  const media = document.createElement('div');
  media.className = 'callout-takeaways-media';
  const note = document.createElement('div');
  note.className = 'callout-takeaways-note';

  [...block.children].forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    if (!cell.querySelector('img') && !cell.textContent.trim()) return;
    if (isMediaOnly(cell)) {
      if (!media.children.length) {
        moveInstrumentation(cell, media);
        media.append(toPicture(cell.querySelector('img')));
      }
    } else if (!body.children.length && !media.children.length) {
      moveContent(cell, body);
    } else {
      moveContent(cell, note);
    }
  });

  // Image authored inside the text: it becomes the media, what follows becomes the note
  if (!media.children.length) {
    const imgHolder = [...body.children].find((el) => el.querySelector('img') && isMediaOnly(el));
    if (imgHolder) {
      const following = [];
      let next = imgHolder.nextElementSibling;
      while (next) {
        following.push(next);
        next = next.nextElementSibling;
      }
      media.append(toPicture(imgHolder.querySelector('img')));
      imgHolder.remove();
      note.prepend(...following);
    }
  }

  body.querySelectorAll(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6')
    .forEach((h) => h.classList.add('callout-takeaways-title'));
  // A paragraph authored entirely in bold is a label (e.g. the chart description)
  body.querySelectorAll(':scope > p').forEach((p) => {
    const strong = p.querySelector(':scope > strong');
    if (strong && p.children.length === 1 && strong.textContent.trim() === p.textContent.trim()) {
      p.classList.add('callout-takeaways-label');
    }
  });

  const parts = [body, media, note].filter((el) => el.children.length);
  block.replaceChildren(...parts);
}
