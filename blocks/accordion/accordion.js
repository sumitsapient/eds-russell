/**
 * Accordion block — expandable content panels with full accessibility.
 * Supports Content Fragment data source [CF].
 *
 * Authored structure (each row = one panel):
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

  // Allow all-open or single-open via variant class
  const singleOpen = block.classList.contains('single');

  rows.forEach((row, index) => {
    const [titleCell, contentCell] = [...row.children];
    if (!titleCell) return;

    const item = document.createElement('div');
    item.className = 'accordion-item';

    // Header / trigger
    const header = document.createElement('h3');
    header.className = 'accordion-header';
    const button = document.createElement('button');
    button.className = 'accordion-trigger';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `accordion-panel-${index}`);
    button.id = `accordion-header-${index}`;
    button.innerHTML = `<span class="accordion-title">${titleCell.innerHTML}</span>
      <span class="accordion-icon" aria-hidden="true"></span>`;
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
      panelContent.innerHTML = contentCell.innerHTML;
    }
    panel.append(panelContent);

    // Toggle behavior
    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';

      // If single-open mode, close all others
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
}

