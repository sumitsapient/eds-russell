# hero-image-overlay

Custom **hero** block. Purpose: Full-bleed background image or muted looping background video with overlaid H1, intro paragraph and optional CTA.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: row 1: background image (poster) and/or link to an .mp4 video (same row or its own row); last row: H1 title, paragraph, optional CTA link.

## Supported variations

| Variation | Option class |
| --- | --- |
| Article | `article` |

## Universal Editor fields

- Content fields derived from the block's decorate contract.
- `classes` select for options: Article.

## Background video

- Put a link to an `.mp4` file (or a `<video>`) in the background row, alongside the image or in its own row directly above the text row (Universal Editor: **Background Video** field).
- The video renders muted, autoplaying, looping and inline; the image becomes its poster.
- With `prefers-reduced-motion: reduce`, the image is shown and the video does not autoplay (without an image, the video renders paused).
- Without a video, the block behaves exactly as before (image background).

## Article option

- Select **Options: Article** (Universal Editor) or author `hero-image-overlay (article)`.
- Text field: optional pretitle paragraph (rendered uppercase) **before** the H1, the H1 title, an optional subtitle paragraph, and an optional CTA as a bold link (`<strong><a>`), which renders as a 42px blue pill.
- The background image gets a black-to-transparent left-to-right gradient so white copy stays legible.
- Without an image the hero falls back to the navy gradient (`no-image`) look with the same article layout.
- Video background works the same as the default hero.
