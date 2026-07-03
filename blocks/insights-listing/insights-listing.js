import {
  fetchJSON,
  filterBy,
  searchBy,
  sortBy,
  paginate,
  renderFragmentList,
  getPlaceholders,
  getTaxonomy,
} from '../../scripts/content-fragments.js';

/**
 * Insights Listing Block
 *
 * Reads /query-index.json and /taxonomy.json to render a filterable,
 * searchable, paginated grid of insight articles.
 *
 * Initial content structure (authored in Universal Editor):
 *
 *   | insights listing  |       |
 *   | category          | all   |   ← optional default filter
 *   | page-size         | 9     |   ← optional, default 9
 *   | sort              | date  |   ← optional: date | title
 *
 * The block reads all pages from /query-index.json where the path
 * starts with /insights/ (or the configured base path).
 */

const INSIGHTS_PATH_PREFIX = '/insights';

/**
 * Reads block configuration from the first two columns of each row.
 * @param {Element} block
 * @returns {Object} config map
 */
function readConfig(block) {
  const config = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    const [keyEl, valEl] = row.querySelectorAll(':scope > div');
    if (keyEl && valEl) {
      const key = keyEl.textContent.trim().toLowerCase().replace(/\s+/g, '-');
      config[key] = valEl.textContent.trim();
    }
  });
  return config;
}

/**
 * Renders a single insight card.
 * @param {Object} item - Query index row
 * @returns {Element} article card element
 */
function renderCard(item) {
  const card = document.createElement('article');
  card.className = 'insights-listing-card';

  const imgWrap = document.createElement('div');
  imgWrap.className = 'insights-listing-card-image';
  if (item.image) {
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.title || '';
    img.loading = 'lazy';
    img.width = 400;
    img.height = 225;
    imgWrap.append(img);
  }

  const body = document.createElement('div');
  body.className = 'insights-listing-card-body';

  if (item.category) {
    const cat = document.createElement('span');
    cat.className = 'insights-listing-card-category';
    cat.textContent = item.category;
    body.append(cat);
  }

  const title = document.createElement('h3');
  const link = document.createElement('a');
  link.href = item.path;
  link.textContent = item.title || item.path;
  title.append(link);
  body.append(title);

  if (item.description) {
    const desc = document.createElement('p');
    desc.className = 'insights-listing-card-description';
    desc.textContent = item.description;
    body.append(desc);
  }

  if (item.lastModified) {
    const date = document.createElement('time');
    date.className = 'insights-listing-card-date';
    const d = new Date(item.lastModified * 1000);
    date.dateTime = d.toISOString();
    date.textContent = d.toLocaleDateString(document.documentElement.lang || 'en', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    body.append(date);
  }

  card.append(imgWrap, body);
  return card;
}

/**
 * Renders the filter bar (category buttons).
 * @param {string[]} categories
 * @param {string} active - currently active category
 * @param {Function} onFilter - callback(category)
 * @returns {Element}
 */
function renderFilters(categories, active, onFilter) {
  const bar = document.createElement('div');
  bar.className = 'insights-listing-filters';
  bar.setAttribute('role', 'group');
  bar.setAttribute('aria-label', 'Filter by category');

  ['all', ...categories].forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'insights-listing-filter-btn';
    btn.textContent = cat === 'all' ? 'All' : cat;
    btn.dataset.category = cat;
    if (cat === active) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.setAttribute('aria-pressed', 'false');
    }
    btn.addEventListener('click', () => onFilter(cat));
    bar.append(btn);
  });
  return bar;
}

/**
 * Renders pagination controls.
 * @param {number} page - current page
 * @param {number} totalPages
 * @param {Function} onPage - callback(page)
 * @param {Object} placeholders
 * @returns {Element}
 */
