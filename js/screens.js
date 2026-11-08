'use strict';
// Шторки, модалки и все экраны

const balanceChanged = () => document.dispatchEvent(new Event('balance'));
const pageHead = (title, helpId) => `
  <div class="page-h">
    <button class="icon-btn" data-back aria-label="back">${icon.back}</button>
    <h1>${title}</h1>
    ${helpId ? `<button class="icon-btn" id="${helpId}" aria-label="help">${icon.help}</button>` : '<span class="icon-btn is-ghost"></span>'}
  </div>`;
const wireBack = (root) => root.querySelector('[data-back]')?.addEventListener('click', () => { sound(); history.length > 1 ? history.back() : go('home'); });
const giftCard = (g, { sel = false, key = 'id', cls = '' } = {}) => `
  <button class="gcard rar-${rarity(g.price)} ${sel ? 'is-sel' : ''} ${cls}" data-k="${esc(g[key])}">
    <span class="gcard__img">${giftImg(g)}</span>
    <span class="gcard__name">${esc(g.name)}</span>
    <span class="gcard__val">${star()}${fmt(g.price)}</span>
  </button>`;
const emptyBox = (text, ic = icon.gift) => `<div class="empty"><span class="empty__ico">${ic}</span><span>${text}</span></div>`;

// ======================= шторки =======================

// ---------- Кошелёк: пополнение / вывод ----------
function openPay(mode = 'dep') {
  const st = api.state;
  let amount = 0, busy = false;
  const s = sheet('', { title: t('pay.title'), cls: 'sheet--pay' });
  const draw = (focus) => {
    const dep = mode === 'dep';
    const packs = dep ? st.packs.map((p) => p.stars) : [api.cfg('minWithdraw', 100), 500, 1000];
    s.set(`
      <div class="seg seg--2" data-mode="${mode}">
        <button data-m="dep" class="${dep ? 'is-active' : ''}">${icon.down}${t('pay.dep')}</button>
        <button data-m="wd" class="${!dep ? 'is-active' : ''}">${icon.up}${t('pay.wd')}</button>
      </div>
      <div class="paycard ${dep ? '' : 'is-wd'}">
        <small>${t('pay.balance')}</small>
        <div class="paycard__v">${star('star--lg')}<b>${fmt(st.balance.stars)}</b></div>
        ${deco(dep ? '0259' : '0543', 'paycard__deco')}
      </div>
      <label class="amount">
        <span class="amount__l">${t('pay.amount')}</span>
        <span class="amount__in">${star()}<input id="payIn" inputmode="numeric" placeholder="0" value="${amount || ''}" autocomplete="off" /></span>
        <span class="amount__usd">≈ $${(amount / st.rates.usdToStars).toFixed(2)}</span>
      </label>
      <div class="chips">${packs.map((p) => `<button class="chip ${amount === p ? 'is-active' : ''}" data-p="${p}">${star()}${fmt(p)}${dep && st.packs.find((x) => x.stars === p)?.bonus ? `<em>+${st.packs.find((x) => x.stars === p).bonus}</em>` : ''}</button>`).join('')}</div>
      <button class="btn btn--${dep ? 'primary' : 'pink'} btn--lg btn--block" id="payGo" ${amount ? '' : 'disabled'}>${amount ? t(dep ? 'pay.payStars' : 'pay.wdStars', { n: fmt(amount) }) : t('pay.min')}</button>
      <p class="note">${t(dep ? 'pay.via' : 'pay.wdNote')}</p>`);
    const el = s.el;
    el.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { sound('tick'); haptic('select'); mode = b.dataset.m; amount = 0; draw(); }));
    const inp = el.querySelector('#payIn');
    inp.addEventListener('input', () => {
      amount = Math.min(100000, parseInt(inp.value.replace(/\D/g, ''), 10) || 0);
      inp.value = amount || '';
      el.querySelector('.amount__usd').textContent = `≈ $${(amount / st.rates.usdToStars).toFixed(2)}`;
      const go = el.querySelector('#payGo'); go.disabled = !amount;
      go.textContent = amount ? t(mode === 'dep' ? 'pay.payStars' : 'pay.wdStars', { n: fmt(amount) }) : t('pay.min');
      el.querySelectorAll('[data-p]').forEach((c) => c.classList.toggle('is-active', +c.dataset.p === amount));
    });
    fitAmounts(el);
    if (focus) inp.focus();
    el.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => { sound('tick'); haptic('select'); amount = +b.dataset.p; draw(); }));
    el.querySelector('#payGo').addEventListener('click', async (e) => {
      if (busy || !amount) return;
      sound(); haptic('medium');
      const btn = e.currentTarget;
      if (mode === 'wd') {
        const min = api.cfg('minWithdraw', 100);
        if (amount < min) return toast(t('pay.minWd', { n: min }), 'error');
        if (amount > st.balance.stars) return toast(t('toast.noStars'), 'error');
      }
      busy = true; btn.classList.add('is-loading');
      try {
        if (mode === 'dep') {
          const r = await api.deposit(amount);
          if (r.ok) { balanceChanged(); toast(r.credited ? t('toast.gotStars', { n: fmt(r.credited) }) : t('pay.paid'), 'success'); s.close(); confetti(); }
        } else {
          await api.withdraw(amount);
          balanceChanged(); toast(t('pay.wdSent'), 'success'); s.close();
        }
      } catch (err) { errToast(err); }
      busy = false; btn.classList.remove('is-loading');
    });
  };
  draw();
}

// ---------- Настройки ----------
function openSettings({ onLang } = {}) {
  const l = getLang();
  const s = sheet(`
    <div class="list">
      <div class="list__row"><span class="list__ico">${icon.sound}</span><span class="grow">${t('set.sounds')}</span><button class="switch ${prefs.get('sound') ? 'is-on' : ''}" id="swSound" aria-label="sound"></button></div>
      <div class="list__row"><span class="list__ico">${icon.bolt}</span><span class="grow">${t('set.volume')}</span><input type="range" class="range" min="0" max="100" value="${prefs.get('volume')}" id="vol" /></div>
      <div class="list__row"><span class="list__ico">${icon.globe}</span><span class="grow">${t('set.lang')}</span>
        <div class="seg seg--mini"><button data-l="ru" class="${l === 'ru' ? 'is-active' : ''}">RU</button><button data-l="en" class="${l === 'en' ? 'is-active' : ''}">EN</button></div></div>
      <button class="list__row" id="terms"><span class="list__ico">${icon.doc}</span><span class="grow">${t('set.terms')}</span><span class="list__chev">${icon.chevron}</span></button>
      <button class="list__row" id="support"><span class="list__ico">${icon.support}</span><span class="grow">${t('set.support')}</span><span class="list__chev">${icon.chevron}</span></button>
      <div class="list__row"><span class="list__ico">${icon.server}</span><span class="grow">${t('set.server')}</span><span class="netpill is-${conn.status}"><i></i>${conn.status === 'demo' ? 'demo' : conn.status}</span></div>
    </div>
    <p class="note">${esc(CONFIG.APP_NAME)} · v2.0</p>`, { title: t('set.title') });
  const el = s.el;
  el.querySelector('#swSound').addEventListener('click', (e) => { prefs.set('sound', !prefs.get('sound')); e.currentTarget.classList.toggle('is-on', prefs.get('sound')); sound('tick'); haptic('select'); });
  el.querySelector('#vol').addEventListener('input', (e) => prefs.set('volume', +e.target.value));
  el.querySelector('#vol').addEventListener('change', () => sound('tick'));
  el.querySelectorAll('[data-l]').forEach((b) => b.addEventListener('click', () => { sound('tick'); prefs.set('lang', b.dataset.l); setLang(b.dataset.l); s.close(); onLang && onLang(); }));
  el.querySelector('#terms').addEventListener('click', () => { sound(); openLink(CONFIG.TERMS_URL); });
  el.querySelector('#support').addEventListener('click', () => { sound(); openLink(api.cfg('supportUrl', CONFIG.SUPPORT_URL)); });
}

