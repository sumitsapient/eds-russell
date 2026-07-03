/**
 * redirects.js — Client-side redirect handler.
 *
 * In production the AEM CDN handles redirects from /redirects.json at the edge
 * (server-side, before any HTML is served — zero page load cost).
 *
 * This module is a FALLBACK for:
 *   - Local development (localhost — no CDN)
 *   - Any redirects the CDN misses
 *   - Soft 302 navigations triggered by JavaScript
 *
 * How it works:
 *   1. Fetches /redirects.json (cached by the browser after first load)
 *   2. Checks if the current path matches any source rule
 *   3. Performs the redirect (replaces history entry for 301, pushes for 302)
 *
 * Called from delayed.js — runs 3 seconds after page load (non-critical path).
 */

const REDIRECTS_PATH = '/redirects.json';

/**
 * Normalises a path for comparison:
 *   - lowercases
 *   - removes trailing slash (except root "/")
 *   - strips query string (redirect rules match path only)
 * @param {string} path
 * @returns {string}
 */
function normalisePath(path) {
  let p = path.toLowerCase().split('?')[0].split('#')[0];
  if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

/**
 * Fetches the redirect table and applies any matching rule
 * for the current page URL.
 *
 * Redirect types:
 *   301 — Permanent.  Use replaceState (no back-button entry).
 *         Google transfers all link equity to the destination.
 *   302 — Temporary.  Use assign (back-button works).
 *         Google keeps the original URL in its index.
 */
/**
 * Fetches and returns the full redirect table.
 * Useful for blocks that need to pre-check destinations before navigating.
 * @returns {Promise<Array<{source: string, destination: string, type: string}>>}
 */
export async function getRedirects() {
  try {
    const res = await fetch(REDIRECTS_PATH);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function applyRedirects() {
  const currentPath = normalisePath(window.location.pathname);

  let rules;
  try {
    const res = await fetch(REDIRECTS_PATH);
    if (!res.ok) return; // no redirect file — fail silently
    const json = await res.json();
    rules = json.data || [];
  } catch {
    return; // network error — fail silently, never break the page
  }

  const match = rules.find((rule) => normalisePath(rule.source) === currentPath);
  if (!match) return;

  const { destination, type } = match;
  if (!destination) return;

  // Resolve relative destinations against current origin
  const dest = destination.startsWith('http')
    ? destination
    : `${window.location.origin}${destination}`;

  if (type === '301') {
    // Permanent — replace current history entry so back button skips the old URL
    window.location.replace(dest);
  } else {
    // Temporary — preserve history
    window.location.assign(dest);
  }
}
