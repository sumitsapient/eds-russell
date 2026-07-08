/**
 * Related Blogs block
 *
 * Fetches related articles from the Russell Investments API.
 * Authored block content is ignored - all data comes from the API.
 *
 * API: https://dev.russellinvestments.com/bin/relatedarticles
 *      ?limit=3&country=ca&lang=en&outputHTML=false
 *
 * @param {Element} block
 */
const API_BASE = 'https://publish-p146753-e1506305.adobeaemcloud.com';
const API_URL = `${API_BASE}/bin/relatedarticles?limit=3&country=ca&lang=en&outputHTML=false`;
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function buildCard(article) {
  const {
    url, title, date, author, authorImgURL, authorTitle, imageURL, description,
  } = article;
  const card = document.createElement('article');
  card.className = 'related-blogs-card';
  if (imageURL) {
    const imgWrapper = document.createElement('div');
    imgWrapper.className = 'related-blogs-card-image';
    const img = document.createElement('img');
    img.src = imageURL.startsWith('http') ? imageURL : (API_BASE + imageURL);
    img.alt = title || '';
    img.loading = 'lazy';
    imgWrapper.append(img);
    card.append(imgWrapper);
  }
  const content = document.createElement('div');
  content.className = 'related-blogs-card-content';
  if (date) {
    const dateEl = document.createElement('p');
    dateEl.className = 'related-blogs-card-date';
    dateEl.textContent = formatDate(date);
    content.append(dateEl);
  }
  if (title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'related-blogs-card-title';
    const link = document.createElement('a');
    let href = '#';
    if (url) {
      href = url.startsWith('http') ? url : (API_BASE + url);
    }
    link.href = href;
    link.textContent = title;
    titleEl.append(link);
    content.append(titleEl);
  }
  if (description) {
    const desc = document.createElement('p');
    desc.className = 'related-blogs-card-description';
    desc.textContent = description;
    content.append(desc);
  }
  if (author) {
    const authorEl = document.createElement('div');
    authorEl.className = 'related-blogs-card-author';
    if (authorImgURL) {
      const authorImg = document.createElement('img');
      authorImg.src = authorImgURL.startsWith('http') ? authorImgURL : (API_BASE + authorImgURL);
      authorImg.alt = author;
      authorImg.loading = 'lazy';
      authorImg.className = 'related-blogs-card-author-img';
      authorEl.append(authorImg);
    }
    const authorInfo = document.createElement('div');
    authorInfo.className = 'related-blogs-card-author-info';
    const authorName = document.createElement('strong');
    authorName.className = 'related-blogs-card-author-name';
    authorName.textContent = author;
    authorInfo.append(authorName);
    if (authorTitle) {
      const authorRole = document.createElement('span');
      authorRole.className = 'related-blogs-card-author-role';
      authorRole.textContent = authorTitle;
      authorInfo.append(authorRole);
    }
    authorEl.append(authorInfo);
    content.append(authorEl);
  }
  card.append(content);
  return card;
}
export default async function decorate(block) {
  const heading = document.createElement('h2');
  heading.className = 'related-blogs-heading';
  heading.textContent = 'Related Articles';
  block.before(heading);
  block.innerHTML = '<div class="related-blogs-loading">Loading related articles...</div>';
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const articles = Array.isArray(data.articles) ? data.articles : [];
    const grid = document.createElement('div');
    grid.className = 'related-blogs-grid';
    articles.forEach((article) => grid.append(buildCard(article)));
    block.replaceChildren(grid);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[related-blogs] Failed to fetch:', err);
    block.innerHTML = '<p class="related-blogs-error">Related articles could not be loaded.</p>';
  }
}
