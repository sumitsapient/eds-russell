# Enterprise EDS Roadmap

> A phased plan to transform this AEM Edge Delivery Services project from boilerplate into a production-grade, enterprise-level website.

---

## Content Strategy: Dual-Source Architecture

This project uses **two complementary content sources**:

| Source | Use Case | Authoring Tool |
|--------|----------|----------------|
| **Page Content** | Page-level layout, sections, inline blocks | Universal Editor |
| **Page Fragments** | Reusable authored sections (CTAs, banners, shared modules) | Universal Editor via `fragment` block |
| **AEM Content Fragments** | Structured, reusable data (articles, products, team, FAQs, events) | AEM Content Fragment Editor / Universal Editor |

### Why Content Fragments?

- **Structured Data** — Content Fragments enforce a schema (CF Model), ensuring consistency across hundreds of items (e.g., 500 product entries, 200 blog articles)
- **Omnichannel** — Same CF data can power the website, mobile app, email, and third-party channels via GraphQL
- **Decoupled Rendering** — Blocks fetch CF data via API and render client-side, enabling dynamic filtering, sorting, and pagination
- **Author Efficiency** — Authors manage structured content in dedicated CF editor without worrying about layout
- **Scalability** — Query-driven listing pages (article hub, product catalog) that scale without manual page creation

### Content Fragments Flow
```
AEM Author → Content Fragment Editor → Publish → GraphQL Persisted Query
                                                         ↓
EDS Page → Block JS → fetch() CF API → Render DOM → User sees content
```

---

## Current State Assessment

The project is based on `aem-boilerplate-xwalk` with these existing assets:

| Category | Status |
|----------|--------|
| Blocks | `cards`, `columns`, `hero`, `fragment`, `header`, `footer` |
| Scripts | `scripts.js`, `delayed.js`, `editor-support.js` |
| Styling | Basic CSS custom properties, responsive breakpoints |
| Content Models | Basic models for buttons, images, text, titles, sections |
| Performance | Three-phase loading (eager/lazy/delayed) |
| Authoring | Universal Editor support with instrumentation helpers |

---

## Phase 1: Foundation & Design System (Week 1–2)

### 1.1 Design Tokens & Theming
- [ ] Expand CSS custom properties into a full token system (colors, spacing, typography, shadows, borders, motion)
- [ ] Add dark mode support via `prefers-color-scheme` and a manual toggle
- [ ] Create a `styles/tokens.css` for centralized design tokens
- [ ] Implement section-level theme overrides (e.g., `dark`, `brand`, `accent` section styles)

### 1.2 Typography System
- [ ] Establish a modular type scale with fluid typography (`clamp()`)
- [ ] Add font subsetting and `font-display: swap` optimization
- [ ] Create utility classes for text alignment, weight, and color

### 1.3 Grid & Layout System
- [ ] Build a flexible section layout system (full-width, contained, narrow)
- [ ] Add CSS Grid-based column utilities as section metadata options
- [ ] Implement spacing rhythm system (consistent vertical rhythm)

### 1.4 Icon System Enhancement
- [ ] Expand icon library (social, navigation, utility icons)
- [ ] Add icon sizing variants and color inheritance
- [ ] Implement sprite-based or inline SVG optimization

---

## Phase 2: Core Blocks Library (Week 2–4)

### 2.1 Navigation & Wayfinding
- [ ] **Mega Menu** – Multi-level desktop navigation with flyout panels
- [ ] **Breadcrumb** – Auto-generated breadcrumb trail from page hierarchy
- [ ] **Side Navigation** – Contextual sidebar nav for documentation/content pages
- [ ] **Back to Top** – Scroll-to-top button with smooth animation
- [ ] **Language Selector** – Multi-language/locale switcher

### 2.2 Content & Media Blocks
> 💡 Blocks marked with **[CF]** will support Content Fragment data sources in Phase 11

