/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel-timeline.
 * Source: russellinvestments.com — .verticalcardcarousel with .cmp-vertical-card-carousel__card
 * slides (icon image, year pretitle, milestone h3, optional description). Prev/next buttons dropped.
 * Model (xwalk): container of carousel-timeline-item { image (reference), text (richtext) }.
 */

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const cells = [];

  element.querySelectorAll('.cmp-vertical-card-carousel__card').forEach((card) => {
    const img = card.querySelector('.cmp-vertical-card-carousel__card-img-container img');
    const year = card.querySelector('.cmp-vertical-card-carousel__card-pretitle');
    const title = card.querySelector('.cmp-vertical-card-carousel__card-title');
    const description = card.querySelector('.cmp-vertical-card-carousel__card-description');

    // Cell 1: icon image
    const imageFrag = document.createDocumentFragment();
    if (img && img.getAttribute('src')) {
      const image = document.createElement('img');
      image.setAttribute('src', img.getAttribute('src'));
      image.setAttribute('alt', img.getAttribute('alt') || '');
      imageFrag.appendChild(document.createComment(' field:image '));
      imageFrag.appendChild(image);
    }

    // Cell 2: year + milestone (+ description)
    const textFrag = document.createDocumentFragment();
    textFrag.appendChild(document.createComment(' field:text '));
    if (year && clean(year.textContent)) {
      const p = document.createElement('p');
      p.textContent = clean(year.textContent);
      textFrag.appendChild(p);
    }
    if (title && clean(title.textContent)) {
      const h3 = document.createElement('h3');
      h3.textContent = clean(title.textContent);
      textFrag.appendChild(h3);
    }
    if (description && clean(description.textContent)) {
      const p = document.createElement('p');
      p.innerHTML = description.innerHTML;
      textFrag.appendChild(p);
    }

    cells.push([imageFrag, textFrag]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-timeline', cells });
  element.replaceWith(block);
}
