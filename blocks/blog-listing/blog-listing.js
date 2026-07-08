/**
 * Blog Listing block
 * Renders a 3-column card grid.
 * Currently uses lorem ipsum placeholder data.
 * TODO: Replace with API/query-index fetch.
 * @param {Element} block
 */
const PLACEHOLDER_ARTICLES = [
  {
    category: 'Market Research',
    title: 'Lorem Ipsum: The Case for Active Small Caps',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    date: 'July 1, 2026',
    author: 'John Smith',
    color: '#1a3a6b',
  },
  {
    category: 'Investment Insights',
    title: 'Dolor Sit Amet: Private Markets in 2026',
    description: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    date: 'June 28, 2026',
    author: 'Sarah Chen',
    color: '#3b63fb',
  },
  {
    category: 'Fixed Income',
    title: 'Adipiscing Elit: Bond Yields and the Fed',
    description: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    date: 'June 24, 2026',
    author: 'Megan Roach',
    color: '#10b981',
  },
  {
    category: 'ESG',
    title: 'Consectetur: Sustainable Portfolios 2026',
    description: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    date: 'June 18, 2026',
    author: 'David Lee',
    color: '#f59e0b',
  },
  {
    category: 'Market Research',
    title: 'Incididunt Ut Labore: Equity Outlook',
    description: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
    date: 'June 12, 2026',
    author: 'Anna Walsh',
    color: '#ef4444',
  },
  {
    category: 'Multi-Asset',
    title: 'Nemo Enim Ipsam Voluptatem: Asset Allocation',
    description: 'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.',
    date: 'June 5, 2026',
    author: 'James Park',
    color: '#8b5cf6',
  },
];
export default function decorate(block) {
  const grid = document.createElement('div');
  grid.className = 'blog-listing-grid';
  PLACEHOLDER_ARTICLES.forEach((article) => {
    const card = document.createElement('article');
    card.className = 'blog-listing-card';
    // Placeholder image
    const imgWrap = document.createElement('div');
    imgWrap.className = 'blog-listing-card-image';
    imgWrap.style.background = article.color;
    const imgLabel = document.createElement('span');
    imgLabel.textContent = article.category;
    imgWrap.append(imgLabel);
    card.append(imgWrap);
    const content = document.createElement('div');
    content.className = 'blog-listing-card-content';
    // Category tag
    const cat = document.createElement('span');
    cat.className = 'blog-listing-card-category';
    cat.textContent = article.category;
    content.append(cat);
    // Title
    const title = document.createElement('h3');
    title.className = 'blog-listing-card-title';
    title.textContent = article.title;
    content.append(title);
    // Description
    const desc = document.createElement('p');
    desc.className = 'blog-listing-card-desc';
    desc.textContent = article.description;
    content.append(desc);
    // Footer: author + date
    const footer = document.createElement('div');
    footer.className = 'blog-listing-card-footer';
    const author = document.createElement('span');
    author.className = 'blog-listing-card-author';
    author.textContent = article.author;
    const date = document.createElement('span');
    date.className = 'blog-listing-card-date';
    date.textContent = article.date;
    footer.append(author, date);
    content.append(footer);
    card.append(content);
    grid.append(card);
  });
  block.replaceChildren(grid);
}
