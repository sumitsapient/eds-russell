# callout-takeaways

Custom **callout-takeaways** block. Purpose: Highlighted callout inside an article body: key takeaways panel, chart panel, or a ruled closing section.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: row 1: rich text (heading, paragraphs, list; a fully bold paragraph is a label); row 2: optional image; row 3: optional note shown below the image. An image authored inside the text also works: content after it becomes the note..

## Supported variations

| Variation | Option class |
| --- | --- |
| Chart | `chart` |
| Rule | `rule` |

## Universal Editor fields

- `text` (richtext): heading, paragraphs, list. A paragraph fully in bold renders as a label (chart option).
- `image` + `imageAlt` (optional): e.g. a chart.
- `note` (richtext, optional): shown below the image, small print (e.g. disclaimer).
- `classes` select for options: Chart, Rule.
