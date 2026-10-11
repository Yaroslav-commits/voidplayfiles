// Шторки и модалки: пополнение/вывод, настройки, подписка, подарки, промокод, игрок и т.д.
import { api } from './api.js';
import { CONFIG } from './config.js';
import { t, setLang, getLang } from './i18n.js';
import { icon } from './icons.js';
import { confetti } from './fx.js';
import { sheet, modal, toast, sound, haptic, esc, fmt, img, starIco, prefs, openLink, soonToast, errToast, avatarHtml, openUser, tg } from './ui.js';

const balanceChanged = () => document.dispatchEvent(new Event('balance'));

// ---------- Пополнение / вывод (Frame 198 / 199). 1 ⭐ в игре = 1 Telegram Star ----------
export function openPay(mode = 'dep') {
  const st = api.state;
  let amount = 0, pack = null, busy = false;

  const body = () => {
    const dep = mode === 'dep';
    const ton = amount ? (amount / st.rates.tonToStars).toFixed(2) : 'N';
    const usd = amount ? (amount / st.rates.usdToStars).toFixed(2) : 'N';
    const stars = amount ? fmt(amount) : 'N';
    return `
      <div class="sheet__title">${t(dep ? 'pay.depTitle' : 'pay.wdTitle')}</div>
      <div class="pay">
        <div class="seg">
          <button data-m="dep" class="${dep ? 'is-active' : ''}"><span class="ico">${icon.cardIn}</span>${t('pay.dep')}</button>
          <button data-m="wd" class="${!dep ? 'is-active' : ''}"><span class="ico">${icon.cardOut}</span>${t('pay.wd')}</button>
        </div>
        <div class="pay__bal ${dep ? '' : 'is-wd'}"><small>${t('pay.balance')}</small><b><strong>${fmt(st.balance.stars)}</strong>${starIco()}STARS</b></div>
        <div class="pay__label">${t(dep ? 'pay.depAmount' : 'pay.wdAmount')}</div>
        <label class="field"><input id="payIn" inputmode="numeric" placeholder="${t('pay.sum')}" value="${amount || ''}" /><span class="ico">${icon.star}</span></label>
        ${dep ? `<div class="pay__packs-title">${t('pay.packs')}</div>
        <div class="packs">${st.packs.map((p, i) => `<button class="pack ${pack === i ? 'is-sel' : ''}" data-p="${i}">${fmt(p.stars)}${p.bonus ? `<span class="pack__bonus">+${fmt(p.bonus)}${starIco()}</span>` : ''}</button>`).join('')}</div>` : ''}
        <button class="method method--ton" data-pay="ton"><span class="ico">${icon.diamond}</span>${ton}</button>
        <button class="method method--stars" data-pay="stars"><span class="ico">${icon.star}</span>${stars}</button>
        ${dep ? `<button class="method method--usd" data-pay="usd"><span class="ico">${icon.dollar}</span>${usd}</button>` : ''}
      </div>`;
  };

  const s = sheet(body(), { onMount: (el) => wire(el) });
  function redraw(focus) {
    s.el.innerHTML = `<div class="sheet__handle"></div>${body()}`; wire(s.el);
    if (focus) { const i = s.el.querySelector('#payIn'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  }
  function wire(el) {
    el.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { sound('tick'); mode = b.dataset.m; pack = null; redraw(); }));
    el.querySelector('#payIn').addEventListener('input', (e) => { amount = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0; pack = null; redraw(true); });
    el.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => { sound('tick'); pack = +b.dataset.p; amount = st.packs[pack].stars; redraw(); }));
    el.querySelectorAll('[data-pay]').forEach((b) => b.addEventListener('click', async () => {
      sound(); haptic();
      if (busy) return;
      if (!amount) return toast(t('pay.min'), 'error');
      const method = b.dataset.pay;
      // TON и $ подключим позже — сейчас только Telegram Stars
      if (method !== 'stars') return toast(t('pay.starsOnly'));
      busy = true;
      try {
        if (mode === 'dep') {
          const r = await api.deposit(amount);
          if (r.ok) { balanceChanged(); toast(r.credited ? t('toast.gotStars', { n: fmt(r.credited) }) : t('pay.paid'), 'success'); s.close(); confetti(); }
        } else {
          const min = api.cfg('minWithdraw', 100);
          if (amount < min) { busy = false; return toast(t('pay.minWd', { n: min }), 'error'); }
          await api.withdraw(amount, method);
          balanceChanged(); toast(t('pay.wdSent'), 'success'); s.close();
        }
      } catch (e) { errToast(e); }
      busy = false;
    }));
  }
}

