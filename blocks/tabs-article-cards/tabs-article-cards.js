import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// Cell order of each item row (mirrors the UE model, collapsed *Alt fields excluded)
const FIELDS = ['tab', 'eyebrow', 'image', 'text', 'authorImage', 'author', 'footer'];

let blockCount = 0;

/**
 * Returns an optimized <picture> for the first image in a cell (<picture> or bare <img> in <p>).
 * @param {Element} cell
 * @param {string} width
 */
function getPicture(cell, width) {
  const img = cell?.querySelector('img');
  if (!img || !img.getAttribute('src')) return null;
  const picture = createOptimizedPicture(img.src, img.alt || '', false, [{ width }]);
  moveInstrumentation(img, picture.querySelector('img'));
  return picture;
}

/**
 * Universal Editor: moves a field's instrumentation (on the cell, or on its single
 * child element) to the element that displays it. Elements rendered outside the card
 * also get the item's resource, so the field resolves to the right item. Fields repeated
 * on later items of the same tab (tab label, eyebrow, footer) are not rendered; they stay
 * editable in the properties panel of the selected card.
 * @param {Element} cell
 * @param {Element} target
 * @param {string} [resource] the item's data-aue-resource
 */
function moveField(cell, target, resource) {
  if (!cell || !target) return;
  const hasField = cell.matches('[data-aue-prop]') || !!cell.querySelector('[data-aue-prop]');
  moveInstrumentation(cell, target);
  if (cell.children.length === 1) moveInstrumentation(cell.firstElementChild, target);
  // fields left on inner elements (e.g. a link) also resolve through the target's resource
  if (resource && hasField) target.dataset.aueResource = resource;
}

/**
 * True when a cell has meaningful content (text or an image).
 * @param {Element} cell
 */
function hasContent(cell) {
  return !!cell && (!!cell.textContent.trim() || !!cell.querySelector('img'));
}

/**
 * True when a paragraph holds only a single link.
 * @param {Element} el
 */
function isLinkOnly(el) {
  if (el.tagName !== 'P') return false;
  const links = el.querySelectorAll('a');
  return links.length === 1 && el.textContent.trim() === links[0].textContent.trim();
}

/**
 * Builds one article card from an item row's named cells.
 * @param {Object<string, Element>} cells
 */
function buildCard(cells, row) {
  const card = document.createElement('li');
  card.className = 'tabs-article-cards-card';
  moveInstrumentation(row, card);

  const picture = getPicture(cells.image, '750');
  if (picture) {
    const media = document.createElement('div');
    media.className = 'tabs-article-cards-card-image';
    moveInstrumentation(cells.image, media);
    media.append(picture);
    card.append(media);
  }

  const body = document.createElement('div');
  body.className = 'tabs-article-cards-card-body';
  if (cells.text) {
    // Universal Editor: keep the instrumented text cell as its own richtext editable,
    // so the author byline below is not part of the text field
    const textTarget = cells.text.hasAttribute('data-aue-prop') ? cells.text : body;
    if (textTarget !== body) {
      textTarget.className = 'tabs-article-cards-card-text';
      body.append(textTarget);
    }
    let headingSeen = false;
    [...cells.text.children].forEach((el) => {
      if (el.querySelector('img') && !el.textContent.trim()) {
        if (textTarget !== body) el.remove();
        return;
      }
      if (/^H[1-6]$/.test(el.tagName)) {
        el.classList.add(headingSeen ? 'tabs-article-cards-card-subtitle' : 'tabs-article-cards-card-title');
        headingSeen = true;
      } else if (isLinkOnly(el)) {
        el.classList.add('tabs-article-cards-card-cta');
        el.querySelector('a').classList.add('link-arrow');
      } else {
        el.classList.add(headingSeen ? 'tabs-article-cards-card-description' : 'tabs-article-cards-card-meta');
      }
      textTarget.append(el);
    });
  }

  const avatar = getPicture(cells.authorImage, '120');
  const authorEls = cells.author
    ? [...cells.author.children].filter((el) => el.textContent.trim())
    : [];
  if (avatar || authorEls.length) {
    card.classList.add('tabs-article-cards-card-bylined');
    const author = document.createElement('div');
    author.className = 'tabs-article-cards-card-author';
    if (avatar) {
      const avatarWrap = document.createElement('div');
      avatarWrap.className = 'tabs-article-cards-card-avatar';
      moveInstrumentation(cells.authorImage, avatarWrap);
      avatarWrap.append(avatar);
      author.append(avatarWrap);
    }
    if (authorEls.length) {
      const text = document.createElement('div');
      text.className = 'tabs-article-cards-card-author-text';
      moveInstrumentation(cells.author, text);
      text.append(...authorEls);
      author.append(text);
    }
    body.append(author);
  }

  card.append(body);
  return card;
}