- [ ] **Accordion / FAQ** – Expandable content panels with accessibility **[CF]**
- [ ] **Tabs** – Tabbed content interface with keyboard navigation
- [ ] **Carousel / Slider** – Touch-friendly image/content carousel **[CF]**
- [ ] **Modal / Dialog** – Accessible modal overlay system
- [ ] **Video Embed** – YouTube/Vimeo/MP4 with lazy loading and poster images
- [ ] **Image Gallery / Lightbox** – Grid gallery with fullscreen viewer
- [ ] **Quote / Testimonial** – Styled blockquote with attribution **[CF]**
- [ ] **Timeline** – Vertical/horizontal timeline for milestones **[CF]**
- [ ] **Stats / Counter** – Animated number counters with intersection observer

### 2.3 Data & Forms
- [ ] **Table** – Responsive data tables with sorting and filtering
- [ ] **Form** – Multi-field form block (text, email, select, textarea, checkbox, radio)
- [ ] **Form Validation** – Client-side validation with accessible error messages
- [ ] **Search** – Site search with autocomplete and results page
- [ ] **Filter / Facets** – Content filtering UI for listing pages

### 2.4 Commerce & Conversion
- [ ] **Pricing Table** – Feature comparison with pricing tiers **[CF]**
- [ ] **CTA Banner** – Full-width call-to-action with background image/video
- [ ] **Newsletter Signup** – Email capture with integration hooks
- [ ] **Social Proof** – Logo wall, customer testimonials carousel **[CF]**
- [ ] **Feature Grid** – Icon + text feature highlights **[CF]**

### 2.5 Utility Blocks
- [ ] **Fragment** – Already exists; enhance with caching and error handling
- [ ] **Embed** – Generic embed block for iframes, maps, social posts
- [ ] **Code Block** – Syntax-highlighted code display
- [ ] **Download** – File download cards with metadata
- [ ] **Share** – Social sharing buttons (Web Share API with fallback)

---

## Phase 3: Advanced Authoring & Content Modeling (Week 4–5)

### 3.1 Component Model Enhancements
- [ ] Add block variants via `classes` field in component definitions
- [ ] Create field groups for reusable field patterns (CTA group, media group)
- [ ] Implement conditional fields using model expressions
- [ ] Add validation rules in component models

### 3.2 Section Metadata Extensions
- [ ] Background images/videos on sections
- [ ] Custom section IDs for anchor linking
- [ ] Section spacing overrides (compact, spacious)
- [ ] Section animation triggers (fade-in, slide-up)

### 3.3 Page Metadata & Templates
- [ ] Article/Blog template with structured data
- [ ] Landing page template (full-width hero, no nav)
- [ ] Documentation template (sidebar + TOC)
- [ ] Product page template
- [ ] Define page-level metadata fields (OG, Twitter, schema.org)

### 3.4 Auto Blocks
- [ ] Auto-embed YouTube links as video players
- [ ] Auto-generate table of contents from headings
- [ ] Auto-breadcrumb from page path
- [ ] Auto-related content from metadata tags

---

## Phase 4: Performance & Core Web Vitals (Week 5–6)

### 4.1 LCP Optimization
- [ ] Preload critical hero images via `head.html`
- [ ] Implement `fetchpriority="high"` for above-fold images
- [ ] Optimize font loading strategy (preload key fonts, use `font-display: optional`)
- [ ] Minimize render-blocking CSS in eager phase

### 4.2 CLS Prevention
- [ ] Set explicit `aspect-ratio` on all media containers
- [ ] Reserve space for header/nav before load
- [ ] Prevent layout shifts from lazy-loaded sections
- [ ] Add `contain` CSS property where appropriate

### 4.3 INP / FID Optimization
- [ ] Debounce/throttle scroll and resize handlers
- [ ] Use `requestAnimationFrame` for DOM batch updates
- [ ] Implement `content-visibility: auto` for off-screen sections
- [ ] Move heavy computation to `requestIdleCallback`

