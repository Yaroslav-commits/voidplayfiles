'use strict';
// Роутер, шапка, нижнее меню, загрузка и связь с сервером

// ======================= роутер =======================
const ROUTES = { home, upgrader, mines, pvp, leaders, bonus, profile, referrals };
const ALIAS = { tasks: 'bonus' };
const NAV_OF = { home: 'home', upgrader: 'home', mines: 'home', pvp: 'pvp', leaders: 'leaders', bonus: 'bonus', profile: 'profile', referrals: 'profile' };
// экран → игра, которую админ может закрыть из бота
const GAME_OF = { upgrader: 'upgrade', mines: 'mines' };

let cleanup = null;
const current = () => { const n = (location.hash.replace(/^#\/?/, '') || 'home').split('?')[0]; return ALIAS[n] || n; };
const go = (name) => { if (current() === name) render(); else location.hash = `#/${name}`; };

function render() {
  let name = current();
  if (!ROUTES[name]) name = 'home';
  if (GAME_OF[name] && !api.gameOpen(GAME_OF[name]) && !(name === 'mines' && api.state.mines)) {
    toast(t('game.closedToast')); name = 'home';
    if (current() !== 'home') { history.replaceState(null, '', '#/home'); }
  }
  if (typeof cleanup === 'function') cleanup();
  closeAll();
  const root = $('#screen');
  root.className = `screen screen--${name}`;
  root.style.animation = 'none'; void root.offsetWidth; root.style.animation = '';
  cleanup = ROUTES[name].render(root);
  window.scrollTo(0, 0);
  drawNav(NAV_OF[name] || 'home');
  syncOverlay();
}
const rerender = () => render();

// ======================= Telegram =======================
if (tg) {
  try {
    tg.ready(); tg.expand();
    tg.setHeaderColor?.('#06060b'); tg.setBackgroundColor?.('#06060b'); tg.setBottomBarColor?.('#06060b');
    tg.disableVerticalSwipes?.();
  } catch (e) { /* старые клиенты */ }
}
setLang(prefs.get('lang') || (tg?.initDataUnsafe?.user?.language_code?.startsWith('ru') === false ? 'en' : 'ru'));

// ======================= шапка =======================
function drawHead() {
  const u = api.state.user;
  $('#head').innerHTML = `
    <button class="top__me" id="meBtn">
      <span class="top__ava">${avatarHtml(u)}</span>
      <span class="top__who"><b>${esc(u.name || CONFIG.APP_NAME)}</b><small><span class="netdot is-${conn.status}"></span>${esc(CONFIG.APP_NAME)}</small></span>
    </button>
    <button class="bal" id="balBtn">
      <span class="bal__star">${icon.star}</span>
      <span class="bal__v" id="balVal" data-v="${api.state.balance.stars}">${fmt(api.state.balance.stars)}</span>
      <span class="bal__plus">${icon.plus}</span>
    </button>`;
  $('#balBtn').addEventListener('click', () => { sound(); haptic(); openPay('dep'); });
  $('#meBtn').addEventListener('click', () => { sound(); haptic(); go('profile'); });
}
document.addEventListener('balance', () => countUp($('#balVal'), api.state.balance.stars));

// ======================= нижнее меню =======================
const NAV = [['home', 'nav.home', icon.games], ['leaders', 'nav.leaders', icon.trophy], ['pvp', 'nav.pvp', icon.swords], ['bonus', 'nav.bonus', icon.gift], ['profile', 'nav.profile', icon.user]];
let navActive = '';
function drawNav(active = 'home') {
  if (navActive === active && $('#nav').children.length) return;
  navActive = active;
  $('#nav').innerHTML = `<div class="dock">${NAV.map(([id, key, ic]) =>
    `<button class="dock__i ${id === 'pvp' ? 'dock__i--pvp' : ''} ${id === active ? 'is-active' : ''}" data-go="${id}"><span class="dock__ico">${ic}</span><span class="dock__t">${t(key)}</span></button>`).join('')}</div>`;
  $$('#nav [data-go]').forEach((b) => b.addEventListener('click', () => { sound(); haptic('select'); go(b.dataset.go); }));
}
function relocalize() { navActive = ''; drawHead(); render(); }

// ======================= связь =======================
function netbar(text, kind) {
  const el = $('#netbar');
  if (!text) { el.classList.remove('is-on'); return; }
  el.className = `netbar netbar--${kind} is-on`;
  el.innerHTML = `${kind === 'off' ? icon.wifiOff : icon.check}<span>${text}</span>`;
}
conn.on((s, prev) => {
  $$('.netdot').forEach((d) => { d.className = `netdot is-${s}`; });
  if (s === 'offline') netbar(t('conn.lost'), 'off');
  else if (s === 'online' && prev === 'offline') { netbar(t('conn.back'), 'ok'); setTimeout(() => netbar(''), 1800); }
});
// вернулись в приложение (после оплаты, канала и т.п.) — обновляем данные
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && api.live) api.refresh().catch(() => {});
});
window.addEventListener('online', () => api.live && api.refresh().catch(() => {}));
// раз в минуту подтягиваем свежие данные: цены подарков, открытые/закрытые игры, баланс
setInterval(() => { if (api.live && !document.hidden && conn.status === 'online') api.refresh().catch(() => {}); }, 60000);
// игру закрыли, пока игрок в ней — возвращаем на главную
document.addEventListener('state', () => {
  const g = GAME_OF[current()];
  if (g && !api.gameOpen(g) && !(g === 'mines' && api.state.mines)) go('home');
});

