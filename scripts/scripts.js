import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  getMetadata,
  sampleRUM,
} from './aem.js';
import {
  injectOrganizationSchema,
  injectWebPageSchema,
  injectBreadcrumbSchema,
} from './structured-data.js';
import { loadThemeCSS } from './site-config.js';

/**
 * Fires a RUM event for a meaningful business interaction.
 * Wraps sampleRUM with a consistent source/target convention.
 * Import this in blocks instead of importing sampleRUM directly.
 *
 * @param {string} checkpoint - Event name (click|search|filter|convert|view)
 * @param {string} source     - Where: block name or CSS selector
 * @param {string} target     - What: URL, category, search term, or value
 *
 * @example
 * // Track a CTA click in the hero block
 * trackRUM('click', '.hero .button', '/contact');
 *
 * // Track a form submission convert event
 * trackRUM('convert', 'newsletter-form', 'subscribed');
 */
export function trackRUM(checkpoint, source, target) {
  sampleRUM(checkpoint, { source, target });
}

// Initialize Adobe Client Data Layer early (before delayed.js loads analytics).
// delayed.js pushes events into this array; ACDL listeners subscribe to it.
window.adobeDataLayer = window.adobeDataLayer || [];

// Supported locale codes — first path segment is treated as locale if it matches
const SUPPORTED_LOCALES = ['en', 'fr', 'de', 'es', 'it', 'ja', 'ko', 'zh', 'ar', 'he', 'pt', 'nl'];
// Locales that read right-to-left
const RTL_LOCALES = ['ar', 'he', 'fa', 'ur'];

/**
 * Detects the current locale from the URL path.
 * /fr/home → 'fr'  |  /home → 'en' (default)
 * @returns {string} BCP 47 locale code
 */
export function getLocale() {
  const [, first] = window.location.pathname.split('/');
  return SUPPORTED_LOCALES.includes(first) ? first : 'en';
}

/**
 * Formats a date string using Intl.DateTimeFormat for the current locale.
 * @param {string} dateStr ISO date string (e.g. '2026-07-03')
 * @param {string} [locale] Override locale (defaults to current page locale)
 * @returns {string} Formatted date (e.g. "3 juillet 2026" in French)
 */
export function formatDate(dateStr, locale) {
  const loc = locale || getLocale();
  return new Intl.DateTimeFormat(loc, { year: 'numeric', month: 'long', day: 'numeric' })
    .format(new Date(dateStr));
}

/**
 * Formats a number using Intl.NumberFormat for the current locale.
 * @param {number} value
 * @param {string} [locale] Override locale
 * @param {Intl.NumberFormatOptions} [options] e.g. { style: 'currency', currency: 'USD' }
 * @returns {string} Formatted number (e.g. "1.234,56 €" in German)
 */
export function formatNumber(value, locale, options = {}) {
  const loc = locale || getLocale();
  return new Intl.NumberFormat(loc, options).format(value);
}

/**
 * Sets lang/dir on <html> and injects hreflang alternate links.
 * Runs in the Eager phase so search engines see correct language metadata.
 */
function decorateI18n() {
  const locale = getLocale();

  // Set language attribute on <html>
  document.documentElement.lang = locale;

  // Set reading direction for RTL languages (Arabic, Hebrew, etc.)
  if (RTL_LOCALES.includes(locale)) {
    document.documentElement.dir = 'rtl';
  }

  // Inject hreflang alternate links from page metadata
  // Metadata format: "en:https://site.com/home, fr:https://site.com/fr/home"
  const hreflangMeta = getMetadata('hreflang');
  if (hreflangMeta) {
    hreflangMeta.split(',').forEach((pair) => {
      const [lang, href] = pair.trim().split(':').map((s) => s.trim());
      if (!lang || !href) return;
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang;
      // href may be split by the colon in https:// — rejoin if needed
      link.href = hreflangMeta.includes('https')
        ? pair.trim().substring(pair.trim().indexOf(':') + 1).trim()
        : href;
      document.head.append(link);
    });
  }
}

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * Traps keyboard focus inside an element (for modals/dialogs).
 * Tab wraps from last focusable → first; Shift+Tab wraps first → last.
 * @param {Element} element The container to trap focus within
 * @returns {Function} Cleanup function — call it when the trap should be removed
 */
