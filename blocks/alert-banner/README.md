# alert-banner

Custom **alert-banner** block. Purpose: Dismissible full-width orange notice strip with icon, linked message and close button.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: one row: optional icon image, then the message paragraph (may be wholly or partly a link); the close button is not authored.

## Supported variations

No variations.

## Universal Editor fields

- Content fields derived from the block's decorate contract.

## Behavior notes

- Universal Editor fields: `icon` (reference) + `iconAlt`, `text` (richtext notice).
- The close button is generated (`aria-label="Close alert"`); after dismissal focus moves to `main` and the banner stays hidden for the rest of the browser session (sessionStorage, keyed by the message text, so an edited notice shows again). Dismissal is not persisted while editing in Universal Editor.
- Links in the notice always render as text links (never pill buttons).
