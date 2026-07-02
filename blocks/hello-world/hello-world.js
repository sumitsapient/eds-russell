import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Hello World block.
 *
 * AEM generates this structure (two rows, one cell each):
 *
 * <div class="hello-world block">
 *   <div>                        <- row 1
 *     <div><p>Hello World</p>    <- cell = title
 *   </div>
 *   <div>                        <- row 2
 *     <div><p>Welcome...</p>     <- cell = description
 *   </div>
 * </div>
 *
 * @param {Element} block The hello-world block element
 */
export default function decorate(block) {
  const rows = [...block.children];

  // Row 1 = title, Row 2 = description
  const titleCell = rows[0]?.children[0];
  const descriptionCell = rows[1]?.children[0];

  // Build new semantic elements
  const wrapper = document.createElement('div');
  wrapper.className = 'hello-world-content';

  const heading = document.createElement('h2');
  heading.className = 'hello-world-title';

  const description = document.createElement('p');
  description.className = 'hello-world-description';

  // Move content + UE data-aue-* attributes into new elements
  if (titleCell) {
    moveInstrumentation(titleCell, heading);
    while (titleCell.firstChild) heading.append(titleCell.firstChild);
  }

  if (descriptionCell) {
    moveInstrumentation(descriptionCell, description);
    while (descriptionCell.firstChild) description.append(descriptionCell.firstChild);
  }

  wrapper.append(heading, description);

  block.textContent = '';
  block.append(wrapper);
}
