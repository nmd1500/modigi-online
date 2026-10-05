// Tạo dữ liệu & ảnh theo từng màu từ file listing Amazon (.xlsm) + file ASIN (.xlsx).
// Ảnh lấy từ chính listing Amazon của MODIGI (m.media-amazon.com).
// Chạy: npm run variants   (đổi thư mục bằng MODIGI_LISTINGS=/đường/dẫn)
import fs from 'node:fs/promises';
import path from 'node:path';
import XLSX from 'xlsx';
import sharp from 'sharp';

const DIR = process.env.MODIGI_LISTINGS || `${process.env.HOME}/Documents/Claude/Projects`;
const OUT_IMG = path.resolve('src/assets/img/v');
const MAX_IMGS = 6; // ảnh chính + 5 ảnh phụ mỗi màu
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

// Tên màu hiển thị (EN / JA) theo màu trong listing
const COLOR_NAMES = {
  'ブラウン': ['Brown', 'ブラウン'], 'エトゥープ': ['Étoupe', 'エトープ'], 'オレンジ': ['Orange', 'オレンジ'],
  'オレンジーブラック': ['Noir × Orange', 'ブラック × オレンジ'], 'グリーン': ['Vert', 'グリーン'], 'ネイビー': ['Navy', 'ネイビー'],
  'ピンク': ['Rose', 'ピンク'], 'ブラック': ['Noir', 'ブラック'], 'ホワイト/ブラック': ['Blanc × Noir', 'ホワイト × ブラック'],
  'Orange/MintBlue': ['Orange × Mint', 'オレンジ × ミント'], 'オレンジ/ホワイト': ['Orange × Blanc', 'オレンジ × ホワイト'],
  'ブラック/イエロー': ['Noir × Jaune', 'ブラック × イエロー'], 'ブラック/ブルー': ['Noir × Bleu', 'ブラック × ブルー'],
  'ブラック/ホワイト': ['Noir × Blanc', 'ブラック × ホワイト'],
  'Royal Blue': ['Royal Blue', 'ロイヤルブルー'], 'Golden Brown': ['Golden Brown', 'ゴールデンブラウン'],
  'Pearl Grey': ['Pearl Grey', 'パールグレー'], 'Rose Sakura': ['Rose Sakura', 'ローズサクラ'],
};
// SKU đặc biệt: cùng màu "ブラック" nhưng chỉ cam (chicam)
const SKU_OVERRIDE = { BLchicam: ['Noir Orange Stitch', 'ブラック（オレンジステッチ）'] };

const slugify = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const skuBase = (sku) => sku.replace(/\s/g, '').replace(/_?\d{2}$/, '').toLowerCase();

// 1) ASIN theo SKU / màu
const asinWb = XLSX.readFile(path.join(DIR, 'ASIN ADS AMAZON.xlsx'));
const asinRows = [];
for (const [sheet, line] of [['Croco', 'crocodile'], ['Swift', 'swift'], ['EPSOM', 'epsom'], ['Standand', 'essential']]) {
  for (const r of XLSX.utils.sheet_to_json(asinWb.Sheets[sheet], { header: 1, defval: '' }).slice(1)) {
    const cells = String(r.join('\t')).split('\t').map((c) => c.trim()).filter(Boolean);
    const asin = cells.find((c) => /^B0[A-Z0-9]{8}$/.test(c));
    const sku = cells.find((c) => c !== asin);
    if (asin && sku) asinRows.push({ line, asin, sku });
  }
}

// 2) Màu + ảnh từ file listing
const variants = new Map();
for (const [file, line] of [['HM_SWIFT _LISTING .xlsm', 'swift'], ['HM_SWIFT 2 LISTING .xlsm', 'swift'], ['HM_EPNEW_FIXED3.xlsm', 'epsom']]) {
  const rows = XLSX.utils.sheet_to_json(XLSX.readFile(path.join(DIR, file)).Sheets['テンプレート'], { header: 1, defval: '' });
  const H = rows[4].map(String);
  const iSku = H.findIndex((h) => h.startsWith('contribution_sku'));
  const iPar = H.findIndex((h) => h.startsWith('parentage_level'));
  const iParent = H.findIndex((h) => h.startsWith('child_parent_sku_relationship'));
  const iColor = H.findIndex((h) => h.startsWith('color['));
  const imgCols = H.map((h, i) => (/(main|other)_product_image_locator/.test(h) ? i : -1)).filter((i) => i >= 0);
  for (const r of rows.slice(5)) {
    if (r[iPar] !== '子供') continue;
    const sku = String(r[iSku]).trim();
    const imgs = imgCols.map((i) => r[i]).filter((u) => /^https:\/\/m\.media-amazon\.com/.test(u));
    if (!imgs.length) continue;
    const override = Object.entries(SKU_OVERRIDE).find(([k]) => sku.toLowerCase().startsWith(k.toLowerCase()));
    const [en, ja] = override ? override[1] : COLOR_NAMES[r[iColor]] || [String(r[iColor]), String(r[iColor])];
    const key = `${line}:${en}`;
    const asin = asinRows.find((a) => a.line === line && skuBase(a.sku) === skuBase(sku))?.asin;
    const prev = variants.get(key);
    if (!prev || (!prev.asin && asin)) variants.set(key, { line, en, ja, sku, parent: String(r[iParent]), asin: asin || prev?.asin, imgs });
  }
}
// màu chưa có ASIN riêng → dùng ASIN cùng nhóm (trang Amazon cho phép chọn màu)
for (const v of variants.values()) {
  if (v.asin) continue;
  v.asin = [...variants.values()].find((o) => o.parent === v.parent && o.asin)?.asin;
  v.asinShared = true;
}

