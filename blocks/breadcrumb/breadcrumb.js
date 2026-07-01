/**
 * Breadcrumb block — auto-generated from page path with JSON-LD structured data.
 *
 * Can be authored (explicit links) or auto-generated from URL path.
 *
 * Authored structure:
 * | Breadcrumb |
 * | --- |
 * | [Home](/) > [Products](/products) > Current Page |
 *
 * Auto-generated (empty block):
 * | Breadcrumb |
 * | --- |
 * |  |
 *
 * @param {Element} block The breadcrumb block element
 */
export default function decorate(block) {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');
  ol.className = 'breadcrumb-list';

  // Check if author provided explicit breadcrumb links
  const existingLinks = block.querySelectorAll('a');
  const breadcrumbItems = [];

  if (existingLinks.length > 0) {
    // Use authored links
    existingLinks.forEach((link) => {
      breadcrumbItems.push({ name: link.textContent.trim(), url: link.href });
    });
    // Add current page (last text node without link)
    const allText = block.textContent.trim();
    const lastSegment = allText.split('>').pop()?.trim()
      || allText.split('/').pop()?.trim();
    if (lastSegment && !breadcrumbItems.some((item) => item.name === lastSegment)) {
      breadcrumbItems.push({ name: lastSegment, url: null });
    }
  } else {
    // Auto-generate from URL path
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    breadcrumbItems.push({ name: 'Home', url: '/' });
    let cumulativePath = '';
    pathSegments.forEach((segment, index) => {
      cumulativePath += `/${segment}`;
      const name = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const isLast = index === pathSegments.length - 1;
      breadcrumbItems.push({
        name,
        url: isLast ? null : cumulativePath,
      });
    });
  }

  // Build DOM
  breadcrumbItems.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'breadcrumb-item';
    const isLast = index === breadcrumbItems.length - 1;

    if (item.url && !isLast) {
      const link = document.createElement('a');
      link.href = item.url;
      link.textContent = item.name;
      li.append(link);
    } else {
      const span = document.createElement('span');
      span.textContent = item.name;
      span.setAttribute('aria-current', 'page');
      li.append(span);
    }

    ol.append(li);
  });

  nav.append(ol);

  // Add JSON-LD structured data
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems
      .filter((item) => item.url || item.name)
      .map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        ...(item.url && { item: new URL(item.url, window.location.origin).href }),
      })),
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.append(script);

  block.textContent = '';
  block.append(nav);
}

