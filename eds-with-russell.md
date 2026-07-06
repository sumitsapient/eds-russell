# EDS with Russell Investments — Demo Playbook

> **Purpose:** A living document tracking how we replicate Russell Investments' existing AEM as a Cloud Service site functionality using Edge Delivery Services — so the business can evaluate EDS as an official platform migration path.
>
> **Audience:** Sumit (demo builder) + Russell Investments stakeholders (decision makers)
>
> **Updated:** July 5, 2026

---

## Table of Contents

1. [Context & Goal](#context--goal)
2. [The Pitch — Why EDS for Russell](#the-pitch--why-eds-for-russell)
3. [What Russell Has Today (AEMaaCS)](#what-russell-has-today-aemaacs)
4. [Demo Scope — What We Will Replicate](#demo-scope--what-we-will-replicate)
5. [Architecture Comparison](#architecture-comparison)
6. [AEM + EDS Coexistence — The Origin Selector Pattern](#aem--eds-coexistence--the-origin-selector-pattern)
7. [Demo Environment Setup](#demo-environment-setup)
8. [Phase-by-Phase Build Plan](#phase-by-phase-build-plan)
9. [Requirements & Progress](#requirements--progress)
9. [Stakeholder Talking Points](#stakeholder-talking-points)
10. [Open Questions](#open-questions)

---

## Context & Goal

### The Situation

Russell Investments currently runs their public website on **AEM as a Cloud Service (AEMaaCS)** — a full Java/Sling stack with:
- Server-side rendered (SSR) pages via AEM Dispatcher + CDN
- Custom AEM Core Components (HTL/Sling)
- AEM Sites with a traditional page/template/component model
- Workflows, replication agents, and dispatcher flush for publishing
- A dedicated DevOps pipeline (Cloud Manager) for code deployments

The site is **live and working** — but the team wants to understand if EDS could deliver the same (or better) experience with less infrastructure overhead and better performance out of the box.

### The Goal

Build a **functional EDS demo** that:
1. Replicates key pages and components from the live Russell Investments site
2. Demonstrates EDS-native authoring via Universal Editor
3. Shows real Lighthouse 100 scores vs. the current AEMaaCS site
4. Proves content parity — the same content, just delivered differently
5. Gives the business confidence to approve an official EDS migration evaluation

### Definition of Success

> A stakeholder can sit in the demo, navigate the EDS version of a Russell page, see the Lighthouse score, use Universal Editor to edit content live, and say **"this does what our site does — faster."**

---

## The Pitch — Why EDS for Russell

These are the headline arguments to open the demo with. Each one has a "prove it" moment built into the demo.

| Pain Point Today (AEMaaCS) | EDS Solution | Proof in Demo |
|---|---|---|
| Lighthouse scores typically 60–80 on mobile | EDS scores 100 by default | Side-by-side PageSpeed comparison |
| Code deploys require Cloud Manager pipeline (30–60 min) | Code deploys via `git push` — live in seconds via AEM Code Sync | Push a CSS change live during the demo |
| New component requires Java dev + HTL + Sling model + unit tests + pipeline | New block = 2 JS/CSS files, no build step, no backend | Build a simple block live in the demo |
| Author training needed for complex dialog UIs | Authors edit text inline in Universal Editor — what you see is what you get | Show UE inline editing vs. traditional dialog |
| Infrastructure: Dispatcher, CDN config, replication agents to manage | Zero infrastructure to manage — CDN is built in | Show the architecture diagram |
| Performance bottleneck: SSR adds latency for each request | Pages are pre-rendered HTML on CDN edge — no SSR on request | Show TTFB: AEMaaCS vs EDS |

---

## What Russell Has Today (AEMaaCS)

> Fill this section in as we discover the current site's features. Each item becomes a candidate for the demo replication list.

### Known Pages / Templates

| Page / Template | URL Pattern | Priority |
|---|---|---|
| Home page | `/` | P0 — must demo |
| Blog listing | `/insights` or `/blog` | P0 — must demo |
| Blog article | `/insights/{article-slug}` | P0 — must demo |
| About / Team | `/about` | P1 |
| Contact / Forms | `/contact` | P1 |
| Fund pages | `/funds/{fund-id}` | P2 — data-heavy, complex |
| Search results | `/search` | P2 |

### Known Components / Features

| Component | AEMaaCS Implementation | EDS Equivalent |
|---|---|---|
| Hero banner (image + headline + CTA) | Core Component `teaser` | `hero` block |
| Navigation (mega menu) | Custom component + JS | `header` block |
| Footer with links | Core Component `navigation` | `footer` block |
| Blog card grid / listing | Custom Sling model + HTL | `cards` block or `insights-listing` block |
| Article body (rich text) | Core Component `text` | Default content (EDS renders rich text natively) |
| CTA banner | Custom component | `cta-banner` block |
| Accordion / FAQ | Core Component `accordion` | `accordion` block |
| Search | AEM Sites Search / Solr | `search` block |
| Forms | AEM Forms | `form` block |
| Video | Core Component `embed` | `video-embed` block (auto-block) |

### Performance Baseline (AEMaaCS)

> Run PageSpeed on the live site and record the baseline scores here before the demo.

| Page | Mobile Score | Desktop Score | LCP | CLS | INP |
|---|---|---|---|---|---|
| Home `/` | — | — | — | — | — |
| Blog listing | — | — | — | — | — |
| Blog article | — | — | — | — | — |

**How to measure:**
```
https://pagespeed.web.dev/?url=https://www.russellinvestments.com/
```

---

## Demo Scope — What We Will Replicate

We are NOT doing a full migration. We are building a **representative demo** that proves the concept. Scope is intentionally narrow.

### In Scope (Demo MVP)

- [ ] **Home page** — hero + 2–3 sections of content
- [ ] **Blog listing page** — card grid of articles with title, image, date, category
- [ ] **Blog article page** — full article with reading progress, reading time, TOC
- [ ] **Navigation** — top nav with logo + links (simplified, not full mega-menu)
- [ ] **Footer** — links + copyright
- [ ] **Live performance comparison** — side-by-side PageSpeed scores

### Out of Scope (Demo)

- Fund data pages (requires complex data integration)
- AEM Forms replication (separate product)
- Full mega-menu (can be noted as "achievable, not in demo scope")
- Authentication / gated content
- Full 1:1 pixel-perfect design match (not needed for concept approval)

---

## Architecture Comparison

### AEMaaCS Today

```
Author (AEMaaCS UI)
    ↓  edit content
AEM Author Instance (Java/Sling/OSGi)
    ↓  replication / workflow
AEM Publish Instance
    ↓  Dispatcher cache flush
AEM Dispatcher (Apache)
    ↓  CDN (Akamai / Fastly / CloudFront)
    ↓
End User Browser (receives SSR HTML)
```

**Bottlenecks:**
- Every request that misses cache hits the Dispatcher (then possibly Publish)
- Cache invalidation is manual or workflow-driven
- Cold cache = full SSR render time (~200–500ms TTFB)
- Code changes need Cloud Manager pipeline (build → test → deploy = 30–60 min)

### EDS Alternative

```
Author (Universal Editor / Google Docs / SharePoint)
    ↓  click Preview or Publish
AEM Admin API (renders JCR → plain HTML)
    ↓
Fastly Edge CDN (globally distributed, pre-rendered HTML)
    ↓  <20ms cache hit TTFB
End User Browser (receives pre-rendered HTML, runs block JS for interactivity)

Code changes:
GitHub push → AEM Code Sync bot → live in seconds (no pipeline)
```

**Advantages:**
- TTFB < 20ms vs 200–500ms (cache hit)
- No Dispatcher to maintain
- No replication agents
- Code deploy = git push
- Block JS/CSS loads only on pages that use that block (automatic code splitting)

---

## AEM + EDS Coexistence — The Origin Selector Pattern

> **Short answer: Yes — AEM pages and EDS pages can live on the exact same domain at the same time. The user never sees the `main--repo--owner.aem.live` URL. This is the standard migration pattern Adobe recommends.**

---

### The Problem You Identified

Without any special setup, an EDS page lives at:
```
https://main--eds-russell--sumitsapient.aem.live/blog/my-post
```

That URL screams "proof of concept" to a business audience. For the demo to feel real — and for a real production migration — EDS pages must serve under the company domain:
```
https://www.russellinvestments.com/blog/my-post   ← user sees only this
```

---

### How It Works: CDN-Level Origin Routing

The solution happens entirely at the **CDN layer** — no changes to AEM, no changes to EDS, no code changes in the browser. The CDN acts as a traffic router.

```
User requests: https://www.russellinvestments.com/blog/my-post
                              ↓
                     Russell's CDN (Akamai / Fastly / CloudFront)
                              ↓
                    CDN checks routing rules:
                    ┌─────────────────────────────────────────┐
                    │ if path starts with /blog/*             │
                    │   → forward to EDS origin               │
                    │     (main--repo--owner.aem.live)        │
                    │                                         │
                    │ else (everything else)                  │
                    │   → forward to AEM Dispatcher origin    │
                    │     (existing AEM publish/dispatcher)   │
                    └─────────────────────────────────────────┘
                              ↓
            User gets the right page — domain never changes
```

**The CDN is the only thing that knows there are two origins. The browser never sees it.**

---

### The Origin Selector — Adobe's Official Pattern

Adobe calls this the **"Bring Your Own CDN" (BYOCDN)** pattern with **origin selection rules**. It is documented and production-supported.

**How you configure it (example using Fastly VCL or Akamai Edge Logic):**

```
# Rule 1: EDS pages — route to EDS origin
if (req.url ~ "^/blog/") {
  set req.backend = eds_origin;        # main--repo--owner.aem.live
}

# Rule 2: EDS pages — more paths
if (req.url ~ "^/insights/") {
  set req.backend = eds_origin;
}

# Rule 3: Everything else — AEM as usual
else {
  set req.backend = aem_dispatcher;   # existing AEM Dispatcher
}
```

**The two origins registered in the CDN:**

| Origin name | Points to | Serves |
|---|---|---|
| `aem_dispatcher` | Russell's existing AEM Dispatcher IP/hostname | All legacy AEM pages |
| `eds_origin` | `main--eds-russell--sumitsapient.aem.live` | EDS-delivered pages |

**Result:**
- `www.russellinvestments.com/about` → AEM Dispatcher → old AEM page ✅
- `www.russellinvestments.com/blog/my-post` → EDS origin → EDS page ✅
- User sees only `www.russellinvestments.com` for both ✅
- Link from AEM page to EDS page = just a normal `<a href="/blog/my-post">` ✅

---

### Migration Strategy This Enables

This is exactly how a real Russell EDS migration would work — not a big-bang cutover, but a **path-by-path migration**:

```
Month 1: Migrate /blog/* to EDS         → measure performance improvement
Month 2: Migrate /insights/* to EDS     → measure
Month 3: Migrate /about/* to EDS        → measure
Month N: Migrate / (home) to EDS        → full site on EDS
```

At any point, you can roll a path back to AEM by changing one CDN rule. **Zero risk** to the live site.

---

### For the Demo — Three Options (Ranked)

#### Option 1 ✅ Recommended: Demo Subdomain

Ask Russell IT to create a demo subdomain with the Origin Selector configured:

```
eds-demo.russellinvestments.com  →  CDN  →  main--repo--owner.aem.live
```

**What stakeholders see:** `https://eds-demo.russellinvestments.com/blog/my-post`

**Effort:** Low — one DNS CNAME entry + one CDN routing rule. IT can do this in an afternoon.
**Risk:** Zero — this is a new subdomain. Production is untouched.
**Impact:** High — stakeholders see the EDS experience under a Russell domain.

---

#### Option 2 🟡 Acceptable: Explain the Architecture, Show the EDS URL

Demo the EDS experience at `main--repo--owner.aem.page` but open with the architecture diagram (the CDN routing diagram above). Then say:

> "In production, this URL would be `www.russellinvestments.com/blog/my-post`. The `aem.page` URL is just the demo environment. The CDN routing I showed you is a one-afternoon IT task."

**Effort:** Zero.
**Risk:** Zero.
**Impact:** Medium — requires stakeholders to mentally substitute the URL. Some may fixate on it.

---

#### Option 3 🔴 Local Only: `hosts` File Override (Sumit's machine only)

On your demo laptop, edit `C:\Windows\System32\drivers\etc\hosts`:

```
# Fake russellinvestments.com pointing to your local dev server
127.0.0.1  russellinvestments.com
127.0.0.1  www.russellinvestments.com
```

Then run `npx aem up` and show `http://www.russellinvestments.com:3000/`.

**Effort:** 5 minutes.
**Risk:** Only affects your machine. Remove the hosts entry after the demo.
**Impact:** Visually convincing for a local demo. Falls apart if you share the screen URL or go online.

---

### What to Tell the Business

When a stakeholder asks "will users end up on a different URL?", the answer is:

> "No. This is exactly how a real migration works. We configure the CDN — which you already have — to send `/blog` traffic to EDS and everything else to AEM. Your users see `www.russellinvestments.com` the entire time. We can migrate one section at a time, measure the improvement, and roll back instantly if needed. No big bang, no risk."

---

### Technical Requirements for Production Origin Selector

For reference when the conversation gets serious with IT:

| Requirement | Details |
|---|---|
| CDN with multi-origin support | Fastly, Akamai, CloudFront, Azure Front Door — all support this |
| EDS BYOCDN activation | Adobe must enable BYOCDN on your EDS contract. Included in AEM Sites EDS license |
| SSL cert | Wildcard cert for `*.russellinvestments.com` already covers any subpath |
| AEM Code Sync domain allowlist | Add `www.russellinvestments.com` to the EDS project's allowed push domains |
| No AEM changes needed | AEM Dispatcher and Publish are unchanged. CDN just adds a new origin |

---

## Demo Environment Setup

### Repositories & URLs

| Environment | URL | Notes |
|---|---|---|
| Local dev | `http://localhost:3000` | `npx aem up` |
| Feature preview | `https://{branch}--{repo}--{owner}.aem.page/` | After git push |
| Production preview | `https://main--{repo}--{owner}.aem.page/` | Main branch |

### Demo Pages to Create

> As we build each page, record the local draft path and the preview URL here.

| Page | Local Draft | Preview URL | Status |
|---|---|---|---|
| Home | `drafts/russell-home.html` | — | 🔴 Not started |
| Blog listing | `drafts/russell-blog.html` | — | 🔴 Not started |
| Blog article | `drafts/russell-article.html` | — | 🔴 Not started |

### How to Start the Dev Server

```bash
# From the project root
npx -y @adobe/aem-cli up --no-open --forward-browser-logs --html-folder drafts
# Dev server runs at http://localhost:3000
```

---

## Phase-by-Phase Build Plan

> We go one step at a time. Each phase has a clear deliverable and a "done" definition.

| Phase | Deliverable | Done When |
|---|---|---|
| **Phase R1** | Russell brand tokens (colors, fonts, spacing) in CSS | All CSS custom properties match Russell brand; styles.css updated |
| **Phase R2** | Navigation (header) — simplified top nav | Header renders with Russell logo + nav links at localhost:3000 |
| **Phase R3** | Footer | Footer renders with correct links and copyright |
| **Phase R4** | Hero block (Russell style) | Hero block shows full-bleed image + headline + CTA button in Russell brand style |
| **Phase R5** | Blog listing page | Card grid of mock articles with title, date, category tag, thumbnail |
| **Phase R6** | Blog article page (article template) | Full article page with reading time, TOC, related articles |
| **Phase R7** | Home page assembly | Home page composed from hero + sections + CTA banner |
| **Phase R8** | Performance comparison | Lighthouse 100 on EDS demo vs. current AEMaaCS baseline documented |
| **Phase R9** | Demo script & talking points | Rehearsed walkthrough ready for stakeholder presentation |

---

## Requirements & Progress

> This section is updated with each requirement posted. Each requirement links to its implementation notes.

*No requirements posted yet. Requirements will be added here as they come in.*

---

## Stakeholder Talking Points

> One-liners for the demo presentation. Use these when showing each feature.

### On Performance
> "This page just scored 100 on Lighthouse — on mobile. The same page on the current site scores [X]. The difference is architectural: EDS serves pre-rendered HTML from the nearest CDN edge. There is no server doing work on each request."

### On Developer Experience
> "I just pushed a CSS change. Watch — it's live on the preview URL in under 10 seconds. On AEMaaCS that same change would be a Cloud Manager pipeline: build, test, deploy — typically 30 to 60 minutes."

### On Authoring
> "Authors edit content inline — they click the text, type, and save. There are no dialogs, no 'edit mode' vs 'preview mode' confusion. The canvas is the live page."

### On Cost & Infrastructure
> "There is no Dispatcher to patch. No replication agents to monitor. No publish instance to scale. The infrastructure is fully managed by Adobe. Your team focuses on content and features, not on keeping servers running."

### On Migration Risk
> "EDS and AEMaaCS can run side by side. You don't flip a switch — you migrate page by page, section by section, on your timeline. The content stays in AEM. Only the delivery layer changes."

---

## Open Questions

> Questions that need answers before or during the demo. Updated as answered.

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | What is the current Lighthouse score on the live Russell site? | Sumit | 🔴 Open — measure it |
| 2 | Which pages get the most traffic? (Prioritize demo pages by impact) | Russell team | 🔴 Open |
| 3 | Does Russell use AEM Forms, or a third-party form provider? | Russell team | 🔴 Open |
| 4 | Is there a design system / brand style guide we can reference for colors and fonts? | Russell team | 🔴 Open |
| 5 | Are blog articles in AEM Sites (JCR pages) or Content Fragments? | Russell team | 🔴 Open |
| 6 | Does the site use a mega-menu or a standard nav? | Sumit | 🔴 Open — check live site |
| 7 | What is the target demo date / stakeholder presentation date? | Russell team | 🔴 Open |
| 8 | Can AEM pages and EDS pages coexist on the same domain? | Sumit | 🟢 **Answered** — Yes, via CDN Origin Selector. See [AEM + EDS Coexistence](#aem--eds-coexistence--the-origin-selector-pattern) |
| 9 | What CDN does Russell use today (Fastly / Akamai / CloudFront)? | Russell IT | 🔴 Open — needed to configure Origin Selector routing rules |
| 10 | Can IT spin up `eds-demo.russellinvestments.com` for the demo? | Russell IT | 🔴 Open — ask early, DNS changes can take time |

---

*Last updated: July 5, 2026 — Added: AEM + EDS Coexistence (Origin Selector pattern), demo domain options, Open Questions updated.*

