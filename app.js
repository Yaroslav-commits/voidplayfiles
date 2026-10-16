'use strict';
// Void Play — роутер и запуск

// ======================= router.js =======================
// Простой hash-роутер: #/home, #/upgrader, #/profile, #/referrals, #/tasks, #/leaders
const ROUTES = { home, upgrader, mines, profile, referrals, tasks, leaders, soon };
// к какому пункту нижнего меню относится экран
const NAV_OF = { home: 'home', upgrader: 'home', mines: 'home', soon: 'home', leaders: 'leaders', profile: 'profile', referrals: 'profile', tasks: 'profile' };

let cleanup = null;
let onChange = () => {};
const current = () => (location.hash.replace(/^#\/?/, '') || 'home').split('?')[0];
const go = (name) => { if (current() === name) render(); else location.hash = `#/${name}`; };
const onRoute = (fn) => { onChange = fn; };

function render() {
  let name = current();
  if (!ROUTES[name]) name = 'home';
  if (typeof cleanup === 'function') cleanup();
  closeAll();
  const root = document.getElementById('screen');
  root.style.animation = 'none'; void root.offsetWidth; root.style.animation = '';
  cleanup = ROUTES[name].render(root);
  window.scrollTo(0, 0);
  onChange(name);
}

function startRouter() {
  window.addEventListener('hashchange', render);
  render();
}

// ======================= app.js =======================
// Точка входа: загрузка → шапка/навигация → роутер → модалка подписки
window.__vpStarted = true;

// ---------- Telegram WebApp ----------
if (tg) {
  tg.ready(); tg.expand();
  try { tg.setHeaderColor('#171718'); tg.setBackgroundColor('#171718'); tg.disableVerticalSwipes?.(); } catch (e) { /* ignore */ }
}
setLang(prefs.get('lang') || (tg?.initDataUnsafe?.user?.language_code === 'en' ? 'en' : 'ru'));
window.__letterAvatar = letterAvatar;
document.querySelector('.loader__welcome').textContent = t('loader.welcome');

// ---------- Шапка ----------
function drawHead() {
  const u = api.state.user;
  $('#head').innerHTML = `
    <button class="head__balance" id="balBtn"><span class="head__coin">${icon.coin}</span><span id="balVal" data-v="${api.state.balance.stars}">${fmt(api.state.balance.stars)}</span></button>
    <button class="head__btn" id="setBtn" aria-label="settings">${icon.gear}</button>
    <button class="head__ava" id="avaBtn" aria-label="profile"><img src="${esc(api.avatarUrl(u))}" alt="" onerror="this.replaceWith(document.createElement('span'))" /></button>`;
  $('#balBtn').addEventListener('click', () => { sound(); haptic(); openPay('dep'); });
  $('#setBtn').addEventListener('click', () => { sound(); openSettings({ onLang: relocalize }); });
  $('#avaBtn').addEventListener('click', () => { sound(); go('profile'); });
}
document.addEventListener('balance', () => {
  const el = $('#balVal'); if (!el) return;
  countUp(el, api.state.balance.stars);
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
  'img/pepe.png', 'img/promo-art.png', 'img/calendar.png', 'img/bear.png', 'img/deco-0259.png', 'img/deco-0251.png', 'img/sub-hero.png',
  ...home.GAMES.map((g) => `img/game-${g.id}.webp`),
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
  // вход на сервер (initData) идёт параллельно с загрузкой картинок
  const auth = Promise.race([api.init().catch(() => false), new Promise((r) => setTimeout(() => r(false), 8000))]);
  Promise.all([Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 6000))]), minTime, auth]).then(([, , live]) => {
    clearInterval(anim); fill.style.width = '100%';
    setTimeout(() => {
      $('#loader').classList.add('is-done');
      $('#app').hidden = false;
      drawHead(); drawNav(); initLayers(); startRouter();
      setTimeout(() => $('#loader').remove(), 500);
      // Модалка подписки — при каждом входе, пока не выполнено условие
      if (!api.state.subscribed) setTimeout(openSubscribe, 500);
      if (!live && tg?.initData) setTimeout(() => toast(t('demo'), 'error'), 1200);
    }, 250);
  });
}
boot();
