import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Helloworld block Ã¢â‚¬â€ simple block with a title and description.
 *
 * Authored structure:
 * | Helloworld  |                    |
 * | ----------- | ------------------ |
 * | Hello World | Welcome to my site |
 *
 * @param {Element} block The helloworld block element
 */
export default function decorate(block) {
  // Step A: Get the first (and only) row from the block
  // block.children = all the rows inside the block table
  const row = block.firstElementChild;
  if (!row) return;

  // Step B: Get the two cells from that row
  // row.children[0] = first cell  = title
  // row.children[1] = second cell = description
  const titleCell = row.children[0];
  const descriptionCell = row.children[1];

  // Step C: Build new semantic HTML elements
  const wrapper = document.createElement('div');
  wrapper.className = 'helloworld-content';

  const heading = document.createElement('h2');
  heading.className = 'helloworld-title';

  const description = document.createElement('p');
  description.className = 'helloworld-description';

  // Step D: Move content from cells into new elements
  // IMPORTANT: We use moveInstrumentation + move children (not innerHTML)
  // so Universal Editor can still edit the fields after decoration
  if (titleCell) {
    moveInstrumentation(titleCell, heading);
    while (titleCell.firstChild) heading.append(titleCell.firstChild);
  }

  if (descriptionCell) {
    moveInstrumentation(descriptionCell, description);
    while (descriptionCell.firstChild) description.append(descriptionCell.firstChild);
  }

  // Step E: Assemble the final structure
  wrapper.append(heading, description);

  // Step F: Replace original block content with new structure
  block.textContent = '';
  block.append(wrapper);
}
