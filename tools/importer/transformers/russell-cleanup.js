/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Russell Investments cleanup.
 * Removes non-authorable chrome from russellinvestments.com (AEM Sites, aem-Grid / cmp-* markup).
 * All selectors come from captured DOM:
 *   migration-work/cleaned.html (About Us)
 *   migration-work/pages/individual-investor/cleaned.html
 *   migration-work/pages/insights/cleaned.html
 * Detection is purely DOM-based (no URL or page-specific logic).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Attributes used only for analytics / data layer / link-accessibility runtime
const TRACKING_ATTRS = [
  'data-cmp-data-layer-enabled',
  'data-cmp-data-layer-name',
  'data-cmp-data-layer',
  'data-cmp-link-accessibility-enabled',
  'data-cmp-link-accessibility-text',
  'data-cmp-clickable',
];

/*
 * PAGE DISCLOSURES
 * The source renders a disclosure area right after <footer>:
 *   div.footerdisclosures
 *     div.cmp-disclosure-cf > div.cmp-disclosure-cf__content > div.cmp-disclosure-cf__text > p ...
 *     div.cmp-footer-disclosures   (page code, e.g. "First Used: September 2025. CORP-12873")
 * Its paragraphs are page-specific risk text FOLLOWED BY 7 paragraphs that are identical on
 * every page. Those 7 common paragraphs are authored once in content/footer.plain.html
 * (see migration-work/footer-validation/disclosures-analysis.json), so they are dropped here
 * and identified by their known opening text (COMMON_DISCLOSURE_OPENINGS, matched against the
 * whitespace/quote-normalized paragraph text). Everything else is kept verbatim (bold, italic,
 * links) plus the page code line, normalized into a single div.footerdisclosures appended at the
 * end of the page, which page-templates.json maps to a final section with style "disclosures".
 * Pages without page-specific text keep only the page code line.
 */
const COMMON_DISCLOSURE_OPENINGS = [
  /^The information, analyses and opinions set forth herein are intended to serve as general information only/i,
  /^Products and services described on this website are intended for United States residents only/i,
  /^Russell Investments is committed to ensuring digital accessibility/i,
  /^Russell Investments' ownership is composed of/i,
  /^On [A-Z][a-z]+ \d{1,2}, \d{4}, Russell Investments Group, Ltd\. \("Russell Investments"\) entered into a definitive agreement/i,
  /^Frank Russell Company is the owner of the Russell trademarks/i,
  /^© Russell Investments Group, LLC\./i,
];

function normalizeText(text) {
  return (text || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function isCommonDisclosure(text) {
  const normalized = normalizeText(text);
  return COMMON_DISCLOSURE_OPENINGS.some((re) => re.test(normalized));
}

/** Rebuild a disclosure paragraph keeping only authorable inline markup (strong/em/a/br). */
function cleanInline(source, document) {
  const KEEP = { STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', A: 'a', BR: 'br', SUP: 'sup', SUB: 'sub' };
  const copy = (from, to) => {
    from.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        to.append(document.createTextNode(node.textContent.replace(/\s+/g, ' ')));
      } else if (node.nodeType === 1) {
        if (node.classList && node.classList.contains('cmp-link__screen-reader-only')) return;
        const tag = KEEP[node.tagName];
        if (tag) {
          const el = document.createElement(tag);
          if (tag === 'a' && node.getAttribute('href')) el.setAttribute('href', node.getAttribute('href'));
          copy(node, el);
          if (tag === 'br' || el.textContent.trim()) to.append(el);
        } else {
          copy(node, to); // unwrap spans / divs (e.g. Word "TextRun" spans)
        }
      }
    });
  };
  const target = document.createElement(source.tagName === 'P' ? 'p' : source.tagName.toLowerCase());
  copy(source, target);
  // trim leading/trailing whitespace text (JS \s also covers &nbsp; end-of-paragraph markers)
  const trimEdge = (el, first) => {
    let node = first ? el.firstChild : el.lastChild;
    while (node && node.nodeType === 3 && !node.textContent.trim()) {
      const next = first ? node.nextSibling : node.previousSibling;
      node.remove();
      node = next;
    }
    if (node && node.nodeType === 3) {
      node.textContent = first
        ? node.textContent.replace(/^\s+/, '')
        : node.textContent.replace(/\s+$/, '');
    } else if (node && node.nodeType === 1 && node.tagName !== 'A') {
      trimEdge(node, first);
    }
  };
  trimEdge(target, true);
  trimEdge(target, false);
  return target;
}