### 4.4 Resource Loading
- [ ] Implement resource hints (`dns-prefetch`, `preconnect`) in `head.html`
- [ ] Add service worker for offline capability and caching
- [ ] Implement `<link rel="modulepreload">` for critical JS
- [ ] Lazy load all below-fold block JS/CSS (already handled by EDS architecture)

### 4.5 Image Optimization
- [ ] Ensure all committed images use WebP/AVIF formats
- [ ] Add responsive `srcset` and `sizes` attributes where needed
- [ ] Implement blur-up placeholder pattern for hero images

---

## Phase 5: SEO & Structured Data (Week 6–7)

### 5.1 Technical SEO
- [ ] Implement comprehensive `head.html` with canonical, hreflang, meta robots
- [ ] Configure `helix-sitemap.yaml` for all content types
- [ ] Set up `robots.txt` with proper directives
- [ ] Implement 301 redirect handling via `redirects.xlsx` spreadsheet
- [ ] Add pagination metadata for listing pages

### 5.2 Structured Data (JSON-LD)
- [ ] Organization schema on all pages
- [ ] BreadcrumbList schema auto-generated
- [ ] Article/BlogPosting schema for blog posts
- [ ] FAQ schema for accordion/FAQ blocks
- [ ] Product schema for product pages
- [ ] LocalBusiness schema (if applicable)
- [ ] Sitelinks search box schema

### 5.3 Open Graph & Social
- [ ] Complete OG metadata (title, description, image, type, url)
- [ ] Twitter Card metadata
- [ ] Auto-generate OG images (or author-specified)

### 5.4 Content SEO Utilities
- [ ] Auto-generate `id` attributes on headings for deep linking
- [ ] Reading time calculator in page metadata
- [ ] Last modified date display from sheet metadata

---

## Phase 6: Analytics, Personalization & Martech (Week 7–8)

### 6.1 Analytics Foundation
- [ ] Implement Adobe Analytics / Google Analytics 4 in `delayed.js`
- [ ] Set up custom event tracking (CTA clicks, scroll depth, video engagement)
- [ ] Implement consent management (cookie banner block)
- [ ] Add data layer population for tag management

### 6.2 A/B Testing & Experimentation
- [ ] Implement AEM Experimentation plugin (`@adobe/aem-experimentation`)
- [ ] Set up audience-based targeting via metadata
- [ ] Create experiment variant delivery mechanism
- [ ] Add campaign tracking parameters handling

### 6.3 Personalization
- [ ] Geo-based content personalization hooks
- [ ] Returning visitor detection and content adaptation
- [ ] Session-based personalization (viewed pages, interests)
- [ ] Integration hooks for Adobe Target / CDP

### 6.4 Real User Monitoring (RUM)
- [ ] Leverage built-in EDS RUM (already active)
- [ ] Add custom RUM events for business KPIs
- [ ] Set up RUM dashboard for Core Web Vitals monitoring
- [ ] Implement error tracking and reporting

---

## Phase 7: Internationalization & Localization (Week 8–9)

### 7.1 Multi-Language Architecture
- [ ] Set up folder-based locale structure (`/en/`, `/fr/`, `/de/`, etc.)
- [ ] Implement `hreflang` tags via metadata
- [ ] Create language switcher block
- [ ] Configure `fstab.yaml` for multi-site content sources

### 7.2 RTL Support
- [ ] Add `dir="rtl"` handling in CSS
- [ ] Implement logical properties (`margin-inline-start`, etc.)
- [ ] Test all blocks for RTL compatibility

### 7.3 Locale-Specific Features
- [ ] Date/time formatting based on locale
- [ ] Number formatting (currency, decimals)
- [ ] Locale-aware content sorting

---

## Phase 8: Accessibility (WCAG 2.1 AA+) (Week 9–10)

### 8.1 Structural Accessibility
- [ ] Ensure proper landmark regions (`<main>`, `<nav>`, `<aside>`, `<footer>`)
- [ ] Implement skip-to-content link
- [ ] Ensure single `<h1>` per page, proper heading hierarchy
- [ ] Add `aria-live` regions for dynamic content updates