// ---------- Настройки (Frame 122 + Frame 101) ----------
export function openSettings({ onLang } = {}) {
  const lang = getLang();
  const s = sheet(`
    <div class="sheet__title">${t('set.title')}</div>
    <div class="set">
      <div class="set__row"><span class="set__ico">${icon.sound}</span><span class="grow">${t('set.sounds')}</span><button class="switch ${prefs.get('sound') ? 'is-on' : ''}" id="swSound" aria-label="sound"></button></div>
      <div class="set__row set__row--col"><span>${t('set.volume')}</span><div class="vol"><input type="range" min="0" max="100" value="${prefs.get('volume')}" id="vol" /><span id="volV">${prefs.get('volume')}</span></div></div>
      <div class="set__row"><span class="set__ico">${icon.lang}</span><span class="grow">${t('set.lang')}</span>
        <div class="langs"><button data-l="ru" class="${lang === 'ru' ? 'is-active' : ''}">🇷🇺 RU</button><button data-l="en" class="${lang === 'en' ? 'is-active' : ''}">🇬🇧 EN</button></div></div>
      <button class="set__row" id="terms"><span class="set__ico">${icon.doc}</span><span class="grow">${t('set.terms')}</span><span class="ico set__chev">${icon.chevronRight}</span></button>
      <button class="btn-row" id="support">${t('set.support')}</button>
    </div>`);
  const el = s.el;
  el.querySelector('#swSound').addEventListener('click', (e) => { prefs.set('sound', !prefs.get('sound')); e.currentTarget.classList.toggle('is-on', prefs.get('sound')); sound('tick'); });
  el.querySelector('#vol').addEventListener('input', (e) => { prefs.set('volume', +e.target.value); el.querySelector('#volV').textContent = e.target.value; });
  el.querySelector('#vol').addEventListener('change', () => sound('tick'));
  el.querySelectorAll('[data-l]').forEach((b) => b.addEventListener('click', () => {
    sound('tick'); prefs.set('lang', b.dataset.l); setLang(b.dataset.l); s.close(); onLang && onLang();
  }));
  el.querySelector('#terms').addEventListener('click', () => { sound(); openLink(CONFIG.TERMS_URL); });
  el.querySelector('#support').addEventListener('click', () => { sound(); openLink(api.cfg('supportUrl', CONFIG.SUPPORT_URL)); });
}

