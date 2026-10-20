import { moveInstrumentation } from '../../scripts/scripts.js';

const BUTTON_CLASSES = ['button', 'primary', 'secondary', 'accent'];

/**
 * True when a paragraph holds a single link and nothing else.
 * @param {Element} el
 */
function isLinkOnly(el) {
  const a = el.querySelector('a');
  return el.tagName === 'P' && a && el.textContent.trim() === a.textContent.trim();
}

/**
 * True when an element holds only an image (picture, or bare img inside a <p>).
 * @param {Element} el
 */
function isImageOnly(el) {
  if (el.tagName === 'PICTURE') return true;
  return el.tagName === 'P' && !!el.querySelector('img') && !el.textContent.trim();
}

/**
 * Turns an EDS auto-decorated button back into a plain inline link.
 * @param {Element} p
 */
function unbutton(p) {
  p.classList.remove('button-wrapper');
  p.querySelectorAll('a').forEach((a) => a.classList.remove(...BUTTON_CLASSES));
}

/**
 * `tile` option: optional leading badge image, short eyebrow (e.g. fund ticker) above the
 * title, inline links in the description and an outlined pill CTA. Only the LAST single-line
 * link-only paragraph after the title is the CTA; other link-only lines stay plain links.
 * @param {Element} body
 * @param {Element} title
 * @param {boolean} arrowCta render the CTA as the tertiary text + arrow link
 */
function decorateTile(body, title, arrowCta) {
  // EDS groups adjacent auto-buttons; the tile owns its own layout
  body.querySelectorAll(':scope > .button-group').forEach((group) => group.replaceWith(...group.children));

  const items = [...body.children];
  const titleIdx = title ? items.indexOf(title) : -1;

  if (items[0] && items[0] !== title && isImageOnly(items[0])) items[0].classList.add('cards-links-badge');

  if (titleIdx > 0) {
    items.slice(0, titleIdx)
      .filter((el) => el.tagName === 'P' && !el.classList.contains('cards-links-badge')
        && !el.querySelector('a, img') && el.textContent.trim().length <= 40)
      .forEach((el) => el.classList.add('cards-links-eyebrow'));
  }

  const linkOnly = items.filter((el, i) => i > titleIdx && isLinkOnly(el));
  const cta = [...linkOnly].reverse().find((el) => !el.querySelector('br, img'));
  linkOnly.filter((el) => el !== cta).forEach(unbutton);
  if (!cta) return;

  cta.classList.add('cards-links-cta');
  cta.classList.remove('button-wrapper');
  const link = cta.querySelector('a');
  if (arrowCta) {
    link.classList.remove(...BUTTON_CLASSES);
    link.classList.add('link-arrow');
  } else {
    // Russell .cmp-button--secondary: outlined pill, whatever EDS auto-decorated it as
    link.classList.remove('primary', 'accent');
    link.classList.add('button', 'secondary');
  }
}

/**
 * Text-only link cards: each row is one card with title, description and CTA link.
 * Options: `tile` (filled notched tile, pill CTA, optional badge + eyebrow),
 * `cta-arrow` (with `tile`: tertiary text + arrow CTA instead of the pill).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const isTile = block.classList.contains('tile');
  const arrowCta = block.classList.contains('cta-arrow');
  const ul = document.createElement('ul');
  ul.className = 'cards-links-list';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-links-card';
    const body = document.createElement('div');
    body.className = 'cards-links-body';

    [...row.children].forEach((cell) => {
      // the (single) text field's richtext instrumentation moves to the body that holds it
      moveInstrumentation(cell, body);
      while (cell.firstChild) body.append(cell.firstChild);
    });
    // keep empty items that Universal Editor instruments, so authors can still select them
    if (!body.textContent.trim() && !body.querySelector('img') && !row.hasAttribute('data-aue-resource')) return;
    moveInstrumentation(row, li);

    const items = [...body.children];
    const title = items.find((el) => /^H[1-6]$/.test(el.tagName))
      || items.find((el) => el.tagName === 'P' && !el.querySelector('a') && el.querySelector('strong'));
    if (title) title.classList.add('cards-links-title');

    if (isTile) {
      decorateTile(body, title, arrowCta);
    } else {
      // Last paragraph that contains only a link is the CTA
      const cta = items.reverse().find(isLinkOnly);
      if (cta) {
        cta.classList.add('cards-links-cta');
        // Russell .cmp-button--tertiary: label + circular arrow (global utility)
        const link = cta.querySelector('a');
        link.classList.remove('button', 'primary', 'secondary');
        link.classList.add('link-arrow');
      }
    }

    body.querySelectorAll(':scope > p:not(.cards-links-title, .cards-links-cta, .cards-links-eyebrow, .cards-links-badge)')
      .forEach((p) => p.classList.add('cards-links-description'));

    li.append(body);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
