/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-overlay.
 * Source: russellinvestments.com — layout container whose grid holds a full-background
 * .layoutcontainerimage (img.cmp-layout-container-image__image-full-background) plus a nested
 * container with the text panel (.title heading, .text paragraphs incl. bold-only sub-headings,
 * .button CTA). Matched as .responsivegrid:has(> .aem-Grid > .layoutcontainerimage).
 * Model (xwalk): columns block — one row, cells in source order (image | text). No field hints.
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

/** Drop leading/trailing <br> and blank text nodes (recursively into inline wrappers). */
function trimBreaks(el) {
  ['firstChild', 'lastChild'].forEach((edge) => {
    let node = el[edge];
    while (node) {
      if ((node.nodeType === 3 && !node.textContent.trim()) || (node.nodeType === 1 && node.tagName === 'BR')) {
        const next = edge === 'firstChild' ? node.nextSibling : node.previousSibling;
        node.remove();
        node = next;
      } else {
        if (node.nodeType === 1 && /^(B|STRONG|I|EM|SPAN)$/.test(node.tagName)) trimBreaks(node);
        break;
      }
    }
  });
}

function buildImageCell(element, document) {
  const img = [...element.querySelectorAll('.layoutcontainerimage img')]
    .find((i) => i.getAttribute('src') && !i.getAttribute('src').startsWith('data:'));
  if (!img) return [];
  const image = document.createElement('img');
  image.setAttribute('src', img.getAttribute('src'));
  image.setAttribute('alt', img.getAttribute('alt') || '');
  return [image];
}

function buildTextCell(element, document) {
  const nodes = [];
  const parts = element.querySelectorAll('.title, .text, .button');
  parts.forEach((part) => {
    if (part.closest('.layoutcontainerimage') || part.closest(OVERLAY)) return;
    if (part.matches('.title')) {
      const h = part.querySelector('h1, h2, h3, h4, h5, h6');
      if (h && clean(h.textContent)) {
        const heading = document.createElement(h.tagName.toLowerCase());
        heading.textContent = clean(h.textContent);
        nodes.push(heading);
      }
    } else if (part.matches('.text')) {
      part.querySelectorAll('.cmp-text > p, .cmp-text > ul, .cmp-text > ol, .cmp-text > h2, .cmp-text > h3, .cmp-text > h4').forEach((el) => {
        if (!clean(el.textContent)) return;
        trimBreaks(el);
        nodes.push(el);
      });
    } else if (part.matches('.button')) {
      const cta = [...part.querySelectorAll('a[href]')].find((a) => !a.closest(OVERLAY) && linkText(a));
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
  const imageCell = buildImageCell(element, document);
  const textCell = buildTextCell(element, document);
  const row = [];
  if (imageCell.length) row.push(imageCell);
  if (textCell.length) row.push(textCell);

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-overlay', cells: [row] });
  element.replaceWith(block);
}
