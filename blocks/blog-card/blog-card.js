/**
 * Blog Card block
 *
 * Authored rows (one field per row, single cell each):
 *   Row 0: author image
 *   Row 1: author name
 *   Row 2: blog title
 *   Row 3: category
 *
 * Publish date is read from <meta name="publisheddate"> page metadata.
 * Reading time is auto-calculated from blog body text.
 *
 * @param {Element} block
 */
/** Format an ISO date string to a human-readable date. */
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
/** Auto-calculate reading time from the blog-body section. */
function getReadingTime() {
  const body = document.querySelector('.section.blog-body');
  const words = body?.innerText?.split(/\s+/).length || 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
export default function decorate(block) {
  const rows = [...block.children];
  const card = document.createElement('div');
  card.className = 'blog-card-inner';
  // ── Author: image (row 0) + name (row 1) ──
  const imgRow = rows[0];
  const nameRow = rows[1];
  const authorEl = document.createElement('div');
  authorEl.className = 'blog-card-author';
  const picture = imgRow?.querySelector('picture');
  if (picture) authorEl.append(picture);
  if (nameRow) {
    const nameEl = document.createElement('span');
    nameEl.className = 'blog-card-author-name';
    nameEl.textContent = nameRow.textContent.trim();
    authorEl.append(nameEl);
  }
  card.append(authorEl);
  // ── Title (row 2) ──
  const titleRow = rows[2];
  if (titleRow?.textContent.trim()) {
    const titleEl = document.createElement('p');
    titleEl.className = 'blog-card-title';
    titleEl.textContent = titleRow.textContent.trim();
    card.append(titleEl);
  }
  // ── Meta: category (row 3) + date from page meta ──
  const catRow = rows[3];
  const publishedDate = document.querySelector('meta[name="publisheddate"]')?.content;
  const metaEl = document.createElement('div');
  metaEl.className = 'blog-card-meta';
  if (catRow?.textContent.trim()) {
    const catEl = document.createElement('span');
    catEl.className = 'blog-card-category';
    catEl.textContent = catRow.textContent.trim();
    metaEl.append(catEl);
  }
  if (publishedDate) {
    const dateEl = document.createElement('span');
    dateEl.className = 'blog-card-date';
    dateEl.textContent = formatDate(publishedDate);
    metaEl.append(dateEl);
  }
  card.append(metaEl);
  // ── Reading time (auto-calculated) ──
  window.addEventListener('load', () => {
    const rtEl = document.createElement('div');
    rtEl.className = 'blog-card-readtime';
    rtEl.textContent = getReadingTime();
    card.append(rtEl);
  });
  block.replaceChildren(card);
}
