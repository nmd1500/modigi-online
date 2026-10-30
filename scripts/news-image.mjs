// Tải ảnh báo chí chính thức của Apple (Apple Newsroom) cho bài /news/ và chuyển sang WebP.
// Chạy: npm run news-image -- <url ảnh> <slug>
// Kết quả: src/assets/img/news/<slug>-<w>.webp, key "news/<slug>" trong src/_data/images.json
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const WIDTHS = [640, 1200, 1800];
const ALLOWED = /(^|\.)apple\.com$/; // chỉ nhận ảnh từ apple.com (ảnh báo chí chính thức)

const [url, slug] = process.argv.slice(2);
if (!url || !/^[a-z0-9-]+$/.test(slug || '')) {
  console.error('Cách dùng: npm run news-image -- <url ảnh apple.com> <slug-tieng-anh>');
  process.exit(1);
}
const u = new URL(url);
if (u.protocol !== 'https:' || !ALLOWED.test(u.hostname)) {
  console.error(`Chỉ nhận ảnh từ apple.com, không nhận: ${u.hostname}`);
  process.exit(1);
}

const res = await fetch(u);
const type = res.headers.get('content-type') || '';
if (!res.ok || !type.startsWith('image/')) {
  console.error(`Không tải được ảnh (${res.status}, ${type})`);
  process.exit(1);
}
const buf = Buffer.from(await res.arrayBuffer());
const m = await sharp(buf).metadata();

const name = `news/${slug}`;
const out = path.resolve('src/assets/img/news');
await fs.mkdir(out, { recursive: true });
const widths = WIDTHS.filter((w) => w < m.width);
if (m.width < WIDTHS.at(-1)) widths.push(m.width);
for (const w of widths) {
  await sharp(buf).resize(w).webp({ quality: 80 }).toFile(path.join(out, `${slug}-${w}.webp`));
}

const file = 'src/_data/images.json';
const meta = JSON.parse(await fs.readFile(file, 'utf8'));
meta[name] = { widths, ratio: +(m.width / m.height).toFixed(4) };
await fs.writeFile(file, JSON.stringify(meta, null, 2));
console.log('✓', name, widths.join('/'));
