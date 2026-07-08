/**
 * Related Blogs block
 *
 * Authored structure — each row is one related blog:
 *   Col 1: thumbnail image
 *   Col 2: title (with link)
 *   Col 3: publish date
 *   Col 4: category
 *
 * @param {Element} block
 */
export default function decorate(block) {
  // Section heading (injected above the grid)
  const heading = document.createElement('h2');
  heading.className = 'related-blogs-heading';
  heading.textContent = 'Related Articles';
  block.before(heading);
  const grid = document.createElement('div');
  grid.className = 'related-blogs-grid';
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const [imgCell, titleCell, dateCell, catCell] = cells;
    const card = document.createElement('article');
    card.className = 'related-blogs-card';
    // Image
    if (imgCell) {
      const picture = imgCell.querySelector('picture');
      if (picture) {
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'related-blogs-card-image';
        imgWrapper.append(picture);
        card.append(imgWrapper);
      }
    }
    // Content area
    const content = document.createElement('div');
    content.className = 'related-blogs-card-content';
    // Meta: category + date
    const hasCat = catCell?.textContent.trim();
    const hasDate = dateCell?.textContent.trim();
    if (hasCat || hasDate) {
      const meta = document.createElement('div');
      meta.className = 'related-blogs-card-meta';
      if (hasCat) {
        const cat = document.createElement('span');
        cat.className = 'related-blogs-card-category';
        cat.textContent = catCell.textContent.trim();
        meta.append(cat);
      }
      if (hasDate) {
        const date = document.createElement('span');
        date.className = 'related-blogs-card-date';
        date.textContent = dateCell.textContent.trim();
        meta.append(date);
      }
      content.append(meta);
    }
    // Title
    if (titleCell) {
      const link = titleCell.querySelector('a');
      const titleEl = document.createElement('h3');
      titleEl.className = 'related-blogs-card-title';
      if (link) {
        titleEl.append(link);
      } else {
        titleEl.textContent = titleCell.textContent.trim();
      }
      content.append(titleEl);
    }
    card.append(content);
    grid.append(card);
  });
  block.replaceChildren(grid);
}
