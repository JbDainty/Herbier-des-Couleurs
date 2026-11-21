import sharp from 'sharp';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Export sizes and Android's safe foreground area from one approved transparent drawing.
const source = 'art/branding/fiole-enchantee-source.png';
const destination = 'assets/branding';
const green = '#254f39';
await mkdir(destination, { recursive: true });
await mkdir('public/icons', { recursive: true });
const artwork = await sharp(source).trim().png().toBuffer();
async function fitted(size) {
  return sharp(artwork).resize(size, size, { fit: 'inside' }).png().toBuffer();
}
async function canvas(file, size, artSize, background) {
  const image = await fitted(artSize);
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: image, gravity: 'centre' }])
    .png()
    .toFile(file);
}
await canvas(`${destination}/app-icon.png`, 1024, 850, green);
await sharp(`${destination}/app-icon.png`)
  .flatten({ background: green })
  .removeAlpha()
  .png()
  .toFile(`${destination}/app-icon-opaque.png`);
await unlink(`${destination}/app-icon.png`);
await canvas(`${destination}/adaptive-foreground.png`, 1024, 600, { r: 0, g: 0, b: 0, alpha: 0 });
await canvas(`${destination}/splash-mark.png`, 512, 480, { r: 0, g: 0, b: 0, alpha: 0 });
for (const size of [64, 192, 512]) {
  await sharp(`${destination}/app-icon-opaque.png`)
    .resize(size, size)
    .png()
    .toFile(`public/icons/herbier-${size}.png`);
}
await writeFile(
  'art/branding/source.json',
  JSON.stringify(
    {
      source,
      sha256: createHash('sha256')
        .update(await readFile(source))
        .digest('hex'),
      choice: 'La fiole enchantée, version dessinée approuvée le 20 novembre 2026.',
      backgroundColor: green,
      preparation:
        'scripts/prepare-app-identity.mjs : formats natifs opaques, premier plan adaptatif dans sa zone sûre et pictogramme transparent de démarrage.',
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'App identity exported: opaque 1024px icon, adaptive foreground, splash mark and web icons.',
);
