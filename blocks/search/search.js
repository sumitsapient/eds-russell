import { fetchJSON, searchBy } from '../../scripts/content-fragments.js';
import { sampleRUM } from '../../scripts/aem.js';
/**
 * Search Block
 *
 * Unified search: input with live autocomplete suggestions AND full
 * paginated results. State is stored in the URL (?q=query) so results
 * are bookmarkable and shareable.
 *
 * Authoring structure (optional config rows):
 *
 *   | search     |                                    |
 *   | index      | /query-index.json                  |
 *   | fields     | title, description, category       |
 *   | page-size  | 10                                 |
 *   | placeholder| Search insights, topics...         |
 *
 * How it works:
 *   1. Page loads -> check window.location.search for ?q=
 *   2. If found -> populate input, run full search, render results
 *   3. User types -> 250ms debounce -> show top-5 autocomplete suggestions
 *   4. Enter / click Search -> update URL ?q=, render full paginated results
 *   5. Click suggestion -> navigate to that page directly
 *   6. Escape -> dismiss suggestions
 *   7. Arrow keys -> navigate suggestion list (accessibility)
 */
const DEFAULT_INDEX = '/query-index.json';
const DEFAULT_FIELDS = ['title', 'description', 'category'];
const DEFAULT_PAGE_SIZE = 10;
const SUGGESTION_LIMIT = 5;
const DEBOUNCE_MS = 250;
// Pages to exclude from search results (nav, footer, utility pages)
const EXCLUDED_PATHS = ['/nav', '/footer', '/header', '/drafts'];
// ── UTILITIES ─────────────────────────────────────────────────────────────────
function parseConfig(block) {
  const config = {
    index: DEFAULT_INDEX,
    fields: DEFAULT_FIELDS,
    pageSize: DEFAULT_PAGE_SIZE,
    placeholder: 'Search...',
  };
  block.querySelectorAll(':scope > div').forEach((row) => {
    const [k, v] = [...row.querySelectorAll(':scope > div')];
    const key = k?.textContent.trim().toLowerCase().replace(/\s+/g, '-');
    const val = v?.textContent.trim();
    if (key === 'index') config.index = val || DEFAULT_INDEX;
    if (key === 'fields') config.fields = val ? val.split(',').map((f) => f.trim()) : DEFAULT_FIELDS;
    if (key === 'page-size') config.pageSize = parseInt(val, 10) || DEFAULT_PAGE_SIZE;
    if (key === 'placeholder') config.placeholder = val || config.placeholder;
  });
  return config;
}
function getQuery() {
  return new URLSearchParams(window.location.search).get('q') || '';
}
function setQuery(q) {
  const url = new URL(window.location.href);
  if (q) {
    url.searchParams.set('q', q);
  } else {
    url.searchParams.delete('q');
  }
  window.history.pushState({}, '', url.toString());
}
function filterIndex(items) {
  return items.filter((item) => {
    if (!item.path) return false;
    if (item.robots === 'noindex') return false;
    return !EXCLUDED_PATHS.some((p) => item.path.startsWith(p));
  });
}
/**
 * Highlights matching query terms in a text string.
 * Returns a safe HTML string — does NOT use innerHTML directly.
 * @param {string} text
 * @param {string} query
 * @returns {string} HTML with <mark> around matches
 */
