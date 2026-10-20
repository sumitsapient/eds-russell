/*
 * Header block
 * Reads every label, link and image from the nav fragment (nav.plain.html)
 * and builds the interactive header around it:
 *   utility bar (click toggles) | brand | hover megamenus | tools | mobile-only link cards
 * Desktop (>= 1200px): hover megamenus. Mobile: hamburger drawer with nested accordions.
 */

const isDesktop = window.matchMedia('(width >= 1200px)');
const CLOSE_DELAY = 100;

let idCounter = 0;
const nextId = (prefix) => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

/* decorative chevron used by the mobile accordion triggers */
const CHEVRON_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="9.36" viewBox="3.9 8.55 16.2 9.5" fill="none" aria-hidden="true" focusable="false"><path d="M4.29289 9.29289C4.68342 8.90237 5.31658 8.90237 5.70711 9.29289L12 15.5858L18.2929 9.29289C18.6834 8.90237 19.3166 8.90237 19.7071 9.29289C20.0976 9.68342 20.0976 10.3166 19.7071 10.7071L12.7071 17.7071C12.3166 18.0976 11.6834 18.0976 11.2929 17.7071L4.29289 10.7071C3.90237 10.3166 3.90237 9.68342 4.29289 9.29289Z" fill="currentColor" stroke="currentColor" stroke-width="0.7"/></svg>';

function createChevron() {
  const chevron = document.createElement('span');
  chevron.className = 'nav-chevron';
  chevron.innerHTML = CHEVRON_ICON;
  return chevron;
}

/* decorative arrow used by promo call-to-action links */
const ARROW_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path d="M9.99992 3.33325L8.82492 4.50825L13.4749 9.16658H3.33325V10.8333H13.4749L8.82492 15.4916L9.99992 16.6666L16.6666 9.99992L9.99992 3.33325Z" fill="currentColor"/></svg>';

/**
 * Fetches the nav fragment (metadata independent):
 * /content/nav.plain.html (local preview) first, then /nav.plain.html (DA/EDS).
 * Relative media paths are resolved against the folder the fragment came from.
 * @returns {Promise<Element[]>} top-level section elements
 */
async function fetchNavSections() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
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
 * Returns the visible label of a list item (its own text, or its first
 * non-list text element) along with the element holding it, if any.
 */
function getItemLabel(li) {
  const ownText = [...li.childNodes]
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent)
    .join(' ')
    .trim();
  if (ownText) return { text: ownText, el: null };
  const el = li.querySelector(':scope > p, :scope > strong, :scope > span');
  return { text: el ? el.textContent.trim() : '', el };
}

const isPlaceholderLink = (a) => !a.getAttribute('href') || a.getAttribute('href') === '#';

const getItemLink = (li) => li.querySelector(':scope > a, :scope > p > a, :scope > strong > a');

/* ------------------------------------------------------------------
 * Shared open/close state
 * ------------------------------------------------------------------ */

function setExpanded(trigger, panel, expanded) {
  trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  panel.hidden = !expanded;
  trigger.closest('li')?.classList.toggle('is-open', expanded);
}

function closeAll(nav, except) {
  nav.querySelectorAll('[aria-haspopup="true"][aria-expanded="true"]').forEach((trigger) => {
    if (trigger === except) return;
    const panel = nav.querySelector(`#${trigger.getAttribute('aria-controls')}`);
    if (panel) setExpanded(trigger, panel, false);
  });
}

function createTrigger(className, label, panelId) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', panelId);
  return button;
}

/* ------------------------------------------------------------------
 * Utility bar: icon + click toggles with dropdown panels
 * ------------------------------------------------------------------ */

/** Builds a grouped link grid (group heading + links with optional icons). */
function buildGroupedLinks(list) {
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-utility-groups';
  [...list.children].forEach((groupLi) => {
    const group = document.createElement('div');
    group.className = 'nav-utility-group';
    const headingLink = getItemLink(groupLi);
    const heading = document.createElement('p');
    heading.className = 'nav-utility-group-heading';
    heading.textContent = headingLink ? headingLink.textContent.trim() : getItemLabel(groupLi).text;
    group.append(heading);

    const links = document.createElement('ul');
    links.className = 'nav-utility-group-links';
    groupLi.querySelectorAll(':scope > ul > li').forEach((entryLi) => {
      const a = getItemLink(entryLi);
      if (!a) return;
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'nav-utility-link';
      link.href = a.href;
      if (a.target) link.target = a.target;
      const img = a.querySelector('img');
      if (img) {
        const icon = document.createElement('span');
        icon.className = 'nav-utility-link-icon';
        icon.append(img);
        link.append(icon);
      }
      const label = document.createElement('span');
      label.className = 'nav-utility-link-label';
      label.textContent = a.textContent.trim();
      link.append(label);
      item.append(link);
      links.append(item);
    });
    group.append(links);
    wrapper.append(group);
  });
  return wrapper;
}

