# Sumit's EDS Learning Notes

> Personal reference — updated only on request.

---

## Table of Contents

1. [HelloWorld Block](#helloworld-block)
   - [Files Created](#files-created)
   - [File 1: helloworld.js](#file-1-helloworldjs)
   - [File 2: helloworld.css](#file-2-helloworldcss)
   - [File 3: _helloworld.json](#file-3-_helloworldjson)
   - [File 4: models/_section.json](#file-4-models_sectionjson)
   - [Build Step](#build-step)
   - [Q&A](#qa)
2. [Debugging & Fixes](#debugging--fixes)
   - [Fix 1: Block CSS Not Applying](#fix-1-block-css-not-applying)
   - [Fix 2: Wrong Block Folder Name](#fix-2-wrong-block-folder-name--the-naming-rule)
3. [Complete Block Loading Journey](#complete-block-loading-journey)
   - [Layer 1: Authoring](#layer-1-authoring-universal-editor)
   - [Layer 2: Content Delivery](#layer-2-content-delivery-aem--edge-cdn)
   - [Layer 3: Browser Receives Page](#layer-3-browser-receives-the-page)
   - [Layer 4: Eager Phase](#layer-4-eager-phase--critical-path-lcp)
   - [Layer 5: Lazy Phase](#layer-5-lazy-phase--everything-else)
   - [Layer 6: Loading the Block](#layer-6-loading-the-hello-world-block)
   - [Layer 7: decorate() Runs](#layer-7-your-decorate-runs)
   - [Layer 8: Final DOM](#layer-8-final-rendered-dom)
   - [Layer 9: Delayed Phase](#layer-9-delayed-phase-3-seconds-later)
4. [AEM Admin API — How Content Reaches the CDN](#aem-admin-api--how-content-reaches-the-cdn)
   - [The Two Actions](#the-two-actions)
   - [How to Verify](#how-to-verify--3-methods)
   - [Preview vs Live CDNs](#preview-vs-live--two-separate-cdns)
   - [Debugging with the API](#why-this-matters-for-debugging)
5. [Hello World With Child Block](#hello-world-with-child-block)
   - [Block Structure](#block-structure)
   - [How picture tag is formed](#how-the-picture-tag-is-formed)
   - [Dynamic Media URLs](#why-the-url-is-adobedynamicmediadeliver-not-contentdam)
6. [Phase 3.1 — Block Variants](#phase-31--block-variants)
   - [What are Variants](#what-are-variants)
   - [The classes Field](#the-classes-field)
   - [CSS Specificity Pattern](#css-specificity-pattern-for-variants)
7. [Phase 3.2 — Section Metadata Extensions](#phase-32--section-metadata-extensions)
   - [What is Section Metadata](#what-is-section-metadata)
   - [New Fields Added](#new-fields-added)
   - [How Each Feature Works](#how-each-feature-works)
   - [How to Test](#how-to-test-phase-32)
8. [Phase 3.3 — Page Templates](#phase-33--page-templates)
   - [What is a Page Template](#what-is-a-page-template)
   - [How EDS Loads Templates](#how-eds-loads-templates-automatically)
   - [Article Template](#article-template)
   - [Landing Page Template](#landing-page-template)
   - [Page Metadata SEO Fields](#page-metadata-seo-fields)
9. [Phase 3.4 — Auto Blocks](#phase-34--auto-blocks)
   - [What are Auto Blocks](#what-are-auto-blocks)
   - [The buildAutoBlocks Mechanism](#the-buildautoblocks-mechanism)
   - [Auto Video Embed](#auto-video-embed)
   - [Auto Breadcrumb](#auto-breadcrumb)
   - [How to Test](#how-to-test-auto-blocks)
   - [File 1: helloworld.js](#file-1-helloworldjs)
   - [File 2: helloworld.css](#file-2-helloworldcss)
   - [File 3: _helloworld.json](#file-3-_helloworldjson)
   - [File 4: models/_section.json](#file-4-models_sectionjson)
   - [Build Step](#build-step)
   - [Q&A](#qa)
10. [Phase 4 — Performance & Core Web Vitals](#phase-4--performance--core-web-vitals)
    - [What are Core Web Vitals](#what-are-core-web-vitals)
    - [The Three Metrics Explained](#the-three-metrics-explained)
    - [Why EDS Scores 100 by Default](#why-eds-scores-100-by-default)
    - [Where Performance Can Break](#where-performance-can-break)
    - [LCP Deep Dive](#lcp-deep-dive)
    - [CLS Deep Dive](#cls-deep-dive)
    - [INP Deep Dive](#inp-deep-dive)
    - [Image Optimization Rules](#image-optimization-rules)
    - [Font Loading Rules](#font-loading-rules)
    - [JavaScript Performance Rules](#javascript-performance-rules)
    - [Measuring Performance](#measuring-performance)
    - [Performance Q&A](#performance-qa)
11. [Phase 5 — SEO & Structured Data](#phase-5--seo--structured-data)
    - [What is SEO in EDS](#what-is-seo-in-eds)
    - [Complete OG & Twitter Cards](#complete-og--twitter-cards)
    - [JSON-LD Structured Data](#json-ld-structured-data)
    - [Organization Schema (All Pages)](#organization-schema-all-pages)
    - [BlogPosting Schema (Article Template)](#blogposting-schema-article-template)
    - [FAQPage Schema (Accordion Block)](#faqpage-schema-accordion-block)
    - [Heading IDs for Deep Linking](#heading-ids-for-deep-linking)
    - [Sitemap Configuration](#sitemap-configuration)
    - [SEO Q&A](#seo-qa)
12. [Phase 6 — Analytics, Personalization & Martech](#phase-6--analytics-personalization--martech)
    - [Architecture Overview](#architecture-overview)
    - [Adobe Client Data Layer (ACDL)](#adobe-client-data-layer-acdl)
    - [AEP Web SDK — Alloy.js](#aep-web-sdk--alloyjs)
    - [The Alloy Stub Pattern](#the-alloy-stub-pattern)
    - [Consent Management](#consent-management)
    - [Custom Event Tracking](#custom-event-tracking)
    - [A/B Experimentation](#ab-experimentation)
    - [Configuration Setup](#configuration-setup)
    - [Analytics Q&A](#analytics-qa)

---

## HelloWorld Block

A simple block with a **Title** field and a **Description** field.
Used as a teaching example to understand how EDS blocks work end to end.

---

### Files Created

| File | Purpose |
|------|---------|
| `blocks/helloworld/helloworld.js` | Logic — reads authored HTML, transforms into semantic DOM |
| `blocks/helloworld/helloworld.css` | Styles — scoped to `.helloworld`, lazy-loaded |
| `blocks/helloworld/_helloworld.json` | Universal Editor model — defines fields, definition, filters |
| `models/_section.json` | Modified — added `helloworld` to the section filter allowlist |
| `component-definition.json` | Auto-generated by `npm run build:json` |
| `component-models.json` | Auto-generated by `npm run build:json` |
| `component-filters.json` | Auto-generated by `npm run build:json` |

---

### File 1: `helloworld.js`

**What it does:** EDS calls `decorate(block)` automatically when it finds `<div class="helloworld">` on a page.

**Authored HTML that AEM delivers (before decoration):**
```html
<div class="helloworld">
  <div>                              <!-- row 1 -->
    <div>Hello World</div>           <!-- cell 1 = title -->
    <div>Welcome to my site</div>    <!-- cell 2 = description -->
  </div>
</div>
```

**After `decorate()` runs:**
```html
<div class="helloworld">
  <div class="helloworld-content">
    <h2 class="helloworld-title" data-aue-prop="title">Hello World</h2>
    <p class="helloworld-description" data-aue-prop="description">Welcome to my site</p>
  </div>
</div>
```

**Full file:**
```javascript
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  // Step A: Get the first row from the block
  const row = block.firstElementChild;
  if (!row) return;

  // Step B: Get the two cells from that row
  const titleCell = row.children[0];       // cell 1 = title
  const descriptionCell = row.children[1]; // cell 2 = description

  // Step C: Build new semantic HTML elements
  const wrapper = document.createElement('div');
  wrapper.className = 'helloworld-content';

  const heading = document.createElement('h2');
  heading.className = 'helloworld-title';

  const description = document.createElement('p');
  description.className = 'helloworld-description';

  // Step D: Move content AND Universal Editor attributes from cells into new elements
  if (titleCell) {
    moveInstrumentation(titleCell, heading);
    while (titleCell.firstChild) heading.append(titleCell.firstChild);
  }

  if (descriptionCell) {
    moveInstrumentation(descriptionCell, description);
    while (descriptionCell.firstChild) description.append(descriptionCell.firstChild);
  }

  // Step E: Assemble the final structure
  wrapper.append(heading, description);

  // Step F: Replace original block content with new structure
  block.textContent = '';
  block.append(wrapper);
}
```

**Key rules:**
- Must export a **default function** called `decorate`
- Must accept `block` as parameter — this is the `<div class="helloworld">` element
- `block.children` = rows, `row.children` = cells
- Always use `moveInstrumentation` + move children — never use `.innerHTML =` (strips UE attrs)

---

### File 2: `helloworld.css`

**What it does:** Styles the block. Loaded automatically by EDS alongside the JS. Only loads on pages that have this block.

**Key rule: ALL selectors must start with `.helloworld`** — never write bare class selectors that could leak to other blocks.

```css
/* GOOD — scoped */
.helloworld .helloworld-title { ... }

/* BAD — would affect all h2s on the page */
.helloworld-title { ... }
```

**Full file:**
```css
.helloworld {
  padding: var(--spacing-xl);
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-primary);
}

.helloworld .helloworld-content {
  max-width: var(--max-width-narrow);
}

.helloworld .helloworld-title {
  margin: 0 0 var(--spacing-m);
  color: var(--color-primary);
  font-size: var(--heading-font-size-l);
}

.helloworld .helloworld-description {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--body-font-size-s);
  line-height: var(--line-height-loose);
}
```

The `var(--spacing-xl)`, `var(--color-primary)` etc. are **design tokens** defined in `styles/styles.css` on `:root`.

---

### File 3: `_helloworld.json`

**What it does:** Tells Universal Editor everything about this block — what it's called, what fields it has, what children it allows.

**Note the underscore prefix `_`** — this marks it as a partial file. It gets merged into the root JSON files by `npm run build:json`.

**Full file:**
```json
{
  "definitions": [
    {
      "title": "Hello World",
      "id": "helloworld",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "Hello World",
              "model": "helloworld"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "helloworld",
      "fields": [
        {
          "component": "text",
          "name": "title",
          "label": "Title",
          "valueType": "string",
          "value": "Hello World"
        },
        {
          "component": "text",
          "name": "description",
          "label": "Description",
          "valueType": "string",
          "value": "Welcome to my site"
        }
      ]
    }
  ],
  "filters": []
}
```

**The three sections explained:**

| Section | Purpose | Shows up in UE as |
|---------|---------|-------------------|
| `definitions` | Registers the block so UE knows it exists | The "+" component picker |
| `models` | Defines what fields authors can edit | The Properties panel on the right |
| `filters` | Defines what child components can be added inside | The "+" inside the block (empty = no children) |

---

### File 4: `models/_section.json`

**What it does:** Controls which blocks authors are **allowed to add** to a section in Universal Editor.

**Change made:** Added `"helloworld"` to the `components` array in the `section` filter:

```json
"filters": [
  {
    "id": "section",
    "components": [
      "text", "image", "button", "title",
      "hero", "cards", "columns", "fragment",
      "accordion", "tabs", "cta-banner", "modal",
      "video-embed", "breadcrumb",
      "helloworld"          ← added this
    ]
  }
]
```

Without this, "Hello World" would not appear in the "+" picker inside a section.

---

### Build Step

After creating or modifying any `_blockname.json` or `models/_*.json` file, run:

```bash
npm run build:json
```

This merges all partial files into three root files that AEM reads:

```
models/_component-definition.json  →  component-definition.json  (UE component picker)
models/_component-models.json      →  component-models.json       (UE properties panel)
models/_component-filters.json     →  component-filters.json      (UE what's allowed where)
```

The merge works via a glob pattern in the blueprint files:
```json
{ "...": "../blocks/*/_*.json#/definitions" }
```
Every `_blockname.json` file is **automatically picked up** — no manual registration needed.

---

### Q&A

---

**Q1: In the HelloWorld example we have one row with two cells (title + description). Why not two rows with one cell each?**

Both work. The choice depends on what the content model means semantically.

**One row, two cells** = title and description are **properties of one single thing**. Like a form.
```
| Hello World | Welcome to my site |    ← row 1, cell 1 = title, cell 2 = description
```

**Two rows, one cell each** = each row is a **repeatable item** in a list. Like a spreadsheet.
```
| Hello World        |    ← row 1
| Welcome to my site |    ← row 2
```

| Use one row + multiple cells when... | Use multiple rows when... |
|--------------------------------------|--------------------------|
| Fields are properties of ONE thing (title + description of a banner) | Content is a repeatable list (FAQ items, cards, tabs) |
| There is always exactly these fields | Author can add/remove items |
| Think: a form | Think: a spreadsheet |

For HelloWorld, title + description are properties of **one** block instance → one row, two cells.
For Accordion, each row is a separate collapsible panel → multiple rows, each with two cells.

---

**Q2: What is `data-aue-prop` and how is its value assigned (e.g. `data-aue-prop="title"`)?**

`data-aue-prop` is an attribute that **Universal Editor injects** onto DOM nodes so it knows which JCR property maps to which element on screen.

**The value comes from the `"name"` field in your JSON model:**
```json
"fields": [
  { "component": "text", "name": "title",       ... }  →  data-aue-prop="title"
  { "component": "text", "name": "description", ... }  →  data-aue-prop="description"
]
```

**Full set of `data-aue-*` attributes AEM injects:**
```html
<div
  data-aue-resource="urn:aemconnection:/content/.../helloworld"
  data-aue-type="component"
  data-aue-label="Hello World">

  <div data-aue-prop="title"       data-aue-type="text">Hello World</div>
  <div data-aue-prop="description" data-aue-type="text">Welcome...</div>
</div>
```

| Attribute | Set by | Means |
|-----------|--------|-------|
| `data-aue-resource` | AEM (from JCR path) | Which JCR node this element represents |
| `data-aue-type` | AEM (from model `component` field) | What editor to open: `text`, `richtext`, `reference`, `component` |
| `data-aue-prop` | AEM (from model `name` field) | Which property on the JCR node to save to |
| `data-aue-label` | AEM (from model `label` field) | Label shown in the UE properties panel |

**Click flow in Universal Editor:**
```
You click "Hello World" text on canvas
    ↓ UE reads: data-aue-prop="title" → edit the "title" property
                data-aue-resource="...helloworld" → on this JCR node
                data-aue-type="text" → open a text input
    ↓ Right panel shows text field with "Hello World" pre-filled
    ↓ You type "Hi There" → UE saves to JCR: @title = "Hi There"
    ↓ AEM re-renders → browser updates
```

**Why `moveInstrumentation` is critical:**
If `decorate()` does `heading.innerHTML = titleCell.innerHTML` — it copies only text, **strips all `data-aue-*` attributes**. UE can't find what to edit.

`moveInstrumentation(titleCell, heading)` transfers all `data-aue-*` attrs to `<h2>` so it stays editable after decoration.

---

**Q3: In `_helloworld.json`, what is the relation between the three `id`/`model` values? Are they dependent?**

```json
"definitions": [
  {
    "id": "helloworld",           ← [A] Block's unique identity
    "template": {
      "model": "helloworld"       ← [B] Pointer — "use model [C] for properties panel"
    }
  }
],
"models": [
  {
    "id": "helloworld",           ← [C] Model's unique identity
    "fields": [ ... ]
  }
]
```

**[A] `definitions[].id = "helloworld"`**
- The block's unique identifier in the entire system
- **Must match** the block folder name: `blocks/helloworld/`
- **Must match** the CSS class: `<div class="helloworld">`
- **Must match** the entry in the section filter: `"components": ["helloworld"]`

**[B] `definitions[].template.model = "helloworld"`**
- A **pointer/reference** — not a new identity, just a link
- Says: "when this block is selected in UE, show the Properties panel defined by the model whose id equals this value"
- [B] must equal [C]

**[C] `models[].id = "helloworld"`**
- The model definition's unique identity
- Defines the actual editable fields shown in the Properties panel
- This is what [B] points to

**Dependency chain:**
```
[A] "helloworld"  ←→  folder name, CSS class, section filter entry  (must all match)
[B] "helloworld"  →→  [C] "helloworld"  (B points to C, must match)
[C] "helloworld"  →→  defines the fields (title, description)
```

**Real example where they differ (Accordion):**
- Block: `id: "accordion"` [A], no `model` in template (block itself has no fields)
- Item: `id: "accordion-item"` [A-item], `model: "accordion-item"` [B-item]
- Model: `id: "accordion-item"` [C-item] — defines title + description fields

---

**Q4: Is `moveInstrumentation` provided by Adobe? Does it stay the same across all EDS projects?**

**Yes, provided by Adobe** — but lives in `scripts/scripts.js` (your project file), NOT in `aem.js`.

**What it does internally:**
```javascript
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}
```
It filters all attributes on `from` that start with `data-aue-` or `data-richtext-` and moves them to `to`. That's it.

**The two scripts files — key distinction:**

| File | Owner | Rule |
|------|-------|------|
| `scripts/aem.js` | Adobe — **NEVER modify** | Core EDS engine. Contains `loadBlock`, `decorateBlocks`, `getMetadata`, `createOptimizedPicture`, etc. Adobe updates this file as EDS evolves. |
| `scripts/scripts.js` | Your project | Utilities your team owns. Adobe provides the starting version but you can modify it. Contains `moveInstrumentation`, `decorateButtons`, `decorateMain`. |

**Does it stay the same across projects?**
- Every project starting from `aem-boilerplate-xwalk` gets the same function
- Since it's in `scripts.js` (your file), a project could technically modify it
- In practice, **you never need to change it** — just import and use it in every block

**Import path is always the same** (blocks are always two levels deep):
```javascript
import { moveInstrumentation } from '../../scripts/scripts.js';
//                                   ↑↑ always two levels up from blocks/{name}/{name}.js
```

---

## Debugging & Fixes

---

### Fix 1: Block CSS Not Applying

**Symptom:** Block renders (JS ran) but has no styling — no background, no border, no padding. Heading appears in browser-default color instead of the expected brand color.

**Root Cause:** CSS custom properties (`var(--name)`) silently fall back to the browser default when the variable is undefined. If `styles.css` hasn't loaded yet, is cached in an old version, or the variable name doesn't exist, the CSS rule is simply ignored.

```css
/* ❌ Fragile — if --color-primary is undefined, browser uses its own default */
color: var(--color-primary);

/* ✅ Resilient — uses fallback #3b63fb if --color-primary is not defined */
color: var(--color-primary, #3b63fb);
```

**Fix:** Always add hardcoded fallback values to every `var()` in block CSS:

```css
.hello-world {
  padding: var(--spacing-xl, 32px);
  background-color: var(--color-surface, #f8f8f8);
  border-radius: var(--radius-md, 8px);
  border-left: 4px solid var(--color-primary, #3b63fb);
}
```

**Rule:** Every `var()` call in a block should have a fallback. This makes blocks work even in Universal Editor canvas, even if `styles.css` is cached.

---

### Fix 2: Wrong Block Folder Name — The Naming Rule

**Symptom:** Block is on the page but neither JS nor CSS loads. DevTools shows the original un-decorated HTML with no block classes applied.

**Root Cause:** EDS loads block files by matching the block's CSS class to the folder name. AEM derives the CSS class from the `"name"` field in your template by converting it to **kebab-case**:

```
"name": "Hello World"  →  class: hello-world  →  loads blocks/hello-world/hello-world.js
"name": "Accordion"    →  class: accordion    →  loads blocks/accordion/accordion.js
"name": "CTA Banner"   →  class: cta-banner   →  loads blocks/cta-banner/cta-banner.js
```

Our first attempt used folder `blocks/helloworld/` but AEM generated class `hello-world` — EDS looked for `blocks/hello-world/` and found nothing. Both JS and CSS were silently skipped.

**How to diagnose:** Open DevTools → Elements tab → look at the block div:
```html
<!-- class="hello-world" means EDS looks for blocks/hello-world/ -->
<div class="hello-world block" data-block-name="hello-world" data-block-status="loaded">
```

If `data-block-status="loaded"` but the DOM is still the original structure (not decorated), the JS file wasn't found.

**Fix:** Rename the folder to match the generated class:

| Template `name` | Generated class | Correct folder |
|----------------|-----------------|----------------|
| `"Hello World"` | `hello-world` | `blocks/hello-world/` |
| `"CTA Banner"` | `cta-banner` | `blocks/cta-banner/` |
| `"Accordion"` | `accordion` | `blocks/accordion/` |
| `"VideoEmbed"` | `videoembed` | `blocks/videoembed/` |

**Golden rule:** Folder name = template name converted to lowercase kebab-case (spaces → hyphens).

**Also discovered:** AEM generates **two rows** (one per field) for a simple two-field block model — not one row with two cells. The JS must handle accordingly:

```javascript
// Two rows (one per field) — what AEM actually generates
const rows = [...block.children];
const titleCell = rows[0]?.children[0];       // row 1, cell 1 = title
const descriptionCell = rows[1]?.children[0]; // row 2, cell 1 = description
```

**Files fixed/renamed:**

| Old (wrong) | New (correct) |
|-------------|---------------|
| `blocks/helloworld/helloworld.js` | `blocks/hello-world/hello-world.js` |
| `blocks/helloworld/helloworld.css` | `blocks/hello-world/hello-world.css` |
| `blocks/helloworld/_helloworld.json` | `blocks/hello-world/_hello-world.json` |
| `"id": "helloworld"` in JSON | `"id": "hello-world"` |
| `"helloworld"` in section filter | `"hello-world"` |

---

## Complete Block Loading Journey

> "How does the Hello World block load on my page?" — every layer explained.

---

### Layer 1: Authoring (Universal Editor)

Author opens the page in Universal Editor and adds a "Hello World" block.

```
Author clicks "+" → selects "Hello World"
         ↓
UE reads component-definition.json
  → finds definition with id: "hello-world"
  → resourceType: "core/franklin/components/block/v1/block"
  → template name: "Hello World"
         ↓
UE creates a JCR node in the AEM repository:
  /content/eds-site/home/jcr:content/root/section/hello-world
    @sling:resourceType = "core/franklin/components/block/v1/block"
    @name              = "Hello World"
    @title             = "Hello World"      ← default from template
    @description       = "Welcome..."       ← default from template
```

Author edits fields → UE reads `component-models.json` → shows Title + Description inputs → author types → saves to JCR.

---

### Layer 2: Content Delivery (AEM → Edge CDN)

When the page is **previewed or published**, AEM renders the JCR content into plain HTML and pushes it to the CDN edge.

```
AEM reads JCR node /content/.../hello-world
         ↓
Renders as a block table in HTML:

<div class="hello-world block"
     data-block-name="hello-world"
     data-aue-resource="urn:aemconnection:/content/.../hello-world"
     data-aue-type="component">
  <div>                                       ← row 1 (title field)
    <div data-aue-prop="title"
         data-aue-type="text">
      <p>Hello World</p>
    </div>
  </div>
  <div>                                       ← row 2 (description field)
    <div data-aue-prop="description"
         data-aue-type="text">
      <p>Welcome to my eds site.</p>
    </div>
  </div>
</div>
         ↓
This HTML is cached on the CDN edge (Fastly)
Served instantly to every visitor worldwide
```

---

### Layer 3: Browser Receives the Page

User visits `https://main--repo--owner.aem.page/home`

```
Browser sends HTTP GET /home
         ↓
CDN edge responds with the full HTML page (from cache)
  → <head> contains link to styles/styles.css and scripts/scripts.js
  → <main> contains all sections and blocks in raw un-decorated form
  → browser starts parsing HTML immediately
```

---

### Layer 4: Eager Phase — Critical Path (LCP)

`scripts.js` runs immediately on parse. Its only job here: get to LCP as fast as possible.

```javascript
async function loadEager(doc) {
  decorateTemplateAndTheme();            // reads metadata, applies theme to <body>
  const main = doc.querySelector('main');
  decorateMain(main);                    // decorates ALL sections and blocks in DOM
  document.body.classList.add('appear'); // unhides the page (was display:none)
  await loadSection(                     // loads ONLY the first section's blocks
    main.querySelector('.section'),
    waitForFirstImage                    // waits for LCP image before proceeding
  );
}
```

`decorateMain()` does this work in sequence:

```
decorateIcons(main)      → converts :icon-name: spans to <img> SVG tags
buildAutoBlocks(main)    → creates any auto-generated blocks (if configured)
decorateSections(main)   → wraps content between <hr> into .section divs
decorateBlocks(main)     → finds every .block div, records it for loading
decorateButtons(main)    → converts formatted links into .button elements
```

`decorateBlocks()` scans the DOM, finds `<div class="hello-world block">` and records it — but does NOT load it yet if it's not in the first section.

---

### Layer 5: Lazy Phase — Everything Else

After LCP is achieved, `loadLazy()` runs:

```javascript
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));   // loads header block
  await loadSections(main);                  // loads ALL remaining sections
  loadFooter(doc.querySelector('footer'));   // loads footer block
  loadCSS('styles/lazy-styles.css');         // non-critical global styles
  loadFonts();                               // loads font files
  observeSectionAnimations();                // sets up scroll animations
}
```

`loadSections(main)` finds all sections and calls `loadSection()` on each. Inside each section, it calls `loadBlock()` for every block — including Hello World.

---

### Layer 6: Loading the Hello World Block

`loadBlock()` is inside `aem.js` (Adobe's core — never modify). Here's what it does:

```
loadBlock(helloWorldElement)
         ↓
Step 1: Read block name from class list
  "hello-world block" → block name = "hello-world"
         ↓
Step 2: Load CSS (non-blocking, in parallel)
  fetch: /blocks/hello-world/hello-world.css
  → browser downloads and applies styles immediately
         ↓
Step 3: Load JS module
  import('/blocks/hello-world/hello-world.js')
  → browser downloads and parses the ES module
         ↓
Step 4: Call the default export
  const { default: decorate } = await import(...)
  decorate(helloWorldElement)   ← YOUR CODE RUNS HERE
         ↓
Step 5: Mark as loaded
  helloWorldElement.dataset.blockStatus = 'loaded'
```

---

### Layer 7: Your `decorate()` Runs

```javascript
export default function decorate(block) {
  // block = <div class="hello-world block" data-aue-resource="...">

  const rows = [...block.children]; // [row1, row2]

  const titleCell = rows[0]?.children[0];
  //  = <div data-aue-prop="title"><p>Hello World</p></div>

  const descriptionCell = rows[1]?.children[0];
  //  = <div data-aue-prop="description"><p>Welcome...</p></div>

  const wrapper = document.createElement('div');
  wrapper.className = 'hello-world-content';

  const heading = document.createElement('h2');
  heading.className = 'hello-world-title';

  // moveInstrumentation transfers data-aue-prop="title" onto the <h2>
  // so Universal Editor can still edit it after decoration
  moveInstrumentation(titleCell, heading);
  while (titleCell.firstChild) heading.append(titleCell.firstChild);

  const description = document.createElement('p');
  description.className = 'hello-world-description';
  moveInstrumentation(descriptionCell, description);
  while (descriptionCell.firstChild) description.append(descriptionCell.firstChild);

  wrapper.append(heading, description);

  block.textContent = ''; // wipe the original rows
  block.append(wrapper);  // insert the new semantic structure
}
```

---

### Layer 8: Final Rendered DOM

After `decorate()` runs, the browser DOM is:

```html
<div class="hello-world block" data-block-status="loaded" data-aue-resource="...">
  <div class="hello-world-content">
    <h2 class="hello-world-title" data-aue-prop="title">
      <p>Hello World</p>
    </h2>
    <p class="hello-world-description" data-aue-prop="description">
      Welcome to my eds site.
    </p>
  </div>
</div>
```

CSS from `hello-world.css` is already applied (loaded in parallel in Layer 6):
- ✅ Blue left border
- ✅ Gray background
- ✅ Padding
- ✅ Blue heading color

---

### Layer 9: Delayed Phase (3 seconds later)

```javascript
function loadDelayed() {
  window.setTimeout(() => import('./delayed.js'), 3000);
}
```

Analytics, chat widgets, martech load here. Never blocks Hello World or any other block.

---

### Complete Flow Summary

```
AUTHOR
  └─ Types in Universal Editor fields
  └─ UE saves to JCR node in AEM repository

AEM
  └─ Renders JCR → plain HTML with data-aue-* attributes
  └─ Pushes HTML to CDN edge cache

CDN EDGE
  └─ Caches the HTML globally
  └─ Serves it in <50ms to any user

BROWSER — EAGER (LCP critical)
  └─ Receives HTML, parses it
  └─ styles.css loads (render-blocking, kept minimal)
  └─ scripts.js runs → decorateMain() → finds all blocks
  └─ First section blocks load immediately → LCP achieved

BROWSER — LAZY (below fold)
  └─ loadSections() finds Hello World block
  └─ loadBlock() called:
       ├─ Fetches hello-world.css   → browser applies styles
       └─ Imports hello-world.js    → decorate(block) runs
            ├─ Reads 2 rows from block DOM
            ├─ Creates <h2> + <p> elements
            ├─ moveInstrumentation() preserves data-aue-* attrs
            ├─ Moves content nodes into new elements
            └─ Replaces block content with new structure

BROWSER — DELAYED (3 seconds later)
  └─ Analytics, martech loads
  └─ Zero impact on Hello World block
```

---

### Why This Architecture is Fast

EDS achieves Lighthouse 100 because of strict phase separation:

| Phase | What loads | Why it matters |
|-------|-----------|----------------|
| **Eager** | `styles.css` + first section only | Minimum to show above-fold content → fast LCP |
| **Lazy** | Everything else, block by block | Each block's JS+CSS only loads when that block is on the page |
| **Delayed** | Analytics, chat, martech | Never blocks rendering or interactivity |

The Hello World block JS + CSS (~2KB total) only downloads when a page **actually has** that block. If a page has no Hello World block, those files are **never requested**.

---

## AEM Admin API — How Content Reaches the CDN

> "When the page is previewed or published, AEM pushes it to the CDN" — here's how to verify that.

When you click **Preview** or **Publish** in Universal Editor (or the Sidekick browser extension), it makes a real HTTP API call to the **AEM Admin API** (also called the Helix Admin API).

---

### The Two Actions

| Button | API Called | CDN Updated | URL |
|--------|-----------|-------------|-----|
| **Preview** (▶ play icon) | `POST /preview/...` | Preview CDN | `*.aem.page` |
| **Publish** (🌐 globe icon) | `POST /live/...` | Production CDN | `*.aem.live` |

---

### API Endpoint Pattern

```
https://admin.hlx.page/{action}/{owner}/{repo}/{branch}/{path}
```

For this project (`sumitsapient/eds-russell`):

```bash
# Preview a page (same as clicking ▶ in Universal Editor)
POST https://admin.hlx.page/preview/sumitsapient/eds-russell/main/home

# Publish a page (same as clicking Publish)
POST https://admin.hlx.page/live/sumitsapient/eds-russell/main/home

# Check status of any page
GET  https://admin.hlx.page/status/sumitsapient/eds-russell/main/home
```

---

### How to Verify — 3 Methods

#### Method 1: Watch it in DevTools (easiest)

1. Open page in Universal Editor
2. Open DevTools → **Network tab** → filter by `admin.hlx.page`
3. Click the **Preview button** (▶)
4. See a `POST` request fire to `admin.hlx.page/preview/...`
5. Response body confirms what happened:

```json
{
  "webPath": "/home",
  "resourcePath": "/content/eds-site/home",
  "preview": {
    "url": "https://main--eds-russell--sumitsapient.aem.page/home",
    "status": 200,
    "lastModified": "2026-07-02T10:00:00.000Z"
  },
  "live": {
    "url": "https://main--eds-russell--sumitsapient.aem.live/home",
    "status": 200,
    "lastModified": "2026-07-02T10:00:00.000Z"
  }
}
```

#### Method 2: Open the Status API in your browser

Paste this URL directly into any browser tab:

```
https://admin.hlx.page/status/sumitsapient/eds-russell/main/home
```

Returns JSON showing the current CDN state of the page — last modified time, cache status, URLs for both preview and live.

#### Method 3: Call manually with curl

```bash
# Check page status
curl "https://admin.hlx.page/status/sumitsapient/eds-russell/main/home"

# Manually trigger preview
curl -X POST "https://admin.hlx.page/preview/sumitsapient/eds-russell/main/home"

# Manually trigger publish
curl -X POST "https://admin.hlx.page/live/sumitsapient/eds-russell/main/home"
```

---

### What Happens Internally on Preview

```
You click ▶ Preview in Universal Editor
         ↓
Browser calls:
POST https://admin.hlx.page/preview/sumitsapient/eds-russell/main/home
         ↓
Admin API receives request → fetches content from AEM author:
  GET https://author-p146753-e1506305.adobeaemcloud.com/content/eds-site/home
  → AEM renders JCR content → returns plain HTML with data-aue-* attributes
         ↓
Admin API stores the rendered HTML on the Preview CDN (Fastly)
  → available at: https://main--eds-russell--sumitsapient.aem.page/home
         ↓
Admin API returns JSON response: status 200 + URLs + timestamps
         ↓
Universal Editor shows confirmation, preview URL is now updated
```

---

### Preview vs Live — Two Separate CDNs

```
AUTHOR ENVIRONMENT
  author-p146753-e1506305.adobeaemcloud.com
        ↓                                  ↓
  ▶ Preview button               🌐 Publish button
        ↓                                  ↓
  PREVIEW CDN                       LIVE CDN
  *.aem.page                        *.aem.live
  For authors/stakeholders          For real end users
  Updates immediately               Requires explicit Publish
  Content = latest preview          Content = approved/published only
```

---

### Why This Matters for Debugging

If your block changes aren't showing on the preview URL, check these in order:

| Issue | Symptom | Fix |
|-------|---------|-----|
| **Code not synced** | Old JS/CSS still running | Push to GitHub → wait for AEM Code Sync bot |
| **Content not re-previewed** | Old content showing | Click ▶ Preview again in UE to re-render JCR → HTML |
| **CDN cache** | Changes visible on one device but not another | Hard refresh `Ctrl+Shift+R` or add `?nocache=1` to URL |
| **Wrong branch** | Code changes on feature branch, content on main | Check preview URL uses your branch name |

**Quick check URL** — paste in browser to see what's cached right now:
```
https://admin.hlx.page/status/sumitsapient/eds-russell/main/home
```

---

## Hello World With Child Block

A block that has **its own parent field** (title) AND **repeatable child items** (each with title + image). This teaches the pattern for any block that needs a container title plus a dynamic list of items.

---

### Block Structure

**Files created:**

| File | Purpose |
|------|---------|
| `blocks/hello-world-with-child/hello-world-with-child.js` | Logic — separates parent fields from child items, builds card grid |
| `blocks/hello-world-with-child/hello-world-with-child.css` | Responsive CSS Grid (1→2→3 columns), card hover effects |
| `blocks/hello-world-with-child/_hello-world-with-child.json` | Parent model (title) + child item model (title + image) + filter |

**JSON model pattern — parent with both `model` AND `filter`:**

```json
"definitions": [
  {
    "id": "hello-world-with-child",
    "template": {
      "name": "Hello World With Child",
      "model": "hello-world-with-child",    ← parent's own editable fields
      "filter": "hello-world-with-child"   ← what children can be added inside
    }
  },
  {
    "id": "hello-world-with-child-item",
    "plugins": { "xwalk": { "page": {
      "resourceType": "core/franklin/components/block/v1/block/item",  ← ITEM not block
      "template": { "model": "hello-world-with-child-item" }
    }}}
  }
]
```

**AEM-generated HTML structure:**
```html
<div class="hello-world-with-child block">

  <!-- Parent's own field row — NO data-aue-resource -->
  <div>
    <div data-aue-prop="title">Our Features</div>
  </div>

  <!-- Child item rows — HAVE data-aue-resource (separate JCR nodes) -->
  <div data-aue-resource="urn:aemconnection:.../item0" data-aue-type="component">
    <div data-aue-prop="title">Item One</div>
    <div data-aue-prop="image"><picture><img src="..."/></picture></div>
  </div>

  <div data-aue-resource="urn:aemconnection:.../item1" data-aue-type="component">
    ...
  </div>
</div>
```

**Key technique — separating parent rows from child item rows:**

```javascript
// Child item rows have data-aue-resource (they are separate JCR nodes)
// Parent field rows do NOT have data-aue-resource
const parentRows = rows.filter((row) => !row.dataset.aueResource);
const itemRows   = rows.filter((row) =>  row.dataset.aueResource);
```

**Variable shadowing fix (ESLint `no-shadow` rule):**
Both the parent and child items have a `title` field. Using `const titleCell` in the outer scope AND inside `forEach` causes ESLint to throw a shadowing error. Fix: name the outer one descriptively.
```javascript
// Outer scope — parent's title
const parentTitleCell = parentRows[0]?.children[0]; // ✅ not 'titleCell'

// Inside forEach — item's title
const [titleCell, imageCell] = [...row.children];   // ✅ no conflict
```

---

### How the `<picture>` Tag is Formed

The `<picture>` element is **NOT created by your JavaScript**. Your `decorate()` only moves it. Here's the full chain:

```
1. MODEL defines field as "component": "reference"
         ↓
2. AUTHOR picks asset in DAM via Asset Picker in Universal Editor
   JCR saves: @image = "/content/dam/eds-site/banner.png"  (just a path string)
         ↓
3. AEM PREVIEW RENDER converts DAM path → Dynamic Media URL
   and wraps it in <picture>:

   <div data-aue-prop="image" data-aue-type="media">
     <picture>
       <img src="/adobe/dynamicmedia/deliver/dm-aid--UUID/banner.png
                 ?quality=85&width=1280&preferwebp=true"
            data-aue-prop="image"
            data-aue-type="media"
            loading="eager">
     </picture>
   </div>
         ↓
4. OUR decorate() MOVES it (does NOT create it):
   moveInstrumentation(imageCell, imgWrapper);
   while (imageCell.firstChild) imgWrapper.append(imageCell.firstChild);
         ↓
5. OPTIONAL: createOptimizedPicture() can replace it with responsive srcset
```

| Element | Created by |
|---------|-----------|
| `<picture>` and `<img>` | AEM rendering the `reference` field |
| Dynamic Media URL | AEM + Dynamic Media CDN (auto-converted from `/content/dam/...`) |
| `data-aue-prop="image"` | AEM (from model field `name: "image"`) |
| `data-aue-type="media"` | AEM (from model field `component: "reference"`) |
| `<div class="...-card-image">` | Our `decorate()` function |

---

### Why the URL is `/adobe/dynamicmedia/deliver/...` not `/content/dam/...`

This is because your AEM instance has **Adobe Dynamic Media** enabled.

| | Traditional (no Dynamic Media) | Dynamic Media (what you have) |
|---|---|---|
| **URL** | `/content/dam/folder/banner.png` | `/adobe/dynamicmedia/deliver/dm-aid--UUID/banner.png` |
| **Served from** | AEM repository directly | Adobe's global CDN edge |
| **Format** | Original format always | Auto-converts to WebP if browser supports it |
| **Resize** | No | Auto-resizes to `width` param |
| **Compression** | No | Auto-compresses to `quality` param |

**The query parameters explained:**

| Parameter | Value | Meaning |
|-----------|-------|---------|
| `quality=85` | 85% | Compressed to 85% — smaller file, visually same |
| `width=1280` | 1280px | Resized to 1280px wide |
| `preferwebp=true` | true | Sends WebP to modern browsers, PNG fallback for old ones |

**Author uploads:** `banner.png` (5MB, 4000×3000px original in DAM)
**Browser receives:** WebP, ~180KB, resized to exactly the width needed — automatically.

This is the **correct and expected** behavior on any AEM instance with Dynamic Media. It is better than `/content/dam` because you get CDN delivery + automatic format optimization + responsive sizing for free.

---

## Phase 3.1 — Block Variants

> One block, multiple visual layouts — without duplicating JS code.

---

### What are Variants

A variant is a different **visual presentation** of the same block. The DOM structure is identical — only a CSS class on the block element changes. This means:

- **Zero JS changes** to add a new variant
- Authors pick the variant from a dropdown in Universal Editor
- CSS targets the extra class to override the default styles

**Real example:** `hello-world-with-child` block has 3 variants:

| Variant | Author selects | Block class becomes | Layout |
|---------|---------------|---------------------|--------|
| Default | "Grid (default)" | `hello-world-with-child` | 3-column card grid |
| List | "List" | `hello-world-with-child list` | Single column, image left |
| Featured | "Featured" | `hello-world-with-child featured` | First card full width |

---

### The `classes` Field

`classes` is a **special reserved field name** in EDS component models. When the author picks a value, AEM automatically appends it as a CSS class on the block element.

**In `_hello-world-with-child.json`:**

```json
{
  "component": "select",
  "name": "classes",           ← MUST be named "classes" — this is the special name
  "label": "Layout Variant",
  "description": "Choose how the items are displayed",
  "valueType": "string",
  "options": [
    { "name": "Grid (default)", "value": "" },      ← empty = no extra class
    { "name": "List",           "value": "list" },   ← adds class "list"
    { "name": "Featured",       "value": "featured"} ← adds class "featured"
  ]
}
```

**What AEM does with it:**

```
Author selects "List" (value: "list")
         ↓
AEM writes to JCR: @classes = "list"
         ↓
AEM renders HTML:
<div class="hello-world-with-child list block">
                                   ^^^^
                                   added automatically — our CSS targets this
```

**Files changed for variants:**

| File | Change | Why |
|------|--------|-----|
| `_hello-world-with-child.json` | Added `classes` select field | Shows dropdown in UE Properties panel |
| `hello-world-with-child.css` | Added `.list` and `.featured` rule blocks | Visual override for each variant |
| `hello-world-with-child.js` | **Nothing** ✅ | DOM structure is identical for all variants |

---

### CSS Specificity Pattern for Variants

This is the key CSS pattern. Pay attention to the **space vs no-space** difference.

```css
/* DEFAULT — applies to ALL instances of the block */
.hello-world-with-child .hello-world-with-child-grid {
  grid-template-columns: repeat(3, 1fr);
}

/* VARIANT — overrides default only when "list" class is present */
.hello-world-with-child.list .hello-world-with-child-grid {
/*                     ^^^^^ NO SPACE here */
  grid-template-columns: 1fr;
}
```

**No space = the block element itself has both classes:**
```html
<div class="hello-world-with-child list block"> ← both on same element
```
`.hello-world-with-child.list` matches this ✅

**With space = looking for .list INSIDE the block:**
```html
<div class="hello-world-with-child">
  <div class="list">  ← would need a child with class "list"
```
`.hello-world-with-child .list` does NOT match ✅ (wrong selector)

**The 3 variants and how they work:**

```css
/* VARIANT: LIST — single column, image left of title */
.hello-world-with-child.list .hello-world-with-child-grid {
  grid-template-columns: 1fr; /* force single column at all breakpoints */
}

@media (min-width: 900px) {
  .hello-world-with-child.list .hello-world-with-child-card {
    display: grid;
    grid-template-columns: 220px 1fr; /* 220px image | rest for title */
    align-items: center;
  }
}

/* VARIANT: FEATURED — first card spans full width, side by side */
@media (min-width: 600px) {
  .hello-world-with-child.featured .hello-world-with-child-card:first-child {
    grid-column: 1 / -1; /* span ALL columns in the grid */
    display: grid;
    grid-template-columns: 1fr 1fr; /* image left | title right */
  }
}
```

**Key CSS technique — `grid-column: 1 / -1`:**
In CSS Grid, `-1` means "the last grid line". So `1 / -1` means "start at column 1, end at the last column" = span ALL columns. This is how the featured first card breaks out of the 3-column grid.

---

### How to Test Variants in Universal Editor

1. Click the **Hello World With Child** block on the canvas
2. Properties panel shows **"Layout Variant"** dropdown (new field)
3. Select **"List"** → block gets class `list` → layout switches to side-by-side
4. Select **"Featured"** → block gets class `featured` → first card goes full width
5. Select **"Grid (default)"** → back to 3-column grid

---

### When to Use `select` vs `multiselect` for Classes

| Field | Use when | Result |
|-------|---------|--------|
| `"component": "select"` | One variant at a time (mutually exclusive) | `class="list"` OR `class="featured"` — not both |
| `"component": "multiselect"` | Author can combine variants | `class="dark centered"` — multiple at once |

Example of `multiselect` (used in sections):
```json
{
  "component": "multiselect",
  "name": "style",
  "label": "Style",
  "options": [
    { "name": "Dark",     "value": "dark" },
    { "name": "Centered", "value": "centered" },
    { "name": "Narrow",   "value": "narrow" }
  ]
}
```
Author can select Dark + Centered together → `class="section dark centered"`.

---

## Phase 3.2 — Section Metadata Extensions

> How to give sections background images, custom IDs, and scroll animations through authoring.

---

### What is Section Metadata

Section Metadata is how authors configure a **section itself** (not the blocks inside it). It's a special table authors can add at the bottom of any section:

```
| Section Metadata |                         |
|------------------|-------------------------|
| style            | dark, centered          |
| background       | (pick from DAM)         |
| id               | about-us                |
| animate          | slide-up                |
```

`aem.js` reads this table and applies values to the parent `<div class="section">`:
- `style` → adds CSS classes directly: `<div class="section dark centered">`
- Everything else → sets `data-*` attributes: `<div class="section" data-background="..." data-id="..." data-animate="...">`

Our `decorateSectionMetadata()` in `scripts.js` then reads those `data-*` attributes and applies the JavaScript side effects (inline styles, id attributes, animation classes).

---

### New Fields Added

Added to `models/_section.json`:

| Field | Component | What it does |
|-------|-----------|-------------|
| `style` | `multiselect` | CSS classes: dark, accent, highlight, centered, narrow, spacious, compact |
| `background` | `reference` | DAM image → applied as `background-image` inline style via JS |
| `id` | `text` | Sets `id` attribute on section for anchor links (e.g. `#about-us`) |
| `animate` | `select` | Scroll animation: `fade-in`, `slide-up`, `slide-left`, `slide-right` |

---

### How Each Feature Works

#### Background Image

```
Author picks image in UE → DAM path stored in JCR
         ↓
AEM renders: <div class="section" data-background="/adobe/dynamicmedia/deliver/...">
         ↓
decorateSectionMetadata() in scripts.js reads data-background:
  section.style.backgroundImage = `url(${bg})`;
  section.classList.add('has-background');
         ↓
lazy-styles.css targets .section.has-background:
  - background-size: cover, background-position: center
  - ::before pseudo-element adds dark overlay (rgb(0 0 0 / 45%))
  - Text inside turns white for readability
```

#### Section ID (Anchor Links)

```
Author types "about-us" in ID field in UE
         ↓
AEM renders: <div class="section" data-id="about-us">
         ↓
decorateSectionMetadata() reads data-id:
  section.id = sectionId;  → <div class="section" id="about-us">
         ↓
Any link with href="#about-us" now scrolls to this section
```

#### Scroll Animations

```
Author selects "Slide Up" in animate dropdown
         ↓
AEM renders: <div class="section" data-animate="slide-up">
         ↓
decorateSectionMetadata() reads data-animate:
  section.classList.add('animate', 'slide-up');
         ↓
lazy-styles.css: .section.animate.slide-up { opacity: 0; transform: translateY(40px); }
         ↓
observeSectionAnimations() sets up IntersectionObserver:
  When section enters viewport → section.classList.add('visible')
         ↓
lazy-styles.css: .section.animate.visible { opacity: 1; transform: none; }
  (CSS transition makes it smooth)
```

**All animations respect `prefers-reduced-motion`** — if the user has animations disabled in their OS, the CSS overrides to skip all transitions.

---

### How to Test (Phase 3.2)

**Section ID:**
1. Click a section in UE → Properties → "Section ID (anchor)" → type `my-section`
2. Preview → check DevTools: `<div class="section" id="my-section">`
3. Add `#my-section` to URL → page scrolls to it

**Scroll Animation:**
1. Click section 2+ (NOT first section) → Properties → "Scroll Animation" → "Slide Up"
2. Preview → scroll down slowly → section slides up as it enters viewport
3. DevTools: before scroll = `opacity: 0`, after = `opacity: 1, transform: none`

**Background Image:**
1. Click a section → Properties → "Background Image" → pick from DAM
2. Preview → section shows image with dark overlay, text turns white

---

## Phase 3.3 — Page Templates

> Different page types with different layouts — article, landing, and more.

---

### What is a Page Template

Right now every page uses the same layout: header → content → footer. A template lets different page types have completely different structures.

| Template | Layout | Use case |
|----------|--------|----------|
| `default` (blank) | Header + content + footer | Home, About, Contact |
| `article` | Narrow column + reading features | Blog posts, news articles |
| `landing` | No header/footer, brand bar only | Campaign pages, ads |

---

### How EDS Loads Templates Automatically

```
Author sets: template = "article" in Page Properties (UE)
         ↓
AEM writes to HTML <head>:
  <meta name="template" content="article">
         ↓
aem.js decorateTemplateAndTheme() reads this meta tag:
  → adds class "article" to <body>
  → loads templates/article/article.css
  → loads templates/article/article.js
         ↓
article.js runs → adds reading progress bar, reading time, auto TOC
article.css applies via body.article selectors
```

**Folder structure:**
```
templates/
├── article/
│   ├── article.js    ← JS enhancements for articles
│   └── article.css   ← Styles scoped to body.article
└── landing/
    ├── landing.js    ← Hides header/footer, adds brand bar
    └── landing.css   ← Full-width layout scoped to body.landing
```

**Key rule:** All template CSS selectors are scoped to `body.{templatename}` — never global.

---

### Article Template

**What it does:**
1. **Reading progress bar** — thin blue line at the very top of the page, fills as you scroll
2. **Reading time badge** — auto-calculated (words ÷ 200 wpm), appears below the `<h1>`
3. **Auto Table of Contents** — scans all `<h2>` and `<h3>` tags, builds a clickable TOC nav before the first `<h2>` (only if 3+ headings exist)
4. **Article typography** — narrow 760px column, larger body text (21px), h2 with dividers, blockquote styling

**Reading time calculation:**
```javascript
const words = document.querySelector('main')?.innerText?.split(/\s+/).length || 0;
const minutes = Math.max(1, Math.ceil(words / 200));
// 1000 words = 5 min read
```

**TOC auto-generation:**
```javascript
// Each heading gets an id if it doesn't have one
heading.id = `heading-${i}`;

// A link is created pointing to that id
link.href = `#${heading.id}`;
// → clicking scrolls to the heading
```

---

### Landing Page Template

**What it does:**
1. **Hides global header and footer** — removes navigation so visitors focus on the conversion goal
2. **Adds a minimal brand bar** — sticky top bar with brand name and a CTA button
3. **Full-width sections** — sections stretch edge-to-edge for dramatic visual impact
4. **Sticky mobile CTA** — a fixed CTA bar at the bottom of the screen on mobile

**Use case:** Campaign pages, ad landing pages, promotional pages where you want to remove all distractions and guide the visitor toward one action.

---

### Page Metadata SEO Fields

Added to `models/_page.json` — visible in UE → Page Properties:

| Field | What it does | Written to HTML as |
|-------|-------------|-------------------|
| `template` | Selects page layout | `<meta name="template" content="article">` |
| `og:image` | Social share image | `<meta property="og:image" content="...">` + `<meta name="twitter:image" content="...">` |
| `robots` | SEO indexing control | `<meta name="robots" content="noindex">` |
| `canonical` | Canonical URL | `<link rel="canonical" href="...">` |

**These are injected by `decorateSEO()` in `scripts.js`** during the Eager phase (before LCP), so search engines always see them even on slow connections.

**How to set in Universal Editor:**
1. Click the page canvas (not a section/block)
2. Click the **Page Properties** icon (⚙ gear) in the right panel
3. Fill in the fields: Title, Description, Template, Social Share Image, etc.

---

## Phase 3.4 — Auto Blocks

> Blocks that create themselves automatically from content patterns — no author action needed.

---

### What are Auto Blocks

Auto blocks are blocks that the code detects and inserts **programmatically** at page load time based on content patterns — without the author ever selecting a block from the "+" picker.

| Auto Block | Trigger | What happens |
|---|---|---|
| **Video Embed** | Author pastes a raw YouTube/Vimeo URL on its own line | URL auto-wrapped in a `video-embed` block |
| **Breadcrumb** | Page path has 2+ segments (e.g. `/blog/my-post`) | Breadcrumb auto-inserted at the top of the page |

The key difference from regular blocks:

| Regular block | Auto block |
|---|---|
| Author adds it via "+" picker in UE | Added by code automatically |
| Stored in JCR as a block component | Detected from content pattern at runtime |
| Always present on the page | Only appears when the pattern matches |

---

### The `buildAutoBlocks()` Mechanism

The entry point is `buildAutoBlocks(main)` in `scripts.js`. It runs as part of `decorateMain()` in the **Eager phase** (before LCP).

```javascript
// scripts.js - execution flow
async function loadEager(doc) {
  decorateTemplateAndTheme();
  decorateSEO();
  const main = doc.querySelector('main');
  decorateMain(main);  // ← this calls buildAutoBlocks inside
}

function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);   // ← runs first, creates synthetic blocks
  decorateSections(main);
  decorateBlocks(main);    // ← then aem.js finds and prepares all blocks
  decorateButtons(main);
}
```

**`buildBlock()` helper** — creates a block element programmatically:

```javascript
function buildBlock(blockName, content) {
  const blockEl = document.createElement('div');
  blockEl.classList.add(blockName, 'block');
  // wraps content in row → cell structure (same as authored blocks)
  const rowEl = document.createElement('div');
  const colEl = document.createElement('div');
  colEl.innerHTML = content;
  rowEl.append(colEl);
  blockEl.append(rowEl);
  return blockEl;
}
```

The result is identical to what AEM would generate for an authored block. `loadBlock()` then loads its JS and CSS exactly as normal.

---

### Auto Video Embed

**How detection works:**

```
Author pastes in UE rich text / default content:
  https://www.youtube.com/watch?v=dQw4w9WgXcQ

AEM renders this to HTML as:
  <p>
    <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">
      https://www.youtube.com/watch?v=dQw4w9WgXcQ
    </a>
  </p>

buildVideoEmbeds() checks every link on the page:
  ✅ Is the paragraph's only content this link?
  ✅ Is the link text the same as the URL? (raw paste, no custom label)
  ✅ Is the URL a video URL? (youtube.com, youtu.be, vimeo.com, .mp4, .webm)

→ All 3 true → replace <p> with:
  <div class="video-embed block">
    <div><div>https://www.youtube.com/watch?v=...</div></div>
  </div>

→ loadBlock() loads video-embed.js → decorate() runs
→ Builds click-to-play player with YouTube thumbnail
→ On click: loads iframe with autoplay
```

**Supported URL patterns:**

| Platform | Example | Result |
|---|---|---|
| YouTube (long) | `youtube.com/watch?v=VIDEO_ID` | YouTube nocookie iframe |
| YouTube (short) | `youtu.be/VIDEO_ID` | YouTube nocookie iframe |
| Vimeo | `vimeo.com/VIDEO_ID` | Vimeo player iframe |
| Direct MP4 | `example.com/video.mp4` | Native `<video>` element |
| Direct WebM | `example.com/video.webm` | Native `<video>` element |

**Why click-to-play?** Loading an iframe for every YouTube video on the page would make a network request to YouTube immediately on page load — hurting performance (LCP). Click-to-play shows a thumbnail image instead. The iframe only loads when the user actually clicks play.

---

### Auto Breadcrumb

**How detection works:**

```javascript
const pathSegments = window.location.pathname.split('/').filter(Boolean);
// /blog/my-post → ['blog', 'my-post'] → length = 2 → insert breadcrumb

// Skip these cases:
if (pathSegments.length < 2) return;     // / or /about → too shallow
if (skipPaths.includes(pathSegments[0])) return;  // /nav, /footer → fragment pages
if (main.querySelector('.breadcrumb')) return;    // already authored manually
```

**What the breadcrumb generates from `/blog/my-post`:**

```html
<nav aria-label="Breadcrumb">
  <ol class="breadcrumb-list">
    <li class="breadcrumb-item"><a href="/">Home</a></li>
    <li class="breadcrumb-item"><a href="/blog">Blog</a></li>
    <li class="breadcrumb-item">
      <span aria-current="page">My Post</span>
    </li>
  </ol>
</nav>
```

URL segments are humanized automatically: `my-post` → `My Post` (hyphens to spaces, title case).

**JSON-LD Structured Data** is also auto-injected into `<head>`:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://site.com/" },
    { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://site.com/blog" },
    { "@type": "ListItem", "position": 3, "name": "My Post" }
  ]
}
```

This tells Google exactly what the breadcrumb trail is — it appears in search results as `site.com › Blog › My Post`.

---

### How to Test Auto Blocks

**Auto Video Embed:**
1. In UE on any page, add a **Text** component or use default content
2. Type/paste a raw YouTube URL on its own line (no other text around it):
   `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Preview → the URL paragraph is replaced by a video player with YouTube thumbnail
4. Click the play button → iframe loads and plays the video

**Auto Breadcrumb:**
1. Create or navigate to a page at least 2 levels deep, e.g. `/blog/my-post`
2. Preview that page → breadcrumb appears at the top automatically: `Home › Blog › My Post`
3. Check `<head>` in DevTools → Sources → find the `application/ld+json` script with the BreadcrumbList schema

**Verify with DevTools:**
```javascript
// In console on the preview page
document.querySelector('.video-embed')  // should exist after pasting a YouTube URL
document.querySelector('.breadcrumb')   // should exist on /a/b pages
document.querySelector('script[type="application/ld+json"]')?.textContent  // breadcrumb schema
```

---

## Phase 4 — Performance & Core Web Vitals

> How EDS achieves Lighthouse 100 — what the metrics are, why they matter, and what breaks them.

---

### What are Core Web Vitals

Core Web Vitals are **Google's official set of metrics** that measure real user experience. They directly affect SEO ranking (since 2021 Google Page Experience update) and are the standard used by Lighthouse, PageSpeed Insights, and Chrome UX Report.

There are three main CWV metrics:

| Metric | Full Name | Measures | Good | Needs Work | Poor |
|--------|-----------|----------|------|------------|------|
| **LCP** | Largest Contentful Paint | How fast the main content loads | ≤ 2.5s | 2.5–4.0s | > 4.0s |
| **CLS** | Cumulative Layout Shift | How much content jumps around while loading | ≤ 0.1 | 0.1–0.25 | > 0.25 |
| **INP** | Interaction to Next Paint | How fast the page responds to user input | ≤ 200ms | 200–500ms | > 500ms |

Plus two supporting metrics that inform the above:

| Metric | Full Name | Measures | Good |
|--------|-----------|----------|------|
| **FCP** | First Contentful Paint | First pixel of content appears | ≤ 1.8s |
| **TTFB** | Time to First Byte | How fast the server responds | ≤ 800ms |

---

### The Three Metrics Explained

#### LCP — Largest Contentful Paint

LCP measures how long it takes for the **largest visible element above the fold** to fully render.

Typical LCP elements:
- A `<img>` or `<picture>` (most common — the hero image)
- A large heading `<h1>` with a lot of text
- A background image on the first section

```
User navigates to page
         ↓
Browser starts rendering HTML
         ↓
LCP clock starts at navigation start
         ↓
Browser identifies the largest element visible without scrolling
   → usually the hero image (e.g. 1280×600px)
         ↓
LCP clock stops when that element's last pixel is painted
         ↓
Score: under 2.5 seconds = "Good" ✅
```

**Why it matters for EDS:** The Eager phase exists solely to get to LCP fast. Only the first section loads in Eager — everything else waits until after LCP.

---

#### CLS — Cumulative Layout Shift

CLS measures how much page content **unexpectedly moves** during loading. Every time an element shifts position, its shift score is added to the cumulative total.

**What causes layout shift:**
```
Image loads without dimensions → takes up 0 space initially
         ↓
Image loads → suddenly 600px tall → everything below shifts DOWN
         ↓
CLS score accumulates (bad)

Fix: Always set width + height on <img> tags
→ browser reserves space before image loads → no shift
```

**Common CLS causes and fixes:**

| Cause | What happens | Fix |
|-------|-------------|-----|
| Images without `width`/`height` | Page jumps when image loads | Always set dimensions or use `aspect-ratio` CSS |
| Web fonts loading | FOUT (Flash of Unstyled Text) shifts layout | Use `font-display: swap` + preload hints |
| Ads or embeds injected late | Block of content pushes other content | Pre-reserve space with a min-height container |
| Dynamic content above the fold | New DOM added above existing content | Insert below fold, or reserve space |

**Why EDS handles this well:** `createOptimizedPicture()` always sets `width` and `height` attributes on `<img>` tags based on the intrinsic image dimensions. The CDN serves images at known sizes so dimensions are known at render time.

---

#### INP — Interaction to Next Paint

INP replaced FID (First Input Delay) in March 2024. It measures how fast the page **visually responds** to every user interaction (clicks, taps, keyboard) — not just the first one.

```
User clicks a button
         ↓
Browser processes the event handler (JS runs)
         ↓
Browser paints the visual update (button state changes, modal opens, etc.)
         ↓
INP = time from click → next paint
```

**What causes slow INP:**
- Long-running JavaScript on the main thread during interaction
- Heavy `scroll` or `resize` event handlers running synchronously
- Layout thrashing (repeatedly reading and writing DOM layout properties)
- Third-party scripts (analytics, chat widgets) blocking the main thread

**Why EDS handles this well:** By loading analytics and martech in `delayed.js` (3 seconds after page load), the main thread is free during the critical interaction window. By using vanilla JS with no frameworks, there's no virtual DOM diffing or hydration overhead.

---

### Why EDS Scores 100 by Default

EDS is architected from the ground up to be fast. Every default choice contributes to Lighthouse 100.

| EDS Decision | Performance Benefit |
|---|---|
| HTML pre-rendered on CDN edge | Sub-50ms TTFB — no server-side rendering on each request |
| Only first section loads in Eager | LCP element loads before anything else |
| Block JS/CSS auto-split per block | Zero JS/CSS loads unless that block is actually on the page |
| No JavaScript framework | No 100–300KB framework bundle; no hydration cost |
| No CSS framework (no Tailwind/Bootstrap) | No unused CSS purging needed; styles are minimal by design |
| Images through Dynamic Media / `createOptimizedPicture()` | WebP format, correct width, lazy loading, explicit dimensions |
| `lazy-styles.css` separate from `styles.css` | Non-critical styles don't block first render |
| Analytics in `delayed.js` | Zero martech cost on LCP or INP |
| Fonts preloaded in `head.html` | Fonts ready early, no FOUT during LCP |

**The CDN edge is the biggest advantage.** Traditional CMS pages hit a server (PHP, Java, Node), run code, query a database, render HTML, then send it. EDS pages are already-rendered HTML sitting on Fastly's global edge — the server "response" is a cache hit in the nearest data center.

```
Traditional CMS:
Browser → DNS → Server → App (execute code) → Database → Render HTML → Send
Total: 300ms–1000ms TTFB

EDS:
Browser → DNS → Fastly Edge (cache hit) → Send HTML
Total: 20–50ms TTFB
```

---

### Where Performance Can Break

Even with EDS's fast defaults, developer mistakes can tank the score. Most common offenders:

| Mistake | Metric hit | Why |
|---------|-----------|-----|
| Adding `<img>` without `width`/`height` | CLS ↑ | Browser can't reserve space → layout shift on load |
| Adding a `<script>` tag in `<head>` | LCP ↑, FCP ↑ | Render-blocking — browser stops parsing HTML until script downloads + runs |
| Adding `<link rel="stylesheet">` without `media` qualifier in `<head>` | LCP ↑ | Render-blocking stylesheet |
| Loading a third-party library in block JS eagerly | LCP ↑, INP ↑ | Heavy JS on main thread during critical path |
| Importing npm packages (webpack/bundled) | LCP ↑ | Large JS bundles; no auto code splitting |
| Large unoptimized images committed to `/icons/` or `/fonts/` | LCP ↑ | Uncompressed assets downloaded on every page |
| Running heavy DOM loops in `decorate()` synchronously | INP ↑ | Blocks main thread during block load |
| Using `document.write()` or synchronous XHR | All metrics ↑ | Parser-blocking operations |
| Fonts not declared in `fonts.css` | CLS ↑ | FOUT causes text reflow |

---

### LCP Deep Dive

#### The LCP element is almost always the hero image

```
Page structure:
  Section 1 → Hero block → large <picture><img>
                            ↑ THIS is the LCP element
  Section 2 → Cards block
  Section 3 → Footer

EDS loads Section 1 in Eager, waits for hero image → LCP achieved
Then loads Sections 2, 3 in Lazy
```

#### How EDS preloads the LCP image

In `head.html` there is a preload hint for the LCP image pattern:

```html
<link rel="preload" as="image" fetchpriority="high">
```

`aem.js` also sets `fetchpriority="high"` on the first image in the first section so the browser knows to download it with maximum priority — ahead of CSS, fonts, and other images.

#### `loading="lazy"` vs `loading="eager"`

`createOptimizedPicture()` (in `aem.js`) sets:
- `loading="eager"` for the **first** image on the page (LCP candidate — must not be lazy loaded)
- `loading="lazy"` for **all other** images (deferred until near viewport)

**Critical rule:** Never put `loading="lazy"` on the hero image. If the browser defers loading the LCP element, LCP score collapses.

```javascript
// aem.js - createOptimizedPicture signature
createOptimizedPicture(src, alt, eager, breakpoints)
//                                ^^^^
//                                true = loading="eager" + fetchpriority="high"
//                                false = loading="lazy" (default)

// First image on page should always pass eager=true:
createOptimizedPicture(src, alt, true, [...]);
```

---

### CLS Deep Dive

#### The aspect-ratio pattern

When you can't know image dimensions at authoring time, use CSS `aspect-ratio` to reserve space:

```css
/* Reserve 16:9 space before image loads */
.hero .hero-image {
  aspect-ratio: 16 / 9;
  width: 100%;
  overflow: hidden;
}

.hero .hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

This tells the browser: "this container will always be 16:9". No space needs to be recalculated when the image loads → CLS = 0.

#### Font CLS

Fonts cause CLS when the fallback font has different metrics (letter spacing, line height, glyph size) than the web font. When the web font loads, text reflows.

EDS mitigation:
1. `@font-face { font-display: swap; }` in `fonts.css` — shows fallback immediately, swaps to web font when ready. Small CLS but avoids invisible text (FOIT).
2. `<link rel="preload">` in `head.html` for critical fonts — loads fonts in parallel with HTML parsing, so swap happens before first paint.
3. Using `size-adjust` or `ascent-override` CSS properties to make fallback font metrics closely match the web font (advanced technique).

---

### INP Deep Dive

#### The main thread is the bottleneck

The browser has one main thread that handles:
- JavaScript execution
- Style calculation
- Layout
- Paint

If your JS is running on the main thread, user interactions cannot be processed simultaneously. INP gets worse the more you block the main thread.

#### Task length matters

Chrome DevTools Performance tab shows "Long Tasks" — any task > 50ms appears in red. Each long task is a potential INP problem because if the user clicks during a long task, the browser can't respond until the task finishes.

```
Long Task example:
  decorate() runs with a 200ms forEach loop
  User clicks a button at 100ms into that loop
  Browser can't process the click until the forEach finishes
  INP = 100ms wait + paint time = potentially > 200ms
```

**Fix:** Break large work into smaller chunks using `setTimeout` or `scheduler.postTask()`:

```javascript
// ❌ Blocks main thread for entire loop duration
items.forEach((item) => expensiveOperation(item));

// ✅ Yields to browser between batches
async function processItems(items) {
  for (let i = 0; i < items.length; i++) {
    expensiveOperation(items[i]);
    if (i % 10 === 0) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => { setTimeout(resolve, 0); });
    }
  }
}
```

#### EDS-specific INP risks

| Risk | Where it appears | Fix |
|------|-----------------|-----|
| Accordion / Tabs animations with layout-triggering CSS | blocks with show/hide | Use `opacity` + `visibility` instead of `height` transitions |
| Modal open/close with heavy DOM manipulation | modal.js | Pre-render modal HTML, toggle `.visible` class only |
| Search / filter running on every keystroke | search blocks | Debounce input handler (300ms) |
| Scroll-linked animations using `scroll` event | section animations | Use `IntersectionObserver` instead — much cheaper |

---

### Image Optimization Rules

Images are the #1 cause of LCP failures. These rules must be followed for every image in every block.

#### Rule 1: Always use `createOptimizedPicture()` for authored images

```javascript
import { createOptimizedPicture } from '../../scripts/aem.js';

// The function generates a <picture> with responsive srcset
const picture = createOptimizedPicture(
  img.src,          // original URL (Dynamic Media or /content/dam/)
  img.alt,          // alt text
  false,            // eager? (true = LCP image, false = lazy)
  [
    { media: '(min-width: 900px)', width: '1200' },  // desktop
    { media: '(min-width: 600px)', width: '900' },   // tablet
    { width: '600' },                                 // mobile (default)
  ],
);
img.closest('picture').replaceWith(picture);
```

This generates:
```html
<picture>
  <source type="image/webp" media="(min-width: 900px)" srcset="...?width=1200&format=webply">
  <source type="image/webp" media="(min-width: 600px)" srcset="...?width=900&format=webply">
  <source type="image/webp" srcset="...?width=600&format=webply">
  <img src="...?width=600&format=webp" loading="lazy" width="600" height="400" alt="...">
</picture>
```

Browser picks the right size → downloads only the pixels it needs.

#### Rule 2: Assets committed to Git must be pre-optimized

Images committed directly to the repository (in `/icons/`, `/fonts/`, `/drafts/`) are **not** processed by Dynamic Media. They are served as-is.

| File type | Max size | Tool |
|-----------|---------|------|
| SVG icons | < 5 KB | Remove metadata, use SVGO |
| PNG/JPG in `/drafts/` | < 200 KB | Use Squoosh or ImageOptim |
| WOFF2 fonts | < 50 KB per variant | Subset to used characters |
| Favicon | < 10 KB | Keep as `.ico` or small `.png` |

#### Rule 3: Never use `background-image` for content images

```css
/* ❌ Bad — browser can't optimize, no lazy load, no LCP detection */
.hero {
  background-image: url('/media/hero.jpg');
}

/* ✅ Good — use <picture><img> in HTML, let Dynamic Media + createOptimizedPicture handle it */
```

Exception: decorative/texture backgrounds that are not content (e.g. section background patterns) — these are fine as CSS background-image.

---

### Font Loading Rules

Fonts cause both CLS (reflow on swap) and LCP delay (render blocked until font loads). EDS handles fonts in a specific sequence.

#### How EDS loads fonts

```
1. head.html — <link rel="preload"> for critical fonts (roboto-regular.woff2)
         ↓ font starts downloading immediately alongside HTML
2. Eager phase — styles.css loads
         → @import url('../fonts/fonts.css')
         → CSS engine sees @font-face declarations
         → since font is already preloading, it's often ready
3. Lazy phase — fonts.css has already run
         → web font available → text renders in correct font
         → no FOUT because preload ensured font was ready early
```

#### `fonts.css` structure

```css
/* fonts.css — each variant = one @font-face */
@font-face {
  font-family: Roboto;
  font-style: normal;
  font-weight: 400;
  font-display: swap;                           /* show fallback, then swap */
  src: url('../fonts/roboto-regular.woff2') format('woff2');
}

@font-face {
  font-family: Roboto;
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('../fonts/roboto-bold.woff2') format('woff2');
}
```

#### `head.html` preload pattern

```html
<!-- head.html — preload the font used above the fold -->
<link rel="preload" href="/fonts/roboto-regular.woff2" as="font" type="font/woff2" crossorigin>
```

Only preload the **regular weight** (used most above the fold). Bold and italic load lazily — they're used lower on the page.

---

### JavaScript Performance Rules

#### Rule 1: No framework imports

```javascript
// ❌ Bad — pulls in entire React + ReactDOM (~140KB minified)
import React from 'react';

// ✅ Good — vanilla DOM APIs, zero extra download
const el = document.createElement('div');
```

#### Rule 2: Third-party scripts go in `delayed.js` only

```javascript
// delayed.js — loaded 3 seconds after page load
// ✅ Analytics
// ✅ Chat widgets
// ✅ A/B testing frameworks
// ✅ Social share scripts
// ✅ Tag managers

// ❌ Never in scripts.js, aem.js, or block JS
```

#### Rule 3: Lazy-load non-critical block dependencies

If a block needs a library (e.g. a charting library, a datepicker), import it inside `decorate()` so it only loads when that block is on the page:

```javascript
export default async function decorate(block) {
  // Only downloads chart.js when a chart block exists on this page
  const { Chart } = await import('https://cdn.jsdelivr.net/npm/chart.js@4/+esm');
  // ...
}
```

#### Rule 4: Minimize DOM operations in `decorate()`

```javascript
// ❌ Slow — forces layout recalculation on every read
items.forEach((item) => {
  const height = item.offsetHeight; // READ — triggers layout
  item.style.minHeight = `${height}px`; // WRITE — invalidates layout
});

// ✅ Fast — batch reads first, then batch writes (avoid layout thrashing)
const heights = items.map((item) => item.offsetHeight); // all READs
items.forEach((item, i) => { item.style.minHeight = `${heights[i]}px`; }); // all WRITEs
```

---

### Measuring Performance

#### Tool 1: Lighthouse in Chrome DevTools

```
DevTools → Lighthouse tab → Mobile → Generate report
```

- Simulates a mid-range Android phone on 4G
- Run against your **feature preview URL** (`https://{branch}--{repo}--{owner}.aem.page/`) — not localhost (localhost has no network latency simulation)
- **Target: 100 on all four scores** (Performance, Accessibility, Best Practices, SEO)

#### Tool 2: PageSpeed Insights

```
https://developers.google.com/speed/pagespeed/insights/?url=YOUR_PREVIEW_URL
```

- Runs the same Lighthouse test in Google's lab environment
- Also shows **real-world CrUX data** (Chrome User Experience Report) — aggregated from actual Chrome users visiting the live site
- This is what Google uses for search ranking — lab score matters for dev, CrUX for ranking

#### Tool 3: Chrome DevTools Performance tab

```
DevTools → Performance → Record → Do the interaction → Stop
```

Use to diagnose:
- Long tasks (red blocks in the flame chart)
- Layout shifts (purple "Layout" blocks in the timeline)
- JavaScript that runs during interaction (find the call stack in the flame chart)
- LCP element (green "LCP" marker in the timeline)

#### Tool 4: DevTools Rendering panel

```
DevTools → More tools → Rendering
```

Enable:
- **Paint flashing** — green flash every time a region repaints (should only flash when something visually changes)
- **Layout Shift Regions** — blue flash every time a layout shift happens
- **Core Web Vitals** — live LCP, CLS, INP overlay on the page

#### Tool 5: AEM RUM (Real User Monitoring)

EDS automatically collects real user performance data via the RUM beacon (`/rum` endpoint). You can view this in:
- `https://main--{repo}--{owner}.aem.live/.rum/` (if access is configured)
- Adobe's Experience Cloud analytics dashboard

RUM captures actual LCP, CLS, INP from real visitors on your live site — more reliable than lab scores for catching real-world issues.

---

### Measuring with `aem up` (Local Dev)

Local dev (`localhost:3000`) is useful for functional testing but **not reliable for performance numbers** because:
- No network latency (files served from disk)
- No CDN edge caching
- Dev server adds overhead

Always test performance against the **preview URL** (`*.aem.page`), never localhost.

```
Local dev → functional testing only
Preview URL → performance testing + stakeholder review
Live URL → production traffic + CrUX data
```

---

### Performance Q&A

---

**Q1: My Lighthouse score dropped from 100 to 85 after adding a block. What do I check first?**

Look at the **Opportunities** and **Diagnostics** sections in the Lighthouse report. Common culprits:

1. **Render-blocking resources** → did you add a `<script>` or `<link>` to `head.html`?
2. **Largest Contentful Paint element** → click "View Treemap" → check if the LCP image is lazy-loaded
3. **Cumulative Layout Shift** → enable "Layout Shift Regions" in DevTools Rendering, reload, watch for blue flashes
4. **Unused JavaScript** → did your block import a large library?
5. **Image sizing** → did you forget `width`/`height` attrs or skip `createOptimizedPicture()`?

---

**Q2: What is the difference between a lab score (Lighthouse) and field data (CrUX)?**

| | Lab Score (Lighthouse) | Field Data (CrUX) |
|---|---|---|
| **Source** | Simulated test in controlled conditions | Real Chrome user sessions |
| **Device** | Mid-range Android, throttled 4G | Mix of all real devices |
| **When available** | Immediately (any URL, any time) | After ~28 days of real traffic |
| **Use for** | Development, debugging, CI checks | Understanding actual user experience |
| **Affected by** | Your code changes only | All real-world factors (slow devices, bad networks, geography) |

Both matter. You can have a Lighthouse 100 in the lab but poor CrUX if your audience has slow devices. Conversely, you can have mediocre Lighthouse but good CrUX if your audience uses fast devices on fast networks.

---

**Q3: Should I set `loading="lazy"` on all images?**

No. There are exactly two cases:

| Image | Setting | Why |
|-------|---------|-----|
| **First image on the page** (hero, LCP candidate) | `loading="eager"` + `fetchpriority="high"` | Must not be deferred — it IS the LCP element |
| **All other images** | `loading="lazy"` | Only loads when near the viewport → saves bandwidth + doesn't compete with LCP |

`createOptimizedPicture(src, alt, eager, ...)` handles this: pass `eager = true` for the LCP image, `false` (or omit) for everything else.

---

**Q4: Why does EDS use `font-display: swap` instead of `font-display: block`?**

| Value | Behavior | Trade-off |
|-------|---------|-----------|
| `block` | Browser shows invisible text until font loads (FOIT) | No visual flash, but invisible content during load |
| `swap` | Browser shows fallback font immediately, swaps when ready (FOUT) | Flash of unstyled text, but content always visible |
| `optional` | Browser uses fallback; only uses web font if it was already cached | No FOUT, but web font may not appear on first visit |

EDS uses `swap` because:
- Invisible text is a UX problem (especially on slow connections)
- The swap flash is minimized by preloading the font in `head.html`
- If the font preloads fast enough, the swap happens before first paint → no visible FOUT at all

---

**Q5: What is the 14KB rule?**

The first TCP connection from browser to server can transfer exactly **14KB** of data in the first round trip (one TCP slow-start window). If your HTML + critical CSS fits in 14KB, the page can start rendering after a single round trip.

EDS `styles.css` is kept deliberately minimal for this reason — it contains only the CSS required for above-the-fold rendering. Everything else (`lazy-styles.css`) is deferred.

In practice, EDS pages typically get the first render done in 1–2 round trips because:
1. The HTML is served from the CDN edge (no server processing delay)
2. `styles.css` is small enough to fit in early packets
3. The first section's block CSS is fetched in parallel immediately after

---

## Phase 5 — SEO & Structured Data

> How EDS handles search engine optimization — meta tags, JSON-LD schemas, heading IDs, sitemap, and how Google reads your pages.

---

### What is SEO in EDS

EDS has a unique SEO architecture compared to traditional CMS:

| Traditional CMS | EDS |
|---|---|
| Server renders HTML with meta tags each request | Meta tags baked into HTML at preview time, served from CDN |
| Dynamic robots.txt / sitemap generation | `helix-sitemap.yaml` config drives sitemap generation |
| Plugin/module for structured data | Plain JS in `scripts.js` and block files |
| OG image generation service | Author specifies DAM image via page metadata |

In EDS, **all SEO work happens in two places:**
1. `scripts/scripts.js` — `decorateSEO()` and `injectOrganizationSchema()` run on every page in the Eager phase
2. Template/block JS files — page-type-specific schemas (Article, FAQ) run where they're relevant

---

### Complete OG & Twitter Cards

`decorateSEO()` in `scripts.js` injects all Open Graph and Twitter Card meta tags on every page. The data comes from page metadata set in Universal Editor Page Properties.

**What gets injected (full set):**

```html
<!-- Canonical — author-specified wins, otherwise current URL without query params -->
<link rel="canonical" href="https://site.com/blog/my-post">

<!-- Robots (only if authored) -->
<meta name="robots" content="noindex">

<!-- Open Graph -->
<meta property="og:type"        content="article">          ← "article" for article template
<meta property="og:url"         content="https://site.com/blog/my-post">
<meta property="og:title"       content="My Post Title">
<meta property="og:description" content="The page description">
<meta property="og:image"       content="https://dm.../hero.jpg">

<!-- Twitter Card -->
<meta name="twitter:card"        content="summary_large_image">
<meta name="twitter:title"       content="My Post Title">
<meta name="twitter:description" content="The page description">
<meta name="twitter:image"       content="https://dm.../hero.jpg">
```

**How `og:type` is set automatically:**
```javascript
const template = getMetadata('template'); // reads <meta name="template" content="article">
const ogType = template === 'article' ? 'article' : 'website';
```
No author action needed — if the page uses the article template, `og:type` is automatically `article`.

**How canonical is set:**
```javascript
// Author-specified canonical wins (useful for syndicated content)
const authoredCanonical = getMetadata('canonical');
// Fallback: strip query params from current URL to avoid duplicate canonicals
const canonicalUrl = authoredCanonical
  || `${window.location.origin}${window.location.pathname}`;
```

**The implementation pattern — batch inject:**
```javascript
const metaTags = [
  { attr: 'property', name: 'og:type',        value: ogType },
  { attr: 'property', name: 'og:url',         value: canonicalUrl },
  // ... more tags
];

metaTags.forEach(({ attr, name, value }) => {
  if (!value) return;  // skip tags with no value — no empty <meta> tags
  const selector = `meta[${attr}="${name}"]`;
  let tag = document.querySelector(selector);
  if (!tag) {            // don't duplicate if AEM already injected it
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.append(tag);
  }
  tag.content = value;   // update value whether new or existing
});
```

**Why check if tag already exists?** AEM may inject some OG tags into the HTML at render time (from page metadata). The code checks first and updates the existing tag instead of creating a duplicate.

---

### JSON-LD Structured Data

JSON-LD (JavaScript Object Notation for Linked Data) is how you tell Google what your content **means**, not just what it **is**. Google uses it to show rich results in search (FAQs, article bylines, breadcrumb trails, etc.).

```html
<!-- Injected into <head> as a script tag with type="application/ld+json" -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "My Site",
  "url": "https://site.com"
}
</script>
```

Three schemas are implemented:

| Schema | Where | Trigger |
|--------|-------|---------|
| `Organization` | Every page | Always — in `scripts.js` loadEager |
| `BlogPosting` | Article pages | `template: article` — in `templates/article/article.js` |
| `FAQPage` | Accordion blocks | Block has `faq` class — in `blocks/accordion/accordion.js` |

---

### Organization Schema (All Pages)

Injected by `injectOrganizationSchema()` in `scripts.js`. Runs in the Eager phase on every page.

```javascript
function injectOrganizationSchema() {
  const siteName = getMetadata('site-name') || window.location.hostname;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: window.location.origin,
    logo: `${window.location.origin}/favicon.ico`,
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.append(script);
}
```

**Result in Google Search Console:** Google sees your site as an Organization with a known name, URL, and logo. Used for Knowledge Panel and Sitelinks appearance in search results.

**How to customize:** Add `<meta name="site-name" content="Your Brand Name">` to `head.html` or set it per-page in Page Properties.

---

### BlogPosting Schema (Article Template)

Injected by `injectArticleSchema()` in `templates/article/article.js`. Only runs on pages with `template: article`.

**Page metadata fields it reads:**

| Metadata field | Schema property | How to set in UE |
|---|---|---|
| `document.title` | `headline` | Page title (always present) |
| `description` | `description` | Page Properties → Description |
| `og:image` | `image` | Page Properties → Social Image |
| `published-date` or `date` | `datePublished` | Page Properties → Published Date |
| `modified-date` | `dateModified` | Page Properties → Modified Date |
| `author` or `author-name` | `author.name` | Page Properties → Author |

**Generated JSON-LD:**
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "How I Built My First EDS Block",
  "url": "https://site.com/blog/my-first-block",
  "description": "A step-by-step walkthrough...",
  "image": "https://dm.../hero.jpg",
  "datePublished": "2026-07-02",
  "dateModified": "2026-07-02",
  "author": { "@type": "Person", "name": "Sumit" },
  "publisher": {
    "@type": "Organization",
    "name": "site.com",
    "logo": { "@type": "ImageObject", "url": "https://site.com/favicon.ico" }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://site.com/blog/my-first-block"
  }
}
```

**Google rich result this enables:** Article author, date, and reading time shown directly in search results under the headline.

---

### FAQPage Schema (Accordion Block)

Injected automatically by `blocks/accordion/accordion.js` when the block has the `faq` CSS class variant.

**How to enable:**
In Universal Editor → click the Accordion block → Properties → Layout Variant → select **"FAQ"**. This adds class `faq` to the block element.

**What it generates:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Edge Delivery Services?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "EDS is Adobe's CDN-first architecture for AEM sites..."
      }
    },
    {
      "@type": "Question",
      "name": "How fast is EDS?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sub-50ms TTFB globally via Fastly CDN..."
      }
    }
  ]
}
```

**Google rich result:** FAQ items appear directly in search results as expandable dropdowns **below** the page's main listing. Each question/answer can be expanded without clicking through to the page.

**Important:** Google limits FAQ rich results to ~3 items in search results. Include your most important Q&As first.

**Implementation note — why after `block.textContent = ''`:**
```javascript
block.textContent = '';    // wipes original rows
block.append(accordion);   // inserts decorated structure

// Schema reads the DECORATED accordion (.accordion-title, .accordion-content)
// Must run AFTER decoration so the text content is clean (no stray HTML tags)
if (block.classList.contains('faq')) {
  const faqItems = [...accordion.querySelectorAll('.accordion-item')].map((item) => ({
    '@type': 'Question',
    name: item.querySelector('.accordion-title')?.textContent.trim(),
    acceptedAnswer: { '@type': 'Answer',
      text: item.querySelector('.accordion-content')?.textContent.trim() },
  })).filter((q) => q.name);
  // ...inject schema
}
```

---

### Heading IDs for Deep Linking

`decorateHeadingIds(main)` in `scripts.js` runs in the Lazy phase after all sections load. It auto-generates `id` attributes on every `h2`, `h3`, and `h4` from their text content.

```
<h2>How EDS Loads Blocks</h2>
         ↓ decorateHeadingIds runs
<h2 id="how-eds-loads-blocks">How EDS Loads Blocks</h2>
```

**What this enables:**
- Deep links: `https://site.com/docs#how-eds-loads-blocks` scrolls directly to that section
- The Article Template TOC already relied on heading IDs (previously set per-template). Now all pages get them.
- Search engines can link to specific sections within a page in search results

**Duplicate handling:**
If two headings have the same text, the second one gets a numeric suffix:
```
<h2 id="installation">Installation</h2>
<h2 id="installation-2">Installation</h2>  ← second occurrence
```

**Algorithm:**
```javascript
const base = heading.textContent.trim()
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')  // remove special chars
  .replace(/\s+/g, '-')           // spaces → hyphens
  .replace(/-+/g, '-')            // collapse multiple hyphens
  .substring(0, 60);              // max 60 chars

// Deduplicate
let id = base;
let n = 2;
while (seen.has(id)) { id = `${base}-${n}`; n += 1; }
seen.add(id);
heading.id = id;
```

---

### Sitemap Configuration

`helix-sitemap.yaml` controls how the AEM Sitemap service generates `sitemap.xml`.

**Current config:**
```yaml
sitemaps:
  default:
    source: /query-index.json   # the page index from helix-query.yaml
    destination: /sitemap.xml   # served at https://site.com/sitemap.xml
    lastmod: YYYY-MM-DD         # date format for <lastmod> tags
    exclude:
      - /nav                    # fragment pages excluded
      - /footer
      - /header
      - /drafts/**              # dev test pages excluded
```

**How it works:**
```
helix-query.yaml → drives what pages appear in /query-index.json
helix-sitemap.yaml → tells the Sitemap service how to build sitemap.xml from that index
sitemap.xml → submitted to Google Search Console
```

**The query-index is auto-populated** — every page that is previewed/published gets an entry in the index automatically. You don't manually add pages.

**Excluding noindex pages:** Pages with `<meta name="robots" content="noindex">` should also be excluded from the sitemap. The `exclude` list handles the structural exclusions (fragment pages, drafts). For dynamic noindex exclusion, you'd need to filter at the `helix-query.yaml` level.

---

### SEO Q&A

---

**Q1: Why does `decorateSEO()` run in the Eager phase instead of Lazy?**

Search engine crawlers (Googlebot) render JavaScript but have limited rendering budget per page. Meta tags in `<head>` must be present early in the render. Running `decorateSEO()` in the Eager phase ensures:
1. Tags are injected before the page's main content loads (before LCP)
2. If the crawler abandons rendering early, it still sees canonical, robots, og:type
3. Social media link preview bots (Facebook, Twitter) often have zero JS execution — but they read the pre-rendered AEM HTML which already has basic OG tags from the CMS. `decorateSEO()` ensures they're correct.

---

**Q2: How does Google find and parse JSON-LD?**

```
Googlebot fetches the page URL
         ↓
Executes JavaScript (Chrome-based, limited budget)
         ↓
Scans <head> for <script type="application/ld+json">
         ↓
Parses the JSON and validates against schema.org vocabulary
         ↓
If valid → stores structured data → may show rich result in SERP
```

**Testing tool:** Google's Rich Results Test:
```
https://search.google.com/test/rich-results?url=YOUR_PREVIEW_URL
```
Paste your preview URL → Google shows which schemas are valid and what rich results are eligible.

---

**Q3: What is the difference between `og:title` and `<title>`?**

| Tag | Used by | When it matters |
|-----|---------|----------------|
| `<title>` | Browser tab, Google search headline | Always — this is the primary SEO title |
| `og:title` | Facebook, LinkedIn, Slack, Discord when pasting a URL | When someone shares your URL in social/chat apps |
| `twitter:title` | Twitter/X when pasting a URL | Twitter-specific unfurl preview |

In our implementation, all three are set to the same `document.title` value. Some sites differentiate them (e.g. shorter OG title without the brand suffix) but for most cases they should match.

---

**Q4: The FAQ accordion only injects schema when it has the `faq` class. Why not always?**

Not every accordion is an FAQ. An accordion might be used for:
- "Show/hide details" toggles on a product page
- Navigation menus on mobile
- General expandable content (Terms of Service sections)

Adding `FAQPage` schema to a non-FAQ accordion would confuse Google and potentially be flagged as schema spam (misusing a rich result type for content it doesn't represent). The `faq` class is an explicit opt-in by the author.

---

**Q5: Can the same page have multiple JSON-LD scripts?**

Yes. Google explicitly supports multiple `<script type="application/ld+json">` blocks on one page. Our pages may have:
1. `Organization` (from `scripts.js` — always)
2. `BreadcrumbList` (from `breadcrumb.js` — on deep pages)
3. `BlogPosting` (from `article.js` — on article template pages)
4. `FAQPage` (from `accordion.js` — when `faq` class is present)

All four can coexist on a single article page that has a breadcrumb and an FAQ section. Google reads all of them independently.

---

## Phase 6 — Analytics, Personalization & Martech

> How EDS integrates with Adobe Experience Platform Web SDK — without ever blocking page performance.

---

### Architecture Overview

```
BROWSER LOAD SEQUENCE
─────────────────────
Eager (0ms)
  scripts.js runs
  → window.adobeDataLayer = []   ← data layer available immediately
  → decorateSEO(), decorateMain()

Lazy (~100ms after LCP)
  lazy-styles.css loads
  → includes .consent-banner CSS (ready before banner appears)

Delayed (3000ms after page load)
  delayed.js loads
  → pushPageLoadEvent()      — ACDL gets initial page state
  → loadAlloy()              — alloy.js fetches from Adobe CDN
  → showConsentBanner()      — banner appears if no prior decision
  → trackCTAClicks()         — click event listeners attached
  → trackScrollDepth()       — scroll listener attached
  → trackVideoEngagement()   — play listeners on video-embed blocks
  → setupExperimentation()   — variant assigned, body data attrs set
```

**Why 3 seconds?** Adobe recommends loading martech after LCP + TTI. The 3-second delay means alloy.js (~120KB) never competes with page rendering for network or main thread. Lighthouse scores remain 100.

---

### Adobe Client Data Layer (ACDL)

The ACDL (`window.adobeDataLayer`) is Adobe's pub/sub event bus — the equivalent of Google's `dataLayer` but designed for Adobe solutions.

**Why two layers? (ACDL + alloy)**

```
ACDL                                     Alloy (AEP Web SDK)
─────────────────────────────────────    ─────────────────────────────────────
Universal event bus                      Adobe-specific delivery layer
Any solution can listen                  Sends to AEP Edge Network only
Stores event history (array)             Fires & forgets (network request)
Works without alloy                      Requires AEP Datastream config
Launch/Tags can subscribe to it          Sends to Analytics, Target, RTCDP

Example: push to ACDL → Adobe Launch      Example: alloy('sendEvent') →
  picks it up → forwards to alloy             AEP Edge → Analytics + Target
```

**How ACDL is initialized:**

In `scripts.js` (Eager phase — before delayed.js):
```javascript
window.adobeDataLayer = window.adobeDataLayer || [];
```
This ensures the array exists before any code tries to push to it — even if delayed.js hasn't loaded yet.

**Events pushed to ACDL in this project:**

| Event | When | Data |
|-------|------|------|
| `page loaded` | delayed.js init | title, URL, section, template, viewport |
| `cta clicked` | Any .button click | text, url, section id |
| `scroll depth` | 25/50/75/100% scroll | percent |
| `video play` | Video-embed play button click | url |
| `consent decision` | Banner accept/decline | value: "in" or "out" |
| `experiment assigned` | Page with experiment metadata | id, variant |

---

### AEP Web SDK — Alloy.js

Alloy.js is Adobe's unified SDK that replaces at.js (Target), AppMeasurement.js (Analytics), and DIL (Audience Manager) with a single library.

**What it sends to:**

```
alloy("sendEvent", { xdm: {...} })
         ↓
AEP Edge Network (edge.adobedc.net)
         ↓ routes to configured services:
   ┌─────────────────────────────────┐
   │  Adobe Analytics (AA)           │  ← via data.__adobe.analytics
   │  Adobe Target                   │  ← via renderDecisions: true
   │  Adobe Audience Manager (AAM)   │  ← automatic via ECID
   │  Real-Time CDP (RTCDP)          │  ← via XDM schema
   │  Adobe Journey Optimizer (AJO)  │  ← via XDM schema
   └─────────────────────────────────┘
```

**Key configuration options:**

```javascript
window.alloy('configure', {
  datastreamId: '...',          // which Datastream to route events to
  orgId: '...@AdobeOrg',        // which IMS org you belong to
  renderDecisions: true,        // auto-apply Target activities to DOM
  personalizationStorageEnabled: true, // persist Target data across pages
  clickCollectionEnabled: false, // we handle clicks manually
  defaultConsent: 'pending',    // hold events until setConsent() is called
});
```

**The most important setting: `defaultConsent: 'pending'`**
Without this, alloy sends events even before the user consents. `'pending'` queues all events and only sends them after `alloy('setConsent', ...)` is called. This is required for GDPR compliance.

**XDM event structure (Adobe Analytics field group):**

```javascript
// Page view
alloy("sendEvent", {
  xdm: {
    eventType: 'web.webpagedetails.pageViews',
    web: {
      webPageDetails: {
        name: document.title,       // s.pageName in AA
        URL: window.location.href,
        pageViews: { value: 1 },
      },
      webReferrer: { URL: document.referrer }, // s.referrer in AA
    },
  },
});

// CTA click
alloy("sendEvent", {
  xdm: {
    eventType: 'web.webInteraction.linkClicks',
    web: {
      webInteraction: {
        name: 'Get Started',        // s.linkName in AA
        URL: '/pricing',
        linkClicks: { value: 1 },
        type: 'exit',               // lnk_e in AA
      },
    },
  },
});

// Scroll depth — uses data.__adobe.analytics for AA-specific mappings
alloy("sendEvent", {
  xdm: { eventType: 'web.webInteraction.linkClicks', ... },
  data: {
    __adobe: { analytics: { eVar1: '50%', events: 'event2' } },
  },
});
```

**`data.__adobe.analytics` vs `xdm`:**
- `xdm` — standard XDM schema, maps to RTCDP, AEP datasets
- `data.__adobe.analytics` — AA-specific values (eVars, props, events) that bypass XDM mapping. Useful for existing AA implementations where eVar/event assignments are already defined.

---

### The Alloy Stub Pattern

Alloy.js is loaded asynchronously — but you need to call `alloy("configure")` immediately. Without the stub, calling `alloy()` before the script loads would throw `ReferenceError: alloy is not defined`.

**How the stub works:**

```javascript
// This ONE line is the entire stub:
!function(n,o){o.forEach(function(o){n[o]||((n.__alloyNS=n.__alloyNS||[]).push(o),
n[o]=function(){var u=arguments;return new Promise(function(i,l){n[o].q.push([i,l,u])})},
n[o].q=[])})}(window,["alloy"]);
```

**What it creates:**
```javascript
window.alloy = function() {
  // Returns a Promise
  // Pushes [resolve, reject, arguments] into window.alloy.q (a queue)
  return new Promise((resolve, reject) => {
    window.alloy.q.push([resolve, reject, arguments]);
  });
};
window.alloy.q = []; // the queue
```

When alloy.js fully loads, it replaces the stub with the real implementation and drains the queue — processing every call that was made during loading. This is why `alloy("configure", ...)` called right after the script tag works correctly even though the script hasn't parsed yet.

---

### Consent Management

The implementation uses **Adobe's standard consent model** (version 1.0) with a cookie banner as the collection mechanism.

**The two layers:**

```
Layer 1: Cookie Banner (UI)
  Shows after 3 seconds if localStorage has no 'aep-consent' entry
  Accept/Decline buttons → store decision → trigger Layer 2

Layer 2: alloy setConsent (SDK)
  alloy("setConsent", { consent: [{ standard: "Adobe", version: "1.0", value: { general: "in" } }] })
  This either:
    "in"  — releases the pending event queue → all queued events send
    "out" — discards the pending event queue → no data sent
```

**Persistence:**
- Decision stored in `localStorage` key `aep-consent`
- On subsequent page loads: `showConsentBanner()` reads localStorage and calls `setAlloyConsent()` immediately — the banner never shows again
- The stored value is `"in"` or `"out"` (matching the alloy consent model)

**The flow on first visit:**

```
Page loads
         ↓ (3 seconds later)
delayed.js runs → loadAlloy() → alloy configured with defaultConsent: 'pending'
         ↓
alloy("sendEvent", { page view }) → queued (not sent yet)
         ↓
showConsentBanner() → banner slides up
         ↓
User clicks Accept
         ↓
localStorage.setItem('aep-consent', 'in')
alloy("setConsent", { general: "in" }) → QUEUE DRAINS → page view sends to AEP
ACDL push → { event: 'consent decision', consent: { value: 'in' } }
```

**The flow on returning visit (consent already given):**

```
delayed.js runs → localStorage.getItem('aep-consent') = 'in'
         ↓
setAlloyConsent('in') called immediately
         ↓
alloy("sendEvent", { page view }) fires immediately (no queue needed)
Banner never shown ✅
```

---

### Custom Event Tracking

#### CTA Click Tracking

Uses a **single delegated listener** on `document` rather than individual listeners per button. This is more efficient and works for dynamically added buttons.

```javascript
document.addEventListener('click', (e) => {
  const btn = e.target.closest('a.button, button.button');
  if (!btn) return;
  // ...
});
```

Why `closest()`? If the button contains a span or icon, the click event target may be the child element, not the button itself. `closest()` traverses up to find the matching ancestor.

**Section attribution:** The click event data includes which section the CTA was in:
```javascript
section: btn.closest('[id]')?.id        // section with custom id (Phase 3.2)
  || btn.closest('.section')?.dataset?.id // section data-id attribute
  || ''
```

#### Scroll Depth Tracking

Standard scroll depth milestones (25/50/75/100%) with a `Set` to prevent firing the same milestone twice per page view.

**AA event mapping:**

| Scroll % | AA event |
|----------|----------|
| 25% | event1 |
| 50% | event2 |
| 75% | event3 |
| 100% | event4 |
| Experiment assigned | event5 |

Configure these in AA's Report Suite Admin → Success Events to see scroll depth reports.

#### Video Engagement Tracking

Fires only on the **first play** per video-embed block (`{ once: true }`). Subsequent plays in the same session don't fire again — prevents inflated video play counts from rewatching.

---

### A/B Experimentation

#### How it works end-to-end

```
1. Author sets in Page Properties:
   experiment: hero-cta-test

2. Code in delayed.js:
   const variant = sessionStorage.get('exp-hero-cta-test')
     || (Math.random() < 0.5 ? 'control' : 'variant-a');
   sessionStorage.set('exp-hero-cta-test', variant);
   document.body.dataset.experiment = 'hero-cta-test';
   document.body.dataset.variant = 'control'; // or 'variant-a'

3. CSS in any block targets the variant:
   /* Default CTA text */
   .hero .hero-cta { content: 'Learn More'; }

   /* Variant A — different CTA text */
   body[data-variant="variant-a"] .hero .hero-cta { content: 'Get Started Free'; }

4. alloy sendEvent fires with eVar2=hero-cta-test, eVar3=control
   AA receives the experiment assignment
   You can create segments in AA: eVar2=hero-cta-test AND eVar3=variant-a
   Compare conversion metrics between control and variant-a
```

#### QA workflow

Set `experiment-variant: variant-a` in Page Properties to force variant A for everyone. Preview the page → verify the variant CSS/content is showing correctly. Clear it when done.

#### With Adobe Target

When alloy has `renderDecisions: true`, Target can **override** the random assignment client-side:
- Target activity matches the page URL/audience
- Target returns a "proposition" (DOM modification instruction)
- alloy applies the proposition automatically before the page renders
- This is the EDS + Target integration story — no need for separate at.js

---

### Configuration Setup

#### Step 1: Fill in head.html credentials

```html
<!-- head.html — replace these with your real values -->
<meta name="aep-org-id"        content="ABCDEF@AdobeOrg"/>
<meta name="aep-datastream-id" content="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"/>
```

**Where to find these:**
- Org ID: AEP UI → top-right account menu → `@AdobeOrg`
- Datastream ID: AEP → Data Collection → Datastreams → your datastream

#### Step 2: Configure the Datastream in AEP UI

In AEP → Data Collection → Datastreams:
1. Create a Datastream (or use existing)
2. Add services:
   - **Adobe Analytics** → enter Report Suite ID
   - **Adobe Target** → enabled by default for the org
   - **Adobe Experience Platform** → select a sandbox + dataset

#### Step 3: Set up AA success events

In Adobe Analytics → Report Suite Admin → Success Events:
```
event1 = Scroll 25%
event2 = Scroll 50%
event3 = Scroll 75%
event4 = Scroll 100%
event5 = Experiment Assignment
```

And eVars:
```
eVar1 = Scroll Depth Percent
eVar2 = Experiment ID
eVar3 = Experiment Variant
```

#### Step 4: Customize consent banner text (optional)

Add to `head.html`:
```html
<meta name="cookie-banner-text"  content="We use cookies to personalize your experience."/>
<meta name="cookie-accept-text"  content="Accept Cookies"/>
<meta name="cookie-decline-text" content="Reject Non-Essential"/>
```

If not set, the defaults in `delayed.js` are used.

---

### Analytics Q&A

---

**Q1: Why does alloy use `defaultConsent: 'pending'` instead of `'in'`?**

`'in'` (default if not set) means alloy sends events immediately without waiting for consent — non-compliant in GDPR regions. `'out'` means alloy never sends. `'pending'` is the correct GDPR approach: queue everything until the user makes a decision. If the user has already consented (returning visit), `setAlloyConsent('in')` is called at the top of `showConsentBanner()`, which releases the queue immediately — so real users don't experience any delay in data collection after their first visit.

---

**Q2: What happens to the page-view event if the user declines?**

```
alloy("sendEvent", { page view }) — queued (pending)
         ↓
User clicks Decline
         ↓
alloy("setConsent", { general: "out" })
         ↓
Alloy DISCARDS the entire queue
         ↓
No data sent to AEP Edge Network
         ↓
ACDL push still fires (ACDL is client-side only — no network call)
```

ACDL events always fire regardless of consent because they're client-side only (in-memory array). Only alloy network requests are gated by consent.

---

**Q3: Why use ACDL if alloy already handles events?**

ACDL decouples the data collection layer from the delivery layer. Today you use alloy. Tomorrow you might:
- Add Adobe Launch/Tags (subscribes to ACDL events)
- Add a customer data platform that listens to ACDL
- Add debug tooling (ACDL event inspector)

With ACDL as the event bus, you don't change your tracking code when you change your delivery mechanism.

---

**Q4: How does `renderDecisions: true` enable Adobe Target without at.js?**

When alloy sends an event with `renderDecisions: true`:

```
alloy("sendEvent", { renderDecisions: true, xdm: {...} })
         ↓
AEP Edge receives event
         ↓ (if Target service is in Datastream)
Target evaluates which activities match this visitor
         ↓
Returns "propositions" — DOM modification instructions:
  { selector: ".hero h1", content: "Try It Free Today" }
         ↓
alloy applies the DOM changes automatically before rendering completes
```

The visitor sees the personalized content without any flicker. This is faster than at.js because the decisioning is bundled into the same network request as the analytics ping.

---

**Q5: The experiment variant is assigned in `delayed.js` which runs 3 seconds after load. Won't users see the control version for 3 seconds before variant-a appears?**

Yes — this is a limitation of the client-side random assignment approach. The 3-second delay means any visual experiment (different headline, hero image, CTA color) will flash from control → variant-a, which is a bad user experience.

**Solutions:**
1. **Adobe Target server-side**: When alloy sends the page-view event, Target returns a proposition before the page fully renders (using edge network latency of ~50ms). No 3-second delay.
2. **Edge-side experimentation**: EDS supports a URL-based traffic split at the CDN layer — different variants are served as different pages with no client-side flicker.
3. **Non-visual experiments only**: Use client-side random assignment only for non-visual tests (e.g. different email subject lines, different analytics tracking, feature flags) where a 3-second delay has no user-visible effect.

For visual experiments in production, use Adobe Target via alloy with `renderDecisions: true`.

---

*Last updated: July 2, 2026*

