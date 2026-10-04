// Đọc modigi_master.csv → data/products.json (chỉ giữ trường cần cho web, bỏ ID nội bộ Mercari).
// Chạy: npm run sync   (đổi đường dẫn CSV bằng biến môi trường MODIGI_CSV)
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

const SRC = process.env.MODIGI_CSV || '/Users/manhdien/Claude/Projects/Merucari shop/modigi_master.csv';
const rows = parse(fs.readFileSync(SRC), { columns: true, bom: true, skip_empty_lines: true });

const COLORS = [
  ['ブラック', /ブラック|黒|black|ノワール|noir/i],
  ['ブラウン', /ブラウン|茶|brown|キャメル|camel|ゴールド/i],
  ['オレンジ', /オレンジ|orange/i],
  ['ネイビー', /ネイビー|紺|navy|ブルー|青|blue/i],
  ['グリーン', /グリーン|緑|green/i],
  ['エトープ', /エトープ|エトゥープ|etoupe|グレー|gray|grey|トープ/i],
  ['ホワイト', /ホワイト|白|white/i],
  ['ピンク', /ピンク|pink/i],
  ['レッド', /レッド|赤|red|ボルドー/i],
  ['ベージュ', /ベージュ|beige|ナチュラル/i],
];

function line(id, name, desc) {
  const p = id.split('-')[0];
  const text = /barenia|epsom|エプソン|swift|スイフト/i.test(name) ? name : desc;
  if (p === 'CRO') return 'crocodile';
  if (p === 'ACC') return 'accessories';
  if (p === 'STD') return 'essential';
  if (/barenia/i.test(text)) return 'barenia';
  if (/epsom|エプソン/i.test(text)) return 'epsom';
  if (/swift|スイフト/i.test(text)) return 'swift';
  return 'swift';
}

const products = rows
  .filter((r) => r['管理ID'] && r['商品ステータス'] !== '3')
  .map((r) => {
    const name = r['商品名'] || '';
    const sizes = [];
    let stock = 0;
    for (let i = 1; i <= 10; i++) {
      const s = (r[`SKU${i}_種類`] || '').trim();
      if (s) sizes.push(s);
      stock += Number(r[`SKU${i}_現在の在庫数`] || 0);
    }
    return {
      id: r['管理ID'],
      line: line(r['管理ID'], name, r['商品説明'] || ''),
      tier: r['管理ID'].split('-')[0],
      price: Number(r['販売価格'] || 0),
      colors: COLORS.filter(([, re]) => re.test(name)).map(([c]) => c),
      dbuckle: /Dバックル|D buck/i.test(name),
      sizes,
      stock,
    };
  });

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/products.json', JSON.stringify(products, null, 1));
const by = products.reduce((a, p) => ((a[p.line] = (a[p.line] || 0) + 1), a), {});
console.log(`✓ ${products.length} sản phẩm`, by);