/** Builds a card grid (title link + description per item). */
function buildCards(list) {
  const wrapper = document.createElement('ul');
  wrapper.className = 'nav-utility-cards';
  [...list.children].forEach((cardLi) => {
    const a = getItemLink(cardLi);
    if (!a) return;
    const item = document.createElement('li');
    const card = document.createElement('a');
    card.className = 'nav-utility-card';
    card.href = a.href;
    if (a.target) card.target = a.target;
    const title = document.createElement('span');
    title.className = 'nav-utility-card-title';
    title.textContent = a.textContent.trim();
    card.append(title);
    const desc = [...cardLi.querySelectorAll(':scope > p')].find((p) => !p.querySelector('a'));
    if (desc) {
      const text = document.createElement('span');
      text.className = 'nav-utility-card-text';
      text.textContent = desc.textContent.trim();
      card.append(text);
    }
    item.append(card);
    wrapper.append(item);
  });
  return wrapper;
}

function buildUtility(section, nav) {
  const bar = document.createElement('div');
  bar.className = 'nav-utility';
  const top = document.createElement('div');
  top.className = 'nav-utility-top';
  bar.append(top);

  const iconImg = section.querySelector(':scope > p img');
  if (iconImg) {
    const icon = document.createElement('span');
    icon.className = 'nav-utility-icon';
    icon.append(iconImg);
    top.append(icon);
  }

  // a group of disclosure buttons (not a link list) — mirrors the source's flex div
  const list = document.createElement('div');
  list.className = 'nav-utility-list';
  section.querySelectorAll(':scope > ul > li').forEach((li) => {
    const { text } = getItemLabel(li);
    const subList = li.querySelector(':scope > ul');
    const item = document.createElement('div');
    item.className = 'nav-utility-item';

    if (!subList) {
      const a = getItemLink(li);
      if (a) item.append(a);
      list.append(item);
      return;
    }

    const panelId = nextId('nav-utility-panel');
    const trigger = createTrigger('nav-utility-toggle', text, panelId);
    const panel = document.createElement('div');
    panel.className = 'nav-utility-panel';
    panel.id = panelId;
    panel.hidden = true;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', text);

    const grouped = [...subList.children].every((child) => child.querySelector(':scope > ul'));
    const inner = document.createElement('div');
    inner.className = 'nav-utility-panel-inner';
    inner.append(grouped ? buildGroupedLinks(subList) : buildCards(subList));
    panel.append(inner);

    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      closeAll(nav, trigger);
      setExpanded(trigger, panel, !expanded);
    });

    item.append(trigger, panel);
    list.append(item);
  });
  top.append(list);
  return bar;
}

/* ------------------------------------------------------------------
 * Brand + tools
 * ------------------------------------------------------------------ */

function buildBrand(section) {
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const link = section.querySelector('a');
  if (link) {
    link.className = 'nav-brand-link';
    if (!link.getAttribute('aria-label')) {
      const alt = link.querySelector('img')?.getAttribute('alt');
      if (alt) link.setAttribute('aria-label', alt);
    }
    brand.append(link);
  } else {
    brand.append(...section.childNodes);
  }
  return brand;
}

function buildTools(section) {
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  section.querySelectorAll('a').forEach((a) => {
    a.className = 'nav-tools-link';
    const alt = a.querySelector('img')?.getAttribute('alt');
    if (alt && !a.textContent.trim()) a.setAttribute('aria-label', alt);
    tools.append(a);
  });
  return tools;
}

/* ------------------------------------------------------------------
 * Megamenu panels
 * ------------------------------------------------------------------ */

