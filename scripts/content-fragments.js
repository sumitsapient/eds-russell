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
  const params = Object.keys(variables).length
    ? `?${new URLSearchParams(Object.entries(variables).map(([k, v]) => [k, String(v)])).toString()}`
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
