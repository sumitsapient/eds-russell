/**
 * auth.js — Authentication hooks for gated content.
 *
 * How it works:
 *   1. Author sets "auth-required: true" in Page Properties → entire page is gated
 *   2. Author sets "login-page: /login" in Page Properties → custom redirect target
 *   3. Individual blocks can call requireAuth() to gate themselves
 *   4. fetchWithAuth() wraps fetch() with the Bearer token for API calls
 *
 * Token storage:
 *   - Primary:   Cookie "eds-auth-token"  (set by login page, sent automatically)
 *   - Fallback:  sessionStorage "eds-auth-token"  (SPA-style login)
 *
 * No framework required — pure vanilla JS using Web APIs.
 */

const TOKEN_KEY = 'eds-auth-token';
const USER_KEY = 'eds-auth-user';

// ── TOKEN MANAGEMENT ─────────────────────────────────────────────────────────

/**
 * Reads the auth token from cookie first, then sessionStorage.
 * @returns {string|null} JWT token or null if not authenticated
 */
export function getAuthToken() {
  // Check cookie (set by server-side login flow)
  const cookie = document.cookie.split(';').find((c) => c.trim().startsWith(`${TOKEN_KEY}=`));
  if (cookie) return cookie.split('=')[1].trim();

  // Fallback: sessionStorage (set by client-side SPA login)
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Stores the auth token in sessionStorage (use after SPA-style login).
 * @param {string} token JWT token
 * @param {object} [user] Optional user profile to cache
 */
export function setAuthToken(token, user = null) {
  sessionStorage.setItem(TOKEN_KEY, token);
  if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Clears the auth token and user data (logout).
 * Also clears cookie if present.
 */
export function clearAuthToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  // Expire the cookie
  document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ── AUTH STATE ────────────────────────────────────────────────────────────────

/**
 * Returns the cached user profile (no API call — reads from sessionStorage).
 * @returns {object|null} User profile or null
 */
export function getCachedUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

/**
 * Checks if the current visitor is authenticated.
 *
 * If a validateEndpoint is configured (meta name="auth-validate-endpoint"),
 * it makes a lightweight API call to verify the token is still valid.
 * Otherwise, it checks for token presence only.
 *
 * @returns {Promise<boolean>} true if authenticated
 */
export async function isAuthenticated() {
  const token = getAuthToken();
  if (!token) return false;

  // Optional server-side validation
  const validateEndpoint = document.querySelector('meta[name="auth-validate-endpoint"]')?.content;
  if (!validateEndpoint) return true; // token presence = authenticated (trust the cookie)

  try {
    const res = await fetch(validateEndpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });
    if (res.ok) {
      const user = await res.json().catch(() => null);
      if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
      return true;
    }
    // Token rejected by server — clear local state
    clearAuthToken();
    return false;
  } catch {
    // Network error — assume authenticated to avoid blocking on flaky networks
    return true;
  }
}

// ── GATING ───────────────────────────────────────────────────────────────────

/**
 * Redirects to the login page if the user is not authenticated.
 * Call this in loadEager() for page-level gating.
 *
 * The login page receives the current URL as a `redirect` query param
 * so it can send the user back after login.
 *
 * @returns {Promise<void>} Resolves if authenticated, redirects if not
 */
export async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (authenticated) return;

  const loginPage = document.querySelector('meta[name="login-page"]')?.content || '/login';
  const returnUrl = encodeURIComponent(window.location.href);
  window.location.replace(`${loginPage}?redirect=${returnUrl}`);
  // Throw to stop the rest of loadEager() from running while redirect happens
  throw new Error('[Auth] Redirecting to login — not authenticated.');
}

/**
 * Shows a gated block only to authenticated users.
 * Hides the block while checking, then shows or removes it.
 *
 * Usage: add class "auth-required" to any block in Universal Editor.
 *   <div class="my-block auth-required">...</div>
 *
 * @param {Element} block The block element with class "auth-required"
 */
export async function gateBlock(block) {
  // Hide immediately to prevent flash of gated content
  block.style.visibility = 'hidden'; // eslint-disable-line no-param-reassign
  const authenticated = await isAuthenticated();
  if (authenticated) {
    block.style.visibility = ''; // eslint-disable-line no-param-reassign
  } else {
    block.remove();
  }
}

// ── FETCH WRAPPER ─────────────────────────────────────────────────────────────

/**
 * fetch() wrapper that automatically adds the Bearer token to the request.
 * Use this instead of fetch() for any API calls that require authentication.
 *
 * @param {string} url The API endpoint URL
 * @param {RequestInit} [options] fetch options
 * @returns {Promise<Response>}
 *
 * @example
 * const data = await fetchWithAuth('/api/portfolio/holdings').then(r => r.json());
 */
export async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  if (!token) {
    await requireAuth(); // redirects if not logged in
  }
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}
