import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

// Cell order of each item row (mirrors the UE model; collapsed *Alt fields excluded)
const FIELDS = ['image', 'text', 'authorImage', 'author'];

/**
 * Returns an optimized <picture> for the first image in a cell (<picture> or bare <img> in <p>).
 * @param {Element} cell
 * @param {string} width
 */
function getPicture(cell, width) {
  const img = cell?.querySelector('img');
  if (!img || !img.getAttribute('src')) return null;
  const picture = createOptimizedPicture(img.src, img.alt || '', false, [{ width }]);
  moveInstrumentation(img, picture.querySelector('img'));
  return picture;
}

/**
 * Builds one research card from an item row's named cells.
 * @param {Object<string, Element>} cells
 */
function buildCard(cells, row) {
  const card = document.createElement('li');
  card.className = 'cards-research-card';
  moveInstrumentation(row, card);

  const picture = getPicture(cells.image, '750');
  if (picture) {
    const media = document.createElement('div');
    media.className = 'cards-research-card-image';
    moveInstrumentation(cells.image, media);
    media.append(picture);
    card.append(media);
  }

  const body = document.createElement('div');
  body.className = 'cards-research-card-body';
  if (cells.text) {
    // Universal Editor: keep the instrumented text cell as its own richtext editable,
    // so the author byline below is not part of the text field
    const textTarget = cells.text.hasAttribute('data-aue-prop') ? cells.text : body;
    if (textTarget !== body) {
      textTarget.className = 'cards-research-card-text';
      body.append(textTarget);
    }
    let headingSeen = false;
    [...cells.text.children].forEach((el) => {
      if (!el.textContent.trim()) {
        if (textTarget !== body) el.remove();
        return;
      }
      if (/^H[1-6]$/.test(el.tagName)) {
        el.classList.add('cards-research-card-title');
        headingSeen = true;
      } else {
        el.classList.add(headingSeen ? 'cards-research-card-description' : 'cards-research-card-date');
      }
      textTarget.append(el);
    });
  }

  const avatar = getPicture(cells.authorImage, '240');
  const authorEls = cells.author
    ? [...cells.author.children].filter((el) => el.textContent.trim())
    : [];
  if (avatar || authorEls.length) {
    const author = document.createElement('div');
    author.className = 'cards-research-card-author';
    if (avatar) {
      const avatarWrap = document.createElement('div');
      avatarWrap.className = 'cards-research-card-avatar';
      moveInstrumentation(cells.authorImage, avatarWrap);
      avatarWrap.append(avatar);
      author.append(avatarWrap);
    }
    if (authorEls.length) {
      const text = document.createElement('div');
      text.className = 'cards-research-card-author-text';
      moveInstrumentation(cells.author, text);
      authorEls[0].classList.add('cards-research-card-author-name');
      authorEls.slice(1).forEach((el) => el.classList.add('cards-research-card-author-role'));
      text.append(...authorEls);
      author.append(text);
    }
    body.append(author);
  }

  card.append(body);
  return card;
}

/**
 * Related research cards. Each row is one card: image | text | authorImage | author.
 * text = date paragraph + linked heading title; author = name paragraph + role paragraph.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'cards-research-list';

  [...block.children].forEach((row) => {
    const cellEls = [...row.children];
    if (!cellEls.length) return;
    const cells = {};
    FIELDS.forEach((name, i) => { cells[name] = cellEls[i] || null; });
    // keep empty items that Universal Editor instruments, so authors can still select them
    if (!row.textContent.trim() && !row.querySelector('img')
      && !row.hasAttribute('data-aue-resource')) return;
    list.append(buildCard(cells, row));
  });

  block.replaceChildren(list);
}
