# cards-links

Custom **cards** block. Purpose: Text-only cards, each with a title, description and CTA link.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row per card; single cell with title (heading), description paragraph and CTA link; the tile option adds an optional leading badge image and a short eyebrow paragraph (e.g. ticker) before the title, and only the last single-line link-only paragraph is the CTA.

## Supported variations

| Variation | Option class |
| --- | --- |
| Tile | `tile` |
| Arrow CTA | `cta-arrow` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` multiselect on the block (Tile, Arrow CTA); each item has one `text` richtext field.

## Behavior notes

- Default (no option): unchanged — orange rule under the title, last link-only paragraph becomes the arrow CTA.
- `tile`: filled #f3f3f3 tile (white inside `light-blue` sections), notched corner, no orange rule. A leading image becomes a small badge; short plain paragraphs before the title become the eyebrow (e.g. ticker). Only the LAST single-line link-only paragraph is the outlined pill CTA; other link-only lines (and links with line breaks, e.g. addresses) stay plain links even if EDS auto-decorated them as buttons.
- `tile` + `cta-arrow`: same tile, but the CTA renders as the tertiary text + arrow link (ETF fund tiles).