// ---------- Подписка на канал ----------
function openSubscribe() {
  const n = api.cfg('subscribeReward', CONFIG.SUBSCRIBE_REWARD);
  let waiting = false;
  const m = modal(`
    <div class="subm">
      <div class="subm__hero">
        <span class="subm__glow"></span>
        ${deco('star-char', 'subm__char')}
        ${deco('0543', 'subm__s1')}${deco('0543', 'subm__s2')}
        <div class="subm__pill">${star()}+${n}</div>
      </div>
      <h2>${t('sub.title', { n })}</h2>
      <p>${t('sub.text')}</p>
      <ol class="steps">${['sub.s1', 'sub.s2', 'sub.s3'].map((k, i) => `<li><span>${i + 1}</span>${t(k)}</li>`).join('')}</ol>
      <button class="btn btn--pink btn--lg btn--block" id="subBtn">${t('sub.btn')}</button>
    </div>`, { closeDelay: CONFIG.MODAL_CLOSE_DELAY, cls: 'modal--sub', onClose: () => document.removeEventListener('visibilitychange', onBack) });
  const btn = m.el.querySelector('#subBtn');
  async function check() {
    if (!waiting) return; waiting = false;
    btn.disabled = true; btn.classList.add('is-loading'); btn.textContent = t('sub.checking');
    try {
      const r = await api.checkSubscription();
      balanceChanged();
      if (r.reward) { toast(t('toast.gotStars', { n: r.reward }), 'success'); confetti(); }
      m.close(); document.dispatchEvent(new Event('state'));
    } catch (e) {
      btn.disabled = false; btn.classList.remove('is-loading'); btn.textContent = t('sub.btn'); errToast(e);
    }
  }
  function onBack() { if (document.visibilityState === 'visible') setTimeout(check, 600); }
  document.addEventListener('visibilitychange', onBack);
  btn.addEventListener('click', () => {
    sound(); haptic('medium');
    waiting = true; openLink(api.cfg('channelUrl', CONFIG.CHANNEL_URL));
    setTimeout(check, 5000);
  });
}

// ---------- Как добавить подарок ----------
function openAddGift() {
  const acc = api.cfg('giftsAccount', CONFIG.GIFTS_ACCOUNT);
  const s = sheet(`
    <div class="howgift">
      ${deco('0259', 'howgift__deco')}
      <div class="warn">${icon.help}<div><b>${t('gift.warnTitle')}</b><p>${t('gift.warnText')}</p></div></div>
      <ol class="steps">
        <li><span>1</span>${t('gift.s1', { acc: `<a href="#" id="giftAcc">${esc(acc)}</a>` })}</li>
        <li><span>2</span>${t('gift.s2')}</li><li><span>3</span>${t('gift.s3')}</li><li><span>4</span>${t('gift.s4')}</li>
      </ol>
      <button class="btn btn--primary btn--lg btn--block" id="giftGo">${t('gift.s1', { acc: esc(acc) })}</button>
    </div>`, { title: t('gift.title') });
  const open = (e) => { e.preventDefault(); sound(); openLink(`https://t.me/${acc.replace('@', '')}`); };
  s.el.querySelector('#giftAcc').addEventListener('click', open);
  s.el.querySelector('#giftGo').addEventListener('click', open);
}

// ---------- Выбор NFT ----------
function openNftPicker({ title, items, selected, key = 'id', onPick }) {
  const s = sheet(`<div class="ggrid">${items.map((n) => giftCard(n, { sel: n[key] === selected, key })).join('')}</div>`, { title: esc(title) });
  s.el.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
    sound('tick'); haptic('select'); onPick(items.find((n) => String(n[key]) === b.dataset.k)); s.close();
  }));
}

function openInventory() {
  const inv = api.state.inventory;
  const s = sheet(inv.length ? `<div class="ggrid">${inv.map((g) => giftCard(g, { key: 'uid' })).join('')}</div>`
    : `${emptyBox(t('common.empty'))}<button class="btn btn--primary btn--lg btn--block" id="invAdd">${t('up.topUpGifts')}</button>`, { title: t('prof.inventory') });
  s.el.querySelector('#invAdd')?.addEventListener('click', () => { sound(); s.close(); openAddGift(); });
  s.el.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { sound(); s.close(); go('upgrader'); }));
}

// ---------- Игрок из ленты ----------
function openPlayer(win) {
  const u = win.user || {};
  const s = sheet(`
    <div class="player">
      ${avatarHtml(u, 'player__ava')}
      <div class="player__name">${esc(u.name || u.username)}</div>
      ${u.username ? `<div class="player__user">@${esc(u.username)}</div>` : ''}
      <div class="player__win">
        ${win.gift ? giftImg(win.gift) : `<span class="player__star">${icon.star}</span>`}
        <span>${t('player.won')} <b>${esc(win.gift ? win.gift.name : `${fmt(win.price)} Stars`)}</b><em>${esc(win.game || '')}</em></span>
        <b class="player__v">${star()}${fmt(win.price)}</b>
      </div>
      <button class="btn btn--primary btn--lg btn--block" id="dmBtn" ${u.username ? '' : 'disabled'}>${u.username ? t('player.dm') : t('player.noUser')}</button>
    </div>`);
  s.el.querySelector('#dmBtn').addEventListener('click', () => openUser(u.username));
}

// ---------- Реферальные уровни ----------
const LEVEL_IMG = ['gift-020', 'gift-065', 'gift-023', 'gift-090', 'gift-074', 'gift-126'];
const LEVEL_HUE = ['#ff8a8a', '#ff9f1a', '#d16bff', '#4dc3ff', '#ffc94a', '#5df07a'];
const levelsList = () => (api.state.levels || [{ n: 1, pct: 5, from: 0 }, { n: 2, pct: 7, from: 1000 }, { n: 3, pct: 10, from: 5000 }, { n: 4, pct: 12, from: 15000 }, { n: 5, pct: 15, from: 50000 }, { n: 6, pct: 20, from: 150000 }]);
const levelCard = (L, cur = false) => `
  <div class="lvl ${cur ? 'is-cur' : ''}" style="--hue:${LEVEL_HUE[(L.n - 1) % 6]}">
    <span class="lvl__img">${giftImg({ id: LEVEL_IMG[(L.n - 1) % 6] })}</span>
    <div class="lvl__txt"><b>${t('ref.levelN', { n: L.n })}</b><span>${t('ref.percent', { n: L.pct })}</span><small>${t('ref.from', { n: fmt(L.from) })}</small></div>
    ${cur ? `<span class="lvl__badge">${icon.check}</span>` : ''}
  </div>`;
function openLevels() {
  const cur = api.state.referrals.level || 1;
  sheet(`<div class="levels">${levelsList().map((L) => levelCard(L, L.n === cur)).join('')}</div>`, { title: t('ref.levels') });
}

// ---------- Промокод ----------
const promoBlock = () => `
  <section class="promo">
    ${deco('promo-art', 'promo__art')}
    <div class="promo__txt"><div class="promo__t">${icon.ticket}${t('promo.title')}</div><p>${t('promo.text')}</p></div>
    <form class="promo__form" id="promoForm" autocomplete="off">
      <input id="promoIn" placeholder="${t('promo.placeholder')}" maxlength="32" autocapitalize="characters" />
      <button class="btn btn--white" type="submit">${t('promo.btn')}</button>
    </form>
  </section>`;
function wirePromo(root) {
  const f = root.querySelector('#promoForm'); if (!f) return;
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inp = f.querySelector('input'); const btn = f.querySelector('button');
    if (!inp.value.trim()) { inp.focus(); return; }
    sound(); btn.classList.add('is-loading');
    try {
      const reward = await api.activatePromo(inp.value);
      balanceChanged(); toast(t('toast.gotStars', { n: reward }), 'success'); confetti({ count: 80 }); inp.value = '';
    } catch (err) { if (err.code === 'not_found') toast(t('promo.invalid'), 'error'); else errToast(err); }
    btn.classList.remove('is-loading');
  });
}

