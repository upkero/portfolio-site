import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CONTACTS, dict, services, steps, stack, projects } from './content.js';
import { initHero } from './hero-gl.js';
import { mountVisual } from './visuals.js';
import { mountDemo } from './demos/index.js';
import { health } from './live.js';
import './demos.css';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const EASE = 'expo.out';
if (reduced) root.classList.add('no-motion');

/* ---------- dictionary: static keys + list items ---------- */
for (const lang of ['ru', 'en']) {
  const d = dict[lang];
  services.forEach((s, i) => ([d[`svc.${i}.title`], d[`svc.${i}.desc`]] = s[lang]));
  steps.forEach((s, i) => ([d[`step.${i}.title`], d[`step.${i}.desc`]] = s[lang]));
  projects.forEach((p) => {
    d[`p.${p.id}.title`] = p[lang].title;
    d[`p.${p.id}.line`] = p[lang].line;
  });
}
const saved = (() => { try { return localStorage.getItem('lang'); } catch { return null; } })();
let lang = dict[saved] ? saved : root.lang === 'ru' ? 'ru' : 'en';
const t = (key) => dict[lang][key] ?? '';

/* ---------- static render ---------- */
$('[data-services]').innerHTML = services.map((s, i) => `
  <li>
    <h3 data-i18n="svc.${i}.title"></h3>
    <p data-i18n="svc.${i}.desc"></p>
    <a href="#work/${s.case}"><span data-i18n="services.example"></span> →</a>
  </li>`).join('');

$('[data-work]').innerHTML = projects.map((p) => `
  <article class="card">
    <a class="card__link" href="#work/${p.id}" data-cursor="open">
      <div class="card__media"><canvas data-visual="${p.id}" aria-hidden="true"></canvas></div>
      <h3 class="card__title" data-i18n="p.${p.id}.title"></h3>
      <span class="card__live" data-live="${p.id}" data-state="checking"></span>
    </a>
    <p class="card__line" data-i18n="p.${p.id}.line"></p>
    <div class="card__meta">
      <span>${p.tags.join(' · ')}</span>
      <a href="${p.repo}" target="_blank" rel="noopener"><span data-i18n="work.source"></span> ↗</a>
    </div>
  </article>`).join('') + `
  <div class="card card--cta">
    <p data-i18n="work.ctaTitle"></p>
    <a class="pill pill--solid" href="#contact" data-i18n="work.ctaBtn"></a>
  </div>`;

$('[data-steps]').innerHTML = steps.map((_, i) => `
  <li>
    <span>${String(i + 1).padStart(2, '0')}</span>
    <h3 data-i18n="step.${i}.title"></h3>
    <p data-i18n="step.${i}.desc"></p>
  </li>`).join('');

$('[data-marquee]').innerHTML = [...stack, ...stack].map((s) => `<span>${s}</span>`).join('');

$$('[data-contact]').forEach((a) => {
  const kind = a.dataset.contact;
  if (!CONTACTS[kind]) return a.remove(); // no address yet: no dead link
  a.href = kind === 'email' ? `mailto:${CONTACTS.email}` : CONTACTS[kind];
  if (kind === 'email') a.textContent = CONTACTS.email;
});
$('[data-year]').textContent = new Date().getFullYear();
$$('[data-visual]').forEach((c) => mountVisual(c, c.dataset.visual, { reduced }));

/* ---------- live status of each service on its card ---------- */
const renderLive = () => $$('[data-live]').forEach((el) => {
  el.textContent = el.dataset.state === 'up' ? t('work.live') : el.dataset.state === 'checking' ? '' : t('work.offline');
});
projects.forEach(async (p) => {
  const h = await health(p.id).catch(() => ({ state: 'down' }));
  $(`[data-live="${p.id}"]`).dataset.state = h.state === 'up' ? 'up' : 'down';
  renderLive();
});

