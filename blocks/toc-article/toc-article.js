import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Article table of contents.
 * Authored content: optional heading text (single row/cell). The list is built
 * automatically from the page's H2s inside <main> that are default content
 * (H2s inside other blocks such as accordions or cards are skipped).
 * @param {Element} block The block element
 */

const DEFAULT_HEADING = 'Table of contents';

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function ensureId(heading, used) {
  if (heading.id) {
    used.add(heading.id);
    return heading.id;
  }
  const base = slugify(heading.textContent.trim());
  let id = base;
  let i = 2;
  while (used.has(id) || document.getElementById(id)) {
    id = `${base}-${i}`;
    i += 1;
  }
  heading.id = id;
  used.add(id);
  return id;
}

function getHeadings(block) {
  const main = block.closest('main') || document.querySelector('main');
  if (!main) return [];
  // Prefer the article body column so page-level headings (related research, FAQ) stay out
  const scope = main.querySelector('.section.article-body') || main;
  // Headings inside blocks are skipped, except the "bottom line" rule callout
  return [...scope.querySelectorAll('h2')].filter((h2) => (!h2.closest('.block') || h2.closest('.callout-takeaways.rule'))
    && !block.contains(h2)
    && h2.textContent.trim());
}

export default function decorate(block) {
  const headingText = block.textContent.trim() || DEFAULT_HEADING;

  const nav = document.createElement('nav');
  nav.className = 'toc-article-nav';

  const title = document.createElement('p');
  title.className = 'toc-article-title';
  title.textContent = headingText;
  const titleId = `toc-article-title-${document.querySelectorAll('.toc-article-title').length + 1}`;
  title.id = titleId;
  nav.setAttribute('aria-labelledby', titleId);
  // Universal Editor: the heading field (on its cell or paragraph) is edited on the title
  block.querySelectorAll('*').forEach((el) => moveInstrumentation(el, title));

  const list = document.createElement('ol');
  list.className = 'toc-article-list';

  const headings = getHeadings(block);
  const used = new Set();
  const links = new Map();

  headings.forEach((heading) => {
    const id = ensureId(heading, used);
    const li = document.createElement('li');
    li.className = 'toc-article-item';
    const a = document.createElement('a');
    a.className = 'toc-article-link';
    a.href = `#${id}`;
    a.textContent = heading.textContent.trim();
    li.append(a);
    list.append(li);
    links.set(heading, a);
  });

  nav.append(title, list);
  block.replaceChildren(nav);

  if (!headings.length) {
    block.classList.add('toc-article-empty');
    return;
  }

  const setActive = (heading) => {
    links.forEach((link, h) => {
      const active = h === heading;
      link.closest('li').classList.toggle('toc-article-item-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  setActive(headings[0]);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  list.addEventListener('click', (e) => {
    const link = e.target.closest('a.toc-article-link');
    if (!link) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    window.history.replaceState(null, '', link.hash);
    setActive(target);
  });

  // Active section: the last heading whose top has passed the sticky offset line.
  // The observer's top margin sits on that line, so it fires whenever a heading crosses it.
  const navHeight = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--nav-height'), 10) || 72;
  const offset = navHeight + 32;
  const update = () => {
    let current = headings[0];
    headings.forEach((h) => {
      if (h.getBoundingClientRect().top - offset <= 1) current = h;
    });
    setActive(current);
  };
  const observer = new IntersectionObserver(update, { rootMargin: `-${offset}px 0px 0px 0px` });
  headings.forEach((h) => observer.observe(h));
}
