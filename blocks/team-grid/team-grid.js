import {
  fetchContentFragments,
  extractCFItems,
  resolveCFImageUrl,
  renderFragmentList,
} from '../../scripts/content-fragments.js';
import { sampleRUM } from '../../scripts/aem.js';
/**
 * Team Grid Block
 *
 * Fetches Team Member Content Fragments via a GraphQL persisted query
 * and renders a responsive grid of profile cards.
 *
 * Required setup in AEM:
 *   1. Create a Content Fragment Model "Team Member" with fields:
 *        name (text), role (text), department (text), bio (multi-line),
 *        photo (content reference / image), linkedin (text), email (text)
 *   2. Create Content Fragments (instances) for each team member
 *   3. Create a GraphQL Persisted Query at:
 *        /conf/{project}/settings/graphql/persistentQueries/team-members
 *
 *   Sample persisted query body:
 *   {
 *     teamMemberList(
 *       filter: { department: { _expressions: [{ value: "DEPARTMENT" }] } }
 *     ) {
 *       items { name role department bio photo { _path _publishUrl } linkedin email }
 *     }
 *   }
 *
 * Authored structure:
 *   | team-grid         |                                 |
 *   | query             | /eds-russell/team-members       |  <- persisted query path
 *   | filter-department | Equities                        |  <- optional department filter
 *   | limit             | 12                              |  <- max cards
 *   | show-bio          | true                            |  <- show bio text
 *
 * Fallback behaviour:
 *   When the AEM endpoint is not configured or the CF query fails,
 *   the block renders sample data with a visible DEV warning.
 *   This lets front-end work proceed before CFs are authored in AEM.
 */
