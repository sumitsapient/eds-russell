import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Hello World With Child block.
 *
 * Demonstrates a block that has:
 *   - Its OWN field (title) on the parent
 *   - CHILD ITEMS each with a title + image
 *
 * AEM generates this HTML structure:
 *
 * <div class="hello-world-with-child block">
 *   <div>                                        <- row 1: parent's title field
 *     <div data-aue-prop="title">Our Features</div>
 *   </div>
 *   <div data-aue-resource="...item0">           <- child item 1
 *     <div data-aue-prop="title">Item One</div>
 *     <div data-aue-prop="image"><picture/></div>
 *   </div>
 *   <div data-aue-resource="...item1">           <- child item 2
 *     ...
 *   </div>
 * </div>
 *
 * KEY INSIGHT: Child item rows have data-aue-resource (they are separate JCR nodes).
 * The parent's own field rows do NOT have data-aue-resource.
 * We use this to separate parent fields from child items.
 *
 * @param {Element} block The hello-world-with-child block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  // --- PART 1: Separate parent rows from child item rows ---
  // Child items have data-aue-resource (they are separate JCR nodes)
  // Parent field rows do NOT have data-aue-resource
  const parentRows = rows.filter((row) => !row.dataset.aueResource);
  const itemRows = rows.filter((row) => row.dataset.aueResource);

  // --- PART 2: Build the section header from parent's title field ---
  const header = document.createElement('div');
  header.className = 'hello-world-with-child-header';

  const parentTitleCell = parentRows[0]?.children[0];
  if (parentTitleCell) {
    const heading = document.createElement('h2');
    heading.className = 'hello-world-with-child-title';
    moveInstrumentation(parentTitleCell, heading);
    while (parentTitleCell.firstChild) heading.append(parentTitleCell.firstChild);
    header.append(heading);
  }

  // --- PART 3: Build the child items grid ---
  const grid = document.createElement('div');
  grid.className = 'hello-world-with-child-grid';

  itemRows.forEach((row) => {
    // Each child item row has 2 cells: [0] = title, [1] = image
    const [titleCell, imageCell] = [...row.children];

    const card = document.createElement('div');
    card.className = 'hello-world-with-child-card';

    // Move the item's UE instrumentation (data-aue-resource) from row card
    moveInstrumentation(row, card);

    // Image cell
    if (imageCell) {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'hello-world-with-child-card-image';
      moveInstrumentation(imageCell, imgWrapper);
      while (imageCell.firstChild) imgWrapper.append(imageCell.firstChild);
      card.append(imgWrapper);
    }

    // Title cell
    if (titleCell) {
      const cardTitle = document.createElement('h3');
      cardTitle.className = 'hello-world-with-child-card-title';
      moveInstrumentation(titleCell, cardTitle);
      while (titleCell.firstChild) cardTitle.append(titleCell.firstChild);
      card.append(cardTitle);
    }

    grid.append(card);
  });

  // --- PART 4: Replace original content ---
  block.textContent = '';
  block.append(header, grid);
}