/** Builds a promo card from the paragraphs (image, caption, link) of an item. */
function buildPromo(paragraphs) {
  if (!paragraphs.length) return null;
  const promo = document.createElement('div');
  promo.className = 'nav-promo';
  const media = paragraphs.find((p) => p.querySelector('img'));
  if (media) {
    const picture = media.querySelector('picture') || media.querySelector('img');
    picture.querySelectorAll('img').forEach((img) => { img.loading = 'lazy'; });
    if (picture.tagName === 'IMG') picture.loading = 'lazy';
    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'nav-promo-media';
    mediaWrap.append(picture);
    promo.append(mediaWrap);
  }

  const caption = document.createElement('div');
  caption.className = 'nav-promo-caption';
  paragraphs.filter((p) => p !== media).forEach((p) => {
    const a = p.querySelector('a');
    if (a) {
      const cta = document.createElement('a');
      cta.className = 'nav-promo-cta';
      cta.href = a.href;
      if (a.target) cta.target = a.target;
      const label = document.createElement('span');
      label.className = 'nav-promo-cta-label';
      label.textContent = a.textContent.trim();
      const arrow = document.createElement('span');
      arrow.className = 'nav-promo-cta-arrow';
      arrow.innerHTML = ARROW_ICON;
      cta.append(label, arrow);
      caption.append(cta);
    } else if (p.textContent.trim()) {
      const text = document.createElement('p');
      text.className = 'nav-promo-text';
      text.textContent = p.textContent.trim();
      caption.append(text);
    }
  });
  if (caption.children.length) promo.append(caption);
  return promo;
}

/** Activates one second-level item and shows its third-level list (if any). */
function activateSecondLevel(panel, item) {
  panel.querySelectorAll('.nav-level2-item').forEach((li) => {
    const active = li === item;
    li.classList.toggle('is-active', active);
    const link = li.querySelector('.nav-level2-link');
    if (link?.hasAttribute('aria-controls')) {
      link.setAttribute('aria-expanded', active ? 'true' : 'false');
    }
  });
  const targetId = item?.querySelector('.nav-level2-link')?.getAttribute('aria-controls');
  panel.querySelectorAll('.nav-level3-list').forEach((list) => {
    list.hidden = list.id !== targetId;
  });
}

/**
 * Desktop shows third-level lists in their own column (.nav-level3);
 * mobile nests each list under its second-level item (accordion).
 */
function placeThirdLevelLists(nav, mobile) {
  nav.querySelectorAll('.nav-panel').forEach((panel) => {
    const column = panel.querySelector('.nav-level3');
    panel.querySelectorAll('.nav-level2-link[aria-controls]').forEach((link) => {
      const list = panel.querySelector(`#${link.getAttribute('aria-controls')}`);
      if (!list) return;
      if (mobile) link.after(list);
      else column?.append(list);
    });
  });
}

/** Collapses every open second-level item (mobile accordions / desktop active column). */
function resetSecondLevel(nav) {
  nav.querySelectorAll('.nav-panel').forEach((panel) => activateSecondLevel(panel, null));
}

