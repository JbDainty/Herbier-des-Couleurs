// Packaging only: original compositions are retained under art/home.
import { createRequire } from 'node:module';
import { stat } from 'node:fs/promises';
const sharp = createRequire(import.meta.url)('sharp');
await sharp('art/home/clearing-source.png')
  .resize({ width: 960, withoutEnlargement: true })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile('assets/home/clearing.jpg');
for (const name of ['herbarium', 'rosette'])
  await sharp('art/home/' + name + '-source.png')
    .resize(384, 384, { fit: 'inside', withoutEnlargement: true })
    .png({ palette: true, colours: 256, dither: 0.5 })
    .toFile('assets/home/' + name + '.png');
for (const name of ['clearing.jpg', 'herbarium.png', 'rosette.png']) {
  const path = 'assets/home/' + name;
  const meta = await sharp(path).metadata();
  console.log(path, meta.width + '×' + meta.height, (await stat(path)).size + ' bytes');
}
