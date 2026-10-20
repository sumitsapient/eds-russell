import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

const VIDEO_URL = /\.mp4(?:[?#].*)?$/i;

/**
 * Finds a background video source in a cell: a <video> (or its <source>) or a link to an .mp4.
 * @param {Element} cell
 * @returns {{ src: string, el: Element } | null}
 */
function findVideo(cell) {
  const video = cell.querySelector('video');
  if (video) {
    const src = video.getAttribute('src') || video.querySelector('source[src]')?.getAttribute('src');
    if (src) return { src, el: video };
  }
  const link = [...cell.querySelectorAll('a[href]')].find((a) => VIDEO_URL.test(a.getAttribute('href')));
  return link ? { src: link.href, el: link } : null;
}

/**
 * True when the cell carries authored text beyond its media. Elements holding an image,
 * and the element holding only the video link/element, are ignored.
 * @param {Element} cell
 * @param {Element|null} videoEl
 */
function hasText(cell, videoEl) {
  return [...cell.children].some((el) => {
    if (el.querySelector('img')) return false;
    if (videoEl && (el === videoEl || el.contains(videoEl))
      && el.textContent.trim() === videoEl.textContent.trim()) return false;
    return !!el.textContent.trim();
  });
}

/**
 * Removes an element and its now-empty parent paragraph/picture.
 * @param {Element} el
 */
function removeWithEmptyParent(el) {
  const holder = el.closest('picture') || el;
  const parent = holder.parentElement;
  holder.remove();
  if (parent && parent.tagName === 'P' && !parent.textContent.trim() && !parent.children.length) {
    parent.remove();
  }
}

/**
 * Builds a muted, looping, inline background video.
 * @param {string} src
 * @param {string} [poster]
 * @param {boolean} autoplay
 */
function buildVideo(src, poster, autoplay) {
  const video = document.createElement('video');
  video.className = 'hero-image-overlay-video';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.setAttribute('tabindex', '-1');
  video.preload = autoplay ? 'auto' : 'metadata';
  if (poster) video.poster = poster;
  if (autoplay) {
    video.autoplay = true;
    video.setAttribute('autoplay', '');
  }
  const source = document.createElement('source');
  source.src = src;
  source.type = 'video/mp4';
  video.append(source);
  return video;
}

/**
 * True when a paragraph holds a single link and no other text (an authored CTA).
 * @param {Element} el
 */
function isCtaParagraph(el) {
  if (el.tagName !== 'P') return false;
  if (el.classList.contains('button-wrapper')) return true;
  const links = el.querySelectorAll('a[href]');
  return links.length === 1 && el.textContent.trim() === links[0].textContent.trim();
}

/**
 * `article` option: classifies the overlaid copy into pretitle / title group,
 * subtitle and CTA regions so CSS can target them without positional selectors.
 * @param {Element} content The overlaid content wrapper
 */
function decorateArticle(content) {
  const heading = content.querySelector(':scope > h1, :scope > h2');
  const children = [...content.children];
  const headingIndex = heading ? children.indexOf(heading) : -1;

  const titleGroup = document.createElement('div');
  titleGroup.className = 'hero-image-overlay-title-group';
  const actions = document.createElement('div');
  actions.className = 'hero-image-overlay-actions';

  children.forEach((el, i) => {
    if (isCtaParagraph(el)) {
      el.classList.add('hero-image-overlay-cta');
      actions.append(el);
    } else if (headingIndex >= 0 && i < headingIndex && el.tagName === 'P') {
      el.classList.add('hero-image-overlay-pretitle');
      titleGroup.append(el);
    } else if (el === heading) {
      el.classList.add('hero-image-overlay-title');
      titleGroup.append(el);
    } else if (el.tagName === 'P') {
      el.classList.add('hero-image-overlay-subtitle');
    }
  });

  if (titleGroup.children.length) content.prepend(titleGroup);
  if (actions.children.length) content.append(actions);
}

/**
 * Full-bleed hero: background media row + overlaid text row.
 * Background media is an image (<picture> or bare <img> inside <p>) and/or a video
 * (<video> or a link to an .mp4). When a video is present, the image is its poster.
 * With prefers-reduced-motion, the image is shown and the video does not autoplay.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  let img = null;
  let video = null;
  let contentCell = null;
  // Universal Editor: authored elements that are dropped and whose instrumentation must move
  let imgCell = null;
  const videoSources = [];

  rows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    const rowImg = cell.querySelector('img');
    const rowVideo = findVideo(cell);
    // Skip empty rows (e.g. an unused image or video field)
    if (!rowImg && !rowVideo && !cell.textContent.trim()) return;
    const isMediaRow = (rowImg || rowVideo) && !hasText(cell, rowVideo?.el);
    // Image and video may share one row or sit in separate media-only rows
    if (isMediaRow && !contentCell && ((rowImg && !img) || (rowVideo && !video))) {
      if (rowImg && !img) imgCell = cell;
      if (rowVideo && !video) videoSources.push(cell, rowVideo.el);
      img = img || rowImg;
      video = video || rowVideo;
    } else if (!contentCell) {
      contentCell = cell;
    }
  });

  // Fallback: a video link authored in its own paragraph inside the content cell
  if (!video && contentCell) {
    const candidate = findVideo(contentCell);
    const p = candidate?.el.closest('p');
    if (candidate && (candidate.el.tagName === 'VIDEO' || (p && p.textContent.trim() === candidate.el.textContent.trim()))) {
      video = candidate;
      videoSources.push(...(p ? [p] : []), candidate.el);
      removeWithEmptyParent(candidate.el);
    }
  }

  // Fallback: an image authored inside the content cell becomes the background
  if (!img && contentCell) {
    img = contentCell.querySelector('img');
    if (img) removeWithEmptyParent(img);
  }

  const media = document.createElement('div');
  media.className = 'hero-image-overlay-media';
  let picture = null;
  if (img) {
    picture = createOptimizedPicture(img.src, img.alt || '', true, [
      { media: '(min-width: 900px)', width: '2000' },
      { width: '900' },
    ]);
    moveInstrumentation(img, picture.querySelector('img'));
    if (imgCell && imgCell !== contentCell) moveInstrumentation(imgCell, media);
    media.append(picture);
  }

  if (video) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    block.classList.add('has-video');
    // With reduced motion and an image available, show the image only
    let videoEl = null;
    if (!(reducedMotion && picture)) {
      const poster = picture?.querySelector('img')?.src;
      videoEl = buildVideo(video.src, poster, !reducedMotion);
      media.append(videoEl);
    }
    // keep the video field selectable: on the video, else on the media wrapper
    videoSources.filter((el) => el !== contentCell)
      .forEach((el) => moveInstrumentation(el, videoEl || media));
  }

  if (!img && !video) block.classList.add('no-image');

  const content = document.createElement('div');
  content.className = 'hero-image-overlay-content';
  if (contentCell) {
    moveInstrumentation(contentCell, content);
    while (contentCell.firstChild) content.append(contentCell.firstChild);
  }
  if (block.classList.contains('article')) decorateArticle(content);

  block.replaceChildren(media, content);
}
