# Russell Investments: The Case for Edge Delivery Services

> Business case and demo script for the EDS proof of concept, backed by measurements taken on 20 October 2026 from the POC pages and the matching pages on russellinvestments.com.

---

## The one-line pitch

**Same content, same AEM authoring, about 2x the mobile performance score, roughly 10x less page weight, and code changes live in seconds instead of an hour, with no big-bang migration.**

---

## Scorecard

Lighthouse lab tests: each page tested twice under identical conditions, median shown. Mobile uses Lighthouse's standard throttled phone profile.

| Measure (mobile) | EDS POC | Current site (AEMaaCS) | Difference |
|---|---|---|---|
| Performance score | **92–95** on every page | 26–66 | About 2x higher |
| Largest Contentful Paint (Google "good": ≤ 2.5 s) | **2.4–2.5 s**, all pages pass | 2.5–15.4 s, 4 of 5 pages fail | Up to 6x faster |
| Total Blocking Time (Google "good": ≤ 200 ms) | **0–46 ms**, all pages pass | 1,470–6,271 ms, all pages fail | Page responds to taps immediately |
| Layout shift (Google "good": ≤ 0.1) | **0.00–0.09**, all pages pass | 0.02–0.30, ETF page fails | Stable pages |
| Page weight (excl. home video) | **343 KB** average | 3,510 KB average | About 10x lighter |
| JavaScript downloaded (excl. home) | **91 KB** average | 1,648 KB average | About 18x less |
| Network requests (excl. home) | **34** average | 130 average | About 4x fewer |
| Accessibility score | **96–100** | 82–95 | Higher on every page |
| SEO score (see note) | **89–100** | 67–89 | Higher on every page |
| Code change to live | **7 seconds** (measured) | 30–60 min Cloud Manager pipeline (typical) | No build or deploy step |

**SEO note:** preview URLs (`.aem.page`, `.aem.live`) send a "do not index" header on purpose, so test sites stay out of Google. Lighthouse marks that check as failed. The header goes away on the production domain. Both sites' scores above exclude that one check.

---

## The parameters, and how the POC proves each one

### 1. Speed and Core Web Vitals (SEO and conversion)

**Why business should care:** Google uses Core Web Vitals as a ranking signal. Slow mobile pages lose visitors before they see any content. Russell's audience increasingly arrives on mobile from search and email.

**Proof from the POC (mobile):**

| Page | EDS score | Current score | EDS LCP | Current LCP | EDS blocking | Current blocking |
|---|---|---|---|---|---|---|
| Individual Investor (home) | **94** | 46 | 2.5 s | 6.5 s | 46 ms | 3,314 ms |
| About Us | **95** | 45 | 2.4 s | 7.6 s | 0 ms | 1,932 ms |
| Insights | **95** | 66 | 2.4 s | 2.5 s | 0 ms | 1,619 ms |
| Contact Us | **95** | 46 | 2.4 s | 9.4 s | 0 ms | 1,470 ms |
| ETF product page | **92** | 26 | 2.5 s | 15.4 s | 1 ms | 6,271 ms |

**Desktop:**

| Page | EDS score | Current score | EDS LCP | Current LCP |
|---|---|---|---|---|
| Individual Investor (home) | **98** | 77 | 0.8 s | 1.7 s |
| About Us | **99** | 92 | 0.7 s | 1.6 s |
| Insights | **99** | 98 | 0.8 s | 0.7 s |
| Contact Us | **99** | 96 | 0.7 s | 0.4 s |
| ETF product page | **98** | 45 | 0.8 s | 0.8 s |

**Talking point:** "On a phone, our ETF product page takes over 15 seconds to show its main content and is frozen for 6 seconds while scripts run. The EDS version shows it in 2.5 seconds and responds instantly. Same content, same design."

### 2. Page weight and cost to the visitor

**Proof:** the About Us page is **137 KB on EDS vs 3,558 KB today** (26x lighter), with **30 KB of JavaScript vs 1,228 KB** (41x less).

Today every page carries about 1.2 MB of JavaScript, whether it needs it or not. EDS only loads the code for the blocks on that page.

**Talking point:** "Each page the current site serves is the size of a small photo album. EDS sends what that page needs and nothing else."

### 3. Speed of change (time to market)

**Proof from this project:**

- **7 seconds** from merging code on GitHub (09:33:22 UTC) to the new header code being live on Edge Delivery (09:33:29 UTC). There is no build, no pipeline and no deployment window.
- The POC itself went from first analysis to 6 migrated pages plus header and footer in about 1.5 days (18–20 October), with AI-assisted migration.
- A block is a small, self-contained JavaScript and CSS pair (for example, the link cards are about 130 lines of JS). There is no Java, Sling model, HTL or OSGi bundle to build.

**Talking point:** "A marketing fix that waits for the next release today can go live the same afternoon."

### 4. Authoring: nothing changes for authors

**Proof:** the POC pages live in your existing AEM author (`/content/eds-site`) and are edited in Universal Editor. Authors keep AEM Sites, AEM Assets, permissions and workflows, and edit visually on the page itself.

**Talking point:** "Authors don't learn a new CMS. They stay in AEM and get a faster, visual editor."

### 5. Infrastructure and operations

