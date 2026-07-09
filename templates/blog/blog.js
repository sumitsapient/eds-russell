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
 * Adds a thin reading progress bar fixed at the top of the viewport.
 * Progress tracks how far the user has scrolled through the article body:
 *   0%   = viewport top is at the top of .blog-body section
 *   100% = viewport bottom has reached the bottom of .blog-body section
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
    // Use document-relative offsetTop (not getBoundingClientRect) so the
    // calculation is independent of current scroll position.
    const articleBody = document.querySelector('.section.blog-body')
      || document.querySelector('main');
    if (!articleBody) return;

    const articleTop = articleBody.offsetTop;
    const articleHeight = articleBody.offsetHeight;
    const { scrollY, innerHeight: viewportHeight } = window;

    // start = scroll position where reading begins (viewport top at article top)
    // end   = scroll position where reading ends   (viewport bottom at article bottom)
    const start = articleTop;
    const end = articleTop + articleHeight - viewportHeight;

    let pct;
    if (end <= start) {
      // Article is shorter than the viewport — show 0 until article is visible
      pct = scrollY >= start ? 100 : 0;
    } else {
      pct = Math.min(100, Math.max(0, ((scrollY - start) / (end - start)) * 100));
    }

    fill.style.width = `${pct}%`;
    bar.setAttribute('aria-valuenow', Math.round(pct));
  };

  window.addEventListener('scroll', updateProgress, { passive: true });

  // Wait for full layout before setting the initial value so offsetTop is stable
  if (document.readyState === 'complete') {
    updateProgress();
  } else {
    window.addEventListener('load', updateProgress, { once: true });
  }
}

export default function decorate(main) {
  decorateBlogSections(main);
  addReadingProgressBar();
}
