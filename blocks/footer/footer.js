/*
 * Footer block
 * Reads every label, link and image from the footer fragment (footer.plain.html)
 * and arranges it into:
 *   main band  -> dark panel (brand/contact column + link columns) + accent bar
 *   notice band -> plain-text legal notices below the main band
 * Sections are classified by their content, never by position or copy.
 */

/**
 * Fetches the footer fragment (metadata independent):
 * /content/footer.plain.html (local preview) first, then /footer.plain.html (DA/EDS).
 * Relative media paths are resolved against the folder the fragment came from.
 * @returns {Promise<Element[]>} top-level section elements
 */
async function fetchFooterSections() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return [];

  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const base = new URL('./', resp.url || window.location.href);

  doc.querySelectorAll('img[src]').forEach((img) => {
    img.setAttribute('src', new URL(img.getAttribute('src'), base).href);
  });
  doc.querySelectorAll('source[srcset]').forEach((source) => {
    const srcset = source.getAttribute('srcset').split(',').map((candidate) => {
      const [url, ...descriptor] = candidate.trim().split(/\s+/);
      return [new URL(url, base).href, ...descriptor].join(' ');
    });
    source.setAttribute('srcset', srcset.join(', '));
  });

  return [...doc.body.children]
    .filter((el) => el.tagName === 'DIV')
    .map((el) => document.adoptNode(el));
}

/**
 * Classifies a fragment section by the kind of content it holds.
 * @param {Element} section
 * @returns {'links'|'brand'|'notice'}
 */
function getSectionKind(section) {
  if (section.querySelector('ul, ol')) return 'links';
  if (section.querySelector('img, h1, h2, h3, h4, h5, h6')) return 'brand';
  return 'notice';
}

/** True when every element child of the paragraph is a link wrapping an image. */
const isIconLinkRow = (p) => p.children.length > 0
  && [...p.children].every((child) => child.tagName === 'A' && child.querySelector('img'));

/** True when the paragraph only holds a standalone (unlinked) image. */
const isStandaloneImage = (p) => p.children.length === 1
  && (p.firstElementChild.tagName === 'IMG' || p.firstElementChild.tagName === 'PICTURE')
  && !p.textContent.trim();

/**
 * Decorates a brand/contact column: logo, headings, address lines and icon links.
 * @param {Element} section
 */
function decorateBrandColumn(section) {
  section.className = 'footer-brand';
  section.querySelectorAll(':scope > p').forEach((p) => {
    if (isStandaloneImage(p)) {
      p.classList.add('footer-logo');
    } else if (isIconLinkRow(p)) {
      p.classList.add('footer-social');
      // drop whitespace text nodes so the icons sit at a fixed gap
      [...p.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) node.remove();
      });
      p.querySelectorAll('a').forEach((a) => a.classList.add('footer-social-link'));
    } else {
      p.classList.add('footer-text');
    }
  });
  section.querySelectorAll('img').forEach((img) => {
    img.loading = 'lazy';
  });
}

/**
 * Decorates a link column: heading + one or more link lists.
 * @param {Element} section
 */
function decorateLinkColumn(section) {
  section.className = 'footer-links';
  section.querySelectorAll(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6')
    .forEach((heading) => heading.classList.add('footer-links-heading'));
  section.querySelectorAll(':scope > ul, :scope > ol')
    .forEach((list) => list.classList.add('footer-links-list'));
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const sections = await fetchFooterSections();
  block.textContent = '';
  if (!sections.length) return;

  const main = document.createElement('div');
  main.className = 'footer-main';
  const panel = document.createElement('div');
  panel.className = 'footer-panel';
  const separator = document.createElement('div');
  separator.className = 'footer-separator';
  separator.setAttribute('aria-hidden', 'true');
  main.append(panel, separator);

  const notices = [];
  sections.forEach((section) => {
    const kind = getSectionKind(section);
    if (kind === 'links') {
      decorateLinkColumn(section);
      panel.append(section);
    } else if (kind === 'brand') {
      decorateBrandColumn(section);
      panel.append(section);
    } else {
      section.className = 'footer-disclosures';
      notices.push(section);
    }
  });

  block.append(main, ...notices);
}
