/**
 * Tabs block — tabbed content interface with full keyboard accessibility.
 *
 * Authored structure (each row = one tab):
 * | Tabs               |
 * | --- | --- |
 * | Tab Label 1 | Tab Content 1 |
 * | Tab Label 2 | Tab Content 2 |
 *
 * @param {Element} block The tabs block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Build tab list
  const tabList = document.createElement('div');
  tabList.className = 'tabs-list';
  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-label', 'Tabs');

  const panelsContainer = document.createElement('div');
  panelsContainer.className = 'tabs-panels';

  rows.forEach((row, index) => {
    const [labelCell, contentCell] = [...row.children];
    if (!labelCell) return;

    const isFirst = index === 0;
    const tabId = `tab-${index}`;
    const panelId = `tabpanel-${index}`;

    // Tab button
    const tab = document.createElement('button');
    tab.className = 'tabs-tab';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', isFirst ? 'true' : 'false');
    tab.setAttribute('aria-controls', panelId);
    tab.setAttribute('tabindex', isFirst ? '0' : '-1');
    tab.id = tabId;
    tab.textContent = labelCell.textContent.trim();
    tabList.append(tab);

    // Tab panel
    const panel = document.createElement('div');
    panel.className = 'tabs-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    panel.id = panelId;
    panel.hidden = !isFirst;
    panel.tabIndex = 0;

    if (contentCell) {
      panel.innerHTML = contentCell.innerHTML;
    }
    panelsContainer.append(panel);
  });

  // Tab activation
  function activateTab(selectedTab) {
    const tabs = [...tabList.querySelectorAll('[role="tab"]')];
    const panels = [...panelsContainer.querySelectorAll('[role="tabpanel"]')];

    tabs.forEach((tab, i) => {
      const isSelected = tab === selectedTab;
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
      panels[i].hidden = !isSelected;
    });

    selectedTab.focus();
  }

  // Click handler
  tabList.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) activateTab(tab);
  });

  // Keyboard navigation (arrow keys, Home, End)
  tabList.addEventListener('keydown', (e) => {
    const tabs = [...tabList.querySelectorAll('[role="tab"]')];
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex < 0) return;

    let nextIndex;
    if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = tabs.length - 1;

    if (nextIndex !== undefined) {
      e.preventDefault();
      activateTab(tabs[nextIndex]);
    }
  });

  block.textContent = '';
  block.append(tabList, panelsContainer);
}