### 8.2 Interactive Component Accessibility
- [ ] Full keyboard navigation for all blocks (tabs, accordion, carousel, modal)
- [ ] Focus management (focus trapping in modals, return focus on close)
- [ ] ARIA patterns following WAI-ARIA Authoring Practices
- [ ] Visible focus indicators meeting 3:1 contrast ratio

### 8.3 Media Accessibility
- [ ] Alt text enforcement and quality guidelines
- [ ] Video captions/transcripts support
- [ ] `prefers-reduced-motion` support for all animations
- [ ] `prefers-contrast` support for high-contrast mode

### 8.4 Testing & Compliance
- [ ] Integrate axe-core automated testing
- [ ] Screen reader testing checklist (VoiceOver, NVDA, JAWS)
- [ ] Color contrast verification (4.5:1 text, 3:1 UI)
- [ ] Touch target size enforcement (44×44px minimum)

---

## Phase 9: Security & Governance (Week 10–11)

### 9.1 Content Security
- [ ] Implement Content Security Policy headers via CDN config
- [ ] Configure `.hlxignore` to prevent sensitive file exposure
- [ ] Sanitize any user-generated content (already have DOMPurify)
- [ ] Add Subresource Integrity (SRI) for third-party scripts

### 9.2 Authentication & Gated Content
- [ ] Implement token-based authentication for gated pages
- [ ] Create login/logout flow block
- [ ] Gated content sections with access control
- [ ] Integration with identity provider (Adobe IMS, Okta, Auth0)

### 9.3 Code Quality & Governance
- [ ] Pre-commit hooks with Husky (already configured)
- [ ] Branch protection rules documentation
- [ ] PR template with checklist (performance, a11y, testing)
- [ ] Code review guidelines document

---

## Phase 10: Developer Experience & Tooling (Week 11–12)

### 10.1 Testing Framework
- [ ] Unit tests with Web Test Runner or Mocha for utility functions
- [ ] Integration tests for block decoration logic
- [ ] Visual regression testing with Playwright
- [ ] Lighthouse CI in GitHub Actions for performance gates

### 10.2 CI/CD Pipeline
- [ ] GitHub Actions workflow for linting on PR
- [ ] Automated PageSpeed Insights checks
- [ ] Automated accessibility checks (axe-core)
- [ ] Branch preview URL validation
- [ ] Automated JSON model validation

### 10.3 Documentation
- [ ] Block documentation with usage examples
- [ ] Authoring guide for content editors
- [ ] Developer onboarding guide
- [ ] Architecture decision records (ADRs)
- [ ] Component storybook/showcase page

### 10.4 Local Development Enhancements
- [ ] Create `drafts/` folder with sample pages for all block types
- [ ] Add VS Code workspace settings and recommended extensions
- [ ] Create snippet library for common block patterns
- [ ] Add debugging utilities (block inspector, performance overlay)

---

## Phase 11: Content Fragments & Headless Integration (Week 12–14)

### 11.1 AEM Content Fragments Strategy
- [ ] Define Content Fragment Models in AEM for structured content types:
  - **Articles/Blog Posts** – title, author, date, body, tags, hero image
  - **Team Members** – name, role, bio, photo, social links
  - **Products** – name, description, price, features, images, SKU
  - **FAQs** – question, answer, category
  - **Events** – title, date, location, description, registration URL
  - **Testimonials** – quote, author, company, avatar
- [ ] Create `scripts/content-fragments.js` utility module:
  - GraphQL persisted query client for AEM Content Fragment API
  - REST endpoint fetcher with response caching (sessionStorage + TTL)
  - Pagination and filtering helpers
  - Error handling and fallback content patterns
- [ ] Implement Content Fragment-powered blocks:
  - **Article List** – dynamic listing from CF query with pagination
  - **Team Grid** – team members pulled from Content Fragments
  - **Product Cards** – product catalog rendered from CF data
  - **Event Calendar** – upcoming events from CF with date sorting
  - **Testimonial Carousel** – rotating quotes from CF
