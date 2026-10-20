# tabs-article-cards

Custom **tabs** block. Purpose: accessible tabs whose panels each show an eyebrow, a grid of article cards and an "All ..." link.

## Authoring

Model: `container` (Universal Editor: **Tabs Article Cards** with **Tabs Article Cards Item** children).

Author **one row (item) per article card**. Rows with the same **Tab Label** are grouped into one tab; tabs appear in the order their label first appears. Keep the shared section heading (e.g. "Access our best thinking on global markets and investor issues") as a normal heading *above* the block, not inside it.

| Cell | Field | Type | Notes |
| --- | --- | --- | --- |
| 1 | `tab` | text | Tab label, e.g. `Insights`, `Research`. Required. |
| 2 | `eyebrow` | text | Optional. Shown above the tab's cards (e.g. `RECENT INSIGHTS`). Set it on one card per tab; the first non-empty value in a tab wins. |
| 3 | `image` (+ `imageAlt`) | reference | Card image. |
| 4 | `text` | richtext | Optional date paragraph, H3 title (may be a link), optional H4 subtitle, description paragraph(s), CTA link paragraph. **No images.** |
| 5 | `authorImage` (+ `authorImageAlt`) | reference | Optional author photo. |
| 6 | `author` | richtext | Optional author name and role, one paragraph each. **No images.** |
| 7 | `footer` | richtext | Optional link shown below the tab's cards (e.g. `All Insights`). Set it on one card per tab; the first non-empty value in a tab wins. |

Example (document view):

| Tabs Article Cards |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- |
| Insights | RECENT INSIGHTS | (image) | ### Five Forces ... / #### Insights from ... / Description / [Learn more](...) | | | [All Insights](...) |
| Insights | | (image) | ### 2026 Mid-Year ... | | | |
| Research | RECENT RESEARCH | (image) | 2026-10-16 / ### [A tug of war ...](...) | (photo) | Paul Eitelman, CFA / Global Chief Investment Strategist | [All Research](...) |

Empty optional cells are fine. A row with only tab / eyebrow / footer and no card content adds those values to the tab without rendering a card.

## Behavior

- Tabs use `role="tablist"`, `role="tab"` and `role="tabpanel"`; Arrow Left/Right, Home and End move between tabs.
- Images may arrive as `<picture>` or as a bare `<img>` in a `<p>`; both are handled.

## Supported variations

No variations.
