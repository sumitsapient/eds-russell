import { createOptimizedPicture, loadScript } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const CEROS_HOST = /(^|\.)ceros\.(site|com)$/i;
const CEROS_SDK = 'https://assets.ceros.site/js/embed.v1.js';
// classic Ceros experiences (view.ceros.com/<account>/<slug>) use the scroll proxy, not the SDK
const CEROS_LEGACY_HOST = /(^|\.)ceros\.com$/i;
const CEROS_SCROLL_PROXY = 'https://view.ceros.com/scroll-proxy.min.js';

/**
 * Returns true when the URL points to a Ceros-hosted experience.
 * @param {URL} url
 */
function isCerosUrl(url) {
  return CEROS_HOST.test(url.hostname);
}

/**
 * Returns true for classic Ceros experiences (view.ceros.com and other *.ceros.com hosts).
 * @param {URL} url
 */
function isLegacyCerosUrl(url) {
  return CEROS_LEGACY_HOST.test(url.hostname);
}

/**
 * Builds the Ceros iframe src, adding the standard embed parameters.
 * Only used when the Ceros embed SDK cannot be loaded.
 * @param {URL} url
 */
function buildSrc(url) {
  const src = new URL(url.href);
  if (!src.searchParams.has('embed')) src.searchParams.set('embed', 'true');
  if (!src.searchParams.has('embed-version')) src.searchParams.set('embed-version', '1');
  return src.href;
}

/**
 * Derives a readable iframe title from the link text or URL slug.
 * @param {HTMLAnchorElement} link
 * @param {URL} url
 */
function deriveTitle(link, url) {
  const text = link.textContent.trim();
  if (text && text !== link.href && !/^https?:/i.test(text)) return text;
  const slug = url.pathname.split('/').filter(Boolean).pop() || 'Interactive content';
  return slug.replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Moves Universal Editor instrumentation from the authored wrappers of an element
 * (paragraph, cell, row) that are dropped when the block is rebuilt.
 * @param {Element} block
 * @param {Element} el the authored element
 * @param {Element} target the element that replaces it
 */
function moveWrapperInstrumentation(block, el, target) {
  for (let parent = el.parentElement; parent && parent !== block; parent = parent.parentElement) {
    moveInstrumentation(parent, target);
  }
}

/**
 * Ceros interactive embed: one link to a Ceros experience, optional poster image.
 * Lazily hands the experience to the Ceros embed SDK, which creates the iframe
 * and keeps its height in sync with the experience (full-height scroll mode).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const link = [...block.querySelectorAll('a[href]')].find((a) => {
    try {
      return isCerosUrl(new URL(a.href));
    } catch (e) {
      return false;
    }
  }) || block.querySelector('a[href]');

  if (!link) {
    block.classList.add('embed-ceros-empty');
    return;
  }

  const url = new URL(link.href, window.location.href);
  const title = deriveTitle(link, url);
  const legacy = isLegacyCerosUrl(url);
  if (legacy) block.classList.add('embed-ceros-legacy');
  const posterImg = block.querySelector('img');

  const frame = document.createElement('div');
  frame.className = 'embed-ceros-frame';

  if (posterImg) {
    const poster = document.createElement('div');
    poster.className = 'embed-ceros-poster';
    const picture = createOptimizedPicture(posterImg.src, posterImg.alt || '', false, [
      { media: '(min-width: 900px)', width: '2000' },
      { width: '900' },
    ]);
    moveInstrumentation(posterImg, picture.querySelector('img'));
    moveWrapperInstrumentation(block, posterImg, poster);
    poster.append(picture);
    frame.append(poster);
  }

  const fallback = document.createElement('a');
  fallback.className = 'embed-ceros-fallback';
  fallback.href = url.href;
  fallback.textContent = title;
  // the embed URL field stays selectable on the link that replaces it
  moveInstrumentation(link, fallback);
  moveWrapperInstrumentation(block, link, fallback);
  frame.append(fallback);

  block.replaceChildren(frame);

  const onIframe = (iframe) => {
    block.classList.add('embed-ceros-active');
    iframe.addEventListener('load', () => block.classList.add('embed-ceros-loaded'));
  };

  // the SDK appends its iframe to [data-ceros-experience]; watch for it
  const watcher = new MutationObserver(() => {
    const iframe = frame.querySelector('iframe');
    if (iframe) {
      watcher.disconnect();
      onIframe(iframe);
    }
  });

  const loadFallbackIframe = () => {
    watcher.disconnect();
    if (frame.querySelector('iframe')) return;
    frame.removeAttribute('data-ceros-experience');
    const iframe = document.createElement('iframe');
    iframe.src = buildSrc(url);
    iframe.title = title;
    iframe.loading = 'lazy';
    iframe.setAttribute('allow', 'fullscreen');
    frame.append(iframe);
    block.classList.add('embed-ceros-static');
    onIframe(iframe);
  };

  // classic experience: plain iframe sized by its aspect ratio; the scroll proxy relays
  // page scroll/resize to the experience (as in the Ceros classic embed code)
  const loadLegacy = async () => {
    if (frame.querySelector('iframe')) return;
    const iframe = document.createElement('iframe');
    iframe.src = url.href;
    iframe.title = title;
    iframe.className = 'ceros-experience';
    iframe.loading = 'lazy';
    iframe.setAttribute('allow', 'fullscreen');
    iframe.setAttribute('scrolling', 'no');
    frame.append(iframe);
    onIframe(iframe);
    try {
      await loadScript(CEROS_SCROLL_PROXY, { 'data-ceros-origin-domains': 'view.ceros.com' });
    } catch (e) {
      // the experience still renders without the scroll proxy
    }
  };

  const load = async () => {
    if (legacy) {
      await loadLegacy();
      return;
    }
    if (frame.dataset.cerosExperience || frame.querySelector('iframe')) return;
    watcher.observe(frame, { childList: true });
    frame.dataset.cerosExperience = url.href;
    frame.dataset.title = title;
    try {
      await loadScript(CEROS_SDK);
    } catch (e) {
      loadFallbackIframe();
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        load();
      }
    }, { rootMargin: '200px' });
    observer.observe(block);
  } else {
    load();
  }
}