function highlight(text, query) {
  if (!text || !query) return text || '';
  const safe = text.replace(/[<>&"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;',
  }[c]));
  const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${escapedQ})`, 'gi'), '<mark>$1</mark>');
}
// ── DOM BUILDERS ──────────────────────────────────────────────────────────────
function buildInput(placeholder) {
  const wrap = document.createElement('div');
  wrap.className = 'search-input-wrap';
  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'search-input';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', 'Search');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', 'search-suggestions');
  input.setAttribute('autocomplete', 'off');
  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'search-btn button primary';
  btn.setAttribute('aria-label', 'Search');
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';
  const suggestions = document.createElement('ul');
  suggestions.id = 'search-suggestions';
  suggestions.className = 'search-suggestions';
  suggestions.setAttribute('role', 'listbox');
  suggestions.hidden = true;
  wrap.append(input, btn, suggestions);
  return {
    wrap, input, btn, suggestions,
  };
}
function buildResultCard(item, query) {
  const li = document.createElement('li');
  li.className = 'search-result';
  const a = document.createElement('a');
  a.href = item.path;
  a.className = 'search-result-link';
  const titleEl = document.createElement('h3');
  titleEl.className = 'search-result-title';
  titleEl.innerHTML = highlight(item.title || item.path, query);
  const desc = document.createElement('p');
  desc.className = 'search-result-description';
  desc.innerHTML = highlight((item.description || '').substring(0, 180), query);
  const meta = document.createElement('div');
  meta.className = 'search-result-meta';
  if (item.category) {
    const cat = document.createElement('span');
    cat.className = 'search-result-category';
    cat.textContent = item.category;
    meta.append(cat);
  }
  const path = document.createElement('span');
  path.className = 'search-result-path';
  path.textContent = item.path;
  meta.append(path);
  a.append(titleEl, desc, meta);
  li.append(a);
  return li;
}
function buildNoResults(query) {
  const p = document.createElement('p');
  p.className = 'search-no-results';
  p.textContent = `No results found for "${query}". Try different keywords.`;
  return p;
}
function buildPagination(page, totalPages, onPage) {
  const nav = document.createElement('nav');
  nav.className = 'search-pagination';
  nav.setAttribute('aria-label', 'Search results pages');
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.textContent = '← Previous';
  prev.disabled = page <= 1;
  prev.addEventListener('click', () => onPage(page - 1));
  const info = document.createElement('span');
  info.className = 'search-pagination-info';
  info.textContent = `Page ${page} of ${totalPages}`;
  const next = document.createElement('button');
  next.type = 'button';
  next.textContent = 'Next →';
  next.disabled = page >= totalPages;
  next.addEventListener('click', () => onPage(page + 1));
  nav.append(prev, info, next);
  return nav;
}
// ── BLOCK DECORATOR ───────────────────────────────────────────────────────────
export default async function decorate(block) {
  const config = parseConfig(block);
  block.textContent = '';
  // ── UI SKELETON ────────────────────────────────────────────────────────────
  const form = document.createElement('form');
  form.className = 'search-form';
  form.setAttribute('role', 'search');
  form.setAttribute('aria-label', 'Site search');
  const { wrap, input, suggestions } = buildInput(config.placeholder);
  form.append(wrap);
  block.append(form);
  const status = document.createElement('div');
  status.className = 'search-status';
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('role', 'status');
  const resultsList = document.createElement('ul');
  resultsList.className = 'search-results-list';
  resultsList.setAttribute('aria-label', 'Search results');
  const paginationWrap = document.createElement('div');
  paginationWrap.className = 'search-pagination-wrap';
  block.append(status, resultsList, paginationWrap);
  // ── DATA ────────────────────────────────────────────────────────────────────
  let allItems = [];
  let currentPage = 1;
  try {
    const raw = await fetchJSON(config.index);
    allItems = filterIndex(Array.isArray(raw) ? raw : []);
  } catch {
    status.textContent = 'Search index unavailable. Please try again later.';
    return;
  }
  // ── RENDER RESULTS ──────────────────────────────────────────────────────────
  function renderResults(query, page) {
    resultsList.textContent = '';
    paginationWrap.textContent = '';
    if (!query) {
      status.textContent = '';
      return;
    }
    const matches = searchBy(allItems, query, config.fields);
    const total = matches.length;
    const totalPages = Math.ceil(total / config.pageSize);
    const start = (page - 1) * config.pageSize;
    const pageItems = matches.slice(start, start + config.pageSize);
    if (!total) {
      status.textContent = '';
      resultsList.append(buildNoResults(query));
      return;
    }
    status.textContent = `${total} result${total === 1 ? '' : 's'} for "${query}"`;
    const frag = document.createDocumentFragment();
    pageItems.forEach((item) => frag.append(buildResultCard(item, query)));
    resultsList.append(frag);
    if (totalPages > 1) {
      paginationWrap.append(buildPagination(page, totalPages, (p) => {
        currentPage = p;
        renderResults(query, currentPage);
        block.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
    }
  }
  // ── AUTOCOMPLETE ────────────────────────────────────────────────────────────
  function showSuggestions(query) {
    suggestions.textContent = '';
    if (!query || query.length < 2) { suggestions.hidden = true; return; }
    const hits = searchBy(allItems, query, config.fields).slice(0, SUGGESTION_LIMIT);
    if (!hits.length) { suggestions.hidden = true; return; }
    hits.forEach((item, i) => {
      const li = document.createElement('li');
      li.id = `suggestion-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.className = 'search-suggestion-item';
      const title = document.createElement('span');
      title.className = 'search-suggestion-title';
      title.innerHTML = highlight(item.title || item.path, query);
      const cat = item.category ? document.createElement('span') : null;
      if (cat) {
        cat.className = 'search-suggestion-category';
        cat.textContent = item.category;
        li.append(title, cat);
      } else {
        li.append(title);
      }
      li.addEventListener('mousedown', (e) => {
        e.preventDefault(); // don't blur input
        window.location.href = item.path;
      });
      suggestions.append(li);
    });
    suggestions.hidden = false;
  }
  function hideSuggestions() {
    suggestions.hidden = true;
    input.setAttribute('aria-activedescendant', '');
  }
  // ── KEYBOARD NAVIGATION IN SUGGESTIONS ─────────────────────────────────────
  let focusedSuggestion = -1;
  function moveSuggestionFocus(dir) {
    const items = [...suggestions.querySelectorAll('[role="option"]')];
    if (!items.length) return;
    items.forEach((el) => el.setAttribute('aria-selected', 'false'));
    focusedSuggestion = Math.max(0, Math.min(items.length - 1, focusedSuggestion + dir));
    items[focusedSuggestion].setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', `suggestion-${focusedSuggestion}`);
  }
  // ── EVENT LISTENERS ─────────────────────────────────────────────────────────
  let debounceTimer;
  input.addEventListener('input', () => {
    focusedSuggestion = -1;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => showSuggestions(input.value.trim()), DEBOUNCE_MS);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSuggestionFocus(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); moveSuggestionFocus(-1); } else if (e.key === 'Escape') { hideSuggestions(); } else if (e.key === 'Enter' && focusedSuggestion >= 0 && !suggestions.hidden) {
      e.preventDefault();
      const selected = suggestions.querySelectorAll('[role="option"]')[focusedSuggestion];
      if (selected) {
        const link = allItems.find((item) => {
          const title = item.title || item.path;
          return title === selected.querySelector('.search-suggestion-title')?.textContent;
        });
        if (link) { window.location.href = link.path; }
      }
    }
  });
  input.addEventListener('blur', () => setTimeout(hideSuggestions, 150));
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) showSuggestions(input.value.trim());
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideSuggestions();
    const query = input.value.trim();
    if (!query) return;
    currentPage = 1;
    setQuery(query);
    renderResults(query, currentPage);
    sampleRUM('search', { source: 'search-block', target: query });
  });
  // ── INITIAL RENDER (from URL ?q=) ───────────────────────────────────────────
  const initialQuery = getQuery();
  if (initialQuery) {
    input.value = initialQuery;
    renderResults(initialQuery, currentPage);
  }
  // Handle browser back/forward navigation
  window.addEventListener('popstate', () => {
    const q = getQuery();
    input.value = q;
    currentPage = 1;
    renderResults(q, currentPage);
  });
}