export function trapFocus(element) {
  const focusableSelector = [
    'a[href]', 'button:not([disabled])', 'textarea',
    'input', 'select', '[tabindex]:not([tabindex="-1"])',
  ].join(', ');
  const focusable = [...element.querySelectorAll(focusableSelector)];
  if (!focusable.length) return () => {};
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  const handleKeydown = (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  element.addEventListener('keydown', handleKeydown);
  return () => element.removeEventListener('keydown', handleKeydown);
}

/**
 * Announces a message to screen readers via an ARIA live region.
 * Invisible to sighted users — only read aloud by assistive technology.
 * @param {string} message The text to announce
 * @param {'polite'|'assertive'} [priority='polite'] polite = waits, assertive = interrupts
 */
export function announceToScreenReader(message, priority = 'polite') {
  let live = document.getElementById('eds-live-region');
  if (!live) {
    live = document.createElement('div');
    live.id = 'eds-live-region';
    live.setAttribute('aria-live', priority);
    live.setAttribute('aria-atomic', 'true');
    live.className = 'visually-hidden';
    document.body.append(live);
  }
  // Clear first — screen reader fires on content change, not on same content
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = message; });
}

// ── PHASE 9: SECURITY ────────────────────────────────────────────────────────

/**
 * Sanitizes an HTML string using DOMPurify to prevent XSS.
 * Use whenever inserting author-controlled or third-party HTML into the DOM.
 *
 * @param {string} dirty  Raw HTML string (potentially unsafe)
 * @param {object} [config] DOMPurify config overrides
 * @returns {string} Safe HTML string
 *
 * @example
 * // Instead of: el.innerHTML = unsafeString;
 * // Use:        el.innerHTML = sanitizeHTML(unsafeString);
 */
export async function sanitizeHTML(dirty, config = {}) {
  if (!dirty) return '';
  // DOMPurify is bundled in scripts/ to avoid external CDN dependency
  const { default: DOMPurify } = await import('./dompurify.min.js');
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ...config,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Creates a block element with the given block name and content.
 * Used by buildAutoBlocks to programmatically create blocks.
 * @param {string} blockName The block CSS class (e.g. 'video-embed')
 * @param {string|Element} content The content to put inside the block
 * @returns {Element} The constructed block element
 */
function buildBlock(blockName, content) {
  const table = [Array.isArray(content) ? content : [content]];
  const blockEl = document.createElement('div');
  blockEl.classList.add(blockName, 'block');

  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      if (col instanceof Element) {
        colEl.append(col);
      } else {
        colEl.innerHTML = col;
      }
      rowEl.append(colEl);
    });
    blockEl.append(rowEl);
  });

  return blockEl;
}

/**
 * Checks if a URL is a video URL (YouTube, Vimeo, MP4, WebM).
 * @param {string} url
 * @returns {boolean}
 */
function isVideoUrl(url) {
  try {
    const u = new URL(url);
    return (
      u.hostname.includes('youtube.com')
      || u.hostname.includes('youtu.be')
      || u.hostname.includes('vimeo.com')
      || u.pathname.endsWith('.mp4')
      || u.pathname.endsWith('.webm')
    );
  } catch {
    return false;
  }
}

/**
 * AUTO BLOCK: Video Embed
 * Detects standalone video URLs (YouTube/Vimeo/MP4) on their own paragraph
 * and wraps them in a video-embed block automatically.
 *
 * Trigger: <p><a href="https://www.youtube.com/...">...</a></p>
 *          where the <a> is the ONLY element inside <p>
 * Result:  <div class="video-embed block"><div><div>URL</div></div></div>
 *
 * @param {Element} main
 */