- [ ] Set up AEM GraphQL persisted queries for performance
- [ ] Implement Content Fragment preview in Universal Editor
- [ ] Add JSON-LD structured data auto-generation from CF metadata

### 11.2 Page Fragments (Reusable Authored Sections)
- [ ] Enhance existing `fragment` block with loading states and error handling
- [ ] Create shared fragment library for reusable content:
  - Global CTA banners
  - Promotional ribbons
  - Trust badges / social proof sections
  - Legal disclaimers
  - Cross-sell / related content modules
- [ ] Implement fragment caching strategy (avoid redundant fetches)
- [ ] Add fragment variant support (same fragment, different visual treatment)
- [ ] Document fragment authoring patterns for content editors

### 11.3 Headless API Consumption
- [ ] Create utility for fetching and caching JSON endpoints
- [ ] Implement spreadsheet-driven content (query index, configurations)
- [ ] Build dynamic listing pages from `helix-query.yaml` indexes
- [ ] Add GraphQL/REST API integration patterns for external data
- [ ] Implement stale-while-revalidate caching pattern for API responses

### 11.2 Commerce Integration
- [ ] Product catalog integration hooks
- [ ] Shopping cart block (if applicable)
- [ ] Pricing API integration
- [ ] Checkout flow integration

### 11.3 Third-Party Services
- [ ] Map embed (Google Maps, Mapbox) with lazy loading
- [ ] Chat widget integration (delayed load)
- [ ] Calendar/booking system integration
- [ ] CRM form submission integration (Marketo, HubSpot, Salesforce)

### 11.4 Email & Notifications
- [ ] Newsletter subscription integration
- [ ] Transactional email triggers
- [ ] Push notification setup (if applicable)

---

## Phase 12: Multi-Site & Scalability (Week 14–16)

### 12.1 Multi-Site Architecture
- [ ] Shared block library across multiple sites
- [ ] Site-specific theme overrides
- [ ] Cross-site content sharing via fragments
- [ ] Centralized configuration management

### 12.2 Content Governance
- [ ] Content expiry and archival strategy
- [ ] Broken link detection automation
- [ ] Content freshness indicators
- [ ] Editorial workflow documentation

### 12.3 Performance at Scale
- [ ] CDN configuration optimization
- [ ] Edge-side personalization rules
- [ ] Prerendering strategy for high-traffic pages
- [ ] Cache invalidation strategy documentation

---

## Implementation Priority Matrix

| Priority | Phase | Business Impact | Effort |
|----------|-------|----------------|--------|
| 🔴 Critical | Phase 1, 4, 8 | Foundation, Performance, Accessibility | Medium |
| 🟠 High | Phase 2, 3, 5 | Content Blocks, Authoring, SEO | High |
| 🟡 Medium | Phase 6, 7, 9 | Analytics, i18n, Security | Medium |
| 🟢 Nice-to-have | Phase 10, 11, 12 | DX, Integrations, Scale | High |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 100 |
| Lighthouse Accessibility | 100 |
| Lighthouse SEO | 100 |
| Lighthouse Best Practices | 100 |
| LCP | < 1.5s |
| CLS | < 0.05 |
| INP | < 100ms |
| Time to First Byte | < 200ms |
| Total Page Weight | < 200KB (initial load) |
| Block Library Coverage | 25+ production-ready blocks |
| Code Coverage | > 80% for utilities |

---

## Getting Started

To begin implementation, we'll start with **Phase 1** (Design System) and **Phase 2** (Core Blocks), as they provide the foundation everything else builds on. Each phase will:

1. Create the required files (CSS, JS, JSON models)
2. Test locally with `aem up`
3. Validate with `npm run lint`
4. Check performance with PageSpeed Insights
5. Document usage for content authors

---

*Last updated: July 1, 2026*

