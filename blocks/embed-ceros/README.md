# embed-ceros

Custom **embed** block. Purpose: Full-width, lazy-loaded Ceros interactive experience (iframe).

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, one cell: optional poster image, then a link to the Ceros experience URL.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.

## Behavior notes

- Accepts `*.ceros.site` (Ceros Studio, loaded via the Ceros embed SDK with auto height) and `view.ceros.com` / other `*.ceros.com` URLs (classic experiences, loaded as a fixed 1.842:1 iframe plus the Ceros scroll proxy).
- Both load lazily when the block nears the viewport.