/**
 * Activates one tab and its panel, and shows that tab's eyebrow.
 * @param {HTMLButtonElement[]} tabs
 * @param {HTMLElement[]} panels
 * @param {HTMLElement[]} eyebrows one entry per tab (null when the tab has none)
 * @param {number} index
 * @param {boolean} focus
 */
function selectTab(tabs, panels, eyebrows, index, focus = false) {
  tabs.forEach((tab, i) => {
    const active = i === index;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    panels[i].hidden = !active;
    if (eyebrows[i]) eyebrows[i].hidden = !active;
  });
  // drives the sliding active-tab indicator in CSS
  tabs[index].parentElement.style.setProperty('--tab-index', index);
  if (focus) tabs[index].focus();
}

/**
 * Tabs of article cards. Each row is one card:
 * tab | eyebrow | image | text | authorImage | author | footer.
 * Rows are grouped into tabs by their tab label (order of first appearance);
 * per tab, the first non-empty eyebrow and footer win.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  blockCount += 1;
  const prefix = `tabs-article-cards-${blockCount}`;

  const groups = new Map();
  [...block.children].forEach((row) => {
    const cellEls = [...row.children];
    if (!cellEls.length) return;
    const cells = {};
    FIELDS.forEach((name, i) => { cells[name] = cellEls[i] || null; });

    const label = cells.tab?.textContent.trim() || 'Articles';
    const resource = row.dataset.aueResource;
    if (!groups.has(label)) {
      groups.set(label, {
        eyebrow: null, footer: null, cards: [], tabCell: cells.tab, tabResource: resource,
      });
    }
    const group = groups.get(label);

    if (!group.eyebrow && cells.eyebrow?.textContent.trim()) {
      group.eyebrow = cells.eyebrow.textContent.trim();
      group.eyebrowCell = cells.eyebrow;
      group.eyebrowResource = resource;
    }
    if (!group.footer && hasContent(cells.footer)) {
      group.footer = cells.footer;
      group.footerResource = resource;
    }
    // keep empty items that Universal Editor instruments, so authors can still select them
    if (hasContent(cells.image) || hasContent(cells.text) || hasContent(cells.author)
      || (resource && !hasContent(cells.tab) && !hasContent(cells.eyebrow)
        && !hasContent(cells.footer))) {
      group.cards.push(buildCard(cells, row));
    }
  });

  if (!groups.size) return;

  // header row: active tab's eyebrow on the left, tab toggle on the right
  const header = document.createElement('div');
  header.className = 'tabs-article-cards-header';

  const tablist = document.createElement('div');
  tablist.className = 'tabs-article-cards-tablist';
  tablist.setAttribute('role', 'tablist');
  tablist.style.setProperty('--tab-count', groups.size);

  const panelsWrap = document.createElement('div');
  panelsWrap.className = 'tabs-article-cards-panels';

  const tabs = [];
  const panels = [];
  const eyebrows = [];

  [...groups.entries()].forEach(([label, group], i) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tabs-article-cards-tab';
    tab.id = `${prefix}-tab-${i}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `${prefix}-panel-${i}`);
    tab.textContent = label;
    moveField(group.tabCell, tab, group.tabResource);

    const panel = document.createElement('div');
    panel.className = 'tabs-article-cards-panel';
    panel.id = `${prefix}-panel-${i}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;

    let eyebrow = null;
    if (group.eyebrow) {
      eyebrow = document.createElement('p');
      eyebrow.className = 'tabs-article-cards-eyebrow';
      eyebrow.textContent = group.eyebrow;
      moveField(group.eyebrowCell, eyebrow, group.eyebrowResource);
      header.append(eyebrow);
    }

    const list = document.createElement('ul');
    list.className = 'tabs-article-cards-list';
    // cards with author bylines use the featured layout (lead card + compact list)
    if (group.cards.some((card) => card.classList.contains('tabs-article-cards-card-bylined'))) {
      list.classList.add('tabs-article-cards-list-featured');
    }
    list.append(...group.cards);
    panel.append(list);

    if (group.footer) {
      const footer = document.createElement('div');
      footer.className = 'tabs-article-cards-panel-footer';
      moveField(group.footer, footer, group.footerResource);
      footer.append(...group.footer.childNodes);
      panel.append(footer);
    }

    tabs.push(tab);
    panels.push(panel);
    eyebrows.push(eyebrow);
    tablist.append(tab);
    panelsWrap.append(panel);
  });

  header.append(tablist);

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tabs, panels, eyebrows, i));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next !== null) {
        e.preventDefault();
        selectTab(tabs, panels, eyebrows, next, true);
      }
    });
  });

  selectTab(tabs, panels, eyebrows, 0);
  block.replaceChildren(header, panelsWrap);
}
