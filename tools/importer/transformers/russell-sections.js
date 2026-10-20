/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Russell Investments sections.
 * Inserts section breaks (<hr>) and Section Metadata blocks based on
 * payload.template.sections (tools/importer/page-templates.json).
 *
 * Detection is content-driven: each section is located purely by its DOM
 * selector array (tried in order). Sections not present on a page are skipped,
 * and found sections are ordered by their DOM position, so any combination /
 * order of sections imports correctly.
 *
 * AEM layout containers nest duplicate classes (e.g. .cmp-layout-container--white-bg
 * inside .cmp-layout-container--white-bg), so only the OUTERMOST match is used.
 *
 * beforeTransform: insert <hr> breaks (marked with data-excat-section-id) while
 *                  parser target elements still exist.
 * afterTransform:  insert Section Metadata for styled sections, clean up markers.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };
const MARKER = 'data-excat-section-id';
const FIRST_MARKER = 'data-excat-section-first';

// Section elements found in beforeTransform, keyed by section id
let sectionElements = new Map();

function toArray(selector) {
  if (!selector) return [];
  return Array.isArray(selector) ? selector : [selector];
}

function safeQueryAll(root, selector) {
  try {
    return [...root.querySelectorAll(selector)];
  } catch (e) {
    return [];
  }
}

/**
 * Return the first outermost element matching any of the selectors (tried in order),
 * skipping elements already claimed by another section or nested in / wrapping one.
 */
function findSectionElement(root, section, claimed) {
  const selectors = toArray(section.selector);
  for (let s = 0; s < selectors.length; s += 1) {
    const matches = safeQueryAll(root, selectors[s]);
    const outermost = matches.filter(
      (el) => !matches.some((other) => other !== el && other.contains(el)),
    );
    const found = outermost.find((el) => !claimed.some(
      (c) => c === el || c.contains(el) || el.contains(c),
    ));
    if (found) return found;
  }
  return null;
}

function sortByDocumentOrder(entries) {
  return entries.sort((a, b) => {
    if (a.el === b.el) return 0;
    // eslint-disable-next-line no-bitwise
    return (a.el.compareDocumentPosition(b.el) & 4) ? -1 : 1; // 4 = DOCUMENT_POSITION_FOLLOWING
  });
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  const sections = (template && Array.isArray(template.sections)) ? template.sections : [];
  if (sections.length < 2) return;

  const document = (payload && payload.document) || element.ownerDocument;

  if (hookName === TransformHook.beforeTransform) {
    sectionElements = new Map();
    const claimed = [];
    const found = [];
    sections.forEach((section) => {
      const el = findSectionElement(element, section, claimed);
      if (el) {
        claimed.push(el);
        found.push({ section, el });
      }
    });
    if (found.length === 0) return;

    sortByDocumentOrder(found);

    // Reverse walk so insertions don't disturb positions of earlier sections
    for (let i = found.length - 1; i >= 0; i -= 1) {
      const { section, el } = found[i];
      sectionElements.set(section.id, el);
      if (i > 0) {
        const hr = document.createElement('hr');
        hr.setAttribute(MARKER, section.id);
        el.before(hr);
      } else if (section.style) {
        // Styled first section: temporary marker only (removed in afterTransform)
        const hr = document.createElement('hr');
        hr.setAttribute(MARKER, section.id);
        hr.setAttribute(FIRST_MARKER, 'true');
        el.before(hr);
      }
    }
  }

  if (hookName === TransformHook.afterTransform) {
    const markers = [...element.querySelectorAll(`hr[${MARKER}]`)];
    const byId = new Map(sections.map((s) => [s.id, s]));

    for (let i = markers.length - 1; i >= 0; i -= 1) {
      const hr = markers[i];
      const section = byId.get(hr.getAttribute(MARKER));
      if (section && section.style) {
        const meta = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        const el = sectionElements.get(section.id);
        const next = markers[i + 1];
        if (el && el.isConnected && element.contains(el)) {
          el.after(meta);
        } else if (next) {
          next.before(meta);
        } else {
          element.append(meta);
        }
      }
    }

    markers.forEach((hr) => {
      if (hr.hasAttribute(FIRST_MARKER)) {
        hr.remove();
      } else {
        hr.removeAttribute(MARKER);
      }
    });
    sectionElements = new Map();
  }
}