function buildVideoEmbeds(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    const p = a.closest('p');
    if (!p) return;

    // The link must be the ONLY child node in the paragraph
    // (no other text nodes or elements alongside it)
    const siblingContent = [...p.childNodes]
      .filter((n) => n !== a && n.textContent.trim() !== '');
    if (siblingContent.length > 0) return;

    // Must be a video URL
    if (!isVideoUrl(a.href)) return;

    // Build the video-embed block with the raw URL as text content
    const videoBlock = buildBlock('video-embed', a.href);

    // Replace the paragraph Ã¢â‚¬â€ decorateBlocks() will load it naturally
    p.replaceWith(videoBlock);
  });
}

/**
 * AUTO BLOCK: Breadcrumb
 * Automatically inserts a breadcrumb block at the top of the main content
 * on pages that are 2+ levels deep (e.g. /blog/my-post, /products/category/item).
 *
 * Trigger: Page path has 2+ segments
 * Result:  breadcrumb block inserted as first block in first section
 *
 * @param {Element} main
 */
function buildBreadcrumb(main) {
  const pathSegments = window.location.pathname.split('/').filter(Boolean);

  // Only add breadcrumb on pages 2+ levels deep
  // Skip home (/), top-level pages (/about), and fragment pages (/nav, /footer)
  const skipPaths = ['nav', 'footer', 'header'];
  if (pathSegments.length < 2) return;
  if (skipPaths.includes(pathSegments[0])) return;

  // Don't add if a breadcrumb block already exists (authored manually)
  if (main.querySelector('.breadcrumb')) return;

  // Build an empty breadcrumb block Ã¢â‚¬â€ decorate() auto-generates from URL
  const breadcrumbBlock = buildBlock('breadcrumb', '');

  // Insert at the very start of main Ã¢â‚¬â€ decorateBlocks() will load it naturally
  // Note: at this point decorateSections hasn't run yet, so use first child div
  const firstDiv = main.querySelector(':scope > div');
  if (firstDiv) {
    firstDiv.prepend(breadcrumbBlock);
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * Called during decorateMain() in the Eager phase.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildVideoEmbeds(main);
    buildBreadcrumb(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
export function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Adds fetchpriority="high" to the first image in the first section.
 * This tells the browser to prioritize downloading the LCP image
 * over other resources, improving LCP score.
 * Must run AFTER decorateBlocks so block images are already in the DOM.
 * @param {Element} main
 */
function decorateLCPImages(main) {
  // The LCP image is typically the first image in the first section
  const firstSection = main.querySelector('.section');
  if (!firstSection) return;

  const firstImg = firstSection.querySelector('img');
  if (!firstImg) return;

  firstImg.setAttribute('fetchpriority', 'high');
  firstImg.setAttribute('loading', 'eager');

  // Also set on the parent picture's source elements for completeness
  const picture = firstImg.closest('picture');
  if (picture) {
    picture.querySelectorAll('source').forEach((source) => {
      // fetchpriority on source isn't standard but some browsers honour it
      source.setAttribute('fetchpriority', 'high');
    });
  }
}

/**
 * Auto-generates id attributes on h2/h3/h4 headings from their text content.
 * Enables deep-linking (e.g. page.html#section-title) and TOC anchor links.
 * Skips headings that already have an id.
 * @param {Element} main
 */
function decorateHeadingIds(main) {
  const seen = new Set();
  main.querySelectorAll('h2, h3, h4').forEach((heading) => {
    if (heading.id) return;
    const base = heading.textContent.trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60);
    if (!base) return;
    let id = base;
    let n = 2;
    while (seen.has(id)) { id = `${base}-${n}`; n += 1; }
    seen.add(id);
    heading.id = id;
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  decorateLCPImages(main);
}

/**
 * Injects complete SEO meta tags into <head> based on page metadata.
 * Handles: canonical, robots, og:type/url/title/description/image,
 * twitter:card/title/description/image.
 * Called in loadEager so search engines always see these tags.
 */
function decorateSEO() {
  const { title } = document;
  const description = getMetadata('description');
  const template = getMetadata('template');
  const ogImageMeta = getMetadata('og:image');

  // Canonical URL — author-specified wins, otherwise current URL (no query params)
  const authoredCanonical = getMetadata('canonical');
  const canonicalUrl = authoredCanonical || `${window.location.origin}${window.location.pathname}`;
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.append(canonicalLink);
  }
  canonicalLink.href = canonicalUrl;

  // Robots
  const robots = getMetadata('robots');
  if (robots) {
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.append(robotsMeta);
    }
    robotsMeta.content = robots;
  }

  // og:type — "article" for article template, "website" for everything else
  const ogType = template === 'article' ? 'article' : 'website';

  // Batch inject OG + Twitter Card meta tags
  const metaTags = [
    { attr: 'property', name: 'og:type', value: ogType },
    { attr: 'property', name: 'og:url', value: canonicalUrl },
    { attr: 'property', name: 'og:title', value: title },
    { attr: 'property', name: 'og:description', value: description },
    { attr: 'property', name: 'og:image', value: ogImageMeta },
    { attr: 'name', name: 'twitter:card', value: 'summary_large_image' },
    { attr: 'name', name: 'twitter:title', value: title },
    { attr: 'name', name: 'twitter:description', value: description },
    { attr: 'name', name: 'twitter:image', value: ogImageMeta },
  ];

  metaTags.forEach(({ attr, name, value }) => {
    if (!value) return;
    const selector = `meta[${attr}="${name}"]`;
    let tag = document.querySelector(selector);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, name);
      document.head.append(tag);
    }
    tag.content = value;
  });
}

