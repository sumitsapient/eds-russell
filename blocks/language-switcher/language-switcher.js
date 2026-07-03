import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Language Switcher block — locale dropdown for multi-language EDS sites.
 *
 * Authored structure (one row per language):
 * | Language Switcher |      |       |
 * |-------------------|------|-------|
 * | English           | en   | /     |   ← label | locale code | base path
 * | Français          | fr   | /fr   |
 * | Deutsch           | de   | /de   |
 * | العربية           | ar   | /ar   |
 *
 * The switcher replaces the current locale prefix in the URL when changed.
 * e.g. on /fr/products → switching to German navigates to /de/products
 *
 * @param {Element} block The language-switcher block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Detect current locale from URL path
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const supportedLocales = ['en', 'fr', 'de', 'es', 'it', 'ja', 'ko', 'zh', 'ar', 'he', 'pt', 'nl'];
  const currentLocale = supportedLocales.includes(pathParts[0]) ? pathParts[0] : 'en';

  // Build language options from authored rows
  const options = rows.map((row) => {
    const [labelCell, codeCell, pathCell] = [...row.children];
    return {
      label: labelCell?.textContent.trim() || '',
      code: codeCell?.textContent.trim() || '',
      basePath: pathCell?.textContent.trim() || '/',
    };
  }).filter((o) => o.label && o.code);

  if (!options.length) return;

  // Build the switcher DOM
  const wrapper = document.createElement('div');
  wrapper.className = 'language-switcher-wrapper';
  moveInstrumentation(block.firstElementChild || block, wrapper);

  const label = document.createElement('label');
  label.className = 'language-switcher-label';
  label.htmlFor = 'language-select';
  label.textContent = 'Language';

  const select = document.createElement('select');
  select.id = 'language-select';
  select.className = 'language-switcher-select';
  select.setAttribute('aria-label', 'Select language');

  options.forEach(({ label: optLabel, code, basePath }) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = optLabel;
    if (code === currentLocale) option.selected = true;

    // Build the equivalent page URL in the target locale
    // Strip current locale prefix then prepend the new one
    const pagePath = window.location.pathname
      .replace(new RegExp(`^/${currentLocale}(/|$)`), '/')
      .replace(/^\/\//, '/');

    const targetPath = basePath === '/'
      ? pagePath // default locale — no prefix
      : `${basePath}${pagePath}`;

    option.dataset.href = targetPath + window.location.search;
    select.append(option);
  });

  // Navigate on change
  select.addEventListener('change', () => {
    const selected = select.options[select.selectedIndex];
    if (selected?.dataset.href) {
      window.location.href = selected.dataset.href;
    }
  });

  wrapper.append(label, select);
  block.textContent = '';
  block.append(wrapper);
}
