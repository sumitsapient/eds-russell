/* eslint-disable */
/* global WebImporter */

/**
 * Parser for accordion-faq.
 * Source: russellinvestments.com — .faqCFDisplay (content-fragment FAQ list):
 *   h3.cmp-faq-cf-display__title ("FAQs")      -> default-content heading BEFORE the block
 *   article.cmp-faq-cf-display__faq            -> one item per question
 *     button.cmp-faq-cf-display__accordion-header .cmp-faq-cf-display__faq-element--question p
 *     div.cmp-faq-cf-display__faq-element--answer (paragraphs, lists, em/strong/links)
 * Fallback for plain <details>/<summary> markup.
 * Model (xwalk): container of accordion-faq-item { summary (text), text (richtext) } —
 * one row per item, two cells.
 */

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

/** Trim leading/trailing whitespace text and <br> inside a block element. */
function trimEdges(el) {
  ['firstChild', 'lastChild'].forEach((edge) => {
    let node = el[edge];
    while (node && ((node.nodeType === 3 && !node.textContent.trim()) || (node.nodeType === 1 && node.tagName === 'BR'))) {
      const next = edge === 'firstChild' ? node.nextSibling : node.previousSibling;
      node.remove();
      node = next;
    }
    if (node && node.nodeType === 3) {
      node.textContent = edge === 'firstChild' ? node.textContent.replace(/^\s+/, '') : node.textContent.replace(/\s+$/, '');
    }
  });
}

function answerNodes(answer, document) {
  if (!answer) return [];
  const blocks = [...answer.querySelectorAll('p, ul, ol, h4, h5, h6, table')]
    .filter((el) => !el.parentElement.closest('p, ul, ol, table'));
  if (!blocks.length && clean(answer.textContent)) {
    const p = document.createElement('p');
    p.textContent = clean(answer.textContent);
    return [p];
  }
  return blocks.filter((el) => clean(el.textContent) || el.querySelector('img')).map((el) => {
    trimEdges(el);
    return el;
  });
}

export default function parse(element, { document }) {
  const items = [];
  const articles = element.querySelectorAll('.cmp-faq-cf-display__faq');
  if (articles.length) {
    articles.forEach((article) => {
      const q = article.querySelector('.cmp-faq-cf-display__faq-element--question')
        || article.querySelector('.cmp-faq-cf-display__accordion-header');
      const a = article.querySelector('.cmp-faq-cf-display__faq-element--answer');
      items.push({ question: clean(q && q.textContent), answer: a });
    });
  } else {
    element.querySelectorAll('details').forEach((d) => {
      const summary = d.querySelector('summary');
      const body = document.createElement('div');
      [...d.childNodes].filter((n) => n !== summary).forEach((n) => body.append(n));
      items.push({ question: clean(summary && summary.textContent), answer: body });
    });
  }

  const cells = [];
  items.forEach(({ question, answer }) => {
    if (!question) return;
    const qFrag = document.createDocumentFragment();
    qFrag.appendChild(document.createComment(' field:summary '));
    qFrag.appendChild(document.createTextNode(question));
    const aFrag = document.createDocumentFragment();
    const nodes = answerNodes(answer, document);
    if (nodes.length) {
      aFrag.appendChild(document.createComment(' field:text '));
      nodes.forEach((n) => aFrag.appendChild(n));
    }
    cells.push([qFrag, aFrag]);
  });

  // Heading above the list stays default content before the block
  const leading = [];
  const title = element.querySelector('.cmp-faq-cf-display__title');
  if (title && clean(title.textContent)) {
    const tag = /^H[1-6]$/.test(title.tagName) ? title.tagName.toLowerCase() : 'h2';
    const h = document.createElement(tag);
    h.textContent = clean(title.textContent);
    leading.push(h);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(...leading, block);
}
