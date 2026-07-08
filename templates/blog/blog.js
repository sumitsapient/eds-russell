/**
 * blog template
 * Called by scripts.js after decorateMain() — sections are already decorated.
 *
 * Layout by section position:
 *   Section 1 → blog-hero     (full-width image row)
 *   Section 2 → blog-sidebar  (35% left: blog card)
 *   Section 3 → blog-body     (65% right: article text)
 *   Section 4 → blog-related  (full-width: related blogs)
 *
 * @param {Element} main The decorated <main> element
 */
function decorateBlogSections(main) {
  const sectionClasses = [
    'blog-hero',
    'blog-sidebar',
    'blog-body',
    'blog-related',
  ];
  const sections = main.querySelectorAll(':scope > .section');
  sections.forEach((section, i) => {
    if (sectionClasses[i]) section.classList.add(sectionClasses[i]);
  });
}
export default function decorate(main) {
  decorateBlogSections(main);
}
