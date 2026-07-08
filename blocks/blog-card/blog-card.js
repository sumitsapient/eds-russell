/**
 * Blog Card block
 *
 * Authored rows (one field per row, single cell each):
 *   Row 0: author image
 *   Row 1: author name
 *   Row 2: blog title
 *   Row 3: author designation / role
 *
 * Publish date is read from <meta name="publisheddate"> page metadata.
 *
 * Rendered order:
 *   1. Title
 *   2. Published date
 *   3. Author row: circular image | name (bold) + designation (below)
 *
 * @param {Element} block
 */
/** Format an ISO date string to a human-readable date. */
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
export default function decorate(block) {
  const rows = [...block.children];
  const card = document.createElement('div');
  card.className = 'blog-card-inner';
  // ── 1. Title (row 2) ──
  const titleRow = rows[2];
  if (titleRow?.textContent.trim()) {
    const titleEl = document.createElement('h2');
    titleEl.className = 'blog-card-title';
    titleEl.textContent = titleRow.textContent.trim();
    card.append(titleEl);
  }
  // ── 2. Published date (from page meta) ──
  const publishedDate = document.querySelector('meta[name="publisheddate"]')?.content;
  if (publishedDate) {
    const dateEl = document.createElement('p');
    dateEl.className = 'blog-card-date';
    dateEl.textContent = formatDate(publishedDate);
    card.append(dateEl);
  }
  // ── 3. Author: image (row 0) | name (row 1) + designation (row 3) ──
  const imgRow = rows[0];
  const nameRow = rows[1];
  const desigRow = rows[3];
  const authorEl = document.createElement('div');
  authorEl.className = 'blog-card-author';
  // Circular author photo
  const picture = imgRow?.querySelector('picture');
  if (picture) {
    const imgWrap = document.createElement('div');
    imgWrap.className = 'blog-card-author-img-wrap';
    imgWrap.append(picture);
    authorEl.append(imgWrap);
  }
  // Name + designation stacked
  const authorInfo = document.createElement('div');
  authorInfo.className = 'blog-card-author-info';
  if (nameRow?.textContent.trim()) {
    const nameEl = document.createElement('strong');
    nameEl.className = 'blog-card-author-name';
    nameEl.textContent = nameRow.textContent.trim();
    authorInfo.append(nameEl);
  }
  if (desigRow?.textContent.trim()) {
    const desigEl = document.createElement('span');
    desigEl.className = 'blog-card-author-designation';
    desigEl.textContent = desigRow.textContent.trim();
    authorInfo.append(desigEl);
  }
  authorEl.append(authorInfo);
  card.append(authorEl);
  block.replaceChildren(card);
}
