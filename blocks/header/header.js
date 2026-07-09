import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const isDesktop = window.matchMedia('(min-width: 900px)');

/* ─────────────────────────────────────────────
   Utility Bar  (Section 0 of /nav)
   ───────────────────────────────────────────── */
function buildUtilityBar(section) {
  const bar = document.createElement('div');
  bar.className = 'header-utility';
  bar.setAttribute('role', 'navigation');
  bar.setAttribute('aria-label', 'Utility navigation');
  if (section) {
    const inner = document.createElement('div');
    inner.className = 'header-utility-inner';
    const wrapper = section.querySelector('.default-content-wrapper') || section;
    inner.innerHTML = wrapper.innerHTML;
    bar.append(inner);
  }
  return bar;
}

/* ─────────────────────────────────────────────
   Brand / Logo  (Section 1 of /nav)
   ───────────────────────────────────────────── */
function buildBrand(section) {
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (section) {
    const wrapper = section.querySelector('.default-content-wrapper') || section;
    brand.innerHTML = wrapper.innerHTML;
    brand.querySelectorAll('.button').forEach((b) => b.classList.remove('button'));
    brand.querySelectorAll('.button-container').forEach((c) => c.classList.remove('button-container'));
  }
  return brand;
}

/* WeakMap to associate L2 items with their pre-built L3 panels */
const l3PanelMap = new WeakMap();

/* ─────────────────────────────────────────────
   L2 activation → swaps the L3 panel
   ───────────────────────────────────────────── */
function activateL2(l2Item, allL2Items, l3Container) {
  allL2Items.forEach((item) => {
    item.classList.remove('active');
    item.setAttribute('aria-selected', 'false');
  });
  l2Item.classList.add('active');
  l2Item.setAttribute('aria-selected', 'true');
  l3Container.innerHTML = '';
  const panel = l3PanelMap.get(l2Item);
  if (panel) {
    l3Container.append(panel.cloneNode(true));
  }
}

/* ─────────────────────────────────────────────
   Mega-menu  (3 columns: L2 sidebar | L3 panel | optional promo)
   ───────────────────────────────────────────── */
