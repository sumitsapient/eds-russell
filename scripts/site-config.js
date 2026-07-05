/**
 * site-config.js - Site-wide configuration read from a spreadsheet.
 *
 * Reads /site-config.json (an AEM Spreadsheet page at path /site-config).
 * Authors manage site settings WITHOUT code deploys by editing the spreadsheet.
 *
 * Spreadsheet structure (create in Universal Editor using Spreadsheet template):
 *
 *   | key              | value                    |
 *   | theme            | dark                     |
 *   | logo             | /media/logo.svg          |
 *   | logo-alt         | Russell Investments      |
 *   | header-variant   | minimal                  |
 *   | footer-variant   | compact                  |
 *   | site-name        | Russell Investments      |
 *   | brand            | russell                  |
 *   | search-enabled   | true                     |
 *   | social-linkedin  | https://linkedin.com/... |
 *   | social-twitter   | https://twitter.com/...  |
 *
 * Usage in blocks:
 *   import { getSiteConfig } from '../../scripts/site-config.js';
 *   const config = await getSiteConfig();
 *   if (config.theme === 'dark') { ... }
 *
 * Multi-site usage:
 *   Each site mount in fstab.yaml points to a different AEM content path.
 *   Each content path can have its own /site-config spreadsheet.
 *   Code is shared; only content (and thus config) differs per brand.
 */
const CONFIG_PATH = '/site-config.json';
const CONFIG_CACHE_KEY = 'site-config-v1';
const CONFIG_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let configPromise = null;
/**
 * Converts a flat key-value array from a spreadsheet into a plain object.
 * @param {Array} data - Array of {key, value} rows
 * @returns {Object}
 */
function rowsToObject(data) {
  return Object.fromEntries(
    (Array.isArray(data) ? data : []).map(({ key, value }) => [key, value]),
  );
}
/**
 * Fetches and caches the site configuration spreadsheet.
 * Returns an empty object gracefully if the spreadsheet doesn't exist yet.
 *
 * @returns {Promise<Object>} Map of config key -> value
 */
export async function getSiteConfig() {
  if (configPromise) return configPromise;
  // Check sessionStorage cache first
  try {
    const cached = sessionStorage.getItem(CONFIG_CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CONFIG_CACHE_TTL) {
        configPromise = Promise.resolve(data);
        return configPromise;
      }
    }
  } catch {
    // sessionStorage not available (private browsing, etc.)
  }
  configPromise = fetch(CONFIG_PATH)
    .then((res) => {
      if (!res.ok) return {};
      return res.json();
    })
    .then((json) => {
      const data = rowsToObject(json.data || json);
      try {
        sessionStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
      } catch { /* ignore */ }
      return data;
    })
    .catch(() => ({}));
  return configPromise;
}
/**
 * Gets a single config value by key.
 * Merges page-level metadata (higher priority) with site-config.json.
 *
 * Priority order:
 *   1. <meta name="key"> on the current page  (page-level override)
 *   2. /site-config.json                       (site-level default)
 *   3. fallback value                          (hardcoded default)
 *
 * @param {string} key - Config key
 * @param {string} [fallback=''] - Default if not found
 * @returns {Promise<string>}
 */
export async function getConfigValue(key, fallback = '') {
  // Page metadata takes priority (allows per-page overrides)
  const pageMeta = document.querySelector(`meta[name="${key}"]`)?.content;
  if (pageMeta) return pageMeta;
  const config = await getSiteConfig();
  return config[key] ?? fallback;
}
/**
 * Loads the theme CSS file for the current site/page.
 * Called from scripts.js loadEager so tokens are available before first paint.
 *
 * Theme resolution order:
 *   1. <meta name="theme"> on the page
 *   2. "theme" key in /site-config.json
 *   3. No theme loaded (default tokens from styles.css)
 *
 * The loadCSS function is injected as a parameter to avoid circular imports.
 *
 * @param {Function} loadCSS - loadCSS function from aem.js
 * @param {string} codeBasePath - window.hlx.codeBasePath
 */
export async function loadThemeCSS(loadCSS, codeBasePath) {
  const theme = await getConfigValue('theme');
  if (!theme) return;
  // Sanitise: only allow alphanumeric + hyphen to prevent path traversal
  const safe = theme.replace(/[^a-z0-9-]/gi, '');
  if (!safe) return;
  loadCSS(`${codeBasePath}/styles/themes/${safe}.css`);
}
