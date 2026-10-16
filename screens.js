'use strict';
// Void Play — шторки/модалки и все экраны

// ======================= sheets.js =======================
// Шторки и модалки: пополнение/вывод, настройки, подписка, подарки, промокод, игрок и т.д.
const balanceChanged = () => document.dispatchEvent(new Event('balance'));

// ---------- Пополнение / вывод (Frame 198 / 199). 1 ⭐ в игре = 1 Telegram Star ----------
function openPay(mode = 'dep') {
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
function openSettings({ onLang } = {}) {
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
function openSubscribe() {
  const n = api.cfg('subscribeReward', CONFIG.SUBSCRIBE_REWARD);
  const orb = (x, y, sz, o) => `<span class="sub__orb" style="left:${x}%;top:${y}%;width:${sz}px;height:${sz}px;opacity:${o}">${icon.star}</span>`;
  let waiting = false;
  const m = modal(`
    <div class="sub__hero">
      <img class="sub__heroimg" src="img/sub-hero.png" alt="" onload="this.parentNode.classList.add('has-img')" onerror="this.remove()" />
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
function openAddGift() {
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
function openNftPicker({ title, items, selected, key = 'id', onPick }) {
  const s = sheet(`
    <div class="sheet__title">${esc(title)}</div>
    <div class="nft-grid">${items.map((n) => `
      <button class="gcard ${n[key] === selected ? 'is-sel' : ''}" data-k="${esc(n[key])}">${img(n.img)}<span class="gcard__name">${esc(n.name)}</span><span class="gcard__val">${starIco()}${fmt(n.price)}</span></button>`).join('')}</div>`);
  s.el.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
    sound('tick'); haptic(); onPick(items.find((n) => String(n[key]) === b.dataset.k)); s.close();
  }));
}

// ---------- Весь инвентарь ----------
function openInventory() {
  const inv = api.state.inventory;
  sheet(`<div class="sheet__title">${t('prof.inventory')}</div>
    ${inv.length ? `<div class="nft-grid">${inv.map((n) => `<div class="gcard">${img(n.img)}<span class="gcard__name">${esc(n.name)}</span><span class="gcard__val">${starIco()}${fmt(n.price)}</span></div>`).join('')}</div>`
    : `<div class="inv__box is-empty" style="width:100%">${t('common.empty')}</div>`}`);
}

// ---------- Карточка игрока (из LIVE-ленты) ----------
function openPlayer(win) {
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
// картинки уровней 1–6 — это NFT из Figma (Default 020, 065, 023, 090, 074, 047)
const LEVEL_IMG = ['gift-020', 'gift-065', 'gift-023', 'gift-090', 'gift-074', 'gift-047'];
const GLOWS = [['#ffbbb9', '#ff9696'], ['#ff7c00', '#ff7c00'], ['#e552ff', '#e253ff'], ['#4d96ce', '#fff1c3'], ['#ffcc00', '#ffc300'], ['#6cf967', '#11ff00']];
function levels() {
  const L = api.state.levels || [{ n: 1, pct: 5, from: 0 }, { n: 2, pct: 7, from: 1000 }, { n: 3, pct: 10, from: 5000 }, { n: 4, pct: 12, from: 15000 }, { n: 5, pct: 15, from: 50000 }, { n: 6, pct: 20, from: 150000 }];
  return L.map((x, i) => ({ ...x, g1: GLOWS[i % 6][0], g2: GLOWS[i % 6][1] }));
}
const levelCard = (L, imgSrc = `img/${LEVEL_IMG[L.n - 1] || 'gift-004'}.png`) => `
  <div class="lvl">
    <span class="lvl__glow1" style="background:${L.g1}"></span><span class="lvl__glow2" style="background:${L.g2}"></span>
    ${img(imgSrc, 'lvl__img', '', true)}
    <div class="lvl__txt"><b>${t('ref.levelN', { n: L.n })}</b><span>${t('ref.percent', { n: L.pct })}</span><small>${t('ref.from', { n: fmt(L.from) })}</small></div>
  </div>`;
function openLevels() {
  sheet(`<div class="sheet__title">${t('ref.levels')}</div><div class="levels">${levels().map((L) => levelCard(L)).join('')}</div>`);
}

// ---------- Промокод ----------
function openPromo() {
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
function shareRef() {
  const url = `https://t.me/share/url?url=${encodeURIComponent(api.refLink())}&text=${encodeURIComponent(t('prof.shareText'))}`;
  openLink(url);
}

async function copyRef() {
  const link = api.refLink();
  try { await navigator.clipboard.writeText(link); } catch (e) {
    const ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (err) { /* ignore */ } ta.remove();
  }
  haptic('success'); toast(t('common.copied'), 'success');
}

// ---------- Кошелёк TON ----------
// TODO: TON Connect (@tonconnect/ui) + проверка платежей через TON Center на бэке
function connectWallet() { soonToast(); }

// «← Назад» и «?» под шапкой (Figma: upgrader update)
const topbar = (backId, helpId) => `<div class="topbar"><button class="back" id="${backId}"><span class="ico">${icon.arrowLeft}</span>${t('up.back')}</button><button class="qbtn" id="${helpId}" aria-label="help"><span class="ico">${icon.helpCircle}</span></button></div>`;

// ======================= экран: home =======================
const home = (() => {
  // Главная: LIVE-лента, карусель бонусов, промокод, сетка игр
  const D = 'img/';
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

  const GAMES = [
    { id: 'mines', c: 'blue', route: 'mines' }, { id: 'lottery', c: 'pink' },
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

  function render(root) {
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
        <img class="promo__art" src="img/promo-art.png" alt="" onerror="this.closest('.promo').classList.add('no-art');this.remove()" />
        <div class="promo__word">VOID PLAY</div>
        <div class="promo__title">${t('promo.title')}</div>
        <div class="promo__text">${t('promo.text')}</div>
        <button class="promo__btn" id="promoBtn">${t('promo.btn')}</button>
      </section>

      <section class="games">
        ${GAMES.map((g) => `
          <button class="game game--${g.c}" data-game="${g.id}">
            <img class="game__img" src="img/game-${g.id}.webp" alt="" onload="this.parentNode.classList.add('has-img')" onerror="if(!this.dataset.f){this.dataset.f=1;this.src='img/game-${g.id}.png'}else{this.remove()}" />
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
  return { render, GAMES };
})();

// ======================= экран: upgrader =======================
const upgrader = (() => {
  // Апгрейдер: ставка (звёзды или подарок) → цель (NFT) → кольцо шанса
  const S = { tab: 'stars', stake: 0, gift: null, target: null, q: '', spinning: false, rot: 0 };

  const gcard = (n, sel, glass = false) => `
    <button class="gcard ${glass ? 'gcard--glass' : ''} ${sel ? 'is-sel' : ''}" data-id="${esc(n.uid || n.id)}">
      ${img(n.img)}<span class="gcard__name">${esc(n.name)}</span>
      <span class="gcard__val">${starIco()}${fmt(n.price)}</span>
    </button>`;

  function render(root) {
    const st = api.state;
    S.spinning = false; S.rot = 0;
    if (S.gift && !st.inventory.some((g) => g.uid === S.gift.uid)) S.gift = null;
    root.innerHTML = `
      <div class="up">
        ${topbar('upBack', 'upHelp')}
        <div class="up__stage">
          <div class="up__label up__label--l">${t('up.stake')}</div>
          <div class="up__label up__label--r">${t('up.win')}</div>
          <div class="choice choice--l" id="chL"></div>
          <div class="choice choice--r" id="chR"></div>
          <div class="ring" id="ring">
            <div class="ring__glow"></div>
            <div class="ring__outer"></div>
            <div class="ring__dim" id="ringDim"></div>
            <div class="ring__inner"><span class="ring__pct" id="ringPct">0%</span><span class="ring__mul" id="ringMul">x0</span></div>
            <div class="ring__spin" id="ringSpin"><svg class="ring__arrow" viewBox="0 0 27 24"><path fill="currentColor" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" d="M13.5 2.2L24.6 21.6 13.5 15.6 2.4 21.6z"/></svg></div>
          </div>
        </div>
        <button class="up__go" id="upGo"><span class="ico">${icon.chevronUp}</span>${t('up.go')}</button>

        <section class="bet" id="bet">
          <div class="bet__tabs">
            <button class="bet__tab" data-tab="stars">${starsBg()}<span>${t('up.tabStars')}</span></button>
            <button class="bet__tab" data-tab="gifts">${starsBg()}<span>${t('up.tabGifts')}</span></button>
          </div>
          <div class="bet__body" id="betBody"></div>
        </section>

        <section class="target">
          <div class="target__head">
            <span class="target__title">${t('up.target')}</span>
            <label class="search"><span class="ico">${icon.search}</span><input id="tSearch" placeholder="${t('up.search')}" /></label>
          </div>
          <div class="target__grid" id="tGrid"></div>
          <button class="btn-dark" id="tMore"></button>
          <button class="btn-blue" id="tTopUp">${t('up.topUpGifts')}</button>
        </section>
      </div>`;

    const $ = (s) => root.querySelector(s);

    const stakeValue = () => (S.tab === 'gifts' ? (S.gift?.price || 0) : S.stake);

    function drawChoices() {
      const v = stakeValue();
      const L = $('#chL'), R = $('#chR');
      if (S.tab === 'gifts' && S.gift) {
        L.className = 'choice choice--l';
        L.innerHTML = `${choiceShape()}<span class="choice__name">${esc(S.gift.name)}</span>${img(S.gift.img, 'choice__img')}<span class="choice__val">${fmt(S.gift.price)}${starIco()}</span>`;
      } else if (S.tab === 'stars' && v > 0) {
        L.className = 'choice choice--l';
        L.innerHTML = `${choiceShape()}<span class="choice__name">Stars</span><span class="choice__star ico">${icon.star}</span><span class="choice__val">${fmt(v)}${starIco()}</span>`;
      } else {
        L.className = 'choice choice--l is-empty';
        L.innerHTML = `${choiceShape()}<span></span><span class="choice__hint">${t('up.pickStake')}</span><span></span>`;
      }
      if (S.target) {
        R.className = 'choice choice--r';
        R.innerHTML = `${choiceShape()}<span class="choice__name">${esc(S.target.name)}</span>${img(S.target.img, 'choice__img')}<span class="choice__val">${fmt(S.target.price)}${starIco()}</span>`;
      } else {
        R.className = 'choice choice--r is-empty';
        R.innerHTML = `${choiceShape()}<span></span><span class="choice__hint">${t('up.pickTarget')}</span><span></span>`;
      }
      const ch = api.chance(v, S.target?.price);
      $('#ringPct').textContent = `${(ch * 100).toFixed(ch < 0.1 ? 2 : 1).replace(/\.0+$/, '')}%`;
      $('#ringMul').textContent = v && S.target ? `x${(S.target.price / v).toFixed(2)}` : 'x0';
      $('#ringDim').style.setProperty('--deg', `${ch * 360}deg`);
      $('#upGo').disabled = !(v > 0 && S.target) || S.spinning;
    }

    const fitBet = () => { const b = $('#bet'); if (b) b.style.setProperty('--bh', `${b.offsetHeight}px`); };
    function drawBet() {
      root.querySelectorAll('.bet__tab').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === S.tab));
      const body = $('#betBody');
      requestAnimationFrame(fitBet);
      if (S.tab === 'stars') {
        body.innerHTML = `${starsBg()}
          <div class="bet__title">${t('up.enterBet')}</div>
          <label class="bet__amount"><span class="ico">${icon.star}</span><input id="betIn" inputmode="numeric" placeholder="0" value="${S.stake || ''}" /></label>
          <div class="bet__usd">≈ $${(S.stake / st.rates.usdToStars).toFixed(2)}</div>
          <div class="bet__btns"><button data-d="-10">-10</button><button data-d="50">+50</button><button data-d="max">MAX</button></div>`;
        const inp = $('#betIn');
        const fit = () => { inp.style.width = `${Math.max(1, (inp.value || '0').length) + 0.6}ch`; };
        fit();
        inp.addEventListener('input', () => {
          S.stake = Math.max(0, parseInt(inp.value.replace(/\D/g, ''), 10) || 0);
          inp.value = S.stake || ''; fit();
          body.querySelector('.bet__usd').textContent = `≈ $${(S.stake / st.rates.usdToStars).toFixed(2)}`;
          drawChoices();
        });
        body.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => {
          sound('tick'); haptic();
          const d = b.dataset.d;
          S.stake = d === 'max' ? Math.floor(st.balance.stars) : Math.max(0, S.stake + +d);
          drawBet(); drawChoices();
        }));
      } else {
        const inv = st.inventory;
        if (!inv.length) {
          body.innerHTML = `${starsBg()}<div class="bet__title">${t('up.giftForBet')}</div><div class="bet__empty">${t('up.noGifts')}</div><button class="bet__wide" id="betTopUp">${t('up.topUpGifts')}</button>`;
          $('#betTopUp').addEventListener('click', () => { sound(); openAddGift(); });
        } else {
          body.innerHTML = `${starsBg()}<div class="bet__title">${t('up.giftForBet')}</div>
            <div class="bet__gifts">${inv.slice(0, 3).map((g) => gcard(g, S.gift?.uid === g.uid, true)).join('')}</div>
            ${inv.length > 3 ? `<button class="bet__wide" id="betMore">${t('common.showMore', { n: inv.length - 3 })}</button>` : ''}`;
          const pick = (g) => { S.gift = S.gift?.uid === g.uid ? null : g; drawBet(); drawChoices(); };
          body.querySelectorAll('.gcard').forEach((c) => c.addEventListener('click', () => { sound('tick'); pick(inv.find((g) => g.uid === c.dataset.id)); }));
          $('#betMore')?.addEventListener('click', () => { sound(); openNftPicker({ title: t('up.giftForBet'), items: inv, selected: S.gift?.uid, key: 'uid', onPick: pick }); });
        }
      }
    }

    function filtered() {
      const q = S.q.trim().toLowerCase();
      return api.catalog.filter((n) => !q || n.name.toLowerCase().includes(q));
    }
    function drawTargets() {
      const list = filtered();
      // выбранная цель всегда видна первой
      const top = S.target ? [S.target, ...list.filter((n) => n.id !== S.target.id)] : list;
      $('#tGrid').innerHTML = top.slice(0, 3).map((n) => gcard(n, S.target?.id === n.id)).join('') || `<div class="bet__empty">—</div>`;
      $('#tGrid').querySelectorAll('.gcard').forEach((c) => c.addEventListener('click', () => {
        sound('tick'); haptic();
        const n = api.catalog.find((x) => x.id === c.dataset.id);
        S.target = S.target?.id === n.id ? null : n; drawTargets(); drawChoices();
      }));
      const more = Math.max(0, list.length - 3);
      $('#tMore').textContent = t('common.showMore', { n: more });
      $('#tMore').hidden = more === 0;
    }

    async function spin() {
      if (S.spinning) return;
      const v = stakeValue();
      if (!S.target) return toast(t('toast.pickTarget'), 'error');
      if (!v) return toast(t('toast.pickStake'), 'error');
      if (S.tab === 'stars' && v > st.balance.stars) { sound('lose'); return toast(t('toast.noStars'), 'error'); }
      S.spinning = true; drawChoices(); sound(); haptic('medium');
      const ring = $('#ring'); ring.classList.remove('is-win', 'is-lose', 'is-shake'); ring.classList.add('is-spinning');
      let res;
      try {
        res = await api.upgrade({ stakeStars: S.tab === 'stars' ? v : 0, stakeGift: S.tab === 'gifts' ? S.gift : null, target: S.target });
      } catch (e) { S.spinning = false; drawChoices(); return errToast(e); }
      document.dispatchEvent(new Event('balance'));
      // Сектор выигрыша — от 0° (верх) по часовой до chance*360°. Стрелка изначально внизу (180°)
      const sector = res.chance * 360;
      const pad = Math.min(4, sector / 4);
      const final = res.win ? pad + Math.random() * (sector - 2 * pad) : sector + pad + Math.random() * (360 - sector - 2 * pad);
      const base = S.rot - (S.rot % 360);
      S.rot = base + 360 * 5 + (final - 180 + 360) % 360;
      $('#ringSpin').style.transform = `rotate(${S.rot}deg)`;
      let ticks = 0; const tk = setInterval(() => { if (++ticks > 18) clearInterval(tk); sound('tick'); }, 180);
      setTimeout(() => {
        S.spinning = false;
        const won = S.target;
        ring.classList.remove('is-spinning');
        ring.classList.add(res.win ? 'is-win' : 'is-lose');
        if (res.win) { toast(t('toast.win'), 'win'); winReveal(won); }
        else { ring.classList.add('is-shake'); sound('lose'); haptic('error'); toast(t('toast.lose'), 'lose'); }
        if (S.tab === 'gifts') S.gift = null;
        if (S.tab === 'stars') S.stake = Math.min(S.stake, Math.floor(st.balance.stars));
        drawBet(); drawChoices();
      }, 4300);
    }

    root.querySelectorAll('.bet__tab').forEach((b) => b.addEventListener('click', () => { sound('tick'); S.tab = b.dataset.tab; drawBet(); drawChoices(); }));
    $('#tSearch').addEventListener('input', (e) => { S.q = e.target.value; drawTargets(); });
    $('#tMore').addEventListener('click', () => {
      sound();
      openNftPicker({ title: t('up.target'), items: filtered(), selected: S.target?.id, key: 'id', onPick: (n) => { S.target = n; drawTargets(); drawChoices(); } });
    });
    $('#tTopUp').addEventListener('click', () => { sound(); openAddGift(); });
    $('#upHelp').addEventListener('click', () => { sound(); openAddGift(); });
    $('#upBack').addEventListener('click', () => { sound(); go('home'); });
    $('#upGo').addEventListener('click', spin);

    drawBet(); drawTargets(); drawChoices();
    // При каждом входе в апгрейдер показываем, как добавить подарок
    const tm = setTimeout(openAddGift, 350);
    return () => clearTimeout(tm);
  }
  return { render };
})();

// ======================= экран: profile =======================
const profile = (() => {
  // Профиль: аватар, статус, кошелёк, инвентарь, рефералка, история, задания
  // фон карточки — россыпь слова статуса (Figma: Frame 145, opacity 4%)
  function words(word) {
    let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    return Array.from({ length: 38 }, () =>
      `<span style="left:${(rnd() * 110 - 15).toFixed(1)}%;top:${(rnd() * 105 - 5).toFixed(1)}%;font-size:${(10 + rnd() * 9).toFixed(0)}px">${esc(word)}</span>`).join('');
  }

  const pad = (n) => String(n).padStart(2, '0');
  const dt = (ts) => { const d = new Date(ts); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const curIco = (c) => (c === 'TON' ? icon.ton : c === 'USD' ? icon.dollar : icon.starLine);

  function txRow(x) {
    const plus = ['win', 'dep', 'bonus', 'ref'].includes(x.type);
    const title = t(`tx.${x.type}`);
    const meta = x.game ? `“${esc(x.game)}”<i></i>${esc(x.item || '')}` : `<i></i>${esc(x.currency || '')}`;
    const amt = `${plus ? '+' : '-'}${fmt(x.amount)}`;
    const right = x.nft
      ? `<div class="tx__nft">${img(x.nft)}</div><div class="tx__amt">${amt}<span class="ico">${icon.starLine}</span></div>`
      : `<div class="tx__amt tx__amt--big">${amt}<span class="ico">${curIco(x.currency)}</span></div>`;
    const [d, tm] = dt(x.date).split(' ');
    return `<div class="tx tx--${plus ? 'plus' : 'minus'}">
      <div><div class="tx__t">${title}</div><div class="tx__d">${d}&nbsp; ${tm}</div><div class="tx__m">${meta}</div></div>
      <div class="tx__r">${right}</div></div>`;
  }

  function render(root, fresh = false) {
    if (api.live && !fresh) api.refresh().then(() => current() === 'profile' && render(root, true)).catch(() => {});
    const st = api.state; const u = st.user;
    const inv = st.inventory;
    const initial = (u.name || '?').trim()[0]?.toUpperCase() || '?';

    root.innerHTML = `
      <section class="pcard">
        <div class="pcard__words">${words(t('prof.status'))}</div>
        <div class="pcard__ava"><img src="${esc(api.avatarUrl(u))}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('b'),{textContent:'${esc(initial)}'}))" /></div>
        <div class="pcard__name">${esc(u.name)}${u.username ? `<span class="pcard__user">@${esc(u.username)}</span>` : ''}</div>
        <div class="pcard__status"><span>${t('prof.status')}</span><button id="stHelp" aria-label="?">${icon.question}</button></div>
      </section>

      <div class="wtab"><span class="wtab__l"><span class="ico">${icon.wallet}</span>${t('prof.wallet')}</span>
        <button id="walletBtn">${st.wallet ? t('prof.connected') : t('prof.connect')}</button></div>
      <section class="inv">
        <div class="inv__title">${t('prof.inventory')}</div>
        ${inv.length
          ? `<div class="inv__box">${inv.slice(0, 3).map((g) => `<div class="inv__item">${img(g.img)}</div>`).join('')}</div>`
          : `<div class="inv__box is-empty">${t('common.empty')}</div>`}
        <button class="btn-dark" id="invAll">${t('common.showAll')}</button>
        <button class="btn-blue" id="invTopUp">${t('up.topUpGifts')}</button>
      </section>

      <button class="support-btn" id="support"><span class="ico">${icon.support}</span>${t('set.support')}</button>

      <section class="invite">
        <div class="invite__clip"><img class="invite__bear" src="img/bear.png" alt="" onerror="this.remove()" /></div>
        <div class="invite__text">${t('prof.invite')}</div>
        <button class="invite__btn" id="invBtn">${t('prof.inviteBtn')}<span class="ico">${icon.plusCircle}</span></button>
        <button class="invite__share" id="shareBtn" aria-label="share"><span class="ico">${icon.share}</span></button>
        <button class="invite__more" id="refMore">${t('prof.more')}<span class="ico">${icon.arrowRight}</span></button>
      </section>

      <section class="hist">
        <div class="hist__title">${t('prof.history')}</div>
        ${st.transactions.length ? st.transactions.slice(0, 20).map(txRow).join('') : `<div class="tx__empty">${t('prof.historyEmpty')}</div>`}
      </section>

      <section class="earn" id="earn">
        ${starsBg()}
        <span class="earn__glow"></span>
        <img class="earn__img" src="img/star-char.png" alt="" style="left:292px;top:69px;width:52px;height:46px;opacity:.5" onerror="this.remove()" />
        <img class="earn__img" src="img/star-char.png" alt="" style="left:253px;top:41px;width:65px;height:58px;opacity:.7" onerror="this.remove()" />
        <img class="earn__img" src="img/star-char.png" alt="" style="left:177px;top:-4px;width:109px;height:97px" onerror="this.remove()" />
        <div class="earn__t">${t('prof.earn')}</div>
        <button class="earn__btn">${t('prof.earnBtn')}</button>
        <span class="earn__go"><span class="ico">${icon.arrowRight}</span></span>
      </section>`;

    const $ = (s) => root.querySelector(s);
    $('#stHelp').addEventListener('click', () => { sound(); toast(t('prof.statusHint')); });
    $('#walletBtn').addEventListener('click', () => { sound(); connectWallet(); });
    $('#invAll').addEventListener('click', () => { sound(); openInventory(); });
    $('#invTopUp').addEventListener('click', () => { sound(); openAddGift(); });
    $('#support').addEventListener('click', () => { sound(); openLink(CONFIG.SUPPORT_URL); });
    $('#invBtn').addEventListener('click', () => { sound(); haptic(); shareRef(); });
    $('#shareBtn').addEventListener('click', () => { sound(); haptic(); shareRef(); });
    $('#refMore').addEventListener('click', () => { sound(); go('referrals'); });
    $('#earn').addEventListener('click', () => { sound(); go('tasks'); });
  }
  return { render, txRow };
})();

// ======================= экран: referrals =======================
const referrals = (() => {
  // Друзья / реферальная система (Figma: referals + Frame 496)
  function render(root) {
    const r = api.state.referrals;
    const L = levels()[Math.max(0, r.level - 1)] || levels()[0];
    root.innerHTML = `
      <section class="rcard">
        <span class="blob" style="left:168px;top:57px;width:206px;height:122px;background:#677df9"></span>
        <span class="blob" style="left:209px;top:75px;width:165px;height:92px;background:#0022ff"></span>
        ${img('img/deco-0311.png', 'rcard__art', '', true)}
        <div class="rcard__h"><span class="ico">${icon.people}</span>${t('ref.system')}</div>
        <div class="rcard__sub">${t('ref.systemText')}</div>
        <div class="rcard__dot">${t('ref.perFriend', { n: r.perFriend })}</div>
        <div class="rcard__dot">${t('ref.perDeposit', { n: r.percent })}</div>
        <div class="rstats">
          <div class="rstat"><b>${fmt(r.count)}<span class="ico">${icon.people}</span></b><span>${t('ref.count')}</span></div>
          <div class="rstat"><b>${fmt(r.earned)}${starIco()}</b><span>${t('ref.earned')}</span></div>
        </div>
      </section>

      <section class="rcard rcard--link">
        <div class="rcard__h"><span class="ico">${icon.link}</span>${t('ref.link')}</div>
        <div class="rcard__sub">${t('ref.linkText')}</div>
        <button class="rlink" id="copyLink"><span>${esc(api.refLink())}</span><span class="ico">${icon.copy}</span></button>
      </section>

      <section class="rcard">
        <div class="rcard__h"><span class="ico">${icon.levels}</span>${t('ref.level')}</div>
        ${levelCard({ ...L, g1: '#67baf9', g2: '#b8e0ff' }, 'img/gift-004.png')}
        <button class="rmore" id="lvlMore"><span>${t('ref.moreLevels')}</span><span class="ico">${icon.chevronRight}</span></button>
      </section>

      <section class="rcard">
        <div class="rlist__h"><div class="rcard__h"><span class="ico">${icon.people}</span>${t('ref.all')}</div><span>${t('ref.total', { n: r.count })}</span></div>
        ${r.list.length
          ? r.list.map((f) => `<div class="rrow" ${tgAttr(f)}><span class="rrow__u">${avatarHtml(f, api.avatarUrl(f), 'rrow__ava')}${esc(f.username ? '@' + f.username : f.name)}</span><span class="rrow__v">${starIco()}${fmt(f.earned)}</span></div>`).join('')
          : `<div class="rrow rrow--empty">${t('ref.none')}</div>`}
      </section>`;

    root.querySelector('#copyLink').addEventListener('click', () => { sound(); copyRef(); });
    root.querySelector('#lvlMore').addEventListener('click', () => { sound(); openLevels(); });
  }
  return { render };
})();

// ======================= экран: tasks =======================
const tasks = (() => {
  // Задания (Figma: tasks + Frame 525/526). Список заданий потом придёт с бэка
  const left = (ms) => { const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5); return `${d}д ${h}ч`; };

  function render(root) {
    const draw = () => {
      root.innerHTML = `
        <section class="tasks-hd"><h2>${t('task.title')}</h2><p>${t('task.text')}</p></section>
        <section class="tasks">${api.state.tasks.map((x) => {
          const done = x.progress >= x.goal;
          const btn = x.claimed ? `<button class="task__btn is-done" disabled>${t('task.done')}</button>`
            : done ? `<button class="task__btn is-claim" data-claim="${x.id}">${t('task.claim')}</button>`
            : `<button class="task__btn" disabled>${t('task.inProgress')}</button>`;
          return `<div class="task">
            <div class="task__top"><b>${esc(x.title)}</b><span class="task__reward">${t('task.reward', { n: x.reward })}${starIco()}</span></div>
            <div class="task__text">${esc(x.text)}</div>
            <div class="task__bar"><i style="width:${Math.min(100, (x.progress / x.goal) * 100)}%"></i></div>
            <div class="task__meta"><span>${t('task.progress', { a: x.progress, b: x.goal })}</span><span><span class="ico">${icon.clock}</span>${left(x.endsIn)}</span></div>
            ${btn}</div>`;
        }).join('')}</section>`;
      root.querySelectorAll('[data-claim]').forEach((b) => b.addEventListener('click', async () => {
        b.disabled = true;
        try {
          const reward = await api.claimTask(b.dataset.claim);
          sound('win'); haptic('success');
          document.dispatchEvent(new Event('balance'));
          toast(t('toast.gotStars', { n: reward }), 'success'); confetti({ count: 80 });
        } catch (e) { errToast(e); }
        draw();
      }));
    };
    draw();
    if (api.live) api.refresh().then(() => current() === 'tasks' && draw()).catch(() => {});
  }
  return { render };
})();

// ======================= экран: leaders =======================
const leaders = (() => {
  // Лидеры (Figma: leaders): сезон, таймер, «Как это работает», пьедестал, таблица. Тап по игроку — его ЛС
  const prizesOf = (L) => (L.prizes?.length ? L.prizes : api.state.prizes?.length ? api.state.prizes : [api.catalog[1], api.catalog[2], api.catalog[3]]);
  const dateLong = (ms) => new Date(ms).toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'ru-RU', { day: 'numeric', month: 'long' });

  function render(root) {
    let iv;
    const draw = (L) => {
      const top = L.top || [];
      const prizes = prizesOf(L);
      const name = (p) => esc(p.username ? p.username : p.name);
      const pod = (p, n) => {
        const prize = prizes[n - 1] || api.catalog[0];
        return `
        <div class="pod pod--${n} ${p ? '' : 'pod--empty'}">
          <div class="pod__n">${n}</div>
          <div class="pod__box" ${p ? tgAttr(p) : ''}>
            ${p ? avatarHtml(p, api.avatarUrl(p), 'pod__ava') : '<span class="pod__ava"></span>'}
            <div class="pod__u">${p ? name(p) : '—'}</div>
            <div class="pod__v">${p ? fmt(p.value) : 0}${starIco()}</div>
          </div>
          ${img(prize.img)}
          <div class="pod__nft">${esc(prize.name)}</div>
        </div>`;
      };
      const days = Math.max(1, Math.ceil((L.end - Date.now()) / 864e5));
      root.innerHTML = `
        <section class="season">
          <div class="season__top">
            <span class="chip"><span class="ico">${icon.swirl}</span>${t('lead.season', { n: L.season || 1 })}</span>
            <span class="chip chip--live"><i></i>${t('lead.active')}</span>
          </div>
          <div class="season__nfts">${[prizes[1], prizes[0], prizes[2]].filter(Boolean).map((g) => img(g.img)).join('')}</div>
          <div class="season__row">
            <div><span class="ico">${icon.users}</span>${t('lead.members', { n: fmt(L.players || 0) })}</div>
            <div><span class="ico">${icon.calendar}</span>${t('lead.until', { d: dateLong(L.end) })}</div>
          </div>
          <div class="timer" id="timer"></div>
        </section>
        <button class="how" id="how"><span class="how__ico"><span class="ico">${icon.helpCircle}</span></span><span class="how__t"><b>${t('lead.how')}</b><small>${t('lead.howText')}</small></span><span class="ico">${icon.chevronRight}</span></button>
        <section class="podium">${pod(top[1], 2)}${pod(top[0], 1)}${pod(top[2], 3)}</section>
        <div class="lead-note"><span class="ico">${icon.refresh}</span><span>${t('lead.update')} <b>${t('lead.updateIn', { n: days, d: plural(days, 'days') })}</b></span></div>
        <section class="lead-list">${top.length ? top.map((p, i) => `
          <div class="lrow ${i < 3 ? `lrow--${i + 1}` : ''}" ${tgAttr(p)}><span class="lrow__n">${i + 1}</span>${avatarHtml(p, api.avatarUrl(p), 'lrow__ava')}
            <span class="lrow__nick">${name(p)}</span>
            <span class="lrow__v">${starIco()}${fmt(p.value)}</span><span class="lrow__nft">${p.nft ? img(p.nft.img) : ''}</span></div>`).join('')
          : `<div class="lead-empty">${t('lead.empty')}</div>`}</section>`;
      const tick = () => {
        const el = root.querySelector('#timer'); if (!el) return;
        const ms = Math.max(0, L.end - Date.now());
        const v = [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60];
        el.innerHTML = v.map((n, k) => `<div><b>${n}</b><span>${t(['lead.d', 'lead.h', 'lead.m', 'lead.s'][k])}</span></div>`).join('');
      };
      tick(); clearInterval(iv); iv = setInterval(tick, 1000);
      root.querySelector('#how').addEventListener('click', () => { sound(); openHowTo(L); });
    };

    root.innerHTML = `<div class="lead-empty">…</div>`;
    api.leaders().then((L) => { if (current() === 'leaders') draw(L); }).catch(() => {
      if (current() === 'leaders') draw({ top: [], end: Date.now() + 864e5 * 30, players: 0, season: 1 });
    });
    return () => clearInterval(iv);
  }

  // «Как это работает» (Figma: Frame 538)
  function openHowTo(L) {
    const prizes = prizesOf(L);
    const s = sheet(`
      <div class="howto">
        <img class="howto__cup" src="img/trophy.png" alt="" onerror="this.outerHTML='<div class=&quot;howto__cup&quot;>'+TROPHY_SVG+'</div>'" />
        <div class="howto__title">${t('how.title')}</div>
        <div class="howto__sub">${t('how.sub')}</div>
        <div class="hcard hcard--blue">
          <div class="hcard__h">${t('how.turnH')}</div>
          <div class="hcard__li hcard__li--star"><span class="ico">${icon.star}</span><span>${t('how.turn1')}</span></div>
          <p>${t('how.turn2')}</p>
        </div>
        <div class="hcard hcard--gold">
          <div class="hcard__h">${t('how.prizesH')}</div>
          <div class="prizes">${prizes.slice(0, 3).map((g, i) => `<div class="prize prize--${i + 1}"><b>${i + 1}</b>${img(g.img)}<span>${esc(g.name)}</span></div>`).join('')}</div>
          <small>${t('how.prizesNote')}</small>
        </div>
        <div class="hcard hcard--green">
          <div class="hcard__h">${t('how.datesH')}</div>
          <div class="hcard__li hcard__li--ok"><span class="ico">${icon.check}</span><span>${t('how.dur')} ${t('how.durV')}</span></div>
          <div class="hcard__li hcard__li--ok"><span class="ico">${icon.check}</span><span>${t('how.end')} ${dateLong(L.end)}</span></div>
          <div class="hcard__li hcard__li--info"><span class="ico">${icon.info}</span><span>${t('how.reset')}</span></div>
        </div>
        <div class="hcard hcard--red">
          <div class="hcard__h">${t('how.warnH')}</div>
          <p>${t('how.warn')}</p>
        </div>
        <button class="btn-ok" id="howOk">${t('how.ok')}</button>
      </div>`);
    s.el.querySelector('#howOk').addEventListener('click', () => { sound(); s.close(); });
  }
  return { render };
})();

// ======================= экран: mines =======================
const mines = (() => {
  // Мины: поле 5×5, под клетками звёзды и мины. Каждая звезда растит множитель, забрать можно в любой момент
  const COUNTS = [1, 3, 5, 10, 24];
  const S = { stake: 0, count: 3, busy: false, reveal: null };

  function openHelp() {
    sheet(`
      <div class="gift-add">
        <div class="gift-add__title">${t('mines.helpTitle')}</div>
        <div class="gsteps">
          ${['h1', 'h2', 'h3', 'h4'].map((k, i) => `<div class="gsteps__row"><span class="gsteps__n">${i + 1}</span><span>${t('mines.' + k)}</span></div>`).join('')}
        </div>
      </div>`, { cls: 'sheet--plain' });
  }

  function render(root) {
    const st = api.state;
    S.busy = false; S.reveal = null;
    if (st.mines) { S.count = st.mines.mines; S.stake = st.mines.stake; }
    root.innerHTML = `
      ${topbar('mBack', 'mHelp')}
      <section class="mines__info">
        <div class="minfo"><small>${t('mines.mult')}</small><b id="mMult">x1.00</b></div>
        <div class="minfo minfo--next"><small>${t('mines.next')}</small><b id="mNext">x1.00</b></div>
        <div class="minfo minfo--win"><small>${t('mines.win')}</small><b id="mWin">0${starIco()}</b></div>
      </section>
      <section class="mines__board"><div class="mgrid" id="mGrid">${Array.from({ length: 25 }, (_, i) => `<button class="cell" data-c="${i}" aria-label="${i + 1}"></button>`).join('')}</div></section>
      <button class="mines__go" id="mGo"></button>
      <section class="mines__bet" id="mBet">${starsBg()}
        <div class="bet__title">${t('up.enterBet')}</div>
        <label class="bet__amount"><span class="ico">${icon.star}</span><input id="mIn" inputmode="numeric" placeholder="0" /></label>
        <div class="bet__usd" id="mUsd"></div>
        <div class="bet__btns"><button data-d="-10">-10</button><button data-d="50">+50</button><button data-d="max">MAX</button></div>
      </section>
      <section class="mcount" id="mCount">
        <div class="mcount__h">${t('mines.count')}<span id="mOf"></span></div>
        <div class="mcount__row">${COUNTS.map((n) => `<button data-n="${n}"><span class="ico">${icon.bomb}</span>${n}</button>`).join('')}</div>
      </section>`;

    const $ = (q) => root.querySelector(q);
    const inp = $('#mIn');
    const cells = [...root.querySelectorAll('.cell')];
    const fit = () => { inp.style.width = `${Math.max(1, (inp.value || '0').length) + 0.6}ch`; };

    function draw() {
      const g = st.mines;
      const live = !!g;
      const opened = g ? g.opened : [];
      cells.forEach((c, i) => {
        const isStar = opened.includes(i);
        let cls = 'cell';
        let html = '';
        if (isStar) { cls += ' is-star is-open'; html = icon.star; }
        else if (S.reveal) {
          if (S.reveal.board.includes(i)) { cls += ' is-bomb is-open' + (i === S.reveal.cell ? '' : ' is-ghost'); html = icon.bomb; }
          else if (S.reveal.stars?.includes(i)) { cls += ' is-star is-open'; html = icon.star; }
          else { cls += ' is-star is-open is-ghost'; html = icon.star; }
        }
        if (c.className !== cls) { c.className = cls; c.innerHTML = html ? `<span class="ico">${html}</span>` : ''; }
        c.disabled = !live || isStar || S.busy;
      });
      $('#mGrid').classList.toggle('is-live', live);
      const k = opened.length;
      const mult = g ? g.mult : 1;
      const next = g ? g.next : api.minesMult(S.count, 1);
      $('#mMult').textContent = `x${mult.toFixed(2)}`;
      $('#mNext').textContent = next ? `x${next.toFixed(2)}` : '—';
      $('#mWin').innerHTML = `${fmt(g ? Math.floor(g.stake * mult) : 0)}${starIco()}`;
      const go = $('#mGo');
      if (live) {
        go.className = 'mines__go is-cash';
        go.innerHTML = `${t('mines.cash', { n: fmt(Math.floor(g.stake * mult)) })}<span class="ico">${icon.star}</span>`;
        go.disabled = !k || S.busy;
      } else {
        go.className = 'mines__go';
        go.innerHTML = `<span class="ico">${icon.play}</span>${t('mines.play')}`;
        go.disabled = S.busy;
      }
      inp.disabled = live;
      if (document.activeElement !== inp) { inp.value = S.stake || ''; fit(); }
      $('#mUsd').textContent = `≈ $${(S.stake / st.rates.usdToStars).toFixed(2)}`;
      $('#mCount').classList.toggle('is-locked', live);
      $('#mBet').style.opacity = live ? '.6' : '';
      $('#mBet').style.pointerEvents = live ? 'none' : '';
      root.querySelectorAll('[data-n]').forEach((b) => b.classList.toggle('is-active', +b.dataset.n === S.count));
      $('#mOf').textContent = t('mines.of', { n: 25 - S.count });
    }

    inp.addEventListener('input', () => {
      S.stake = Math.max(0, parseInt(inp.value.replace(/\D/g, ''), 10) || 0);
      inp.value = S.stake || ''; fit(); draw();
    });
    root.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => {
      sound('tick'); haptic();
      const d = b.dataset.d;
      S.stake = d === 'max' ? Math.floor(st.balance.stars) : Math.max(0, S.stake + +d);
      draw();
    }));
    root.querySelectorAll('[data-n]').forEach((b) => b.addEventListener('click', () => { sound('tick'); haptic(); S.count = +b.dataset.n; S.reveal = null; draw(); }));

    $('#mGo').addEventListener('click', async () => {
      if (S.busy) return;
      sound(); haptic('medium');
      S.busy = true;
      try {
        if (st.mines) {
          const r = await api.minesCashout();
          document.dispatchEvent(new Event('balance'));
          S.reveal = { board: r.board, cell: -1, stars: [] };
          toast(t('mines.won', { n: fmt(r.win) }), 'win'); confetti({ y: 0.35, count: 110 });
        } else {
          if (!S.stake) { S.busy = false; return toast(t('toast.pickStake'), 'error'); }
          if (S.stake > st.balance.stars) { S.busy = false; sound('lose'); return toast(t('toast.noStars'), 'error'); }
          S.reveal = null;
          await api.minesStart(S.stake, S.count);
          document.dispatchEvent(new Event('balance'));
        }
      } catch (e) { errToast(e); }
      S.busy = false; draw();
    });

    $('#mGrid').addEventListener('click', async (e) => {
      const c = e.target.closest('.cell');
      if (!c || c.disabled || S.busy || !st.mines) return;
      S.busy = true; haptic();
      const cell = +c.dataset.c;
      const before = st.mines.opened.slice();
      try {
        const r = await api.minesOpen(cell);
        if (r.boom) {
          S.reveal = { board: r.board, cell, stars: before };
          sound('lose'); haptic('error'); toast(t('mines.boom'), 'lose');
        } else if (r.win !== undefined) {
          S.reveal = { board: r.board, cell: -1, stars: [...before, cell] };
          document.dispatchEvent(new Event('balance'));
          toast(t('mines.won', { n: fmt(r.win) }), 'win'); confetti({ y: 0.35, count: 110 });
        } else {
          sound('tick');
        }
      } catch (err) { errToast(err); }
      S.busy = false; draw();
    });

    $('#mBack').addEventListener('click', () => { sound(); go('home'); });
    $('#mHelp').addEventListener('click', () => { sound(); openHelp(); });
    draw();
  }
  return { render };
})();

// ======================= экран: soon =======================
const soon = (() => {
  // «Скоро...» (Figma: frame «market») — для игр, которые ещё в разработке
  function render(root) {
    root.innerHTML = `<section class="soon-screen"><div class="soon">${t('common.soon')}</div></section>`;
  }
  return { render };
})();
