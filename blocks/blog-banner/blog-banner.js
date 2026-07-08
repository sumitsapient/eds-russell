/**
 * Blog Banner block
 * Full-bleed gradient banner with a large heading.
 * Authored: one row, one cell — the heading text.
 * @param {Element} block
 */
export default function decorate(block) {
  const heading = document.createElement('h1');
  heading.className = 'blog-banner-heading';
  heading.textContent = block.textContent.trim();
  block.replaceChildren(heading);
}