// Sample data — used when CF endpoint unavailable (dev / demo mode)
const SAMPLE_MEMBERS = [
  {
    name: 'Sarah Chen',
    role: 'Chief Investment Officer',
    department: 'Executive',
    bio: 'Sarah leads Russell Investments\' global investment strategy with 20+ years of experience across equity and multi-asset portfolios.',
    photo: null,
    linkedin: '',
    email: '',
  },
  {
    name: 'Marcus Williams',
    role: 'Head of Fixed Income',
    department: 'Fixed Income',
    bio: 'Marcus oversees the fixed income platform with expertise in credit, rates, and liability-driven investing.',
    photo: null,
    linkedin: '',
    email: '',
  },
  {
    name: 'Priya Kapoor',
    role: 'Senior Portfolio Manager',
    department: 'Equities',
    bio: 'Priya manages global equity mandates with a focus on emerging markets and ESG integration.',
    photo: null,
    linkedin: '',
    email: '',
  },
  {
    name: 'James Thornton',
    role: 'Director, Alternative Investments',
    department: 'Alternatives',
    bio: 'James leads the alternatives platform covering private equity, real assets, and hedge fund strategies.',
    photo: null,
    linkedin: '',
    email: '',
  },
  {
    name: 'Yuki Tanaka',
    role: 'Head of Asia Pacific',
    department: 'Regional',
    bio: 'Yuki drives Russell Investments\' strategy across APAC markets from Tokyo, with deep expertise in Japanese equities.',
    photo: null,
    linkedin: '',
    email: '',
  },
  {
    name: 'Elena Rodriguez',
    role: 'Chief Risk Officer',
    department: 'Risk',
    bio: 'Elena oversees enterprise risk management across all investment strategies and operational risk functions.',
    photo: null,
    linkedin: '',
    email: '',
  },
];
// ── PARSING ──────────────────────────────────────────────────────────────────
function parseConfig(block) {
  const config = {
    query: '/eds-russell/team-members',
    filterDepartment: '',
    limit: 12,
    showBio: true,
  };
  block.querySelectorAll(':scope > div').forEach((row) => {
    const [k, v] = [...row.querySelectorAll(':scope > div')];
    const key = k?.textContent.trim().toLowerCase().replace(/\s+/g, '-');
    const val = v?.textContent.trim();
    if (key === 'query') config.query = val || config.query;
    if (key === 'filter-department') config.filterDepartment = val;
    if (key === 'limit') config.limit = parseInt(val, 10) || config.limit;
    if (key === 'show-bio') config.showBio = val !== 'false';
  });
  return config;
}
// ── CARD BUILDER ─────────────────────────────────────────────────────────────
function renderCard(member, showBio) {
  const card = document.createElement('article');
  card.className = 'team-grid-card';
  // Photo
  const photoWrap = document.createElement('div');
  photoWrap.className = 'team-grid-photo';
  const imgUrl = resolveCFImageUrl(member.photo);
  if (imgUrl) {
    const img = document.createElement('img');
    img.src = imgUrl;
    img.alt = member.name || '';
    img.width = 160;
    img.height = 160;
    img.loading = 'lazy';
    photoWrap.append(img);
  } else {
    // Initials avatar fallback
    const initials = (member.name || '?')
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    const avatar = document.createElement('div');
    avatar.className = 'team-grid-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = initials;
    photoWrap.append(avatar);
  }
  // Info
  const info = document.createElement('div');
  info.className = 'team-grid-info';
  const name = document.createElement('h3');
  name.className = 'team-grid-name';
  name.textContent = member.name || '';
  const role = document.createElement('p');
  role.className = 'team-grid-role';
  role.textContent = member.role || '';
  if (member.department) {
    const dept = document.createElement('span');
    dept.className = 'team-grid-department';
    dept.textContent = member.department;
    info.append(dept);
  }
  info.append(name, role);
  if (showBio && member.bio) {
    const bio = document.createElement('p');
    bio.className = 'team-grid-bio';
    // bio may be rich text from CF — sanitise to text only
    bio.textContent = typeof member.bio === 'string'
      ? member.bio
      : member.bio?.plaintext || '';
    info.append(bio);
  }
  // Social links
  const links = document.createElement('div');
  links.className = 'team-grid-links';
  if (member.linkedin) {
    const li = document.createElement('a');
    li.href = member.linkedin;
    li.className = 'team-grid-link team-grid-link-linkedin';
    li.target = '_blank';
    li.rel = 'noopener noreferrer';
    li.setAttribute('aria-label', `${member.name} on LinkedIn`);
    li.textContent = 'LinkedIn';
    links.append(li);
  }
  if (member.email) {
    const em = document.createElement('a');
    em.href = `mailto:${member.email}`;
    em.className = 'team-grid-link team-grid-link-email';
    em.setAttribute('aria-label', `Email ${member.name}`);
    em.textContent = 'Email';
    links.append(em);
  }
  if (links.children.length) info.append(links);
  card.append(photoWrap, info);
  return card;
}
// ── BLOCK DECORATOR ───────────────────────────────────────────────────────────
export default async function decorate(block) {
  const config = parseConfig(block);
  block.textContent = '';
  const endpoint = document.querySelector('meta[name="aem-endpoint"]')?.content;
  let members = [];
  let usingSampleData = false;
  if (endpoint) {
    try {
      const variables = {};
      if (config.filterDepartment) variables.department = config.filterDepartment;
      const response = await fetchContentFragments(config.query, variables);
      members = extractCFItems(response);
      if (!members.length) {
        // eslint-disable-next-line no-console
        console.warn('[team-grid] Query returned 0 items. Check persisted query path:', config.query);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[team-grid] CF fetch failed, using sample data:', err.message);
      usingSampleData = true;
    }
  } else {
    // eslint-disable-next-line no-console
    console.info('[team-grid] No AEM endpoint configured. Using sample data.');
    usingSampleData = true;
  }
  if (usingSampleData || !members.length) {
    members = SAMPLE_MEMBERS;
    // Show dev warning banner — hidden in production
    const { hostname } = window.location;
    const isDev = hostname === 'localhost' || hostname.includes('.aem.page');
    if (isDev) {
      const banner = document.createElement('div');
      banner.className = 'team-grid-dev-banner';
      banner.innerHTML = '<strong>DEV MODE:</strong> Showing sample data. Configure Content Fragment Model "Team Member" in AEM to show real content.';
      block.append(banner);
    }
  }
  const limited = members.slice(0, config.limit);
  const grid = document.createElement('div');
  grid.className = 'team-grid-grid';
  grid.setAttribute('aria-label', 'Team members');
  renderFragmentList(limited, (m) => renderCard(m, config.showBio), grid);
  block.append(grid);
  // Track how many team members were viewed
  sampleRUM('viewblock', { source: 'team-grid', target: String(limited.length) });
}
