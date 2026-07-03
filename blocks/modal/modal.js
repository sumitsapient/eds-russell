/**
 * Modal block — accessible dialog overlay with focus trapping.
 *
 * Authored structure:
 * | Modal              |
 * | --- |
 * | Modal content (heading, text, buttons, etc.) |
 *
 * Trigger: any element on the page with `data-modal-id` matching the modal block's ID,
 * or a link with `#modal-{blockid}` as href.
 *
 * @param {Element} block The modal block element
 */
import { trapFocus } from '../../scripts/scripts.js';

export default function decorate(block) {
  const content = block.innerHTML;
  const modalId = block.dataset.id
    || block.closest('.section')?.getAttribute('data-id')
    || `modal-${Math.random().toString(36).slice(2, 8)}`;

  // Build modal structure
  const dialog = document.createElement('dialog');
  dialog.className = 'modal-dialog';
  dialog.id = modalId;
  dialog.setAttribute('aria-modal', 'true');

  const dialogInner = document.createElement('div');
  dialogInner.className = 'modal-inner';

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.setAttribute('aria-label', 'Close dialog');
  closeBtn.innerHTML = '<span aria-hidden="true">&times;</span>';

  const dialogContent = document.createElement('div');
  dialogContent.className = 'modal-content';
  dialogContent.innerHTML = content;

  dialogInner.append(closeBtn, dialogContent);
  dialog.append(dialogInner);

  // Close handlers
  let previousFocus = null;

  function openModal() {
    previousFocus = document.activeElement;
    dialog.showModal();
    trapFocus(dialog);
    closeBtn.focus();
  }

  function closeModal() {
    dialog.close();
    previousFocus?.focus();
  }

  closeBtn.addEventListener('click', closeModal);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeModal(); // click on backdrop
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Set up triggers — any link with href matching #modalId
  document.querySelectorAll(`a[href="#${modalId}"]`).forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  // Expose open/close on the block element for programmatic access
  block.dataset.modalId = modalId;
  block.openModal = openModal;
  block.closeModal = closeModal;

  block.textContent = '';
  block.append(dialog);
}