// ---------- Первый заработок без вложений ----------
// Шаги, которые дают звёзды без пополнения: стартовый бонус, подписка, ежедневный бонус, 5 ставок, друг
function freeSteps() {
  const st = api.state;
  const bets = st.tasks.find((x) => x.id === 'bets5');
  const wb = api.cfg('welcomeBonus', 0);
  const steps = [];
  if (wb > 0) steps.push({ id: 'welcome', ic: icon.gift, reward: wb, done: true, title: t('free.welcome'), text: t('free.welcomeT') });
  steps.push({ id: 'sub', ic: icon.bolt, reward: api.cfg('subscribeReward', CONFIG.SUBSCRIBE_REWARD), done: !!st.subscribed, title: t('free.sub1'), text: t('free.sub1T') });
  steps.push({ id: 'daily', ic: icon.calendar, reward: st.daily?.reward || api.cfg('dailyReward', 5), done: st.daily?.ready === false, title: t('free.daily'), text: st.daily?.ready === false ? t('free.dailyDone') : t('free.dailyT'), repeat: true });
  if (bets) steps.push({ id: 'bets', ic: icon.play, reward: bets.reward, done: !!bets.claimed, ready: bets.progress >= bets.goal, title: t('free.bets'), text: `${t('free.betsT')} · ${Math.min(bets.progress, bets.goal)}/${bets.goal}` });
  steps.push({ id: 'ref', ic: icon.people, reward: st.referrals.perFriend || 10, done: st.referrals.count > 0, title: t('free.ref'), text: t('free.refT', { n: st.referrals.perFriend || 10 }), repeat: true });
  const total = steps.reduce((a, x) => a + x.reward, 0);
  const done = steps.filter((x) => x.done).length;
  return { steps, total, done, left: steps.length - done };
}
// карточка на главной
function freeCard() {
  const f = freeSteps();
  if (!f.left) return '';
  return `<button class="freecard" id="freeCard">
    ${deco('star-char', 'freecard__art')}
    <span class="freecard__txt"><b>${t('free.title')}</b><span>${t('free.sub', { n: f.total })}</span>
      <span class="freecard__prog"><span class="bar"><i style="width:${(f.done / f.steps.length) * 100}%"></i></span><em>${f.done}/${f.steps.length}</em></span></span>
    <span class="freecard__go">${icon.arrowRight}</span>
  </button>`;
}
// полный список шагов (вкладка «Бонусы»)
function freeBlock() {
  const f = freeSteps();
  return `<section class="free">
    <div class="free__head">
      ${deco('star-char', 'free__art')}
      <b>${t('free.title')}</b><span>${t('free.sub', { n: f.total })}</span>
      <span class="freecard__prog"><span class="bar"><i style="width:${(f.done / f.steps.length) * 100}%"></i></span><em>${f.done}/${f.steps.length}</em></span>
    </div>
    <div class="free__list">${f.steps.map((x) => `
      <button class="fstep ${x.done ? 'is-done' : ''} ${x.ready && !x.done ? 'is-ready' : ''}" data-free="${x.id}" ${x.done && !(x.id === 'ref') ? 'disabled' : ''}>
        <span class="fstep__ico">${x.done ? icon.check : x.ic}</span>
        <span class="fstep__txt"><b>${x.title}</b><span>${x.text}</span></span>
        <span class="fstep__r">${star()}+${fmt(x.reward)}${x.repeat ? `<small>${t('free.repeat')}</small>` : ''}</span>
      </button>`).join('')}</div>
    ${f.left ? '' : `<p class="free__all">${icon.check}${t('free.all')}</p>`}
  </section>`;
}
function wireFree(root, redraw) {
  root.querySelector('#freeCard')?.addEventListener('click', () => { sound(); haptic(); go('bonus'); });
  root.querySelectorAll('[data-free]').forEach((b) => b.addEventListener('click', async () => {
    sound(); haptic();
    const id = b.dataset.free;
    if (id === 'sub') openSubscribe();
    else if (id === 'ref') shareRef();
    else if (id === 'bets') {
      const bets = api.state.tasks.find((x) => x.id === 'bets5');
      if (bets && bets.progress >= bets.goal && !bets.claimed) {
        b.classList.add('is-loading');
        try { const r = await api.claimTask('bets5'); balanceChanged(); toast(t('toast.gotStars', { n: r }), 'success'); confetti({ count: 80 }); } catch (e) { errToast(e); }
        redraw && redraw();
      } else go('mines');
    } else if (id === 'daily') {
      b.classList.add('is-loading');
      try { const r = await api.claimDaily(); balanceChanged(); toast(t('toast.gotStars', { n: r }), 'success'); confetti({ y: 0.3, count: 80 }); }
      catch (e) { if (e.code === 'already') toast(t('bonus.daily.taken'), 'error'); else errToast(e); }
      redraw && redraw();
    }
  }));
}

// ---------- Рефералка ----------
function shareRef() {
  openLink(`https://t.me/share/url?url=${encodeURIComponent(api.refLink())}&text=${encodeURIComponent(t('prof.shareText'))}`);
}
async function copyRef() {
  const link = api.refLink();
  try { await navigator.clipboard.writeText(link); } catch (e) {
    const ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (err) { /* ignore */ } ta.remove();
  }
  haptic('success'); toast(t('common.copied'), 'success');
}
const refBanner = () => `
  <button class="refban" id="refBan">
    ${deco('bear', 'refban__bear')}
    <span class="refban__txt"><b>${t('ref.title')}</b><span>${t('prof.invite')}</span></span>
    <span class="refban__go">${icon.arrowRight}</span>
  </button>`;