function extractPageDisclosures(element, document) {
  const roots = [...element.querySelectorAll('.footerdisclosures')];
  element.querySelectorAll('.cmp-disclosure-cf, .cmp-footer-disclosures').forEach((el) => {
    if (!el.closest('.footerdisclosures')) roots.push(el);
  });
  if (!roots.length) return;

  const paragraphs = [];
  const codes = [];
  roots.forEach((root) => {
    const blocks = [...root.querySelectorAll('.cmp-disclosure-cf__text p, .cmp-disclosure-cf__text ul, .cmp-disclosure-cf__text ol')]
      .filter((el) => !el.parentElement.closest('p, ul, ol'));
    blocks.forEach((el) => {
      if (!normalizeText(el.textContent) || isCommonDisclosure(el.textContent)) return;
      paragraphs.push(cleanInline(el, document));
    });
    const codeEls = root.matches('.cmp-footer-disclosures') ? [root] : [...root.querySelectorAll('.cmp-footer-disclosures')];
    codeEls.forEach((el) => {
      const text = normalizeText(el.textContent);
      if (text) codes.push(text);
    });
  });
  roots.forEach((root) => root.remove());

  if (!paragraphs.length && !codes.length) return;
  const container = document.createElement('div');
  container.className = 'footerdisclosures';
  container.append(...paragraphs);
  codes.forEach((code) => {
    const p = document.createElement('p');
    p.textContent = code;
    container.append(p);
  });
  element.append(container); // always the last content on the page
}

/*
 * JUMP-LINK TARGETS (anchor-tab bar, section style "jump-links")
 * Links keep their source href (#funds, #why ...); the runtime (decorateJumpLinks in scripts.js)
 * re-points them by matching the link label to a heading. Two DOM-driven fixes help it:
 *  - a target that is a styled text paragraph acting as a title (single short <p>, no heading,
 *    e.g. div#invest.cmp-text > p "Start investing today") becomes an <h2>;
 *  - when the label does NOT match the target heading's text (e.g. "Our Funds" -> #funds whose
 *    heading is "Looking for Growth?"), the href is rewritten to the heading's generated id
 *    (slug of its text), which EDS assigns to headings. Matching labels keep the source href.
 * Targets without any heading (embeds, disclaimers) are left alone.
 */
