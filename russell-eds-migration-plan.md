# Russell Investments: Full Migration Plan to Edge Delivery Services

> The plan for moving russellinvestments.com from AEM as a Cloud Service publish rendering to Edge Delivery Services (EDS). It keeps AEM authoring with MSM and uses Russell's GitLab for code. Prepared 20 October 2026, following the POC (see `poc-business-case.md`).

---

## Contents

1. [The site today](#the-site-today)
2. [The two constraints](#the-two-constraints)
3. [Target architecture](#target-architecture)
4. [Phase 0: Approval and decisions](#phase-0-approval-and-decisions-2-weeks)
5. [Phase 1: Foundation](#phase-1-foundation-23-weeks)
6. [Phase 2: Site structure and MSM](#phase-2-site-structure-and-msm-2-weeks)
7. [Phase 3: Templates and blocks](#phase-3-templates-and-blocks-48-weeks-overlaps-with-phase-4)
8. [Phase 4: Integrations](#phase-4-integrations-in-parallel)
9. [Phase 5: Content migration](#phase-5-content-migration-per-template-then-per-country)
10. [Phase 6: Pilot go-live](#phase-6-pilot-go-live-about-weeks-810)
11. [Phase 7: Rollout](#phase-7-rollout-36-months-depending-on-team-size)
12. [Phase 8: Handover and governance](#phase-8-handover-and-governance)
13. [Clean-up before the POC code goes into GitLab](#clean-up-before-the-poc-code-goes-into-gitlab)
14. [Risks](#risks)
15. [References](#references)

Durations are rough estimates; the real timeline depends on team size and how complex the integrations turn out to be.

---

## The site today

Sized from the site's own sitemaps (`/Sitemaps/sitemap-index.xml`) on 20 October 2026.

**About 9,100 pages across 17 country/language sites:**

| Site | Pages | Site | Pages |
|---|---|---|---|
| Australia | 1,858 | Japan | 462 |
| US | 1,461 | Canada (French) | 385 |
| UK | 1,241 | Korea | 377 |
| Canada (English) | 1,145 | Ireland | 90 |
| New Zealand | 1,074 | Netherlands | 89 |
| China | 588 | Middle East | 84 |
| Nordics | 73 | France | 63 |
| Italy | 63 | Germany | 58 |
| India | 20 | **Total** | **9,131** |

**The US site is 85% blog posts:**

| US section | Pages |
|---|---|
| Blog | 1,234 |
| Insights | 136 |
| Fund center | 60 |
| Resources | 12 |
| ETF center | 8 |
| Solutions | 7 |
| Home, member portal, RSS and other pages | 4 |

A handful of templates cover most of the site, which makes template-based migration efficient.

**Public URLs are short** (`/us/blog/...`), while the AEM paths are long (`/content/ri/us/en/...`). Keeping the public URLs exactly as they are is essential for SEO.

---

## The two constraints

### GitLab instead of GitHub

Edge Delivery supports GitLab, both cloud and self-hosted, through Cloud Manager's **Bring your own Git**. Cloud Manager sits between GitLab and Edge Delivery: a GitLab webhook notifies Cloud Manager of each push, and Cloud Manager syncs the code to Edge Delivery.

- Production must use the `main` branch, so caching and automatic cache clearing work.
- **The Edge Delivery organisation name must also exist as an organisation on github.com, owned by Russell** (for example `russellinvestments`). This only reserves the name so nobody else can use it; no code goes there.

### MSM in AEM as a Cloud Service

MSM is supported with AEM authoring. Your language masters and country live copies stay in AEM, with blueprints, live copies, rollouts, language copies and the translation workflow. Each country becomes its own Edge Delivery site, and all of them share one GitLab codebase through the **repoless** feature.

---

## Target architecture

```
                    GitLab (Russell)
                         │ webhook
                         ▼
                   Cloud Manager ── code sync ──►  Edge Delivery Services
                                                     (one codebase, 17+ sites)
                                                            ▲
AEM author (AEMaaCS)                                        │ publish
  /content/<eds-site>/language-masters/en  ── rollout ──►  /content/<eds-site>/us/en
                                           ── rollout ──►  /content/<eds-site>/uk/en-gb
                                           ── rollout ──►  ... (17 country sites)
                                                            │
                                                            ▼
                     Adobe-managed CDN (russellinvestments.com)
                       originSelectors: migrated paths → Edge Delivery
                                        everything else → AEM publish
```

---

## Phase 0: Approval and decisions (2 weeks)

- [ ] Present the POC business case and get sign-off for a pilot.
- [ ] Confirm the Edge Delivery entitlement on the AEM Sites licence with the Adobe account team.
- [ ] **Decide how existing content will move.** Current pages use Russell's own AEM components, which Edge Delivery can't render. They have to be recreated as Edge Delivery pages in a new site tree that mirrors the current MSM structure.

| Option | How it works | Pros | Cons |
|---|---|---|---|
| A. Import into the language masters, then roll out | Import scripts read the live pages and create Edge Delivery pages in the masters; rollouts create the countries (this is how the POC worked) | Fast; clean MSM structure; repeatable | Local country overrides and translations have to be re-imported or re-applied |
| B. Convert pages inside AEM with scripts | Scripts transform existing component trees into Edge Delivery blocks in place | Keeps live-copy relationships and local overrides | More engineering; every legacy component needs a mapping |

**Recommendation:** a mix. Use option A for the masters and lightly localised countries, and handle countries with heavy local overrides separately (import each country's own pages, then re-attach the live-copy relationships where needed).

- [ ] Name the new site tree, for example `/content/ri-eds/...`, alongside the current `/content/ri/...`.
- [ ] Agree the team, owners and a content-freeze policy.

---

## Phase 1: Foundation (2–3 weeks)

1. [ ] **Reserve the github.com organisation name** (for example `russellinvestments`). It must be owned by Russell.
2. [ ] **Create the Russell GitLab repo** and move the POC code into it, cleaned up (see [Clean-up](#clean-up-before-the-poc-code-goes-into-gitlab)).
3. [ ] **Connect GitLab to Edge Delivery through Cloud Manager:**
   - Add GitLab as an external repository in Cloud Manager and confirm ownership.
   - Add the webhook in GitLab, using the details Cloud Manager provides, a Cloud Manager API key and a webhook secret.
   - For self-hosted GitLab behind a firewall, request Cloud Manager's IP list at `cloudmanager_byog@adobe.com`.
   - Onboard the Edge Delivery site in Cloud Manager and choose **Bring your own Git**. Store the secret Cloud Manager shows; it isn't shown again.
   - Set the code source through the Admin API (`POST /config/<org>/sites/<site>/code.json` with `"type": "byogit"`).
   - Store the `cm-byog` secret through the Admin API.
   - Run the first **Sync Code** from Cloud Manager and check `https://main--<site>--<org>.aem.page`.
4. [ ] **Set up the Configuration Service:** create the Edge Delivery organisation, add admin users and turn on repoless.
5. [ ] **Map environments:** connect AEM dev, stage and prod to separate Edge Delivery sites ([repoless environments](https://www.aem.live/developer/repoless-environments)).
6. [ ] **Set up AEM author:**
   - Create the Edge Delivery site from the Universal Editor site template.
   - Add the Edge Delivery cloud configurations.
   - Give AEM's technical account the **Config Admin** role on each Edge Delivery site, so publishing works.
7. [ ] **Set up GitLab CI:**
   - Run `npm run lint` on every merge request.
   - Run a Lighthouse check against the branch preview on every merge request, with a performance budget.
   - Confirm that feature-branch previews (`https://<branch>--<site>--<org>.aem.page`) sync with the webhook setup.

**Done when:** a push to `main` in GitLab is live on the Edge Delivery preview in seconds, and a page in AEM author opens in Universal Editor and publishes.

---

## Phase 2: Site structure and MSM (2 weeks)

- [ ] Build the new site tree with the same shape as today: language masters, then 17 country/language live copies.
- [ ] For each country site:
  - [ ] an AEM configuration (Tools → General → Configuration Browser)
  - [ ] an Edge Delivery cloud configuration pointing at its Edge Delivery site
  - [ ] an Edge Delivery site in the Configuration Service, sharing the codebase (repoless)
  - [ ] a path mapping so URLs stay identical (`/content/<eds-site>/us/en/blog/x` → `/us/blog/x`)
  - [ ] its own nav and footer pages (the header and footer code already loads them from the site root)
- [ ] Use a shared **profile** for settings common to all sites: headers, indexes and metadata.
- [ ] Roll out the master to one test country and confirm preview, publish and inheritance in Universal Editor.

**Done when:** a change in the English master rolls out to a country live copy and publishes to that country's Edge Delivery site under its correct public URL.

---

## Phase 3: Templates and blocks (4–8 weeks, overlaps with Phase 4)

- [ ] Run a site catalog over all 17 sitemaps to group the pages into templates and list every component.
- [ ] Reuse the POC's 20 blocks plus the header and footer.
- [ ] Build the rest:

| Area | Notes |
|---|---|
| Blog/article template | **Highest priority:** covers most pages in every country |
| Blog listing and search | Built from a query index (`helix-query.yaml`), with filters by category and tag |
| Fund center | Data-driven; fed by Russell's fund data APIs |
| ETF center | Builds on the POC ETF page |
| RSS feeds | Generated from the query index |
| Forms | AEM Forms on Edge Delivery |
| Member portal and gated content | Needs an authentication design |

- [ ] Build to Russell's design system: self-hosted fonts and design tokens in `styles/styles.css`.
- [ ] Check each template against the live site for visual match, accessibility (WCAG 2.1 AA) and Lighthouse.

---

## Phase 4: Integrations (in parallel)

| Integration | Approach |
|---|---|
| Analytics, tag manager and consent | Load in Edge Delivery's **delayed** phase (`scripts/delayed.js`) so pages stay fast |
| Target and personalisation | Use the Edge Delivery experimentation plugin, or Target through the Web SDK |
| Fund data, prices and performance | Fetch from existing APIs or indexes, with caching |
| Forms | AEM Forms on Edge Delivery |
| Site search | Query index, or the current search service through an API |
| Ceros interactives and video | Load lazily, only when scrolled into view |

- [ ] **Re-measure Lighthouse after each integration** so the scores hold.

---

## Phase 5: Content migration (per template, then per country)

- [ ] Write an import script per template, as in the POC, and import into the language masters.
- [ ] Move images into AEM Assets instead of linking to the live site.
- [ ] Roll out to the countries, then handle translated and locally changed pages, following the Phase 0 decision.
- [ ] **Rewrite internal links** from `/content/ri/...` to the public URLs.
- [ ] Keep a **redirects** sheet for any URL that changes.
- [ ] Validate each page visually against the live site; fix import scripts and re-import rather than hand-editing.
- [ ] Agree a content-freeze window per country, or run a delta import of pages changed during the migration.

---

## Phase 6: Pilot go-live (about weeks 8–10)

- [ ] **Start with the US blog: 1,234 pages, one template, high SEO value.**
- [ ] Add an `originSelectors` rule to the Adobe-managed CDN configuration (run through a Cloud Manager configuration pipeline):
  - `/us/blog/*` → Edge Delivery (`main--<site>--<org>.aem.live`)
  - everything else → AEM publish, as today
- [ ] Set up automatic cache clearing on publish for the production domain.
- [ ] Check the sitemap, canonical URLs and `robots.txt` for the migrated section.
- [ ] Monitor for 4–6 weeks:
  - Core Web Vitals from real visitors (Chrome UX Report and Edge Delivery's built-in monitoring)
  - search rankings and organic traffic
  - conversions and engagement against the AEM-served sections
- [ ] **Rollback plan:** remove the CDN rule and the section is served by AEM publish again.

---

## Phase 7: Rollout (3–6 months, depending on team size)

1. [ ] US, section by section: insights, ETF center, fund center, home.
2. [ ] Countries, largest first: Australia, UK, Canada (English and French), New Zealand.
3. [ ] Then China, Japan, Korea and the smaller European, Middle East and India sites.
4. [ ] Once a site has fully moved, send its domain straight to Edge Delivery and stop rendering those pages on AEM publish. Authoring stays in AEM.

---

## Phase 8: Handover and governance

- [ ] Train authors on Universal Editor: editing, MSM rollouts, publishing and live-copy inheritance.
- [ ] Write a developer guide (blocks, code conventions, GitLab flow) and an admin runbook (Configuration Service, Cloud Manager sync, cache, permissions).
- [ ] Keep a performance budget in GitLab CI, so no merge request ships a Lighthouse regression.
- [ ] Monitor SEO on an ongoing basis: sitemaps, redirects, canonical URLs and broken links.

---

## Clean-up before the POC code goes into GitLab

- [ ] **Restore the site-wide features** the demo code switched off in `scripts/scripts.js`: page templates, breadcrumb, SEO and structured data, translations, experiments and login gating. Their files are still in `scripts/`.
- [ ] **Remove leftovers:**
  - starter-project blocks from WKND: `editorial-index`, `faq-list`, `featured-article`, `gallery`, `team-profile`, `ticker`
  - the WKND import transformers: `tools/importer/transformers/wknd-*.js`, plus the WKND parsers that no Russell template uses
  - the `hello-world` and `hello-world-with-child` blocks
  - any earlier blog blocks that aren't needed: `blog-banner`, `blog-card`, `blog-feature`, `blog-listing`, `related-blogs`
- [ ] **Point `fstab.yaml` at Russell's AEM author** and remove personal account details everywhere, including `.migration/project.json`.
- [ ] **Self-host the Compatil Fact font** (check the font licence). It's currently blocked when loaded from russellinvestments.com.
- [ ] **Move images into the DAM** instead of linking to russellinvestments.com.
- [ ] **Fix the article-card tabs block** (`tabs-article-cards`), which has more fields than Universal Editor recommends (lint rule `xwalk/max-cells`).
- [ ] Run `npm run lint` with no errors before the first push to GitLab.

---

## Risks

| Risk | Mitigation |
|---|---|
| Losing SEO through URL changes | Keep paths identical through path mapping, plus a redirects sheet and sitemap checks |
| Integrations slowing pages down | Load them in the delayed phase, with a Lighthouse budget on every merge request |
| Losing local overrides in MSM | Settle the content-migration approach in Phase 0, and test on one country first |
| Fund data and gated content | Design them early in the pilot; they're the most complex templates |
| Self-hosted GitLab behind a firewall | Request Cloud Manager's IP list early; test the webhook in Phase 1 |
| Authors adjusting to Universal Editor | Train authors during the pilot; nothing changes in the AEM Sites console or MSM |
| Content changing during migration | Content-freeze windows per country, or delta imports |

---

## References

- [Bring your own Git (GitLab via Cloud Manager)](https://www.aem.live/developer/byo-git)
- [Multi site management with AEM authoring](https://www.aem.live/developer/repoless-multisite-manager)
- [Repoless: one codebase, many sites](https://www.aem.live/docs/repoless)
- [Reusing code across sites with AEM authoring](https://www.aem.live/developer/repoless-authoring)
- [Repoless stage and prod environments](https://www.aem.live/developer/repoless-environments)
- [Adobe-managed CDN and proxying from AEM Cloud Service](https://www.aem.live/docs/byo-cdn-adobe-managed)
- [Keeping it 100 (performance)](https://www.aem.live/developer/keeping-it-100)