// 3) Các dòng chỉ có ASIN (Croco, Epsom cũ, Standard) → lấy ảnh từ trang sản phẩm Amazon
const ASIN_ONLY = {
  crocodile: { 'Cognac Camel44': ['Cognac Camel', 'コニャックキャメル'], 'Onyx Black44': ['Onyx Black', 'オニキスブラック'], 'Espresso Brown44': ['Espresso Brown', 'エスプレッソブラウン'], 'Midnight Navy44': ['Midnight Navy', 'ミッドナイトネイビー'], 'Royal Blue44': ['Royal Blue', 'ロイヤルブルー'] },
  epsom: { 'OR＿EP＿44': ['Orange', 'オレンジ'], 'BR＿EP＿44': ['Étoupe', 'エトープ'], 'BL＿EP＿44': ['Noir', 'ブラック'] },
  essential: { MDG_BL44: ['Noir', 'ブラック'], MDG_OR44: ['Orange', 'オレンジ'], MDG_NE44: ['Navy', 'ネイビー'], MDG_RED44: ['Rouge', 'レッド'] },
};
const prices = {};
async function fetchAsin(asin) {
  const res = await fetch(`https://www.amazon.co.jp/dp/${asin}`, { headers: { 'User-Agent': UA, 'Accept-Language': 'ja-JP,ja;q=0.9' } });
  const html = await res.text();
  const imgs = [...new Set([...html.matchAll(/"hiRes":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/g)].map((m) => m[1]))];
  const price = html.match(/<span class="a-price-whole">([\d,]+)/)?.[1]?.replace(/,/g, '');
  await new Promise((r) => setTimeout(r, 2500)); // lịch sự với Amazon
  return { imgs, price: price ? Number(price) : null };
}
for (const [line, map] of Object.entries(ASIN_ONLY)) {
  for (const [sku, [en, ja]] of Object.entries(map)) {
    const a = asinRows.find((x) => x.line === line && x.sku === sku);
    if (!a) { console.warn('⚠ không thấy ASIN cho', sku); continue; }
    const { imgs, price } = await fetchAsin(a.asin);
    if (!imgs.length) { console.warn('⚠ không lấy được ảnh', a.asin); continue; }
    variants.set(`${line}:${en}`, { line, en, ja, sku, asin: a.asin, imgs, price });
    console.log('✓ ASIN', a.asin, en, imgs.length, 'ảnh', price ? `¥${price}` : '');
  }
}
// giá Swift/Epsom mới: lấy từ 1 ASIN đại diện mỗi nhóm
const groupPrice = {};
for (const v of variants.values()) {
  if (v.price || !v.asin || v.line === 'crocodile' || v.line === 'essential') continue;
  if (!(v.asin in groupPrice)) groupPrice[v.asin] = (await fetchAsin(v.asin)).price;
  v.price = groupPrice[v.asin];
}

// 4) Tải & chuyển ảnh sang WebP
await fs.mkdir(OUT_IMG, { recursive: true });
const result = [];
for (const v of variants.values()) {
  const slug = slugify(v.en);
  const files = [];
  for (const [n, url] of v.imgs.slice(0, MAX_IMGS).entries()) {
    const name = `${v.line}-${slug}-${n + 1}`;
    const target = path.join(OUT_IMG, `${name}-1200.webp`);
    try { await fs.access(target); } catch {
      const buf = Buffer.from(await (await fetch(url.replace(/\._[^.]+_\./, '.'), { headers: { 'User-Agent': UA } })).arrayBuffer());
      const img = sharp(buf).flatten({ background: '#ffffff' });
      await img.clone().resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toFile(target);
      await img.clone().resize(640, 640, { fit: 'inside' }).webp({ quality: 78 }).toFile(path.join(OUT_IMG, `${name}-640.webp`));
    }
    files.push(name);
  }
  result.push({ line: v.line, slug, en: v.en, ja: v.ja, sku: v.sku, asin: v.asin || null, asinShared: !!v.asinShared, price: v.price || null, images: files });
  console.log('✓', v.line, v.en, files.length, 'ảnh', v.asin || '(chưa có ASIN)');
}
const order = ['crocodile', 'swift', 'epsom', 'essential'];
result.sort((a, b) => order.indexOf(a.line) - order.indexOf(b.line));
await fs.writeFile('data/variants.json', JSON.stringify(result, null, 1));
const metaPath = 'src/_data/images.json';
const meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
for (const k of Object.keys(meta)) if (k.startsWith('v/')) delete meta[k];
for (const v of result) for (const name of v.images) {
  const m = await sharp(path.join(OUT_IMG, `${name}-1200.webp`)).metadata();
  meta[`v/${name}`] = { widths: m.width >= 1200 ? [640, 1200] : [640, m.width], ratio: +(m.width / m.height).toFixed(4) };
}
await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
console.log(`\n${result.length} màu → data/variants.json`);
