/**
 * russell-article template
 * Loaded automatically when a page has:
 *   <meta name="template" content="russell-article">
 *
 * The default export is called by scripts.js AFTER decorateMain(),
 * so sections are already decorated when this runs.
 *
 * Responsibilities:
 * 1. Assign section CSS classes by position (hero/sidebar/body/related)
 * 2. Reading progress bar
 * 3. Estimated reading time badge
 * 4. Auto-generated Table of Contents (3+ h2 headings)
 */
/**
 * Assigns layout classes to sections based on their position in main.
 * Authors only need to put content in the right order — no section-metadata needed.
 *
 *   Section 1 → russell-article-hero     (full-bleed image)
 *   Section 2 → russell-article-sidebar  (30% left: Key Takeaways + Author Bio)
 *   Section 3 → russell-article-body     (70% right: title + article text)
 *   Section 4 → russell-article-related  (full-width: Related Articles)
 *
 * @param {Element} main The <main> element
 */
function decorateRussellArticleSections(main) {
  const sectionClasses = [
    'russell-article-hero',
    'russell-article-sidebar',
    'russell-article-body',
    'russell-article-related',
  ];
  const sections = main.querySelectorAll(':scope > .section');
  sections.forEach((section, i) => {
    if (sectionClasses[i]) section.classList.add(sectionClasses[i]);
  });
}
/**
 * Calculates estimated reading time from the article body section.
 * @returns {string} e.g. "5 min read"
 */
function getRussellReadingTime() {
  const body = document.querySelector('.section.russell-article-body');
  const words = body?.innerText?.split(/\s+/).length || 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
/**
 * Adds a thin reading progress bar fixed at the top of the page.
 */
function addRussellReadingProgress() {
  const bar = document.createElement('div');
  bar.className = 'russell-article-progress-bar';
  document.body.prepend(bar);
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${progress}%`;
  }, { passive: true });
}
/**
 * Inserts an estimated reading time badge directly after the h1.
 */
function addRussellReadingTime() {
  const h1 = document.querySelector('main h1');
  if (!h1) return;
  const badge = document.createElement('p');
  badge.className = 'russell-reading-time';
  badge.textContent = getRussellReadingTime();
  h1.after(badge);
}
/**
 * Auto-generates an inline Table of Contents from h2 headings.
 * Skips articles with fewer than 3 h2s.
 */
function addRussellTableOfContents() {
  const bodySection = document.querySelector('.section.russell-article-body');
  if (!bodySection) return;
  const headings = [...bodySection.querySelectorAll('h2')];
  if (headings.length < 3) return;
  const nav = document.createElement('nav');
  nav.className = 'russell-article-toc';
  nav.setAttribute('aria-label', 'On this page');
  const title = document.createElement('p');
  title.className = 'russell-article-toc-title';
  title.textContent = 'On This Page';
  nav.append(title);
  const list = document.createElement('ol');
  list.className = 'russell-article-toc-list';
  headings.forEach((heading, i) => {
    if (!heading.id) {
      heading.id = `russell-heading-${i}`;
    }
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    item.append(link);
    list.append(item);
  });
  nav.append(list);
  const firstH2 = bodySection.querySelector('h2');
  if (firstH2) firstH2.before(nav);
}
/**
 * Template entry point — called by scripts.js after decorateMain().
 * @param {Element} main The decorated <main> element
 */
export default function decorate(main) {
  decorateRussellArticleSections(main);
  addRussellReadingProgress();
  window.addEventListener('load', () => {
    addRussellReadingTime();
    addRussellTableOfContents();
  });
}