// ---------- Подписка на канал (Frame 523) ----------
export function openSubscribe() {
  const n = api.cfg('subscribeReward', CONFIG.SUBSCRIBE_REWARD);
  const orb = (x, y, sz, o) => `<span class="sub__orb" style="left:${x}%;top:${y}%;width:${sz}px;height:${sz}px;opacity:${o}">${icon.star}</span>`;
  let waiting = false;
  const m = modal(`
    <div class="sub__hero">
      <img class="sub__heroimg" src="assets/img/sub-hero.png" alt="" onload="this.parentNode.classList.add('has-img')" onerror="this.remove()" />
      ${orb(-4, 30, 70, .9)}${orb(78, 46, 72, .9)}${orb(52, -22, 52, .55)}
      <div class="sub__pill"><span class="ico">${icon.star}</span>${n}</div></div>
    <div class="sub__title">${t('sub.title', { n })}</div>
    <div class="steps">
      <div class="steps__row"><span class="steps__n">1</span>${t('sub.s1')}</div>
      <div class="steps__row"><span class="steps__n">2</span>${t('sub.s2')}</div>
      <div class="steps__row"><span class="steps__n">3</span>${t('sub.s3')}</div>
    </div>
    <button class="btn-pink" id="subBtn">${t('sub.btn')}</button>`, { closeDelay: CONFIG.MODAL_CLOSE_DELAY, cls: 'modal--sub', onClose: () => document.removeEventListener('visibilitychange', onBack) });

  const btn = m.el.querySelector('#subBtn');
  async function check() {
    if (!waiting) return; waiting = false;
    btn.disabled = true; btn.textContent = t('sub.checking');
    try {
      const r = await api.checkSubscription();
      balanceChanged();
      if (r.reward) { toast(t('toast.gotStars', { n: r.reward }), 'success'); confetti(); }
      m.close();
    } catch (e) {
      btn.disabled = false; btn.textContent = t('sub.btn'); errToast(e);
    }
  }
  function onBack() { if (document.visibilityState === 'visible') setTimeout(check, 600); }
  document.addEventListener('visibilitychange', onBack);
  btn.addEventListener('click', () => {
    sound(); haptic();
    waiting = true; openLink(api.cfg('channelUrl', CONFIG.CHANNEL_URL));
    setTimeout(check, 5000);
  });
}

// ---------- Как добавить подарок (Frame 424) ----------
export function openAddGift() {
  const acc = api.cfg('giftsAccount', CONFIG.GIFTS_ACCOUNT);
  const s = sheet(`
    <div class="gift-add">
      <div class="gift-add__title">${t('gift.title')}</div>
      <div class="warn"><b>${t('gift.warnTitle')}</b><p>${t('gift.warnText')}</p></div>
      <div class="gsteps">
        <div class="gsteps__row"><span class="gsteps__n">1</span><span>${t('gift.s1', { acc: `<a href="#" id="giftAcc">${esc(acc)}</a>` })}</span></div>
        <div class="gsteps__row"><span class="gsteps__n">2</span><span>${t('gift.s2')}</span></div>
        <div class="gsteps__row"><span class="gsteps__n">3</span><span>${t('gift.s3')}</span></div>
        <div class="gsteps__row"><span class="gsteps__n">4</span><span>${t('gift.s4')}</span></div>
      </div>
    </div>`, { cls: 'sheet--plain' });
  s.el.querySelector('#giftAcc').addEventListener('click', (e) => { e.preventDefault(); openLink(`https://t.me/${acc.replace('@', '')}`); });
}

// ---------- Выбор NFT из списка (Frame 419) ----------
export function openNftPicker({ title, items, selected, key = 'id', onPick }) {
  const s = sheet(`
    <div class="sheet__title">${esc(title)}</div>
    <div class="nft-grid">${items.map((n) => `
      <button class="gcard ${n[key] === selected ? 'is-sel' : ''}" data-k="${esc(n[key])}">${img(n.img)}<span class="gcard__name">${esc(n.name)}</span><span class="gcard__val">${starIco()}${fmt(n.price)}</span></button>`).join('')}</div>`);
  s.el.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
    sound('tick'); haptic(); onPick(items.find((n) => String(n[key]) === b.dataset.k)); s.close();
  }));
}

// ---------- Весь инвентарь ----------
export function openInventory() {
  const inv = api.state.inventory;
  sheet(`<div class="sheet__title">${t('prof.inventory')}</div>
    ${inv.length ? `<div class="nft-grid">${inv.map((n) => `<div class="gcard">${img(n.img)}<span class="gcard__name">${esc(n.name)}</span><span class="gcard__val">${starIco()}${fmt(n.price)}</span></div>`).join('')}</div>`
    : `<div class="inv__box is-empty" style="width:100%">${t('common.empty')}</div>`}`);
}

