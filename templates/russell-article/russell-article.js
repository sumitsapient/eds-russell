/**
 * russell-article template
 * Loaded automatically when a page has:
 *   <meta name="template" content="russell-article">
 *
 * Responsibilities:
 * 1. Reading progress bar (scrolls left to right as user reads)
 * 2. Estimated reading time badge inserted below h1
 * 3. Auto-generated Table of Contents (if article has 3+ h2 headings)
 *
 * All new functionality is prefixed with russell- to avoid
 * conflicting with the base article template.
 */
/**
 * Calculates estimated reading time from the article body section.
 * Average reading speed: 200 words per minute.
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
 * Fills left-to-right as the user scrolls through the article body.
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
 * Auto-generates an inline Table of Contents from h2 headings
 * in the russell-article-body section.
 * Skips articles with fewer than 3 h2s (not worth a ToC).
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
addRussellReadingProgress();
window.addEventListener('load', () => {
  addRussellReadingTime();
  addRussellTableOfContents();
});