function renderPagination(page, totalPages, onPage, placeholders) {
  const nav = document.createElement('nav');
  nav.className = 'insights-listing-pagination';
  nav.setAttribute('aria-label', placeholders['pagination-label'] || 'Pagination');

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.textContent = placeholders['pagination-prev'] || '← Previous';
  prev.disabled = page <= 1;
  prev.addEventListener('click', () => onPage(page - 1));

  const info = document.createElement('span');
  info.className = 'insights-listing-pagination-info';
  info.textContent = `${page} / ${totalPages}`;

  const next = document.createElement('button');
  next.type = 'button';
  next.textContent = placeholders['pagination-next'] || 'Next →';
  next.disabled = page >= totalPages;
  next.addEventListener('click', () => onPage(page + 1));

  nav.append(prev, info, next);
  return nav;
}

/**
 * Main block decorator.
 * @param {Element} block
 */
export default async function decorate(block) {
  // 1. Read config from authored content
  const config = readConfig(block);
  const pageSize = parseInt(config['page-size'] || '9', 10);
  const sortKey = config.sort === 'title' ? 'title' : 'lastModified';
  const sortOrder = sortKey === 'lastModified' ? 'desc' : 'asc';

  // 2. Clear block content — we're replacing it entirely
  block.textContent = '';

  // 3. Fetch all data in parallel
  const [allPages, taxonomy, placeholders] = await Promise.all([
    fetchJSON('/query-index.json'),
    getTaxonomy().catch(() => []),
    getPlaceholders(),
  ]);

  // 4. Filter to insights pages only
  const insightPages = allPages.filter((p) => p.path?.startsWith(INSIGHTS_PATH_PREFIX));

  // 5. Extract unique categories from taxonomy or pages
  const categories = taxonomy.length
    ? [...new Set(taxonomy.map((t) => t.name).filter(Boolean))]
    : [...new Set(insightPages.map((p) => p.category).filter(Boolean))];

  // 6. State
  let activeCategory = config.category !== 'all' ? config.category : 'all';
  let searchQuery = '';
  let currentPage = 1;

  // 7. Build UI skeleton
  const searchWrap = document.createElement('div');
  searchWrap.className = 'insights-listing-search';
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.placeholder = placeholders['search-placeholder'] || 'Search insights...';
  searchInput.setAttribute('aria-label', placeholders['search-label'] || 'Search');
  searchWrap.append(searchInput);

  const filterBar = renderFilters(
    categories,
    activeCategory,
    (cat) => { // eslint-disable-line no-use-before-define
      activeCategory = cat;
      currentPage = 1;
      render(); // eslint-disable-line no-use-before-define
    },
  );

  const grid = document.createElement('div');
  grid.className = 'insights-listing-grid';

  const paginationWrap = document.createElement('div');
  paginationWrap.className = 'insights-listing-pagination-wrap';

  block.append(searchWrap, filterBar, grid, paginationWrap);

  // 8. Render function — called on filter/search/page change
  function render() {
    // Filter and search
    let items = activeCategory === 'all'
      ? insightPages
      : filterBy(insightPages, 'category', activeCategory);
    if (searchQuery) items = searchBy(items, searchQuery, ['title', 'description', 'category']);

    // Sort
    items = sortBy(items, sortKey, sortOrder);

    // Paginate
    const result = paginate(items, currentPage, pageSize);

    // Update filter buttons aria-pressed state
    filterBar.querySelectorAll('.insights-listing-filter-btn').forEach((btn) => {
      const active = btn.dataset.category === activeCategory;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    // Render cards
    renderFragmentList(result.items, renderCard, grid);

    // Show empty state
    if (!result.items.length) {
      const empty = document.createElement('p');
      empty.className = 'insights-listing-empty';
      empty.textContent = placeholders['no-results'] || 'No results found.';
      grid.append(empty);
    }

    // Render pagination
    paginationWrap.textContent = '';
    if (result.totalPages > 1) {
      paginationWrap.append(
        renderPagination(result.page, result.totalPages, (p) => {
          currentPage = p;
          render();
          block.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, placeholders),
      );
    }
  }

  // 9. Search input listener — debounced
  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = searchInput.value;
      currentPage = 1;
      render();
    }, 300);
  });

  // 10. Initial render
  render();
}
