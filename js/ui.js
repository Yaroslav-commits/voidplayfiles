// Общие UI-хелперы: тосты, шторки, модалки, звук, хаптика, Telegram
import { CONFIG } from './config.js';
import { icon } from './icons.js';
import { t } from './i18n.js';

export const tg = window.Telegram?.WebApp;
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
export const starIco = (cls = '') => `<span class="ico ico-star ${cls}">${icon.star}</span>`;

// Картинка с запасным вариантом, если файла ещё нет в assets
// deco=true — декоративная картинка: если файла нет, просто убираем её
export const img = (src, cls = '', alt = '', deco = false) =>
  `<img class="${cls}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="${deco ? 'this.remove()' : "if(!this.dataset.f){this.dataset.f=1;this.src='assets/img/placeholder.svg'}else{this.classList.add('img-missing')}"}" />`;

// ---------- Настройки (звук/громкость/язык) ----------
export const prefs = (() => {
  let p = { sound: true, volume: 100, lang: 'ru' };
  try { p = { ...p, ...JSON.parse(localStorage.getItem('vp_prefs') || '{}') }; } catch (e) { /* ignore */ }
  return {
    get: (k) => p[k],
    set: (k, v) => { p[k] = v; try { localStorage.setItem('vp_prefs', JSON.stringify(p)); } catch (e) { /* ignore */ } },
  };
})();

// ---------- Звук (простые синтезированные клики, без файлов) ----------
let actx;
export function sound(type = 'tap') {
  if (!prefs.get('sound')) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const vol = (prefs.get('volume') / 100) * 0.15;
    const o = actx.createOscillator(); const g = actx.createGain();
    const now = actx.currentTime;
    const map = { tap: [520, 0.05], win: [880, 0.25], lose: [180, 0.3], tick: [1200, 0.02] };
    const [f, d] = map[type] || map.tap;
    o.type = type === 'lose' ? 'sawtooth' : 'sine';
    o.frequency.setValueAtTime(f, now);
    if (type === 'win') o.frequency.exponentialRampToValueAtTime(f * 1.6, now + d);
    if (type === 'lose') o.frequency.exponentialRampToValueAtTime(f * 0.5, now + d);
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + d);
    o.connect(g).connect(actx.destination); o.start(now); o.stop(now + d);
  } catch (e) { /* ignore */ }
}

export function haptic(kind = 'light') {
  const h = tg?.HapticFeedback; if (!h) return;
  if (kind === 'success' || kind === 'error' || kind === 'warning') h.notificationOccurred(kind);
  else h.impactOccurred(kind);
}

export function openLink(url) {
  if (!url) return;
  if (/^https:\/\/t\.me\//.test(url) && tg?.openTelegramLink) tg.openTelegramLink(url);
  else if (tg?.openLink) tg.openLink(url);
  else window.open(url, '_blank');
}

// ---------- Тосты (справа сверху, полоска убывает за 3 c, улетает вправо) ----------
export function toast(text, kind = 'info') {
  const wrap = $('#toasts');
  const el = document.createElement('div');
  el.className = `toast toast--${kind}`;
  el.innerHTML = `<span class="toast__text">${esc(text)}</span><span class="toast__bar" style="animation-duration:${CONFIG.TOAST_MS}ms"></span>`;
  wrap.prepend(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  if (kind === 'win' || kind === 'success') haptic('success');
  if (kind === 'lose' || kind === 'error') haptic('error');
  setTimeout(() => {
    el.classList.remove('is-in'); el.classList.add('is-out');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 600);
  }, CONFIG.TOAST_MS);
}

// ---------- Шторки снизу и модалки ----------
const stack = [];
function syncOverlay() {
  const ov = $('#overlay');
  ov.hidden = stack.length === 0;
  document.body.classList.toggle('is-locked', stack.length > 0);
  if (tg?.BackButton) stack.length ? tg.BackButton.show() : tg.BackButton.hide();
}

export function closeTop() {
  const top = stack[stack.length - 1];
  if (top && top.closable()) top.close();
}

export function sheet(html, { onClose, cls = '', onMount } = {}) {
  const el = document.createElement('div');
  el.className = `sheet ${cls}`;
  el.innerHTML = `<div class="sheet__handle"></div>${html}`;
  document.body.appendChild(el);
  const entry = {
    el, closable: () => true,
    close() {
      const i = stack.indexOf(entry); if (i >= 0) stack.splice(i, 1);
      el.classList.remove('is-open');
      setTimeout(() => el.remove(), 300);
      syncOverlay(); onClose && onClose();
    },
  };
  stack.push(entry); syncOverlay();
  requestAnimationFrame(() => el.classList.add('is-open'));
  // свайп вниз за ручку
  let y0 = null, dy = 0;
  const handle = el.querySelector('.sheet__handle');
  el.addEventListener('touchstart', (e) => { if (e.target === handle || el.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
  el.addEventListener('touchmove', (e) => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); el.style.transform = `translateY(${dy}px)`; }, { passive: true });
  el.addEventListener('touchend', () => { if (y0 === null) return; el.style.transform = ''; if (dy > 90) entry.close(); y0 = null; });
  onMount && onMount(el, entry);
  return entry;
}

// Модалка по центру. closeDelay — крестик заполняется N мс и только потом закрывает
export function modal(html, { closeDelay = 0, onClose, cls = '', onMount } = {}) {
  const el = document.createElement('div');
  el.className = `modal ${cls}`;
  const R = 17, C = 2 * Math.PI * R;
  el.innerHTML = `
    <button class="modal__close ${closeDelay ? 'is-locked' : ''}" aria-label="close">
      <svg class="modal__ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="${R}" style="stroke-dasharray:${C};stroke-dashoffset:${closeDelay ? C : 0};transition-duration:${closeDelay}ms"/></svg>
      ${icon.close}
    </button>
    <div class="modal__card">${html}</div>`;
  document.body.appendChild(el);
  let unlocked = !closeDelay;
  const entry = {
    el, closable: () => unlocked,
    close() {
      const i = stack.indexOf(entry); if (i >= 0) stack.splice(i, 1);
      el.classList.remove('is-open'); setTimeout(() => el.remove(), 300);
      syncOverlay(); onClose && onClose();
    },
  };
  stack.push(entry); syncOverlay();
  requestAnimationFrame(() => {
    el.classList.add('is-open');
    if (closeDelay) {
      requestAnimationFrame(() => { el.querySelector('.modal__ring circle').style.strokeDashoffset = 0; });
      setTimeout(() => { unlocked = true; el.querySelector('.modal__close').classList.remove('is-locked'); }, closeDelay);
    }
  });
  el.querySelector('.modal__close').addEventListener('click', () => { if (unlocked) { sound(); entry.close(); } });
  el.addEventListener('click', (e) => { if (e.target === el && unlocked) entry.close(); });
  onMount && onMount(el, entry);
  return entry;
}

export function initLayers() {
  $('#overlay').addEventListener('click', closeTop);
  tg?.BackButton?.onClick(() => closeTop());
}

export const soonToast = () => toast(t('common.soonToast'));
