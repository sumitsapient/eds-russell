import {
  buildBlock,
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
} from './aem.js';

/**
 * Moves the given attributes from one element to another.
 * @param {Element} from the element to move attributes from
 * @param {Element} to the element to move attributes to
 * @param {string[]} [attributes] attribute names (defaults to all)
 */
export function moveAttributes(from, to, attributes) {
  const names = attributes || [...from.attributes].map(({ nodeName }) => nodeName);
  names.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Moves Universal Editor instrumentation (data-aue-*, data-richtext-*) from one element
 * to another, so blocks that rebuild their DOM stay editable in Universal Editor.
 * @param {Element} from the element to move instrumentation from
 * @param {Element} to the element to move instrumentation to
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
 * Keeps keyboard focus cycling inside an element (e.g. an open modal).
 * @param {Element} element the container to trap focus in
 * @returns {Function} call to remove the focus trap
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
 * Resolves a fragment name (e.g. 'nav') to the correct content path.
 * Derives the content root from the current page path so fragments work
 * whether content is served from root (/) or a sub-path (/content/).
 */
export function getContentRoot() {
  const { pathname } = window.location;
  // Find the deepest path segment before the page name that contains content pages
  // e.g. /content/wknd/about → /content/wknd, /about → /
  const segments = pathname.split('/').filter(Boolean);
  // The last segment is the page itself; everything before it is the content root
  if (segments.length > 1) {
    // Check if content is nested (e.g. /content/adventures or /content/blog/post)
    // Walk up to find where nav.plain.html would live (sibling of pages, not inside blog/)
    // For /content/blog/post → content root is /content
    // For /content/adventures → content root is /content
    // For /adventures → content root is /
    const root = segments.slice(0, -1);
    // Skip known leaf directories like 'blog'
    while (root.length > 0 && ['blog'].includes(root[root.length - 1])) {
      root.pop();
    }
    return `/${root.join('/')}`;
  }
  return '';
}

/** Shared brand logo SVG + text used by header and footer */
export const BRAND_LOGO = `<span class="nav-logo-icon" aria-hidden="true">
  <svg width="100%" height="100%" viewBox="0 0 33 33" preserveAspectRatio="xMidYMid meet">
    <path d="M28,0H5C2.24,0,0,2.24,0,5v23c0,2.76,2.24,5,5,5h23c2.76,0,5-2.24,5-5V5c0-2.76-2.24-5-5-5ZM29,17c-6.63,0-12,5.37-12,12h-1c0-6.63-5.37-12-12-12v-1c6.63,0,12-5.37,12-12h1c0,6.63,5.37,12,12,12v1Z" fill="currentColor"/>
  </svg>
</span><span class="nav-logo-text">WKND<br>Adventures</span>`;

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    // Skip when the h1 or picture already belongs to an authored block (any hero variant)
    if (h1.closest('div[class]') || picture.closest('div[class]')) {
      return; // Don't create a duplicate hero block
    }
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
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
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
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

    // In styled sections (dark/accent), standalone links become buttons
    const styledSection = p.closest('.section.dark, .section.accent');
    if (!strong && !em && !styledSection) return;

    a.title = a.title || text;
    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else if (em) {
      a.classList.add('secondary');
      em.replaceWith(a);
    } else {
      // Bare link in styled section → primary button
      a.classList.add('primary');
    }
  });
}

/**
 * Fix button variants and group adjacent buttons.
 * Runs during eager phase so hero buttons don't shift after first paint.
 * @param {Element} main The main element
 */
function decorateButtonVariants(main) {
  // In dark and accent sections, make the second consecutive button secondary
  main.querySelectorAll(':scope > .section.dark, :scope > .section.accent').forEach((section) => {
    section.querySelectorAll('.default-content-wrapper').forEach((wrapper) => {
      const btnWrappers = [...wrapper.querySelectorAll(':scope > p.button-wrapper')];
      for (let i = 1; i < btnWrappers.length; i += 1) {
        if (btnWrappers[i].previousElementSibling === btnWrappers[i - 1]) {
          const btn = btnWrappers[i].querySelector('a.button.primary');
          if (btn) {
            btn.classList.remove('primary');
            btn.classList.add('secondary');
          }
        }
      }
    });
  });

  // Group adjacent button-wrappers into a flex container
  main.querySelectorAll('p.button-wrapper').forEach((wrapper) => {
    if (wrapper.parentElement.classList.contains('button-group')) return;
    const next = wrapper.nextElementSibling;
    if (next && next.classList.contains('button-wrapper')) {
      const group = document.createElement('div');
      group.className = 'button-group';
      wrapper.parentNode.insertBefore(group, wrapper);
      group.append(wrapper);
      let sibling = group.nextElementSibling;
      while (sibling && sibling.classList.contains('button-wrapper')) {
        const nextSibling = sibling.nextElementSibling;
        group.append(sibling);
        sibling = nextSibling;
      }
    }
  });
}

