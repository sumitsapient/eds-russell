import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Author bio panel.
 * Row 1 (optional): block heading text (single cell, no image), e.g. "Author bio".
 * Following rows: one author each - cell 1 photo, cell 2 richtext
 * (name as heading, role paragraph, bio paragraphs).
 * Bios are clamped with a "Read more" / "Read less" toggle when they overflow.
 * @param {Element} block The block element
 */

let instance = 0;

function isHeadingRow(row) {
  return row.children.length === 1 && !row.querySelector('img') && !row.querySelector('h1, h2, h3, h4, h5, h6');
}

function buildImage(cell) {
  const img = cell && cell.querySelector('img');
  if (!img) return null;
  const media = document.createElement('div');
  media.className = 'cards-author-bio-image';
  const picture = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '324' }]);
  moveInstrumentation(img, picture.querySelector('img'));
  moveInstrumentation(cell, media);
  media.append(picture);
  return media;
}

function setupToggle(about, bio, uid) {
  bio.id = uid;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cards-author-bio-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', uid);
  button.textContent = 'Read more';
  button.hidden = true;

  button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    button.textContent = expanded ? 'Read more' : 'Read less';
    about.classList.toggle('cards-author-bio-expanded', !expanded);
  });

  // Show the toggle only when the clamped bio actually overflows
  const check = () => {
    if (about.classList.contains('cards-author-bio-expanded')) return;
    const overflowing = bio.scrollHeight > bio.clientHeight + 1;
    button.hidden = !overflowing;
    about.classList.toggle('cards-author-bio-clamped', overflowing);
  };
  new ResizeObserver(check).observe(bio);

  about.append(button);
}

function buildBody(cell, uid) {
  const body = document.createElement('div');
  body.className = 'cards-author-bio-body';
  if (!cell) return body;
  // Universal Editor: the text cell is a richtext editable; it moves to the body, and the
  // Read more toggle is left out so its label does not end up in the edited richtext
  const editable = cell.hasAttribute('data-aue-prop');
  moveInstrumentation(cell, body);

  const items = [...cell.children];
  let name = items.find((el) => /^H[1-6]$/.test(el.tagName));
  if (!name) name = items.find((el) => el.tagName === 'P');
  const rest = items.filter((el) => el !== name);
  const role = rest.find((el) => el.tagName === 'P');
  const bioNodes = rest.filter((el) => el !== role);

  const info = document.createElement('div');
  info.className = 'cards-author-bio-info';
  if (name) {
    const h = document.createElement('h3');
    h.className = 'cards-author-bio-name';
    h.textContent = name.textContent.trim();
    moveInstrumentation(name, h);
    info.append(h);
  }
  if (role) {
    role.className = 'cards-author-bio-role';
    info.append(role);
  }
  if (info.children.length) body.append(info);

  if (bioNodes.length) {
    const about = document.createElement('div');
    about.className = 'cards-author-bio-about';
    const bio = document.createElement('div');
    bio.className = 'cards-author-bio-text';
    bio.append(...bioNodes);
    about.append(bio);
    if (!editable) setupToggle(about, bio, uid);
    body.append(about);
  }
  return body;
}

export default function decorate(block) {
  instance += 1;
  const rows = [...block.children];
  const nodes = [];

  if (rows.length && isHeadingRow(rows[0])) {
    const headingRow = rows.shift();
    const text = headingRow.textContent.trim();
    if (text) {
      const heading = document.createElement('h2');
      heading.className = 'cards-author-bio-heading';
      heading.textContent = text;
      // the block's heading field (on its row, cell or paragraph)
      [headingRow, ...headingRow.querySelectorAll('*')]
        .forEach((el) => moveInstrumentation(el, heading));
      nodes.push(heading);
    }
  }

  const ul = document.createElement('ul');
  ul.className = 'cards-author-bio-list';
  rows.forEach((row, i) => {
    // keep empty items that Universal Editor instruments, so authors can still select them
    if (!row.textContent.trim() && !row.querySelector('img')
      && !row.hasAttribute('data-aue-resource')) return;
    const cells = [...row.children];
    const imageCell = cells.find((c) => c.querySelector('img'));
    const textCell = cells.find((c) => c !== imageCell && c.textContent.trim());

    const li = document.createElement('li');
    li.className = 'cards-author-bio-card';
    moveInstrumentation(row, li);
    const media = buildImage(imageCell);
    if (media) li.append(media);
    li.append(buildBody(textCell, `cards-author-bio-${instance}-${i + 1}`));
    ul.append(li);
  });
  nodes.push(ul);

  block.replaceChildren(...nodes);
}