// ── EXPERIMENTATION PLUGIN ────────────────────────────────────────────────────
// Loaded from CDN so EDS Code Sync can serve it without a build step.
// Production alternative: copy node_modules/@adobe/aem-experimentation/src/
// into plugins/experimentation/ and import from there instead.
const EXPERIMENT_PLUGIN = 'https://cdn.jsdelivr.net/npm/@adobe/aem-experimentation@1/src/index.js';

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  decorateSEO();
  decorateI18n();

  // Phase 19: load brand/site theme CSS before first paint to avoid CLS.
  // Reads theme from page meta or /site-config.json spreadsheet.
  // e.g. <meta name="theme" content="dark"> loads styles/themes/dark.css
  await loadThemeCSS(loadCSS, window.hlx.codeBasePath);

  // Inject JSON-LD structured data (Phase 17)
  // Organization + WebSite + SearchAction: on every page
  injectOrganizationSchema();
  // WebPage: gives Google explicit identity for this page
  injectWebPageSchema();
  // BreadcrumbList: auto-generated from URL path (/insights/article -> Home > Insights > Article)
  injectBreadcrumbSchema();

  // ── A/B EXPERIMENTATION (EAGER PHASE) ──────────────────────────────────
  // MUST run before decorateMain to avoid a flash of control content (FOUC).
  // The plugin reads "experiment" metadata, assigns the visitor to a variant
  // (persisted in a cookie), and for page-level experiments fetches the
  // variant page's <main> HTML and swaps it in before decoration runs.
  //
  // Author sets in Page Properties:
  //   experiment:         hero-cta-test          ← unique experiment ID
  //   instant-experiment: /home--variant-a       ← variant page path(s)
  //   experiment-split:   50                     ← % of traffic to variant
  //
  // Force a variant for QA:  ?experiment=hero-cta-test&variant=variant-a
  if (getMetadata('experiment')) {
    try {
      const { loadEager: runExperiment } = await import(EXPERIMENT_PLUGIN);
      await runExperiment(document, {
        // Tells the plugin which hostname is "production" (live).
        // On *.aem.page and localhost the plugin shows a preview bar.
        prodHost: 'main--eds-russell--sumitsapient.aem.live',
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[experimentation] Plugin failed to load:', e);
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  // ── PAGE-LEVEL AUTH GATING ──────────────────────────────────────────────
  // If author sets "auth-required: true" in Page Properties,
  // redirect to login before rendering any content.
  if (getMetadata('auth-required') === 'true') {
    const { requireAuth } = await import('./auth.js');
    await requireAuth(); // throws + redirects if not authenticated
  }
  // ────────────────────────────────────────────────────────────────────────

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Adds a skip-to-content link for accessibility.
 */
function addSkipLink() {
  const skip = document.createElement('a');
  skip.href = '#main-content';
  skip.className = 'skip-to-content';
  skip.textContent = 'Skip to main content';
  document.body.prepend(skip);
  document.querySelector('main')?.setAttribute('id', 'main-content');
}

/**
 * Sets up Intersection Observer for section scroll animations.
 * Supports animate variants: fade-in, slide-up, slide-left, slide-right.
 */
function observeSectionAnimations() {
  const sections = document.querySelectorAll('.section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  sections.forEach((section, index) => {
    if (index > 0) observer.observe(section); // skip first section (eager/LCP)
  });
}

/**
 * Applies section metadata that requires JavaScript:
 * - background: sets background-image inline style from data-background attribute
 * - id: sets the section's id attribute for anchor linking from data-id attribute
 * - animate: adds animation class for scroll-triggered effects from data-animate attribute
 * aem.js already converts section-metadata key/value rows into data-* attributes.
 * This function reads those attributes and applies the side effects.
 * @param {Element} main The main element
 */
function decorateSectionMetadata(main) {
  main.querySelectorAll('.section').forEach((section) => {
    // Background image
    const bg = section.dataset.background;
    if (bg) {
      section.style.backgroundImage = `url(${bg})`;
      section.classList.add('has-background');
    }

    // Custom ID for anchor linking — data-id="about-us" sets id="about-us" on the section
    const sectionId = section.dataset.id;
    if (sectionId) {
      section.id = sectionId;
    }

    // Scroll animation type (data-animate="fade-in|slide-up|slide-left|slide-right")
    const animationType = section.dataset.animate;
    if (animationType) {
      section.classList.add('animate', animationType);
    }
  });
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  addSkipLink();
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  // ── A/B EXPERIMENTATION (LAZY PHASE) ───────────────────────────────────
  // Fires experiment impression events and applies audience-based content.
  // Only runs on pages that have an active experiment.
  if (document.body.dataset.experiment) {
    try {
      const { loadLazy: runExperimentLazy } = await import(EXPERIMENT_PLUGIN);
      await runExperimentLazy(document);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[experimentation] Lazy phase failed:', e);
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  // Auto-generate id attributes on headings for deep-linking
  decorateHeadingIds(main);

  // Apply section metadata side-effects (background, id, animate)
  decorateSectionMetadata(main);

  // ── BLOCK-LEVEL AUTH GATING ─────────────────────────────────────────────
  // Author adds class "auth-required" to any block in Universal Editor.
  // Blocks are hidden until auth check resolves, then shown or removed.
  const gatedBlocks = main.querySelectorAll('.block.auth-required');
  if (gatedBlocks.length) {
    const { gateBlock } = await import('./auth.js');
    await Promise.all([...gatedBlocks].map(gateBlock));
  }
  // ────────────────────────────────────────────────────────────────────────

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
  observeSectionAnimations();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  window.setTimeout(async () => {
    // ── A/B EXPERIMENTATION (DELAYED PHASE) ──────────────────────────────
    // Handles campaign parameter tracking (UTM → experiment attribution)
    // and sends final experiment engagement data to analytics.
    if (document.body.dataset.experiment) {
      try {
        const { loadDelayed: runExperimentDelayed } = await import(EXPERIMENT_PLUGIN);
        runExperimentDelayed(document);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[experimentation] Delayed phase failed:', e);
      }
    }
    // ────────────────────────────────────────────────────────────────────────
    // eslint-disable-next-line import/no-cycle
    import('./delayed.js');
  }, 3000);
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