/**
 * Jump-link bars (sections with style "jump-links"): authors only need link labels that match a
 * heading on the page. Links whose #target doesn't exist are re-pointed to the first heading
 * (h2, then h3/h1, then an eyebrow paragraph directly above a heading) whose text equals or
 * starts with the link text; else to a section whose iframe title, image alt or first heading
 * contains the link text; else (by page order) to the first untargeted section between the
 * targets of the neighbouring links. Adds smooth scrolling (respecting prefers-reduced-motion)
 * below the sticky header + bar, and marks the link of the section in view with aria-current.
 * @param {Element} main The main element
 */
function decorateJumpLinks(main) {
  const links = [...main.querySelectorAll('.section.jump-links a[href^="#"]')];
  if (!links.length) return;

  const norm = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();
  const outsideBar = (el) => !el.closest('.jump-links');
  const candidates = [
    [...main.querySelectorAll('h2')],
    [...main.querySelectorAll('h1, h3')],
    [...main.querySelectorAll('p')].filter((p) => /^H[1-6]$/.test(p.nextElementSibling?.tagName)),
  ].map((group) => group.filter(outsideBar));

  const findTarget = (label) => {
    let found = null;
    candidates.some((group) => {
      found = group.find((el) => {
        const text = norm(el.textContent);
        return text && (text === label || text.startsWith(label));
      });
      return found;
    });
    return found;
  };

  // fallback 1: a section whose iframe title, image alt or first heading mentions the label
  const sections = [...main.querySelectorAll(':scope > .section')]
    .filter((s) => !s.classList.contains('jump-links') && !s.classList.contains('sr-heading'));
  const findSection = (label) => sections.find((section) => [
    ...[...section.querySelectorAll('iframe[title]')].map((f) => f.title),
    ...[...section.querySelectorAll('img[alt]')].map((img) => img.alt),
    section.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || '',
  ].some((text) => norm(text).includes(label)));

  const targets = links.map((a) => {
    const hash = a.getAttribute('href');
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (target && outsideBar(target)) return target;
    const label = norm(a.textContent);
    return label ? findTarget(label) || findSection(label) : null;
  });

  // fallback 2 (nothing on the page names the link, e.g. an embed or a promo band): bar links
  // follow page order, so take the first untargeted section between the sections of the
  // nearest resolved links before and after it
  const sectionOf = (el) => el?.closest('.section');
  targets.forEach((target, i) => {
    if (target) return;
    const prev = sectionOf(targets.slice(0, i).reverse().find(Boolean));
    const next = sectionOf(targets.slice(i + 1).find(Boolean));
    const from = prev ? sections.indexOf(prev) + 1 : 0;
    const to = next ? sections.indexOf(next) : sections.length;
    const taken = targets.map(sectionOf);
    targets[i] = sections.slice(from, Math.max(from, to)).find((s) => !taken.includes(s)) || null;
  });

  const entries = [];
  links.forEach((a, i) => {
    const target = targets[i];
    if (!target) return;
    const hash = a.getAttribute('href');
    if (`#${target.id}` !== hash) {
      if (!target.id) {
        const base = norm(a.textContent).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
        let id = base;
        for (let n = 1; document.getElementById(id); n += 1) id = `${base}-${n}`;
        target.id = id;
      }
      a.setAttribute('href', `#${target.id}`);
      // keep deep links to the old source anchors working
      if (window.location.hash === hash) window.history.replaceState(null, '', `#${target.id}`);
    }
    entries.push({ a, section: sectionOf(target) });
  });
  if (!entries.length) return;

  const setCurrent = (link) => {
    links.forEach((l) => l.removeAttribute('aria-current'));
    if (!link) return;
    link.setAttribute('aria-current', 'true');
    // keep the active link visible in a horizontally scrolling (mobile) bar
    const row = link.parentElement;
    if (row.scrollWidth > row.clientWidth) {
      row.scrollLeft = link.offsetLeft - row.offsetLeft - (row.clientWidth - link.offsetWidth) / 2;
    }
  };

  entries.forEach(({ a }) => {
    a.addEventListener('click', (e) => {
      const target = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (!target) return;
      e.preventDefault();
      const bar = a.closest('.section');
      const offset = (document.querySelector('header')?.offsetHeight || 0) + (bar?.offsetHeight || 0) + 16;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const scrollToTarget = (behavior) => window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior,
      });
      scrollToTarget(reduceMotion ? 'auto' : 'smooth');
      // lazy embeds passed on the way resize as they load (e.g. Ceros full-height mode):
      // re-align on the target while the page height settles
      let { scrollHeight } = document.documentElement;
      const settle = new ResizeObserver(() => {
        if (document.documentElement.scrollHeight === scrollHeight) return;
        ({ scrollHeight } = document.documentElement);
        scrollToTarget('auto');
      });
      settle.observe(main);
      setTimeout(() => settle.disconnect(), 2000);
      window.history.pushState(null, '', a.getAttribute('href'));
      setCurrent(a);
    });
  });

  // active link = section crossing a line 30% down the viewport
  const visible = new Set();
  const observer = new IntersectionObserver((records) => {
    records.forEach((r) => (r.isIntersecting ? visible.add(r.target) : visible.delete(r.target)));
    const active = entries.find(({ section }) => visible.has(section));
    setCurrent(active ? active.a : null);
  }, { rootMargin: '-30% 0px -69% 0px' });
  entries.forEach(({ section }) => section && observer.observe(section));

  // back above the first target: show a scrolled (mobile) bar from its first link again
  const row = links[0].parentElement;
  window.addEventListener('scroll', () => {
    if (!row.scrollLeft || row.querySelector('[aria-current]')) return;
    const firstTop = entries[0].section?.getBoundingClientRect().top;
    if (firstTop > window.innerHeight * 0.3) row.scrollLeft = 0;
  }, { passive: true });
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
  decorateButtonVariants(main);
  decorateJumpLinks(main);

  // Tag pills: first <p> in dark/accent sections (eyebrow labels)
  main.querySelectorAll(':scope > .section.dark > div > p:first-child, :scope > .section.accent > div > p:first-child').forEach((p) => {
    if (!p.querySelector('a, img') && !p.classList.contains('button-wrapper')) {
      p.classList.add('tag-pill');
    }
  });
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 1024 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Decorates consecutive sections with style=tabs into a tabbed container.
 * Each tabs section becomes a tab panel; the first heading in each becomes the tab label.
 * Runs after all sections are loaded so blocks inside panels are fully decorated.
 * @param {Element} main The main element
 */
