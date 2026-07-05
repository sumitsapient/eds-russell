/**
 * Content Fragments API client.
 * Fetches structured content from AEM via GraphQL persisted queries or REST endpoints.
 */

const CF_CACHE = new Map();
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

function getAEMEndpoint() {
  const meta = document.querySelector('meta[name="aem-endpoint"]');
  return meta?.content || '';
}

/**
 * Fetches Content Fragment data from a GraphQL persisted query.
 * @param {string} queryPath - Persisted query path (e.g., '/my-project/articles')
 * @param {Object} [variables={}] - GraphQL variables
 * @param {Object} [options={}] - { cacheTTL, noCache }
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function fetchContentFragments(queryPath, variables = {}, options = {}) {
  const { cacheTTL = DEFAULT_CACHE_TTL, noCache = false } = options;
  const cacheKey = `cf:${queryPath}:${JSON.stringify(variables)}`;
  if (!noCache) {
    const cached = CF_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTTL) return cached.data;
  }
  const endpoint = getAEMEndpoint();
  const paramEntries = Object.entries(variables).map(([k, v]) => [k, String(v)]);
  const params = paramEntries.length
    ? `?${new URLSearchParams(paramEntries).toString()}`
    : '';
  const url = `${endpoint}/graphql/execute.json${queryPath}${params}`;
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
  if (!response.ok) throw new Error(`CF fetch failed: ${response.status}`);
  const data = await response.json();
  CF_CACHE.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

/**
 * Fetches data from a JSON endpoint (spreadsheets, query index, etc.).
 * @param {string} path - Path to the JSON endpoint
 * @param {Object} [options={}] - { cacheTTL, noCache }
 * @returns {Promise<Array>} Array of data items
 */
export async function fetchJSON(path, options = {}) {
  const { cacheTTL = DEFAULT_CACHE_TTL, noCache = false } = options;
  const cacheKey = `json:${path}`;
  if (!noCache) {
    const cached = CF_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTTL) return cached.data;
  }
  const response = await fetch(path);
  if (!response.ok) throw new Error(`JSON fetch failed: ${response.status}`);
  const json = await response.json();
  const data = json.data || json;
  CF_CACHE.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

/**
 * Fetches the placeholders key-value map for the current locale.
 * Falls back to /placeholders.json if no locale-specific file exists.
 *
 * @returns {Promise<Record<string, string>>} Map of key → value
 *
 * @example
 * const p = await getPlaceholders();
 * btn.textContent = p['cta-learn-more'] || 'Learn More';
 */
export async function getPlaceholders() {
  // Detect locale from URL (e.g. /fr/page → 'fr')
  const [, first] = window.location.pathname.split('/');
  const supported = ['en', 'fr', 'de', 'es', 'it', 'ja', 'ko', 'zh', 'ar', 'he', 'pt', 'nl'];
  const locale = supported.includes(first) ? first : null;

  // Try locale-specific first, fall back to root
  const primary = locale ? `/${locale}/placeholders.json` : null;
  const fallback = '/placeholders.json';

  const toMap = (data) => Object.fromEntries(
    (Array.isArray(data) ? data : []).map(({ key, value }) => [key, value]),
  );

  const tryFetch = (path) => fetchJSON(path).then(toMap).catch(() => null);

  const result = primary ? await tryFetch(primary) : null;
  if (result && Object.keys(result).length) return result;
  return (await tryFetch(fallback)) || {};
}

/**
 * Fetches the taxonomy hierarchy.
 * @returns {Promise<Array>} Array of taxonomy items
 */
export async function getTaxonomy() {
  return fetchJSON('/taxonomy.json');
}

/**
 * Renders items into a container using a render function.
 * @param {Array} items - Data items
 * @param {Function} renderItem - Returns an Element per item
 * @param {Element} container - Target container
 */
export function renderFragmentList(items, renderItem, container) {
  const fragment = document.createDocumentFragment();
  items.forEach((item) => {
    const el = renderItem(item);
    if (el) fragment.append(el);
  });
  container.textContent = '';
  container.append(fragment);
}

/**
 * Paginates an array of items.
 * @param {Array} items - All items
 * @param {number} [page=1] - Current page (1-based)
 * @param {number} [pageSize=10] - Items per page
 * @returns {{ items: Array, page: number, totalPages: number, total: number }}
 */
export function paginate(items, page = 1, pageSize = 10) {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const start = (currentPage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize), page: currentPage, totalPages, total,
  };
}