function buildMegaMenu(l1li) {
  const l2Source = l1li.querySelector(':scope > ul');
  if (!l2Source) return null;

  const megaMenu = document.createElement('div');
  megaMenu.className = 'nav-mega-menu';

  const inner = document.createElement('div');
  inner.className = 'nav-mega-inner';

  /* Left column – L2 sidebar */
  const l2Col = document.createElement('ul');
  l2Col.className = 'nav-l2';
  l2Col.setAttribute('role', 'tablist');
  l2Col.setAttribute('aria-label', 'Sub-navigation');

  /* Middle column – L3 panel (content swapped on L2 hover) */
  const l3Col = document.createElement('div');
  l3Col.className = 'nav-l3';
  l3Col.setAttribute('role', 'tabpanel');

  const allL2Items = [];
  let firstL2Item = null;
  let promoEl = null;

  l2Source.querySelectorAll(':scope > li').forEach((l2li) => {
    /* ── Detect promo item: <li> whose first meaningful child is a <picture>/<img> ── */
    const hasPicture = !!l2li.querySelector(':scope > picture, :scope > img');
    if (hasPicture) {
      const promo = document.createElement('div');
      promo.className = 'nav-promo';

      const imgWrap = document.createElement('div');
      imgWrap.className = 'nav-promo-img';
      const picture = l2li.querySelector('picture');
      const img = l2li.querySelector('img');
      imgWrap.append(picture ? picture.cloneNode(true) : img.cloneNode(true));
      promo.append(imgWrap);

      const content = document.createElement('div');
      content.className = 'nav-promo-content';
      l2li.querySelectorAll('p').forEach((p) => content.append(p.cloneNode(true)));
      content.querySelectorAll('a').forEach((a) => a.classList.add('nav-promo-cta'));
      promo.append(content);

      promoEl = promo;
      return; // skip adding to L2 list
    }

    /* ── Regular L2 item ── */
    const l2Item = document.createElement('li');
    l2Item.className = 'nav-l2-item';
    l2Item.setAttribute('role', 'tab');
    l2Item.setAttribute('tabindex', '0');
    l2Item.setAttribute('aria-selected', 'false');

    const sourceLink = l2li.querySelector(':scope > a');
    const label = sourceLink
      ? sourceLink.textContent.trim()
      : (l2li.childNodes[0]?.textContent?.trim() || '');
    if (sourceLink) l2Item.dataset.href = sourceLink.getAttribute('href');

    const labelSpan = document.createElement('span');
    labelSpan.className = 'nav-l2-label';
    labelSpan.textContent = label;
    l2Item.append(labelSpan);

    /* Build the L3 panel for this L2 entry */
    const l3Source = l2li.querySelector(':scope > ul');
    if (l3Source) {
      const arrowSpan = document.createElement('span');
      arrowSpan.className = 'nav-l2-arrow';
      arrowSpan.setAttribute('aria-hidden', 'true');
      l2Item.append(arrowSpan);

      const l3Panel = document.createElement('ul');
      l3Panel.className = 'nav-l3-list';
      l3Source.querySelectorAll(':scope > li').forEach((l3li) => {
        const l3Item = document.createElement('li');
        l3Item.className = 'nav-l3-item';
        const l3Link = l3li.querySelector('a');
        if (l3Link) {
          const a = document.createElement('a');
          a.href = l3Link.getAttribute('href');
          a.textContent = l3Link.textContent.trim();
          l3Item.append(a);
        } else {
          l3Item.textContent = l3li.textContent.trim();
        }
        l3Panel.append(l3Item);
      });
      l3PanelMap.set(l2Item, l3Panel);
    }

    /* Events */
    l2Item.addEventListener('mouseenter', () => activateL2(l2Item, allL2Items, l3Col));
    l2Item.addEventListener('focus', () => activateL2(l2Item, allL2Items, l3Col));
    l2Item.addEventListener('click', () => {
      if (l2Item.dataset.href) window.location.href = l2Item.dataset.href;
    });
    l2Item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && l2Item.dataset.href) window.location.href = l2Item.dataset.href;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        l2Item.nextElementSibling?.focus();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        l2Item.previousElementSibling?.focus();
      }
    });

    l2Col.append(l2Item);
    allL2Items.push(l2Item);
    if (!firstL2Item) firstL2Item = l2Item;
  });

  /* Activate first L2 by default */
  if (firstL2Item) {
    firstL2Item.classList.add('active');
    firstL2Item.setAttribute('aria-selected', 'true');
    const firstPanel = l3PanelMap.get(firstL2Item);
    if (firstPanel) l3Col.append(firstPanel.cloneNode(true));
  }

  inner.append(l2Col, l3Col);
  if (promoEl) {
    inner.classList.add('has-promo');
    inner.append(promoEl);
  }
  megaMenu.append(inner);
  return megaMenu;
}

/* ─────────────────────────────────────────────
   Nav Sections  (Section 2 of /nav)
   ───────────────────────────────────────────── */
function buildNavSections(section) {
  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';
  if (!section) return navSections;

  /* The <ul> may be direct child of .default-content-wrapper,
     or nested inside a text block wrapper (<div class="text block">) */
  const sourceUL = section.querySelector('ul');
  if (!sourceUL) return navSections;

  const navUL = document.createElement('ul');
  navUL.className = 'nav-items';
  navUL.setAttribute('role', 'menubar');

  sourceUL.querySelectorAll(':scope > li').forEach((l1li) => {
    const navItem = document.createElement('li');
    navItem.className = 'nav-item';
    navItem.setAttribute('role', 'none');

    const sourceLink = l1li.querySelector(':scope > a');
    const label = sourceLink
      ? sourceLink.textContent.trim()
      : (l1li.childNodes[0]?.textContent?.trim() || '');
    const href = sourceLink ? sourceLink.getAttribute('href') : '#';

    const a = document.createElement('a');
    a.className = 'nav-item-link';
    a.href = href;
    a.textContent = label;
    a.setAttribute('role', 'menuitem');
    navItem.append(a);

    const megaMenu = buildMegaMenu(l1li);
    if (megaMenu) {
      navItem.classList.add('has-dropdown');
      navItem.setAttribute('aria-expanded', 'false');
      a.setAttribute('aria-haspopup', 'true');
      navItem.append(megaMenu);

      const openMenu = () => {
        /* Close all other open items first */
        navUL.querySelectorAll('.nav-item[aria-expanded="true"]').forEach((other) => {
          if (other !== navItem) other.setAttribute('aria-expanded', 'false');
        });
        navItem.setAttribute('aria-expanded', 'true');
      };
      const closeMenu = () => navItem.setAttribute('aria-expanded', 'false');

      navItem.addEventListener('mouseenter', openMenu);
      navItem.addEventListener('mouseleave', closeMenu);

      /* On desktop, the L1 link opens the dropdown instead of navigating */
      a.addEventListener('click', (e) => {
        if (isDesktop.matches) {
          e.preventDefault();
          const isOpen = navItem.getAttribute('aria-expanded') === 'true';
          if (isOpen) closeMenu();
          else openMenu();
        }
      });

      a.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const isOpen = navItem.getAttribute('aria-expanded') === 'true';
          if (isOpen) closeMenu();
          else openMenu();
        }
      });
    }

    navUL.append(navItem);
  });

  navSections.append(navUL);
  return navSections;
}

