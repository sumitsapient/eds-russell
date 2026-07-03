/**
 * Article template — loaded automatically when page has template: article
 * Adds a reading progress bar and estimated read time to article pages.
 *
 * How it works:
 * 1. aem.js reads <meta name="template" content="article"> from the page
 * 2. Adds class "article" to <body>
 * 3. Loads this file: templates/article/article.js
 * 4. Loads templates/article/article.css
 * 5. This script runs and enhances the page
 */

/**
 * Reads a <meta> tag's content from <head>.
 * @param {string} name The meta name or property attribute
 * @returns {string}
 */
function getMeta(name) {
  return (
    document.querySelector(`meta[name="${name}"]`)?.content
    || document.querySelector(`meta[property="${name}"]`)?.content
    || ''
  );
}

/**
 * Injects BlogPosting JSON-LD structured data into <head>.
 * Google uses this to display rich results for articles in search.
 * Fields are read from page metadata set in Universal Editor Page Properties.
 */
function injectArticleSchema() {
  const { title } = document;
  const description = getMeta('description');
  const image = getMeta('og:image');
  const datePublished = getMeta('published-date') || getMeta('date');
  const dateModified = getMeta('modified-date') || datePublished;
  const authorName = getMeta('author') || getMeta('author-name');
  const siteOrigin = window.location.origin;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    url: window.location.href,
    mainEntityOfPage: { '@type': 'WebPage', '@id': window.location.href },
    publisher: {
      '@type': 'Organization',
      name: window.location.hostname,
      logo: { '@type': 'ImageObject', url: `${siteOrigin}/favicon.ico` },
    },
  };

  if (description) schema.description = description;
  if (image) schema.image = image;
  if (datePublished) schema.datePublished = datePublished;
  if (dateModified) schema.dateModified = dateModified;
  if (authorName) schema.author = { '@type': 'Person', name: authorName };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.append(script);
}

/**
 * Calculates estimated reading time from body text.
 * Average reading speed: 200 words per minute.
 * @returns {string} e.g. "5 min read"
 */
function getReadingTime() {
  const words = document.querySelector('main')?.innerText?.split(/\s+/).length || 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

/**
 * Adds a reading progress bar to the top of the page.
 * Fills left-to-right as user scrolls.
 */
function addReadingProgress() {
  const bar = document.createElement('div');
  bar.className = 'article-progress-bar';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${progress}%`;
  }, { passive: true });
}

/**
 * Adds estimated reading time below the first h1 on the page.
 */
function addReadingTime() {
  const h1 = document.querySelector('main h1');
  if (!h1) return;

  const meta = document.createElement('p');
  meta.className = 'article-reading-time';
  meta.textContent = getReadingTime();
  h1.after(meta);
}

/**
 * Auto-generates a Table of Contents from h2/h3 headings in the article.
 * Inserts it before the first h2.
 */
function addTableOfContents() {
  const headings = [...document.querySelectorAll('main h2, main h3')];
  if (headings.length < 3) return; // don't bother for short articles

  const nav = document.createElement('nav');
  nav.className = 'article-toc';
  nav.setAttribute('aria-label', 'Table of Contents');

  const title = document.createElement('p');
  title.className = 'article-toc-title';
  title.textContent = 'On This Page';
  nav.append(title);

  const list = document.createElement('ol');
  list.className = 'article-toc-list';

  headings.forEach((heading, i) => {
    // Give heading an id if it doesn't have one (for anchor links)
    if (!heading.id) {
      heading.id = `heading-${i}`;
    }

    const item = document.createElement('li');
    item.className = `article-toc-item article-toc-${heading.tagName.toLowerCase()}`;

    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    item.append(link);
    list.append(item);
  });

  nav.append(list);

  // Insert TOC before the first h2
  const firstH2 = document.querySelector('main h2');
  if (firstH2) firstH2.before(nav);
}

// Run when page is loaded
addReadingProgress();
// Reading time, TOC, and schema run after sections load (lazy phase)
window.addEventListener('load', () => {
  addReadingTime();
  addTableOfContents();
  injectArticleSchema();
});