function buildMegamenuPanel(li, panelId, labelEl) {
  const panel = document.createElement('div');
  panel.className = 'nav-panel';
  panel.id = panelId;
  panel.hidden = true;

  const grid = document.createElement('div');
  grid.className = 'nav-panel-grid';

  const links = document.createElement('div');
  links.className = 'nav-panel-links';
  const level2 = document.createElement('ul');
  level2.className = 'nav-level2';
  const level3 = document.createElement('div');
  level3.className = 'nav-level3';

  const subList = li.querySelector(':scope > ul');
  [...(subList?.children || [])].forEach((subLi) => {
    const a = getItemLink(subLi);
    if (!a) return;
    const item = document.createElement('li');
    item.className = 'nav-level2-item';
    a.className = 'nav-level2-link';
    const label = document.createElement('span');
    label.className = 'nav-level2-label';
    label.append(...a.childNodes);
    a.append(label);
    item.append(a);

    const childList = subLi.querySelector(':scope > ul');
    if (childList) {
      const listId = nextId('nav-level3');
      childList.className = 'nav-level3-list';
      childList.id = listId;
      childList.hidden = true;
      childList.setAttribute('aria-label', a.textContent.trim());
      childList.querySelectorAll(':scope > li').forEach((childLi) => {
        childLi.className = 'nav-level3-item';
        const childLink = getItemLink(childLi);
        if (childLink) childLink.className = 'nav-level3-link';
      });
      a.classList.add('has-children');
      a.setAttribute('aria-controls', listId);
      a.setAttribute('aria-expanded', 'false');
      if (isPlaceholderLink(a)) a.setAttribute('role', 'button');
      a.append(createChevron());
      level3.append(childList);
    }

    // desktop: hover/focus swaps the third-level column;
    // mobile: tapping an item with children toggles its nested accordion (one open at a time)
    const activate = () => activateSecondLevel(panel, item);
    item.addEventListener('mouseenter', () => { if (isDesktop.matches) activate(); });
    a.addEventListener('focus', () => { if (isDesktop.matches) activate(); });
    a.addEventListener('click', (e) => {
      if (isPlaceholderLink(a)) e.preventDefault();
      if (isDesktop.matches) {
        activate();
      } else if (childList) {
        e.preventDefault();
        activateSecondLevel(panel, item.classList.contains('is-active') ? null : item);
      }
    });
    level2.append(item);
  });

  links.append(level2, level3);
  grid.append(links);

  const promoParagraphs = [...li.querySelectorAll(':scope > p')].filter((p) => p !== labelEl);
  const promo = buildPromo(promoParagraphs);
  if (promo) grid.append(promo);

  panel.append(grid);
  return panel;
}

function buildSections(section, nav) {
  const sections = document.createElement('div');
  sections.className = 'nav-sections';
  const list = document.createElement('ul');
  list.className = 'nav-menu';

  section.querySelectorAll(':scope > ul > li').forEach((li) => {
    const item = document.createElement('li');
    item.className = 'nav-menu-item';
    const { text, el: labelEl } = getItemLabel(li);

    if (!li.querySelector(':scope > ul')) {
      const a = getItemLink(li);
      if (a) {
        a.className = 'nav-menu-link';
        item.append(a);
      }
      list.append(item);
      return;
    }

    const panelId = nextId('nav-panel');
    const trigger = createTrigger('nav-menu-trigger', text, panelId);
    trigger.append(createChevron());
    const panel = buildMegamenuPanel(li, panelId, labelEl);
    item.append(trigger, panel);

    const open = () => {
      closeAll(nav, trigger);
      if (trigger.getAttribute('aria-expanded') !== 'true') {
        activateSecondLevel(panel, panel.querySelector('.nav-level2-item'));
        setExpanded(trigger, panel, true);
      }
    };
    const close = () => setExpanded(trigger, panel, false);

    let closeTimer;
    item.addEventListener('mouseenter', () => {
      if (!isDesktop.matches) return;
      clearTimeout(closeTimer);
      open();
    });
    item.addEventListener('mouseleave', () => {
      if (!isDesktop.matches) return;
      clearTimeout(closeTimer);
      closeTimer = setTimeout(close, CLOSE_DELAY);
    });

    trigger.addEventListener('click', (e) => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      // mobile: independent accordion (several sections may be open at once)
      if (!isDesktop.matches) {
        setExpanded(trigger, panel, !expanded);
        return;
      }
      // pointer clicks on desktop keep the hover-opened panel open (like source);
      // keyboard activation toggles
      const pointerOnDesktop = e.detail > 0;
      if (expanded && !pointerOnDesktop) close();
      else open();
    });

    item.addEventListener('focusout', (e) => {
      if (isDesktop.matches && e.relatedTarget && !item.contains(e.relatedTarget)) close();
    });

    list.append(item);
  });

  sections.append(list);
  return sections;
}

/* ------------------------------------------------------------------
 * Mobile-only link cards (e.g. current location / audience)
 * each list item: label paragraph, value paragraph (optional icon), link
 * ------------------------------------------------------------------ */

