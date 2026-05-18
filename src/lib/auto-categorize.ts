// Domain-based auto-categorization
const DOMAIN_CATEGORIES: Record<string, string> = {
  'github.com': 'dev-tools',
  'gitlab.com': 'dev-tools',
  'stackoverflow.com': 'dev-tools',
  'developer.mozilla.org': 'dev-tools',
  'docs.npmjs.com': 'dev-tools',
  'vercel.com': 'dev-tools',
  'netlify.com': 'dev-tools',
  'figma.com': 'design',
  'dribbble.com': 'design',
  'behance.net': 'design',
  'canva.com': 'design',
  'youtube.com': 'entertainment',
  'netflix.com': 'entertainment',
  'spotify.com': 'entertainment',
  'twitter.com': 'social',
  'x.com': 'social',
  'linkedin.com': 'social',
  'facebook.com': 'social',
  'instagram.com': 'social',
  'reddit.com': 'social',
  'news.ycombinator.com': 'news',
  'medium.com': 'news',
  'substack.com': 'news',
  'techcrunch.com': 'news',
  'producthunt.com': 'productivity',
  'notion.so': 'productivity',
  'obsidian.md': 'productivity',
  'coursera.org': 'learning',
  'udemy.com': 'learning',
  'khanacademy.org': 'learning',
  'amazon.com': 'shopping',
  'ebay.com': 'shopping',
  'etsy.com': 'shopping',
  'robinhood.com': 'finance',
  'coinbase.com': 'finance',
  'investopedia.com': 'finance',
};

// Keyword-based categorization rules
const KEYWORD_CATEGORIES: { keywords: string[]; category: string }[] = [
  { keywords: ['tutorial', 'course', 'learn', 'lesson', 'education', 'academy'], category: 'learning' },
  { keywords: ['tool', 'library', 'framework', 'api', 'sdk', 'github', 'npm', 'package'], category: 'dev-tools' },
  { keywords: ['design', 'ui', 'ux', 'template', 'mockup', 'prototype', 'figma'], category: 'design' },
  { keywords: ['news', 'article', 'blog', 'post', 'update', 'report'], category: 'news' },
  { keywords: ['productivity', 'workflow', 'automation', 'task', 'management'], category: 'productivity' },
  { keywords: ['finance', 'money', 'invest', 'stock', 'crypto', 'budget'], category: 'finance' },
  { keywords: ['shopping', 'buy', 'price', 'deal', 'discount', 'product'], category: 'shopping' },
  { keywords: ['game', 'gaming', 'play', 'entertainment', 'movie', 'music', 'video'], category: 'entertainment' },
  { keywords: ['social', 'community', 'forum', 'chat', 'connect'], category: 'social' },
];

export function autoCategorize(url: string, title: string = '', description: string = ''): {
  category: string;
  confidence: number;
} {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');

    // 1. Check domain mapping (highest confidence)
    if (DOMAIN_CATEGORIES[domain]) {
      return { category: DOMAIN_CATEGORIES[domain], confidence: 0.9 };
    }

    // Check parent domain
    const parts = domain.split('.');
    if (parts.length >= 2) {
      const parentDomain = parts.slice(-2).join('.');
      if (DOMAIN_CATEGORIES[parentDomain]) {
        return { category: DOMAIN_CATEGORIES[parentDomain], confidence: 0.85 };
      }
    }

    // 2. Check keyword matching
    const text = `${title} ${description}`.toLowerCase();
    const scores: Record<string, number> = {};

    for (const rule of KEYWORD_CATEGORIES) {
      for (const keyword of rule.keywords) {
        if (text.includes(keyword.toLowerCase())) {
          scores[rule.category] = (scores[rule.category] || 0) + 1;
        }
      }
    }

    const sortedCategories = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0 && sortedCategories[0][1] >= 1) {
      return { category: sortedCategories[0][0], confidence: 0.6 };
    }

    // 3. Default
    return { category: 'uncategorized', confidence: 0 };
  } catch {
    return { category: 'uncategorized', confidence: 0 };
  }
}

export function suggestTags(url: string, title: string = '', description: string = ''): string[] {
  const tags: string[] = [];
  const text = `${url} ${title} ${description}`.toLowerCase();

  // Domain-based tags
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    if (domain.includes('github')) tags.push('github');
    if (domain.includes('youtube')) tags.push('video');
    if (domain.includes('medium')) tags.push('article');
    if (domain.includes('docs.')) tags.push('documentation');
  } catch { /* ignore */ }

  // Content-based tags
  const keywordTags: Record<string, string[]> = {
    'javascript': ['javascript', 'js'],
    'react': ['react', 'frontend'],
    'python': ['python', 'programming'],
    'css': ['css', 'styling'],
    'docker': ['docker', 'devops'],
    'ai': ['ai', 'machine-learning'],
    'tutorial': ['tutorial', 'learning'],
    'open source': ['open-source'],
    'free': ['free'],
    'github': ['github'],
  };

  for (const [keyword, tagList] of Object.entries(keywordTags)) {
    if (text.includes(keyword.toLowerCase())) {
      tags.push(...tagList);
    }
  }

  return [...new Set(tags)].slice(0, 5); // Max 5 unique tags
}