// Экран «нет связи» вместо приложения (только в Telegram, когда сервер не ответил при входе)
function showOffline(err) {
  const box = $('#bootMsg');
  const code = err?.code || 'network';
  box.innerHTML = `
    <div class="bootoff">
      <span class="bootoff__ico">${code === 'auth' ? icon.lock : icon.wifiOff}</span>
      <b>${code === 'auth' ? t('err.auth') : t('conn.offTitle')}</b>
      <p>${code === 'auth' ? '' : t('conn.offText')}</p>
      <button class="btn btn--primary btn--lg" id="retryBtn">${t('common.retry')}</button>
      <details><summary>${t('conn.details')}</summary><code>${esc(CONFIG.API_BASE || location.origin)}/api/health · ${esc(code)}</code></details>
    </div>`;
  $('#loader').classList.add('is-error');
  $('#retryBtn').addEventListener('click', () => { haptic(); $('#loader').classList.remove('is-error'); box.innerHTML = ''; boot(); });
  // пробуем переподключиться сами
  clearTimeout(showOffline.t);
  showOffline.t = setTimeout(() => { if ($('#loader')?.classList.contains('is-error') && code !== 'auth') $('#retryBtn')?.click(); }, 8000);
}

// ======================= загрузка =======================
const PRELOAD = [
  'img/gifts/pepe.webp', 'img/gifts/gift-126.webp', 'img/gifts/gift-074.webp', 'img/deco/calendar.webp', 'img/deco/bear.webp',
  'img/deco/0259.webp', 'img/deco/0543.webp', ...home.GAMES.map((g) => `img/games/${g.id}.webp`),
];
let started = false;
function boot() {
  const fill = $('#loaderFill');
  let done = 0; let shown = 0;
  const loads = PRELOAD.map((src) => new Promise((res) => { const im = new Image(); im.onload = im.onerror = () => { done++; res(); }; im.src = src; }));
  const anim = setInterval(() => {
    const target = Math.max(done / PRELOAD.length, 0.12) * 92;
    shown += (target - shown) * 0.2; fill.style.width = `${Math.min(100, shown)}%`;
  }, 50);
  const minTime = wait(900);
  const auth = api.init().then(() => null, (e) => e);
  Promise.all([Promise.race([Promise.all(loads), wait(5000)]), minTime, auth]).then(([, , err]) => {
    clearInterval(anim);
    if (err) { fill.style.width = '0%'; api.lastError = err; return showOffline(err); }
    fill.style.width = '100%';
    setTimeout(start, 220);
  });
}
function start() {
  $('#loader').classList.add('is-done');
  $('#app').hidden = false;
  drawHead();
  if (!started) {
    started = true;
    $('#overlay').addEventListener('click', closeTop);
    tg?.BackButton?.onClick(() => { if (!closeTop()) history.length > 1 ? history.back() : go('home'); });
    window.addEventListener('hashchange', render);
  }
  render();
  setTimeout(() => $('#loader')?.remove(), 600);
  if (conn.status === 'demo') { setTimeout(() => netbar(t('conn.demo'), 'demo'), 900); setTimeout(() => conn.status === 'demo' && netbar(''), 6000); }
  if (!api.state.subscribed) setTimeout(openSubscribe, 900);
}
window.__vpStarted = true;
boot();
