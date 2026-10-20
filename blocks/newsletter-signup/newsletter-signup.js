import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Newsletter sign-up panel (visual only, no submission backend).
 * Authored rows (in order): heading, email placeholder, subscription options
 * (list, one label per item; first is selected by default), button label.
 * @param {Element} block The block element
 */

const DEFAULTS = {
  heading: 'There’s a lot going on. We’ll help you keep up.',
  placeholder: 'Your email',
  options: ['All research & insights', 'For financial advisors', 'For institutional investors'],
  button: 'Subscribe now',
};

const STATUS_MESSAGE = 'Thanks — subscriptions are not active in this preview.';

let instance = 0;

function readContent(block) {
  const rows = [...block.children];
  const optionsRow = rows.find((row) => row.querySelector('li'));
  const textRows = rows.filter((row) => row !== optionsRow);
  const text = (row) => (row ? row.textContent.trim() : '');

  let options = optionsRow
    ? [...optionsRow.querySelectorAll('li')].map((li) => li.textContent.trim())
    : [];
  // Fallback: options authored as separate paragraphs in the third row
  if (!optionsRow && textRows.length >= 4) {
    const [row] = textRows.splice(2, 1);
    options = [...row.querySelectorAll('p')].map((p) => p.textContent.trim());
    if (!options.length) options = [text(row)];
  }

  return {
    headingRow: textRows[0],
    buttonRow: textRows[2],
    heading: text(textRows[0]) || DEFAULTS.heading,
    placeholder: text(textRows[1]) || DEFAULTS.placeholder,
    button: text(textRows[2]) || DEFAULTS.button,
    options: options.filter(Boolean).length ? options.filter(Boolean) : DEFAULTS.options,
  };
}

/**
 * Universal Editor: moves a text field's instrumentation (on its row, cell or paragraph)
 * to the generated element that displays the text. The placeholder and options fields
 * render as form controls, which cannot be edited in place: they stay editable in the
 * properties panel of the block.
 * @param {Element} row
 * @param {Element} target
 */
function moveFieldInstrumentation(row, target) {
  if (!row) return;
  [row, ...row.querySelectorAll('*')].forEach((el) => moveInstrumentation(el, target));
}

export default function decorate(block) {
  instance += 1;
  const uid = `newsletter-signup-${instance}`;
  const content = readContent(block);

  const heading = document.createElement('h2');
  heading.className = 'newsletter-signup-heading';
  heading.id = `${uid}-heading`;
  heading.textContent = content.heading;
  moveFieldInstrumentation(content.headingRow, heading);

  const form = document.createElement('form');
  form.className = 'newsletter-signup-form';
  form.setAttribute('aria-labelledby', heading.id);

  // email
  const field = document.createElement('div');
  field.className = 'newsletter-signup-field';
  const label = document.createElement('label');
  label.className = 'newsletter-signup-sr-only';
  label.htmlFor = `${uid}-email`;
  label.textContent = 'Email address';
  const input = document.createElement('input');
  input.className = 'newsletter-signup-input';
  input.type = 'email';
  input.id = `${uid}-email`;
  input.name = 'email';
  input.required = true;
  input.autocomplete = 'email';
  input.placeholder = content.placeholder;
  field.append(label, input);

  // subscription options
  const fieldset = document.createElement('fieldset');
  fieldset.className = 'newsletter-signup-options';
  const legend = document.createElement('legend');
  legend.className = 'newsletter-signup-sr-only';
  legend.textContent = 'Subscription';
  fieldset.append(legend);
  content.options.forEach((option, i) => {
    const optionLabel = document.createElement('label');
    optionLabel.className = 'newsletter-signup-option';
    const radio = document.createElement('input');
    radio.className = 'newsletter-signup-radio';
    radio.type = 'radio';
    radio.name = `${uid}-subscription`;
    radio.value = option;
    radio.checked = i === 0;
    const span = document.createElement('span');
    span.textContent = option;
    optionLabel.append(radio, span);
    fieldset.append(optionLabel);
  });

  const button = document.createElement('button');
  button.className = 'newsletter-signup-button';
  button.type = 'submit';
  button.textContent = content.button;
  moveFieldInstrumentation(content.buttonRow, button);

  const status = document.createElement('p');
  status.className = 'newsletter-signup-status';
  status.setAttribute('role', 'status');

  form.append(field, fieldset, button, status);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    status.textContent = STATUS_MESSAGE;
  });
  input.addEventListener('input', () => { status.textContent = ''; });

  block.replaceChildren(heading, form);
}
