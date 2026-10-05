// MODIGI — interactions (no dependencies)
document.documentElement.classList.add('js');

// Header: border on scroll, hide on scroll-down
const header = document.querySelector('[data-header]');
let lastY = window.scrollY;
let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', header.getBoundingClientRect().top <= 0 && y > 40);
    lastY = y;
    ticking = false;
  });
}, { passive: true });

// Mobile drawer
const btn = document.querySelector('[data-menu-btn]');
const drawer = document.querySelector('[data-drawer]');
function setMenu(open) {
  btn.setAttribute('aria-expanded', String(open));
  drawer.style.top = header.getBoundingClientRect().bottom + 'px';
  drawer.hidden = !open;
  document.body.classList.toggle('menu-open', open);
  if (open) drawer.querySelector('a')?.focus();
}
btn?.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !drawer.hidden) { setMenu(false); btn.focus(); }
});
matchMedia('(min-width: 1081px)').addEventListener('change', (e) => e.matches && setMenu(false));

// Scroll reveal
const reveals = document.querySelectorAll('.reveal, .reveal-img');
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-in'));
}

// Contact form: client-side validation + error from server redirect
const form = document.querySelector('[data-contact]');
if (form) {
  const params = new URLSearchParams(location.search);
  if (params.get('error')) form.querySelector('[data-form-error]').hidden = false;
  form.querySelector('[name="ts"]').value = Date.now();
  form.addEventListener('submit', (e) => {
    let first = null;
    form.querySelectorAll('[required]').forEach((el) => {
      const ok = el.type === 'checkbox' ? el.checked : el.checkValidity();
      el.setAttribute('aria-invalid', String(!ok));
      const err = document.getElementById(el.id + '-error');
      if (err) err.hidden = ok;
      if (!ok && !first) first = el;
    });
    if (first) { e.preventDefault(); first.focus(); return; }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.textContent = '送信中…';
  });
}

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Hero slideshow
const hero = document.querySelector('[data-hero]');
if (hero) {
  const slides = [...hero.querySelectorAll('[data-slide]')];
  const dots = [...hero.querySelectorAll('[data-dot]')];
  let i = 0;
  let timer;
  const show = (n) => {
    slides[i].classList.remove('is-active');
    dots[i]?.removeAttribute('aria-current');
    i = (n + slides.length) % slides.length;
    const img = slides[i].querySelector('img');
    if (img?.loading === 'lazy') img.loading = 'eager';
    slides[i].classList.add('is-active');
    dots[i]?.setAttribute('aria-current', 'true');
  };
  const play = () => { if (!reduceMotion) timer = setInterval(() => show(i + 1), 7000); };
  dots.forEach((d, n) => d.addEventListener('click', () => { clearInterval(timer); show(n); play(); }));
  document.addEventListener('visibilitychange', () => { clearInterval(timer); if (!document.hidden) play(); });
  play();
}

// Lookbook arrows
const track = document.querySelector('[data-look-track]');
document.querySelectorAll('[data-look]').forEach((b) => b.addEventListener('click', () => {
  const step = track.querySelector('figure').getBoundingClientRect().width + 24;
  track.scrollBy({ left: step * Number(b.dataset.look), behavior: reduceMotion ? 'auto' : 'smooth' });
}));

// Parallax band
const bands = document.querySelectorAll('[data-parallax]');
if (bands.length && !reduceMotion) {
  const update = () => {
    bands.forEach((band) => {
      const r = band.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      band.querySelector('[data-parallax-media]').style.transform = `translate3d(0, ${(p * -10).toFixed(2)}%, 0)`;
    });
  };
  window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  update();
}

// Variant gallery thumbnails
document.querySelectorAll('[data-gallery]').forEach((g) => {
  const main = g.querySelector('.gallery-v__main img');
  g.querySelectorAll('.gallery-v__thumb').forEach((t) => t.addEventListener('click', () => {
    main.removeAttribute('srcset');
    main.src = t.dataset.src;
    g.querySelectorAll('.gallery-v__thumb').forEach((x) => x.removeAttribute('aria-current'));
    t.setAttribute('aria-current', 'true');
  }));
});
