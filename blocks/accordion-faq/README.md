# accordion-faq

Custom **accordion** block. Purpose: expandable FAQ list of question/answer rows.

## Authoring

Model: `container` (Universal Editor: **Accordion Faq** with **Accordion Faq Item** children).

Keep the FAQ heading as a normal heading *above* the block. Author **one row (item) per question**.

| Cell | Field | Type | Notes |
| --- | --- | --- | --- |
| 1 | `summary` | text | The question. Required; rows without a question are skipped. |
| 2 | `text` | richtext | The answer (paragraphs, lists, links). |

Example (document view):

| Accordion Faq |  |
| --- | --- |
| FAQ Title | Answer text goes here. |

## Behavior

- Built on native `<details>`/`<summary>`, so keyboard and screen reader support work out of the box. All items start closed.
- The blue plus icon rotates and turns into a minus when an item is open.

## Supported variations

No variations.
