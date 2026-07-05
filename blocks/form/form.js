import { sampleRUM } from '../../scripts/aem.js';
import { trackTargetConversion } from '../../scripts/personalization.js';

/**
 * Form Block
 *
 * Renders an accessible, validated, ACDL-tracked HTML form from
 * a table authored in Universal Editor.
 *
 * Authoring structure (each row = one form element):
 *
 *   CONFIG ROWS (key–value pairs):
 *   | action       | /api/contact      |  POST endpoint (required)
 *   | success-url  | /thank-you        |  redirect after success
 *   | method       | POST              |  default: POST
 *   | submit-label | Send Message      |  default: Submit
 *
 *   FIELD ROWS (label | field config | options/placeholder):
 *   | Full Name    | text, required    |                         |
 *   | Email        | email, required   | your@email.com          |
 *   | Phone        | tel               | +1 (555) 000-0000       |
 *   | Country      | select, required  | USA, UK, Singapore, Other |
 *   | Message      | textarea, required| How can we help you?    |
 *   | Subscribe    | checkbox          | Subscribe to newsletters |
 *
 * Field config format:  type[, required][, pattern:<regex>]
 * Column 3 = placeholder text (text/email/tel/textarea)
 *           = comma-separated options (select / radio)
 *           = checkbox label text (checkbox)
 */

const CONFIG_KEYS = new Set(['action', 'success-url', 'method', 'submit-label']);
const VALID_TYPES = new Set(['text', 'email', 'tel', 'number', 'url', 'select', 'textarea', 'checkbox', 'radio', 'hidden']);

// ── PARSING ──────────────────────────────────────────────────────────────────

