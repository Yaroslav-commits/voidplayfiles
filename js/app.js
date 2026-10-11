// Точка входа: загрузка → шапка/навигация → роутер → модалка подписки
import { api, initUser } from './api.js';
import { t, setLang } from './i18n.js';
import { icon } from './icons.js';
import { $, esc, fmt, img, sound, haptic, prefs, tg, initLayers } from './ui.js';
import { openPay, openSettings, openSubscribe } from './sheets.js';
import { startRouter, render as rerender, go, onRoute, NAV_OF } from './router.js';
import { GAMES } from './screens/home.js';

// ---------- Telegram WebApp ----------
if (tg) {
  tg.ready(); tg.expand();
  try { tg.setHeaderColor('#171718'); tg.setBackgroundColor('#171718'); tg.disableVerticalSwipes?.(); } catch (e) { /* ignore */ }
}
setLang(prefs.get('lang') || (tg?.initDataUnsafe?.user?.language_code === 'en' ? 'en' : 'ru'));
initUser();
document.querySelector('.loader__welcome').textContent = t('loader.welcome');

// ---------- Шапка ----------
function drawHead() {
  const u = api.state.user;
  $('#head').innerHTML = `
    <button class="head__balance" id="balBtn"><span class="head__coin">${icon.star}</span><span id="balVal">${fmt(api.state.balance.stars)}</span></button>
    <button class="head__btn" id="setBtn" aria-label="settings">${icon.gear}</button>
    <button class="head__ava" id="avaBtn" aria-label="profile">${u.photo ? img(u.photo) : '<span></span>'}</button>`;
  $('#balBtn').addEventListener('click', () => { sound(); haptic(); openPay('dep'); });
  $('#setBtn').addEventListener('click', () => { sound(); openSettings({ onLang: relocalize }); });
  $('#avaBtn').addEventListener('click', () => { sound(); go('profile'); });
}
document.addEventListener('balance', () => {
  const el = $('#balVal'); if (!el) return;
  el.textContent = fmt(api.state.balance.stars);
  el.animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 300 });
});

// ---------- Нижнее меню ----------
const NAV = [['home', 'nav.home', icon.home], ['leaders', 'nav.leaders', icon.leaders], ['profile', 'nav.profile', icon.profile]];
function drawNav(active = 'home') {
  $('#nav').innerHTML = NAV.map(([id, key, ic]) =>
    `<button class="nav__item ${id === active ? 'is-active' : ''}" data-go="${id}"><span class="ico">${ic}</span>${t(key)}</button>`).join('');
  $('#nav').querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { sound(); haptic(); go(b.dataset.go); }));
}
onRoute((name) => drawNav(NAV_OF[name] || 'home'));

function relocalize() { drawHead(); rerender(); }

// ---------- Загрузка: прогресс = предзагрузка картинок ----------
const PRELOAD = [
  'assets/img/logo.png', 'assets/img/nft/pepe.png', 'assets/img/promo-art.png', 'assets/img/deco/calendar.png', 'assets/img/deco/bear.png',
  ...GAMES.map((g) => `assets/img/games/${g.id}.png`),
];
function boot() {
  const fill = $('#loaderFill');
  let done = 0; const total = PRELOAD.length; let shown = 0;
  const minTime = new Promise((r) => setTimeout(r, 1400));
  const loads = PRELOAD.map((src) => new Promise((res) => {
    const im = new Image(); im.onload = im.onerror = () => { done++; res(); }; im.src = src;
  }));
  const anim = setInterval(() => {
    const target = Math.max(done / total, 0.15) * 100;
    shown += (target - shown) * 0.25; fill.style.width = `${Math.min(100, shown)}%`;
  }, 60);
  Promise.all([Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 6000))]), minTime]).then(() => {
    clearInterval(anim); fill.style.width = '100%';
    setTimeout(() => {
      $('#loader').classList.add('is-done');
      $('#app').hidden = false;
      drawHead(); drawNav(); initLayers(); startRouter();
      setTimeout(() => $('#loader').remove(), 500);
      // Модалка подписки — при каждом входе, пока не выполнено условие
      if (!api.state.subscribed) setTimeout(openSubscribe, 500);
    }, 250);
  });
}
boot();
