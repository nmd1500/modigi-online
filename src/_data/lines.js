// Các dòng sản phẩm: nội dung biên tập + số liệu tự tính từ data/products.json (npm run sync)
import fs from 'node:fs';

const products = JSON.parse(fs.readFileSync('data/products.json', 'utf8'));

const defs = [
  {
    slug: 'crocodile',
    en: 'Crocodile',
    ja: 'クロコダイル',
    kana: 'クロコダイルレザー',
    lead: '腹部の均整なスクエア模様だけを選び抜いた、MODIGIの最上位ライン。',
    body: [
      '一本のバンドに使えるのは、クロコダイル腹部のごく限られた部分だけ。規則正しく並ぶスクエアグレインと、磨き上げた自然な艶。手首に静かな存在感を添える、大人のためのエグゼクティブ・ピースです。',
      '裏地には防水・防汚加工を施したカーフスキンを合わせ、肌あたりは驚くほど柔らか。ビジネスのスーツにも、週末のシャツにも自然に馴染みます。',
    ],
    hero: 'croco-life',
    gallery: ['croco-buckle', 'gift-box'],
    specs: [
      ['表革', 'クロコダイルレザー（腹部）'],
      ['裏革', '防水・防汚加工カーフスキン'],
      ['縫製', '職人による手縫い（高耐久の天然縫い糸）'],
      ['金具', 'ステンレススチール'],
    ],
    keywords: 'Apple Watch バンド クロコダイル 本革 高級',
  },
  {
    slug: 'swift',
    en: 'Veau Swift',
    ja: 'ヴォー・スイフト',
    kana: 'フランス産カーフレザー',
    lead: '吸い付くようになめらかな、フランス産の仔牛革。',
    body: [
      'ヴォー・スイフトは、雄の仔牛（ヴォー）の革を丁寧になめした、きめ細かくマットな表情の上質カーフ。手に吸い付くようなしなやかさと、鮮やかな発色が魅力です。',
      'ほどよい弾力があり、着け始めから手首に優しく沿います。使い込むほどに艶が増し、あなただけの一本へと育っていきます。',
    ],
    hero: 'swift-colors',
    gallery: ['swift-black', 'swift-buckle'],
    specs: [
      ['表革', 'ヴォー・スイフト（フランス産カーフ）'],
      ['裏革', 'ツェルマット・カーフレザー'],
      ['縫製', '職人による手縫い'],
      ['金具', 'ステンレススチール（シルバー / ブラック）'],
    ],
    keywords: 'Apple Watch バンド 本革 カーフ スイフト ハンドメイド',
  },
  {
    slug: 'epsom',
    en: 'Veau Epsom',
    ja: 'ヴォー・エプソン',
    kana: '型押しカーフレザー',
    lead: '細やかな型押しが生む、軽やかで型崩れしにくい凛とした表情。',
    body: [
      'ヴォー・エプソンは、仔牛革に細かな型押しを施したレザー。軽く、傷や水に強く、形が崩れにくいのが特長です。',
      'エトープ、ノワール、オレンジ。コントラストの効いたステッチが、端正なシルエットを際立たせます。毎日使いの一本に。',
    ],
    hero: 'epsom-etoupe',
    gallery: ['epsom-wrap', 'epsom-noir', 'epsom-orange', 'epsom-box'],
    specs: [
      ['表革', 'ヴォー・エプソン（型押しカーフ）'],
      ['裏革', 'ツェルマット・カーフレザー'],
      ['縫製', '職人による手縫い'],
      ['金具', 'ステンレススチール'],
    ],
    keywords: 'Apple Watch バンド エプソン 型押し 本革',
  },
  {
    slug: 'essential',
    en: 'Essential',
    ja: 'エッセンシャル',
    kana: '本革バンド',
    lead: '毎日に寄り添う、MODIGIのはじまりの一本。',
    body: [
      '高品質な本革に、着脱しやすいDバックル仕様もそろえたスタンダードライン。ビジネスにもカジュアルにも合わせやすい、上品で飽きのこないデザインです。',
      '初めての本革バンドに、そして気軽に付け替えを楽しむセカンドバンドとして。',
    ],
    hero: 'swift-boxed',
    gallery: ['epsom-etoupe-watch', 'epsom-wrap-2'],
    specs: [
      ['表革', '本革'],
      ['裏革', '防水カーフスキン'],
      ['仕様', 'ピンバックル / Dバックル'],
      ['金具', 'ステンレススチール'],
    ],
    keywords: 'Apple Watch バンド 本革 Dバックル',
  },
];

const SIZE_GROUPS = [
  ['38 / 40 / 41 / 42mm', /(38|40|41)/],
  ['44 / 45 / 46 / 49mm', /(44|45|46|49)/],
];

function stats(items) {
  const prices = items.map((p) => p.price).filter(Boolean);
  const colors = [...new Set(items.flatMap((p) => p.colors))];
  const sizeText = items.flatMap((p) => p.sizes).join(' ');
  return {
    count: items.length,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    colors,
    dbuckle: items.some((p) => p.dbuckle),
    sizes: SIZE_GROUPS.filter(([, re]) => re.test(sizeText)).map(([label]) => label),
  };
}

// Barenia (ít mẫu) gộp vào Swift để trang không bị mỏng
const groupOf = (p) => (p.line === 'barenia' ? 'swift' : p.line);

export default defs.map((d) => ({
  ...d,
  ...stats(products.filter((p) => groupOf(p) === d.slug)),
}));