/* ---------- hero title: chars for the language crossfade ---------- */
const heroTitle = $('[data-hero-title]');
function splitTitle(html) {
  const chars = html.split(/(<i>.*?<\/i>)/).flatMap((part) => {
    const m = part.match(/^<i>(.*)<\/i>$/);
    return [...(m ? m[1] : part)].map((ch) => ({ ch, it: !!m }));
  });
  const words = [];
  let cur = [];
  for (const c of chars) {
    if (c.ch === ' ') { words.push(cur); cur = []; } else cur.push(c);
  }
  words.push(cur);
  const plain = chars.map((c) => c.ch).join('');
  heroTitle.innerHTML = `<span class="sr-only">${plain}</span><span aria-hidden="true">${words
    .map((w) => `<span class="wd">${w.map((c) => `<span class="ch">${c.it ? `<i>${c.ch}</i>` : c.ch}</span>`).join('')}</span>`)
    .join(' ')}</span>`;
  return $$('.ch', heroTitle);
}
function setHeroTitle(animate) {
  const html = t('hero.title');
  if (!animate || reduced) return splitTitle(html);
  const old = $$('.ch', heroTitle);
  gsap.to(old, {
    opacity: 0, filter: 'blur(6px)', duration: 0.45, ease: 'power2.in',
    stagger: { each: 0.018, from: 'random' },
    onComplete: () => {
      const fresh = splitTitle(html);
      gsap.from(fresh, { opacity: 0, filter: 'blur(6px)', duration: 0.9, ease: 'power2.out', stagger: { each: 0.03, from: 'random' } });
    },
  });
}

/* ---------- manifesto: words scrub from dim to full ---------- */
const manifesto = $('[data-words]');
let manifestoTween;
function setManifesto() {
  manifesto.innerHTML = t('manifesto').split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
  manifestoTween?.scrollTrigger?.kill();
  manifestoTween?.kill();
  if (reduced) return;
  manifestoTween = gsap.to($$('.w', manifesto), {
    opacity: 1, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: manifesto, start: 'top 82%', end: 'bottom 45%', scrub: 0.6 },
  });
}

/* ---------- i18n ---------- */
const caseEl = $('#case');
function applyLang(next, animate = false) {
  lang = next;
  root.lang = lang;
  try { localStorage.setItem('lang', lang); } catch {}
  document.title = t('meta.title');
  $('meta[name="description"]').content = t('meta.description');
  $$('[data-i18n]').forEach((el) => {
    const v = t(el.dataset.i18n);
    if (el.hasAttribute('data-html')) el.innerHTML = v; else el.textContent = v;
  });
  $$('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  $$('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  $('.nav__burger span').textContent = t(menuOpen ? 'nav.close' : 'nav.menu');
  setHeroTitle(animate);
  setManifesto();
  renderLive();
  if (caseEl.open && currentCase) {
    fillCase(currentCase);
    showDemo(currentCase);
  }
  ScrollTrigger.refresh();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-lang]');
  if (b && b.dataset.lang !== lang) applyLang(b.dataset.lang, true);
});

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
function scrollToEl(el) {
  if (lenis) lenis.scrollTo(el === document.body ? 0 : el, { duration: 1.6 });
  else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  if (el !== document.body) {
    el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }
}

/* ---------- nav: hide on scroll down, active section, mobile menu ---------- */
let lastY = 0;
let menuOpen = false;
addEventListener('scroll', () => {
  const y = scrollY;
  if (!menuOpen) root.classList.toggle('nav-hidden', y > 240 && y > lastY);
  root.classList.toggle('nav-scrolled', y > innerHeight * 0.6);
  lastY = y;
  hero?.setScroll(y);
}, { passive: true });

const navLinks = $$('.nav__menu a');
const sectionIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    navLinks.forEach((a) => a.setAttribute('aria-current', String(a.hash === `#${e.target.id}`)));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[id]').forEach((s) => sectionIO.observe(s));

