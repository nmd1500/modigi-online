// Các màu (variant) lấy từ listing Amazon — tạo bởi `npm run variants`
import fs from 'node:fs';

const raw = JSON.parse(fs.readFileSync('data/variants.json', 'utf8'));
export default raw.map((v) => ({
  ...v,
  url: `/collection/${v.line}/${v.slug}/`,
  buyUrl: v.asin && !v.asinShared ? `https://www.amazon.co.jp/dp/${v.asin}` : v.asin ? `https://www.amazon.co.jp/dp/${v.asin}` : null,
}));
