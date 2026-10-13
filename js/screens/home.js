// Главная: LIVE-лента, карусель бонусов, промокод, сетка игр
import { api } from '../api.js';
import { CONFIG } from '../config.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, fmt, img, sound, toast, soonToast, starIco, haptic, errToast } from '../ui.js';
import { openPay, openPromo, shareRef, connectWallet, openPlayer } from '../sheets.js';
import { go } from '../router.js';
import { confetti } from '../fx.js';

const D = 'assets/img/deco/';
// Декор слайдов: [файл, x, y, w, h, rotation°, opacity] — координаты из Figma (Section 1)
const SLIDES = [
  { id: 'daily', c: 'blue', deco: [['calendar', 158, 89, 99, 99, 23, .9], ['calendar', 273, 129, 83, 83, 66, .3], ['calendar', 346, 24, 52, 52, 137, .5]] },
  { id: 'invite', c: 'pink', deco: [['bear', 154, 21, 177, 176, 5, .3], ['bear', 408, 62, 116, 115, 161, .7], ['bear', 213, 22, 139, 138, -40, .5]] },
  { id: 'wallet', c: 'blue', deco: [['deco-0259', 283, 21, 61, 61, 51, .6], ['deco-0259', 186, 53, 112, 112, 7, .4], ['deco-0259', 310, 65, 71, 71, -20, .7]] },
  { id: 'deposit', c: 'blue', deco: [['deco-0543', 295, 10, 49, 49, 35, .3], ['deco-0543', 210, 80, 56, 56, -33, .4], ['deco-0259', 230, 55, 120, 120, 7, .9], ['deco-0259', 267, -13, 37, 37, -38, .9]] },
  { id: 'spins', c: 'pink', deco: [['deco-0251', 348, -5, 77, 77, -124, .8], ['deco-0251', 162, 75, 100, 100, 15, .5], ['deco-0251', 305, 118, 62, 62, -34, .7]] },
  { id: 'firstwin', c: 'pink', deco: [['deco-0251', 209, 7, 71, 71, -52, .2], ['deco-0249', 220, 72, 110, 110, 17, .3], ['deco-0249', 333, 43, 51, 51, 131, .4]] },
  { id: 'friendpay', c: 'blue', deco: [['deco-0259', 270, 60, 61, 61, 127, .3], ['deco-0246', 316, 61, 66, 66, -28, .5], ['deco-0311', 139, 72, 143, 96, 9, .6]] },
  { id: 'week', c: 'pink', deco: [['deco-0251', 283, 118, 69, 69, -52, .3], ['deco-0249', 168, 84, 89, 89, 18, .3]] },
];

export const GAMES = [
  { id: 'mines', c: 'blue' }, { id: 'lottery', c: 'pink' },
  { id: 'cases', c: 'pink' }, { id: 'crash', c: 'blue' },
  { id: 'upgrade', c: 'blue', route: 'upgrader' }, { id: 'waterball', c: 'pink' },
  { id: 'ball', c: 'pink' }, { id: 'hockey', c: 'blue' },
];

const RARITY = ['#30a1f5', '#a855f7', '#ffce00', '#18c832', '#ff1c42'];

// Элемент LIVE-ленты: подарок, цена и аватарка игрока (тап — карточка игрока с переходом в ЛС)
function winItem(w, isNew) {
  const rar = RARITY[w.price % RARITY.length];
  const u = w.user || {};
  return `<button class="win-item ${isNew ? 'is-new' : ''}" style="--rar:${rar}" data-win="${esc(w.id)}" title="${esc(u.username ? '@' + u.username : u.name)} · ${esc(w.gift.name)}">
    ${img(w.gift.img)}<img class="win-item__ava" src="${esc(api.avatarUrl(u))}" alt="" onerror="this.remove()" />
    <div class="win-item__val">${fmt(w.price)}${starIco()}</div></button>`;
}

