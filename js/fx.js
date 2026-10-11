// Эффекты: конфетти, «счётчик» баланса, окно выигрыша
import { t } from './i18n.js';
import { esc, fmt, img, starIco, sound, haptic } from './ui.js';

const reduce = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ---------- Конфетти (canvas, без библиотек) ----------
export function confetti({ x = 0.5, y = 0.45, count = 140, colors = ['#30a1f5', '#0033ff', '#ffce00', '#ff4d6d', '#ffffff', '#18c832'] } = {}) {
  if (reduce()) return;
  const c = document.createElement('canvas');
  c.className = 'fx-confetti';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  const ox = innerWidth * x, oy = innerHeight * y;
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2, v = 5 + Math.random() * 9;
    return {
      x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6,
      w: 5 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .4,
      c: colors[Math.floor(Math.random() * colors.length)], star: Math.random() < .25, life: 0,
    };
  });
  let raf;
  const star = (s) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? s / 2.4 : s; const a = (i * Math.PI) / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
  const frame = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    for (const p of parts) {
      p.life++; p.vy += 0.32; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      if (p.y > innerHeight + 30) continue;
      alive++;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - p.life / 160); ctx.fillStyle = p.c;
      if (p.star) star(p.w); else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life / 6)));
      ctx.restore();
    }
    if (alive && parts[0].life < 170) raf = requestAnimationFrame(frame); else c.remove();
  };
  raf = requestAnimationFrame(frame);
  setTimeout(() => { cancelAnimationFrame(raf); c.remove(); }, 4000);
}

// ---------- Плавный счётчик чисел ----------
export function countUp(el, to, ms = 650) {
  if (!el) return;
  const from = Number(el.dataset.v ?? String(el.textContent).replace(/\D/g, '')) || 0;
  el.dataset.v = to;
  if (from === to || reduce()) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add(to > from ? 'is-bump' : 'is-drop');
  setTimeout(() => el.classList.remove('is-bump', 'is-drop'), 700);
}

// ---------- Окно выигрыша NFT ----------
export function winReveal(gift, { onClose } = {}) {
  const el = document.createElement('div');
  el.className = 'win-reveal';
  el.innerHTML = `
    <div class="win-reveal__rays"></div>
    <div class="win-reveal__card">
      <div class="win-reveal__glow"></div>
      ${img(gift.img, 'win-reveal__img')}
      <div class="win-reveal__label">${t('toast.win')}</div>
      <div class="win-reveal__name">${esc(gift.name)}</div>
      <div class="win-reveal__price">${fmt(gift.price)}${starIco()}</div>
      <button class="win-reveal__btn">${t('sub.btn')}</button>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-open'));
  haptic('success'); sound('win');
  setTimeout(() => confetti({ y: 0.4 }), 250);
  const close = () => {
    el.classList.remove('is-open'); setTimeout(() => el.remove(), 350);
    onClose && onClose();
  };
  el.querySelector('.win-reveal__btn').addEventListener('click', () => { sound(); close(); });
  el.addEventListener('click', (e) => { if (e.target === el) close(); });
}
