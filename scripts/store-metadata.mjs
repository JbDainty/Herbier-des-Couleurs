import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const listing = JSON.parse(readFileSync(join(root, 'store/listing.fr-FR.json'), 'utf8'));

/** Limits apply to the uploaded text, including commas in Apple's keyword field. */
export function validateListing(value) {
  const errors = [];
  for (const [field, limit] of [
    ['name', 30],
    ['googleTitle', 30],
    ['subtitle', 30],
    ['shortDescription', 80],
    ['description', 4000],
    ['promotionalText', 170],
  ]) {
    const text = value[field];
    if (typeof text !== 'string' || !text.trim() || text !== text.trim())
      errors.push(`${field}: texte non vide, sans espaces en début ou fin, requis`);
    else if (Array.from(text).length > limit) errors.push(`${field}: maximum ${limit} caractères`);
  }
  if (value.locale !== 'fr-FR') errors.push('locale: seule la fiche fr-FR est préparée');
  const keywords = value.keywords;
  if (
    !Array.isArray(keywords) ||
    !keywords.length ||
    keywords.some(
      (keyword) =>
        typeof keyword !== 'string' ||
        !keyword.trim() ||
        keyword !== keyword.trim() ||
        keyword.includes(','),
    )
  ) {
    errors.push('keywords: liste de termes non vides, sans virgule interne, requise');
  } else {
    const normalized = keywords.map((keyword) => keyword.normalize('NFC').toLocaleLowerCase('fr'));
    if (new Set(normalized).size !== normalized.length) errors.push('keywords: doublons interdits');
    // A conservative UTF-8 budget also stays below Apple's 100-character limit.
    if (Buffer.byteLength(keywords.join(','), 'utf8') > 100)
      errors.push('keywords: maximum 100 octets UTF-8, virgules comprises');
  }
  for (const field of ['title', 'description']) {
    if (typeof value.web?.[field] !== 'string' || !value.web[field].trim())
      errors.push(`web.${field}: texte requis`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
}

/** Files use fastlane deliver/supply conventions; Xiaomi's draft is for manual review. */
export function storeArtifacts(value) {
  validateListing(value);
  const apple = `store/apple/${value.locale}`;
  const google = `store/google-play/${value.locale}`;
  return new Map([
    [`${apple}/name.txt`, value.name + '\n'],
    [`${apple}/subtitle.txt`, value.subtitle + '\n'],
    [`${apple}/keywords.txt`, value.keywords.join(',') + '\n'],
    [`${apple}/description.txt`, value.description + '\n'],
    [`${apple}/promotional_text.txt`, value.promotionalText + '\n'],
    [`${google}/title.txt`, value.googleTitle + '\n'],
    [`${google}/short_description.txt`, value.shortDescription + '\n'],
    [`${google}/full_description.txt`, value.description + '\n'],
    [
      `store/xiaomi/${value.locale}/draft.json`,
      JSON.stringify(
        {
          status: 'draft',
          locale: value.locale,
          title: value.name,
          shortDescription: value.shortDescription,
          description: value.description,
        },
        null,
        2,
      ) + '\n',
    ],
  ]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  for (const [path, content] of storeArtifacts(listing)) {
    const file = join(root, path);
    if (check) {
      let current;
      try {
        current = readFileSync(file, 'utf8');
      } catch {
        /* Report missing generated files below. */
      }
      if (current !== content) throw new Error(`${path}: lancer npm run store:generate`);
    } else {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, content);
    }
  }
  console.log(
    check
      ? 'Fiches vérifiées : limites et fichiers générés cohérents.'
      : 'Fiches Apple, Google Play et brouillon Xiaomi générés.',
  );
}
