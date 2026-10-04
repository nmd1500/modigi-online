import fs from 'node:fs';

const images = JSON.parse(fs.readFileSync('src/_data/images.json', 'utf8'));

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ 'src/assets': 'assets' });
  eleventyConfig.addPassthroughCopy({ 'src/static': '/' });
  eleventyConfig.addWatchTarget('src/assets/');

  // {% img "hero-wrist", "代替テキスト", "(min-width: 960px) 50vw, 100vw", "eager" %}
  eleventyConfig.addShortcode('img', (name, alt = '', sizes = '100vw', loading = 'lazy', cls = '') => {
    const m = images[name];
    if (!m) throw new Error(`Không tìm thấy ảnh: ${name}`);
    const w = m.widths.at(-1);
    const h = Math.round(w / m.ratio);
    const srcset = m.widths.map((x) => `/assets/img/${name}-${x}.webp ${x}w`).join(', ');
    const fp = loading === 'eager' ? ' fetchpriority="high"' : '';
    return `<img src="/assets/img/${name}-${m.widths[0]}.webp" srcset="${srcset}" sizes="${sizes}" width="${w}" height="${h}" alt="${alt}" loading="${loading}" decoding="async"${fp}${cls ? ` class="${cls}"` : ''}>`;
  });

  eleventyConfig.addShortcode('year', () => String(new Date().getFullYear()));
  eleventyConfig.addFilter('yen', (n) => '¥' + Number(n).toLocaleString('ja-JP'));
  eleventyConfig.addFilter('jaDate', (d) =>
    new Date(d).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tokyo' }),
  );
  eleventyConfig.addFilter('isoDate', (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter('head', (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter('faqSchema', (groups) =>
    groups.flatMap((g) => g.items).map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a.replace(/<[^>]+>/g, '') },
    })),
  );
  eleventyConfig.addFilter('json', (v) => JSON.stringify(v));

  eleventyConfig.addCollection('journal', (api) =>
    api.getFilteredByGlob('src/journal/*.md').sort((a, b) => b.date - a.date),
  );

  return {
    dir: { input: 'src', includes: '_includes', data: '_data', output: '_site' },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
  };
}
