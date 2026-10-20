import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Stat tiles: each row is one tile with a bold value paragraph and a caption.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-stats-list';

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-stats-card';
    const body = document.createElement('div');
    body.className = 'cards-stats-body';

    [...row.children].forEach((cell) => {
      // the (single) text field's richtext instrumentation moves to the body that holds it
      moveInstrumentation(cell, body);
      while (cell.firstChild) body.append(cell.firstChild);
    });

    const blocks = [...body.children].filter((el) => el.textContent.trim());
    // The value is the first paragraph/heading with bold text, else the first element
    const value = blocks.find((el) => el.querySelector('strong, b') || /^H[1-6]$/.test(el.tagName))
      || blocks[0];
    if (value) value.classList.add('cards-stats-value');
    blocks.filter((el) => el !== value).forEach((el) => el.classList.add('cards-stats-caption'));

    // keep empty items that Universal Editor instruments, so authors can still select them
    if (blocks.length || row.hasAttribute('data-aue-resource')) {
      moveInstrumentation(row, li);
      li.append(body);
      ul.append(li);
    }
  });

  block.replaceChildren(ul);
}