const slideHtml = (s) => `
  <div class="slide slide--${s.c}" data-id="${s.id}">
    ${s.deco.map(([f, x, y, w, h, r, o]) => `<img class="slide__deco" src="${D + f}.png" alt="" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:rotate(${-r}deg);opacity:${o}" onerror="this.remove()" />`).join('')}
    <div class="slide__txt"><div class="slide__title">${t(`bonus.${s.id}.title`)}</div><div class="slide__text">${t(`bonus.${s.id}.text`)}</div></div>
    <button class="slide__btn" data-act="${s.id}">${t(`bonus.${s.id}.btn`)}</button>
  </div>`;

export function render(root) {
  root.innerHTML = `
    <button class="connect-btn" id="connectBtn">${t('common.connect')}</button>
    <section class="wins">
      <div class="live"><span>LIVE <i class="ico">${icon.live}</i></span></div>
      <div class="wins__list" id="winsList"></div>
    </section>

    <section class="bonus">
      <div class="bonus__viewport" id="bonusVp"><div class="bonus__track" id="bonusTrack">${SLIDES.map(slideHtml).join('')}</div></div>
      <div class="bonus__dots" id="bonusDots">${SLIDES.map((_, i) => `<button class="bonus__dot" data-i="${i}" aria-label="${i + 1}"><i></i></button>`).join('')}</div>
    </section>

    <section class="promo" id="promo">
      <img class="promo__art" src="assets/img/promo-art.png" alt="" onerror="this.closest('.promo').classList.add('no-art');this.remove()" />
      <div class="promo__word">VOID PLAY</div>
      <div class="promo__title">${t('promo.title')}</div>
      <div class="promo__text">${t('promo.text')}</div>
      <button class="promo__btn" id="promoBtn">${t('promo.btn')}</button>
    </section>

    <section class="games">
      ${GAMES.map((g) => `
        <button class="game game--${g.c}" data-game="${g.id}">
          <img class="game__img" src="assets/img/games/${g.id}.png" alt="" onload="this.parentNode.classList.add('has-img')" onerror="this.remove()" />
          <span class="game__big">${t('game.' + g.id).toUpperCase()}</span>
          <span class="game__name">${t('game.' + g.id)}</span>
        </button>`).join('')}
    </section>`;

  // --- LIVE-лента: реальные выигрыши с сервера; новые въезжают слева
  const list = root.querySelector('#winsList');
  const known = new Map();
  let liveTimer, alive = true;
  const add = (w, isNew) => { known.set(String(w.id), w); list.insertAdjacentHTML(isNew ? 'afterbegin' : 'beforeend', winItem(w, isNew)); };
  const trim = () => { while (list.children.length > 15) list.lastElementChild.remove(); };
  const loadFeed = async () => {
    try {
      const items = await api.feed();
      if (!alive) return;
      if (!known.size) items.forEach((w) => add(w, false));
      else items.filter((w) => !known.has(String(w.id))).reverse().forEach((w) => add(w, true));
      if (!items.length && !list.children.length) list.innerHTML = `<div class="wins__empty">${t('feed.empty')}</div>`;
      else list.querySelector('.wins__empty')?.remove();
      trim();
    } catch (e) { /* сеть моргнула — попробуем позже */ }
  };
  const tick = async () => {
    if (api.live) await loadFeed();
    else { add(api.demoWin(), true); trim(); }
    if (alive) liveTimer = setTimeout(tick, api.live ? CONFIG.FEED_POLL : 3000 + Math.random() * 3000);
  };
  loadFeed().then(() => { if (alive) liveTimer = setTimeout(tick, 2500); });
  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-win]'); if (!b) return;
    sound(); const w = known.get(b.dataset.win); if (w) openPlayer(w);
  });

  // --- Карусель: каждые 30 c заполняется полоска и листается вправо
  const track = root.querySelector('#bonusTrack');
  const dots = [...root.querySelectorAll('.bonus__dot')];
  let idx = 0, timer;
  const show = (i) => {
    idx = (i + SLIDES.length) % SLIDES.length;
    track.style.transform = `translateX(${-idx * 100}%)`;
    dots.forEach((d, k) => {
      d.classList.remove('is-active');
      const bar = d.firstElementChild; bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
      if (k === idx) { d.classList.add('is-active'); bar.style.animationDuration = `${CONFIG.BONUS_INTERVAL}ms`; }
    });
    clearTimeout(timer);
    timer = setTimeout(() => show(idx + 1), CONFIG.BONUS_INTERVAL);
  };
  show(0);
  dots.forEach((d) => d.addEventListener('click', () => { sound('tick'); show(+d.dataset.i); }));

  // свайп
  const vp = root.querySelector('#bonusVp');
  let x0 = null, dx = 0;
  vp.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; dx = 0; track.style.transition = 'none'; }, { passive: true });
  vp.addEventListener('touchmove', (e) => { if (x0 === null) return; dx = e.touches[0].clientX - x0; track.style.transform = `translateX(calc(${-idx * 100}% + ${dx}px))`; }, { passive: true });
  vp.addEventListener('touchend', () => {
    track.style.transition = '';
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); else show(idx);
    x0 = null;
  });

  // кнопки слайдов
  track.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    sound(); haptic();
    const act = b.dataset.act;
    if (act === 'daily') {
      try {
        const reward = await api.claimDaily();
        document.dispatchEvent(new Event('balance'));
        toast(t('toast.gotStars', { n: reward }), 'success'); confetti({ y: 0.25, count: 90 });
      } catch (err) {
        if (err.code === 'already') toast(t('bonus.daily.taken'), 'error'); else errToast(err);
      }
    } else if (act === 'invite' || act === 'friendpay') shareRef();
    else if (act === 'wallet') connectWallet();
    else if (act === 'deposit') openPay('dep');
    else soonToast();
  });

  root.querySelector('#promoBtn').addEventListener('click', () => { sound(); openPromo(); });
  root.querySelector('#connectBtn').addEventListener('click', () => { sound(); connectWallet(); });
  root.querySelectorAll('.game').forEach((el) => el.addEventListener('click', () => {
    sound(); haptic();
    const g = GAMES.find((x) => x.id === el.dataset.game);
    go(g.route || 'soon');
  }));

  return () => { alive = false; clearTimeout(timer); clearTimeout(liveTimer); };
}
