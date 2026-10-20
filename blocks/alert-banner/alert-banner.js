import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const STORAGE_PREFIX = 'alert-banner-dismissed:';

/**
 * Short, stable key for a message so a changed notice is shown again.
 * @param {string} text
 */
function hashText(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(31, hash) + text.charCodeAt(i) || 0;
  }
  return Math.abs(hash).toString(36);
}

function readDismissed(key) {
  try {
    return sessionStorage.getItem(key) === '1';
  } catch (e) {
    return false;
  }
}

function storeDismissed(key) {
  try {
    sessionStorage.setItem(key, '1');
  } catch (e) {
    // storage unavailable (privacy mode): dismissal lasts for this page view only
  }
}

/**
 * Moves Universal Editor instrumentation from an element's wrappers (up to the block).
 * @param {Element} block
 * @param {Element} el
 * @param {Element} target
 */
function moveWrapperInstrumentation(block, el, target) {
  for (let parent = el.parentElement; parent && parent !== block; parent = parent.parentElement) {
    moveInstrumentation(parent, target);
  }
}

/**
 * Hides the banner (and its section when nothing else is left in it).
 * @param {Element} block
 */
function hide(block) {
  block.hidden = true;
  const wrapper = block.parentElement;
  if (wrapper && wrapper.classList.contains('alert-banner-wrapper')) wrapper.hidden = true;
  const section = block.closest('.section');
  if (section && ![...section.children].some((child) => !child.hidden)) section.hidden = true;
}

/**
 * Alert banner: optional icon + notice text (may be or contain a link) and a
 * JS-built dismiss button. Dismissal is remembered for the browser session.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const editing = block.hasAttribute('data-aue-resource');
  const img = block.querySelector('img');

  const inner = document.createElement('div');
  inner.className = 'alert-banner-inner';

  const content = document.createElement('div');
  content.className = 'alert-banner-content';

  if (img) {
    const icon = document.createElement('div');
    icon.className = 'alert-banner-icon';
    const picture = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '96' }]);
    const newImg = picture.querySelector('img');
    newImg.width = 37;
    newImg.height = 37;
    moveInstrumentation(img, newImg);
    moveWrapperInstrumentation(block, img, icon);
    if (!img.alt) icon.setAttribute('aria-hidden', 'true');
    icon.append(picture);
    content.append(icon);
    // drop the now-empty image paragraph/picture
    const holder = img.closest('p') || img.closest('picture') || img;
    holder.remove();
  }

  const message = document.createElement('div');
  message.className = 'alert-banner-message';
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      if (!cell.textContent.trim() && cell.dataset.aueType !== 'richtext') return;
      moveInstrumentation(cell, message);
      while (cell.firstChild) message.append(cell.firstChild);
    });
  });
  // the notice link stays a text link, never a pill button
  message.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary', 'accent'));
  message.querySelectorAll('p.button-wrapper').forEach((p) => p.classList.remove('button-wrapper'));
  content.append(message);

  const key = `${STORAGE_PREFIX}${hashText(message.textContent.replace(/\s+/g, ' ').trim())}`;

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'alert-banner-close';
  close.setAttribute('aria-label', 'Close alert');
  close.innerHTML = '<svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="16" height="16"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';
  close.addEventListener('click', () => {
    if (!editing) storeDismissed(key);
    const main = block.closest('main');
    hide(block);
    // keep keyboard focus on the page instead of losing it with the removed button
    if (main) {
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
    }
  });

  inner.append(content, close);
  block.replaceChildren(inner);
  block.setAttribute('role', 'region');
  block.setAttribute('aria-label', 'Important notice');

  if (!editing && readDismissed(key)) hide(block);
}