function toId(label) {
  return `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function parseConfig(block) {
  const config = {
    action: '',
    'success-url': '',
    method: 'POST',
    'submit-label': 'Submit',
  };
  const fieldRows = [];

  block.querySelectorAll(':scope > div').forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    if (!cells.length) return;

    const col1 = cells[0]?.textContent.trim() || '';
    const col2 = cells[1]?.textContent.trim() || '';
    const col3 = cells[2]?.textContent.trim() || '';

    const key = col1.toLowerCase().replace(/\s+/g, '-');
    if (CONFIG_KEYS.has(key)) {
      config[key] = col2;
    } else {
      fieldRows.push({ label: col1, typeConfig: col2, extra: col3 });
    }
  });

  return { config, fieldRows };
}

function buildFieldDef({ label, typeConfig, extra }) {
  const parts = typeConfig.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const type = (VALID_TYPES.has(parts[0]) ? parts[0] : 'text');
  const required = parts.includes('required');

  // Pattern support: pattern:^[A-Za-z]+$
  const patternPart = parts.find((p) => p.startsWith('pattern:'));
  const pattern = patternPart ? patternPart.slice(8) : '';

  let options = [];
  let placeholder = '';

  if (type === 'select' || type === 'radio') {
    options = extra ? extra.split(',').map((s) => s.trim()).filter(Boolean) : [];
  } else if (type === 'checkbox') {
    placeholder = extra || label;
  } else {
    placeholder = extra;
  }

  return {
    id: toId(label),
    name: toId(label).replace('field-', ''),
    label,
    type,
    required,
    pattern,
    placeholder,
    options,
  };
}

// ── FIELD BUILDERS ────────────────────────────────────────────────────────────

function createLabel(fieldDef) {
  const lbl = document.createElement('label');
  lbl.htmlFor = fieldDef.id;
  lbl.textContent = fieldDef.label;
  if (fieldDef.required) {
    const req = document.createElement('span');
    req.className = 'form-required';
    req.setAttribute('aria-hidden', 'true');
    req.textContent = ' *';
    lbl.append(req);
  }
  return lbl;
}

function createErrorEl(fieldId) {
  const err = document.createElement('span');
  err.id = `${fieldId}-error`;
  err.className = 'form-error';
  err.setAttribute('role', 'alert');
  err.setAttribute('aria-live', 'polite');
  return err;
}

function buildTextField(fieldDef) {
  const wrap = document.createElement('div');
  wrap.className = 'form-field';

  const input = document.createElement('input');
  input.type = fieldDef.type;
  input.id = fieldDef.id;
  input.name = fieldDef.name;
  if (fieldDef.required) input.required = true;
  if (fieldDef.placeholder) input.placeholder = fieldDef.placeholder;
  if (fieldDef.pattern) input.pattern = fieldDef.pattern;
  input.setAttribute('aria-describedby', `${fieldDef.id}-error`);

  wrap.append(createLabel(fieldDef), input, createErrorEl(fieldDef.id));
  return wrap;
}

function buildTextareaField(fieldDef) {
  const wrap = document.createElement('div');
  wrap.className = 'form-field';

  const textarea = document.createElement('textarea');
  textarea.id = fieldDef.id;
  textarea.name = fieldDef.name;
  textarea.rows = 5;
  if (fieldDef.required) textarea.required = true;
  if (fieldDef.placeholder) textarea.placeholder = fieldDef.placeholder;
  textarea.setAttribute('aria-describedby', `${fieldDef.id}-error`);

  wrap.append(createLabel(fieldDef), textarea, createErrorEl(fieldDef.id));
  return wrap;
}

function buildSelectField(fieldDef) {
  const wrap = document.createElement('div');
  wrap.className = 'form-field';

  const select = document.createElement('select');
  select.id = fieldDef.id;
  select.name = fieldDef.name;
  if (fieldDef.required) select.required = true;
  select.setAttribute('aria-describedby', `${fieldDef.id}-error`);

  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = `Select ${fieldDef.label}...`;
  defaultOpt.disabled = true;
  defaultOpt.selected = true;
  select.append(defaultOpt);

  fieldDef.options.forEach((opt) => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    select.append(option);
  });

  wrap.append(createLabel(fieldDef), select, createErrorEl(fieldDef.id));
  return wrap;
}

function buildCheckboxField(fieldDef) {
  const wrap = document.createElement('div');
  wrap.className = 'form-field form-field-checkbox';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = fieldDef.id;
  input.name = fieldDef.name;
  input.value = '1';
  if (fieldDef.required) input.required = true;
  input.setAttribute('aria-describedby', `${fieldDef.id}-error`);

  const lbl = document.createElement('label');
  lbl.htmlFor = fieldDef.id;
  lbl.textContent = fieldDef.placeholder || fieldDef.label;

  wrap.append(input, lbl, createErrorEl(fieldDef.id));
  return wrap;
}

function buildRadioGroup(fieldDef) {
  const wrap = document.createElement('fieldset');
  wrap.className = 'form-field form-field-radio';

  const legend = document.createElement('legend');
  legend.textContent = fieldDef.label;
  if (fieldDef.required) {
    const req = document.createElement('span');
    req.className = 'form-required';
    req.setAttribute('aria-hidden', 'true');
    req.textContent = ' *';
    legend.append(req);
  }
  wrap.append(legend);

  fieldDef.options.forEach((opt, i) => {
    const radioWrap = document.createElement('div');
    radioWrap.className = 'form-radio-option';

    const input = document.createElement('input');
    input.type = 'radio';
    input.id = `${fieldDef.id}-${i}`;
    input.name = fieldDef.name;
    input.value = opt;
    if (fieldDef.required && i === 0) input.required = true;

    const lbl = document.createElement('label');
    lbl.htmlFor = input.id;
    lbl.textContent = opt;

    radioWrap.append(input, lbl);
    wrap.append(radioWrap);
  });

  wrap.append(createErrorEl(fieldDef.id));
  return wrap;
}

function buildField(fieldDef) {
  switch (fieldDef.type) {
    case 'textarea': return buildTextareaField(fieldDef);
    case 'select': return buildSelectField(fieldDef);
    case 'checkbox': return buildCheckboxField(fieldDef);
    case 'radio': return buildRadioGroup(fieldDef);
    default: return buildTextField(fieldDef);
  }
}

// ── VALIDATION ────────────────────────────────────────────────────────────────

function getValidationMessage(input) {
  if (!input.validity.valid) {
    if (input.validity.valueMissing) return `${input.labels?.[0]?.textContent.replace(' *', '') || 'This field'} is required.`;
    if (input.validity.typeMismatch) return `Please enter a valid ${input.type}.`;
    if (input.validity.patternMismatch) return 'Please match the required format.';
    if (input.validity.tooShort) return `Minimum ${input.minLength} characters required.`;
    if (input.validity.tooLong) return `Maximum ${input.maxLength} characters allowed.`;
    return input.validationMessage;
  }
  return '';
}

function showError(input, message) {
  const errEl = document.getElementById(`${input.id}-error`);
  if (!errEl) return;
  errEl.textContent = message;
  input.setAttribute('aria-invalid', 'true');
}

function clearError(input) {
  const errEl = document.getElementById(`${input.id}-error`);
  if (errEl) errEl.textContent = '';
  input.removeAttribute('aria-invalid');
}

function validateForm(form) {
  let valid = true;
  form.querySelectorAll('input, select, textarea').forEach((input) => {
    // skip honeypot
    if (input.name === 'form-bot-field') return;
    const msg = getValidationMessage(input);
    if (msg) {
      showError(input, msg);
      valid = false;
    } else {
      clearError(input);
    }
  });
  return valid;
}

// ── SUBMISSION ────────────────────────────────────────────────────────────────

async function submitForm(form, config) {
  const data = new FormData(form);

  // Honeypot check — bots fill the hidden field; humans don't
  if (data.get('form-bot-field')) return;

  const payload = Object.fromEntries(
    [...data.entries()].filter(([key]) => key !== 'form-bot-field'),
  );

  const res = await fetch(config.action, {
    method: config.method.toUpperCase(),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Server responded with ${res.status}`);
}

