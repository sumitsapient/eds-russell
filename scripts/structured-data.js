/**
 * structured-data.js - JSON-LD schema.org injection utilities.
 *
 * Centralises all structured data so every schema type lives here.
 * Blocks and templates import only what they need.
 *
 * Schema types covered:
 *   Organization  - site identity, social profiles (all pages)
 *   WebSite       - sitelinks SearchAction pointing at /search (all pages)
 *   WebPage       - page identity with breadcrumb link (all pages)
 *   BreadcrumbList- auto-generated from URL path (all pages)
 *   BlogPosting   - article rich results (article template)
 *   FAQPage       - accordion FAQ rich results (accordion.js - already done)
 *
 * Usage:
 *   import { injectOrganizationSchema, injectBreadcrumbSchema } from './structured-data.js';
 */
/** Reads a <meta> tag value. Checks name and property attributes. */
function getMeta(name) {
  return (
    document.querySelector(`meta[name="${name}"]`)?.content
    || document.querySelector(`meta[property="${name}"]`)?.content
    || ''
  );
}
/** Appends a JSON-LD <script> tag to <head>. */
function injectSchema(schema) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.append(script);
}
/** Converts a URL path segment to a readable label.
 *  "market-outlook-q3-2026" -> "Market Outlook Q3 2026"
 */
function segmentToLabel(segment) {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
// =============================================================================
// ORGANIZATION + WEBSITE (inject together — they reference each other)
// =============================================================================
/**
 * Injects Organization and WebSite JSON-LD schemas.
 *
 * Organization tells Google:
 *   - Who runs this site (name, URL, logo)
 *   - Social media profiles (sameAs)
 *
 * WebSite with SearchAction tells Google:
 *   - Show a search box in the sitelinks area of Google results
 *   - Searches link to /search?q={query} (built in Phase 18)
 *
 * Author metadata (set in Page Properties on the home page):
 *   site-name:        Russell Investments
 *   social-linkedin:  https://www.linkedin.com/company/russell-investments
 *   social-twitter:   https://twitter.com/russellinvests
 *   social-youtube:   https://www.youtube.com/c/russellinvestments
 */
export function injectOrganizationSchema() {
  const siteName = getMeta('site-name') || document.title || window.location.hostname;
  const { origin } = window.location;
  // Build sameAs array from metadata social-* tags
  const socialMeta = ['linkedin', 'twitter', 'facebook', 'youtube', 'instagram'];
  const sameAs = socialMeta
    .map((s) => getMeta(`social-${s}`))
    .filter(Boolean);
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: siteName,
    url: origin,
    logo: {
      '@type': 'ImageObject',
      url: `${origin}/favicon.ico`,
    },
  };
  if (sameAs.length) org.sameAs = sameAs;
  injectSchema(org);
  // WebSite with SearchAction (sitelinks search box)
  injectSchema({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${origin}/#website`,
    name: siteName,
    url: origin,
    publisher: { '@id': `${origin}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  });
}
// =============================================================================
// WEBPAGE
// =============================================================================
/**
 * Injects WebPage JSON-LD schema.
 * Gives Google explicit identity for every page — canonical URL, name, description.
 * Links the page to the WebSite entity (above).
 */
export function injectWebPageSchema() {
  const url = `${window.location.origin}${window.location.pathname}`;
  const title = getMeta('og:title') || document.title;
  const description = getMeta('description');
  const template = getMeta('template');
  const { origin } = window.location;
  // Choose the most specific @type for the page
  const typeMap = {
    article: 'Article',
    landing: 'WebPage',
    home: 'WebPage',
  };
  const pageType = typeMap[template] || 'WebPage';
  const schema = {
    '@context': 'https://schema.org',
    '@type': pageType,
    '@id': url,
    url,
    name: title,
    isPartOf: { '@id': `${origin}/#website` },
  };
  if (description) schema.description = description;
  injectSchema(schema);
}
// =============================================================================
// BREADCRUMB LIST
// =============================================================================
/**
 * Injects BreadcrumbList JSON-LD auto-generated from the page URL path.
 *
 * Example: /insights/market-outlook-q3-2026
 * ->
 *   Home (/) -> Insights (/insights) -> Market Outlook Q3 2026 (/insights/market-outlook-q3-2026)
 *
 * Google shows these breadcrumbs in search results, improving CTR.
 * Only injected on pages 2+ levels deep (top-level pages just show the site name).
 *
 * Custom breadcrumb labels can be set via meta:
 *   <meta name="breadcrumb-label" content="Q3 Market Outlook">
 * This replaces the auto-generated label for the current page.
 */
export function injectBreadcrumbSchema() {
  const { pathname } = window.location;
  const segments = pathname.split('/').filter(Boolean);
  // Nothing to add for home page or top-level pages
  if (segments.length < 1) return;
  const { origin } = window.location;
  // Build breadcrumb items from left to right
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: origin,
    },
  ];
  segments.forEach((seg, i) => {
    const path = `/${segments.slice(0, i + 1).join('/')}`;
    const isLast = i === segments.length - 1;
    // For the last segment, use the authored breadcrumb label if available
    const label = isLast
      ? (getMeta('breadcrumb-label') || getMeta('og:title') || segmentToLabel(seg))
      : segmentToLabel(seg);
    items.push({
      '@type': 'ListItem',
      position: i + 2,
      name: label,
      item: `${origin}${path}`,
    });
  });
  injectSchema({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  });
}
// =============================================================================
// ARTICLE / BLOG POSTING
// =============================================================================
/**
 * Injects BlogPosting JSON-LD for article template pages.
 * Google uses this to display article rich results (author, date, headline).
 *
 * Required page metadata (set in Page Properties):
 *   published-date  ISO date (e.g. 2026-07-05)
 *   author          Author full name
 *
 * Optional:
 *   modified-date   ISO date — defaults to published-date
 *   og:image        Article hero image URL
 */
export function injectArticleSchema() {
  const title = getMeta('og:title') || document.title;
  const description = getMeta('description');
  const image = getMeta('og:image');
  const datePublished = getMeta('published-date') || getMeta('date');
  const dateModified = getMeta('modified-date') || datePublished;
  const authorName = getMeta('author') || getMeta('author-name');
  const { origin } = window.location;
  const url = window.location.href;
  const siteName = getMeta('site-name') || window.location.hostname;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': url,
    headline: title,
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    isPartOf: { '@id': `${origin}/#website` },
    publisher: {
      '@type': 'Organization',
      '@id': `${origin}/#organization`,
      name: siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${origin}/favicon.ico`,
      },
    },
  };
  if (description) schema.description = description;
  if (image) schema.image = { '@type': 'ImageObject', url: image };
  if (datePublished) schema.datePublished = datePublished;
  if (dateModified) schema.dateModified = dateModified;
  if (authorName) schema.author = { '@type': 'Person', name: authorName };
  injectSchema(schema);
}
