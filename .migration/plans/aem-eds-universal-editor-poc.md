# AEM Edge Delivery Services POC Plan (Universal Editor, Figma + live site)

## Goal
Build a proof of concept on AEM Edge Delivery Services for a client that already runs AEM as a Cloud Service. The POC covers the **homepage plus 1–2 key page types, with header and footer**. Authors edit in the **Universal Editor** inside their existing AEM author. The look and feel comes from your **Figma designs**, and the content comes from the **client's current site**. It should show three things: Lighthouse scores near 100, visual authoring in AEM, and close design match.

## Decisions made
| Topic | Decision |
|---|---|
| Authoring | Universal Editor (xwalk): authors stay in AEM Sites and publish to Edge Delivery |
| Source | Figma for design (tokens, components, layout); live site for real content |
| Scope | Homepage + 1–2 templates + header/footer |
| Figma add-on | Turn on at the start of execution (you agreed) |
| Site | `ecmentor/eds-demo` (created in AEM `dev`) |

## 🔧 Fix: "The technical account is missing the following permissions on ecmentor/eds-demo"

### What the error means
When you click **Quick Publish**, AEM doesn't publish as you. It uses its own **technical account** (a service user) to call Edge Delivery Services. Your site `ecmentor/eds-demo` exists in Edge Delivery, but that technical account hasn't been given permission on it yet. So Edge Delivery refuses to read, write, list or delete the site's pages, assets and configuration.

This is a standard, one-time setup step for every new Universal Editor site. **Your site and content are fine.**

### Step 1: Copy the AEM technical account ID
1. In the same AEM author (`dev`), go to **Tools → Cloud Services → Edge Delivery Services Configuration**.
2. Select the configuration for **eds-demo** and click **Properties**.
3. Open the **Authentication** tab and copy the **technical account ID**. It looks like `XXXXXXXXXXXXXXXX@techacct.adobe.com`.

### Step 2: Grant it access to the site
1. Open **https://tools.aem.live/tools/user-admin/index.html**.
2. Sign in, then select org **`ecmentor`** and site **`eds-demo`**.
3. Check that **your own email is listed as Admin**. If it isn't, the `ecmentor` org admin has to do this step.
4. Click to add a user, paste the technical account ID, and give it the **Config Admin** role.
5. Save, then wait **1–2 minutes** for the change to take effect.

### Step 3: Publish again
- Go back to AEM Sites, select **Index**, **Header (nav)** and **Footer**, then **Quick Publish**.
- Publish the header and footer too, or the published page will load without them.
- Check the page at `https://main--eds-demo--ecmentor.aem.page/` (preview) and `https://main--eds-demo--ecmentor.aem.live/` (live).

### If it still fails
| Symptom | Likely cause | Fix |
|---|---|---|
| Same error after 2+ minutes | Wrong ID, or it was added to a different site | Re-copy the ID from the **eds-demo** config and check that org/site in User Admin are `ecmentor` / `eds-demo` |
| You can't see or edit users in User Admin | You aren't an admin of the `ecmentor` org | Ask the org admin to add you (or the technical account) |
| "Not previewed" stays after publishing | Header/footer not published, or the cache hasn't refreshed | Publish `nav` and `footer`, then reload |
| Assets (the `.png` files in the error) fail | The same permission problem | Fixed by the same step; republish |

> 🔒 Don't paste any tokens or passwords into this chat. None are needed for this fix.

## Creating and connecting the POC repo
1. ✅ **The site exists in AEM** as `ecmentor/eds-demo`.
2. **Code repo:** make sure a GitHub repo exists for the site code, created from `adobe-rnd/aem-boilerplate-xwalk`, with the **AEM Code Sync** app installed. If your site uses Adobe's repoless/config-service setup, the code may come from the boilerplate until you connect your own repo.
3. **Connect it in the Console:**
   - **Settings → Credentials**: GitHub
   - **Settings → Project**: the repo
4. Before switching, save the WellCare results:
   - **⋯ → Download chat**
   - Copy `WELLCARE-BLOCK-INVENTORY.md` from the **Files** view

