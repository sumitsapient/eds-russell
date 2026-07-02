/**
 * Landing page template â€” loaded when page has template: landing
 * Hides the header and footer for full-focus campaign pages.
 * Adds a minimal brand bar at top with a CTA.
 */

/**
 * Hides the global header and footer on landing pages.
 * Landing pages are standalone â€” no navigation distractions.
 */
function hideChromeElements() {
  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  if (header) header.hidden = true;
  if (footer) footer.hidden = true;
}

/**
 * Adds a minimal top bar with just the brand name and a CTA button.
 * The CTA URL comes from the page's first button on the page,
 * OR falls back to the homepage.
 */
function addLandingBar() {
  const bar = document.createElement('div');
  bar.className = 'landing-bar';

  const brand = document.createElement('a');
  brand.href = '/';
  brand.className = 'landing-bar-brand';
  brand.textContent = document.title.split('|')[0].trim() || 'Enterprise Site';

  const cta = document.createElement('a');
  cta.className = 'landing-bar-cta button primary';
  // Use the first CTA button on the page, or link to contact
  const firstCta = document.querySelector('main .button');
  cta.href = firstCta?.href || '/contact';
  cta.textContent = firstCta?.textContent || 'Get Started';

  bar.append(brand, cta);
  document.body.prepend(bar);
}

hideChromeElements();
window.addEventListener('load', addLandingBar);