function slugify(text) {
  return normalizeText(text).toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

function prepareJumpLinks(element, document) {
  const links = [...element.querySelectorAll('.anchortab a[href^="#"]')];
  if (!links.length) return;
  const byId = new Map();
  element.querySelectorAll('[id]').forEach((el) => { if (!byId.has(el.id)) byId.set(el.id, el); });
  const HEADING = 'h1, h2, h3, h4, h5, h6';

  links.forEach((a) => {
    let id = a.getAttribute('href').slice(1);
    try { id = decodeURIComponent(id); } catch (e) { /* keep raw */ }
    const target = id && byId.get(id);
    if (!target || target.closest('.anchortab')) return;

    let heading = target.matches(HEADING) ? target : target.querySelector(HEADING);
    if (!heading && target.matches('.cmp-text')) {
      const paras = [...target.children].filter((c) => normalizeText(c.textContent));
      const text = paras.length === 1 && paras[0].tagName === 'P' ? normalizeText(paras[0].textContent) : '';
      if (text && text.length <= 80 && !paras[0].querySelector('a, img')) {
        heading = document.createElement('h2');
        heading.textContent = text;
        paras[0].replaceWith(heading);
      }
    }
    if (!heading) return;

    const label = normalizeText(a.textContent).toLowerCase();
    const headingText = normalizeText(heading.textContent).toLowerCase();
    if (!label || headingText === label || headingText.startsWith(label)) return;
    const slug = slugify(heading.textContent);
    if (slug) a.setAttribute('href', `#${slug}`);
  });
}

/*
 * DEFAULT-CONTENT BUTTONS
 * Stand-alone AEM Button components (.button > .cmp-ri-btn-wrapper > a.cmp-button--*) left in
 * default content after block parsing become authorable EDS buttons:
 * primary (filled pill) -> <p><strong><a></a></strong></p>, secondary (outline) -> <p><em><a></a></em></p>,
 * other variants -> plain link paragraph.
 */
function convertDefaultButtons(element, document) {
  element.querySelectorAll('.button').forEach((wrapper) => {
    if (!wrapper.isConnected || wrapper.closest('table')) return;
    const a = [...wrapper.querySelectorAll('a[href]')].find((link) => normalizeText(link.textContent));
    if (!a) return;
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href'));
    link.textContent = normalizeText(a.textContent);
    const p = document.createElement('p');
    const cls = a.getAttribute('class') || '';
    if (/cmp-button--primary/.test(cls)) {
      const strong = document.createElement('strong');
      strong.append(link);
      p.append(strong);
    } else if (/cmp-button--secondary/.test(cls)) {
      const em = document.createElement('em');
      em.append(link);
      p.append(em);
    } else {
      p.append(link);
    }
    wrapper.replaceWith(p);
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    const document = (payload && payload.document) || element.ownerDocument;

    // 0. Page-specific disclosures (below the source footer) -> normalized div.footerdisclosures
    //    at the end of the page; the 7 site-wide paragraphs are dropped (they live in the footer).
    extractPageDisclosures(element, document);

    // 1. Site chrome: header XF (mega nav, persona/attestation bar), footer XF.
    WebImporter.DOMUtils.remove(element, [
      'header.experiencefragment',
      '.cmp-experiencefragment--header',
      'header',
      'footer.experiencefragment',
      '.cmp-experiencefragment--footer',
      'footer',
    ]);

    // 2. Cookie consent (OneTrust) and leave-site interstitial modals.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '#onetrust-banner-sdk',
      '#onetrust-pc-sdk',
      '.onetrust-pc-dark-filter',
      '.cmp-leave-site-overlay',
    ]);

    // 3. Layout spacers.
    WebImporter.DOMUtils.remove(element, ['.ghost']);

    // 4. Embeds: drop containers that only hold the cookie-consent placeholder
    //    (no iframe); for real embeds (e.g. Ceros iframe) drop just the consent banner.
    element.querySelectorAll('.embed').forEach((embed) => {
      if (!embed.querySelector('iframe')) {
        embed.remove();
      } else {
        embed.querySelectorAll('.cmp-embed__consent-banner').forEach((b) => b.remove());
      }
    });

    // Tracking / ID-sync iframes outside of authored embeds (e.g. demdex destination publishing).
    element.querySelectorAll('iframe').forEach((iframe) => {
      if (!iframe.closest('.embed')) iframe.remove();
    });

    // 5. Decorative graphics: double-arrow / triple-line hero icons, circle SVG templates,
    //    button arrow glyphs, carousel prev/next arrow buttons, inline SVGs.
    WebImporter.DOMUtils.remove(element, [
      '.cmp-hero-image-header__icon-wrapper',
      '.cmp-hero-video-header__double-arrow-wrapper',
      '.svgtemplates',
      '[class*="cmp-svg-templates"]',
      '.cmp-button__arrow',
      '.russell-btn-arrow',
      '.arrows:has(> button.arrow)',
      'svg',
    ]);
    // Background graphics of "bg-graphic" layout containers (cmp-layout-container--bg-graphic-top-right /
    // -bottom-right ...): the "momentum lines" artwork is authored as a full-width Image component placed
    // DIRECTLY in the container's own grid (container > .aem-Grid > .image) and positioned behind the
    // content by source CSS. Real content images always sit inside nested components (cards, columns...),
    // so only that direct grid child is removed.
    element.querySelectorAll('[class*="cmp-layout-container--bg-graphic"] > .aem-Grid > .image').forEach((img) => img.remove());
    // Any remaining data-URI SVG icons are decorative (no authored image uses data URIs).
    element.querySelectorAll('img[src^="data:image/svg"]').forEach((img) => img.remove());

    // 6. Screen-reader-only "opens in a new tab" helper text injected into links.
    WebImporter.DOMUtils.remove(element, ['.cmp-link__screen-reader-only']);

    // 7. Scripts, styles and other non-content nodes.
    WebImporter.DOMUtils.remove(element, ['script', 'style', 'noscript', 'link']);

    // 8. Jump-link targets (see prepareJumpLinks).
    prepareJumpLinks(element, document);
  }

  if (hookName === TransformHook.afterTransform) {
    // Stand-alone button components left in default content -> EDS buttons.
    convertDefaultButtons(element, (payload && payload.document) || element.ownerDocument);

    // Strip analytics / data-layer attributes (body + descendants).
    const nodes = [element, ...element.querySelectorAll('*')];
    nodes.forEach((el) => {
      TRACKING_ATTRS.forEach((attr) => {
        if (el.hasAttribute && el.hasAttribute(attr)) el.removeAttribute(attr);
      });
    });

    // Final safety net: chrome that may have been re-exposed after parsing.
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
      '.cmp-leave-site-overlay',
      '.cmp-link__screen-reader-only',
      'script',
      'style',
      'noscript',
    ]);
  }
}
