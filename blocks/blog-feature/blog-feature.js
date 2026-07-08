/**
 * Blog Feature block
 * Two-column layout: text (left) | image (right).
 *
 * Authored rows:
 *   Row 0: category label  (e.g. "Investment Insights")
 *   Row 1: title
 *   Row 2: description / button (richtext — link becomes button)
 *   Row 3: image
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const [catRow, titleRow, descRow, imgRow] = rows;
  const inner = document.createElement('div');
  inner.className = 'blog-feature-inner';
  // Left column
  const left = document.createElement('div');
  left.className = 'blog-feature-left';
  if (catRow?.textContent.trim()) {
    const cat = document.createElement('p');
    cat.className = 'blog-feature-category';
    cat.textContent = catRow.textContent.trim();
    left.append(cat);
  }
  if (titleRow?.textContent.trim()) {
    const title = document.createElement('h2');
    title.className = 'blog-feature-title';
    title.textContent = titleRow.textContent.trim();
    left.append(title);
  }
  if (descRow) {
    const desc = document.createElement('div');
    desc.className = 'blog-feature-desc';
    // Move content (may contain p and/or a links that become buttons)
    desc.append(...descRow.firstElementChild.childNodes);
    // Wrap bare links as buttons
    desc.querySelectorAll('a').forEach((a) => {
      if (!a.closest('.blog-feature-btn')) {
        const btn = document.createElement('span');
        btn.className = 'blog-feature-btn';
        a.before(btn);
        btn.append(a);
      }
    });
    left.append(desc);
  }
  // Right column
  const right = document.createElement('div');
  right.className = 'blog-feature-right';
  const picture = imgRow?.querySelector('picture');
  if (picture) right.append(picture);
  inner.append(left, right);
  block.replaceChildren(inner);
}
