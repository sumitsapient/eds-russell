/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-image-overlay.
 * Source: russellinvestments.com (AEM Sites)
 * Shapes:
 *   (a) .heroimageheader — background image in inline style on section.cmp-hero-image-header,
 *       H1 + .cmp-hero-image-header__subheading (+ optional CTA)
 *   (b) .herovideoheader — <video> with mp4 <source> (+ optional poster), H1 + intro paragraph
 * Model (xwalk): image (reference) / video (aem-content) / text (richtext) — one row per field.
 */

const OVERLAY = '.cmp-leave-site-overlay';

function resolveUrl(document, path) {
  if (!path) return '';
  if (/^(https?:)?\/\//i.test(path) || /^(data|blob):/i.test(path)) return path;
  const canonical = document.querySelector('link[rel="canonical"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  const baseURI = document.baseURI || '';
  const base = (canonical && canonical.getAttribute('href'))
    || (ogUrl && ogUrl.getAttribute('content'))
    || (/^https?:/i.test(baseURI) ? baseURI : '');
  try {
    return base ? new URL(path, base).href : path;
  } catch (e) {
    return path;
  }
}

// Decode CSS escapes such as "\2f " (=> "/") used in inline background-image urls.
function unescapeCss(value) {
  return value
    .replace(/\\([0-9a-f]{1,6})\s?/gi, (m, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\(.)/g, '$1');
}

function getBackgroundImage(element) {
  const candidates = [element, ...element.querySelectorAll('[style*="background-image"]')];
  for (const el of candidates) {
    const fromProp = (el.style && el.style.backgroundImage) || '';
    const fromAttr = el.getAttribute('style') || '';
    for (const raw of [fromProp, fromAttr]) {
      const m = raw.match(/url\(\s*(['"]?)(.*?)\1\s*\)/i);
      if (m && m[2]) return unescapeCss(m[2]).trim();
    }
  }
  return '';
}

function linkText(a) {
  const clone = a.cloneNode(true);
  clone.querySelectorAll('.cmp-link__screen-reader-only, .cmp-button__arrow').forEach((n) => n.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const cells = [];

  // --- Background media ---
  const video = element.querySelector('video');
  let videoSrc = '';
  let posterSrc = '';
  if (video) {
    const source = video.querySelector('source[src]');
    videoSrc = video.getAttribute('src') || (source && source.getAttribute('src')) || '';
    posterSrc = video.getAttribute('poster') || '';
  }

  let imageSrc = posterSrc || getBackgroundImage(element);
  let imageAlt = '';
  if (!imageSrc) {
    const img = [...element.querySelectorAll('img')].find((i) => {
      const src = i.getAttribute('src') || '';
      return src && !src.startsWith('data:') && !i.closest(OVERLAY);
    });
    if (img) {
      imageSrc = img.getAttribute('src');
      imageAlt = img.getAttribute('alt') || '';
    }
  }

  // Row 1: image
  if (imageSrc) {
    const img = document.createElement('img');
    img.setAttribute('src', resolveUrl(document, imageSrc));
    img.setAttribute('alt', imageAlt);
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:image '));
    frag.appendChild(img);
    cells.push([frag]);
  } else {
    cells.push(['']);
  }

  // Row 2: video (as link)
  if (videoSrc) {
    const href = resolveUrl(document, videoSrc);
    const a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = href;
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:video '));
    frag.appendChild(a);
    cells.push([frag]);
  } else {
    cells.push(['']);
  }

  // Row 3: text (H1, intro paragraph, optional CTA)
  const textFrag = document.createDocumentFragment();
  const heading = element.querySelector('h1');
  const intro = element.querySelector('p[class*="__subheading"]')
    || [...element.querySelectorAll('p')].find((p) => !p.closest(OVERLAY) && p.textContent.trim());
  const ctas = [...element.querySelectorAll('a[href]')]
    .filter((a) => !a.closest(OVERLAY) && !(intro && intro.contains(a)) && linkText(a));

  const textNodes = [];
  if (heading && heading.textContent.trim()) {
    const h1 = document.createElement('h1');
    h1.textContent = heading.textContent.replace(/\s+/g, ' ').trim();
    textNodes.push(h1);
  }
  if (intro && intro.textContent.trim()) {
    const p = document.createElement('p');
    p.innerHTML = intro.innerHTML;
    textNodes.push(p);
  }
  ctas.forEach((cta) => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', cta.getAttribute('href'));
    a.textContent = linkText(cta);
    p.appendChild(a);
    textNodes.push(p);
  });

  if (textNodes.length) {
    textFrag.appendChild(document.createComment(' field:text '));
    textNodes.forEach((n) => textFrag.appendChild(n));
    cells.push([textFrag]);
  } else {
    cells.push(['']);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-image-overlay', cells });
  element.replaceWith(block);
}
