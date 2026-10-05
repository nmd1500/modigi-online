// Chuyển ảnh gốc (thư mục MODIGI) sang WebP nhiều kích thước cho web.
// Chạy: npm run images  (đổi thư mục nguồn bằng biến môi trường MODIGI_ASSETS)
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const SRC = process.env.MODIGI_ASSETS || '/Users/manhdien/Documents/Claude/Projects/modigi.jp';
const OUT = path.resolve('src/assets/img');
const WIDTHS = [640, 1200, 1800];

// crop: [left, top, width, height] tính theo tỉ lệ 0–1 của ảnh gốc (bỏ phần chữ quảng cáo)
const manifest = [
  { name: 'hero-wrist',     src: 'swift/IMG_3094.JPG' },
  { name: 'swift-black',    src: 'swift/main.JPG' },
  { name: 'swift-colors',   src: 'swift/Bản sao của Day xanh chi cam .png.PNG', crop: [0, 0.02, 1, 0.6] },
  { name: 'swift-buckle',   src: 'swift/Hm ssw den.zip - 2.PNG', crop: [0, 0, 1, 0.82] },
  { name: 'swift-boxed',    src: 'swift/Hm ssw den.zip - 1.PNG', crop: [0, 0, 1, 0.82] },
  { name: 'craft-stitch',   src: 'swift/Hm ssw den.zip - 4.PNG', crop: [0, 0, 1, 0.82] },
  { name: 'gift-box',       src: 'swift/IMG_3132 2.JPG', crop: [0, 0.36, 1, 0.64] },
  { name: 'croco-life',     src: 'Croco/croco3.JPG', crop: [0, 0, 1, 0.86] },
  { name: 'croco-buckle',   src: 'Croco/croco2.PNG', crop: [0.42, 0, 0.58, 0.44] },
  { name: 'epsom-wrap',     src: 'epsom/1E492B55-8EFD-4C54-8340-44626C333DE6_1_105_c.jpeg' },
  { name: 'epsom-wrap-2',   src: 'epsom/20C02AE2-D17A-4A8A-A222-9BC7E9706D34_1_105_c.jpeg' },
  { name: 'epsom-etoupe',   src: 'epsom/26B472C2-5C7F-410F-873E-1DDC610A0373_1_105_c.jpeg' },
  { name: 'epsom-noir',     src: 'epsom/39A438C8-6A01-44D7-A4A0-C8096C25928B_1_105_c.jpeg' },
  { name: 'epsom-orange',   src: 'epsom/422E451B-EFE4-473A-8CA0-AF094278D75F_1_105_c.jpeg' },
  { name: 'epsom-box',      src: 'epsom/62FF5C61-1A45-4D40-8979-3E255FB2885C_1_105_c.jpeg' },
  { name: 'epsom-etoupe-watch', src: 'epsom/9FE4654F-FB01-4FA0-BEB6-D5D5DF9ADFFE_1_105_c.jpeg' },
  // Ảnh xưởng thật (atelier)
  { name: 'atelier-cutting',   src: 'atelier/cutting.jpg' },
  { name: 'atelier-pricking',  src: 'atelier/pricking.jpg' },
  { name: 'atelier-stitching', src: 'atelier/stitching.jpg' },
  { name: 'atelier-crease',    src: 'atelier/edge-crease.jpg' },
  { name: 'atelier-finish',    src: 'atelier/edge-finish.jpg' },
  { name: 'atelier-lineup',    src: 'atelier/straps-lineup.jpg' },
  { name: 'atelier-sorting',   src: 'atelier/sorting.jpg' },
];

await fs.mkdir(OUT, { recursive: true });
const meta = {};
for (const item of manifest) {
  let img = sharp(path.join(SRC, item.src)).rotate();
  const { width, height } = await img.metadata();
  if (item.crop) {
    const [l, t, w, h] = item.crop;
    img = img.extract({ left: Math.round(l * width), top: Math.round(t * height), width: Math.round(w * width), height: Math.round(h * height) });
  }
  const buf = await img.toBuffer();
  const m = await sharp(buf).metadata();
  const widths = WIDTHS.filter((w) => w < m.width);
  if (m.width < WIDTHS.at(-1)) widths.push(m.width);
  for (const w of widths) {
    await sharp(buf).resize(w).webp({ quality: 80 }).toFile(path.join(OUT, `${item.name}-${w}.webp`));
  }
  meta[item.name] = { widths, ratio: +(m.width / m.height).toFixed(4) };
  console.log('✓', item.name, widths.join('/'));
}
const prev = JSON.parse(await fs.readFile('src/_data/images.json', 'utf8').catch(() => '{}'));
for (const [k, v] of Object.entries(prev)) if (k.startsWith('v/')) meta[k] = v;
await fs.writeFile('src/_data/images.json', JSON.stringify(meta, null, 2));