const burger = $('.nav__burger');
const mmenu = $('#mmenu');
function setMenu(open, viaKeyboard = false) {
  menuOpen = open;
  burger.setAttribute('aria-expanded', String(open));
  burger.querySelector('span').textContent = t(open ? 'nav.close' : 'nav.menu');
  if (open) {
    mmenu.hidden = false;
    root.classList.remove('nav-hidden');
    lenis?.stop();
    if (!reduced) {
      gsap.fromTo(mmenu, { opacity: 0 }, { opacity: 1, duration: 0.5 });
      gsap.from($$('nav a', mmenu), { y: 48, opacity: 0, duration: 1, ease: EASE, stagger: 0.06 });
    }
    if (viaKeyboard) $('nav a', mmenu).focus();
  } else {
    mmenu.hidden = true;
    lenis?.start();
  }
}
burger.addEventListener('click', (e) => setMenu(!menuOpen, e.detail === 0));
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); }
});

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (a?.hasAttribute('data-close-case')) {
    // "get in touch" from inside a demo: leave the case, then go to the contact section
    e.preventDefault();
    caseEl.close();
    setTimeout(() => scrollToEl($('#contact')), 50);
    return;
  }
  if (!a || a.closest('#case')) return;
  const hash = a.getAttribute('href');
  if (hash.startsWith('#work/')) { lastTrigger = a; pushed = true; return; }
  const target = hash === '#top' ? document.body : $(hash);
  if (!target) return;
  e.preventDefault();
  if (menuOpen) setMenu(false);
  scrollToEl(target);
});

/* ---------- cursor ---------- */
if (finePointer && !reduced) {
  root.classList.add('has-cursor');
  const cur = $('.cursor');
  cur.classList.add('is-hidden');
  const label = $('.cursor__label');
  const xTo = gsap.quickTo(cur, 'x', { duration: 0.45, ease: 'power3' });
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.45, ease: 'power3' });
  addEventListener('pointermove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
    cur.classList.remove('is-hidden');
    hero?.pointer((e.clientX / innerWidth) * 2 - 1, 1 - (e.clientY / innerHeight) * 2);
  });
  document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
  document.addEventListener('pointerover', (e) => {
    const open = e.target.closest('[data-cursor="open"]');
    const link = e.target.closest('a, button');
    cur.classList.toggle('is-label', !!open);
    cur.classList.toggle('is-link', !open && !!link);
    label.textContent = open ? t('cursorOpen') : '';
  });
}

/* ---------- hero WebGL ---------- */
const hero = initHero($('#gl'), { reduced });
if (!hero) root.classList.add('no-gl');
if (hero) {
  const live = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? live.add(e.target) : live.delete(e.target)));
    hero.setMode(live.has($('.contact')) && !live.has($('.hero')) ? 'contact' : 'hero');
    live.size && !document.hidden ? hero.start() : hero.stop();
  });
  io.observe($('.hero'));
  io.observe($('.contact'));
  document.addEventListener('visibilitychange', () => (document.hidden ? hero.stop() : live.size && hero.start()));
  let rq = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(rq);
    rq = requestAnimationFrame(() => hero.resize());
  });
}

