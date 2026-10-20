/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-media.
 * Source: russellinvestments.com — .aem-Grid with a .title heading and two .responsivegrid
 * columns: a text column (bold .text subheadings, .text paragraphs, .button CTA) and an
 * .image column. The section heading stays outside the block as default content before it.
 * Model (xwalk): columns block — one row, one cell per source column, document order.
 * Columns blocks carry no field hints.
 */

const OVERLAY = '.cmp-leave-site-overlay';

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function linkText(a) {
  const clone = a.cloneNode(true);
  clone.querySelectorAll('.cmp-link__screen-reader-only, .cmp-button__arrow').forEach((n) => n.remove());
  return clean(clone.textContent);
}

function extractLeadingContent(element, document, isItem) {
  const nodes = [];
  [...element.children].forEach((child) => {
    if (isItem(child)) return;
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
  });
  return nodes;
}

function buildImageCell(column, document) {
  const nodes = [];
  column.querySelectorAll('.cmp-image img').forEach((img) => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) return;
    const image = document.createElement('img');
    image.setAttribute('src', src);
    image.setAttribute('alt', img.getAttribute('alt') || '');
    nodes.push(image);
  });
  return nodes;
}

function buildTextCell(column, document) {
  const nodes = [];
  // Walk the column's components in document order
  column.querySelectorAll('.text, .title, .button').forEach((comp) => {
    if (comp.closest(OVERLAY)) return;
    if (comp.matches('.title')) {
      const h = comp.querySelector('h1, h2, h3, h4, h5, h6');
      if (h && clean(h.textContent)) {
        const heading = document.createElement('h3');
        heading.textContent = clean(h.textContent);
        nodes.push(heading);
      }
    } else if (comp.matches('.text')) {
      const isSubheading = comp.matches('.cmp-text--bold');
      comp.querySelectorAll('.cmp-text > *').forEach((el) => {
        if (!clean(el.textContent)) return;
        if (isSubheading) {
          const h3 = document.createElement('h3');
          h3.textContent = clean(el.textContent);
          nodes.push(h3);
        } else {
          nodes.push(el);
        }
      });
    } else if (comp.matches('.button')) {
      const cta = [...comp.querySelectorAll('a[href]')].find((a) => !a.closest(OVERLAY) && linkText(a));
      if (cta) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.setAttribute('href', cta.getAttribute('href'));
        a.textContent = linkText(cta);
        p.appendChild(a);
        nodes.push(p);
      }
    }
  });
  return nodes;
}

export default function parse(element, { document }) {
  const isItem = (el) => el.matches('.responsivegrid');
  const leading = extractLeadingContent(element, document, isItem);

  const row = [];
  element.querySelectorAll(':scope > .responsivegrid').forEach((column) => {
    const hasText = column.querySelector('.text, .button, .title');
    const nodes = hasText ? buildTextCell(column, document) : buildImageCell(column, document);
    if (nodes.length) row.push(nodes);
  });

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  if (leading.length) element.before(...leading);
  element.replaceWith(block);
}
