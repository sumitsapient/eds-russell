/**
 * blog template
 * Called by scripts.js after decorateMain() — sections are already decorated.
 *
 * Layout by section position:
 *   Section 1 → blog-hero     (full-width image row)
 *   Section 2 → blog-sidebar  (35% left: blog card)
 *   Section 3 → blog-body     (65% right: article text)
 *   Section 4 → blog-related  (full-width: related blogs)
 *
 * @param {Element} main The decorated <main> element
 */
function decorateBlogSections(main) {
  const sectionClasses = [
    'blog-hero',
    'blog-sidebar',
    'blog-body',
    'blog-related',
  ];
  const sections = main.querySelectorAll(':scope > .section');
  sections.forEach((section, i) => {
    if (sectionClasses[i]) section.classList.add(sectionClasses[i]);
  });
}

/**
 * Adds a thin reading progress bar fixed below the header.
 * Progress is calculated relative to the article body section so the bar
 * fills from 0 % (top of article) to 100 % (bottom of article),
 * ignoring the hero, sidebar, and related-blogs sections.
 */
function addReadingProgressBar() {
  const bar = document.createElement('div');
  bar.className = 'blog-reading-progress';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', 'Reading progress');
  bar.setAttribute('aria-valuenow', '0');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');

  const fill = document.createElement('div');
  fill.className = 'blog-reading-progress-fill';
  bar.append(fill);
  document.body.prepend(bar);

  const updateProgress = () => {
    // Use the article body section if available, otherwise fall back to <main>
    const articleBody = document.querySelector('.section.blog-body')
      || document.querySelector('main');
    if (!articleBody) return;

    const { top, height } = articleBody.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // How far the reader has scrolled through the article
    // 0 % = top of article at bottom of viewport
    // 100 % = bottom of article at bottom of viewport
    const scrolled = (windowHeight - top) / (height + windowHeight);
    const pct = Math.min(100, Math.max(0, scrolled * 100));

    fill.style.width = `${pct}%`;
    bar.setAttribute('aria-valuenow', Math.round(pct));
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress(); // set initial value
}

export default function decorate(main) {
  decorateBlogSections(main);
  addReadingProgressBar();
}