/* ---------- case study dialog (hash routed: #work/<id>) ---------- */
let currentCase = null, caseDemo = null, lastTrigger = null, pushed = false;
const cursorEl = $('.cursor');
function showDemo(id) {
  caseDemo?.destroy();
  caseDemo = mountDemo($('[data-case-demo]'), id, { lang, reduced });
}
function fillCase(id) {
  const i = projects.findIndex((p) => p.id === id);
  const p = projects[i];
  const c = p[lang];
  const next = projects[(i + 1) % projects.length];
  $$('[data-case]', caseEl).forEach((el) => {
    const k = el.dataset.case;
    if (k === 'how') el.innerHTML = c.how.map((s) => `<li>${s}</li>`).join('');
    else if (k === 'tags') el.innerHTML = p.tags.map((s) => `<li>${s}</li>`).join('');
    else if (k === 'repo') el.href = p.repo;
    else if (k === 'next') el.textContent = next[lang].title;
    else el.textContent = c[k];
  });
  $('[data-case-next]').setAttribute('href', `#work/${next.id}`);
  $('[data-case-index]').textContent = `${String(i + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
}
function openCase(id) {
  if (currentCase !== id) {
    fillCase(id);
    showDemo(id);
    currentCase = id;
  }
  if (!caseEl.open) {
    caseEl.showModal();
    caseEl.append(cursorEl); // the dialog sits in the top layer, above anything outside it
    lenis?.stop();
  }
  caseEl.scrollTop = 0;
}
function route() {
  const m = location.hash.match(/^#work\/(\w+)$/);
  if (m && projects.some((p) => p.id === m[1])) openCase(m[1]);
  else if (caseEl.open) caseEl.close();
}
caseEl.addEventListener('close', () => {
  caseDemo?.destroy();
  caseDemo = null;
  document.body.append(cursorEl);
  currentCase = null;
  lenis?.start();
  if (location.hash.startsWith('#work/')) {
    if (pushed) history.back();
    else history.replaceState(null, '', location.pathname + location.search);
  }
  pushed = false;
  lastTrigger?.focus({ preventScroll: true });
});
$('[data-case-close]').addEventListener('click', () => caseEl.close());
$('[data-case-next]').addEventListener('click', (e) => {
  e.preventDefault();
  const id = e.currentTarget.getAttribute('href').slice(6);
  history.replaceState(null, '', `#work/${id}`);
  openCase(id);
});
addEventListener('hashchange', route);

/* ---------- copy email ---------- */
const copyBtn = $('[data-copy]');
copyBtn.setAttribute('aria-live', 'polite');
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(CONTACTS.email);
    copyBtn.textContent = t('contact.copied');
    setTimeout(() => (copyBtn.textContent = t('contact.copy')), 2000);
  } catch {
    location.href = `mailto:${CONTACTS.email}`;
  }
});

/* ---------- motion ---------- */
applyLang(lang);
route();

if (!reduced) {
  const fade = { f: 0 };
  hero?.setFade(0);
  gsap.timeline({ defaults: { ease: EASE } })
    .to(fade, { f: 1, duration: 2.2, ease: 'power2.out', onUpdate: () => hero?.setFade(fade.f) }, 0)
    .from('.nav > *', { opacity: 0, y: -12, duration: 1.4, stagger: 0.08 }, 0.5)
    .from($$('.ch', heroTitle), { opacity: 0, yPercent: 60, filter: 'blur(10px)', duration: 1.6, stagger: 0.035 }, 0.35)
    .from(['.hero__sub', '.hero__cta', '.badge'], { opacity: 0, y: 24, duration: 1.4, stagger: 0.12 }, 0.9);

  gsap.to('.hero__inner', {
    yPercent: -18, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: true },
  });

  // Hidden up front, revealed on enter: a gsap.from() inside onEnter would leave the element
  // visible until the trigger fires, then blink it out and back in.
  // y is relative so the CSS stagger offset on .card--cta survives.
  const reveal = (targets) => {
    gsap.set(targets, { opacity: 0, y: '+=48' });
    ScrollTrigger.batch(targets, {
      start: 'top 94%',
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: '-=48', duration: 1.4, ease: EASE, stagger: 0.09, overwrite: true }),
    });
  };
  reveal('.h2, .lead, .svc__more');
  reveal('.svc li, .steps li');
  reveal('.card__title, .card__line, .card__meta, .card--cta');

  $$('.card__media').forEach((m) => {
    gsap.fromTo(m, { scale: 0.88, opacity: 0.55 }, {
      scale: 1, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: m, start: 'top bottom', end: 'top 55%', scrub: true },
    });
  });

  gsap.from('.contact__title', {
    opacity: 0, y: 80, duration: 1.6, ease: EASE,
    scrollTrigger: { trigger: '.contact', start: 'top 55%' },
  });
  gsap.from(['.contact__lead', '.contact__mail', '.contact__links'], {
    opacity: 0, y: 32, duration: 1.4, ease: EASE, stagger: 0.1,
    scrollTrigger: { trigger: '.contact', start: 'top 45%' },
  });
}
document.fonts?.ready.then(() => ScrollTrigger.refresh());