function buildMobileCards(section) {
  const list = document.createElement('ul');
  list.className = 'nav-mobile-cards';
  section.querySelectorAll(':scope > ul > li').forEach((li) => {
    const a = li.querySelector('a');
    if (!a) return;
    const item = document.createElement('li');
    item.className = 'nav-mobile-cards-item';
    const card = document.createElement('a');
    card.className = 'nav-mobile-card';
    card.href = a.href;
    if (a.target) card.target = a.target;

    const current = document.createElement('span');
    current.className = 'nav-mobile-card-current';
    [...li.querySelectorAll(':scope > p')].filter((p) => !p.contains(a)).forEach((p, i) => {
      const img = p.querySelector('img');
      if (!img && i === 0) {
        const label = document.createElement('span');
        label.className = 'nav-mobile-card-label';
        label.textContent = p.textContent.trim();
        current.append(label);
        return;
      }
      const value = document.createElement('span');
      value.className = 'nav-mobile-card-value';
      if (img) {
        const icon = document.createElement('span');
        icon.className = 'nav-mobile-card-icon';
        img.loading = 'lazy';
        icon.append(img);
        value.append(icon);
      }
      const text = document.createElement('span');
      text.textContent = p.textContent.trim();
      value.append(text);
      current.append(value);
    });

    const cta = document.createElement('span');
    cta.className = 'nav-mobile-card-cta';
    cta.textContent = a.textContent.trim();
    card.append(current, cta);
    item.append(card);
    list.append(item);
  });
  return list;
}

/* ------------------------------------------------------------------
 * Mobile menu toggle
 * ------------------------------------------------------------------ */

/**
 * Opens/closes the mobile drawer. Closing from the hamburger keeps the
 * accordion state (like the source); `reset` collapses everything.
 */
function toggleMenu(nav, button, force, reset = true) {
  const expanded = force !== undefined ? !force : nav.getAttribute('aria-expanded') === 'true';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  document.body.style.overflowY = (!expanded && !isDesktop.matches) ? 'hidden' : '';
  if (expanded && reset) closeAll(nav);
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const sections = await fetchNavSections();
  block.textContent = '';

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');

  // classify sections by content: brand = first section with a linked image and no list;
  // sections before it form the utility bar; the first list section after it holds the
  // megamenus; later list sections are mobile-only link cards; anything else is tools
  const brandIndex = sections.findIndex((s) => s.querySelector('a img') && !s.querySelector('ul'));
  const bar = document.createElement('div');
  bar.className = 'nav-bar';
  let menu = null;
  const mobileCards = [];

  sections.forEach((section, i) => {
    if (brandIndex > -1 && i < brandIndex) {
      nav.append(buildUtility(section, nav));
    } else if (i === brandIndex) {
      bar.append(buildBrand(section));
    } else if (!menu && section.querySelector(':scope > ul')) {
      menu = buildSections(section, nav);
      bar.append(menu);
    } else if (menu && section.querySelector(':scope > ul')) {
      mobileCards.push(buildMobileCards(section));
    } else {
      bar.append(buildTools(section));
    }
  });
  // mobile-only cards live at the bottom of the drawer (hidden on desktop)
  if (menu) menu.append(...mobileCards);

  // backdrop behind the mobile drawer (visible when the drawer is narrower than the viewport)
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  bar.prepend(overlay);

  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  const hamburgerButton = document.createElement('button');
  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', 'nav');
  hamburgerButton.setAttribute('aria-label', 'Open navigation');
  hamburgerButton.innerHTML = '<span class="nav-hamburger-icon"><span class="nav-hamburger-bar nav-hamburger-bar-top"></span><span class="nav-hamburger-bar nav-hamburger-bar-middle"></span><span class="nav-hamburger-bar nav-hamburger-bar-bottom"></span></span>';
  hamburgerButton.addEventListener('click', () => toggleMenu(nav, hamburgerButton, undefined, false));
  hamburger.append(hamburgerButton);
  bar.append(hamburger);
  nav.append(bar);

  // Escape closes open panels and returns focus to their trigger
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = nav.querySelector('[aria-haspopup="true"][aria-expanded="true"]');
    if (open) {
      closeAll(nav);
      open.focus();
    } else if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, hamburgerButton, false);
      hamburgerButton.focus();
    }
  });

  // click outside closes everything
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAll(nav);
  });

  // viewport changes between mobile and desktop: close the drawer, reset the hamburger,
  // collapse every panel/accordion and move third-level lists to the matching layout
  const applyLayout = () => {
    toggleMenu(nav, hamburgerButton, false);
    resetSecondLevel(nav);
    placeThirdLevelLists(nav, !isDesktop.matches);
  };
  applyLayout();
  isDesktop.addEventListener('change', applyLayout);

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav);
  block.append(wrapper);
}
