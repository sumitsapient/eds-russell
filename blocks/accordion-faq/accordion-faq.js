import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * FAQ accordion. Each row is one item: summary (question) | text (answer).
 * Rendered as native <details>/<summary> elements for built-in keyboard and screen reader support.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const items = [];

  [...block.children].forEach((row) => {
    const [labelCell, bodyCell] = row.children;
    // keep empty items that Universal Editor instruments, so authors can still select them
    if ((!labelCell || !labelCell.textContent.trim()) && !row.hasAttribute('data-aue-resource')) return;

    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    moveInstrumentation(row, details);

    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-summary';

    const title = document.createElement('span');
    title.className = 'accordion-faq-title';
    // unwrap a single paragraph so the title is inline text inside <summary>
    const only = labelCell?.children.length === 1 ? labelCell.firstElementChild : null;
    if (labelCell) {
      // the summary field (on its cell or paragraph) is edited on the visible title
      moveInstrumentation(labelCell, title);
      if (only) moveInstrumentation(only, title);
      title.append(...(only && only.tagName === 'P' ? only.childNodes : labelCell.childNodes));
    }

    const icon = document.createElement('span');
    icon.className = 'accordion-faq-icon';
    icon.setAttribute('aria-hidden', 'true');

    summary.append(title, icon);
    details.append(summary);

    if (bodyCell && (bodyCell.textContent.trim() || bodyCell.querySelector('img')
      || bodyCell.hasAttribute('data-aue-prop'))) {
      const body = document.createElement('div');
      body.className = 'accordion-faq-body';
      moveInstrumentation(bodyCell, body);
      body.append(...bodyCell.childNodes);
      details.append(body);
    }

    items.push(details);
  });

  block.replaceChildren(...items);
}