// ── BLOCK DECORATOR ───────────────────────────────────────────────────────────

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  const { config, fieldRows } = parseConfig(block);

  block.textContent = '';

  const form = document.createElement('form');
  form.className = 'form-el';
  form.noValidate = true; // use custom validation
  if (config.method) form.method = config.method;
  if (config.action) form.action = config.action;

  // Honeypot anti-spam field (hidden from humans, filled by bots)
  const honeypot = document.createElement('input');
  honeypot.type = 'text';
  honeypot.name = 'form-bot-field';
  honeypot.tabIndex = -1;
  honeypot.setAttribute('aria-hidden', 'true');
  honeypot.className = 'form-honeypot';
  form.append(honeypot);

  // Build and append all fields
  fieldRows
    .map(buildFieldDef)
    .forEach((fieldDef) => form.append(buildField(fieldDef)));

  // Inline validation on blur (show errors when user leaves a field)
  form.addEventListener('focusout', (e) => {
    const el = e.target;
    if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) return;
    if (el.name === 'form-bot-field') return;
    const msg = getValidationMessage(el);
    if (msg) showError(el, msg);
    else clearError(el);
  });

  // Submit button
  const actions = document.createElement('div');
  actions.className = 'form-actions';
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'button primary form-submit';
  submitBtn.textContent = config['submit-label'] || 'Submit';
  actions.append(submitBtn);
  form.append(actions);

  // Success message (hidden until form submits)
  const successMsg = document.createElement('div');
  successMsg.className = 'form-success';
  successMsg.setAttribute('role', 'status');
  successMsg.setAttribute('aria-live', 'polite');
  successMsg.hidden = true;
  successMsg.innerHTML = '<strong>Thank you!</strong> Your message has been sent successfully.';

  // Error message
  const submitError = document.createElement('div');
  submitError.className = 'form-submit-error';
  submitError.setAttribute('role', 'alert');
  submitError.hidden = true;
  submitError.textContent = 'Something went wrong. Please try again.';

  block.append(form, successMsg, submitError);

  // ── SUBMIT HANDLER ────────────────────────────────────────────────────────

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields before submit
    if (!validateForm(form)) {
      // Focus first invalid field for accessibility
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      firstInvalid?.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    submitError.hidden = true;

    const formName = config.action || window.location.pathname;

    try {
      if (config.action) {
        await submitForm(form, config);
      }

      // Track in ACDL + RUM + Target
      window.adobeDataLayer?.push({
        event: 'form submitted',
        form: { name: formName, fields: fieldRows.length },
      });
      sampleRUM('convert', { source: 'form', target: formName });
      trackTargetConversion('form-submit', { formName });

      // Show success
      form.hidden = true;
      successMsg.hidden = false;
      successMsg.focus();

      if (config['success-url']) {
        setTimeout(() => { window.location.href = config['success-url']; }, 2000);
      }
    } catch {
      submitError.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = config['submit-label'] || 'Submit';
      sampleRUM('error', { source: 'form', target: formName });
    }
  });
}
