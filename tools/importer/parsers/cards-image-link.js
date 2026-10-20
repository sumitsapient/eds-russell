/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-image-link.
 * Source: russellinvestments.com — .aem-Grid of .verticalcard items whose whole card is
 * a.cmp-vertical-card__link (image, pretitle, title, description).
 * Any section heading (.title / .text) stays outside the block as default content before it.
 * Model (xwalk): container of cards-image-link-item { image (reference), text (richtext) }.
 * The card link is rebuilt on the title (first link in the text cell = card link).
 */

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
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

export default function parse(element, { document }) {
  const isItem = (el) => el.matches('.verticalcard');
  const leading = extractLeadingContent(element, document, isItem);

  const cells = [];
  element.querySelectorAll(':scope > .verticalcard').forEach((item) => {
    const link = item.querySelector('a.cmp-vertical-card__link');
    const href = link ? link.getAttribute('href') : '';
    const img = item.querySelector('.cmp-vertical-card__img-container img, img:not([src^="data:"])');
    const pretitle = item.querySelector('.cmp-vertical-card__pretitle');
    const title = item.querySelector('.cmp-vertical-card__title');
    const description = item.querySelector('.cmp-vertical-card__description');

    // Cell 1: image
    const imageFrag = document.createDocumentFragment();
    if (img) {
      const image = document.createElement('img');
      image.setAttribute('src', img.getAttribute('src'));
      image.setAttribute('alt', img.getAttribute('alt') || '');
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(image);
    }

    // Cell 2: pretitle, linked title, description
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    if (pretitle && clean(pretitle.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(pretitle.textContent);
      textFrag.appendChild(p);
    }
    if (title && clean(title.textContent)) {
      const h3 = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        a.textContent = clean(title.textContent);
        h3.appendChild(a);
      } else {
        h3.textContent = clean(title.textContent);
      }
      textFrag.appendChild(h3);
    }
    if (description) {
      description.querySelectorAll('p').forEach((p) => {
        if (clean(p.textContent)) {
          const para = document.createElement('p');
          para.textContent = clean(p.textContent);
          textFrag.appendChild(para);
        }
      });
    }

    cells.push([imageFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-image-link', cells });
  if (leading.length) element.before(...leading);
  element.replaceWith(block);
}
