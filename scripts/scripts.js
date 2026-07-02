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
} from './aem.js';

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

    // Replace the paragraph â€” decorateBlocks() will load it naturally
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

  // Build an empty breadcrumb block â€” decorate() auto-generates from URL
  const breadcrumbBlock = buildBlock('breadcrumb', '');

  // Insert at the very start of main â€” decorateBlocks() will load it naturally
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
}

/**
 * Injects SEO-related meta tags into <head> based on page metadata.
 * Handles: robots, og:image, canonical URL.
 */
function decorateSEO() {
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

  const ogImage = getMetadata('og:image');
  if (ogImage) {
    ['og:image', 'twitter:image'].forEach((prop) => {
      let tag = document.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(prop.startsWith('og:') ? 'property' : 'name', prop);
        document.head.append(tag);
      }
      tag.content = ogImage;
    });
  }

  const canonical = getMetadata('canonical');
  if (canonical) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.append(link);
    }
    link.href = canonical;
  }
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  decorateSEO();
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

    // Custom ID for anchor linking (e.g. data-id="about-us" ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ id="about-us")
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

  // Apply section metadata side-effects (background, id, animate)
  decorateSectionMetadata(main);

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
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
