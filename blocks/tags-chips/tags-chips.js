import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Tag chips: each row is one tag (plain text, optionally linked).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'tags-chips-list';

  [...block.children].forEach((row) => {
    const text = row.textContent.trim();
    // keep empty items that Universal Editor instruments, so authors can still select them
    if (!text && !row.hasAttribute('data-aue-resource')) return;

    const li = document.createElement('li');
    li.className = 'tags-chips-item';
    moveInstrumentation(row, li);

    const link = row.querySelector('a[href]');
    let chip;
    if (link) {
      chip = document.createElement('a');
      chip.href = link.getAttribute('href');
      if (link.title && link.title !== link.textContent.trim()) chip.title = link.title;
      chip.textContent = link.textContent.trim() || text;
    } else {
      chip = document.createElement('span');
      chip.textContent = text;
    }
    chip.className = 'tags-chips-chip';

    // Universal Editor: keep the instrumented richtext cell around the chip, so editing
    // the tag in place keeps its link
    const field = row.querySelector('[data-aue-prop]');
    if (field && field.matches('a, span, strong, em')) {
      moveInstrumentation(field, chip);
      li.append(chip);
    } else if (field) {
      field.replaceChildren(chip);
      li.append(field);
    } else {
      li.append(chip);
    }
    ul.append(li);
  });

  ul.setAttribute('aria-label', 'Tags');
  block.replaceChildren(ul);
}
