# cards-research

Custom **cards** block. Purpose: related research article cards with image, date, linked title and author byline.

## Authoring

Model: `container` (Universal Editor: **Cards Research** with **Cards Research Item** children).

Keep the section heading (e.g. "Related research") as a normal heading *above* the block. Author **one row (item) per card**.

| Cell | Field | Type | Notes |
| --- | --- | --- | --- |
| 1 | `image` (+ `imageAlt`) | reference | Card image (cropped to 2.2:1). |
| 2 | `text` | richtext | Date paragraph, then the title as an H3 linked to the article. **No images.** |
| 3 | `authorImage` (+ `authorImageAlt`) | reference | Optional author headshot (shown as a circle). |
| 4 | `author` | richtext | Optional author name and role, one paragraph each. **No images.** |

Example (document view):

| Cards Research |  |  |  |
| --- | --- | --- | --- |
| (image) | 2025-10-10 / ### [Macro Vitals Show Life Despite Dead Zone for Data](...) | (photo) | Paul Eitelman, CFA / Global Chief Investment Strategist |

## Behavior

- 1 column on mobile, 2 from 600px, 3 from 900px.
- The whole card is clickable through the title link.
- Images may arrive as `<picture>` or as a bare `<img>` in a `<p>`; both are handled.

## Supported variations

No variations.