// ======================= экран: главная =======================
const home = (() => {
  const SLIDES = [
    { id: 'daily', c: 'blue', art: 'calendar' },
    { id: 'invite', c: 'pink', art: 'bear' },
    { id: 'deposit', c: 'violet', art: '0259' },
    { id: 'tasks', c: 'blue', art: '0543' },
  ];
  const GAMES = [
    { id: 'upgrade', c: 'blue', route: 'upgrader' }, { id: 'mines', c: 'blue', route: 'mines' },
    { id: 'cases', c: 'pink' }, { id: 'crash', c: 'blue' }, { id: 'lottery', c: 'pink' },
    { id: 'hockey', c: 'blue' }, { id: 'waterball', c: 'pink' }, { id: 'ball', c: 'pink' },
  ];

  function winItem(w, isNew) {
    const u = w.user || {};
    const rar = w.gift ? rarity(w.price) : 'gold';
    return `<button class="wchip rar-${rar} ${isNew ? 'is-new' : ''}" data-win="${esc(w.id)}">
      <span class="wchip__img">${w.gift ? giftImg(w.gift) : `<span class="wchip__star">${icon.star}</span>`}</span>
      <span class="wchip__meta"><img class="wchip__ava" src="${esc(api.avatarUrl(u))}" alt="" onerror="this.remove()" /><b>${star()}${fmt(w.price)}</b></span>
    </button>`;
  }

  function render(root) {
    const active = GAMES.filter((g) => g.route).length;
    root.innerHTML = `
      <section class="ticker">
        <div class="sec-h"><h2><span class="live-dot"></span>${t('home.live')}</h2></div>
        <div class="ticker__list hscroll" id="feed"></div>
      </section>

      <div id="freeSlot">${freeCard()}</div>

      <section class="hero" id="hero">
        <span class="hero__orb hero__orb--1"></span><span class="hero__orb hero__orb--2"></span>
        <div class="hero__art">
          <span class="hero__ring"></span>
          ${giftImg({ id: 'pepe' }, 'hero__g hero__g--1')}${giftImg({ id: 'gift-126' }, 'hero__g hero__g--2')}${giftImg({ id: 'gift-074' }, 'hero__g hero__g--3')}
        </div>
        <div class="hero__txt">
          <span class="tag tag--fire">${icon.fire}${t('home.heroTag')}</span>
          <h2>${t('home.heroTitle')}</h2>
          <p>${t('home.heroText')}</p>
          <button class="btn btn--white btn--lg">${icon.play}${t('common.play')}</button>
        </div>
      </section>

      <section class="slides">
        <div class="slides__track hscroll" id="slides">${SLIDES.map((s) => `
          <div class="slide slide--${s.c}" data-id="${s.id}">
            ${deco(s.art, 'slide__art')}
            <div class="slide__txt"><b>${t(`bonus.${s.id}.title`)}</b><span>${t(`bonus.${s.id}.text`)}</span></div>
            <button class="btn btn--glass btn--sm" data-act="${s.id}">${t(`bonus.${s.id}.btn`)}</button>
          </div>`).join('')}</div>
        <div class="dots" id="dots">${SLIDES.map((_, i) => `<i data-i="${i}"></i>`).join('')}</div>
      </section>

      <div class="sec-h"><h2>${t('home.games')}</h2><span class="sec-h__aside"><span class="live-dot live-dot--green"></span>${active}/${GAMES.length}</span></div>
      <section class="games">${GAMES.map((g, i) => `
        <button class="game game--${g.c} ${g.route ? '' : 'is-locked'} ${i < 2 ? 'game--big' : ''}" data-game="${g.id}">
          <img class="game__art" src="img/games/${g.id}.webp" alt="" loading="lazy" decoding="async" />
          <span class="game__shade"></span>
          ${g.route ? `<span class="tag tag--live"><i></i>${t('home.online')}</span>` : `<span class="tag tag--lock">${icon.lock}${t('common.soon')}</span>`}
          <span class="game__txt"><b>${t('game.' + g.id)}</b>${i < 2 ? `<small>${t(`game.${g.id}.d`)}</small>` : ''}</span>
          ${g.route ? `<span class="game__go">${icon.play}</span>` : ''}
        </button>`).join('')}</section>`;

    // --- живая лента
    const list = root.querySelector('#feed');
    const known = new Map();
    let liveTimer, alive = true;
    const add = (w, isNew) => { known.set(String(w.id), w); list.insertAdjacentHTML(isNew ? 'afterbegin' : 'beforeend', winItem(w, isNew)); };
    const trim = () => { while (list.children.length > 20) list.lastElementChild.remove(); };
    const loadFeed = async () => {
      try {
        const items = await api.feed();
        if (!alive) return;
        if (!known.size) items.forEach((w) => add(w, false));
        else items.filter((w) => !known.has(String(w.id))).reverse().forEach((w) => add(w, true));
        if (!items.length && !list.children.length) list.innerHTML = `<div class="ticker__empty">${icon.star}${t('feed.empty')}</div>`;
        else if (items.length) list.querySelector('.ticker__empty')?.remove();
        trim();
      } catch (e) { /* сеть моргнула — попробуем позже */ }
    };
    const tick = async () => {
      if (document.hidden) { /* вкладка скрыта — не дёргаем сервер */ } else if (api.live) await loadFeed();
      else { list.querySelector('.ticker__empty')?.remove(); add(api.demoWin(), true); trim(); }
      if (alive) liveTimer = setTimeout(tick, api.live ? CONFIG.FEED_POLL : 2500 + Math.random() * 3000);
    };
    loadFeed().then(() => { if (alive) liveTimer = setTimeout(tick, 2500); });
    list.addEventListener('click', (e) => {
      const b = e.target.closest('[data-win]'); if (!b) return;
      sound(); const w = known.get(b.dataset.win); if (w) openPlayer(w);
    });

    // --- слайды: прокрутка со snap + автолистание
    const track = root.querySelector('#slides');
    const dots = [...root.querySelectorAll('#dots i')];
    let idx = 0, auto;
    const setDot = (i) => dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    const goSlide = (i) => { idx = (i + SLIDES.length) % SLIDES.length; track.scrollTo({ left: track.children[idx].offsetLeft - track.offsetLeft - 16, behavior: 'smooth' }); };
    const restart = () => { clearInterval(auto); auto = setInterval(() => goSlide(idx + 1), CONFIG.BONUS_INTERVAL); };
    track.addEventListener('scroll', () => {
      const w = track.children[0].offsetWidth + 10;
      const i = Math.round(track.scrollLeft / w); if (i !== idx) { idx = i; setDot(i); }
    }, { passive: true });
    track.addEventListener('touchstart', restart, { passive: true });
    dots.forEach((d) => d.addEventListener('click', () => { goSlide(+d.dataset.i); restart(); }));
    setDot(0); restart();

    track.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      sound(); haptic();
      const act = b.dataset.act;
      if (act === 'daily') {
        b.classList.add('is-loading');
        try {
          const reward = await api.claimDaily();
          balanceChanged(); toast(t('toast.gotStars', { n: reward }), 'success'); confetti({ y: 0.3, count: 90 });
        } catch (err) { if (err.code === 'already') toast(t('bonus.daily.taken'), 'error'); else errToast(err); }
        b.classList.remove('is-loading'); drawFree();
      } else if (act === 'invite') shareRef();
      else if (act === 'deposit') openPay('dep');
      else if (act === 'tasks') go('bonus');
    });

    root.querySelector('#hero').addEventListener('click', () => { sound(); haptic('medium'); go('upgrader'); });
    const drawFree = () => { const slot = root.querySelector('#freeSlot'); if (slot) { slot.innerHTML = freeCard(); wireFree(slot); } };
    wireFree(root);
    document.addEventListener('state', drawFree); document.addEventListener('balance', drawFree);
    root.querySelectorAll('.game').forEach((el) => el.addEventListener('click', () => {
      const g = GAMES.find((x) => x.id === el.dataset.game);
      if (g.route) { sound(); haptic('medium'); go(g.route); return; }
      sound('lose'); haptic('warning'); el.classList.remove('is-shake'); void el.offsetWidth; el.classList.add('is-shake'); soonToast();
    }));

    return () => { alive = false; clearInterval(auto); clearTimeout(liveTimer); document.removeEventListener('state', drawFree); document.removeEventListener('balance', drawFree); };
  }
  return { render, GAMES };
})();

