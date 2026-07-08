/**
 * Blog Listing block
 *
 * API base: https://publish-p146753-e1506305.adobeaemcloud.com
 * Articles: /bin/relatedarticles?limit=96&country=us&lang=en&outputHTML=false
 *            &sortParam=articlePublishDate&sortOrder=desc&offset=1&perPage=15
 *            [&author=Name]
 * Authors:  /bin/authors?country=us&lang=en
 *
 * Filtering strategy:
 *   - Author  → server-side (&author=Name, single selection)
 *   - Topics  → visual only (no topic field in API yet, TODO)
 *   - Sort    → server-side (sortParam + sortOrder)
 *   - Pagination → server-side (offset = page number)
 */
const PUB_BASE = 'https://publish-p146753-e1506305.adobeaemcloud.com';
const ARTICLES_PATH = '/bin/relatedarticles';
const AUTHORS_PATH = '/bin/authors?country=us&lang=en';
const PER_PAGE_OPTIONS = [15, 30, 45, 60];
const SORT_OPTIONS = [
  { label: 'Newest', sortParam: 'articlePublishDate', sortOrder: 'desc' },
  { label: 'Oldest', sortParam: 'articlePublishDate', sortOrder: 'asc' },
  { label: 'A to Z', sortParam: 'articleTitle', sortOrder: 'asc' },
  { label: 'Z to A', sortParam: 'articleTitle', sortOrder: 'desc' },
];
// Dummy topics — replace when API provides topic field
const DUMMY_TOPICS = [
  '2025 Policy Changes', 'Active and passive investing',
  'Active management', 'Alternatives',
  'ESG / Sustainable investing', 'Fixed income',
  'Global markets', 'Multi-asset',
  'Retirement solutions', 'Risk management',
  'Small cap', 'Technology & AI',
];
// ── State ─────────────────────────────────────────────────────────────────────
function makeState() {
  return {
    perPage: 15,
    sortParam: 'articlePublishDate',
    sortOrder: 'desc',
    offset: 1,
    selectedAuthor: '',
    selectedTopics: [],
    totalResults: 0,
    totalPages: 0,
    articles: [],
    authors: [],
    topicsExpanded: false,
    authorsExpanded: false,
    loading: false,
  };
}
// ── API ───────────────────────────────────────────────────────────────────────
function buildArticlesUrl(s) {
  const p = new URLSearchParams({
    limit: 96,
    country: 'us',
    lang: 'en',
    outputHTML: 'false',
    sortParam: s.sortParam,
    sortOrder: s.sortOrder,
    offset: s.offset,
    perPage: s.perPage,
  });
  if (s.selectedAuthor) p.append('author', s.selectedAuthor);
  return `${PUB_BASE}${ARTICLES_PATH}?${p.toString()}`;
}
async function fetchAuthors(s) {
  try {
    const res = await fetch(`${PUB_BASE}${AUTHORS_PATH}`);
    if (!res.ok) return;
    const data = await res.json();
    s.authors = Array.isArray(data)
      ? data.map((item) => Object.values(item)[0])
      : [];
  } catch {
    s.authors = [];
  }
}
async function fetchArticles(s) {
  s.loading = true;
  try {
    const res = await fetch(buildArticlesUrl(s));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    s.totalResults = data.totalResults || 0;
    s.articles = data.articles || [];
    s.totalPages = Math.ceil(s.totalResults / s.perPage);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[blog-listing]', err);
    s.articles = [];
    s.totalResults = 0;
    s.totalPages = 0;
  }
  s.loading = false;
}
// ── Helpers ───────────────────────────────────────────────────────────────────
function imgSrc(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${PUB_BASE}${path}`;
}
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function pageBtn(html, disabled, onClick) {
  const btn = el('button', 'bl-page-btn');
  btn.innerHTML = html;
  btn.disabled = disabled;
  btn.setAttribute('aria-label', btn.textContent);
  if (!disabled) btn.addEventListener('click', onClick);
  return btn;
}
// ── Renderers ─────────────────────────────────────────────────────────────────
function renderControls(block, s, refresh) {
  const bar = block.querySelector('.bl-controls');
  bar.innerHTML = '';
  bar.append(el('span', 'bl-results-count', `Results: ${s.totalResults}`));
  const right = el('div', 'bl-controls-right');
  // Results per page
  const ppLabel = el('label', 'bl-label', 'Results per page ');
  const ppSel = el('select', 'bl-select');
  PER_PAGE_OPTIONS.forEach((n) => {
    const opt = el('option', null, String(n));
    opt.value = n;
    if (n === s.perPage) opt.selected = true;
    ppSel.append(opt);
  });
  ppSel.addEventListener('change', async () => {
    s.perPage = Number(ppSel.value);
    s.offset = 1;
    await fetchArticles(s);
    refresh();
  });
  ppLabel.append(ppSel);
  // Sort by
  const sortLabel = el('label', 'bl-label', 'Sort by ');
  const sortSel = el('select', 'bl-select');
  SORT_OPTIONS.forEach((opt) => {
    const o = el('option', null, opt.label);
    o.value = `${opt.sortParam}:${opt.sortOrder}`;
    if (opt.sortParam === s.sortParam && opt.sortOrder === s.sortOrder) o.selected = true;
    sortSel.append(o);
  });
  sortSel.addEventListener('change', async () => {
    const [sp, so] = sortSel.value.split(':');
    s.sortParam = sp;
    s.sortOrder = so;
    s.offset = 1;
    await fetchArticles(s);
    refresh();
  });
  sortLabel.append(sortSel);
  right.append(ppLabel, sortLabel);
  bar.append(right);
}
function renderPagination(block, s, refresh) {
  const pag = block.querySelector('.bl-pagination');
  pag.innerHTML = '';
  if (s.totalPages <= 1) return;
  const gotoPage = async (page) => {
    s.offset = page;
    await fetchArticles(s);
    refresh();
    block.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  pag.append(pageBtn('&#171;', s.offset === 1, () => gotoPage(1)));
  pag.append(pageBtn('&#8249;', s.offset === 1, () => gotoPage(s.offset - 1)));
  const info = el('span', 'bl-page-info');
  const pageIn = el('input');
  pageIn.type = 'number';
  pageIn.className = 'bl-page-input';
  pageIn.value = s.offset;
  pageIn.min = 1;
  pageIn.max = s.totalPages;
  pageIn.addEventListener('change', () => {
    const v = Math.max(1, Math.min(s.totalPages, Number(pageIn.value)));
    gotoPage(v);
  });
  info.append(pageIn, document.createTextNode(` of ${s.totalPages}`));
  pag.append(info);
  pag.append(pageBtn('&#8250;', s.offset === s.totalPages, () => gotoPage(s.offset + 1)));
  pag.append(pageBtn('&#187;', s.offset === s.totalPages, () => gotoPage(s.totalPages)));
}
function renderFilterGroup(title, items, expanded, selectedSet, onToggle, onSeeAll) {
  const group = el('div', 'bl-filter-group');
  const header = el('div', 'bl-filter-header');
  header.append(el('h3', 'bl-filter-title', title));
  const seeAllBtn = el('button', 'bl-see-all', expanded ? 'See less' : 'See all');
  seeAllBtn.addEventListener('click', onSeeAll);
  header.append(seeAllBtn);
  group.append(header);
  const list = el('ul', 'bl-filter-list');
  const visible = expanded ? items : items.slice(0, 4);
  visible.forEach((item) => {
    const li = el('li');
    const label = el('label', 'bl-filter-item');
    const cb = el('input');
    cb.type = 'checkbox';
    cb.value = item;
    cb.checked = selectedSet.has(item);
    cb.addEventListener('change', () => onToggle(item, cb.checked));
    label.append(cb, el('span', null, item));
    li.append(label);
    list.append(li);
  });
  group.append(list);
  return group;
}
function renderFilters(block, s, refresh) {
  const aside = block.querySelector('.bl-filters');
  aside.innerHTML = '';
  // Topics (visual only — no API filter yet)
  const topicSet = new Set(s.selectedTopics);
  aside.append(renderFilterGroup(
    'Topics',
    DUMMY_TOPICS,
    s.topicsExpanded,
    topicSet,
    (topic, checked) => {
      if (checked) s.selectedTopics.push(topic);
      else s.selectedTopics = s.selectedTopics.filter((t) => t !== topic);
      renderFilters(block, s, refresh);
    },
    () => {
      s.topicsExpanded = !s.topicsExpanded;
      renderFilters(block, s, refresh);
    },
  ));
  // Authors (server-side, single selection)
  const authorSet = new Set(s.selectedAuthor ? [s.selectedAuthor] : []);
  aside.append(renderFilterGroup(
    'Authors',
    s.authors,
    s.authorsExpanded,
    authorSet,
    async (author, checked) => {
      s.selectedAuthor = checked ? author : '';
      s.offset = 1;
      await fetchArticles(s);
      refresh();
    },
    () => {
      s.authorsExpanded = !s.authorsExpanded;
      renderFilters(block, s, refresh);
    },
  ));
  // Clear All
  const clearBtn = el('button', 'bl-clear-btn', 'Clear all');
  clearBtn.addEventListener('click', async () => {
    s.selectedAuthor = '';
    s.selectedTopics = [];
    s.topicsExpanded = false;
    s.authorsExpanded = false;
    s.offset = 1;
    await fetchArticles(s);
    refresh();
  });
  aside.append(clearBtn);
}
function buildCard(article) {
  const {
    url, title, date, author, authorImgURL, authorTitle, imageURL,
  } = article;
  const card = el('article', 'bl-card');
  // Image
  const imgWrap = el('div', 'bl-card-image');
  if (imageURL) {
    const img = el('img');
    img.src = imgSrc(imageURL);
    img.alt = title || '';
    img.loading = 'lazy';
    imgWrap.append(img);
  }
  card.append(imgWrap);
  // Content
  const content = el('div', 'bl-card-content');
  if (date) content.append(el('p', 'bl-card-date', date));
  if (title) {
    const h3 = el('h3', 'bl-card-title');
    const a = el('a', null, title);
    a.href = url ? `${PUB_BASE}${url}` : '#';
    h3.append(a);
    content.append(h3);
  }
  if (author) {
    const aEl = el('div', 'bl-card-author');
    if (authorImgURL) {
      const aImg = el('img', 'bl-card-author-img');
      aImg.src = imgSrc(authorImgURL);
      aImg.alt = author;
      aImg.loading = 'lazy';
      aEl.append(aImg);
    }
    const aInfo = el('div', 'bl-card-author-info');
    aInfo.append(el('strong', 'bl-card-author-name', author));
    if (authorTitle) aInfo.append(el('span', 'bl-card-author-role', authorTitle));
    aEl.append(aInfo);
    content.append(aEl);
  }
  card.append(content);
  return card;
}
function renderCards(block, s) {
  const grid = block.querySelector('.bl-grid');
  grid.innerHTML = '';
  if (s.loading) {
    grid.append(el('div', 'bl-status', 'Loading articles...'));
    return;
  }
  if (!s.articles.length) {
    grid.append(el('div', 'bl-status', 'No articles found.'));
    return;
  }
  s.articles.forEach((a) => grid.append(buildCard(a)));
}
function renderAll(block, s) {
  renderControls(block, s, () => renderAll(block, s));
  renderPagination(block, s, () => renderAll(block, s));
  renderFilters(block, s, () => renderAll(block, s));
  renderCards(block, s);
}
// ── Entry point ───────────────────────────────────────────────────────────────
export default async function decorate(block) {
  const s = makeState();
  block.innerHTML = `
    <div class="bl-controls"></div>
    <div class="bl-pagination"></div>
    <div class="bl-body">
      <aside class="bl-filters"></aside>
      <div class="bl-grid"><div class="bl-status">Loading articles\u2026</div></div>
    </div>`;
  await Promise.all([fetchAuthors(s), fetchArticles(s)]);
  renderAll(block, s);
}
