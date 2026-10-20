/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-stats.
 * Source: russellinvestments.com — .aem-Grid containing a .title heading and .datadisplay tiles.
 * The section heading (.title / .text) stays outside the block as default content before it.
 * Model (xwalk): container of cards-stats-item { text (richtext) } — one row per tile.
 */

// Section heading / kicker siblings of the items become default content before the block.
function extractLeadingContent(element, document, isItem) {
  const nodes = [];
  [...element.children].forEach((child) => {
    if (isItem(child)) return;
    if (child.matches('.title')) {
      const h = child.querySelector('h1, h2, h3, h4, h5, h6');
      if (h && h.textContent.trim()) {
        const heading = document.createElement(h.tagName.toLowerCase());
        heading.textContent = h.textContent.replace(/\s+/g, ' ').trim();
        nodes.push(heading);
      }
    } else if (child.matches('.text')) {
      child.querySelectorAll('.cmp-text > *').forEach((el) => {
        if (el.textContent.trim()) nodes.push(el);
      });
    }
  });
  return nodes;
}

export default function parse(element, { document }) {
  const isItem = (el) => el.matches('.datadisplay');
  const leading = extractLeadingContent(element, document, isItem);

  const cells = [];
  element.querySelectorAll(':scope > .datadisplay').forEach((item) => {
    const value = item.querySelector('.cmp-data-display__value');
    const label = item.querySelector('.cmp-data-display__label');
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:text '));
    if (value && value.textContent.trim()) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = value.textContent.replace(/\s+/g, ' ').trim();
      p.appendChild(strong);
      frag.appendChild(p);
    }
    if (label && label.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = label.textContent.replace(/\s+/g, ' ').trim();
      frag.appendChild(p);
    }
    cells.push([frag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-stats', cells });
  if (leading.length) element.before(...leading);
  element.replaceWith(block);
}