// ======================= экран: апгрейдер =======================
const upgrader = (() => {
  const S = { tab: 'stars', stake: 0, gift: null, target: null, q: '', spinning: false, rot: 0 };
  const R = 84, C = 2 * Math.PI * R;
  const MULTS = [1.5, 2, 5, 10];

  function render(root) {
    const st = api.state;
    S.spinning = false;
    if (S.gift && !st.inventory.some((g) => g.uid === S.gift.uid)) S.gift = null;
    root.innerHTML = `
      ${pageHead(t('up.title'), 'upHelp')}
      <section class="upg">
        <div class="ring" id="ring">
          <span class="ring__halo"></span>
          <svg class="ring__svg" viewBox="0 0 200 200">
            <defs><linearGradient id="arcG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7aa2ff"/><stop offset="1" stop-color="#3d6bff"/></linearGradient></defs>
            <circle class="ring__track" cx="100" cy="100" r="${R}"/>
            <circle class="ring__arc" id="ringArc" cx="100" cy="100" r="${R}" stroke="url(#arcG)" style="stroke-dasharray:0 ${C}"/>
            ${Array.from({ length: 60 }, (_, i) => `<line class="ring__tick ${i % 5 ? '' : 'is-major'}" x1="100" y1="${i % 5 ? 7 : 4}" x2="100" y2="12" transform="rotate(${i * 6} 100 100)"/>`).join('')}
          </svg>
          <div class="ring__ptr" id="ringPtr"><i></i></div>
          <div class="ring__center"><b id="ringPct">0%</b><span>${t('up.chance')}</span><em id="ringMul">x0</em></div>
        </div>
        <div class="pair">
          <div class="slot" id="slotL"></div>
          <span class="pair__arrow">${icon.arrowRight}</span>
          <div class="slot" id="slotR"></div>
        </div>
        <button class="btn btn--primary btn--xl btn--block" id="upGo">${icon.arrowUp}${t('up.go')}</button>
      </section>

      <section class="panel">
        <div class="seg seg--2" id="tabs"><button data-tab="stars">${icon.star}${t('up.tabStars')}</button><button data-tab="gifts">${icon.gift}${t('up.tabGifts')}</button></div>
        <div id="betBody"></div>
      </section>

      <section class="panel">
        <div class="panel__h"><h3>${t('up.target')}</h3><label class="search">${icon.search}<input id="tSearch" placeholder="${t('up.search')}" value="${esc(S.q)}" /></label></div>
        <div class="chips chips--mult" id="mults">${MULTS.map((m) => `<button class="chip" data-mult="${m}">x${m}</button>`).join('')}</div>
        <div class="ggrid" id="tGrid"></div>
        <button class="btn btn--ghost btn--block" id="tMore"></button>
      </section>`;

    const $r = (s) => root.querySelector(s);
    const stakeValue = () => (S.tab === 'gifts' ? (S.gift?.price || 0) : S.stake);

    function slot(el, item, kind) {
      if (!item) { el.className = 'slot is-empty'; el.innerHTML = `<span class="slot__plus">${icon.plus}</span><small>${t(kind === 'L' ? 'up.pickStake' : 'up.pickTarget')}</small>`; return; }
      el.className = `slot rar-${item.stars ? 'gold' : rarity(item.price)}`;
      el.innerHTML = `<small>${t(kind === 'L' ? 'up.stake' : 'up.win')}</small>
        <span class="slot__img">${item.stars ? `<span class="slot__star">${icon.star}</span>` : giftImg(item)}</span>
        <b>${star()}${fmt(item.price)}</b>`;
    }
    function drawChoices() {
      const v = stakeValue();
      slot($r('#slotL'), S.tab === 'gifts' ? S.gift : v > 0 ? { stars: true, price: v } : null, 'L');
      slot($r('#slotR'), S.target, 'R');
      const ch = api.chance(v, S.target?.price);
      $r('#ringPct').textContent = `${(ch * 100).toFixed(ch < 0.1 ? 2 : 1).replace(/\.?0+$/, '')}%`;
      $r('#ringMul').textContent = v && S.target ? `x${(S.target.price / v).toFixed(2)}` : 'x0';
      $r('#ringArc').style.strokeDasharray = `${ch * C} ${C}`;
      $r('#ringArc').classList.toggle('is-zero', !ch);
      $r('#ring').classList.toggle('is-ready', !!(v && S.target));
      $r('#upGo').disabled = !(v > 0 && S.target) || S.spinning;
    }

    function drawBet() {
      root.querySelectorAll('#tabs [data-tab]').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === S.tab));
      const body = $r('#betBody');
      if (S.tab === 'stars') {
        body.innerHTML = `
          <label class="amount">
            <span class="amount__l">${t('up.enterBet')}</span>
            <span class="amount__in">${star()}<input id="betIn" inputmode="numeric" placeholder="0" value="${S.stake || ''}" autocomplete="off" /></span>
            <span class="amount__usd">≈ $${(S.stake / st.rates.usdToStars).toFixed(2)}</span>
          </label>
          <div class="chips chips--4"><button class="chip" data-d="-10">−10</button><button class="chip" data-d="50">+50</button><button class="chip" data-d="x2">x2</button><button class="chip" data-d="max">MAX</button></div>`;
        const inp = $r('#betIn'); fitAmount(inp);
        inp.addEventListener('input', () => {
          S.stake = Math.max(0, parseInt(inp.value.replace(/\D/g, ''), 10) || 0);
          inp.value = S.stake || '';
          body.querySelector('.amount__usd').textContent = `≈ $${(S.stake / st.rates.usdToStars).toFixed(2)}`;
          drawChoices();
        });
        body.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => {
          sound('tick'); haptic('select');
          const d = b.dataset.d;
          S.stake = d === 'max' ? Math.floor(st.balance.stars) : d === 'x2' ? S.stake * 2 : Math.max(0, S.stake + +d);
          drawBet(); drawChoices();
        }));
      } else {
        const inv = st.inventory;
        body.innerHTML = inv.length
          ? `<div class="hscroll gifts-row">${inv.map((g) => giftCard(g, { sel: S.gift?.uid === g.uid, key: 'uid', cls: 'gcard--sm' })).join('')}</div>`
          : `${emptyBox(t('up.noGifts'))}<button class="btn btn--primary btn--block" id="betTopUp">${icon.plus}${t('up.topUpGifts')}</button>`;
        $r('#betTopUp')?.addEventListener('click', () => { sound(); openAddGift(); });
        body.querySelectorAll('[data-k]').forEach((c) => c.addEventListener('click', () => {
          sound('tick'); haptic('select');
          const g = inv.find((x) => x.uid === c.dataset.k);
          S.gift = S.gift?.uid === g.uid ? null : g; drawBet(); drawChoices();
        }));
      }
    }

    const filtered = () => { const q = S.q.trim().toLowerCase(); return api.catalog.filter((n) => !q || n.name.toLowerCase().includes(q)); };
    function drawTargets() {
      const list = filtered();
      const top = S.target ? [S.target, ...list.filter((n) => n.id !== S.target.id)] : list;
      $r('#tGrid').innerHTML = top.slice(0, 6).map((n) => giftCard(n, { sel: S.target?.id === n.id })).join('') || emptyBox('—', icon.search);
      $r('#tGrid').querySelectorAll('[data-k]').forEach((c) => c.addEventListener('click', () => {
        sound('tick'); haptic('select');
        const n = api.catalog.find((x) => x.id === c.dataset.k);
        S.target = S.target?.id === n.id ? null : n; drawTargets(); drawChoices();
      }));
      const more = Math.max(0, list.length - 6);
      $r('#tMore').textContent = t('common.showMore', { n: more });
      $r('#tMore').hidden = more === 0;
      root.querySelectorAll('[data-mult]').forEach((b) => b.classList.remove('is-active'));
    }

    // Авто-цель: подарок, ближайший к ставке × множитель
    root.querySelectorAll('[data-mult]').forEach((b) => b.addEventListener('click', () => {
      const v = stakeValue();
      if (!v) return toast(t('toast.pickStake'), 'error');
      sound('tick'); haptic('select');
      const want = v * +b.dataset.mult;
      const pick = [...api.catalog].filter((g) => g.price > v).sort((a, c) => Math.abs(a.price - want) - Math.abs(c.price - want))[0];
      if (!pick) return toast(t('err.notFound'), 'error');
      S.target = pick; drawTargets(); drawChoices();
      b.classList.add('is-active');
    }));

    async function spin() {
      if (S.spinning) return;
      const v = stakeValue();
      if (!S.target) return toast(t('toast.pickTarget'), 'error');
      if (!v) return toast(t('toast.pickStake'), 'error');
      if (S.tab === 'stars' && v > st.balance.stars) { sound('lose'); openPay('dep'); return toast(t('toast.noStars'), 'error'); }
      S.spinning = true; drawChoices(); sound(); haptic('heavy');
      const ring = $r('#ring'); ring.classList.remove('is-win', 'is-lose'); ring.classList.add('is-spinning');
      const ptr = $r('#ringPtr');
      let res;
      try {
        res = await api.upgrade({ stakeStars: S.tab === 'stars' ? v : 0, stakeGift: S.tab === 'gifts' ? S.gift : null, target: S.target });
      } catch (e) { S.spinning = false; ring.classList.remove('is-spinning'); drawChoices(); return errToast(e); }
      balanceChanged();
      // Сектор выигрыша — от 0° (верх) по часовой до chance*360°
      const sector = res.chance * 360;
      const pad = Math.min(3, sector / 4);
      const final = res.win ? pad + Math.random() * (sector - 2 * pad) : sector + pad + Math.random() * (360 - sector - 2 * pad);
      S.rot = S.rot - (S.rot % 360) + 360 * 6 + final;
      ptr.style.transform = `rotate(${S.rot}deg)`;
      let ticks = 0; const tk = setInterval(() => { if (++ticks > 22) clearInterval(tk); sound('tick'); haptic('select'); }, 160 + ticks * 4);
      setTimeout(() => {
        clearInterval(tk);
        S.spinning = false;
        const won = S.target;
        ring.classList.remove('is-spinning');
        ring.classList.add(res.win ? 'is-win' : 'is-lose');
        if (res.win) winReveal(won);
        else { sound('lose'); haptic('error'); toast(t('toast.lose'), 'lose'); }
        if (S.tab === 'gifts') S.gift = null;
        if (S.tab === 'stars') S.stake = Math.min(S.stake, Math.floor(st.balance.stars));
        drawBet(); drawChoices();
      }, 4400);
    }

    root.querySelectorAll('#tabs [data-tab]').forEach((b) => b.addEventListener('click', () => { sound('tick'); haptic('select'); S.tab = b.dataset.tab; drawBet(); drawChoices(); }));
    $r('#tSearch').addEventListener('input', (e) => { S.q = e.target.value; drawTargets(); });
    $r('#tMore').addEventListener('click', () => {
      sound();
      openNftPicker({ title: t('up.target'), items: filtered(), selected: S.target?.id, onPick: (n) => { S.target = n; drawTargets(); drawChoices(); } });
    });
    $r('#slotR').addEventListener('click', () => { if (S.spinning) return; sound(); openNftPicker({ title: t('up.target'), items: api.catalog, selected: S.target?.id, onPick: (n) => { S.target = n; drawTargets(); drawChoices(); } }); });
    $r('#slotL').addEventListener('click', () => { if (S.spinning) return; sound(); if (S.tab === 'stars') $r('#betIn')?.focus(); else if (!st.inventory.length) openAddGift(); });
    $r('#upHelp').addEventListener('click', () => { sound(); openAddGift(); });
    $r('#upGo').addEventListener('click', spin);
    wireBack(root);
    $r('#ringPtr').style.transform = `rotate(${S.rot}deg)`;

    drawBet(); drawTargets(); drawChoices();
  }
  return { render };
})();