| Today (AEMaaCS publish) | With EDS |
|---|---|
| Publish tier, Dispatcher and cache rules to configure and tune | Pages served as static HTML from Adobe's CDN |
| Dispatcher cache flushes, invalidation issues | Purpose-built cache invalidation on publish |
| HTML cached for 5 minutes (`max-age=300`) | HTML cached for 2 hours (`max-age=7200`) with instant purge on publish |
| Cloud Manager pipeline for every code change | Git push, live in seconds |

**Measured:** with both served from cache, the first byte of HTML arrived in 36–57 ms on EDS vs 84–90 ms on the current site, from the same location (5 requests each).

### 6. Accessibility and quality

EDS scores higher on accessibility on every page (96–100 vs 82–95). The blocks were built with keyboard support and screen-reader labels from the start.

### 7. Low-risk adoption: no big-bang migration

AEM and EDS can serve the same domain side by side. A CDN rule (Origin Selector) routes chosen paths, such as `/insights/*`, to EDS, and everything else stays on AEM. You can migrate section by section, and roll back by changing one rule. (See *AEM + EDS Coexistence* in `eds-with-russell.md`.)

---

## Demo script (about 15 minutes)

1. **Side-by-side PageSpeed (3 min).** Open [PageSpeed Insights](https://pagespeed.web.dev) in two tabs: the current ETF page and the EDS ETF page. Run both on mobile and show the scores, LCP and Total Blocking Time. Use the ETF and About Us pages; they show the biggest gap.
2. **Feel it on a phone (2 min).** Open both versions on a phone over mobile data. Scroll and tap straight away; the current page stays unresponsive while its scripts load.
3. **Page weight (2 min).** In Chrome DevTools → Network, reload About Us on both sites and point at the totals at the bottom: about 3.5 MB vs 140 KB.
4. **Live code change (3 min).** Change a colour in a block's CSS, push it, and refresh the preview within seconds. Contrast this with a Cloud Manager pipeline run.
5. **Authoring (4 min).** Open the Individual Investor page in Universal Editor from AEM Sites. Change a heading, swap an image from AEM Assets, publish, and show the change live.
6. **Coexistence (1 min).** Show the Origin Selector diagram: "We move one section at a time."

---

## Be ready for these questions

Being upfront about these builds trust. Each one has an answer.

| Likely question | Honest answer |
|---|---|
| "These are lab tests, not real users." | True. Lab tests run both sites under identical conditions, which makes them a fair comparison. Real-user data (Chrome UX Report) for the EDS pages builds up once they're live on the production domain. Today's site can be checked in PageSpeed Insights' "real users" section. |
| "Why isn't EDS 100?" | The remaining points come from third-party content kept for parity: the 4.9 MB background video hot-linked from the current site, the Ceros interactive and Adobe Fonts. Self-hosting fonts and loading Ceros on scroll would move the pages towards 100. |
| "The home page is 6 MB on EDS too." | 4.9 MB of that is the same hero video the current site uses. An optimised or shorter video would cut most of it. |
| "Will it stay fast once we add analytics, Target and consent?" | EDS loads martech in a "delayed" phase after the page is usable, which protects the scores. Some cost is expected. The POC doesn't include them yet, and that's the first thing to prove in a pilot. |
| "What about search, forms, fund data and personalisation?" | Not in POC scope. Search and fund data would come from APIs or indexes; forms from AEM Forms on EDS; personalisation from Target via the experimentation plugin. Each needs design work in the pilot. |
| "Our components took years to build." | The POC's 20 blocks plus header and footer were rebuilt in days. Blocks are much smaller than AEM components because the CDN and browser do work that Sling and Dispatcher do today. |
| "Is this an extra licence cost?" | Confirm with your Adobe account team. Edge Delivery Services is part of the AEM Sites as a Cloud Service offering. |
| "Can we go back?" | Yes. Content stays in AEM. With the Origin Selector, rolling back a section means changing one CDN rule. |

---

## Recommendation

1. **Approve a pilot:** move the Insights section (listing plus articles) to EDS behind the Origin Selector on the production domain.
2. **Add the integrations first:** analytics, consent and Target in the pilot, and re-measure to confirm the scores hold.
3. **Measure real users:** compare Chrome UX Report data and conversions for the pilot section against the AEM section for 4–6 weeks.
4. **Decide on rollout** section by section from that data.

---

## Method

- **Tool:** Google Lighthouse 13 (the engine behind PageSpeed Insights); performance, accessibility, best practices and SEO categories; mobile (default throttled profile) and desktop presets.
- **Runs:** 2 per page per site per device, median reported, all run back to back from the same machine on 20 October 2026.
- **Pages compared:** EDS POC pages on `main--eds-russell--sumitsapient.aem.page/us/en/...` vs the matching pages on `russellinvestments.com/content/ri/us/en/...`. The blog article was built from Figma, so it has no live equivalent and isn't in the comparison.
- **Raw reports:** `migration-work/lighthouse/` (one JSON report per run; open in the [Lighthouse Viewer](https://googlechrome.github.io/lighthouse/viewer/)).
- **Re-run before the meeting:** results vary by network and location, so re-run PageSpeed Insights on the day, ideally once the pages are published to the live site.
