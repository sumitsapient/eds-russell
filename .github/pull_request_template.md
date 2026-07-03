## What does this PR do?

<!-- Brief description of the change -->

## Linked Issue

Fix #<gh-issue-id>

## Test URLs

| | URL |
|---|---|
| **Before** | `https://main--eds-russell--sumitsapient.aem.page/` |
| **After** | `https://<branch>--eds-russell--sumitsapient.aem.page/` |

---

## Checklist

### Performance ⚡
- [ ] Ran PageSpeed Insights on the feature preview URL — score is 100
- [ ] No new render-blocking `<script>` or `<link>` tags added to `head.html`
- [ ] All new images use `createOptimizedPicture()` or are pre-optimized (< 200KB)
- [ ] No npm packages imported (use vanilla JS or CDN-loaded libraries in `delayed.js`)

### Accessibility ♿
- [ ] axe-core shows 0 violations on the test page (`[a11y] ✅` in console)
- [ ] All interactive elements are keyboard-reachable (Tab key test)
- [ ] All `<img>` tags have meaningful `alt` text
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI elements)
- [ ] New blocks use semantic HTML (`<button>` not `<div onclick>`, `<nav>` for navigation, etc.)

### SEO 🔍
- [ ] Every new page has an `<h1>`
- [ ] Page title and description are set in Page Properties
- [ ] JSON-LD schema is correct if a new schema type was added

### Content Model 📋
- [ ] Block models have max 4 fields (`xwalk/max-cells` rule)
- [ ] Ran `npm run build:json` after changing any `_*.json` partial
- [ ] `npm run lint` passes with 0 errors

### Security 🔒
- [ ] No API keys, tokens, or secrets committed
- [ ] User-generated content is sanitized with `sanitizeHTML()` from `scripts.js`
- [ ] New third-party CDN scripts have `crossorigin="anonymous"`

### Code Quality 🧹
- [ ] Block CSS selectors are scoped to the block (e.g. `.my-block .title`, not `.title`)
- [ ] No `console.log` left in production code paths
- [ ] Functions have JSDoc comments