// ======================= экран: мины =======================
const mines = (() => {
  const COUNTS = [1, 3, 5, 10, 24];
  const S = { stake: 0, count: 3, busy: false, reveal: null };

  function openHelp() {
    sheet(`<ol class="steps">${['h1', 'h2', 'h3', 'h4'].map((k, i) => `<li><span>${i + 1}</span>${t('mines.' + k)}</li>`).join('')}</ol>`, { title: t('mines.helpTitle') });
  }

  function render(root) {
    const st = api.state;
    S.busy = false; S.reveal = null;
    if (st.mines) { S.count = st.mines.mines; S.stake = st.mines.stake; }
    root.innerHTML = `
      ${pageHead(t('mines.title'), 'mHelp')}
      <section class="mstats">
        <div class="mstat"><small>${t('mines.mult')}</small><b id="mMult">x1.00</b></div>
        <div class="mstat"><small>${t('mines.next')}</small><b id="mNext">x1.00</b></div>
        <div class="mstat mstat--win"><small>${t('mines.win')}</small><b id="mWin">0</b></div>
      </section>
      <section class="mboard"><div class="mgrid" id="mGrid">${Array.from({ length: 25 }, (_, i) => `<button class="cell" data-c="${i}" aria-label="${i + 1}"><span class="cell__face"></span></button>`).join('')}</div></section>
      <button class="btn btn--xl btn--block" id="mGo"></button>
      <section class="panel" id="mBet">
        <label class="amount">
          <span class="amount__l">${t('up.enterBet')}</span>
          <span class="amount__in">${star()}<input id="mIn" inputmode="numeric" placeholder="0" autocomplete="off" /></span>
          <span class="amount__usd" id="mUsd"></span>
        </label>
        <div class="chips chips--4"><button class="chip" data-d="-10">−10</button><button class="chip" data-d="50">+50</button><button class="chip" data-d="x2">x2</button><button class="chip" data-d="max">MAX</button></div>
        <div class="panel__h panel__h--sm"><h3>${t('mines.count')}</h3></div>
        <div class="chips chips--5" id="mCount">${COUNTS.map((n) => `<button class="chip chip--bomb" data-n="${n}">${icon.bomb}${n}</button>`).join('')}</div>
      </section>`;

    const $r = (q) => root.querySelector(q);
    const inp = $r('#mIn');
    const cells = [...root.querySelectorAll('.cell')];

    function draw() {
      const g = st.mines;
      const live = !!g;
      const opened = g ? g.opened : [];
      cells.forEach((c, i) => {
        const isStar = opened.includes(i);
        let cls = 'cell', html = '';
        if (isStar) { cls += ' is-star is-open'; html = icon.star; }
        else if (S.reveal) {
          if (S.reveal.board.includes(i)) { cls += ' is-bomb is-open' + (i === S.reveal.cell ? ' is-hit' : ' is-ghost'); html = icon.bomb; }
          else if (S.reveal.stars?.includes(i)) { cls += ' is-star is-open'; html = icon.star; }
          else { cls += ' is-star is-open is-ghost'; html = icon.star; }
        }
        if (c.className !== cls) { c.className = cls; c.querySelector('.cell__face').innerHTML = html; }
        c.disabled = !live || isStar || S.busy;
      });
      $r('#mGrid').classList.toggle('is-live', live);
      const k = opened.length;
      const mult = g ? g.mult : 1;
      const next = g ? g.next : api.minesMult(S.count, 1);
      $r('#mMult').textContent = `x${mult.toFixed(2)}`;
      $r('#mNext').textContent = next ? `x${next.toFixed(2)}` : '—';
      $r('#mWin').innerHTML = `${star()}${fmt(g ? Math.floor(g.stake * mult) : 0)}`;
      const goBtn = $r('#mGo');
      if (live) {
        goBtn.className = 'btn btn--xl btn--block btn--green';
        goBtn.innerHTML = `${t('mines.cash', { n: fmt(Math.floor(g.stake * mult)) })}${icon.star}`;
        goBtn.disabled = !k || S.busy;
      } else {
        goBtn.className = 'btn btn--xl btn--block btn--primary';
        goBtn.innerHTML = `${icon.play}${t('mines.play')}`;
        goBtn.disabled = S.busy;
      }
      inp.disabled = live;
      if (document.activeElement !== inp) { inp.value = S.stake || ''; fitAmount(inp); }
      $r('#mUsd').textContent = `≈ $${(S.stake / st.rates.usdToStars).toFixed(2)}`;
      $r('#mBet').classList.toggle('is-locked', live);
      root.querySelectorAll('[data-n]').forEach((b) => b.classList.toggle('is-active', +b.dataset.n === S.count));
    }

    inp.addEventListener('input', () => { S.stake = Math.max(0, parseInt(inp.value.replace(/\D/g, ''), 10) || 0); inp.value = S.stake || ''; draw(); });
    root.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => {
      sound('tick'); haptic('select');
      const d = b.dataset.d;
      S.stake = d === 'max' ? Math.floor(st.balance.stars) : d === 'x2' ? S.stake * 2 : Math.max(0, S.stake + +d);
      draw();
    }));
    root.querySelectorAll('[data-n]').forEach((b) => b.addEventListener('click', () => { sound('tick'); haptic('select'); S.count = +b.dataset.n; S.reveal = null; draw(); }));

    $r('#mGo').addEventListener('click', async () => {
      if (S.busy) return;
      sound(); haptic('medium');
      S.busy = true;
      try {
        if (st.mines) {
          const r = await api.minesCashout();
          balanceChanged();
          S.reveal = { board: r.board, cell: -1, stars: st.mines?.opened || [] };
          sound('win'); toast(t('mines.won', { n: fmt(r.win) }), 'win'); confetti({ y: 0.35, count: 110 });
        } else {
          if (!S.stake) { S.busy = false; return toast(t('toast.pickStake'), 'error'); }
          if (S.stake > st.balance.stars) { S.busy = false; sound('lose'); openPay('dep'); return toast(t('toast.noStars'), 'error'); }
          S.reveal = null;
          await api.minesStart(S.stake, S.count);
          balanceChanged();
        }
      } catch (e) { errToast(e); }
      S.busy = false; draw();
    });

    $r('#mGrid').addEventListener('click', async (e) => {
      const c = e.target.closest('.cell');
      if (!c || c.disabled || S.busy || !st.mines) return;
      S.busy = true; haptic();
      const cell = +c.dataset.c;
      const before = st.mines.opened.slice();
      c.classList.add('is-pressing');
      try {
        const r = await api.minesOpen(cell);
        if (r.boom) {
          S.reveal = { board: r.board, cell, stars: before };
          sound('lose'); haptic('error'); toast(t('mines.boom'), 'lose');
          $r('#mGrid').classList.add('is-shake'); setTimeout(() => $r('#mGrid')?.classList.remove('is-shake'), 500);
        } else if (r.win !== undefined) {
          S.reveal = { board: r.board, cell: -1, stars: [...before, cell] };
          balanceChanged(); sound('win');
          toast(t('mines.won', { n: fmt(r.win) }), 'win'); confetti({ y: 0.35, count: 110 });
        } else { sound('open'); }
      } catch (err) { errToast(err); }
      c.classList.remove('is-pressing');
      S.busy = false; draw();
    });

    $r('#mHelp').addEventListener('click', () => { sound(); openHelp(); });
    wireBack(root);
    draw();
  }
  return { render };
})();

