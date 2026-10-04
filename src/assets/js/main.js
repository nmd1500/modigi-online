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
    header.classList.toggle('is-scrolled', y > 8);
    const menuOpen = document.body.classList.contains('menu-open');
    header.classList.toggle('is-hidden', !menuOpen && y > 400 && y > lastY);
    lastY = y;
    ticking = false;
  });
}, { passive: true });

// Mobile drawer
const btn = document.querySelector('[data-menu-btn]');
const drawer = document.querySelector('[data-drawer]');
function setMenu(open) {
  btn.setAttribute('aria-expanded', String(open));
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
