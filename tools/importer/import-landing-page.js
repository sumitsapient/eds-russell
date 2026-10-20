/* eslint-disable */
/* global WebImporter */

import heroImageOverlayParser from './parsers/hero-image-overlay.js';
import cardsStatsParser from './parsers/cards-stats.js';
import columnsMediaParser from './parsers/columns-media.js';
import carouselTimelineParser from './parsers/carousel-timeline.js';
import columnsImageTrioParser from './parsers/columns-image-trio.js';
import cardsLinksParser from './parsers/cards-links.js';
import embedCerosParser from './parsers/embed-ceros.js';
import tabsArticleCardsParser from './parsers/tabs-article-cards.js';
import columnsPromoPanelParser from './parsers/columns-promo-panel.js';
import cardsImageLinkParser from './parsers/cards-image-link.js';
import russellCleanupTransformer from './transformers/russell-cleanup.js';
import russellSectionsTransformer from './transformers/russell-sections.js';

const PAGE_TEMPLATE = {
  "name": "landing-page",
  "urls": [
    "https://russellinvestments.com/content/ri/us/en/about-us.html",
    "https://russellinvestments.com/content/ri/us/en/individual-investor.html",
    "https://russellinvestments.com/content/ri/us/en/insights.html"
  ],
  "representativeUrl": "https://russellinvestments.com/content/ri/us/en/about-us.html",
  "description": "Landing pages (homepage, About Us, Insights hub): hero, card grids, promos, carousels",
  "blocks": [
    {
      "name": "hero-image-overlay",
      "instances": [
        ".herovideoheader",
        ".heroimageheader:has(section[style*=\"background-image\"])"
      ]
    },
    {
      "name": "cards-stats",
      "instances": [
        ".aem-Grid:has(> .datadisplay)"
      ]
    },
    {
      "name": "columns-media",
      "instances": [
        ".aem-Grid:has(> .title):has(> .responsivegrid .cmp-image):has(> .responsivegrid .cmp-ri-btn-wrapper)"
      ]
    },
    {
      "name": "carousel-timeline",
      "instances": [
        ".verticalcardcarousel"
      ]
    },
    {
      "name": "columns-image-trio",
      "instances": [
        ".fullbleedimagesdouble"
      ]
    },
    {
      "name": "cards-links",
      "instances": [
        ".aem-Grid:has(> .verticalcard):not(:has(a.cmp-vertical-card__link))"
      ]
    },
    {
      "name": "embed-ceros",
      "instances": [
        ".embed:has(iframe[src*=\"ceros\"])"
      ]
    },
    {
      "name": "tabs-article-cards",
      "instances": [
        ".recentArticles"
      ]
    },
    {
      "name": "columns-promo-panel",
      "instances": [
        ".verticalcardimageright"
      ]
    },
    {
      "name": "cards-image-link",
      "instances": [
        ".aem-Grid:has(> .verticalcard a.cmp-vertical-card__link)"
      ]
    }
  ],
  "urlPattern": "/content/ri/us/en/*",
  "sections": [
    {
      "id": "section-1",
      "name": "Hero",
      "selector": [
        ".heroimageheader:has(section[style*=\"background-image\"])",
        ".herovideoheader"
      ],
      "style": null,
      "blocks": [
        "hero-image-overlay"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Intro statement",
      "selector": [
        ".cmp-layout-container--bg-graphic-top-right:not(:has(.verticalcard))"
      ],
      "style": "intro",
      "blocks": [],
      "defaultContent": [
        ".cmp-text p"
      ]
    },
    {
      "id": "section-3",
      "name": "By the numbers",
      "selector": [
        ".cmp-layout-container--off-white-bg:has(.datadisplay)"
      ],
      "style": "light",
      "blocks": [
        "cards-stats"
      ],
      "defaultContent": [
        "h2.cmp-title__text"
      ]
    },
    {
      "id": "section-4",
      "name": "What sets us apart",
      "selector": [
        ".cmp-layout-container--white-bg:has(.cmp-image):has(.cmp-ri-btn-wrapper)"
      ],
      "style": null,
      "blocks": [
        "columns-media"
      ],
      "defaultContent": [
        "h2.cmp-title__text"
      ]
    },
    {
      "id": "section-5",
      "name": "A history of innovation",
      "selector": [
        ".cmp-layout-container--blue-bg:has(.verticalcardcarousel)"
      ],
      "style": "light-blue, split",
      "blocks": [
        "carousel-timeline"
      ],
      "defaultContent": [
        "h2.cmp-title__text",
        ".cmp-text p"
      ]
    },
    {
      "id": "section-6",
      "name": "Guiding every journey",
      "selector": [
        ".responsivegrid:has(> .aem-Grid > .fullbleedimagesdouble)"
      ],
      "style": null,
      "blocks": [
        "columns-image-trio"
      ],
      "defaultContent": []
    },
    {
      "id": "section-7",
      "name": "Invest without boundaries",
      "selector": [
        ".cmp-layout-container--bg-graphic-bottom-right"
      ],
      "style": null,
      "blocks": [
        "cards-links"
      ],
      "defaultContent": [
        "h2.cmp-title__text"
      ]
    },
    {
      "id": "home-section-2",
      "name": "ETF promo banner",
      "selector": [
        ".cmp-layout-container--white-bg:has(.embed iframe[src*=\"ceros\"])"
      ],
      "style": null,
      "blocks": [
        "embed-ceros"
      ],
      "defaultContent": []
    },
    {
      "id": "home-section-3",
      "name": "Recent insights / research",
      "selector": [
        ".cmp-layout-container--off-white-bg:has(.recentArticles)"
      ],
      "style": "light",
      "blocks": [
        "tabs-article-cards"
      ],
      "defaultContent": [
        ".cmp-recent-articles__heading"
      ]
    },
    {
      "id": "home-section-4",
      "name": "We help invest without boundaries",
      "selector": [
        ".cmp-layout-container--bg-graphic-top-right:has(.verticalcard)"
      ],
      "style": null,
      "blocks": [
        "cards-links"
      ],
      "defaultContent": [
        ".cmp-text p",
        "h2.cmp-title__text"
      ]
    },
    {
      "id": "insights-section-1",
      "name": "Page header",
      "selector": [
        ".heroimageheader:not(:has(section[style*=\"background-image\"]))"
      ],
      "style": "dark",
      "blocks": [],
      "defaultContent": [
        "h1",
        ".cmp-hero-image-header__subheading"
      ]
    },
    {
      "id": "insights-section-2",
      "name": "Jump-link nav",
      "selector": [
        ".anchortab"
      ],
      "style": "light, jump-links",
      "blocks": [],
      "defaultContent": [
        "a"
      ]
    },
    {
      "id": "insights-section-3",
      "name": "Insights",
      "selector": [
        ".cmp-layout-container--white-bg:has(.aem-Grid > .verticalcard):not(:has(a.cmp-vertical-card__link)):not(.cmp-layout-container--bg-graphic-bottom-right):not(.cmp-layout-container--bg-graphic-top-right):not(.cmp-layout-container--bg-graphic-bottom-right *):not(.cmp-layout-container--bg-graphic-top-right *)"
      ],
      "style": null,
      "blocks": [
        "cards-links"
      ],
      "defaultContent": [
        "h2.cmp-title__text"
      ]
    },
    {
      "id": "insights-section-4",
      "name": "Market Forecast",
      "selector": [
        ".cmp-layout-container--white-bg:has(.verticalcardimageright:not(.cmp-vertical-card-image-right--navy-full-bleed))"
      ],
      "style": null,
      "blocks": [
        "columns-promo-panel"
      ],
      "defaultContent": [
        "h2.cmp-title__text"
      ]
    },
    {
      "id": "insights-section-5",
      "name": "Interactive tools",
      "selector": [
        ".cmp-layout-container--blue-bg:has(a.cmp-vertical-card__link)"
      ],
      "style": "light-blue",
      "blocks": [
        "cards-image-link"
      ],
      "defaultContent": [
        "h2.cmp-title__text"
      ]
    },
    {
      "id": "insights-section-6",
      "name": "Market volatility resources",
      "selector": [
        ".verticalcardimageright.cmp-vertical-card-image-right--navy-full-bleed"
      ],
      "style": null,
      "blocks": [
        "columns-promo-panel"
      ],
      "defaultContent": []
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
  'hero-image-overlay': heroImageOverlayParser,
  'cards-stats': cardsStatsParser,
  'columns-media': columnsMediaParser,
  'carousel-timeline': carouselTimelineParser,
  'columns-image-trio': columnsImageTrioParser,
  'cards-links': cardsLinksParser,
  'embed-ceros': embedCerosParser,
  'tabs-article-cards': tabsArticleCardsParser,
  'columns-promo-panel': columnsPromoPanelParser,
  'cards-image-link': cardsImageLinkParser,
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

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

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
