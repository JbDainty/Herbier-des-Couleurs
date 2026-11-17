import { listing, validateListing } from './store-metadata.mjs';

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char],
  );

export function canonicalUrl(origin = '', basePath = '') {
  if (!origin) return null;
  const url = new URL(origin);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error(
      'EXPO_PUBLIC_SITE_ORIGIN doit être une origine HTTPS sans chemin, identifiants ni paramètres.',
    );
  if (basePath && !/^\/[A-Za-z0-9_/-]+$/.test(basePath))
    throw new Error('EXPO_PUBLIC_BASE_PATH doit être un chemin absolu sans point ni espace.');
  return url.origin + basePath.replace(/\/$/, '') + '/';
}

/** Expo's single-page export does not render +html.tsx; patch its actual HTML output. */
export function decorateHtml(
  html,
  { origin = '', basePath = '', index = true, content = listing } = {},
) {
  validateListing(content);
  const canonical = canonicalUrl(origin, basePath);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: content.name,
    description: content.web.description,
    inLanguage: 'fr',
    genre: ['Puzzle', 'Botanique'],
    playMode: 'https://schema.org/SinglePlayer',
    ...(canonical ? { url: canonical } : {}),
  };
  const tags = [
    `<title>${escapeHtml(content.web.title)}</title>`,
    `<meta name="description" content="${escapeHtml(content.web.description)}">`,
    `<meta name="robots" content="${index ? 'index,follow' : 'noindex,follow'}">`,
    `<meta property="og:title" content="${escapeHtml(content.web.title)}">`,
    `<meta property="og:description" content="${escapeHtml(content.web.description)}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:locale" content="fr_FR">',
    '<meta name="twitter:card" content="summary">',
    `<meta name="twitter:title" content="${escapeHtml(content.web.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(content.web.description)}">`,
    ...(canonical
      ? [
          `<link rel="canonical" href="${escapeHtml(canonical)}">`,
          `<meta property="og:url" content="${escapeHtml(canonical)}">`,
        ]
      : []),
    `<script id="game-discovery" type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`,
  ].join('\n');
  return html
    .replace(/<html\b[^>]*>/i, (tag) =>
      tag.replace(/\s+lang\s*=\s*(?:"[^"]*"|'[^']*')/i, '').replace(/>$/, ' lang="fr">'),
    )
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*>/gi, (tag) =>
      /(?:name|property)\s*=\s*["'](?:description|robots|og:[^"']*|twitter:[^"']*)["']/i.test(tag)
        ? ''
        : tag,
    )
    .replace(/<link\b[^>]*rel\s*=\s*["']canonical["'][^>]*>/gi, '')
    .replace(/<script\b[^>]*id=["']game-discovery["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\s*<\/head>/i, () => tags + '\n</head>');
}

export function discoveryFiles(origin = '', basePath = '') {
  const canonical = canonicalUrl(origin, basePath);
  if (!canonical) return new Map();
  return new Map([
    ['robots.txt', `User-agent: *\nAllow: /\nSitemap: ${canonical}sitemap.xml\n`],
    [
      'sitemap.xml',
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeHtml(canonical)}</loc></url></urlset>\n`,
    ],
  ]);
}
