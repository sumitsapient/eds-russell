# EDS Implementation Reference Guide

> A living document covering all concepts, patterns, and implementation details for this enterprise Edge Delivery Services project.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Three-Phase Loading Model](#three-phase-loading-model)
3. [Design System & Tokens](#design-system--tokens)
4. [Block Development Pattern](#block-development-pattern)
5. [Content Fragments Integration](#content-fragments-integration)
6. [Content Modeling (Universal Editor)](#content-modeling-universal-editor)
7. [Performance Optimization](#performance-optimization)
8. [SEO & Structured Data](#seo--structured-data)
9. [Accessibility Patterns](#accessibility-patterns)
10. [Analytics & Experimentation](#analytics--experimentation)
11. [Utility Functions Reference](#utility-functions-reference)

---

## Architecture Overview

### How EDS Works

```
Author (Universal Editor) → AEM Content → CDN Edge → HTML Page
                                                        ↓
                                            scripts.js → decorateMain()
                                                        ↓
                                            Sections decorated → Blocks loaded
                                                        ↓
                                            Block JS/CSS auto-loaded per block
```

### Key Principles

| Principle | Description |
|-----------|-------------|
| **No Build Step** | Vanilla JS/CSS served directly from CDN — no webpack, no transpiling |
| **Progressive Loading** | Eager → Lazy → Delayed phases maximize Core Web Vitals |
| **Convention over Config** | Block folder name = block class = auto-loaded JS/CSS |
| **Author-Driven** | Content structure comes from author; code decorates it |
| **Performance Budget** | Target: Lighthouse 100, LCP < 1.5s, < 200KB initial load |

### File Loading Order

```
1. styles/styles.css          (render-blocking, keep minimal)
2. scripts/scripts.js         (decorates page, triggers block loading)
3. blocks/{name}/{name}.css   (per-block, loaded when block appears)
4. blocks/{name}/{name}.js    (per-block, loaded when block appears)
5. styles/lazy-styles.css     (non-critical global styles)
6. scripts/delayed.js         (analytics, martech — 3s delay)
```

---

## Three-Phase Loading Model

### Eager Phase (LCP Critical)
- Decorates page structure (sections, blocks, buttons, icons)
- Loads ONLY the first section's blocks
- Adds `body.appear` to reveal the page
- Loads fonts on desktop or if cached

```javascript
async function loadEager(doc) {
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  decorateMain(main);                    // decorate everything
  document.body.classList.add('appear'); // reveal page
  await loadSection(main.querySelector('.section'), waitForFirstImage); // first section only
}
```

### Lazy Phase (Below the Fold)
- Loads header and footer
- Loads remaining sections and their blocks
- Loads `lazy-styles.css`
- Handles hash navigation

```javascript
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));
  await loadSections(main);              // all remaining sections
  loadFooter(doc.querySelector('footer'));
  loadCSS('styles/lazy-styles.css');
}
```

### Delayed Phase (Non-Critical)
- Analytics, tag managers, chat widgets
- Anything that can wait 3+ seconds
- Should never impact user experience

```javascript
function loadDelayed() {
  window.setTimeout(() => import('./delayed.js'), 3000);
}
```

---

## Design System & Tokens

### Token Architecture

All design tokens live in `styles/styles.css` as CSS Custom Properties on `:root`.

```css
:root {
  /* === COLOR TOKENS === */
  --color-primary: #3b63fb;
  --color-primary-hover: #1d3ecf;
  --color-secondary: #505050;
  --color-accent: #ff6b35;
  --color-background: #ffffff;
  --color-surface: #f8f8f8;
  --color-text: #131313;
  --color-text-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* === SPACING TOKENS === */
  --spacing-xs: 4px;
  --spacing-s: 8px;
  --spacing-m: 16px;
  --spacing-l: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
  --spacing-xxxl: 64px;

  /* === TYPOGRAPHY TOKENS === */
  --font-family-body: roboto, roboto-fallback, sans-serif;
  --font-family-heading: roboto-condensed, roboto-condensed-fallback, sans-serif;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 700;
  --line-height-tight: 1.25;
  --line-height-normal: 1.6;
  --line-height-loose: 1.8;

  /* === SHADOW TOKENS === */
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 5%);
  --shadow-md: 0 4px 6px rgb(0 0 0 / 7%);
  --shadow-lg: 0 10px 15px rgb(0 0 0 / 10%);
  --shadow-xl: 0 20px 25px rgb(0 0 0 / 15%);

  /* === BORDER TOKENS === */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* === MOTION TOKENS === */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-out: cubic-bezier(0, 0, 0.2, 1);

  /* === LAYOUT TOKENS === */
  --max-width-content: 1200px;
  --max-width-narrow: 800px;
  --max-width-wide: 1400px;
  --nav-height: 64px;
}
```

### Responsive Breakpoints

Mobile-first approach with these breakpoints:

| Name | Min-Width | Usage |
|------|-----------|-------|
| Mobile | default | Base styles |
| Tablet | 600px | Two-column layouts |
| Desktop | 900px | Full navigation, multi-column |
| Wide | 1200px | Max content width reached |

```css
/* Mobile first (default) */
.block .item { width: 100%; }

/* Tablet */
@media (min-width: 600px) {
  .block .item { width: 50%; }
}

/* Desktop */
@media (min-width: 900px) {
  .block .item { width: 33.33%; }
}
```

### Section Variants

Authors add section metadata to apply themes:

| Class | Effect |
|-------|--------|
| `light` / `highlight` | Light gray background |
| `dark` | Dark background with light text |
| `accent` | Brand accent background |
| `full-width` | Removes max-width constraint |
| `narrow` | Constrains content to 800px |

---

## Block Development Pattern

### Anatomy of a Block

```
blocks/
  myblock/
    myblock.js       # Decoration logic (default export)
    myblock.css      # Scoped styles
    _myblock.json    # Component model for Universal Editor
```

### Block JS Template

```javascript
/**
 * Loads and decorates the myblock block.
 * @param {Element} block The myblock block element
 */
export default async function decorate(block) {
  // 1. Extract configuration from block classes (variants)
  const isVariant = block.classList.contains('variant-name');

  // 2. Read authored content from DOM rows/cells
  const rows = [...block.children];
  rows.forEach((row) => {
    const [col1, col2] = [...row.children];
    // col1, col2 are the <div> cells authored in the table
  });

  // 3. Transform DOM (build new semantic markup)
  const container = document.createElement('div');
  container.className = 'myblock-container-inner';
  // ... build structure ...

  // 4. Replace original content
  block.textContent = '';
  block.append(container);

  // 5. Add interactivity (event listeners)
  block.addEventListener('click', (e) => { /* handle */ });
}
```

### Block CSS Template

```css
/* Always scope to the block */
.myblock {
  /* base styles */
}

.myblock .item {
  /* child element styles */
}

/* Variant: dark */
.myblock.dark {
  background: var(--color-text);
  color: var(--color-background);
}

/* Responsive */
@media (min-width: 600px) {
  .myblock .item { /* tablet */ }
}

@media (min-width: 900px) {
  .myblock .item { /* desktop */ }
}
```

### Content Model Template (`_myblock.json`)

```json
{
  "definitions": [
    {
      "title": "My Block",
      "id": "myblock",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "My Block",
              "model": "myblock"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "myblock",
      "fields": [
        {
          "component": "text",
          "name": "heading",
          "label": "Heading",
          "valueType": "string"
        },
        {
          "component": "richtext",
          "name": "description",
          "label": "Description",
          "valueType": "string"
        }
      ]
    }
  ],
  "filters": []
}
```

### Block Variants

Variants are applied as CSS classes on the block table in authoring:

```
| My Block (dark, centered) |
| --- |
| content... |
```

The classes `dark` and `centered` appear on the block element:
```html
<div class="myblock dark centered">...</div>
```

---

## Content Fragments Integration

### Overview

AEM Content Fragments provide structured, headless content consumed via GraphQL API.

### Utility Module: `scripts/content-fragments.js`

```javascript
/**
 * Content Fragments API client.
 * Fetches structured content from AEM via GraphQL persisted queries.
 */

const CF_CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches Content Fragment data from a persisted query.
 * @param {string} queryPath - The persisted query path (e.g., '/my-project/articles')
 * @param {Object} variables - GraphQL variables
 * @returns {Promise<Object>} The query result
 */
export async function fetchContentFragments(queryPath, variables = {}) {
  const cacheKey = `${queryPath}:${JSON.stringify(variables)}`;
  const cached = CF_CACHE.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const endpoint = `${window.hlx.codeBasePath}/graphql/execute.json${queryPath}`;
  const params = new URLSearchParams(variables).toString();
  const url = params ? `${endpoint}?${params}` : endpoint;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`CF fetch failed: ${response.status}`);
  
  const data = await response.json();
  CF_CACHE.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

/**
 * Renders a list of Content Fragments into a container.
 * @param {Array} items - CF items array
 * @param {Function} renderItem - Function that returns DOM element per item
 * @param {Element} container - Target container element
 */
export function renderFragmentList(items, renderItem, container) {
  const fragment = document.createDocumentFragment();
  items.forEach((item) => fragment.append(renderItem(item)));
  container.textContent = '';
  container.append(fragment);
}
```

### Usage in a Block

```javascript
import { fetchContentFragments, renderFragmentList } from '../../scripts/content-fragments.js';

export default async function decorate(block) {
  const data = await fetchContentFragments('/my-project/articles', { limit: 6 });
  const articles = data?.data?.articleList?.items || [];

  renderFragmentList(articles, (article) => {
    const card = document.createElement('article');
    card.innerHTML = `
      <img src="${article.heroImage._path}" alt="${article.title}" loading="lazy">
      <h3>${article.title}</h3>
      <p>${article.excerpt}</p>
    `;
    return card;
  }, block);
}
```

### Content Fragment Models (AEM Side)

Define in AEM as a Cloud Service → Tools → Content Fragment Models:

| Model | Fields |
|-------|--------|
| Article | title (text), author (text), date (date), body (multi-line), heroImage (content-ref), tags (enumeration) |
| Product | name (text), description (multi-line), price (number), sku (text), images (content-ref[]), features (multi-line) |
| TeamMember | name (text), role (text), bio (multi-line), photo (content-ref), socialLinks (json) |
| FAQ | question (text), answer (multi-line), category (enumeration) |
| Event | title (text), date (date), endDate (date), location (text), description (multi-line), registrationUrl (text) |
| Testimonial | quote (multi-line), authorName (text), company (text), avatar (content-ref), rating (number) |

---

## Content Modeling (Universal Editor)

### Model Structure

Models are defined in `_blockname.json` files and aggregated via `npm run build:json`.

### Field Components Available

| Component | Usage | ValueType |
|-----------|-------|-----------|
| `text` | Single-line text input | `string` |
| `richtext` | Rich text editor | `string` |
| `number` | Numeric input | `number` |
| `boolean` | Toggle/checkbox | `boolean` |
| `select` | Dropdown selection | `string` |
| `multiselect` | Multi-select | `string[]` |
| `aem-content` | Content path reference | `string` |
| `aem-tag` | Tag picker | `string[]` |
| `date-time` | Date/time picker | `string` |
| `reference` | Asset reference (images) | `string` |

### Model Best Practices

1. **Semantic naming** — Use meaningful field names (`heroImage` not `img1`)
2. **Required fields** — Mark essential fields with `"required": true`
3. **Placeholders** — Add `"placeholder"` for author guidance
4. **Descriptions** — Use `"description"` to explain field purpose
5. **Field groups** — Group related fields with `"component": "container"`
6. **Validation** — Use `"validation"` object for constraints

### Example: Hero Block Model

```json
{
  "id": "hero",
  "fields": [
    {
      "component": "reference",
      "name": "image",
      "label": "Background Image",
      "valueType": "string",
      "required": true
    },
    {
      "component": "text",
      "name": "heading",
      "label": "Heading",
      "valueType": "string",
      "required": true
    },
    {
      "component": "richtext",
      "name": "description",
      "label": "Description",
      "valueType": "string"
    },
    {
      "component": "text",
      "name": "ctaLabel",
      "label": "CTA Button Text",
      "valueType": "string"
    },
    {
      "component": "text",
      "name": "ctaLink",
      "label": "CTA Button Link",
      "valueType": "string"
    }
  ]
}
```

---

## Performance Optimization

### Critical Rendering Path

```
Browser Request → CDN Edge (cached HTML) → Parse HTML
  → Load styles.css (render-blocking, <2KB ideal)
  → Load scripts.js (defer, decorates DOM)
  → LCP image loads (preloaded in head.html)
  → First Contentful Paint
  → Block JS/CSS loaded per section
```

### Performance Checklist

| Technique | Implementation |
|-----------|---------------|
| Preload LCP image | `<link rel="preload" as="image">` in `head.html` |
| Font display | `font-display: swap` + fallback fonts with `size-adjust` |
| Lazy loading | All images below fold get `loading="lazy"` (automatic) |
| Code splitting | Each block's JS only loads when block is on page |
| CSS containment | `contain: content` on block containers |
| Resource hints | `<link rel="preconnect">` for API domains |
| Aspect ratios | Set on media containers to prevent CLS |
| Minimal CSS | Keep `styles.css` < 5KB for eager load |

### Image Optimization Rules

- Author-uploaded images: auto-optimized by AEM (WebP, responsive)
- Git-committed images: must be manually optimized (< 100KB, WebP/AVIF)
- Always specify `width` and `height` attributes
- Use `fetchpriority="high"` for hero/LCP images
- Use `loading="lazy"` for everything below the fold

### `head.html` Optimization

```html
<link rel="preconnect" href="https://publish-XXXX-XXXX.adobeaemcloud.com" crossorigin>
<link rel="preload" as="font" href="/fonts/roboto-regular.woff2" type="font/woff2" crossorigin>
<meta name="viewport" content="width=device-width, initial-scale=1">
```

---

## SEO & Structured Data

### Metadata Convention

Page metadata is authored in a "Metadata" table at the bottom of each page:

| Key | Value |
|-----|-------|
| title | Page Title |
| description | Meta description for search |
| image | /path/to/og-image.jpg |
| robots | index, follow |
| canonical | https://example.com/page |
| template | article |
| theme | dark |

Access in code: `getMetadata('description')`

### JSON-LD Implementation Pattern

```javascript
// In scripts.js or a utility
function addStructuredData(schema) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.append(script);
}

// Organization (every page)
addStructuredData({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Company Name',
  url: 'https://example.com',
  logo: 'https://example.com/icons/logo.svg',
});

// Breadcrumb (auto-generated from path)
function buildBreadcrumbSchema() {
  const path = window.location.pathname.split('/').filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: path.map((segment, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: segment.replace(/-/g, ' '),
      item: `${window.location.origin}/${path.slice(0, i + 1).join('/')}`,
    })),
  };
}
```

### Sitemap Configuration (`helix-sitemap.yaml`)

```yaml
sitemaps:
  default:
    origin: https://www.example.com
    include:
      - /**
    exclude:
      - /drafts/**
      - /fragments/**
```

---

## Accessibility Patterns

### Skip Link (add to `scripts.js`)

```javascript
function addSkipLink() {
  const skip = document.createElement('a');
  skip.href = '#main-content';
  skip.className = 'skip-to-content';
  skip.textContent = 'Skip to main content';
  document.body.prepend(skip);
  document.querySelector('main')?.setAttribute('id', 'main-content');
}
```

### Keyboard Navigation Pattern (for interactive blocks)

```javascript
// Arrow key navigation within a group
function setupKeyboardNav(container, itemSelector) {
  const items = [...container.querySelectorAll(itemSelector)];
  container.addEventListener('keydown', (e) => {
    const current = items.indexOf(document.activeElement);
    let next;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = (current + 1) % items.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = (current - 1 + items.length) % items.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = items.length - 1;
    }
    if (next !== undefined) {
      e.preventDefault();
      items[next].focus();
    }
  });
}
```

### Focus Trap (for modals)

```javascript
function trapFocus(element) {
  const focusable = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  element.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  first?.focus();
}
```

### ARIA Patterns Quick Reference

| Component | Role | Key Attributes |
|-----------|------|---------------|
| Tabs | `tablist`, `tab`, `tabpanel` | `aria-selected`, `aria-controls`, `aria-labelledby` |
| Accordion | `button` (trigger) | `aria-expanded`, `aria-controls` |
| Modal | `dialog` | `aria-modal="true"`, `aria-labelledby` |
| Carousel | `region` with `aria-roledescription` | `aria-label`, `aria-live="polite"` |
| Menu | `menu`, `menuitem` | `aria-haspopup`, `aria-expanded` |

---

## Analytics & Experimentation

### Built-in RUM (Real User Monitoring)

EDS includes automatic RUM tracking. Custom events can be added:

```javascript
// In delayed.js
function trackEvent(event, data = {}) {
  // sampleRUM is globally available from aem.js
  if (window.sampleRUM) {
    window.sampleRUM(event, data);
  }
}

// Track CTA clicks
document.querySelectorAll('a.button').forEach((btn) => {
  btn.addEventListener('click', () => {
    trackEvent('cta-click', { source: btn.textContent, target: btn.href });
  });
});
```

### Adobe Analytics / GA4 Integration

```javascript
// delayed.js — loaded 3s after page
// Google Analytics 4
const GA_ID = 'G-XXXXXXXXXX';
const script = document.createElement('script');
script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
script.async = true;
document.head.append(script);

window.dataLayer = window.dataLayer || [];
function gtag(...args) { window.dataLayer.push(args); }
gtag('js', new Date());
gtag('config', GA_ID);
```

### AEM Experimentation Plugin

```javascript
// In scripts.js loadEager(), before decorateMain:
const { loadEager: loadExperimentationEager } = await import('./experimentation.js');
await loadExperimentationEager(document);
```

Experiments are configured via page metadata:

| Key | Value |
|-----|-------|
| experiment | hero-test |
| experiment-variants | /variant-a, /variant-b |
| experiment-split | 33/33/34 |

---

## Utility Functions Reference

### From `aem.js` (DO NOT MODIFY)

| Function | Purpose |
|----------|---------|
| `loadHeader(headerEl)` | Loads header block into header element |
| `loadFooter(footerEl)` | Loads footer block into footer element |
| `decorateIcons(container)` | Converts `:icon-name:` spans to SVG icons |
| `decorateSections(main)` | Creates section wrappers from `<hr>` dividers |
| `decorateBlocks(main)` | Identifies blocks and prepares for loading |
| `loadSection(section, waitFn)` | Loads a single section's blocks |
| `loadSections(main)` | Loads all remaining sections |
| `loadCSS(href)` | Dynamically loads a CSS file |
| `getMetadata(name)` | Gets page metadata value by name |
| `toCamelCase(str)` | Converts kebab-case to camelCase |
| `toClassName(str)` | Converts string to valid CSS class name |
| `loadBlock(block)` | Loads a block's JS and CSS |
| `readBlockConfig(block)` | Reads key-value config from block table |
| `fetchPlaceholders(prefix)` | Fetches translation placeholders |
| `waitForFirstImage(section)` | Returns promise that resolves when first img loads |
| `createOptimizedPicture(src, alt, eager, breakpoints)` | Creates responsive picture element |

### From `scripts.js` (Custom Utilities)

| Function | Purpose |
|----------|---------|
| `moveAttributes(from, to, attrs)` | Transfers DOM attributes between elements |
| `moveInstrumentation(from, to)` | Transfers Universal Editor data attributes |
| `decorateButtons(main)` | Converts formatted links to button styling |
| `decorateMain(main)` | Orchestrates all page decoration |

### Common Patterns

#### Fetching JSON Data (Spreadsheets/Indexes)

```javascript
async function fetchIndex(indexPath = '/query-index.json') {
  const resp = await fetch(indexPath);
  const json = await resp.json();
  return json.data; // Array of page objects
}
```

#### Loading a Fragment

```javascript
import { loadFragment } from '../fragment/fragment.js';

const fragment = await loadFragment('/path/to/fragment');
// fragment is a DocumentFragment you can append
```

#### Creating Optimized Images

```javascript
import { createOptimizedPicture } from '../../scripts/aem.js';

const picture = createOptimizedPicture(
  '/path/to/image.jpg',
  'Alt text description',
  false, // eager = false (lazy load)
  [{ media: '(min-width: 600px)', width: '800' }, { width: '400' }]
);
```

#### Reading Block Configuration

When a block uses key-value rows:

```
| Key     | Value     |
|---------|-----------|
| color   | blue      |
| count   | 5         |
```

```javascript
import { readBlockConfig } from '../../scripts/aem.js';

export default function decorate(block) {
  const config = readBlockConfig(block);
  // config = { color: 'blue', count: '5' }
}
```

---

## Section Metadata

Authors can add a "Section Metadata" table at the end of any section:

| Key | Value |
|-----|-------|
| style | dark |
| background | /path/to/image.jpg |
| id | my-section |

This translates to:
```html
<div class="section dark" id="my-section" style="background-image: url(...)">
```

---

## Spreadsheet-Driven Configuration

EDS uses `.xlsx` spreadsheets published to JSON for dynamic data:

| Use Case | File | Endpoint |
|----------|------|----------|
| Redirects | `redirects.xlsx` | Auto-handled by CDN |
| Placeholders | `placeholders.xlsx` | `/placeholders.json` |
| Metadata | `metadata.xlsx` | Bulk page metadata |
| Query Index | `helix-query.yaml` | `/query-index.json` |
| Navigation | `nav` page | Loaded as fragment |

### Query Index Configuration (`helix-query.yaml`)

```yaml
indices:
  - name: default
    include:
      - /**
    exclude:
      - /drafts/**
      - /fragments/**
    properties:
      title:
        select: head > meta[property="og:title"]
        value: attribute(el, "content")
      description:
        select: head > meta[name="description"]
        value: attribute(el, "content")
      image:
        select: head > meta[property="og:image"]
        value: attribute(el, "content")
      lastModified:
        select: none
        value: dateValue(headers["last-modified"], "ddd, DD MMM YYYY hh:mm:ss GMT")
```

---

## Internationalization (i18n)

### Folder Structure

```
/en/          ← English (default)
/fr/          ← French
/de/          ← German
/es/          ← Spanish
```

### Placeholder System

Each locale has its own `placeholders.xlsx`:

```
/en/placeholders.xlsx → /en/placeholders.json
/fr/placeholders.xlsx → /fr/placeholders.json
```

Usage in code:
```javascript
import { fetchPlaceholders } from '../../scripts/aem.js';

const placeholders = await fetchPlaceholders();
const label = placeholders.readMore || 'Read More'; // Falls back to English
```

### Language in `scripts.js`

```javascript
// Detect locale from URL
const locale = window.location.pathname.split('/')[1] || 'en';
document.documentElement.lang = locale;
```

---

## Deployment & Environments

| Environment | URL Pattern | Content Source |
|-------------|-------------|----------------|
| Local Dev | `http://localhost:3000` | Preview content + local code |
| Feature Preview | `https://{branch}--{repo}--{owner}.aem.page` | Preview content + branch code |
| Production Preview | `https://main--{repo}--{owner}.aem.page` | Preview content + main code |
| Production Live | `https://main--{repo}--{owner}.aem.live` | Live content + main code |

### Workflow

```
Local Dev → Push Branch → Feature Preview → PR to main → Production
```

---

## Testing & Verification Guide

### Starting the Dev Server

```bash
# Install dependencies (first time only)
npm install

# Start dev server with drafts folder for test pages
npx -y @adobe/aem-cli up --no-open --forward-browser-logs --html-folder drafts

# OR if aem CLI is installed globally:
aem up --no-open --forward-browser-logs --html-folder drafts
```

The server runs at **http://localhost:3000**. Open in any browser.

### Test Page

Open: **http://localhost:3000/drafts/block-showcase**

This page tests ALL blocks. Here's what to verify:

---

### Block-by-Block Verification Checklist

#### 1. Breadcrumb Block
**What to look for:**
- Path shows: Home / Drafts / Block Showcase
- "Home" and "Drafts" are clickable links
- "Block Showcase" is bold text (current page, not a link)
- Separator `/` appears between items

**Inspect (F12):**
- Check `<head>` for a `<script type="application/ld+json">` with `BreadcrumbList` schema
- Nav element has `aria-label="Breadcrumb"`

---

#### 2. Accordion Block (Default)
**What to look for:**
- 4 collapsible panels, all closed initially
- Click a title → panel opens, chevron rotates
- Click again → panel closes
- Multiple panels can be open simultaneously (default mode)

**Keyboard test:**
- Tab to first accordion header
- Press **Enter** or **Space** → panel toggles
- Press **Arrow Down** → focus moves to next header
- Press **Arrow Up** → focus moves to previous header
- Press **Home** → focus jumps to first header
- Press **End** → focus jumps to last header

**Inspect:**
- Each trigger has `aria-expanded="true"` or `"false"`
- Each panel has `role="region"` and `aria-labelledby`
- Panel `id` matches trigger's `aria-controls`

---

#### 3. Accordion Block (Single + Bordered)
**What to look for:**
- Each item has a visible border and rounded corners
- Items have spacing between them
- Opening one panel **automatically closes** any other open panel
- Keyboard navigation same as above

---

#### 4. Tabs Block (Default)
**What to look for:**
- 3 tabs: Overview, Features, Performance
- First tab is active (blue text, blue underline)
- Clicking a tab switches content below
- Inactive tabs are gray

**Keyboard test:**
- Tab to the tab list
- **Arrow Right** → moves to next tab and activates it
- **Arrow Left** → moves to previous tab
- **Home** → first tab
- **End** → last tab
- **Tab** (key) from active tab → focus moves into the panel content

**Inspect:**
- Tab buttons have `role="tab"`, `aria-selected="true"/"false"`
- Active tab has `tabindex="0"`, others have `tabindex="-1"`
- Panels have `role="tabpanel"` and `aria-labelledby`

---

#### 5. Tabs Block (Pills Variant)
**What to look for:**
- Tabs appear as rounded pill buttons instead of underlined text
- Active pill has blue background with white text
- Same keyboard behavior as default tabs

---

#### 6. CTA Banner Block
**What to look for:**
- Full-width banner with background image
- Dark overlay on image for text readability
- White text (heading + paragraph) centered over image
- "Contact Us Today" button with white background

**Responsive test (resize browser):**
- Banner height adapts (300px mobile → 400px desktop)
- Content remains centered and readable

---

#### 7. CTA Banner (Solid Variant)
**What to look for:**
- Solid blue background (no image)
- White text centered
- "Sign Up Free" button
- No image overlay gradient

---

#### 8. Video Embed Block
**What to look for:**
- 16:9 aspect ratio container with black background
- YouTube thumbnail auto-loaded
- Red play button overlay
- **Click play** → YouTube iframe loads and video starts
- Before click: NO iframe in DOM (performance optimization)

**Keyboard test:**
- Tab to the play button area
- Press **Enter** or **Space** → video loads

---

#### 9. Video Embed (Custom Poster)
**What to look for:**
- Same as above but with the custom orange poster image instead of YouTube thumbnail

---

#### 10. Modal Block
**What to look for:**
- "Open Demo Modal" button on the page
- Click it → modal overlay appears with backdrop blur
- Modal has close (×) button in top-right
- Click backdrop (outside modal) → modal closes
- Press **Escape** → modal closes

**Keyboard test (critical for accessibility):**
- Open modal → focus automatically moves to close button
- Press **Tab** repeatedly → focus cycles WITHIN the modal (trapped)
- Press **Shift+Tab** → focus cycles backward within modal
- Focus should NEVER escape to the page behind

**Inspect:**
- Uses native `<dialog>` element
- Has `aria-modal="true"`
- After close, focus returns to the button that opened it

---

#### 11. Section Variants
**What to look for:**
- **Dark section:** Dark background (#131313), white text, light blue links
- **Accent section:** Blue background, white text, white button
- **Highlight section:** Light gray (#f8f8f8) background
- **Narrow section:** Content max-width is 800px instead of 1200px

---

#### 12. Button Variants (in narrow section)
**What to look for:**
- **Primary** (bold link): Dark filled button
- **Secondary** (italic link): Outlined button
- **Accent** (bold+italic link): Blue filled button

---

#### 13. Design System Tokens
**Inspect in DevTools (F12 → Elements → `:root`):**
- Color tokens: `--color-primary`, `--color-text`, etc.
- Spacing tokens: `--spacing-xs` through `--spacing-xxxl`
- Shadow tokens: `--shadow-sm` through `--shadow-xl`
- Motion tokens: `--duration-fast`, `--easing-default`

---

#### 14. Skip-to-Content Link (Accessibility)
**How to test:**
- Load the page, press **Tab** once
- A blue "Skip to main content" link appears at the top
- Press **Enter** → focus jumps to `<main>` content
- The link disappears when it loses focus

---

#### 15. Scroll Animations
**What to look for:**
- Sections below the first one fade in as you scroll down
- If you have `prefers-reduced-motion: reduce` in your OS settings, animations are disabled

---

#### 16. Dark Mode (if enabled in OS)
**How to test:**
- Set your OS to dark mode (Windows: Settings → Personalization → Colors → Dark)
- Reload the page
- Background should be dark (#1a1a2e), text should be light
- All blocks should remain readable

---

### Quick Debug Commands

```bash
# View raw HTML markup of test page
curl http://localhost:3000/drafts/block-showcase.plain.html

# View page as markdown
curl http://localhost:3000/drafts/block-showcase.md

# Check what the page returns
curl -I http://localhost:3000/drafts/block-showcase
```

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Block not loading | Block folder name doesn't match class | Verify `blocks/{name}/{name}.js` matches |
| Styles not applying | CSS not scoped to block | Prefix all selectors with `.blockname` |
| Section metadata not working | Wrong table format | Must be last element in section, key-value rows |
| Modal not opening | Trigger href doesn't match modal ID | Ensure `href="#modal-id"` matches `data-id` on block |
| Accordion all open on load | Expected behavior is all closed | Panels start with `hidden` attribute |
| Fonts not loading | Network issue on localhost | Check DevTools → Network for font files |

---

### How EDS Markup Works (Key Concept)

When you author a page, the CMS produces HTML like this:

```html
<!-- A section is everything between two --- (horizontal rules) -->
<div>
  <!-- Default content (headings, paragraphs, etc.) -->
  <h2>My Heading</h2>
  <p>Some text</p>
  
  <!-- A block is a div with a class matching the block name -->
  <div class="accordion">
    <!-- Each child div is a "row" -->
    <div>
      <!-- Each child of a row is a "cell" -->
      <div>Cell 1 content</div>
      <div>Cell 2 content</div>
    </div>
    <!-- More rows... -->
  </div>
  
  <!-- Section Metadata is a special block that configures the section -->
  <div class="section-metadata">
    <div>
      <div>style</div>
      <div>dark</div>
    </div>
  </div>
</div>
```

The `scripts.js` decorateMain() function:
1. Wraps each section in `.section` divs
2. Identifies blocks by their class names
3. Auto-loads `blocks/{classname}/{classname}.js` and `.css`
4. Calls the block's `decorate()` function

The block's `decorate(block)` function receives the `<div class="blockname">` element and transforms its children (rows/cells) into the final rendered DOM.

---

*This document is updated as implementation progresses. Last updated: July 1, 2026*