/**
 * Filters items by a key-value match.
 * @param {Array} items - Data items
 * @param {string} key - Property to filter on
 * @param {string} value - Value to match
 * @returns {Array} Filtered items
 */
export function filterBy(items, key, value) {
  if (!value) return items;
  return items.filter((item) => {
    const v = item[key];
    if (Array.isArray(v)) return v.includes(value);
    return String(v).toLowerCase() === String(value).toLowerCase();
  });
}

/**
 * Searches items across multiple fields for a query string.
 * Case-insensitive. Matches partial strings.
 *
 * @param {Array} items - Data items
 * @param {string} query - Search query
 * @param {string[]} [fields=['title','description']] - Fields to search in
 * @returns {Array} Matching items
 *
 * @example
 * const results = searchBy(allArticles, 'equity', ['title', 'description', 'category']);
 */
export function searchBy(items, query, fields = ['title', 'description']) {
  if (!query || !query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter((item) => fields.some((field) => {
    const val = item[field];
    if (!val) return false;
    return String(val).toLowerCase().includes(q);
  }));
}

/**
 * Sorts items by a property.
 * @param {Array} items - Data items
 * @param {string} key - Property to sort by
 * @param {'asc'|'desc'} [order='asc'] - Sort direction
 * @returns {Array} Sorted items (new array)
 */
export function sortBy(items, key, order = 'asc') {
  return [...items].sort((a, b) => {
    const cmp = String(a[key] ?? '').localeCompare(String(b[key] ?? ''), undefined, { numeric: true });
    return order === 'desc' ? -cmp : cmp;
  });
}

/** Clears the in-memory cache. */
export function clearCache() { CF_CACHE.clear(); }

// =============================================================================
// GRAPHQL RESPONSE HELPERS
// =============================================================================

/**
 * Extracts items from a standard AEM GraphQL list/byPath/paginated response.
 *
 * AEM GraphQL responses follow a predictable naming convention:
 *   List query:      data.teamMemberList.items          → Array
 *   ByPath query:    data.teamMemberByPath.item         → single Object (wrapped in Array)
 *   Paginated query: data.teamMemberPaginated.edges[].node → Array
 *
 * This helper handles all three patterns so blocks don't need to know
 * which query type was used.
 *
 * @param {Object} response - Raw GraphQL response from fetchContentFragments()
 * @returns {Array} Flat array of CF item objects
 *
 * @example
 * const response = await fetchContentFragments('/my-project/team-members');
 * const members = extractCFItems(response);
 * // members = [{ name: 'John', role: 'PM', ... }, ...]
 */
export function extractCFItems(response) {
  if (!response?.data) return [];

  const keys = Object.keys(response.data);

  // Pattern 1: {Model}List → { items: [...] }
  const listKey = keys.find((k) => k.endsWith('List'));
  if (listKey) return response.data[listKey]?.items || [];

  // Pattern 2: {Model}Paginated → { edges: [{ node: {...} }] }
  const paginatedKey = keys.find((k) => k.endsWith('Paginated'));
  if (paginatedKey) {
    return (response.data[paginatedKey]?.edges || []).map((e) => e.node).filter(Boolean);
  }

  // Pattern 3: {Model}ByPath → { item: {...} }
  const byPathKey = keys.find((k) => k.endsWith('ByPath'));
  if (byPathKey) {
    const item = response.data[byPathKey]?.item;
    return item ? [item] : [];
  }

  return [];
}

/**
 * Resolves an AEM DAM asset URL from a CF image reference.
 *
 * CF image fields return an object like:
 *   { _path: "/content/dam/project/photo.jpg", _publishUrl: "https://publish-p.../photo.jpg" }
 *
 * Strategy:
 *   1. Use _publishUrl if available (production publish)
 *   2. Fall back to {aem-endpoint}{_path} (preview / author)
 *   3. Return '' if no image data
 *
 * @param {Object|null} imageRef - The image reference object from GraphQL
 * @returns {string} Absolute image URL or empty string
 */
export function resolveCFImageUrl(imageRef) {
  if (!imageRef) return '';
  if (imageRef._publishUrl) return imageRef._publishUrl; // eslint-disable-line no-underscore-dangle
  if (imageRef._path) { // eslint-disable-line no-underscore-dangle
    const endpoint = document.querySelector('meta[name="aem-endpoint"]')?.content || '';
    return `${endpoint}${imageRef._path}`; // eslint-disable-line no-underscore-dangle
  }
  return '';
}
