import { expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { listing, storeArtifacts, validateListing } from '../scripts/store-metadata.mjs';
import { canonicalUrl, decorateHtml, discoveryFiles } from '../scripts/web-discovery.mjs';
import levels from '../src/data/levels.json';
import { species, chapters } from '../src/data/botany';

it('prepares store texts within the platform limits and keeps generated imports current', () => {
  expect(() => validateListing(listing)).not.toThrow();
  for (const [file, text] of storeArtifacts(listing)) expect(readFileSync(file, 'utf8')).toBe(text);
});

it('rejects overflowing fields and counts commas and French accents in Apple keywords', () => {
  for (const [field, limit] of [
    ['name', 30],
    ['googleTitle', 30],
    ['subtitle', 30],
    ['shortDescription', 80],
    ['description', 4000],
    ['promotionalText', 170],
  ] as const) {
    expect(() => validateListing({ ...listing, [field]: 'a'.repeat(limit + 1) })).toThrow(field);
  }
  expect(() => validateListing({ ...listing, keywords: ['é'.repeat(50), 'a'] })).toThrow(
    '100 octets',
  );
  expect(() => validateListing({ ...listing, keywords: ['Nature', 'nature'] })).toThrow('doublons');
  expect(() => validateListing({ ...listing, keywords: ['plantes,fleurs'] })).toThrow('virgule');
});

it('advertises the campaign actually shipped, without the unfinished daily or mystery modes', () => {
  const text = listing.description;
  expect(text).toContain(
    `${levels.length.toLocaleString('fr-FR').replaceAll('\u202f', ' ')} puzzles`,
  );
  expect(text).toContain(`${species.length} espèces`);
  expect(text).toContain(`${chapters.length} écosystèmes`);
  expect(text).not.toMatch(/Feuillet du jour|Encres oubliées/);
});

it('sets French HTML metadata in single-page exports without removing the game bundle', () => {
  const original =
    '<html lang="en"><head><title>Old</title><meta name="description" content="Old"><link rel="canonical" href="https://old.test/"></head><body><div id="root"></div><script src="/game.js"></script></body></html>';
  const html = decorateHtml(original);
  expect(html).toContain('<html lang="fr">');
  expect(html).not.toContain('https://old.test/');
  expect(html.match(/<title>/g)).toHaveLength(1);
  expect(html.match(/name="description"/g)).toHaveLength(1);
  expect(html).toContain(listing.web.description);
  expect(html).toContain('<script src="/game.js"></script>');
  expect(decorateHtml(html)).toBe(html);
});

it('escapes metadata and JSON-LD without inventing ratings, prices or store links', () => {
  const html = decorateHtml('<html><head></head><body></body></html>', {
    content: {
      ...listing,
      web: { title: '<Title> "$&"', description: '</script><script>alert(1)</script>' },
    },
  });
  expect(html).toContain('&lt;Title&gt; &quot;$&amp;&quot;');
  expect(html).not.toContain('</script><script>alert(1)</script>');
  const structured = JSON.parse(html.match(/id="game-discovery"[^>]*>(.*?)<\/script>/)![1]);
  expect(structured.description).toBe('</script><script>alert(1)</script>');
  expect(structured).not.toHaveProperty('aggregateRating');
  expect(structured).not.toHaveProperty('offers');
  expect(structured).not.toHaveProperty('downloadUrl');
});

it('uses a configured HTTPS origin and the deployment prefix for canonical URLs', () => {
  expect(canonicalUrl('', '/Herbier-des-Couleurs')).toBeNull();
  expect(discoveryFiles('', '/Herbier-des-Couleurs').size).toBe(0);
  expect(canonicalUrl('https://jbdainty.github.io', '/Herbier-des-Couleurs/')).toBe(
    'https://jbdainty.github.io/Herbier-des-Couleurs/',
  );
  for (const origin of [
    'http://example.com',
    'https://example.com/path',
    'https://example.com/?test=1',
    'https://user:secret@example.com',
  ]) {
    expect(() => canonicalUrl(origin)).toThrow();
  }
});

it('keeps saved-game routes out of search while preserving their offline entry points', async () => {
  const root = mkdtempSync(join(tmpdir(), 'herbier-discovery-'));
  try {
    mkdirSync(join(root, 'dist'));
    writeFileSync(
      join(root, 'dist/index.html'),
      '<html lang="en"><head><title>Game</title></head><body><script src="/game.js"></script></body></html>',
    );
    writeFileSync(join(root, 'dist/game.js'), '/* game bundle */');
    writeFileSync(
      join(root, 'dist/manifest.json'),
      JSON.stringify({ name: listing.name, icons: [{ src: '/icon.svg' }] }),
    );
    await promisify(execFile)(process.execPath, [resolve('scripts/offline.mjs')], {
      cwd: root,
      env: {
        ...process.env,
        EXPO_PUBLIC_BASE_PATH: '/Herbier-des-Couleurs',
        EXPO_PUBLIC_SITE_ORIGIN: 'https://jbdainty.github.io',
      },
    });
    const home = readFileSync(join(root, 'dist/index.html'), 'utf8');
    expect(home).toContain('content="index,follow"');
    expect(home).toContain('href="https://jbdainty.github.io/Herbier-des-Couleurs/"');
    expect(home).toContain('<script src="/game.js"></script>');
    for (const route of [
      'atelier/index.html',
      'herbier/index.html',
      'parametres/index.html',
      '404.html',
    ]) {
      const html = readFileSync(join(root, 'dist', route), 'utf8');
      expect(html).toContain('content="noindex,follow"');
      expect(html.match(/name="description"/g)).toHaveLength(1);
    }
    const manifest = JSON.parse(readFileSync(join(root, 'dist/manifest.json'), 'utf8'));
    expect(manifest.lang).toBe('fr');
    expect(manifest.scope).toBe('/Herbier-des-Couleurs/');
    expect(manifest.icons[0].src).toBe('/Herbier-des-Couleurs/icon.svg');
    const sitemap = readFileSync(join(root, 'dist/sitemap.xml'), 'utf8');
    expect(sitemap).not.toMatch(/atelier|parametres|404/);
    expect(readFileSync(join(root, 'dist/robots.txt'), 'utf8')).toContain(
      'https://jbdainty.github.io/Herbier-des-Couleurs/sitemap.xml',
    );
    expect(readFileSync(join(root, 'dist/sw.js'), 'utf8')).toContain(
      '/Herbier-des-Couleurs/atelier/index.html',
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
