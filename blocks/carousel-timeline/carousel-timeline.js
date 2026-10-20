import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Build one slide from an authored row (icon image cell + text cell).
 * @param {Element} row
 * @param {number} index
 * @param {number} total
 */
function buildSlide(row, index, total) {
  const li = document.createElement('li');
  li.className = 'carousel-timeline-slide';
  li.setAttribute('role', 'group');
  li.setAttribute('aria-roledescription', 'slide');
  li.setAttribute('aria-label', `${index + 1} of ${total}`);

  const icon = document.createElement('div');
  icon.className = 'carousel-timeline-slide-icon';
  const content = document.createElement('div');
  content.className = 'carousel-timeline-slide-content';

  moveInstrumentation(row, li);
  [...row.children].forEach((cell) => {
    const img = cell.querySelector('img');
    if (img && !cell.textContent.trim() && !icon.children.length) {
      // icons are small SVGs: reuse the authored picture instead of re-encoding
      const holder = img.closest('picture') || img;
      // a bare <img> leaves its <p> wrapper behind
      for (let el = holder.parentElement; el && el !== cell; el = el.parentElement) {
        moveInstrumentation(el, holder);
      }
      moveInstrumentation(cell, icon);
      icon.append(holder);
    } else {
      moveInstrumentation(cell, content);
      while (cell.firstChild) content.append(cell.firstChild);
    }
  });

  // Leading paragraph without links is the year/eyebrow
  const first = content.querySelector(':scope > p:first-child');
  if (first && !first.querySelector('a, img')) first.classList.add('carousel-timeline-year');

  if (icon.children.length) li.append(icon);
  li.append(content);
  return li;
}

function createNavButton(direction, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `carousel-timeline-${direction}`;
  button.setAttribute('aria-label', label);
  return button;
}

/**
 * Timeline carousel: horizontally scrolling slides with prev/next navigation.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  if (!block.getAttribute('aria-label')) block.setAttribute('aria-label', 'Timeline');

  const track = document.createElement('ul');
  track.className = 'carousel-timeline-track';
  rows.forEach((row, i) => track.append(buildSlide(row, i, rows.length)));

  const nav = document.createElement('div');
  nav.className = 'carousel-timeline-nav';
  const prev = createNavButton('prev', 'Previous slide');
  const next = createNavButton('next', 'Next slide');
  nav.append(prev, next);

  const scrollBySlide = (dir) => {
    const slide = track.querySelector('.carousel-timeline-slide');
    if (!slide) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: dir * (slide.offsetWidth + gap), behavior: 'smooth' });
  };

  const updateButtons = () => {
    const max = track.scrollWidth - track.clientWidth - 1;
    prev.disabled = track.scrollLeft <= 0;
    next.disabled = track.scrollLeft >= max;
  };

  prev.addEventListener('click', () => scrollBySlide(-1));
  next.addEventListener('click', () => scrollBySlide(1));
  track.addEventListener('scroll', updateButtons, { passive: true });
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') scrollBySlide(1);
    if (e.key === 'ArrowLeft') scrollBySlide(-1);
  });
  track.tabIndex = 0;

  const viewport = document.createElement('div');
  viewport.className = 'carousel-timeline-viewport';
  viewport.append(track);

  block.replaceChildren(viewport, nav);
  if (rows.length < 2) nav.hidden = true;
  requestAnimationFrame(updateButtons);
  window.addEventListener('resize', updateButtons, { passive: true });
}