function decorateTabSections(main) {
  const sections = [...main.querySelectorAll(':scope > .section.tabs')];
  if (!sections.length) return;

  // Group consecutive .tabs sections
  const groups = [];
  let current = [];
  sections.forEach((section) => {
    if (current.length && current[current.length - 1].nextElementSibling !== section) {
      groups.push(current);
      current = [];
    }
    current.push(section);
  });
  if (current.length) groups.push(current);

  groups.forEach((group) => {
    // Find the section heading that precedes the tab group
    // (e.g., "Browse by Activity" in a default-content-wrapper right before the first tab section)
    const firstTab = group[0];

    // Create tabs container
    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'tabs-container';

    // Insert before the first tab section
    firstTab.parentNode.insertBefore(tabsContainer, firstTab);

    // Check for a heading section immediately before the tab group
    const prevSection = tabsContainer.previousElementSibling;
    if (prevSection && prevSection.classList.contains('section')
      && !prevSection.classList.contains('tabs')) {
      // Check if this section only has a heading (section title for the tabs)
      const wrappers = prevSection.querySelectorAll(':scope > .default-content-wrapper');
      const blocks = prevSection.querySelectorAll(':scope > [class*="-wrapper"]:not(.default-content-wrapper)');
      if (wrappers.length === 1 && blocks.length === 0) {
        const h2 = wrappers[0].querySelector('h2');
        if (h2 && wrappers[0].children.length === 1) {
          tabsContainer.append(wrappers[0]);
          prevSection.remove();
        }
      }
    }

    // Build tab list
    const tablist = document.createElement('div');
    tablist.className = 'tabs-list';
    tablist.setAttribute('role', 'tablist');

    // Sliding indicator (hidden until first interaction, CSS box-shadow handles default)
    const indicator = document.createElement('div');
    indicator.className = 'tabs-indicator';

    function moveIndicator(targetBtn) {
      const listRect = tablist.getBoundingClientRect();
      const btnRect = targetBtn.getBoundingClientRect();
      indicator.style.left = `${btnRect.left - listRect.left + tablist.scrollLeft}px`;
      indicator.style.right = `${listRect.width - (btnRect.left - listRect.left + tablist.scrollLeft + btnRect.width)}px`;
    }

    function activatePanels(button) {
      tabsContainer.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', 'true');
      });
      tablist.querySelectorAll('[role=tab]').forEach((btn) => {
        btn.setAttribute('aria-selected', 'false');
        btn.setAttribute('tabindex', '-1');
      });
      button.setAttribute('aria-selected', 'true');
      button.setAttribute('tabindex', '0');
      button.focus();

      const panelId = button.getAttribute('aria-controls');
      const panel = tabsContainer.querySelector(`#${panelId}`);
      if (panel) panel.setAttribute('aria-hidden', 'false');
    }

    function selectTab(button) {
      // On first interaction, snap indicator to current tab, enable transition, then animate
      if (!tablist.classList.contains('tabs-animated')) {
        tablist.classList.add('tabs-animated');
        const prev = tablist.querySelector('[aria-selected="true"]');
        if (prev) moveIndicator(prev);
        // Wait one frame so the snap paints, then enable transition and move
        requestAnimationFrame(() => {
          indicator.style.transition = 'left 0.3s ease, right 0.3s ease';
          activatePanels(button);
          moveIndicator(button);
        });
        return;
      }

      activatePanels(button);
      moveIndicator(button);
    }

    // Build tab panels
    group.forEach((section, i) => {
      const heading = section.querySelector(':scope > .default-content-wrapper > h2, :scope > .default-content-wrapper > h3');
      const label = heading ? heading.textContent.trim() : `Tab ${i + 1}`;
      const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (heading) heading.remove();

      const button = document.createElement('button');
      button.className = 'tabs-tab';
      button.id = `tab-${id}`;
      button.textContent = label;
      button.setAttribute('aria-controls', `tabpanel-${id}`);
      button.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      button.setAttribute('role', 'tab');
      button.setAttribute('type', 'button');
      button.setAttribute('tabindex', i === 0 ? '0' : '-1');
      button.addEventListener('click', () => selectTab(button));
      tablist.append(button);

      section.setAttribute('role', 'tabpanel');
      section.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      section.setAttribute('aria-labelledby', `tab-${id}`);
      section.id = `tabpanel-${id}`;
      section.classList.add('tabs-panel');
      tabsContainer.append(section);
    });

    // Keyboard navigation: arrow keys, Home, End
    tablist.addEventListener('keydown', (e) => {
      const tabs = [...tablist.querySelectorAll('[role=tab]')];
      const idx = tabs.indexOf(e.target);
      if (idx < 0) return;

      let next;
      switch (e.key) {
        case 'ArrowRight': next = (idx + 1) % tabs.length; break;
        case 'ArrowLeft': next = (idx - 1 + tabs.length) % tabs.length; break;
        case 'Home': next = 0; break;
        case 'End': next = tabs.length - 1; break;
        default: return;
      }
      e.preventDefault();
      selectTab(tabs[next]);
    });

    tablist.append(indicator);

    // Insert tablist after heading wrapper (if present), otherwise at the start
    const headingWrapper = tabsContainer.querySelector(':scope > .default-content-wrapper');
    if (headingWrapper) {
      headingWrapper.after(tablist);
    } else {
      tabsContainer.prepend(tablist);
    }
  });
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  // Post-load decorations
  decorateTabSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
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
