# columns-overlay

Custom **columns** block. Purpose: White text panel overlapping a full-bleed background photo; stacked below the photo on mobile.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row, two cells (either order): image cell (background photo) and text cell (heading, lead paragraph, bold sub-heading + paragraph pairs or lists/links, CTA link as the last link-only paragraph).

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.

## Behavior notes

- Universal Editor: two `column` cells holding default components (image in one, text/title/button in the other).
- The paragraph right after the heading is the lead; bold-only paragraphs are sub-headings; the last link-only paragraph becomes an outlined pill CTA (an authored bold/italic button variant is kept).
- From 600px the photo fills the block and the panel overlaps it (10/12 wide, 7/12 from 900px); below 600px the panel stacks under the photo.