// ======================= экран: топ =======================
const leaders = (() => {
  const dateLong = (ms) => new Date(ms).toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long' });
  // призы сезона: с сервера (prizes) или из config.js (SEASON_PRIZES)
  const prizesOf = (L) => {
    if (L.prizes?.length) return L.prizes;
    const ids = USER_CFG.SEASON_PRIZES || ['pepe', 'gift-126', 'gift-074'];
    return ids.map((id) => api.catalog.find((g) => g.id === id)).filter(Boolean);
  };

  function render(root) {
    let iv;
    const draw = (L) => {
      const top = L.top || [];
      const prizes = prizesOf(L);
      const name = (p) => esc(p.username ? '@' + p.username : p.name);
      const pod = (p, n) => `
        <div class="pod pod--${n}">
          <div class="pod__u" ${p ? tgAttr(p) : ''}>
            <span class="pod__ava">${p ? avatarHtml(p) : ''}<i>${n}</i></span>
            <b>${p ? name(p) : '—'}</b>
            <span class="pod__v">${star()}${p ? fmt(p.value) : 0}</span>
          </div>
          <div class="pod__col"><span class="pod__prize">${giftImg(prizes[n - 1] || api.catalog[0])}</span></div>
        </div>`;
      root.innerHTML = `
        <section class="season">
          <span class="season__orb"></span>
          <div class="season__top">
            <span class="tag tag--glass">${icon.trophy}${t('lead.season', { n: L.season || 1 })}</span>
            <span class="tag tag--live"><i></i>${t('lead.active')}</span>
          </div>
          <div class="season__prizes">${[prizes[1], prizes[0], prizes[2]].filter(Boolean).map((g, i) => `<span class="season__p season__p--${i}">${giftImg(g)}</span>`).join('')}</div>
          <h2>${t('lead.prizes')}</h2>
          <div class="season__meta"><span>${icon.people}${t('lead.members', { n: fmt(L.players || 0) })}</span><span>${icon.calendar}${t('lead.until', { d: dateLong(L.end) })}</span></div>
          <div class="timer" id="timer"></div>
        </section>
        <button class="rowlink" id="how"><span class="rowlink__ico">${icon.help}</span><span class="grow">${t('lead.how')}</span>${icon.chevron}</button>
        <section class="podium">${pod(top[1], 2)}${pod(top[0], 1)}${pod(top[2], 3)}</section>
        <div class="sec-h"><h2>${t('lead.rating')}</h2></div>
        <section class="lrows">${top.length ? top.map((p, i) => `
          <div class="lrow ${p.id === api.state.user.id ? 'is-me' : ''}" ${tgAttr(p)}>
            <span class="lrow__n ${i < 3 ? `is-${i + 1}` : ''}">${i + 1}</span>${avatarHtml(p, 'lrow__ava')}
            <span class="lrow__nick">${name(p)}</span>
            ${p.nft ? `<span class="lrow__nft">${giftImg(p.nft)}</span>` : ''}
            <span class="lrow__v">${star()}${fmt(p.value)}</span>
          </div>`).join('') : emptyBox(t('lead.empty'), icon.trophy)}</section>`;
      const tick = () => {
        const el = root.querySelector('#timer'); if (!el) return;
        const ms = Math.max(0, L.end - Date.now());
        const v = [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60];
        el.innerHTML = v.map((n, k) => `<div><b>${String(n).padStart(2, '0')}</b><span>${t(['lead.d', 'lead.h', 'lead.m', 'lead.s'][k])}</span></div>`).join('');
      };
      tick(); clearInterval(iv); iv = setInterval(tick, 1000);
      root.querySelector('#how').addEventListener('click', () => { sound(); openHowTo(L); });
    };
    root.innerHTML = `<div class="skeleton skeleton--hero"></div><div class="skeleton"></div><div class="skeleton"></div>`;
    api.leaders().then((L) => { if (current() === 'leaders') draw(L); }).catch(() => {
      if (current() === 'leaders') draw({ top: [], end: Date.now() + 864e5 * 30, players: 0, season: 1 });
    });
    return () => clearInterval(iv);
  }

  function openHowTo(L) {
    const prizes = prizesOf(L);
    const s = sheet(`
      <div class="howto">
        <p class="howto__sub">${t('how.sub')}</p>
        <div class="hcard hcard--blue"><b>${icon.star}${t('how.turnH')}</b><p>${t('how.turn1')}</p></div>
        <div class="hcard hcard--gold"><b>${icon.trophy}${t('how.prizesH')}</b>
          <div class="prizes">${prizes.slice(0, 3).map((g, i) => `<div class="prize"><i>${i + 1}</i>${giftImg(g)}<span>${esc(g.name)}</span></div>`).join('')}</div>
          <p>${t('how.prizesNote')}</p></div>
        <div class="hcard hcard--green"><b>${icon.calendar}${t('how.datesH')}</b><p>${t('how.dur', { d: dateLong(L.end) })}</p></div>
        <div class="hcard hcard--red"><b>${icon.help}${t('how.warnH')}</b><p>${t('how.warn')}</p></div>
        <button class="btn btn--primary btn--lg btn--block" id="howOk">${t('how.ok')}</button>
      </div>`, { title: t('how.title') });
    s.el.querySelector('#howOk').addEventListener('click', () => { sound(); s.close(); });
  }
  return { render };
})();

// ======================= экран: бонусы =======================
const bonus = (() => {
  const left = (ms) => { const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5); return getLang() === 'en' ? `${d}d ${h}h` : `${d}д ${h}ч`; };

  function render(root) {
    const draw = () => {
      const st = api.state;
      root.innerHTML = `
        <div class="page-title"><h1>${t('task.title')}</h1><p>${t('task.text')}</p></div>
        ${freeBlock()}
        <div class="sec-h"><h2>${t('task.list')}</h2></div>
        <section class="tasks">${st.tasks.map((x) => {
          const done = x.progress >= x.goal;
          const pct = Math.min(100, (x.progress / x.goal) * 100);
          const btn = x.claimed ? ''
            : done ? `<button class="btn btn--sm btn--gold" data-claim="${esc(x.id)}">${t('task.claim')}</button>`
            : `<span class="task__prog">${x.progress}/${x.goal}</span>`;
          return `<div class="task ${x.claimed ? 'is-claimed' : done ? 'is-ready' : ''}">
            <span class="task__ring" style="--p:${pct}">${x.claimed ? icon.check : `<b>${Math.round(pct)}%</b>`}</span>
            <div class="task__txt"><b>${esc(x.title)}</b><span>${esc(x.text)}</span>
              <small>${star()}${t('task.reward', { n: x.reward })} · ${icon.clock}${t('task.left', { t: left(x.endsIn || 0) })}</small></div>
            ${btn}</div>`;
        }).join('') || emptyBox(t('common.empty'))}</section>
        ${promoBlock()}
        ${refBanner()}`;

      wireFree(root, draw);
      root.querySelectorAll('[data-claim]').forEach((b) => b.addEventListener('click', async () => {
        b.disabled = true; b.classList.add('is-loading');
        try {
          const reward = await api.claimTask(b.dataset.claim);
          sound('win'); balanceChanged();
          toast(t('toast.gotStars', { n: reward }), 'success'); confetti({ count: 80 });
        } catch (e) { errToast(e); }
        draw();
      }));
      wirePromo(root);
      root.querySelector('#refBan').addEventListener('click', () => { sound(); go('referrals'); });
    };
    draw();
    const onState = () => current() === 'bonus' && draw();
    document.addEventListener('state', onState);
    if (api.live) api.refresh().catch(() => {});
    return () => document.removeEventListener('state', onState);
  }
  return { render };
})();

