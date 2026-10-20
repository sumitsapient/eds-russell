/* eslint-disable */
/* global WebImporter */

/**
 * Parser for tabs-article-cards.
 * Source: russellinvestments.com — .recentArticles. Tab toggles (.cmp-recent-articles__article-toggle
 * spans, e.g. Insights / Research) each key a panel (by id, or a class equal to the tab key) plus
 * an eyebrow (.subtitle.<key>) and an "All …" button (.cmp-recent-articles__russell-btn.<key>).
 * Hidden panels (e.g. Research) are included.
 * Cards: .cmp-recent-articles__card (image, h3, h4, description, CTA) or
 *        .cmp-related-articles__article-card inside a link (image, date, h3, author avatar/name/role).
 * The shared section heading (.cmp-recent-articles__heading h2) is placed BEFORE the block as
 * default content (first non-empty heading only).
 *
 * Model (xwalk): container of tabs-article-cards-item, ONE CARD PER ROW, cells in model order:
 *   tab (text) | eyebrow (text) | image (reference + imageAlt) | text (richtext, no images)
 *   | authorImage (reference + authorImageAlt) | author (richtext, no images) | footer (richtext)
 * eyebrow and footer are written on the first card of each tab only (first non-empty wins).
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

function para(document, text) {
  const p = document.createElement('p');
  p.textContent = text;
  return p;
}

function linkPara(document, href, text) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.setAttribute('href', href);
  a.textContent = text;
  p.appendChild(a);
  return p;
}

function heading(document, tag, text, href) {
  const h = document.createElement(tag);
  if (href) {
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = text;
    h.appendChild(a);
  } else {
    h.textContent = text;
  }
  return h;
}

function usableSrc(img) {
  const src = img && img.getAttribute('src');
  return src && !src.startsWith('data:') ? src : '';
}

// Hinted cell helpers — empty cells stay empty (no hint)
function textCell(document, field, value) {
  if (!value) return '';
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  frag.appendChild(document.createTextNode(value));
  return frag;
}

function imageCell(document, field, img, fallbackAlt) {
  const src = usableSrc(img);
  if (!src) return '';
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  const image = document.createElement('img');
  image.setAttribute('src', src);
  image.setAttribute('alt', clean(img.getAttribute('alt')) || fallbackAlt || '');
  frag.appendChild(image);
  return frag;
}

function richCell(document, field, nodes) {
  if (!nodes.length) return '';
  const frag = document.createDocumentFragment();
  frag.appendChild(document.createComment(` field:${field} `));
  nodes.forEach((n) => frag.appendChild(n));
  return frag;
}

// Insights-style card: image, h3, h4, description, CTA button
function readRecentCard(card, document) {
  const textNodes = [];
  const container = card.querySelector('.cmp-recent-articles__card-content-container')
    || card.querySelector('.cmp-recent-articles__card-content') || card;
  [...container.children].forEach((el) => {
    if (el.closest(OVERLAY)) return;
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      if (clean(el.textContent)) textNodes.push(heading(document, tag, clean(el.textContent)));
    } else if (tag === 'a') {
      const text = linkText(el);
      if (text && el.getAttribute('href')) textNodes.push(linkPara(document, el.getAttribute('href'), text));
    } else if (tag === 'p') {
      if (clean(el.textContent)) textNodes.push(para(document, clean(el.textContent)));
    }
  });
  return {
    img: card.querySelector('.cmp-recent-articles__card-image, img:not([src^="data:"])'),
    textNodes,
    authorImg: null,
    authorNodes: [],
  };
}

// Research-style card: whole card is a link; image, date, h3 (linked), author avatar + name + role
function readRelatedCard(card, document) {
  const link = card.closest('a[href]');
  const href = link ? link.getAttribute('href') : '';
  const textNodes = [];
  const date = card.querySelector('.cmp-related-articles__date');
  const readTime = card.querySelector('.cmp-related-articles__read-time');
  const meta = [date, readTime].map((n) => clean(n && n.textContent)).filter(Boolean).join(' | ');
  if (meta) textNodes.push(para(document, meta));
  const title = card.querySelector('.cmp-related-articles__article-title, h3');
  if (title && clean(title.textContent)) {
    textNodes.push(heading(document, 'h3', clean(title.textContent), href));
  }
  const author = card.querySelector('.cmp-related-articles__author-info');
  const authorNodes = [];
  if (author) {
    author.querySelectorAll('.cmp-related-articles__name-and-role p').forEach((p) => {
      if (clean(p.textContent)) authorNodes.push(para(document, clean(p.textContent)));
    });
  }
  return {
    img: card.querySelector('.cmp-related-articles__img-container img, .cmp-related-articles__teaser-img'),
    textNodes,
    authorImg: author ? author.querySelector('img') : null,
    authorNodes,
  };
}

// Locate an element tagged with the tab key class (e.g. "insights") matching a selector
function findKeyed(element, key, selector) {
  return [...element.querySelectorAll(selector)].find((el) => el.classList.contains(key)) || null;
}

export default function parse(element, { document }) {
  const toggles = [...element.querySelectorAll('.cmp-recent-articles__article-toggle > span, .cmp-recent-articles__article-toggle > button')];
  const cells = [];

  // Shared section heading -> default content before the block
  const sharedHeading = [...element.querySelectorAll('.cmp-recent-articles__heading h1, .cmp-recent-articles__heading h2, .cmp-recent-articles__heading h3')]
    .find((h) => clean(h.textContent));
  const leading = sharedHeading
    ? heading(document, sharedHeading.tagName.toLowerCase(), clean(sharedHeading.textContent))
    : null;

  toggles.forEach((toggle) => {
    const label = clean(toggle.textContent);
    if (!label) return;
    const idKey = (toggle.id || '').replace(/Btn$/i, '');
    const key = (idKey || label).toLowerCase();

    const panel = element.querySelector(`[id="${idKey || key}"]`)
      || element.querySelector(`[class*="articles__${key}"]`);
    if (!panel) return;
    const eyebrowEl = findKeyed(element, key, '.cmp-recent-articles__top-row .subtitle');
    const eyebrow = eyebrowEl ? clean(eyebrowEl.textContent) : '';
    const allBtn = findKeyed(element, key, '.cmp-recent-articles__russell-btn');
    const allLink = allBtn ? [...allBtn.querySelectorAll('a[href]')].find((l) => linkText(l)) : null;

    const cards = [...panel.querySelectorAll('.cmp-recent-articles__card, .cmp-related-articles__article-card')];
    cards.forEach((card, i) => {
      const data = card.matches('.cmp-related-articles__article-card')
        ? readRelatedCard(card, document)
        : readRecentCard(card, document);
      const first = i === 0;
      const authorName = data.authorNodes.length ? clean(data.authorNodes[0].textContent) : '';
      const footerNodes = first && allLink
        ? [linkPara(document, allLink.getAttribute('href'), linkText(allLink))]
        : [];

      cells.push([
        textCell(document, 'tab', label),
        textCell(document, 'eyebrow', first ? eyebrow : ''),
        imageCell(document, 'image', data.img, ''),
        richCell(document, 'text', data.textNodes),
        imageCell(document, 'authorImage', data.authorImg, authorName),
        richCell(document, 'author', data.authorNodes),
        richCell(document, 'footer', footerNodes),
      ]);
    });
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-article-cards', cells });
  if (leading) element.before(leading);
  element.replaceWith(block);
}