// ---------- Карточка игрока (из LIVE-ленты) ----------
export function openPlayer(win) {
  const u = win.user || {};
  const s = sheet(`
    <div class="player">
      ${avatarHtml(u, api.avatarUrl(u), 'player__ava')}
      <div class="player__name">${esc(u.name || u.username)}</div>
      ${u.username ? `<div class="player__user">@${esc(u.username)}</div>` : ''}
      ${win.gift ? `<div class="player__win">${img(win.gift.img)}<span>${t('player.won')} <b>${esc(win.gift.name)}</b><em>${fmt(win.price ?? win.gift.price)}${starIco()}</em></span></div>` : ''}
      <button class="btn-blue player__dm" id="dmBtn" ${u.username ? '' : 'disabled'}>${u.username ? t('player.dm') : t('player.noUser')}</button>
    </div>`);
  s.el.querySelector('#dmBtn').addEventListener('click', () => openUser(u.username));
}

// ---------- Реферальные уровни (Frame 496) ----------
const GLOWS = [['#ffbbb9', '#ff9696'], ['#ff7c00', '#ff7c00'], ['#e552ff', '#e253ff'], ['#4d96ce', '#fff1c3'], ['#ffcc00', '#ffc300'], ['#6cf967', '#11ff00']];
export function levels() {
  const L = api.state.levels || [{ n: 1, pct: 5, from: 0 }, { n: 2, pct: 7, from: 1000 }, { n: 3, pct: 10, from: 5000 }, { n: 4, pct: 12, from: 15000 }, { n: 5, pct: 15, from: 50000 }, { n: 6, pct: 20, from: 150000 }];
  return L.map((x, i) => ({ ...x, g1: GLOWS[i % 6][0], g2: GLOWS[i % 6][1] }));
}
export const levelCard = (L, imgSrc = `assets/img/levels/${L.n}.png`) => `
  <div class="lvl">
    <span class="lvl__glow1" style="background:${L.g1}"></span><span class="lvl__glow2" style="background:${L.g2}"></span>
    ${img(imgSrc, 'lvl__img', '', true)}
    <div class="lvl__txt"><b>${t('ref.levelN', { n: L.n })}</b><span>${t('ref.percent', { n: L.pct })}</span><small>${t('ref.from', { n: fmt(L.from) })}</small></div>
  </div>`;
export function openLevels() {
  sheet(`<div class="sheet__title">${t('ref.levels')}</div><div class="levels">${levels().map((L) => levelCard(L)).join('')}</div>`);
}

// ---------- Промокод ----------
export function openPromo() {
  const s = sheet(`
    <div class="sheet__title">${t('promo.sheetTitle')}</div>
    <div class="promo-form">
      <label class="field"><input id="promoIn" placeholder="${t('promo.placeholder')}" autocomplete="off" /></label>
      <button class="btn-white" id="promoGo">${t('promo.btn')}</button>
    </div>`);
  const inp = s.el.querySelector('#promoIn');
  s.el.querySelector('#promoGo').addEventListener('click', async () => {
    sound();
    if (!inp.value.trim()) return;
    try {
      const reward = await api.activatePromo(inp.value);
      balanceChanged(); toast(t('toast.gotStars', { n: reward }), 'success'); s.close();
    } catch (e) {
      if (e.code === 'not_found') toast(t('promo.invalid'), 'error'); else errToast(e);
    }
  });
}

// ---------- Реферальная ссылка ----------
export function shareRef() {
  const url = `https://t.me/share/url?url=${encodeURIComponent(api.refLink())}&text=${encodeURIComponent(t('prof.shareText'))}`;
  openLink(url);
}

export async function copyRef() {
  const link = api.refLink();
  try { await navigator.clipboard.writeText(link); } catch (e) {
    const ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (err) { /* ignore */ } ta.remove();
  }
  haptic('success'); toast(t('common.copied'), 'success');
}

// ---------- Кошелёк TON ----------
// TODO: TON Connect (@tonconnect/ui) + проверка платежей через TON Center на бэке
export function connectWallet() { soonToast(); }

export { tg };
