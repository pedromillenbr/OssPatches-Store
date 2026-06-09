import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

const DIRS = [
  'public/images/belts',
  'public/images/athletes',
  'public/images/about',
  'public/images/patches',
];

const QUALITY = { jpeg: 82, png: 80, webp: 82 };
const MAX_WIDTH = 1200; // px — enough for any display at 2x

async function getFiles(dir) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) files.push(...await getFiles(full));
      else files.push(full);
    }
  } catch { /* dir may not exist */ }
  return files;
}

async function optimizeFile(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return;

  const { size: before } = await stat(filePath);
  const img = sharp(filePath).resize({ width: MAX_WIDTH, withoutEnlargement: true });

  let buf;
  if (ext === '.png') {
    buf = await img.png({ quality: QUALITY.png, compressionLevel: 9 }).toBuffer();
  } else {
    buf = await img.jpeg({ quality: QUALITY.jpeg, mozjpeg: true }).toBuffer();
  }

  if (buf.length < before) {
    const { writeFile, rename, unlink } = await import('fs/promises');
    const tmp = filePath + '.tmp';
    await writeFile(tmp, buf);
    try { await unlink(filePath); } catch {}
    await rename(tmp, filePath);
    const saved = ((before - buf.length) / before * 100).toFixed(1);
    console.log(`✓ ${basename(filePath)}: ${(before/1024).toFixed(0)}KB → ${(buf.length/1024).toFixed(0)}KB (-${saved}%)`);
  } else {
    console.log(`- ${basename(filePath)}: already optimized`);
  }
}

const files = (await Promise.all(DIRS.map(getFiles))).flat();
console.log(`\nOptimizing ${files.length} images...\n`);
for (const f of files) await optimizeFile(f);
console.log('\nDone.');
