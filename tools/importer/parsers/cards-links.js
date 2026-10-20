/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-links.
 * Source: russellinvestments.com — .aem-Grid containing a .title heading (optional .text kicker)
 * and text-only .verticalcard items (pretitle, title, description, CTA button).
 * Heading/kicker stay outside the block as default content before it.
 * Items are selected via the stable .verticalcard wrapper (grid column widths vary per page).
 * Model (xwalk): container of cards-links-item { text (richtext) } — one row per card;
 * `classes` multiselect (tile, cta-arrow) emitted as the block variant, e.g. "Cards Links (tile)".
 *
 * Grouping: when a .title appears AFTER cards in the same grid (e.g. ETF fund groups
 * "Looking for Growth?" / "Looking for Total Return?"), each heading starts a new block, so
 * headings stay in source order between the card grids.
 * Nested grids: an outer grid whose children are .responsivegrid > .aem-Grid > .verticalcard
 * (cards split across sub-grids, e.g. Contact Us 3 + 2) becomes ONE block.
 *
 * Tile option (opt-in via the `tileOptions` parser option, so other templates keep their output):
 * cards with a filled background modifier (cmp-vertical-card--off-white-bg / --white-bg) and no
 * accent modifier (title-accent / accent-line) are tiles -> variant `tile`; when every CTA is a
 * tertiary text+arrow button (cmp-button--tertiary) -> `tile, cta-arrow`. Tile cards also keep
 * the optional badge image (.cmp-vertical-card__img-container) and never invent a CTA from the
 * card-level href.
 */

const OVERLAY = '.cmp-leave-site-overlay';
const TILE_BG = /(^|\s)cmp-vertical-card--(off-white|white)-bg(\s|$)/;
const ACCENT = /(^|\s)cmp-vertical-card--(title-accent|accent-line)(\s|$)/;

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function linkText(a) {
  const clone = a.cloneNode(true);
  clone.querySelectorAll('.cmp-link__screen-reader-only, .cmp-button__arrow').forEach((n) => n.remove());
  return clean(clone.textContent);
}

function leadingNodes(child, document) {
  const nodes = [];
  if (child.matches('.title')) {
    const h = child.querySelector('h1, h2, h3, h4, h5, h6');
    if (h && h.textContent.trim()) {
      const heading = document.createElement(h.tagName.toLowerCase());
      heading.textContent = clean(h.textContent);
      nodes.push(heading);
    }
  } else if (child.matches('.text')) {
    child.querySelectorAll('.cmp-text > *').forEach((el) => {
      if (el.textContent.trim()) nodes.push(el);
    });
  }
  return nodes;
}

function isTileCard(item) {
  const cls = item.getAttribute('class') || '';
  return TILE_BG.test(cls) && !ACCENT.test(cls);
}

function findCta(content, description) {
  return [...content.querySelectorAll('a[href]')]
    .find((a) => !a.closest(OVERLAY) && !(description && description.contains(a)) && linkText(a));
}

/** Remove trailing <br> / whitespace inside a paragraph (source adds them before </p>). */
function trimTrailingBreaks(p) {
  let last = p.lastChild;
  while (last && ((last.nodeType === 3 && !last.textContent.trim()) || (last.nodeType === 1 && last.tagName === 'BR'))) {
    const prev = last.previousSibling;
    last.remove();
    last = prev;
  }
}

function buildCard(item, document, tile) {
  const content = item.querySelector('.cmp-vertical-card__content') || item;
  const pretitle = content.querySelector('.cmp-vertical-card__pretitle');
  const title = content.querySelector('.cmp-vertical-card__title');
  const description = content.querySelector('.cmp-vertical-card__description');

  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(' field:text '));

  if (tile) {
    const badge = [...item.querySelectorAll('.cmp-vertical-card__img-container img')]
      .find((i) => i.getAttribute('src') && !i.getAttribute('src').startsWith('data:') && !i.closest(OVERLAY));
    if (badge) {
      const p = document.createElement('p');
      const img = document.createElement('img');
      img.setAttribute('src', badge.getAttribute('src'));
      img.setAttribute('alt', badge.getAttribute('alt') || '');
      p.appendChild(img);
      frag.appendChild(p);
    }
  }

  if (pretitle && clean(pretitle.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(pretitle.textContent);
    frag.appendChild(p);
  }
  if (title && clean(title.textContent)) {
    const h3 = document.createElement('h3');
    h3.textContent = clean(title.textContent);
    frag.appendChild(h3);
  }
  if (description) {
    const paras = description.querySelectorAll('p');
    if (paras.length) {
      paras.forEach((p) => {
        if (!clean(p.textContent)) return;
        if (tile) trimTrailingBreaks(p);
        frag.appendChild(p);
      });
    } else if (clean(description.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(description.textContent);
      frag.appendChild(p);
    }
  }

  // CTA: first labelled button link in the card content (not the leave-site overlay)
  const cta = findCta(content, description);
  if (cta) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', cta.getAttribute('href'));
    a.textContent = linkText(cta);
    p.appendChild(a);
    frag.appendChild(p);
  } else if (!tile) {
    // Fallback: card-level href on the inner wrapper, labelled with the title
    const wrapper = item.querySelector('[href]');
    if (wrapper && title && clean(title.textContent)) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', wrapper.getAttribute('href'));
      a.textContent = clean(title.textContent);
      p.appendChild(a);
      frag.appendChild(p);
    }
  }
  return frag;
}

function variantsFor(items, tileOptions) {
  if (!tileOptions || !items.length || !items.every(isTileCard)) return [];
  const ctas = items.map((item) => {
    const content = item.querySelector('.cmp-vertical-card__content') || item;
    return findCta(content, content.querySelector('.cmp-vertical-card__description'));
  }).filter(Boolean);
  const arrow = ctas.length && ctas.every((a) => a.matches('.cmp-button--tertiary'));
  return arrow ? ['tile', 'cta-arrow'] : ['tile'];
}

export default function parse(element, { document, tileOptions = false }) {
  // Walk the grid in source order: headings/kickers and cards (direct or one sub-grid deep).
  const groups = [{ leading: [], items: [] }];
  [...element.children].forEach((child) => {
    if (child.matches('.verticalcard')) {
      groups[groups.length - 1].items.push(child);
    } else if (child.matches('.responsivegrid') && !element.querySelector(':scope > .verticalcard')) {
      child.querySelectorAll(':scope > .aem-Grid > .verticalcard').forEach((card) => {
        groups[groups.length - 1].items.push(card);
      });
    } else if (child.matches('.title')) {
      // a heading after cards starts a new group (block)
      if (groups[groups.length - 1].items.length) groups.push({ leading: [], items: [] });
      groups[groups.length - 1].leading.push(...leadingNodes(child, document));
    } else if (child.matches('.text')) {
      groups[groups.length - 1].leading.push(...leadingNodes(child, document));
    }
  });

  // Groups without cards (trailing kicker text) are appended to the previous group's output.
  const output = [];
  groups.forEach((group) => {
    output.push(...group.leading);
    if (!group.items.length) return;
    const tile = variantsFor(group.items, tileOptions).length > 0;
    const cells = group.items.map((item) => [buildCard(item, document, tile)]);
    const variants = variantsFor(group.items, tileOptions);
    output.push(WebImporter.Blocks.createBlock(document, { name: 'cards-links', variants, cells }));
  });

  if (!output.length) {
    element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'cards-links', cells: [] }));
    return;
  }
  element.replaceWith(...output);
}