/* ─────────────────────────────────────────────
   Tools / Search button
   ───────────────────────────────────────────── */
function buildNavTools() {
  const tools = document.createElement('div');
  tools.className = 'nav-tools';

  const searchBtn = document.createElement('button');
  searchBtn.className = 'nav-search-btn';
  searchBtn.setAttribute('type', 'button');
  searchBtn.setAttribute('aria-label', 'Open search');
  /* Inline search icon SVG (no external dependency) */
  searchBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true" focusable="false">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>`;
  tools.append(searchBtn);
  return tools;
}

/* ─────────────────────────────────────────────
   Mobile hamburger toggle
   ───────────────────────────────────────────── */
function toggleMobileMenu(nav, forceOpen) {
  const isOpen = forceOpen !== undefined
    ? forceOpen
    : nav.getAttribute('aria-expanded') !== 'true';

  nav.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  document.body.style.overflowY = isOpen ? 'hidden' : '';

  const btn = nav.querySelector('.nav-hamburger');
  if (btn) {
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    btn.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  }
}

/* ─────────────────────────────────────────────
   Main decorate function
   ───────────────────────────────────────────── */
/**
 * Loads and decorates the header block with Russell Investments navigation.
 * The nav structure is authored on the /nav page as 4 sections:
 *   0 – Utility bar  (country / audience selector)
 *   1 – Brand        (logo linked to /)
 *   2 – Nav links    (3-level nested <ul>)
 *   3 – Tools        (search link)
 *
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';

  const sections = fragment ? [...fragment.children] : [];

  /*
   * Locate sections by CONTENT rather than fixed index so the header
   * keeps working even if the author adds/removes a section on /nav.
   *
   * Detection rules:
   *   utility  – first section that has no <img> and no <ul>
   *   brand    – first section containing an <img>
   *   nav      – first section containing a <ul>
   *   tools    – falls through to whatever is left (last section)
   */
  const brandSection = sections.find((s) => s.querySelector('img'));
  const navLinkSection = sections.find((s) => s.querySelector('ul'));
  const utilitySection = sections.find((s) => s !== brandSection && s !== navLinkSection);
  const toolsSection = sections[sections.length - 1];

  /* ── Utility bar (sits above the sticky nav bar) ── */
  const utilityBar = buildUtilityBar(utilitySection);

  /* ── Main <nav> element ── */
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');
  nav.setAttribute('aria-expanded', 'false');

  const navBrand = buildBrand(brandSection);
  const navSections = buildNavSections(navLinkSection);
  const navTools = buildNavTools();

  /* ── Hamburger (mobile only) ── */
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('type', 'button');
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.setAttribute('aria-controls', 'nav');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span class="nav-hamburger-icon" aria-hidden="true"></span>';
  hamburger.addEventListener('click', () => toggleMobileMenu(nav));

  nav.append(hamburger, navBrand, navSections, navTools);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);

  block.append(utilityBar, navWrapper);

  /* ── Global close behaviours ── */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      nav.querySelectorAll('.nav-item[aria-expanded="true"]').forEach((item) => {
        item.setAttribute('aria-expanded', 'false');
      });
      if (!isDesktop.matches) toggleMobileMenu(nav, false);
    }
  });

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      nav.querySelectorAll('.nav-item[aria-expanded="true"]').forEach((item) => {
        item.setAttribute('aria-expanded', 'false');
      });
    }
  });

  isDesktop.addEventListener('change', () => {
    if (isDesktop.matches) toggleMobileMenu(nav, false);
  });
}
