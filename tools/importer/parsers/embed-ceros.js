/* eslint-disable */
/* global WebImporter */

/**
 * Parser for embed-ceros.
 * Source: russellinvestments.com — .embed containing a Ceros iframe plus a cookie-consent
 * placeholder (image, copy, button). Only the iframe URL is kept, as a link.
 * Handles both Ceros Studio experiences (iframe src *.ceros.site/...?embed=true...) and classic
 * experiences (div#experience-* > iframe.ceros-experience src view.ceros.com/<account>/<slug>);
 * the URL is taken from src, falling back to data-src (lazy iframes), and made absolute.
 * Model (xwalk): embed_placeholder (reference) + embed_uri (aem-content) share one cell.
 */

const CEROS_HOST = /(^|\.)ceros\.(site|com)$/i;

function iframeUrl(iframe, base) {
  const raw = iframe.getAttribute('src') || iframe.getAttribute('data-src') || '';
  if (!raw || raw.startsWith('about:')) return '';
  try {
    return new URL(raw, base).href;
  } catch (e) {
    return raw;
  }
}

function isCeros(href) {
  try {
    return CEROS_HOST.test(new URL(href).hostname);
  } catch (e) {
    return /ceros/i.test(href);
  }
}

export default function parse(element, { document, params }) {
  const base = (params && params.originalURL) || 'https://russellinvestments.com/';
  const urls = [...element.querySelectorAll('iframe')].map((f) => iframeUrl(f, base)).filter(Boolean);
  const src = urls.find(isCeros) || urls[0] || '';

  const cells = [];
  if (src) {
    const frag = document.createDocumentFragment();
    const a = document.createElement('a');
    a.setAttribute('href', src);
    a.textContent = src;
    frag.appendChild(document.createComment(' field:embed_uri '));
    frag.appendChild(a);
    cells.push([frag]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'embed-ceros', cells });
  element.replaceWith(block);
}
