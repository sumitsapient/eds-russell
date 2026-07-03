import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Accordion block â€” expandable content panels with full accessibility.
 * Supports Content Fragment data source [CF].
 *
 * Authored structure (each row = one accordion item):
 * | Accordion          |
 * | --- | --- |
 * | Question / Title 1 | Answer / Content 1 |
 * | Question / Title 2 | Answer / Content 2 |
 *
 * @param {Element} block The accordion block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const accordion = document.createElement('div');
  accordion.className = 'accordion-items';
  accordion.setAttribute('role', 'presentation');

  const singleOpen = block.classList.contains('single');

  rows.forEach((row, index) => {
    const [titleCell, contentCell] = [...row.children];
    if (!titleCell) return;

    const item = document.createElement('div');
    item.className = 'accordion-item';

    // Move Universal Editor instrumentation from row â†’ item
    moveInstrumentation(row, item);

    // Header / trigger
    const header = document.createElement('h3');
    header.className = 'accordion-header';
    const button = document.createElement('button');
    button.className = 'accordion-trigger';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `accordion-panel-${index}`);
    button.id = `accordion-header-${index}`;

    // Title span â€” move the actual titleCell children to preserve UE attributes
    const titleSpan = document.createElement('span');
    titleSpan.className = 'accordion-title';
    // Move instrumentation from titleCell to titleSpan, then move its children
    moveInstrumentation(titleCell, titleSpan);
    while (titleCell.firstChild) titleSpan.append(titleCell.firstChild);

    const iconSpan = document.createElement('span');
    iconSpan.className = 'accordion-icon';
    iconSpan.setAttribute('aria-hidden', 'true');

    button.append(titleSpan, iconSpan);
    header.append(button);

    // Panel / content
    const panel = document.createElement('div');
    panel.className = 'accordion-panel';
    panel.id = `accordion-panel-${index}`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', `accordion-header-${index}`);
    panel.hidden = true;

    const panelContent = document.createElement('div');
    panelContent.className = 'accordion-content';
    if (contentCell) {
      // Move instrumentation from contentCell to panelContent, then move children
      moveInstrumentation(contentCell, panelContent);
      while (contentCell.firstChild) panelContent.append(contentCell.firstChild);
    }
    panel.append(panelContent);

    // Toggle behavior
    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';

      if (singleOpen && !isExpanded) {
        accordion.querySelectorAll('.accordion-trigger[aria-expanded="true"]').forEach((openBtn) => {
          openBtn.setAttribute('aria-expanded', 'false');
          const openPanel = document.getElementById(openBtn.getAttribute('aria-controls'));
          if (openPanel) openPanel.hidden = true;
        });
      }

      button.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
      panel.hidden = isExpanded;
    });

    item.append(header, panel);
    accordion.append(item);
  });

  // Keyboard navigation between triggers
  accordion.addEventListener('keydown', (e) => {
    const triggers = [...accordion.querySelectorAll('.accordion-trigger')];
    const currentIndex = triggers.indexOf(document.activeElement);
    if (currentIndex < 0) return;

    let nextIndex;
    if (e.key === 'ArrowDown') nextIndex = (currentIndex + 1) % triggers.length;
    else if (e.key === 'ArrowUp') nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = triggers.length - 1;

    if (nextIndex !== undefined) {
      e.preventDefault();
      triggers[nextIndex].focus();
    }
  });

  block.textContent = '';
  block.append(accordion);

  // Inject FAQPage JSON-LD when the block has the "faq" class variant.
  // This tells Google to display Q&A rich results in search.
  if (block.classList.contains('faq')) {
    const faqItems = [...accordion.querySelectorAll('.accordion-item')].map((item) => ({
      '@type': 'Question',
      name: item.querySelector('.accordion-title')?.textContent.trim(),
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.querySelector('.accordion-content')?.textContent.trim(),
      },
    })).filter((q) => q.name);

    if (faqItems.length > 0) {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems,
      };
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.append(script);
    }
  }
}
