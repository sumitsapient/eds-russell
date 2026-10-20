/* eslint-disable */
/* global WebImporter */

import alertBannerParser from './parsers/alert-banner.js';
import embedCerosParser from './parsers/embed-ceros.js';
import cardsLinksParser from './parsers/cards-links.js';
import columnsOverlayParser from './parsers/columns-overlay.js';
import columnsPromoPanelParser from './parsers/columns-promo-panel.js';
import accordionFaqParser from './parsers/accordion-faq.js';
import russellCleanupTransformer from './transformers/russell-cleanup.js';
import russellSectionsTransformer from './transformers/russell-sections.js';

const PAGE_TEMPLATE = {
  "name": "detail-page",
  "urls": [
    "https://russellinvestments.com/content/ri/us/en/about-us/contact-us.html",
    "https://russellinvestments.com/content/ri/us/en/individual-investor/investments/models-and-products/exchange-traded-funds.html"
  ],
  "representativeUrl": "https://russellinvestments.com/content/ri/us/en/about-us/contact-us.html",
  "description": "Detail pages (Contact Us, ETF product page): page title, tile card grids, alert banner, Ceros embeds, overlay/promo columns, FAQ accordion, page disclosures",
  "blocks": [
    {
      "name": "alert-banner",
      "instances": [
        ".alertbanner"
      ]
    },
    {
      "name": "embed-ceros",
      "instances": [
        ".embed:has(iframe[src*=\"ceros\"])"
      ]
    },
    {
      "name": "cards-links",
      "instances": [
        ".cmp-layout-container--white-bg > .aem-Grid:not(:has(> .verticalcard)):not(:has(> .responsivegrid > .aem-Grid > .title)):has(> .responsivegrid > .aem-Grid > .verticalcard)",
        ".aem-Grid:has(> .verticalcard):not(:has(a.cmp-vertical-card__link))"
      ]
    },
    {
      "name": "columns-overlay",
      "instances": [
        ".responsivegrid:has(> .aem-Grid > .layoutcontainerimage)"
      ]
    },
    {
      "name": "columns-promo-panel",
      "instances": [
        ".verticalcardimageright"
      ]
    },
    {
      "name": "accordion-faq",
      "instances": [
        ".faqCFDisplay"
      ]
    }
  ],
  "urlPattern": "/content/ri/us/en/*",
  "sections": [
    {
      "id": "section-1",
      "name": "Page title",
      "selector": [
        ".title:has(h1)"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "h1.cmp-title__text",
        ".text.cmp-text--bold p"
      ]
    },
    {
      "id": "section-2",
      "name": "Contact choices (tile grid)",
      "selector": [
        ".cmp-layout-container--white-bg:has(.verticalcard):not(:has(.cmp-button--tertiary))"
      ],
      "style": null,
      "blocks": [
        "cards-links"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "US office locations",
      "selector": [
        ".cmp-layout-container--blue-bg:has(.verticalcard)"
      ],
      "style": "light-blue",
      "blocks": [
        "cards-links"
      ],
      "defaultContent": [
        "h2.cmp-title__text"
      ]
    },
    {
      "id": "etf-section-1",
      "name": "US-only audience alert",
      "selector": [
        ".alertbanner"
      ],
      "style": null,
      "blocks": [
        "alert-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "etf-section-2",
      "name": "ETF hero banner (Ceros embed)",
      "selector": [
        ".embed:has(iframe[src*=\"ceros\"])"
      ],
      "style": "full-width",
      "blocks": [
        "embed-ceros"
      ],
      "defaultContent": []
    },
    {
      "id": "etf-section-3",
      "name": "Jump links",
      "selector": [
        ".anchortab"
      ],
      "style": "light, jump-links",
      "blocks": [],
      "defaultContent": [
        "a.cmp-anchor-tab__tab"
      ]
    },
    {
      "id": "etf-section-4",
      "name": "Our funds (fund tile groups)",
      "selector": [
        ".cmp-layout-container--white-bg:has(.verticalcard .cmp-button--tertiary)"
      ],
      "style": null,
      "blocks": [
        "cards-links"
      ],
      "defaultContent": [
        "h3.cmp-title__text"
      ]
    },
    {
      "id": "etf-section-5",
      "name": "Why our ETFs",
      "selector": [
        ".responsivegrid:has(> .aem-Grid > .layoutcontainerimage)"
      ],
      "style": null,
      "blocks": [
        "columns-overlay"
      ],
      "defaultContent": []
    },
    {
      "id": "etf-section-6",
      "name": "Active vs passive comparison (Ceros)",
      "selector": [
        ".embed:has(iframe[src*=\"ceros\"])"
      ],
      "style": "full-width",
      "blocks": [
        "embed-ceros"
      ],
      "defaultContent": []
    },
    {
      "id": "etf-section-7",
      "name": "Build a portfolio",
      "selector": [
        ".cmp-layout-container--white-bg:has(.embed iframe[src*=\"ceros\"])"
      ],
      "style": "lead",
      "blocks": [
        "embed-ceros"
      ],
      "defaultContent": [
        "h2.cmp-title__text",
        ".cmp-text p"
      ]
    },
    {
      "id": "etf-section-8",
      "name": "Start investing today",
      "selector": [
        ".cmp-layout-container--blue-bg:has(.button):not(:has(.verticalcard))"
      ],
      "style": "light-blue, lead, stack",
      "blocks": [],
      "defaultContent": [
        ".cmp-text p",
        ".button a"
      ]
    },
    {
      "id": "etf-section-9",
      "name": "Ask your financial advisor",
      "selector": [
        ".verticalcardimageright"
      ],
      "style": "full-width",
      "blocks": [
        "columns-promo-panel"
      ],
      "defaultContent": []
    },
    {
      "id": "etf-section-10",
      "name": "FAQs",
      "selector": [
        ".cmp-layout-container--white-bg:has(.faqCFDisplay)"
      ],
      "style": null,
      "blocks": [
        "accordion-faq"
      ],
      "defaultContent": [
        "h3.cmp-faq-cf-display__title"
      ]
    },
    {
      "id": "disclosures",
      "name": "Page disclosures",
      "selector": [
        ".footerdisclosures",
        ".cmp-disclosure-cf",
        ".cmp-footer-disclosures"
      ],
      "style": "disclosures",
      "blocks": [],
      "defaultContent": [
        "p"
      ]
    }
  ]
};

const parsers = {
  'alert-banner': alertBannerParser,
  'embed-ceros': embedCerosParser,
  'cards-links': cardsLinksParser,
  'columns-overlay': columnsOverlayParser,
  'columns-promo-panel': columnsPromoPanelParser,
  'accordion-faq': accordionFaqParser,
};

// Per-template parser options: detail pages emit the cards-links `tile` / `tile, cta-arrow`
// options (detected from the card DOM by the parser).
const PARSER_OPTIONS = {
  'cards-links': { tileOptions: true },
};

// Only the Russell transformers apply to this template (the wknd-* ones belong to the WKND import)
const transformers = [russellCleanupTransformer, russellSectionsTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

/**
 * Re-creates an element under a new tag name (keeps attributes and children).
 */
function renameElement(el, tagName, document) {
  if (el.tagName.toLowerCase() === tagName) return el;
  const next = document.createElement(tagName);
  [...el.attributes].forEach((attr) => next.setAttribute(attr.name, attr.value));
  while (el.firstChild) next.appendChild(el.firstChild);
  el.replaceWith(next);
  return next;
}

/**
 * Russell title / text component STYLES -> semantic content (content-driven, any page):
 * the source picks the visual size with a style class independently of the heading level,
 * EDS sizes headings by level, so the level follows the visual style:
 * - Title "kilo" (57px section title) on an h3/h4 (incl. the FAQ list title) -> h2
 * - Title "alpha" (30px sub-title) on an h2 -> h3
 * - Text "kilo" (57px statement) short single-line paragraph -> h2
 * - Text "beta" (32px lead-in, e.g. "Our ETFs are available through these platforms") -> h3
 * - Text "bold" paragraphs keep their weight as <strong>
 * Only short, link-free paragraphs are promoted to headings. h1 is never changed.
 */
function normalizeTextStyles(main, document) {
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const isHeadingLike = (p) => {
    const text = clean(p.textContent);
    return text && text.length <= 80 && !p.querySelector('a, img');
  };

  main.querySelectorAll('.title.cmp-title--kilo :is(h3, h4), .cmp-faq-cf-display--kilo .cmp-faq-cf-display__title:is(h3, h4)')
    .forEach((h) => renameElement(h, 'h2', document));
  main.querySelectorAll('.title.cmp-title--alpha h2')
    .forEach((h) => renameElement(h, 'h3', document));

  main.querySelectorAll('.text.cmp-text--kilo p').forEach((p) => {
    if (isHeadingLike(p)) renameElement(p, 'h2', document);
  });
  main.querySelectorAll('.text.cmp-text--beta p').forEach((p) => {
    if (isHeadingLike(p)) renameElement(p, 'h3', document);
  });

  main.querySelectorAll('.text.cmp-text--bold p').forEach((p) => {
    if (!clean(p.textContent) || p.querySelector('a, img, strong, b')) return;
    const strong = document.createElement('strong');
    while (p.firstChild) strong.appendChild(p.firstChild);
    p.appendChild(strong);
  });
}

/**
 * Pages whose visible title lives inside an embed/graphic (e.g. the ETF Ceros hero) have no
 * <h1>. Adds a visually hidden H1 from the page title (og:title, else <title>, without the
 * " | Russell Investments..." suffix) as its own first section with the `sr-heading` style.
 */
function addHiddenTitle(main, document) {
  if (main.querySelector('h1')) return;
  const og = document.querySelector('meta[property="og:title"]');
  const raw = (og && og.getAttribute('content')) || document.title || '';
  const title = raw.replace(/\s*[|–—-]\s*Russell Investments.*$/i, '').replace(/\s+/g, ' ').trim();
  if (!title) return;

  const h1 = document.createElement('h1');
  h1.textContent = title;
  const meta = WebImporter.Blocks.createBlock(document, {
    name: 'Section Metadata',
    cells: { style: 'sr-heading' },
  });
  main.prepend(h1, meta, document.createElement('hr'));
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);
    normalizeTextStyles(main, document);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params, ...(PARSER_OPTIONS[block.name] || {}) }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);
    addHiddenTitle(main, document);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // Drop the internal AEM content root so pages land on the public paths (e.g. /us/en/about-us)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/^\/content\/ri(?=\/)/, '')
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