## Inputs needed before execution
- [ ] GitHub repo for `eds-demo`, connected in the Console
- [x] AEM author (`dev`) with the Edge Delivery site created
- [ ] Figma file link(s) for the homepage and the 1–2 chosen pages, plus access to them
- [ ] Live site URLs for the same pages (full URLs)

## Approach

### Phase 0: Unblock publishing
- Grant the AEM technical account the Config Admin role on `ecmentor/eds-demo`.
- Republish index, nav and footer, then check the `aem.page` / `aem.live` URLs.

### Phase 1: Project setup
- Turn on the Figma add-on.
- Record the project type as **Universal Editor (xwalk)**.
- Confirm that `fstab.yaml`/`paths.json` (or the site config) point at the `dev` author, and that the local preview works.

### Phase 2: Design foundation (from Figma)
- Extract design tokens (colors, typography, spacing, breakpoints, buttons) into `styles/styles.css`.
- Set up fonts in `styles/fonts.css` with performance-safe loading.
- Map Figma components to blocks, reusing boilerplate blocks wherever possible.

### Phase 3: Page analysis and block mapping
- Analyze the chosen live pages: sections, blocks and variants.
- Compare each page with its Figma frame.
- List the blocks with their Universal Editor models (fields, child items, filters).

### Phase 4: Block development
- Build or adapt blocks: JS, CSS from the Figma tokens, and Universal Editor models.
- Check that each block can be edited in the Universal Editor.

### Phase 5: Header and footer
- Migrate navigation and the footer as fragments.

### Phase 6: Content import
- Import the homepage and the 1–2 pages from the live site.
- Fix Markdown/JCR XML validation errors.
- Upload with **Sync → Content**.

### Phase 7: Visual QA and performance
- Compare against Figma and the live site in Desktop, Tablet and Mobile.
- Run Lighthouse on `aem.page`, aiming for 100.

### Phase 8: Demo package
- Prepare the demo story:
  - Before/after performance
  - Authoring in the Universal Editor
  - Publish speed
  - Design match to Figma
- Optional: a one-page PDF summary.

## Checklist
- [ ] **You:** AEM → **Tools → Cloud Services → Edge Delivery Services Configuration → eds-demo → Properties → Authentication**: copy the technical account ID
- [ ] **You:** open `tools.aem.live/tools/user-admin`, select `ecmentor` / `eds-demo`, and add the technical account with the **Config Admin** role
- [ ] **You:** wait 1–2 minutes, then **Quick Publish** Index, Header (nav) and Footer again
- [ ] **You:** check `main--eds-demo--ecmentor.aem.page` and `.aem.live`
- [ ] **You:** save the WellCare results (⋯ → **Download chat**; copy `WELLCARE-BLOCK-INVENTORY.md`)
- [ ] **You:** connect the `eds-demo` GitHub repo in **Settings → Credentials / Project**
- [ ] **You:** share the Figma links and live page URLs in a new **Plan** chat
- [ ] Turn on the Figma add-on (`excat-figma`)
- [ ] Record the project type as Universal Editor (xwalk) and check the author connection
- [ ] Extract design tokens and fonts from Figma into global styles
- [ ] Analyze the homepage and the 1–2 live pages (sections, blocks, variants)
- [ ] Map Figma components to blocks; list reused vs new
- [ ] Build/adapt blocks with Universal Editor models and filters
- [ ] Migrate the header/navigation and footer
- [ ] Generate import infrastructure and import the POC pages
- [ ] Fix Markdown/JCR XML validation errors; upload with **Sync → Content**
- [ ] **You:** check authoring in the Universal Editor and publish
- [ ] Visual check against Figma and the live site; fix differences
- [ ] Run Lighthouse/PageSpeed on the preview; fix issues to reach ~100
- [ ] **You:** save the code with **Sync → Code**
- [ ] Prepare the demo story and an optional one-page PDF summary

## Notes
- **The publishing fix is done entirely by you or your org admin** in AEM and tools.aem.live. Nothing in the code needs to change for it.
- **Admin access may be needed.** If you aren't an admin of the `ecmentor` org, your org admin has to add the technical account.
- **Optional add-on for the POC:** a project-management add-on can produce handover documents and PDFs. I can include turning it on in the plan if you'd like.
- **Execution requires Execute mode**, and it starts once the repo is connected and publishing works.
