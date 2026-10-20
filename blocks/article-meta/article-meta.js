import { moveInstrumentation } from '../../scripts/scripts.js';

const ICONS = {
  print: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7 3h10v4H7zM5 8h14a2 2 0 0 1 2 2v6h-4v4H7v-4H3v-6a2 2 0 0 1 2-2m4 7v3h6v-3zm8-4.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2"/></svg>',
  email: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1m.8 2v.3L12 12l7.2-4.7V7zm14.4 2.4L12.5 13.8a1 1 0 0 1-1 0L4.8 9.4V17h14.4z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M5.3 8.6h2.9V19H5.3zM6.8 4a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4m3.4 4.6H13V10c.4-.8 1.4-1.6 2.9-1.6 3 0 3.6 2 3.6 4.6V19h-2.9v-5.3c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V19h-2.9z"/></svg>',
};

/**
 * Collects the authored lines of the block: paragraphs/list items from every cell.
 * Cells holding bare text (Universal Editor text fields) become a paragraph.
 * @param {Element} block
 * @returns {{ lines: Element[], fields: { cell: Element, lines: Element[] }[] }}
 *   lines, plus the instrumented cells (Universal Editor fields) and the lines they produced
 */
function collectLines(block) {
  const lines = [];
  const fields = [];
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const start = lines.length;
      const elements = [...cell.children];
      if (!elements.length) {
        const text = cell.textContent.trim();
        if (text) {
          const p = document.createElement('p');
          p.textContent = text;
          lines.push(p);
        }
      }
      elements.forEach((el) => {
        if (el.matches('ul, ol')) {
          [...el.children].forEach((li) => {
            const p = document.createElement('p');
            moveInstrumentation(li, p);
            p.append(...li.childNodes);
            lines.push(p);
          });
        } else if (el.textContent.trim()) {
          lines.push(el);
        }
      });
      if (cell.hasAttribute('data-aue-prop')) fields.push({ cell, lines: lines.slice(start) });
    });
  });
  return { lines, fields };
}

/**
 * Universal Editor: moves each field's instrumentation from its (dropped) cell to the
 * element that now displays it: the container holding only its lines, else its single line.
 * @param {{ cell: Element, lines: Element[] }[]} fields
 */
function moveFieldInstrumentation(fields) {
  fields.forEach(({ cell, lines }) => {
    const container = lines[0]?.parentElement;
    if (container && container.children.length === lines.length
      && lines.every((line) => line.parentElement === container)) {
      moveInstrumentation(cell, container);
    } else if (lines.length === 1) {
      moveInstrumentation(cell, lines[0]);
    }
  });
}

/**
 * Builds one round share control.
 * @param {string} type print | email | linkedin
 * @param {string} label accessible name
 * @param {string} [href] link target; omitted for the print button
 */
function buildShareControl(type, label, href) {
  const control = document.createElement(href ? 'a' : 'button');
  control.className = `article-meta-share-button article-meta-share-${type}`;
  control.setAttribute('aria-label', label);
  control.title = label;
  control.innerHTML = ICONS[type];
  if (href) {
    control.href = href;
    if (type === 'linkedin') {
      control.target = '_blank';
      control.rel = 'noopener noreferrer';
    }
  } else {
    control.type = 'button';
    control.addEventListener('click', () => window.print());
  }
  const li = document.createElement('li');
  li.append(control);
  return li;
}

/**
 * Article byline: author names, published / updated dates and share buttons
 * (print, email, LinkedIn) generated from the current page.
 * Lines starting with "Published" or "Updated" are dates; every other line is an author.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const { lines, fields } = collectLines(block);

  const info = document.createElement('div');
  info.className = 'article-meta-info';
  const authors = document.createElement('div');
  authors.className = 'article-meta-authors';
  const dates = document.createElement('div');
  dates.className = 'article-meta-dates';

  lines.forEach((line) => {
    const text = line.textContent.trim();
    if (/^published\b/i.test(text)) {
      line.classList.add('article-meta-published');
      dates.append(line);
    } else if (/^updated\b/i.test(text)) {
      line.classList.add('article-meta-updated');
      dates.append(line);
    } else {
      line.classList.add('article-meta-author');
      authors.append(line);
    }
  });
  if (authors.children.length) info.append(authors);
  if (dates.children.length) info.append(dates);
  moveFieldInstrumentation(fields);

  const pageUrl = window.location.href.split('#')[0];
  const title = document.querySelector('h1')?.textContent.trim() || document.title;
  const mailto = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${title}\n${pageUrl}`)}`;
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`;

  const share = document.createElement('ul');
  share.className = 'article-meta-share';
  share.setAttribute('aria-label', 'Share this article');
  share.append(
    buildShareControl('print', 'Print this article'),
    buildShareControl('email', 'Share by email', mailto),
    buildShareControl('linkedin', 'Share on LinkedIn (opens in a new window)', linkedin),
  );

  block.replaceChildren(info, share);
}