// ======================= экран: профиль =======================
const profile = (() => {
  const pad = (n) => String(n).padStart(2, '0');
  const dt = (ts) => { const d = new Date(ts); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const TX_ICO = { fee: icon.arrowUp, win: icon.trophy, dep: icon.down, wd: icon.up, bonus: icon.gift, ref: icon.people };

  function txRow(x) {
    const plus = ['win', 'dep', 'bonus', 'ref'].includes(x.type);
    const sub = [x.game, dt(x.date)].filter(Boolean).map(esc).join(' · ');
    return `<div class="tx tx--${x.type}">
      <span class="tx__ico">${x.nft ? giftImg(x.nft) : TX_ICO[x.type] || icon.star}</span>
      <div class="tx__txt"><b>${t(`tx.${x.type}`)}${x.status === 'pending' ? ' <em>⏳</em>' : ''}</b><span>${sub}</span></div>
      <span class="tx__amt ${plus ? 'is-plus' : ''}">${plus ? '+' : '−'}${fmt(x.amount)}${x.currency && x.currency !== 'STARS' ? ` <small>${esc(x.currency)}</small>` : star()}</span>
    </div>`;
  }

  function render(root) {
    const draw = () => {
      const st = api.state; const u = st.user;
      const inv = st.inventory;
      const invValue = inv.reduce((a, g) => a + (g.price || 0), 0);
      root.innerHTML = `
        <section class="me">
          <span class="me__orb me__orb--1"></span><span class="me__orb me__orb--2"></span>
          <button class="icon-btn me__set" id="setBtn" aria-label="settings">${icon.gear}</button>
          <div class="me__ava">${avatarHtml(u)}</div>
          <h1 class="me__name">${esc(u.name)}</h1>
          ${u.username ? `<div class="me__user">@${esc(u.username)}</div>` : ''}
          <div class="me__stats">
            <div><b>${star()}${fmt(st.balance.stars)}</b><span>${t('prof.balance')}</span></div>
            <div><b>${fmt(inv.length)}</b><span>${t('prof.items')}</span></div>
            <div><b>${fmt(st.referrals.count)}</b><span>${t('prof.friends')}</span></div>
          </div>
          <div class="me__acts">
            <button class="btn btn--primary btn--lg" id="dep">${icon.down}${t('pay.dep')}</button>
            <button class="btn btn--glass btn--lg" id="wd">${icon.up}${t('pay.wd')}</button>
          </div>
        </section>

        <section class="panel">
          <div class="panel__h"><h3>${t('prof.inventory')}${inv.length ? ` <small>${star()}${fmt(invValue)}</small>` : ''}</h3>${inv.length ? `<button class="link" id="invAll">${t('common.showAll')} ${inv.length}${icon.chevron}</button>` : ''}</div>
          ${inv.length ? `<div class="ggrid">${inv.slice(0, 6).map((g) => giftCard(g, { key: 'uid' })).join('')}</div>` : emptyBox(t('common.empty'))}
          <button class="btn btn--ghost btn--block" id="invAdd">${icon.plus}${t('up.topUpGifts')}</button>
        </section>

        ${refBanner()}

        <section class="panel">
          <div class="panel__h"><h3>${t('prof.history')}</h3></div>
          <div class="txs">${st.transactions.length ? st.transactions.slice(0, 20).map(txRow).join('') : emptyBox(t('prof.historyEmpty'), icon.clock)}</div>
        </section>

        <button class="rowlink" id="support"><span class="rowlink__ico">${icon.support}</span><span class="grow">${t('set.support')}</span>${icon.chevron}</button>`;

      const $r = (s) => root.querySelector(s);
      $r('#setBtn').addEventListener('click', () => { sound(); openSettings({ onLang: relocalize }); });
      $r('#dep').addEventListener('click', () => { sound(); haptic(); openPay('dep'); });
      $r('#wd').addEventListener('click', () => { sound(); haptic(); openPay('wd'); });
      $r('#invAll')?.addEventListener('click', () => { sound(); openInventory(); });
      root.querySelectorAll('.ggrid [data-k]').forEach((b) => b.addEventListener('click', () => { sound(); go('upgrader'); }));
      $r('#invAdd').addEventListener('click', () => { sound(); openAddGift(); });
      $r('#refBan').addEventListener('click', () => { sound(); go('referrals'); });
      $r('#support').addEventListener('click', () => { sound(); openLink(api.cfg('supportUrl', CONFIG.SUPPORT_URL)); });
    };
    draw();
    const onState = () => current() === 'profile' && draw();
    document.addEventListener('state', onState);
    document.addEventListener('balance', onState);
    if (api.live) api.refresh().catch(() => {});
    return () => { document.removeEventListener('state', onState); document.removeEventListener('balance', onState); };
  }
  return { render };
})();

// ======================= экран: друзья =======================
const referrals = (() => {
  function render(root) {
    const r = api.state.referrals;
    const L = levelsList();
    const cur = L.find((x) => x.n === r.level) || L[0];
    const next = L.find((x) => x.n === (r.level || 1) + 1);
    const prog = next ? Math.min(100, ((r.refDeposits || 0) - cur.from) / (next.from - cur.from) * 100) : 100;
    root.innerHTML = `
      ${pageHead(t('ref.title'))}
      <section class="refhero">
        <span class="refhero__orb"></span>
        ${deco('0311', 'refhero__art')}
        <h2>${t('ref.systemText')}</h2>
        <div class="refhero__perks"><span class="tag tag--glass">${t('ref.perFriend', { n: r.perFriend })}</span><span class="tag tag--glass">${t('ref.perDeposit', { n: r.percent })}</span></div>
        <div class="refhero__stats">
          <div><b>${fmt(r.count)}</b><span>${t('ref.count')}</span></div>
          <div><b>${star()}${fmt(r.earned)}</b><span>${t('ref.earned')}</span></div>
        </div>
      </section>

      <section class="panel">
        <div class="panel__h"><h3>${t('ref.link')}</h3></div>
        <button class="linkbox" id="copyLink"><span>${esc(api.refLink())}</span>${icon.copy}</button>
        <div class="row2">
          <button class="btn btn--glass btn--lg" id="copy2">${icon.copy}${t('ref.copy')}</button>
          <button class="btn btn--primary btn--lg" id="share">${icon.share}${t('ref.share')}</button>
        </div>
      </section>

      <section class="panel">
        <div class="panel__h"><h3>${t('ref.level')}</h3><button class="link" id="lvlMore">${t('ref.moreLevels')}${icon.chevron}</button></div>
        ${levelCard(cur, true)}
        ${next ? `<div class="lvlprog"><div class="bar"><i style="width:${Math.max(2, prog)}%"></i></div><small>${fmt(r.refDeposits || 0)} / ${fmt(next.from)} ⭐ → ${t('ref.levelN', { n: next.n })}</small></div>` : ''}
      </section>

      <section class="panel">
        <div class="panel__h"><h3>${t('ref.all')} <small>${fmt(r.count)}</small></h3></div>
        ${r.list.length ? `<div class="lrows">${r.list.map((f) => `<div class="lrow" ${tgAttr(f)}>${avatarHtml(f, 'lrow__ava')}<span class="lrow__nick">${esc(f.username ? '@' + f.username : f.name)}</span><span class="lrow__v">${star()}+${fmt(f.earned)}</span></div>`).join('')}</div>`
          : emptyBox(t('ref.none'), icon.people)}
      </section>`;
    root.querySelector('#copyLink').addEventListener('click', () => { sound(); copyRef(); });
    root.querySelector('#copy2').addEventListener('click', () => { sound(); copyRef(); });
    root.querySelector('#share').addEventListener('click', () => { sound(); haptic(); shareRef(); });
    root.querySelector('#lvlMore').addEventListener('click', () => { sound(); openLevels(); });
    wireBack(root);
  }
  return { render };
})();
