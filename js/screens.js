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
const nftCard = (g, { sel, key, cls }) => {
  const [name, num] = String(g.name).split(' #');
  return `
  <button class="gcard gcard--nft ${sel ? 'is-sel' : ''} ${cls}" data-k="${esc(g[key])}">
    <span class="gcard__pic">${giftImg(g)}${num ? `<i class="gcard__num">#${esc(num)}</i>` : ''}</span>
    <span class="gcard__name">${esc(name)}</span>
    <span class="gcard__val">${g.price ? star() + fmt(g.price) : t('nft.pricing')}</span>
  </button>`;
};
const giftCard = (g, { sel = false, key = 'id', cls = '' } = {}) => g.nft ? nftCard(g, { sel, key, cls }) : `
  <button class="gcard rar-${rarity(g.price)} ${sel ? 'is-sel' : ''} ${cls}" data-k="${esc(g[key])}">
    <span class="gcard__img ${g.nft ? 'gcard__img--nft' : ''}">${giftImg(g)}</span>
    ${g.nft ? '<i class="gcard__tag">NFT</i>' : ''}
    <span class="gcard__name">${esc(g.name)}</span>
    <span class="gcard__val">${g.nft && !g.price ? t('nft.pricing') : star() + fmt(g.price)}</span>
  </button>`;
const emptyBox = (text, ic = icon.gift) => `<div class="empty"><span class="empty__ico">${ic}</span><span>${text}</span></div>`;

// ======================= шторки =======================

// ---------- Кошелёк: пополнение / вывод ----------
function openPay(mode = 'dep') {
  const st = api.state;
  let amount = 0, busy = false, method = 'stars', closed = false;
  const s = sheet('', { title: t('pay.title'), cls: 'sheet--pay', onClose: () => { closed = true; } });
  const tonOn = () => !!api.cfg('ton', {}).enabled && st.rates.tonToStars > 0;
  const tonAmount = () => (amount / st.rates.tonToStars).toFixed(3);
  let wallet = st.wallet || tonWallet.address || '';
  const wdFee = () => api.cfg('withdrawFee', 0);
  const wdTon = () => (st.rates.tonOut > 0 ? Math.floor(amount * (1 - wdFee()) / st.rates.tonOut * 1000) / 1000 : 0).toFixed(3);
  const wdLocked = () => api.live && api.cfg('deposited', 0) < api.cfg('wdMinDeposit', 0);
  const goLabel = () => (!amount ? t('pay.min') : mode === 'wd' ? t('pay.wdStars', { n: wdTon() })
    : method === 'ton' ? t('ton.pay', { n: tonAmount() }) : t('pay.payStars', { n: fmt(amount) }));

  // Шаг 2 для TON: адрес, сумма, комментарий — и ждём перевод
  function tonStep(inv, sent = false) {
    s.set(`
      <div class="tonpay">
        ${sent ? `<div class="wsent">${icon.check}<span>${t('w.sent')}</span></div>` : ''}
        <div class="tonpay__sum"><span class="tonpay__ico">${icon.ton}</span><div><small>${t('ton.send')}</small><b>${esc(inv.ton)} TON</b><em>= ${star()}${fmt(inv.stars)}</em></div></div>
        <button class="copyrow" data-copy="${esc(inv.ton)}"><small>${t('pay.amount')}</small><span>${esc(inv.ton)} TON</span>${icon.copy}</button>
        <button class="copyrow" data-copy="${esc(inv.address)}"><small>${t('ton.addr')}</small><span>${esc(inv.address)}</span>${icon.copy}</button>
        <button class="copyrow copyrow--key" data-copy="${esc(inv.comment)}"><small>${t('ton.comment')}</small><span>${esc(inv.comment)}</span>${icon.copy}</button>
        <div class="warn">${icon.help}<div><b>${t('ton.warn')}</b></div></div>
        ${sent ? '' : `<button class="btn btn--ton btn--lg btn--block" id="tonWallet">${icon.ton}${tonWallet.address ? t('w.pay', { n: esc(inv.ton) }) : t('w.connect')}</button>`}
        <button class="btn btn--ghost btn--block" id="tonOpen">${t('w.manual')}</button>
        <div class="tonpay__wait"><i></i><span>${t('ton.wait')}</span></div>
        <p class="note">${t('ton.later')}</p>
      </div>`);
    s.el.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => { sound('tick'); copyText(b.dataset.copy); }));
    s.el.querySelector('#tonOpen').addEventListener('click', () => { sound(); haptic('medium'); openLink(inv.link); });
    s.el.querySelector('#tonWallet')?.addEventListener('click', () => payFromWallet(inv));
    const check = async () => {
      if (closed) return;
      try {
        const r = await api.tonCheck(inv.id);
        if (r.status === 'paid') {
          balanceChanged(); toast(t('toast.gotStars', { n: fmt(r.credited) }), 'success'); confetti(); s.close();
          if (api.live) api.refresh().catch(() => {});
          return;
        }
      } catch (e) { /* сеть моргнула — проверим ещё раз */ }
      setTimeout(check, 4000);
    };
    setTimeout(check, 4000);
  }

  // перевод из подключённого кошелька: сумма и комментарий подставляются сами
  async function payFromWallet(inv) {
    sound(); haptic('medium');
    try {
      await tonWallet.pay({ address: inv.address, nano: inv.nano, comment: inv.comment });
      if (!closed) tonStep(inv, true);
    } catch (e) {
      const m = String(e?.message || e);
      toast(t(/reject|cancel|declin|abort/i.test(m) || e?.code === 'wallet_cancel' ? 'w.cancel' : 'w.fail'), 'error');
    }
  }

  const draw = (focus) => {
    const dep = mode === 'dep';
    if (!dep || !tonOn()) method = 'stars';
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
      ${dep && tonOn() ? `<div class="seg seg--2 seg--pay"><button data-pm="stars" class="${method === 'stars' ? 'is-active' : ''}">${icon.star}Telegram Stars</button><button data-pm="ton" class="${method === 'ton' ? 'is-active' : ''}">${icon.ton}TON</button></div>` : ''}
      ${!dep ? `<label class="wdw"><small>${icon.ton}${t('pay.wdWallet')}</small><span class="wdw__row"><input id="payWal" class="adm__in" placeholder="${t('pay.wdWalletPh')}" value="${esc(wallet)}" autocomplete="off" spellcheck="false" /><button class="wdw__me" id="payMe" aria-label="${t('w.use')}">${icon.wallet}</button></span></label>
        <div class="wdget"><span>${t('pay.wdGet')}</span><b><i>${icon.ton}</i><em id="wdTon">${wdTon()}</em> TON</b></div>` : ''}
      <button class="btn btn--${!dep ? 'pink' : method === 'ton' ? 'ton' : 'primary'} btn--lg btn--block" id="payGo" ${amount ? '' : 'disabled'}>${goLabel()}</button>
      ${!dep ? `<button class="btn btn--gift btn--block" id="payShop">${icon.gift}${t('shop.open')}</button>` : ''}
      <p class="note" id="payNote">${!dep ? (wdLocked() ? `${t('pay.wdNeedDep', { n: api.cfg('wdMinDeposit', 0) })} ⭐` : t('pay.wdRate', { p: +(wdFee() * 100).toFixed(1) })) : method === 'ton' ? `${t('ton.rate', { n: fmt(st.rates.tonToStars) })} ⭐` : t('pay.via')}</p>`);
    const el = s.el;
    el.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { sound('tick'); haptic('select'); mode = b.dataset.m; amount = 0; draw(); }));
    const inp = el.querySelector('#payIn');
    inp.addEventListener('input', () => {
      amount = Math.min(100000, parseInt(inp.value.replace(/\D/g, ''), 10) || 0);
      inp.value = amount || '';
      el.querySelector('.amount__usd').textContent = `≈ $${(amount / st.rates.usdToStars).toFixed(2)}`;
      const go = el.querySelector('#payGo'); go.disabled = !amount;
      go.textContent = goLabel();
      const wt = el.querySelector('#wdTon'); if (wt) wt.textContent = wdTon();
      el.querySelectorAll('[data-p]').forEach((c) => c.classList.toggle('is-active', +c.dataset.p === amount));
    });
    fitAmounts(el);
    if (focus) inp.focus();
    el.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => { sound('tick'); haptic('select'); amount = +b.dataset.p; draw(); }));
    el.querySelectorAll('[data-pm]').forEach((b) => b.addEventListener('click', () => { sound('tick'); haptic('select'); method = b.dataset.pm; draw(); }));
    el.querySelector('#payWal')?.addEventListener('input', (e) => { wallet = e.target.value.trim(); });
    el.querySelector('#payMe')?.addEventListener('click', async () => {
      sound(); const a = tonWallet.address || await tonWallet.connect().catch(() => '');
      if (a) { wallet = a; const w = el.querySelector('#payWal'); if (w) w.value = a; haptic('select'); }
    });
    el.querySelector('#payShop')?.addEventListener('click', () => { sound(); s.close(); openShop(); });
    el.querySelector('#payGo').addEventListener('click', async (e) => {
      if (busy || !amount) return;
      sound(); haptic('medium');
      const btn = e.currentTarget;
      if (mode === 'wd') {
        const min = api.cfg('minWithdraw', 100);
        if (amount < min) return toast(t('pay.minWd', { n: min }), 'error');
        if (amount > st.balance.stars) return toast(t('toast.noStars'), 'error');
        if (wdLocked()) { toast(`${t('pay.wdNeedDep', { n: api.cfg('wdMinDeposit', 0) })} ⭐`, 'error'); mode = 'dep'; amount = 0; return draw(); }
        if (!/^([A-Za-z0-9_\-+/]{48}|-?\d:[0-9a-fA-F]{64})$/.test(wallet)) { el.querySelector('#payWal').focus(); return toast(t('pay.badWallet'), 'error'); }
      }
      busy = true; btn.classList.add('is-loading');
      try {
        if (mode === 'dep' && method === 'ton') {
          const min = api.cfg('ton', {}).minStars || 1;
          if (amount < min) toast(`${t('ton.min', { n: min })} ⭐`, 'error');
          else { const inv = await api.tonInvoice(amount); busy = false; tonStep(inv); if (tonWallet.address) payFromWallet(inv); return; }
        } else if (mode === 'dep') {
          const r = await api.deposit(amount);
          if (r.ok) { balanceChanged(); toast(r.credited ? t('toast.gotStars', { n: fmt(r.credited) }) : t('pay.paid'), 'success'); s.close(); confetti(); }
        } else {
          await api.withdraw(amount, wallet);
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
      <button class="list__row" id="privBtn"><span class="list__ico">${icon.lock}</span><span class="grow">${t('pp.priv')}</span><span class="list__chev">${icon.chevron}</span></button>
      ${api.cfg('admin', false) ? `<button class="list__row list__row--adm" id="admBtn"><span class="list__ico">${icon.bolt}</span><span class="grow">Админ-панель</span><span class="list__chev">${icon.chevron}</span></button>` : ''}
      <div class="list__row"><span class="list__ico">${icon.server}</span><span class="grow">${t('set.server')}</span><span class="netpill is-${conn.status}"><i></i>${conn.status === 'demo' ? 'demo' : conn.status}</span></div>
    </div>
    <p class="note">${esc(CONFIG.APP_NAME)} · v2.0</p>`, { title: t('set.title') });
  const el = s.el;
  el.querySelector('#swSound').addEventListener('click', (e) => { prefs.set('sound', !prefs.get('sound')); e.currentTarget.classList.toggle('is-on', prefs.get('sound')); sound('tick'); haptic('select'); });
  el.querySelector('#vol').addEventListener('input', (e) => prefs.set('volume', +e.target.value));
  el.querySelector('#vol').addEventListener('change', () => sound('tick'));
  el.querySelectorAll('[data-l]').forEach((b) => b.addEventListener('click', () => { sound('tick'); prefs.set('lang', b.dataset.l); setLang(b.dataset.l); s.close(); onLang && onLang(); }));
  el.querySelector('#privBtn').addEventListener('click', () => { s.close(); openProfile(api.state.user.id); });
  el.querySelector('#admBtn')?.addEventListener('click', () => { sound(); s.close(); openAdmin(); });
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
  const s = sheet(`<button class="btn btn--gift btn--block" id="invShop" style="margin:0 0 12px">${icon.gift}${t('shop.title')}</button>` + (inv.length ? `<div class="ggrid">${inv.map((g) => giftCard(g, { key: 'uid' })).join('')}</div>`
    : `${emptyBox(t('common.empty'))}<button class="btn btn--primary btn--lg btn--block" id="invAdd">${t('up.topUpGifts')}</button>`), { title: t('prof.inventory') });
  s.el.querySelector('#invShop').addEventListener('click', () => { sound(); s.close(); openShop(); });
  s.el.querySelector('#invAdd')?.addEventListener('click', () => { sound(); s.close(); openAddGift(); });
  s.el.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
    sound(); s.close();
    const g = inv.find((x) => x.uid === b.dataset.k);
    g?.nft ? openNft(g) : go('upgrader');
  }));
}

// ---------- Магазин: настоящие NFT со склада бота ----------
function openShop() {
  const items = api.state.shop || [];
  const s = sheet(`<p class="note" style="margin:0 0 12px">${t('shop.sub')}</p>` + (items.length
    ? `<div class="ggrid">${items.map((g) => giftCard({ ...g, price: g.buy })).join('')}</div>` : emptyBox(t('shop.empty'))), { title: t('shop.title') });
  s.el.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
    const g = items.find((x) => x.id === b.dataset.k); sound(); s.close();
    let busy = false;
    const c = sheet(`
      <div class="nftv rar-${rarity(g.buy)}">
        <div class="nftv__art"><span class="nftv__glow"></span>${giftImg(g, '', true)}<i class="gcard__tag">NFT</i></div>
        <h3 class="nftv__name">${esc(g.name)}</h3>
        <div class="nftv__meta">${[g.model, g.backdrop].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('')}</div>
        <button class="btn btn--primary btn--xl btn--block" id="shopGo">${t('shop.buy', { n: `${star()}${fmt(g.buy)}` })}</button>
      </div>`, { title: '' });
    c.el.querySelector('#shopGo').addEventListener('click', async (e) => {
      if (busy) return;
      if (g.buy > api.state.balance.stars) { c.close(); openPay('dep'); return toast(t('toast.noStars'), 'error'); }
      busy = true; e.currentTarget.disabled = true; sound(); haptic('medium');
      try {
        await api.shopBuy(g.id); balanceChanged(); c.close(); haptic('success'); confetti(); toast(t('shop.done'), 'success');
        const mine = api.state.inventory.find((x) => x.id === g.id); if (mine) openNft(mine);
      } catch (err) { busy = false; e.currentTarget.disabled = false; errToast(err); if (err?.code === 'not_found') api.refresh().catch(() => {}); }
    });
  }));
}

// ---------- Админ-панель (видна только админам, сервер проверяет id) ----------
function openAdmin() {
  let d = null, found = null, busy = false;
  const s = sheet('<div class="adm" id="adm"><div class="adm__load">Загрузка…</div></div>', { title: 'Админ-панель', cls: 'sheet--adm' });
  const root = s.el.querySelector('#adm');
  const sum = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
  const SRC = { roulette: 'Рулетка', fireice: 'Огонь и лёд', withdraw: 'Выводы', shop: 'Магазин' };
  const act = async (action, data = {}, okText = 'Готово') => {
    if (busy) return; busy = true; root.classList.add('is-busy');
    try { const r = await api.admin(action, data); d = r; if (r.error) { busy = false; root.classList.remove('is-busy'); draw(); return toast(r.error, 'error'); } if ('found' in r) found = r.found; if (action === 'sync') okText = `Добавлено на склад: ${r.added}`; haptic('success'); toast(okText, 'success'); api.refresh().catch(() => {}); }
    catch (e) { errToast(e); }
    busy = false; root.classList.remove('is-busy'); draw();
  };
  function draw() {
    if (!d) return;
    const inc = d.income;
    root.innerHTML = `
      <div class="adm__tiles">
        <div class="adm__tile adm__tile--hero"><small>Заработок сегодня</small><b>${star()}${fmt(sum(inc.day))}</b></div>
        <div class="adm__tile"><small>7 дней</small><b>${star()}${fmt(sum(inc.week))}</b></div>
        <div class="adm__tile"><small>Всё время</small><b>${star()}${fmt(sum(inc.all))}</b></div>
      </div>
      <div class="adm__chips">${Object.entries(inc.all).map(([k, v]) => `<span>${SRC[k] || esc(k)} <b>${fmt(v)}</b></span>`).join('') || '<span>Комиссий пока нет</span>'}</div>
      <div class="adm__tiles adm__tiles--4">
        <div class="adm__tile"><small>Игроков</small><b>${fmt(d.users)}</b><em>+${fmt(d.usersDay)} за сутки</em></div>
        <div class="adm__tile"><small>Пополнено</small><b>${star()}${fmt(d.deposits)}</b></div>
        <div class="adm__tile"><small>На балансах</small><b>${star()}${fmt(d.balances)}</b><em>касса: ${fmt(d.cash ? d.cash.left : 0)} из ${fmt(d.cash ? d.cash.in : 0)}</em></div>
        <div class="adm__tile"><small>Склад NFT</small><b>${fmt(d.stock.length)}</b><em>у игроков: ${fmt(d.nfts.in || 0)}</em></div>
      </div>

      <h4 class="adm__h">Заявки на вывод <small>${d.withdrawals.length}</small></h4>
      ${d.withdrawals.length ? d.withdrawals.map((w) => `
        <div class="adm__row">
          ${avatarHtml(w.user, 'prow__ava')}
          <div class="grow"><b>${esc(w.user.username ? '@' + w.user.username : w.user.name)}</b><small>id ${w.user.id} · списано ${fmt(w.amount)} · комиссия ${fmt(w.fee)}</small></div>
          ${w.ton ? `<button class="adm__ton" data-copy="${esc(w.wallet)}" data-pay="ton://transfer/${esc(w.wallet)}?amount=${Math.round(w.ton * 1e9)}">${icon.ton}${w.ton}</button>` : `<span class="adm__pay">${star()}${fmt(w.amount - w.fee)}</span>`}
          <button class="adm__ok" data-wd="wd_done" data-id="${w.id}" aria-label="paid">${icon.check}</button>
          <button class="adm__no" data-wd="wd_reject" data-id="${w.id}" aria-label="reject">${icon.close}</button>
        </div>`).join('') : '<div class="adm__empty">Заявок нет</div>'}

      <h4 class="adm__h">Игры</h4>
      <div class="list">${Object.entries(d.titles).map(([g, title]) => `<div class="list__row"><span class="grow">${esc(title)}</span><button class="switch ${d.games[g] ? 'is-on' : ''}" data-game="${g}"></button></div>`).join('')}</div>

      <h4 class="adm__h">Склад и цены <small>${d.connected ? 'аккаунт подключён' : 'аккаунт не подключён'}</small></h4>
      <button class="btn btn--ghost btn--block" id="admSync">${icon.gift}Загрузить подарки с аккаунта</button>
      ${d.stock.length ? `<p class="note" style="margin:0">Нажми на подарок: блокировка, приз ТОПа, цена, забрать себе</p><div class="ggrid">${d.stock.map((g) => `<div class="adm__g ${g.locked ? 'is-locked' : ''}">${giftCard(g)}${g.prize ? `<i class="adm__prize">${icon.trophy}${g.prize}</i>` : g.locked ? `<i class="adm__lock">${icon.lock}</i>` : ''}</div>`).join('')}</div>` : '<div class="adm__empty">Склад пуст: сюда попадают подарки с твоего аккаунта и проигранные в апгрейдере</div>'}
      <form class="adm__form" id="admFloor"><input class="adm__in" name="name" placeholder="Коллекция (PlushPepe)" required /><input class="adm__in" name="price" inputmode="numeric" placeholder="Цена ⭐" required /><button class="btn btn--primary btn--sm">OK</button></form>
      <div class="adm__chips">${Object.entries(d.floors).sort().map(([k, v]) => `<span data-fl="${esc(k)}">${esc(k)} <b>${fmt(v)}</b></span>`).join('')}</div>

      <h4 class="adm__h">Игрок</h4>
      <form class="adm__form" id="admFind"><input class="adm__in" name="q" placeholder="id или @username" required /><button class="btn btn--primary btn--sm">Найти</button></form>
      ${found ? `
        <div class="adm__user">
          <div class="adm__row">${avatarHtml(found, 'prow__ava')}<div class="grow"><b>${esc(found.name)} ${found.username ? '@' + esc(found.username) : ''}</b><small>id ${found.id} · пополнил ${fmt(found.deposits)} · подарков ${found.gifts}</small></div><span class="adm__pay">${star()}${fmt(found.balance)}</span></div>
          <form class="adm__form" id="admStars"><input class="adm__in" name="amount" inputmode="text" placeholder="+100 или -50" required /><button class="btn btn--primary btn--sm">Начислить</button>
            <button type="button" class="btn btn--sm ${found.banned ? 'btn--ghost' : 'btn--pink'}" id="admBan">${found.banned ? 'Разбанить' : 'Бан'}</button></form>
        </div>` : ''}`;
    starifyNode(root);
    root.querySelectorAll('[data-wd]').forEach((b) => b.addEventListener('click', () => act(b.dataset.wd, { id: +b.dataset.id }, b.dataset.wd === 'wd_done' ? 'Отмечено: выплачено' : 'Отклонено, звёзды возвращены')));
    root.querySelectorAll('[data-game]').forEach((b) => b.addEventListener('click', () => act('game', { game: b.dataset.game, open: !d.games[b.dataset.game] })));
    root.querySelectorAll('.adm__ton').forEach((b) => b.addEventListener('click', () => {
      copyText(b.dataset.copy); toast('Адрес скопирован — открываю кошелёк', 'success');
      try { window.open(b.dataset.pay, '_blank'); } catch (e) { /* нет кошелька на устройстве */ }
    }));
    root.querySelector('#admSync').addEventListener('click', () => act('sync'));
    const ff = root.querySelector('#admFloor');
    ff.addEventListener('submit', (e) => { e.preventDefault(); act('floor', { name: ff.name.value, price: parseInt(ff.price.value.replace(/\D/g, ''), 10) || 0 }); });
    root.querySelectorAll('[data-fl]').forEach((c) => c.addEventListener('click', () => { ff.name.value = c.dataset.fl; ff.price.focus(); }));
    root.querySelectorAll('.ggrid [data-k]').forEach((c) => c.addEventListener('click', () => {
      const g = d.stock.find((x) => x.id === c.dataset.k); sound();
      const m = sheet(`
        <div class="nftv">
          <div class="nftv__art" style="width:min(40vw,150px)">${giftImg(g)}<i class="gcard__tag">NFT</i></div>
          <h3 class="nftv__name">${esc(g.name)}</h3>
          <div class="nftv__price">${g.price ? star() + fmt(g.price) : 'цена не задана'}</div>
          <div class="list" style="width:100%">
            <button class="list__row" data-a="lock"><span class="list__ico">${icon.lock}</span><span class="grow">${g.locked ? 'Разблокировать — вернуть в магазин' : 'Заблокировать — скрыть от игроков'}</span></button>
            <button class="list__row" data-a="prize"><span class="list__ico">${icon.trophy}</span><span class="grow">${g.prize ? `Убрать из призов ТОПа (${g.prize} место)` : 'Сделать призом ТОПа'}</span></button>
            <button class="list__row" data-a="floor"><span class="list__ico">${icon.star}</span><span class="grow">Задать цену коллекции</span></button>
            <button class="list__row" data-a="take"><span class="list__ico">${icon.gift}</span><span class="grow">Забрать себе в инвентарь</span></button>
          </div>
        </div>`, { title: '' });
      m.el.querySelectorAll('[data-a]').forEach((x) => x.addEventListener('click', () => {
        const a = x.dataset.a; m.close();
        if (a === 'floor') { ff.name.value = g.slug.split('-')[0]; ff.price.focus(); return ff.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        if (a === 'lock') act('lock', { id: g.id, locked: !g.locked }, g.locked ? 'Подарок снова доступен игрокам' : 'Подарок заблокирован');
        else if (a === 'prize') act('prize', { id: g.id }, g.prize ? 'Убран из призов' : 'Добавлен в призы ТОПа (места идут по порядку добавления)');
        else act('take', { id: g.id }, 'Подарок у тебя в инвентаре');
      }));
    }));
    const fq = root.querySelector('#admFind');
    fq.addEventListener('submit', (e) => { e.preventDefault(); act('user', { q: fq.q.value }, 'Найден'); });
    const fs = root.querySelector('#admStars');
    fs?.addEventListener('submit', (e) => { e.preventDefault(); const n = parseInt(fs.amount.value.replace(/[^\d-]/g, ''), 10); if (n) act('stars', { id: found.id, amount: n }); });
    root.querySelector('#admBan')?.addEventListener('click', () => act('ban', { id: found.id, banned: !found.banned }));
  }
  api.admin().then((r) => { d = r; draw(); }).catch((e) => { errToast(e); s.close(); });
}

// ---------- Карточка NFT-подарка: играть или вывести ----------
function openNft(g) {
  let busy = false;
  const s = sheet(`
    <div class="nftv rar-${rarity(g.price)}">
      <div class="nftv__art"><span class="nftv__glow"></span>${giftImg(g, '', true)}<i class="gcard__tag">NFT</i></div>
      <h3 class="nftv__name">${esc(g.name)}</h3>
      <div class="nftv__meta">${[g.model, g.backdrop].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('')}</div>
      <div class="nftv__price">${g.price ? star() + fmt(g.price) : t('nft.pricing')}</div>
      <div class="nftv__btns">
        <button class="btn btn--primary btn--lg" id="nftPvp">${icon.swords}${t('nft.pvp')}</button>
        <button class="btn btn--ghost btn--lg" id="nftUp">${t('nft.upg')}</button>
      </div>
      <button class="btn btn--pink btn--lg btn--block" id="nftWd">${icon.up}${t('nft.wd')}</button>
      <p class="note">${t('nft.fee')}: ${star()}${fmt(g.fee || 0)}</p>
    </div>`, { title: '' });
  s.el.querySelector('#nftPvp').addEventListener('click', () => { sound(); s.close(); go('pvp'); });
  s.el.querySelector('#nftUp').addEventListener('click', () => { sound(); s.close(); go('upgrader'); });
  s.el.querySelector('#nftWd').addEventListener('click', async (e) => {
    if (busy) return;
    if ((g.fee || 0) > api.state.balance.stars) { s.close(); openPay('dep'); return toast(t('toast.noStars'), 'error'); }
    busy = true; e.currentTarget.disabled = true; sound(); haptic('medium');
    try { await api.nftWithdraw(g.uid); balanceChanged(); s.close(); haptic('success'); confetti(); toast(t('nft.done'), 'success'); }
    catch (err) { busy = false; e.currentTarget.disabled = false; errToast(err); }
  });
}

// ---------- Игрок из ленты ----------
function openPlayer(win) { if (win?.user?.id) openProfile(win.user.id); }

// ---------- Публичный профиль игрока ----------
let profileOpen = false;
async function openProfile(uid) {
  if (!uid || profileOpen) return;
  profileOpen = true; sound(); haptic('light');
  const me = String(uid) === String(api.state.user.id);
  const s = sheet('<div class="pp pp--load"><span class="pp__spin"></span></div>', { cls: 'sheet--pp', onClose: () => { profileOpen = false; } });
  let p;
  try { p = await api.profile(uid); } catch (e) { s.close(); return errToast(e); }
  const since = new Date(p.joined || Date.now()).toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'ru-RU', { month: 'long', year: 'numeric' });
  const hue = (Number(p.id) * 47) % 360;
  const stat = (v, l, cls = '') => `<div class="pp__stat ${cls}"><b>${v}</b><small>${l}</small></div>`;
  const draw = () => {
    const user = me ? (api.state.user.hideUser ? '' : api.state.user.username) : p.username;
    s.set(`
    <div class="pp" style="--h:${hue}">
      <div class="pp__banner"><span class="pp__orb pp__orb--1"></span><span class="pp__orb pp__orb--2"></span><span class="pp__stars"></span></div>
      <div class="pp__ava">${avatarHtml({ ...p, username: '' }).replace('data-uid', 'data-x')}${p.rank && p.rank <= 3 ? `<i class="pp__crown pp__crown--${p.rank}">${icon.trophy}</i>` : ''}</div>
      <h2 class="pp__name">${esc(p.name)}</h2>
      ${user ? `<button class="pp__user" id="ppDm">@${esc(user)}${icon.chevron}</button>` : `<span class="pp__user is-hidden">${icon.lock}${t('pp.hidden')}</span>`}
      <div class="pp__tags">
        ${p.rank ? `<span class="pp__tag pp__tag--gold">${icon.trophy}#${fmt(p.rank)} <em>${t('pp.rank')}</em></span>` : ''}
        ${p.favorite ? `<span class="pp__tag">${icon.play}${esc(p.favorite)}</span>` : ''}
        <span class="pp__tag">${icon.clock}${t('pp.since', { d: since })}</span>
      </div>
      <div class="pp__stats">
        ${stat(fmt(p.games), t('pp.games'))}${stat(`${star()}${fmt(p.won)}`, t('pp.won'), 'is-gold')}${stat(fmt(p.wins), t('pp.wins'))}
      </div>
      ${p.best ? `<div class="pp__best">${p.best.gift ? `<span class="pp__bimg">${giftImg(p.best.gift)}</span>` : `<span class="pp__bstar">${icon.star}</span>`}
        <span class="grow"><small>${t('pp.best')}</small><b>${p.best.gift ? esc(p.best.gift.name) : `${fmt(p.best.amount)} Stars`}</b><em>${esc(p.best.game || '')}</em></span>
        <b class="pp__bv">${star()}${fmt(p.best.amount)}</b></div>` : ''}
      <div class="pp__h"><h3>${t('pp.gifts')} <small>${fmt(p.giftCount || 0)}</small></h3>${p.giftValue ? `<span>${star()}${fmt(p.giftValue)}</span>` : ''}</div>
      ${(p.gifts || []).length ? `<div class="ggrid pp__gifts">${p.gifts.map((g) => giftCard(g, { cls: 'is-static' })).join('')}</div>` : `<div class="pp__empty">${icon.gift}<span>${t('pp.noGifts')}</span></div>`}
      ${user ? `<button class="btn btn--primary btn--lg btn--block" id="ppDm2">${icon.send}${t('pp.dm')}</button>` : ''}
      ${me ? `<div class="pp__priv"><span class="grow"><b>${t('pp.hide')}</b><small>${t('pp.hideT')}</small></span><button class="switch ${api.state.user.hideUser ? 'is-on' : ''}" id="ppHide" aria-label="hide"></button></div>
        <p class="note">${t('pp.me')}</p>` : ''}
    </div>`);
    const dm = () => { sound(); haptic(); openLink(`https://t.me/${user}`); };
    s.el.querySelector('#ppDm')?.addEventListener('click', dm);
    s.el.querySelector('#ppDm2')?.addEventListener('click', dm);
    s.el.querySelector('#ppHide')?.addEventListener('click', async () => {
      sound('tick'); haptic('select');
      try { await api.setPrivacy(!api.state.user.hideUser); draw(); } catch (e) { errToast(e); }
    });
  };
  draw();
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
  const dMin = api.cfg('dailyMinDeposit', 0), dLock = api.live && dMin > 0 && api.cfg('deposited', 0) < dMin;
  steps.push({ id: 'daily', ic: icon.calendar, reward: st.daily?.reward || api.cfg('dailyReward', 3), done: st.daily?.ready === false, lock: dLock, title: t('free.daily'), text: dLock ? `${t('free.dailyLock', { n: dMin })}` : st.daily?.ready === false ? t('free.dailyDone') : t('free.dailyT'), repeat: true });
  if (bets) steps.push({ id: 'bets', ic: icon.play, reward: bets.reward, done: !!bets.claimed, ready: bets.progress >= bets.goal, title: t('free.bets'), text: `${t('free.betsT')} · ${Math.min(bets.progress, bets.goal)}/${bets.goal}` });
  const r3 = st.tasks.find((x) => x.id === 'ref3');
  if (r3) steps.push({ id: 'ref', ic: icon.people, reward: r3.reward, done: !!r3.claimed, title: t('free.ref3'), text: `${t('free.ref3T')} · ${Math.min(r3.progress, r3.goal)}/${r3.goal}` });
  else if (st.referrals.perFriend > 0) steps.push({ id: 'ref', ic: icon.people, reward: st.referrals.perFriend, done: st.referrals.count > 0, title: t('free.ref'), text: t('free.refT', { n: st.referrals.perFriend }), repeat: true });
  const total = steps.filter((x) => !x.lock).reduce((a, x) => a + x.reward, 0);
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
    else if (id === 'ref') {
      const r3 = api.state.tasks.find((x) => x.id === 'ref3');
      if (r3 && r3.progress >= r3.goal && !r3.claimed) {
        b.classList.add('is-loading');
        try { const r = await api.claimTask('ref3'); balanceChanged(); toast(t('toast.gotStars', { n: r }), 'success'); confetti({ count: 80 }); } catch (e) { errToast(e); }
        redraw && redraw();
      } else shareRef();
    } else if (id === 'bets') {
      const bets = api.state.tasks.find((x) => x.id === 'bets5');
      if (bets && bets.progress >= bets.goal && !bets.claimed) {
        b.classList.add('is-loading');
        try { const r = await api.claimTask('bets5'); balanceChanged(); toast(t('toast.gotStars', { n: r }), 'success'); confetti({ count: 80 }); } catch (e) { errToast(e); }
        redraw && redraw();
      } else go(api.gameOpen('mines') ? 'mines' : 'pvp');
    } else if (id === 'daily') {
      if (api.live && api.cfg('dailyMinDeposit', 0) > api.cfg('deposited', 0)) { toast(`${t('free.dailyLock', { n: api.cfg('dailyMinDeposit', 0) })} ⭐`); return openPay('dep'); }
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
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); } catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (err) { /* ignore */ } ta.remove();
  }
  haptic('success'); toast(t('common.copied'), 'success');
}
const copyRef = () => copyText(api.refLink());
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
    { id: 'cases', c: 'pink', route: 'cases' }, { id: 'crash', c: 'blue', route: 'crash' }, { id: 'lottery', c: 'pink' },
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

  const gameTile = (g, i) => {
    const open = g.route && api.gameOpen(g.id);
    return `
        <button class="game game--${g.c} ${open ? '' : 'is-locked'} ${i < 2 ? 'game--big' : ''}" data-game="${g.id}">
          <img class="game__art" src="img/games/${g.id}.webp" alt="" loading="lazy" decoding="async" />
          <span class="game__shade"></span>
          ${open ? `<span class="tag tag--live"><i></i>${t('home.online')}</span>` : `<span class="tag tag--lock">${icon.lock}${t(g.route ? 'game.closed' : 'common.soon')}</span>`}
          <span class="game__txt"><b>${t('game.' + g.id)}</b>${i < 2 ? `<small>${t(`game.${g.id}.d`)}</small>` : ''}</span>
          ${open ? `<span class="game__go">${icon.play}</span>` : ''}
        </button>`;
  };
  const pvpCards = () => `
        <button class="pvpcard pvpcard--rl ${api.gameOpen('roulette') ? '' : 'is-locked'}" data-pvp="roulette">
          <span class="pvpcard__art"><i class="miniwheel"></i><i class="miniwheel__ptr"></i></span>
          <span class="pvpcard__txt"><b>${t('pvp.roulette')}</b><small>${t('pvp.rouletteD')}</small></span>
          ${api.gameOpen('roulette') ? `<span class="tag tag--live"><i></i>PvP</span>` : `<span class="tag tag--lock">${icon.lock}${t('game.closed')}</span>`}
        </button>
        <button class="pvpcard pvpcard--fi ${api.gameOpen('fireice') ? '' : 'is-locked'}" data-pvp="fireice">
          <span class="pvpcard__art pvpcard__art--fi"><i class="fi-ico fi-ico--fire">${icon.fire}</i><i class="fi-ico fi-ico--ice">${icon.snow}</i></span>
          <span class="pvpcard__txt"><b>${t('pvp.fireice')}</b><small>${t('pvp.fireiceD')}</small></span>
          ${api.gameOpen('fireice') ? `<span class="tag tag--live"><i></i>PvP</span>` : `<span class="tag tag--lock">${icon.lock}${t('game.closed')}</span>`}
        </button>`;

  function render(root) {
    const active = GAMES.filter((g) => g.route && api.gameOpen(g.id)).length;
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
          ${(() => { const real = api.live ? (api.state.shop || []).slice(0, 3) : [{ id: 'pepe' }, { id: 'gift-126' }, { id: 'gift-074' }]; const fb = ['bear', 'calendar', '0259']; return [0, 1, 2].map((i) => real[i] ? giftImg(real[i], `hero__g hero__g--${i + 1} ${real[i].nft ? 'hero__g--nft' : ''}`) : deco(fb[i], `hero__g hero__g--${i + 1}`)).join(''); })()}
        </div>
        <div class="hero__txt">
          <span class="tag tag--fire">${icon.fire}${t('home.heroTag')}</span>
          <h2>${t('home.heroTitle')}</h2>
          <p>${t('home.heroText')}</p>
          <button class="btn btn--white btn--lg">${icon.play}${t('common.play')}</button>
        </div>
      </section>

      <div class="sec-h"><h2><span class="sec-h__ico">${icon.swords}</span>${t('pvp.title')}</h2></div>
      <section class="pvpcards" id="pvpCards">${pvpCards()}</section>

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
      <section class="games" id="games">${GAMES.map(gameTile).join('')}</section>`;

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

    const openGame = (id, route, el) => {
      if (route && api.gameOpen(id)) { sound(); haptic('medium'); go(route); return; }
      sound('lose'); haptic('warning'); el.classList.remove('is-shake'); void el.offsetWidth; el.classList.add('is-shake');
      toast(t(route ? 'game.closedToast' : 'common.soonToast'));
    };
    root.querySelector('#hero').addEventListener('click', (e) => openGame('upgrade', 'upgrader', e.currentTarget));
    root.querySelector('#pvpCards').addEventListener('click', (e) => {
      const b = e.target.closest('[data-pvp]'); if (!b) return;
      if (api.gameOpen(b.dataset.pvp)) pvp.setTab(b.dataset.pvp);
      openGame(b.dataset.pvp, 'pvp', b);
    });
    root.querySelector('#games').addEventListener('click', (e) => {
      const el = e.target.closest('.game'); if (!el) return;
      const g = GAMES.find((x) => x.id === el.dataset.game);
      openGame(g.id, g.route, el);
    });
    // статусы игр могли поменяться (админ закрыл/открыл) — перерисовываем плитки
    const drawGames = () => {
      const a = root.querySelector('#games'), b = root.querySelector('#pvpCards');
      if (a) a.innerHTML = GAMES.map(gameTile).join('');
      if (b) b.innerHTML = pvpCards();
    };
    document.addEventListener('state', drawGames);
    const drawFree = () => { const slot = root.querySelector('#freeSlot'); if (slot) { slot.innerHTML = freeCard(); wireFree(slot); } };
    wireFree(root);
    document.addEventListener('state', drawFree); document.addEventListener('balance', drawFree);

    return () => {
      alive = false; clearInterval(auto); clearTimeout(liveTimer);
      document.removeEventListener('state', drawFree); document.removeEventListener('balance', drawFree); document.removeEventListener('state', drawGames);
    };
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
        <p class="uphint" id="upHint"></p>
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
    const maxFor = (g) => (g ? api.maxStake(g.price) : Infinity);
    function drawChoices() {
      // ставка звёздами не может быть больше лимита для выбранной цели
      if (S.tab === 'stars' && S.stake > maxFor(S.target)) {
        S.stake = maxFor(S.target);
        const inp = $r('#betIn'); if (inp) { inp.value = S.stake || ''; fitAmount(inp); }
        const usd = root.querySelector('#betBody .amount__usd'); if (usd) usd.textContent = `≈ $${(S.stake / st.rates.usdToStars).toFixed(2)}`;
      }
      const v = stakeValue();
      $r('#upHint').innerHTML = S.target ? `${t('up.maxStake', { n: '' })}${star()}${fmt(maxFor(S.target))}` : '';
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
          S.stake = d === 'max' ? Math.min(Math.floor(st.balance.stars), maxFor(S.target)) : d === 'x2' ? S.stake * 2 : Math.max(0, S.stake + +d);
          S.stake = Math.min(S.stake, maxFor(S.target));
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
          S.gift = S.gift?.uid === g.uid ? null : g;
          // подарок дороже лимита текущей цели — цель нужно выбрать заново
          if (S.gift && S.target && S.gift.price > maxFor(S.target)) { S.target = null; toast(t('up.needBigger')); }
          drawBet(); drawTargets(); drawChoices();
        }));
      }
    }

    // цели, которые подходят под ставку подарком (цель должна быть заметно дороже подарка)
    const giftNeed = () => (S.tab === 'gifts' && S.gift ? S.gift.price : 0);
    const filtered = () => {
      const q = S.q.trim().toLowerCase(), need = giftNeed();
      return api.catalog.filter((n) => (!q || n.name.toLowerCase().includes(q)) && maxFor(n) >= need);
    };
    function drawTargets() {
      const list = filtered();
      const top = S.target ? [S.target, ...list.filter((n) => n.id !== S.target.id)] : list;
      $r('#tGrid').innerHTML = top.slice(0, 6).map((n) => giftCard(n, { sel: S.target?.id === n.id })).join('') || `<div class="ggrid__empty">${emptyBox(t(api.catalog.length ? 'up.noMatch' : 'up.noTargets'), api.catalog.length ? icon.search : icon.gift)}</div>`;
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
      const pick = api.catalog.filter((g) => maxFor(g) >= v).sort((a, c) => Math.abs(a.price - want) - Math.abs(c.price - want))[0];
      if (!pick) return toast(t('err.notFound'), 'error');
      S.target = pick; drawTargets(); drawChoices();
      b.classList.add('is-active');
    }));

    async function spin() {
      if (S.spinning) return;
      const v = stakeValue();
      if (!S.target) return toast(t('toast.pickTarget'), 'error');
      if (!v) return toast(t('toast.pickStake'), 'error');
      if (v > maxFor(S.target)) return toast(t('up.tooBig'), 'error');
      if (S.tab === 'stars' && v > st.balance.stars) { sound('lose'); openPay('dep'); return toast(t('toast.noStars'), 'error'); }
      S.spinning = true; drawChoices(); sound(); haptic('heavy');
      const ring = $r('#ring'); ring.classList.remove('is-win', 'is-lose'); ring.classList.add('is-spinning');
      const ptr = $r('#ringPtr');
      let res;
      try {
        res = await api.upgrade({ stakeStars: S.tab === 'stars' ? v : 0, stakeGift: S.tab === 'gifts' ? S.gift : null, target: S.target });
      } catch (e) {
        S.spinning = false; ring.classList.remove('is-spinning');
        if (e?.code === 'not_found') { S.target = null; api.refresh().then(() => { drawTargets(); drawChoices(); }).catch(() => {}); }   // цель уже забрали
        drawChoices(); return errToast(e);
      }
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
        if (!api.catalog.some((n) => n.id === S.target?.id)) S.target = null;   // выигранный подарок ушёл со склада
        drawTargets();
        if (S.tab === 'stars') S.stake = Math.min(S.stake, Math.floor(st.balance.stars));
        drawBet(); drawChoices();
      }, 4400);
    }

    root.querySelectorAll('#tabs [data-tab]').forEach((b) => b.addEventListener('click', () => {
      sound('tick'); haptic('select'); S.tab = b.dataset.tab;
      if (giftNeed() && S.target && giftNeed() > maxFor(S.target)) S.target = null;
      drawBet(); drawTargets(); drawChoices();
    }));
    $r('#tSearch').addEventListener('input', (e) => { S.q = e.target.value; drawTargets(); });
    $r('#tMore').addEventListener('click', () => {
      sound();
      openNftPicker({ title: t('up.target'), items: filtered(), selected: S.target?.id, onPick: (n) => { S.target = n; drawTargets(); drawChoices(); } });
    });
    $r('#slotR').addEventListener('click', () => { if (S.spinning) return; sound(); openNftPicker({ title: t('up.target'), items: filtered(), selected: S.target?.id, onPick: (n) => { S.target = n; drawTargets(); drawChoices(); } }); });
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
    if (L.prizes?.length || api.live) return L.prizes || [];
    const ids = USER_CFG.SEASON_PRIZES || ['pepe', 'gift-126', 'gift-074'];
    const found = ids.map((id) => api.catalog.find((g) => g.id === id)).filter(Boolean);
    return found.length ? found : [...api.catalog].sort((a, b) => b.price - a.price).slice(0, 3);
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
          <div class="pod__col">${prizes[n - 1] ? `<span class="pod__prize">${giftImg(prizes[n - 1])}</span>` : ''}</div>
        </div>`;
      root.innerHTML = `
        <section class="season">
          <span class="season__orb"></span>
          <div class="season__top">
            <span class="tag tag--glass">${icon.trophy}${t('lead.season', { n: L.season || 1 })}</span>
            <span class="tag tag--live"><i></i>${t('lead.active')}</span>
          </div>
          <div class="season__prizes">${[prizes[1], prizes[0], prizes[2]].filter(Boolean).map((g, i) => `<span class="season__p season__p--${i}">${giftImg(g)}</span>`).join('')}</div>
          <h2>${t('lead.prizes')}</h2>${prizes.length ? '' : `<p class="season__none">${t('lead.noPrizes')}</p>`}
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
          <button class="me__ava" id="meView">${avatarHtml({ ...u, id: 0 })}<i class="me__eye">${icon.eye}</i></button>
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
        <button class="wcard ${tonWallet.address ? 'is-on' : ''}" id="wCard">
          <span class="wcard__ico">${icon.ton}</span>
          <span class="grow"><b>${tonWallet.address ? t('w.connected') : t('w.connect')}</b><small>${tonWallet.address ? esc(tonWallet.short(tonWallet.address)) : t('w.sub')}</small></span>
          <span class="wcard__go">${tonWallet.address ? t('w.off') : icon.chevron}</span>
        </button>

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
      $r('#meView').addEventListener('click', () => openProfile(u.id));
      $r('#wCard').addEventListener('click', async () => {
        sound(); haptic();
        try { if (tonWallet.address) await tonWallet.disconnect(); else await tonWallet.connect(); } catch (e) { toast(t('w.fail'), 'error'); }
        draw();
      });
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

// ======================= экран: PvP =======================
const pvp = (() => {
  const S = { tab: 'roulette', amount: 0, side: null };
  const COLORS = ['#3d6bff', '#ff3d7f', '#ffc226', '#34d399', '#a855f7', '#ff8a3d', '#22d3ee', '#f472b6', '#a3e635', '#f87171', '#60a5fa', '#fbbf24'];
  const R = 72, C = 2 * Math.PI * R;
  const TURNS = 7;
  const pct = (x) => `${(x * 100).toFixed(x > 0 && x < 0.1 ? 1 : 0)}%`;
  const mult = (x) => `x${x >= 100 ? Math.round(x) : x.toFixed(x >= 10 ? 1 : 2)}`;
  const uname = (u) => esc(u?.username ? '@' + u.username : u?.name || '—');
  const sideName = (s) => t(s === 'fire' ? 'pvp.fire' : 'pvp.ice');
  const sideIco = (s) => `<i class="fi-ico fi-ico--${s}">${s === 'fire' ? icon.fire : icon.snow}</i>`;

  // Объёмные иконки сторон: пламя и ледяной кристалл
  const ART = {
    fire: `<svg viewBox="0 0 64 72" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="pvF1" x1="32" y1="2" x2="32" y2="68" gradientUnits="userSpaceOnUse"><stop stop-color="#ffd76a"/><stop offset=".42" stop-color="#ff6a1a"/><stop offset="1" stop-color="#b80f08"/></linearGradient>
        <linearGradient id="pvF2" x1="32" y1="22" x2="32" y2="64" gradientUnits="userSpaceOnUse"><stop stop-color="#fff6b8"/><stop offset=".6" stop-color="#ffb21f"/><stop offset="1" stop-color="#ff7412"/></linearGradient>
        <radialGradient id="pvF3" cx="32" cy="56" r="13" gradientUnits="userSpaceOnUse"><stop stop-color="#fff"/><stop offset="1" stop-color="#ffe680"/></radialGradient>
      </defs>
      <ellipse cx="32" cy="67" rx="19" ry="4" fill="#000" opacity=".3"/>
      <path class="fl fl--1" d="M32 2C36 14 50 22 52 40C54 56 44 68 32 68C20 68 10 56 12 42C13 34 18 30 20 22C23 28 26 30 27 30C26 20 28 10 32 2Z" fill="url(#pvF1)"/>
      <path class="fl fl--1" d="M22 27C19 33 15.5 37 15 44C14.6 50 17 56 21 60C17 53 18 44 22 38C23.5 35.5 23 31 22 27Z" fill="#fff" opacity=".22"/>
      <path class="fl fl--2" d="M33 22C36 30 44 36 44 47C44 58 38 64 32 64C25 64 20 58 20 49C20 43 24 40 26 35C28 39 30 40 31 40C30 34 31 28 33 22Z" fill="url(#pvF2)"/>
      <path class="fl fl--3" d="M32 40C34 45 38 48 38 54C38 59 35 62 32 62C29 62 26 59 26 55C26 51 29 49 30 46C31 48 31.5 48 32 48C31.5 45 31.5 42 32 40Z" fill="url(#pvF3)"/>
    </svg>`,
    ice: `<svg viewBox="0 0 64 72" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="pvI1" x1="18" y1="4" x2="46" y2="66" gradientUnits="userSpaceOnUse"><stop stop-color="#f4fdff"/><stop offset=".5" stop-color="#7fdcff"/><stop offset="1" stop-color="#2a6bff"/></linearGradient>
        <linearGradient id="pvI2" x1="32" y1="24" x2="32" y2="64" gradientUnits="userSpaceOnUse"><stop stop-color="#c4f2ff"/><stop offset="1" stop-color="#1650d8"/></linearGradient>
      </defs>
      <ellipse cx="32" cy="67.5" rx="23" ry="4" fill="#000" opacity=".28"/>
      <path d="M13 30L22 38L20 60L9 62L5 46Z" fill="url(#pvI2)"/><path d="M13 30L22 38L14 48L5 46Z" fill="#fff" opacity=".4"/>
      <path d="M51 26L60 42L57 61L45 60L44 38Z" fill="url(#pvI2)"/><path d="M51 26L60 42L50 46L44 38Z" fill="#fff" opacity=".45"/>
      <path d="M32 3L46 20V50L32 67L18 50V20Z" fill="url(#pvI1)"/>
      <path d="M32 3L46 20L32 26Z" fill="#fff" opacity=".55"/><path d="M32 3L18 20L32 26Z" fill="#fff" opacity=".9"/>
      <path d="M32 26L46 20V50L32 67Z" fill="#0b3fc4" opacity=".3"/><path d="M18 20L32 26V67L18 50Z" fill="#fff" opacity=".12"/>
      <path d="M22 25L26 27V45L22 47Z" fill="#fff" opacity=".6"/>
      <path class="sp sp--1" d="M52 8l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6z" fill="#fff"/>
      <path class="sp sp--2" d="M9 14l1.1 3 3 1.1-3 1.1-1.1 3-1.1-3-3-1.1 3-1.1z" fill="#fff"/>
    </svg>`,
  };
  const bulbs = Array.from({ length: 24 }, (_, i) => {
    const a = (i * 15 * Math.PI) / 180;
    return `<i style="left:${(50 + 47.6 * Math.sin(a)).toFixed(2)}%;top:${(50 - 47.6 * Math.cos(a)).toFixed(2)}%"></i>`;
  }).join('');

  // ---------- быстрые ставки: игрок настраивает 4 кнопки под себя ----------
  const QDEF = ['-10', '+50', 'x2', 'max'];
  const quickChips = () => { try { const v = JSON.parse(localStorage.getItem('vp_chips') || 'null'); if (Array.isArray(v) && v.length === 4) return v; } catch (e) { /* ignore */ } return QDEF; };
  const qNorm = (r) => {
    const v = String(r || '').trim().toLowerCase().replace(/\s/g, '').replace('−', '-').replace('х', 'x').replace('×', 'x');
    if (v === 'max' || v === 'макс' || v === 'all') return 'max';
    if (/^x[2-9]$/.test(v) || v === '1/2' || v === '/2') return v === '1/2' ? '/2' : v;
    if (/^[+-]\d{1,6}$/.test(v) || /^\d{1,6}$/.test(v)) return v;
    return null;
  };
  const qLabel = (r) => (r === 'max' ? 'MAX' : r === '/2' ? '½' : r[0] === '-' ? `−${r.slice(1)}` : r);
  function applyQuick(r, cur, bal) {
    if (r === 'max') return bal;
    if (r === '/2') return Math.floor(cur / 2);
    if (r[0] === 'x') return cur * +r.slice(1);
    if (r[0] === '+' || r[0] === '-') return Math.max(0, cur + Number(r));
    return Number(r);
  }
  function editQuick(done) {
    const cur = quickChips();
    const s = sheet(`<p class="howto__sub">${t('qc.text')}</p>
      <div class="qedit">${cur.map((r, i) => `<label><small>${i + 1}</small><input class="adm__in" data-qi="${i}" value="${esc(r)}" maxlength="8" autocomplete="off" /></label>`).join('')}</div>
      <div class="qedit__ex">${['10', '100', '+25', '-5', 'x2', '1/2', 'max'].map((x) => `<button class="chip" data-ex="${x}">${esc(qLabel(qNorm(x)))}</button>`).join('')}</div>
      <button class="btn btn--primary btn--lg btn--block" id="qSave">${t('qc.save')}</button>
      <button class="btn btn--ghost btn--block" id="qReset">${t('qc.reset')}</button>`, { title: t('qc.title') });
    let focus = s.el.querySelector('[data-qi="0"]');
    s.el.querySelectorAll('[data-qi]').forEach((i) => i.addEventListener('focus', () => { focus = i; }));
    s.el.querySelectorAll('[data-ex]').forEach((b) => b.addEventListener('click', () => { sound('tick'); focus.value = b.dataset.ex; const n = s.el.querySelector(`[data-qi="${+focus.dataset.qi + 1}"]`); if (n) { n.focus(); focus = n; } }));
    s.el.querySelector('#qSave').addEventListener('click', () => {
      const vals = [...s.el.querySelectorAll('[data-qi]')].map((i) => qNorm(i.value));
      const bad = vals.findIndex((v) => !v);
      if (bad >= 0) { haptic('warning'); return toast(t('qc.bad', { n: bad + 1 }), 'error'); }
      try { localStorage.setItem('vp_chips', JSON.stringify(vals)); } catch (e) { /* ignore */ }
      sound(); haptic('success'); s.close(); done();
    });
    s.el.querySelector('#qReset').addEventListener('click', () => { try { localStorage.removeItem('vp_chips'); } catch (e) { /* ignore */ } sound(); s.close(); done(); });
  }

  // ---------- история раундов и повтор ----------
  const ago = (ms) => {
    const s = Math.max(1, Math.round((Date.now() - ms) / 1000)), en = getLang() === 'en';
    const v = s < 60 ? `${s} ${en ? 's' : 'с'}` : s < 3600 ? `${Math.round(s / 60)} ${en ? 'min' : 'мин'}` : s < 86400 ? `${Math.round(s / 3600)} ${en ? 'h' : 'ч'}` : `${Math.round(s / 86400)} ${en ? 'd' : 'дн'}`;
    return t('ph.ago', { n: v });
  };
  async function openHistory(game) {
    sound(); haptic();
    const s = sheet('<div class="pp pp--load"><span class="pp__spin"></span></div>', { title: t('ph.title'), cls: 'sheet--hist' });
    let list;
    try { list = await api.pvpHistory(game); } catch (e) { s.close(); return errToast(e); }
    const me = api.state.user.id;
    s.set(list.length ? `<div class="hlist">${list.map((r, k) => {
      const w = game === 'roulette' ? r.winner : null, my = r.my, won = my && my.payout > 0;
      const gifts = r.players.flatMap((p) => p.gifts || []).slice(0, 3);
      return `<button class="hrow ${won ? 'is-won' : my ? 'is-lost' : ''}" data-k="${k}">
        ${game === 'roulette' ? avatarHtml(w || {}, 'hrow__ava').replace('data-uid', 'data-x') : `<span class="hrow__side hrow__side--${r.winner}">${r.winner === 'fire' ? icon.fire : icon.snow}</span>`}
        <span class="hrow__main"><b>${game === 'roulette' ? esc(w ? (w.username ? '@' + w.username : w.name) : '—') : t('pvp.sideWon', { s: t(r.winner === 'fire' ? 'pvp.fire' : 'pvp.ice') })}</b>
          <small>${t('ph.round', { n: r.id })} · ${ago(r.at)} · ${r.players.length} ${icon.people}</small></span>
        ${gifts.length ? `<span class="hrow__gifts">${gifts.map((g) => giftImg(g)).join('')}</span>` : ''}
        <span class="hrow__pot"><b>${star()}${fmt(r.pot)}</b><small>${(r.chance * 100).toFixed(r.chance < 0.1 ? 1 : 0)}%${won ? ` · <em class="is-won">+${fmt(my.payout)}</em>` : my ? ' · <em class="is-lost">' + t('ph.you') + '</em>' : ''}</small></span>
      </button>`;
    }).join('')}</div>` : emptyBox(t('ph.empty'), icon.clock));
    s.el.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => replay(game, list[+b.dataset.k], me)));
  }
  function replay(game, r, me) {
    sound(); haptic();
    const ps = r.players, pot = ps.reduce((a, p) => a + p.amount, 0) || 1;
    const wid = game === 'roulette' ? r.winner?.id : null;
    let segs = '', acc = 0;
    ps.forEach((p, i) => { const len = (p.amount / pot) * C, gap = ps.length > 1 ? Math.min(2.4, len / 3) : 0;
      segs += `<circle class="wheel__seg" data-i="${i}" cx="100" cy="100" r="${R}" stroke="${COLORS[i % COLORS.length]}" stroke-dasharray="${Math.max(0.5, len - gap)} ${C}" stroke-dashoffset="${-acc}"/>`; acc += len; });
    const s = sheet(`
      <div class="rp">
        <div class="rp__head"><b>${t('ph.round', { n: r.id })}</b><small>${ago(r.at)} · ${t('pvp.pot')} ${star()}${fmt(r.pot)}${r.prize ? ` · ${t('ph.gifts', { n: r.prize })}` : ''}</small></div>
        ${game === 'roulette' ? `
        <div class="rp__wheel" id="rpW"><span class="wheel__bezel"></span>
          <div class="wheel__rot" id="rpRot"><svg viewBox="0 0 200 200"><circle class="wheel__track" cx="100" cy="100" r="${R}"/><g transform="rotate(-90 100 100)">${segs}</g></svg></div>
          <span class="wheel__ptr"><svg viewBox="0 0 30 38"><path d="M15 37L3.5 13A12.4 12.4 0 1 1 26.5 13Z" fill="#ffc94a" stroke="#7a3d00"/><circle cx="15" cy="12" r="5" fill="#ff3d7f" stroke="#fff" stroke-width="1.6"/></svg></span>
          <div class="rp__center" id="rpC"><small>${t('pvp.pot')}</small><b>${star()}${fmt(r.pot)}</b></div>
        </div>` : `
        <div class="rp__tug"><div class="tug__bar"><i class="tug__fire" style="width:${(ps.filter((p) => p.side === 'fire').reduce((a, p) => a + p.amount, 0) / pot) * 100}%"></i><span class="tug__mark" id="rpMark" style="left:0%"></span></div></div>`}
        <button class="btn btn--glass btn--block" id="rpAgain">${icon.play}${t('ph.again')}</button>
        <div class="pp__h"><h3>${t('ph.players')} <small>${ps.length}</small></h3></div>
        <div class="plist">${ps.map((p, i) => {
          const win = game === 'roulette' ? p.id === wid : p.side === r.winner;
          return `<div class="prow ${p.id === me ? 'is-me' : ''} ${win ? 'is-win' : 'is-lose'}" data-row="${i}">
            ${game === 'roulette' ? `<i class="prow__dot" style="background:${COLORS[i % COLORS.length]}"></i>` : sideIco(p.side)}
            ${avatarHtml(p, 'prow__ava')}<span class="prow__nick">${uname(p)}</span>
            ${(p.gifts || []).length ? `<span class="prow__gifts">${p.gifts.slice(0, 3).map((g) => giftImg(g)).join('')}</span>` : ''}
            ${win && p.payout ? `<span class="prow__win">+${fmt(p.payout)}</span>` : `<span class="prow__pct">${pct(p.chance)}</span>`}
            <span class="prow__v">${star()}${fmt(p.amount)}</span></div>`; }).join('')}</div>
        <button class="copyrow" id="rpSeed"><small>seed · roll ${Number(r.roll).toFixed(6)}</small><span>${esc(r.seed)}</span>${icon.copy}</button>
      </div>`, { title: t('ph.replay'), cls: 'sheet--hist' });
    const play = () => {
      sound('open'); s.el.querySelectorAll('.prow').forEach((x) => x.classList.add('is-wait'));
      const done = () => { s.el.querySelectorAll('.prow').forEach((x) => x.classList.remove('is-wait')); s.el.querySelector('#rpW')?.classList.add('is-done'); };
      if (game === 'roulette') {
        const rot = s.el.querySelector('#rpRot'); s.el.querySelector('#rpW').classList.remove('is-done');
        rot.style.transition = 'none'; rot.style.transform = 'rotate(0deg)'; void rot.offsetWidth;
        rot.style.transition = 'transform 4.6s cubic-bezier(.12,.75,.1,1)'; rot.style.transform = `rotate(${360 * 6 - r.roll * 360}deg)`;
        let n = 0; const tk = setInterval(() => { if (++n > 22) return clearInterval(tk); sound('tick'); }, 180);
        setTimeout(() => { done(); const w = ps.findIndex((p) => p.id === wid); s.el.querySelectorAll('.wheel__seg').forEach((x) => x.classList.toggle('is-on', +x.dataset.i === w));
          s.el.querySelector('#rpC').innerHTML = w >= 0 ? `${avatarHtml(ps[w], 'rp__ava').replace('data-uid', 'data-x')}<b class="is-gold">+${fmt(ps[w].payout)}</b>` : ''; sound('win'); haptic('success'); }, 4700);
      } else {
        const m = s.el.querySelector('#rpMark');
        m.animate([{ left: '0%' }, { left: '100%' }, { left: '8%' }, { left: '92%' }, { left: `${r.roll * 100}%` }], { duration: 3800, easing: 'cubic-bezier(.3,.05,.2,1)', fill: 'forwards' });
        setTimeout(() => { done(); sound('win'); }, 3900);
      }
    };
    s.el.querySelector('#rpAgain').addEventListener('click', play);
    s.el.querySelector('#rpSeed').addEventListener('click', () => copyText(r.seed));
    setTimeout(play, 350);
  }

  const betPanel = () => `
    <section class="panel" id="betPanel">
      <label class="amount">
        <span class="amount__l">${t('up.enterBet')}</span>
        <span class="amount__in">${star()}<input id="pIn" inputmode="numeric" placeholder="0" value="${S.amount || ''}" autocomplete="off" /></span>
        <span class="amount__usd" id="pMy"></span>
      </label>
      <div class="qchips" id="qChips">${quickChips().map((r) => `<button class="chip" data-q="${esc(r)}">${esc(qLabel(r))}</button>`).join('')}<button class="chip chip--edit" id="qEdit" aria-label="edit">${icon.pen}</button></div>
      <button class="btn btn--xl btn--block btn--primary" id="pGo"></button>
      ${S.tab === 'roulette' ? `<button class="btn btn--gift btn--block" id="pGift">${icon.gift}${t('nft.bet')}</button>` : ''}
      <button class="btn btn--ghost btn--block" id="pCancel" hidden>${t('pvp.cancel')}</button>
    </section>`;
  const tail = () => `
    <section class="panel"><div class="panel__h"><h3>${t('pvp.players')} <small id="pCount">0</small></h3><span class="pvp-fee">${t('pvp.fee')} <b id="pFee"></b> · ${t('pvp.feeNote')}</span></div><div class="plist" id="pList"></div></section>
    <section class="panel" id="histBox" hidden><div class="panel__h"><h3>${t('pvp.history')}</h3></div><div class="hscroll phist" id="pHist"></div></section>
    <button class="rowlink" id="fair"><span class="rowlink__ico rowlink__ico--green">${icon.check}</span><span class="grow">${t('pvp.fair')}</span>${icon.chevron}</button>`;

  const BODY = {
    roulette: () => `
      <section class="arena" id="arena">
        <span class="arena__rays"></span>
        <div class="wheel" id="wheel">
          <span class="wheel__halo"></span>
          <span class="wheel__bezel"></span>
          <div class="wheel__bulbs">${bulbs}</div>
          <div class="wheel__rot" id="wRot"><svg viewBox="0 0 200 200" id="wSvg"></svg><div class="wheel__avas" id="wAvas"></div></div>
          <span class="wheel__gloss"></span>
          <span class="wheel__ptr" id="wPtr"><svg viewBox="0 0 30 38"><defs><linearGradient id="pvP" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff6c9"/><stop offset=".5" stop-color="#ffc94a"/><stop offset="1" stop-color="#e07a00"/></linearGradient></defs><path d="M15 37L3.5 13A12.4 12.4 0 1 1 26.500 13Z" fill="url(#pvP)" stroke="#7a3d00" stroke-width="1"/><circle cx="15" cy="12" r="5" fill="#ff3d7f" stroke="#fff" stroke-width="1.6"/></svg></span>
          <div class="wheel__center" id="wCenter">
            <svg class="wheel__ring" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/><circle id="wRing" cx="50" cy="50" r="46"/></svg>
            <div class="wc wc--pot" id="wcPot"><small id="wLabel">${t('pvp.pot')}</small><b id="wPot">${star()}<i id="wPotV">0</i></b><span id="wTimer"></span></div>
            <div class="wc wc--who" id="wcWho" hidden></div>
            <div class="wc wc--count" id="wcCount" hidden><b id="wCountV">3</b><small>${t('pvp.last')}</small></div>
          </div>
        </div>
        <div class="arena__stats">
          <div><small>${t('pvp.players')}</small><b id="aPlayers">0</b></div>
          <div class="is-accent"><small>${t('pvp.yourChance')}</small><b id="aChance">—</b></div>
          <div class="is-gold"><small>${t('pvp.mult')}</small><b id="aWin">—</b></div>
        </div>
        <span class="arena__next" id="aNext"></span>
      </section>
      <div class="pvpres" id="pvpRes" hidden></div>
      ${betPanel()}${tail()}`,
    fireice: () => `
      <section class="duel" id="duel">
        <div class="duel__sides">
          ${['fire', 'ice'].map((s) => `
          <button class="side side--${s}" data-side="${s}">
            <span class="side__tex"></span>
            <span class="side__fx">${'<i></i>'.repeat(7)}</span>
            <span class="side__shade"></span>
            <span class="side__art">${ART[s]}</span>
            <b class="side__name">${sideName(s)}</b>
            <span class="side__pool">${star()}<i id="${s}Pool">0</i></span>
            <span class="side__mult"><b id="${s}Mult">x—</b> ${t('pvp.ifWin')}</span>
            <span class="side__avas" id="${s}Avas"></span>
            <span class="side__pick">${icon.check}</span>
          </button>`).join('')}
          <span class="duel__vs" id="dVs">VS</span>
        </div>
        <div class="tug">
          <div class="tug__bar"><i class="tug__fire" id="tugFire"></i><span class="tug__clash" id="tugClash"></span><span class="tug__mark" id="tugMark" hidden></span></div>
          <div class="tug__pct"><b id="firePct">50%</b><span id="dStatus"></span><b id="icePct">50%</b></div>
        </div>
      </section>
      <div class="pvpres" id="pvpRes" hidden></div>
      ${betPanel()}${tail()}`,
  };

  function render(root) {
    let alive = true, pollT, tickIv, st = null, offset = 0, roundId = null, sig = '', shown = null, revealed = false, revealT, busy = false;
    let raf = 0, tickAt = 0, whoIdx = -1, cMode = 'pot', lastSec = -1, lastPot = 0;
    const $r = (q) => root.querySelector(q);
    const now = () => Date.now() + offset;
    // сколько длится розыгрыш: чуть больше половины паузы между раундами (остальное — показ результата)
    const showMs = () => Math.max(3800, Math.min(7000, ((st.result.nextAt - st.result.at) || 9000) * 0.56));

    root.innerHTML = `
      <div class="page-title page-title--row"><div><h1>${t('pvp.title')}</h1><p>${t('pvp.sub')}</p></div>
        <button class="histbtn" id="pvpHist">${icon.clock}<span>${t('ph.btn')}</span></button></div>
      <div class="seg seg--2 seg--pvp" id="pvpTabs">
        <button data-tab="roulette">${icon.trophy}${t('pvp.roulette')}</button>
        <button data-tab="fireice">${icon.fire}${t('pvp.fireice')}</button>
      </div>
      <div class="pvp-body" id="pvpBody"></div>`;

    function mount() {
      clearTimeout(revealT); cancelAnimationFrame(raf);
      st = null; roundId = null; sig = ''; shown = null; revealed = false; busy = false; S.side = null;
      cMode = 'pot'; lastSec = -1; lastPot = 0; whoIdx = -1;
      root.querySelectorAll('#pvpTabs [data-tab]').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === S.tab));
      $r('#pvpBody').className = `pvp-body pvp-body--${S.tab}`;
      $r('#pvpBody').innerHTML = BODY[S.tab]();
      const inp = $r('#pIn'); fitAmount(inp);
      inp.addEventListener('input', () => { S.amount = Math.max(0, parseInt(inp.value.replace(/\D/g, ''), 10) || 0); inp.value = S.amount || ''; drawBet(); });
      root.querySelectorAll('#betPanel [data-q]').forEach((b) => b.addEventListener('click', () => {
        sound('tick'); haptic('select');
        S.amount = applyQuick(b.dataset.q, S.amount, Math.floor(api.state.balance.stars));
        inp.value = S.amount || ''; fitAmount(inp); drawBet();
      }));
      $r('#qEdit').addEventListener('click', () => { sound(); editQuick(() => mount()); });
      $r('#pGo').addEventListener('click', bet);
      $r('#pCancel').addEventListener('click', cancel);
      $r('#pGift')?.addEventListener('click', betGift);
      $r('#fair').addEventListener('click', openFair);
      root.querySelectorAll('[data-side]').forEach((b) => b.addEventListener('click', () => {
        if (st?.my?.side && st.my.side !== b.dataset.side) return toast(t('pvp.sideLocked'), 'error');
        sound('tick'); haptic('select'); S.side = b.dataset.side; drawSides(); drawBet();
      }));
    }

    // ---------- ставка ----------
    function drawBet() {
      const go = $r('#pGo'); if (!go) return;
      const open = st ? st.open : api.gameOpen(S.tab);
      const side = st?.my?.side || S.side;
      const locked = !open || st?.phase === 'result' || (st?.endsAt && now() >= st.endsAt);
      go.className = `btn btn--xl btn--block ${S.tab === 'fireice' ? (side === 'ice' ? 'btn--ice' : side === 'fire' ? 'btn--fire' : 'btn--primary') : 'btn--primary'}`;
      go.innerHTML = !open ? `${icon.lock}${t('game.closed')}`
        : S.tab === 'fireice' ? (side ? `${side === 'fire' ? icon.fire : icon.snow}${t('pvp.betOn', { s: sideName(side) })}` : t('pvp.pickSide'))
        : `${icon.play}${t(st?.my ? 'pvp.betMore' : 'pvp.bet')}`;
      go.disabled = locked || busy;
      $r('#pCancel').hidden = !st?.canCancel;
      if ($r('#pGift')) $r('#pGift').disabled = locked || busy;
      // подсказка под суммой: какой шанс / множитель даст эта ставка
      const hint = $r('#pMy');
      const others = st ? st.pot - (st.my?.amount || 0) : 0;
      if (S.tab === 'roulette' && st && S.amount > 0 && others > 0 && !locked) {
        const mine = (st.my?.amount || 0) + S.amount;
        hint.innerHTML = `${t('pvp.chanceIf')} <b>${pct(mine / (st.pot + S.amount))}</b>`;
      } else if (S.tab === 'fireice' && st && S.amount > 0 && side && !locked) {
        const o = side === 'fire' ? 'ice' : 'fire', W = st.sides[side].pool + S.amount, L = st.sides[o].pool;
        hint.innerHTML = L > 0 ? `${t('pvp.winIf')} <b>${star()}${fmt(S.amount + Math.floor(L * (1 - st.fee) * S.amount / W))}</b>` : `≈ $${(S.amount / api.state.rates.usdToStars).toFixed(2)}`;
      } else {
        hint.innerHTML = st?.my ? `${t('pvp.yourBet')}: ${star()}${fmt(st.my.amount)}` : `≈ $${(S.amount / api.state.rates.usdToStars).toFixed(2)}`;
      }
    }
    async function bet() {
      if (busy || !st) return;
      const side = st.my?.side || S.side;
      if (S.tab === 'fireice' && !side) { haptic('warning'); return toast(t('pvp.pickSide'), 'error'); }
      if (!S.amount) { $r('#pIn').focus(); return toast(t('toast.pickStake'), 'error'); }
      if (S.amount < (st.minBet || 1)) { haptic('warning'); return toast(t('pvp.minBet', { n: st.minBet }), 'error'); }
      if (S.amount > api.state.balance.stars) { sound('lose'); openPay('dep'); return toast(t('toast.noStars'), 'error'); }
      busy = true; drawBet(); sound(); haptic('medium');
      try { const r = await api.pvpBet(S.tab, S.amount, side); balanceChanged(); busy = false; apply(r); }
      catch (e) { busy = false; errToast(e); drawBet(); }
    }
    function betGift() {
      if (busy || !st) return;
      sound();
      const items = api.state.inventory.filter((g) => g.price > 0);
      if (!items.length) { toast(t('nft.none')); return openAddGift(); }
      openNftPicker({ title: t('nft.pick'), items, key: 'uid', onPick: async (g) => {
        busy = true; drawBet(); haptic('medium');
        try { const r = await api.pvpBet(S.tab, 0, null, g.uid); balanceChanged(); busy = false; apply(r); }
        catch (e) { busy = false; errToast(e); drawBet(); }
      } });
    }
    async function cancel() {
      if (busy) return;
      busy = true; sound(); haptic();
      try { const r = await api.pvpCancel(S.tab); balanceChanged(); busy = false; apply(r); }
      catch (e) { busy = false; errToast(e); drawBet(); }
    }

    // ---------- общий список игроков, история ----------
    function drawPlayers() {
      const win = revealed && st.result;
      $r('#pCount').textContent = st.players.length;
      if (st.fee > 0) { if ($r('#pFee')) $r('#pFee').textContent = pct(st.fee); } else if (root.querySelector('.pvp-fee')) root.querySelector('.pvp-fee').textContent = t('pvp.noFee');
      $r('#pList').innerHTML = st.players.length ? st.players.map((p, i) => {
        const isWin = win && (S.tab === 'roulette' ? st.result.winner?.id === p.id : st.result.winner === p.side);
        const col = S.tab === 'roulette' ? COLORS[i % COLORS.length] : p.side === 'fire' ? 'var(--fire)' : 'var(--ice)';
        return `<div class="prow ${p.id === api.state.user.id ? 'is-me' : ''} ${isWin ? 'is-win' : win ? 'is-lose' : ''}">
          <i class="prow__bar" style="width:${Math.max(2, p.chance * 100)}%;background:${col}"></i>
          ${S.tab === 'roulette' ? `<i class="prow__dot" style="background:${col}"></i>` : sideIco(p.side)}
          ${avatarHtml(p, 'prow__ava')}
          <span class="prow__nick">${uname(p)}</span>
          ${(p.gifts || []).length ? `<span class="prow__gifts">${p.gifts.slice(0, 3).map((x) => giftImg(x)).join('')}${p.gifts.length > 3 ? `<em>+${p.gifts.length - 3}</em>` : ''}</span>` : ''}
          ${isWin && p.payout ? `<span class="prow__win">+${fmt(p.payout)}</span>` : S.tab === 'roulette' ? `<span class="prow__pct">${pct(p.chance)}</span>` : ''}
          <span class="prow__v">${star()}${fmt(p.amount)}</span>
        </div>`;
      }).join('') : emptyBox(t('pvp.empty'), icon.swords);
    }
    function drawHistory() {
      const h = st.history || [];
      $r('#histBox').hidden = !h.length;
      $r('#pHist').innerHTML = h.map((x) => {
        const lucky = x.chance > 0 && x.chance < 0.3;
        return S.tab === 'roulette'
          ? `<div class="hchip ${lucky ? 'hchip--lucky' : ''}">${x.winner ? avatarHtml(x.winner, 'hchip__ava') : ''}<b>${star()}${fmt(x.pot)}</b><small>${x.chance > 0 ? mult(1 / x.chance) : ''} · ${pct(x.chance)}</small></div>`
          : `<div class="hchip hchip--${x.winner} ${lucky ? 'hchip--lucky' : ''}">${sideIco(x.winner)}<b>${star()}${fmt(x.pot)}</b><small>${pct(x.chance)}</small></div>`;
      }).join('');
    }

    // ---------- центр колеса: банк / отсчёт / кто под стрелкой ----------
    function setCenter(mode) {
      if (cMode === mode || !$r('#wcPot')) return;
      cMode = mode;
      $r('#wcPot').hidden = mode !== 'pot'; $r('#wcWho').hidden = mode !== 'who'; $r('#wcCount').hidden = mode !== 'count';
    }
    function buildWho() {
      $r('#wcWho').innerHTML = st.players.map((p, i) => `<div class="wc__p" data-i="${i}" style="--c:${COLORS[i % COLORS.length]}">${avatarHtml(p, 'wc__ava')}<b>${uname(p)}</b><small>${pct(p.chance)}</small></div>`).join('');
    }
    function markWho(i) {
      $r('#wcWho').querySelectorAll('.wc__p').forEach((el) => el.classList.toggle('is-on', +el.dataset.i === i));
      $r('#wSvg').querySelectorAll('.wheel__seg').forEach((el, k) => el.classList.toggle('is-on', k === i));
      $r('#wAvas').querySelectorAll('span').forEach((el) => el.classList.toggle('is-on', +el.dataset.i === i));
    }
    function flap() {
      const p = $r('#wPtr'); if (!p) return;
      p.classList.remove('is-flap'); void p.offsetWidth; p.classList.add('is-flap');
    }
    function floatPlus(n) {
      const w = $r('#wheel'); if (!w || reduce()) return;
      const el = document.createElement('span'); el.className = 'wheel__plus'; el.innerHTML = `+${fmt(n)}${star()}`;
      w.appendChild(el); setTimeout(() => el.remove(), 1100);
    }

    // ---------- рулетка ----------
    function drawWheel() {
      const ps = st.players, pot = st.pot;
      let acc = 0, segs = '', pegs = '', avas = '';
      ps.forEach((p, i) => {
        const len = (p.amount / pot) * C, gap = ps.length > 1 ? Math.min(2.4, len / 3) : 0;
        segs += `<circle class="wheel__seg" cx="100" cy="100" r="${R}" stroke="${COLORS[i % COLORS.length]}" stroke-dasharray="${Math.max(0.5, len - gap)} ${C}" stroke-dashoffset="${-acc}"/>`;
        if (ps.length > 1) { const a = (acc / C) * 2 * Math.PI; pegs += `<circle class="wheel__peg" cx="${(100 + 90 * Math.cos(a)).toFixed(2)}" cy="${(100 + 90 * Math.sin(a)).toFixed(2)}" r="2.6"/>`; }
        if (p.amount / pot >= 0.07) {
          const a = ((acc + len / 2) / C) * 2 * Math.PI;
          avas += `<span data-i="${i}" style="left:${50 + (R / 2) * Math.sin(a)}%;top:${50 - (R / 2) * Math.cos(a)}%">${avatarHtml(p)}</span>`;
        }
        acc += len;
      });
      $r('#wSvg').innerHTML = `<circle class="wheel__track" cx="100" cy="100" r="${R}"/><g transform="rotate(-90 100 100)">${segs}${pegs}</g>`;
      $r('#wAvas').innerHTML = avas;
    }
    // какой игрок сейчас под стрелкой при повороте колеса на deg
    function idxAt(deg) {
      const f = (((-deg % 360) + 360) % 360) / 360, ps = st.players;
      let acc = 0;
      for (let i = 0; i < ps.length; i++) { acc += ps[i].amount / st.pot; if (f < acc) return i; }
      return ps.length - 1;
    }
    /* Крутим колесо покадрово: тики и «кто под стрелкой» идут ровно по тому, что на экране.
       Все игроки заканчивают одновременно — опоздавший догоняет за оставшееся время. → сколько мс осталось (0 — показать сразу) */
    function spin() {
      const rot = $r('#wRot'), res = st.result; if (!rot) return 0;
      const to = 360 * TURNS - res.roll * 360, T = showMs(), elapsed = Math.max(0, now() - res.at);
      cancelAnimationFrame(raf);
      buildWho(); setCenter('who');
      if (elapsed > T - 900 || reduce()) { rot.style.transform = `rotate(${to}deg)`; rot.style.setProperty('--r', `${-to}deg`); markWho(idxAt(to)); return 0; }
      const dur = T - elapsed, t0 = performance.now();
      $r('#wheel').classList.add('is-spin'); $r('#arena').classList.add('is-spin');
      let lastPeg = -1; whoIdx = -1;
      const frame = (tn) => {
        if (!alive) return;
        const x = Math.min(1, (tn - t0) / dur), deg = to * (1 - Math.pow(1 - x, 3));
        rot.style.transform = `rotate(${deg}deg)`; rot.style.setProperty('--r', `${-deg}deg`);
        const peg = Math.floor(deg / 15);
        if (peg !== lastPeg) { lastPeg = peg; if (tn - tickAt > 55) { tickAt = tn; sound('tick'); flap(); if (x > 0.7) haptic('select'); } }
        const i = idxAt(deg);
        if (i !== whoIdx) { whoIdx = i; markWho(i); }
        if (x < 1) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      return dur;
    }

    // ---------- огонь и лёд ----------
    function drawSides() {
      if (S.tab !== 'fireice' || !st) return;
      const my = st.my?.side || S.side;
      for (const s of ['fire', 'ice']) {
        const o = s === 'fire' ? 'ice' : 'fire', W = st.sides[s].pool, L = st.sides[o].pool;
        $r(`#${s}Pool`).textContent = fmt(W);
        $r(`#${s}Mult`).textContent = W ? `x${((W + L * (1 - st.fee)) / W).toFixed(2)}` : 'x—';
        $r(`#${s}Pct`).textContent = pct(st.sides[s].chance);
        $r(`#${s}Avas`).innerHTML = st.players.filter((p) => p.side === s).slice(0, 5).map((p) => avatarHtml(p)).join('') + (st.sides[s].count > 5 ? `<em>+${st.sides[s].count - 5}</em>` : '');
        const el = root.querySelector(`.side--${s}`);
        el.classList.toggle('is-sel', my === s);
        el.classList.toggle('is-off', !!st.my && st.my.side !== s);
        el.classList.toggle('is-win', revealed && st.result?.winner === s);
        el.classList.toggle('is-lose', revealed && !!st.result && st.result.winner !== s);
      }
      $r('#tugFire').style.width = `${st.sides.fire.chance * 100}%`;
      $r('#tugClash').style.left = `${st.sides.fire.chance * 100}%`;
    }
    /* Розыгрыш: метка качается между сторонами, как маятник, и с каждым взмахом затихает у итоговой точки.
       Сторона, над которой сейчас метка, вспыхивает. → сколько мс осталось (0 — показать сразу) */
    function duel() {
      const mark = $r('#tugMark'), res = st.result; if (!mark) return 0;
      const end = res.roll, cut = st.sides.fire.chance, T = showMs(), elapsed = Math.max(0, now() - res.at);
      const put = (p) => { mark.style.left = `${p * 100}%`; };
      const hotSide = (s) => root.querySelectorAll('.side').forEach((el) => el.classList.toggle('is-hot', el.dataset.side === s));
      mark.hidden = false; cancelAnimationFrame(raf);
      if (elapsed > T - 900 || reduce()) { put(end); return 0; }
      const dur = T - elapsed, t0 = performance.now(), amp = Math.max(end, 1 - end) + 0.12;
      $r('#duel').classList.add('is-duel');
      let hot = '';
      const frame = (tn) => {
        if (!alive) return;
        const x = Math.min(1, (tn - t0) / dur);
        const p = x >= 1 ? end : Math.max(0.015, Math.min(0.985, end + Math.pow(1 - x, 1.7) * amp * Math.cos(2 * Math.PI * 4.25 * Math.pow(x, 0.85))));
        put(p);
        const s = p < cut ? 'fire' : 'ice';
        if (s !== hot) { hot = s; hotSide(s); if (tn - tickAt > 70) { tickAt = tn; sound('tick'); haptic('select'); } }
        if (x < 1) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      return dur;
    }

    // ---------- результат ----------
    function reveal() {
      if (!alive || !st?.result) return;
      revealed = true;
      const res = st.result, me = st.my, won = res.myPayout > 0;
      const chance = S.tab === 'roulette' ? (st.players.find((p) => p.id === res.winner?.id)?.chance || 0) : (st.sides?.[res.winner]?.chance || 0);
      const lucky = chance > 0 && chance < 0.3;
      if (S.tab === 'roulette') {
        $r('#wheel').classList.remove('is-spin'); $r('#wheel').classList.add('is-done');
        $r('#arena').classList.remove('is-spin', 'is-hot'); $r('#arena').classList.add('is-done');
        const wi = st.players.findIndex((p) => p.id === res.winner?.id);
        if (wi >= 0) {
          markWho(wi);
          const el = $r(`#wcWho .wc__p[data-i="${wi}"]`);
          if (el) { el.classList.add('is-winner'); el.querySelector('small').innerHTML = `+<i id="wWinV">0</i>${star()}`; countUp($r('#wWinV'), res.pot, 900); }
        }
      } else {
        $r('#duel').classList.remove('is-duel', 'is-hot'); $r('#duel').classList.add('is-done');
        root.querySelectorAll('.side').forEach((el) => el.classList.remove('is-hot'));
      }
      const sub = `${t('pvp.pot')} ${star()}${fmt(res.pot)}${chance > 0 ? ` · ${t('pvp.chance')} ${pct(chance)}${S.tab === 'roulette' ? ` · ${mult(1 / chance)}` : ''}` : ''}`;
      const who = S.tab === 'roulette'
        ? `${res.winner ? avatarHtml(res.winner, 'pvpres__ava') : ''}<div><b>${t(won ? 'pvp.youWon' : 'pvp.won', { u: uname(res.winner) })}</b><small>${sub}</small></div>`
        : `${sideIco(res.winner)}<div><b>${t('pvp.sideWon', { s: sideName(res.winner) })}</b><small>${sub}</small></div>`;
      const box = $r('#pvpRes');
      box.className = `pvpres ${won ? 'is-won' : me ? 'is-lost' : ''} ${lucky ? 'is-lucky' : ''} ${S.tab === 'fireice' ? `pvpres--${res.winner}` : ''}`;
      box.innerHTML = `${lucky ? `<i class="pvpres__tag">${t('pvp.lucky')}</i>` : ''}${who}${won ? `<span class="pvpres__v">+${fmt(res.myPayout)}${star()}</span>` : me ? `<span class="pvpres__v pvpres__v--lost">−${fmt(me.amount)}${star()}</span>` : ''}`;
      box.hidden = false;
      if (won) { sound('win'); haptic('success'); confetti({ y: 0.35 }); toast(t('toast.gotStars', { n: fmt(res.myPayout) }), 'win'); }
      else if (me) { sound('lose'); haptic('error'); toast(t('pvp.youLost'), 'lose'); }
      else sound('open');
      if (me) { if (api.live) api.refresh().catch(() => {}); else balanceChanged(); }
      drawPlayers(); drawSides(); drawTimer();
    }

    // ---------- таймер и подписи ----------
    function drawTimer() {
      if (!st) return;
      const left = st.endsAt ? Math.max(0, st.endsAt - now()) : 0;
      const counting = st.phase === 'countdown' && left > 0, sec = Math.ceil(left / 1000);
      let label, timer = '';
      if (st.phase === 'result') {
        label = revealed ? t('pvp.next', { n: Math.max(0, Math.ceil((st.result.nextAt - now()) / 1000)) }) : t('pvp.rolling');
      } else if (st.phase === 'countdown') {
        label = left > 0 ? '' : t('pvp.rolling');
        timer = left > 0 ? `0:${String(sec).padStart(2, '0')}` : '';
      } else {
        label = !st.open ? t('pvp.closed') : !st.players.length ? t('pvp.waiting') : t(S.tab === 'roulette' ? 'pvp.waitOne' : 'pvp.waitSide');
      }
      // последние секунды: отсчёт, пульс и «сердцебиение»
      const hot = counting && sec <= 5;
      if (hot && sec !== lastSec) { lastSec = sec; sound(sec <= 3 ? 'beat' : 'tick'); if (sec <= 3) haptic('medium'); }
      if (!counting) lastSec = -1;
      if (S.tab === 'roulette') {
        $r('#wTimer').textContent = timer || label;
        $r('#wTimer').classList.toggle('is-time', !!timer);
        $r('#wRing').style.strokeDashoffset = st.phase === 'countdown' ? 289 * (1 - left / (st.roundSeconds * 1000)) : 289;
        $r('#arena').classList.toggle('is-hot', hot);
        $r('#arena').classList.toggle('is-wait', st.phase === 'waiting');
        $r('#aNext').textContent = st.phase === 'result' && revealed ? label : '';
        if (cMode !== 'who') {
          if (counting && sec <= 3) {
            setCenter('count');
            const v = $r('#wCountV');
            if (v.textContent !== String(sec)) { v.textContent = sec; v.classList.remove('is-pop'); void v.offsetWidth; v.classList.add('is-pop'); }
          } else setCenter('pot');
        }
      } else {
        const vs = $r('#dVs');
        vs.textContent = timer ? sec : 'VS';
        vs.classList.toggle('is-time', !!timer);
        if (hot && vs.dataset.s !== String(sec)) { vs.dataset.s = sec; vs.classList.remove('is-pop'); void vs.offsetWidth; vs.classList.add('is-pop'); }
        $r('#duel').classList.toggle('is-hot', hot);
        $r('#dStatus').textContent = label;
      }
      if (st.phase === 'countdown' && left <= 0) drawBet();
    }

    // ---------- приход нового состояния ----------
    function apply(next) {
      if (!alive || !next || next.game !== S.tab) return;
      offset = next.now - Date.now();
      const newRound = next.id !== roundId;
      st = next;
      if (newRound) {
        roundId = st.id; revealed = false; shown = null; sig = ''; clearTimeout(revealT); cancelAnimationFrame(raf);
        lastSec = -1; lastPot = 0; whoIdx = -1;
        const box = $r('#pvpRes'); if (box) box.hidden = true;
        const rot = $r('#wRot'); if (rot) { rot.style.transform = 'rotate(0deg)'; rot.style.setProperty('--r', '0deg'); }
        $r('#wheel')?.classList.remove('is-spin', 'is-done'); $r('#arena')?.classList.remove('is-spin', 'is-done', 'is-hot');
        $r('#duel')?.classList.remove('is-duel', 'is-done', 'is-hot');
        root.querySelectorAll('.side').forEach((el) => el.classList.remove('is-hot'));
        cMode = ''; setCenter('pot');
        const mark = $r('#tugMark'); if (mark) mark.hidden = true;
        if (S.tab === 'fireice' && !st.my) S.side = S.side || null;
      }
      const s2 = st.players.map((p) => `${p.id}:${p.amount}:${p.side}`).join('|');
      if (s2 !== sig) {
        sig = s2;
        if (S.tab === 'roulette') {
          drawWheel();
          if (st.pot > lastPot && lastPot > 0 && st.phase !== 'result') floatPlus(st.pot - lastPot);
          countUp($r('#wPotV'), st.pot, 500);
          $r('#aPlayers').textContent = st.players.length;
        }
        lastPot = st.pot;
        drawPlayers();
      }
      if (S.tab === 'roulette') {
        $r('#aChance').textContent = st.my ? pct(st.my.chance) : '—';
        $r('#aWin').textContent = st.my && st.my.amount > 0 ? mult(st.pot / st.my.amount) : '—';
      }
      drawSides(); drawHistory(); drawBet();
      // результат: разыгрываем один раз за раунд
      if (st.phase === 'result' && shown !== st.id) {
        shown = st.id;
        const left = S.tab === 'roulette' ? spin() : duel();
        if (left) revealT = setTimeout(reveal, left + 280); else reveal();
      }
      drawTimer();
    }

    function openFair() {
      sound();
      sheet(`<p class="howto__sub">${t('pvp.fairT')}</p>
        <button class="copyrow" id="fairHash"><small>hash (sha256)</small><span>${esc(st?.hash || '—')}</span>${icon.copy}</button>
        ${st?.result ? `<button class="copyrow" id="fairSeed"><small>seed · roll ${Number(st.result.roll).toFixed(6)}</small><span>${esc(st.result.seed)}</span>${icon.copy}</button>` : ''}
        <p class="note">roll = sha256(seed:${st?.id ?? 'id'}) → 0…1</p>`, { title: t('pvp.fair') });
      document.querySelector('#fairHash')?.addEventListener('click', () => copyText(st?.hash || ''));
      document.querySelector('#fairSeed')?.addEventListener('click', () => copyText(st?.result?.seed || ''));
    }

    const poll = async () => {
      if (!alive) return;
      if (!document.hidden) { try { apply(await api.pvpState(S.tab)); } catch (e) { /* сеть моргнула */ } }
      if (alive) pollT = setTimeout(poll, 1000);
    };
    $r('#pvpHist').addEventListener('click', () => openHistory(S.tab));
    root.querySelectorAll('#pvpTabs [data-tab]').forEach((b) => b.addEventListener('click', () => {
      if (S.tab === b.dataset.tab) return;
      sound('tick'); haptic('select'); S.tab = b.dataset.tab; mount(); clearTimeout(pollT); poll();
    }));
    mount(); poll();
    tickIv = setInterval(drawTimer, 250);
    return () => { alive = false; clearTimeout(pollT); clearTimeout(revealT); clearInterval(tickIv); cancelAnimationFrame(raf); if (api.live) api.refresh().catch(() => {}); else balanceChanged(); };
  }
  return { render, setTab: (x) => { S.tab = x; } };
})();

// ======================= экран: Самолётик =======================
const crash = (() => {
  const S = { amount: 0, autoOn: false, auto: 2, queued: null };
  const VW = 360, VH = 210, PL = 10, PB = 14, PT = 26, PR = 34;
  const PLANE = `<svg viewBox="0 0 64 44" aria-hidden="true">
    <defs>
      <linearGradient id="cpA" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffffff"/><stop offset="1" stop-color="#cfd9ff"/></linearGradient>
      <linearGradient id="cpB" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8fb0ff"/><stop offset="1" stop-color="#3d6bff"/></linearGradient>
      <linearGradient id="cpC" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#ff3d7f"/><stop offset="1" stop-color="#ff8a3d"/></linearGradient>
    </defs>
    <path d="M2 24L62 4L24 30Z" fill="url(#cpA)"/>
    <path d="M24 30L62 4L30 40Z" fill="url(#cpB)"/>
    <path d="M24 30L30 40L27 31.5Z" fill="#1f3dff"/>
    <path d="M2 24L24 30L20 26Z" fill="#b8c6ff"/>
    <path d="M14 26.4L46 9.5" stroke="url(#cpC)" stroke-width="2.4" stroke-linecap="round"/>
  </svg>`;
  const xcls = (x) => (x >= 10 ? 'is-gold' : x >= 2 ? 'is-violet' : 'is-blue');
  const fx = (x) => `x${Number(x).toFixed(2)}`;
  const uname = (u) => esc(u?.username ? '@' + u.username : u?.name || '—');

  function openHelp() {
    sheet(`<ol class="steps">${['h1', 'h2', 'h3', 'h4'].map((k, i) => `<li><span>${i + 1}</span>${t('crash.' + k, { e: Math.round((api.cfg('crashEdge', 0.04)) * 100) })}</li>`).join('')}</ol>`, { title: t('crash.helpTitle') });
  }

  function render(root) {
    let alive = true, st = null, offset = 0, pollT, raf = 0, roundId = null, crashedShown = null, lastWhole = 1, busy = false;
    const $r = (q) => root.querySelector(q);
    const now = () => Date.now() + offset;
    const multAt = (ms) => Math.floor(Math.exp(st.rate * Math.max(0, ms)) * 100) / 100;

    root.innerHTML = `
      ${pageHead(t('crash.title'), 'cHelp')}
      <div class="chist hscroll" id="cHist"></div>
      <section class="sky" id="sky">
        <span class="sky__stars"></span>
        <svg class="sky__svg" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ckFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff3d7f" stop-opacity=".42"/><stop offset="1" stop-color="#ff3d7f" stop-opacity="0"/></linearGradient>
            <linearGradient id="ckLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8fb0ff"/><stop offset=".6" stop-color="#ff3d7f"/><stop offset="1" stop-color="#ffc94a"/></linearGradient>
          </defs>
          <g class="sky__grid" id="cGrid"></g>
          <path id="cArea" fill="url(#ckFill)"/>
          <path id="cLine" fill="none" stroke="url(#ckLine)" stroke-width="3.2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
        </svg>
        <span class="sky__plane" id="cPlane">${PLANE}<i class="sky__trail"></i></span>
        <div class="sky__mid">
          <b class="sky__x" id="cX">x1.00</b>
          <small class="sky__sub" id="cSub"></small>
          <div class="sky__wait" id="cWait"><span class="sky__bar"><i id="cBar"></i></span></div>
        </div>
        <span class="sky__count" id="cCount"></span>
      </section>
      <section class="panel" id="cBet">
        <label class="amount">
          <span class="amount__l">${t('up.enterBet')}</span>
          <span class="amount__in">${star()}<input id="cIn" inputmode="numeric" placeholder="0" value="${S.amount || ''}" autocomplete="off" /></span>
          <span class="amount__usd" id="cHint"></span>
        </label>
        <div class="chips chips--4"><button class="chip" data-d="10">+10</button><button class="chip" data-d="50">+50</button><button class="chip" data-d="x2">x2</button><button class="chip" data-d="max">MAX</button></div>
        <div class="cauto">
          <button class="switch ${S.autoOn ? 'is-on' : ''}" id="cAutoSw" aria-label="auto"></button>
          <span class="grow"><b>${t('crash.auto')}</b><small>${t('crash.autoT')}</small></span>
          <label class="cauto__in ${S.autoOn ? '' : 'is-off'}" id="cAutoBox">x<input id="cAuto" inputmode="decimal" value="${S.auto.toFixed(2)}" autocomplete="off" /></label>
        </div>
        <button class="btn btn--xl btn--block btn--primary" id="cGo"></button>
        <p class="note" id="cNote"></p>
      </section>
      <section class="panel"><div class="panel__h"><h3>${t('crash.bets')} <small id="cPCount">0</small></h3><span class="pvp-fee" id="cTotal"></span></div><div class="plist" id="cList"></div></section>
      <button class="rowlink" id="cFair"><span class="rowlink__ico rowlink__ico--green">${icon.check}</span><span class="grow">${t('pvp.fair')}</span>${icon.chevron}</button>`;
    wireBack(root);
    $r('#cHelp').addEventListener('click', () => { sound(); openHelp(); });
    for (let i = 1; i <= 4; i++) {
      $r('#cGrid').insertAdjacentHTML('beforeend', `<line x1="0" x2="${VW}" y1="${(VH / 5) * i}" y2="${(VH / 5) * i}"/><line y1="0" y2="${VH}" x1="${(VW / 5) * i}" x2="${(VW / 5) * i}"/>`);
    }

    // ---------- ставка ----------
    const inp = $r('#cIn'); fitAmount(inp);
    inp.addEventListener('input', () => { S.amount = Math.max(0, parseInt(inp.value.replace(/\D/g, ''), 10) || 0); inp.value = S.amount || ''; drawBet(); });
    root.querySelectorAll('#cBet [data-d]').forEach((b) => b.addEventListener('click', () => {
      sound('tick'); haptic('select');
      const d = b.dataset.d, bal = Math.floor(api.state.balance.stars), max = st?.maxBet || 1000;
      S.amount = Math.min(max, d === 'max' ? bal : d === 'x2' ? S.amount * 2 : S.amount + +d);
      inp.value = S.amount || ''; fitAmount(inp); drawBet();
    }));
    $r('#cAutoSw').addEventListener('click', (e) => { sound('tick'); haptic('select'); S.autoOn = !S.autoOn; e.currentTarget.classList.toggle('is-on', S.autoOn); $r('#cAutoBox').classList.toggle('is-off', !S.autoOn); drawBet(); });
    $r('#cAuto').addEventListener('change', (e) => {
      const v = Math.max(1.01, Math.min(st?.maxMult || 100, parseFloat(String(e.target.value).replace(',', '.')) || 2));
      S.auto = Math.round(v * 100) / 100; e.target.value = S.auto.toFixed(2); drawBet();
    });
    $r('#cGo').addEventListener('click', press);
    $r('#cFair').addEventListener('click', openFair);

    function drawBet() {
      const go = $r('#cGo'); if (!go || !st) return;
      const my = st.my, ph = st.phase, open = st.open;
      let cls = 'btn--primary', html = '', dis = false, note = '';
      if (!open) { html = `${icon.lock}${t('game.closed')}`; dis = true; }
      else if (my && my.cashout) { cls = 'btn--done'; html = `${icon.check}${t('crash.took', { x: fx(my.cashout), n: fmt(my.payout) })}`; dis = true; }
      else if (my && ph === 'fly') { cls = 'btn--cash'; html = `${t('crash.cash')} <b id="cCash">${fmt(Math.min(my.amount * curMult(), st.maxWin))}</b>${star()}`; }
      else if (my && ph === 'bet') { cls = 'btn--ghost'; html = t('crash.cancel'); note = t('crash.inRound', { n: fmt(my.amount) }) + (my.auto ? ` · ${t('crash.autoAt', { x: fx(my.auto) })}` : ''); }
      else if (S.queued) { cls = 'btn--ghost'; html = t('crash.unqueue'); note = t('crash.queued', { n: fmt(S.queued.amount) }); }
      else if (ph === 'bet') { html = `${icon.play}${t('crash.bet')}`; dis = busy; }
      else { cls = 'btn--glass'; html = `${icon.play}${t('crash.next')}`; }
      go.className = `btn btn--xl btn--block ${cls}`; go.innerHTML = html; go.disabled = dis || busy && cls !== 'btn--cash';
      $r('#cNote').textContent = note || t('crash.note', { n: fmt(st.maxWin) });
      $r('#cHint').innerHTML = S.amount > 0 && S.autoOn ? `${t('crash.ifAuto')} <b>${star()}${fmt(Math.min(Math.floor(S.amount * S.auto), st.maxWin))}</b>` : `≈ $${(S.amount / api.state.rates.usdToStars).toFixed(2)}`;
    }
    const curMult = () => (st?.phase === 'fly' ? multAt(now() - st.startAt) : st?.crash || 1);

    async function placeBet(amount, auto) {
      busy = true; drawBet();
      try { const r = await api.crashBet(amount, auto); balanceChanged(); busy = false; sound(); haptic('medium'); apply(r); }
      catch (e) { busy = false; errToast(e); drawBet(); }
    }
    async function press() {
      if (!st || busy) return;
      const my = st.my;
      if (my && st.phase === 'fly' && !my.cashout) {     // «Забрать»
        busy = true; haptic('heavy');
        try {
          const r = await api.crashCashout(); balanceChanged(); busy = false; apply(r);
          sound('win'); haptic('success'); confetti({ y: 0.32, count: 70 });
          toast(t('crash.won', { n: fmt(r.my?.payout || 0), x: fx(r.my?.cashout || 1) }), 'win');
        } catch (e) { busy = false; if (e?.code === 'crashed') toast(t('crash.late'), 'lose'); else errToast(e); poll(true); }
        return;
      }
      if (my && st.phase === 'bet') {                     // отмена ставки до взлёта
        busy = true; sound();
        try { const r = await api.crashCancel(); balanceChanged(); busy = false; apply(r); } catch (e) { busy = false; errToast(e); drawBet(); }
        return;
      }
      if (S.queued) { S.queued = null; sound('tick'); return drawBet(); }
      if (!S.amount) { inp.focus(); return toast(t('toast.pickStake'), 'error'); }
      if (S.amount > api.state.balance.stars) { sound('lose'); openPay('dep'); return toast(t('toast.noStars'), 'error'); }
      const auto = S.autoOn ? S.auto : null;
      if (st.phase === 'bet') return placeBet(S.amount, auto);
      S.queued = { amount: S.amount, auto }; sound('tick'); haptic('select'); drawBet();   // поставим, как только начнётся приём ставок
    }

    // ---------- список ставок, история ----------
    function drawList() {
      const crashed = st.phase === 'crashed';
      $r('#cPCount').textContent = st.count;
      $r('#cTotal').innerHTML = st.total ? `${t('pvp.pot')} ${star()}${fmt(st.total)}` : '';
      $r('#cList').innerHTML = st.players.length ? st.players.map((p) => `
        <div class="prow ${p.id === api.state.user.id ? 'is-me' : ''} ${p.cashout ? 'is-win' : crashed ? 'is-lose' : ''}">
          ${avatarHtml(p, 'prow__ava')}<span class="prow__nick">${uname(p)}</span>
          ${p.cashout ? `<span class="prow__x">${fx(p.cashout)}</span><span class="prow__win">+${fmt(p.payout)}</span>` : ''}
          <span class="prow__v">${star()}${fmt(p.amount)}</span>
        </div>`).join('') : emptyBox(t('crash.empty'), icon.play);
    }
    function drawHist() {
      $r('#cHist').innerHTML = (st.history || []).map((h) => `<span class="chist__x ${xcls(h.x)}">${fx(h.x)}</span>`).join('');
    }

    // ---------- небо: кривая и самолётик ----------
    function plot(ms, m) {
      const W = Math.max(9000, ms * 1.18), H = Math.max(1, (m - 1) * 1.3);
      const pt = (tm) => {
        const mm = Math.exp(st.rate * tm);
        return [PL + (tm / W) * (VW - PL - PR), VH - PB - ((mm - 1) / H) * (VH - PB - PT)];
      };
      let d = ''; const n = 36;
      for (let i = 0; i <= n; i++) { const [x, y] = pt((ms * i) / n); d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }
      const [ex, ey] = pt(ms), [bx, by] = pt(Math.max(0, ms - 400));
      $r('#cLine').setAttribute('d', d);
      $r('#cArea').setAttribute('d', `${d}L${ex.toFixed(1)} ${VH - PB}L${PL} ${VH - PB}Z`);
      const ang = Math.atan2((by - ey) * ($r('#sky').clientHeight / VH), (ex - bx) * ($r('#sky').clientWidth / VW)) * 180 / Math.PI;
      const pl = $r('#cPlane');
      pl.style.left = `${(ex / VW) * 100}%`; pl.style.top = `${(ey / VH) * 100}%`;
      pl.style.setProperty('--a', `${-Math.max(4, Math.min(48, ang || 10))}deg`);
    }
    function frame() {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (!st) return;
      const sky = $r('#sky'), t0 = now();
      sky.dataset.phase = st.phase;
      if (st.phase === 'bet') {
        const left = Math.max(0, st.startAt - t0);
        $r('#cX').textContent = t('crash.soon');
        $r('#cSub').textContent = t('crash.betsOpen', { n: (left / 1000).toFixed(1) });
        $r('#cBar').style.width = `${(left / (st.betSeconds * 1000)) * 100}%`;
        if (left <= 0) poll(true);
        return;
      }
      if (st.phase === 'fly') {
        const ms = t0 - st.startAt, m = multAt(ms);
        $r('#cX').textContent = fx(m);
        $r('#cX').className = `sky__x ${xcls(m)}`;
        $r('#cSub').textContent = '';
        plot(ms, m);
        const cash = $r('#cCash'); if (cash) cash.textContent = fmt(Math.min(st.my.amount * m, st.maxWin));
        if (Math.floor(m) > lastWhole) { lastWhole = Math.floor(m); sound('tick'); }
        return;
      }
      // улетел
      $r('#cX').textContent = fx(st.crash); $r('#cX').className = 'sky__x is-red';
      $r('#cSub').textContent = t('crash.gone');
      const nx = Math.max(0, (st.nextAt || 0) - t0);
      $r('#cCount').textContent = nx > 0 ? t('pvp.next', { n: Math.ceil(nx / 1000) }) : '';
    }

    // ---------- новое состояние с сервера ----------
    function apply(next) {
      if (!alive || !next) return;
      offset = next.now - Date.now();
      const fresh = next.id !== roundId;
      st = next;
      if (fresh) {
        roundId = st.id; lastWhole = 1; crashedShown = null;
        $r('#sky').classList.remove('is-gone'); $r('#cCount').textContent = '';
        if (st.phase !== 'crashed') { $r('#cLine').setAttribute('d', ''); $r('#cArea').setAttribute('d', ''); }
        const pl = $r('#cPlane'); pl.style.left = `${(PL / VW) * 100}%`; pl.style.top = `${((VH - PB) / VH) * 100}%`; pl.style.setProperty('--a', '-8deg');
      }
      if (st.phase === 'crashed' && crashedShown !== st.id) {
        crashedShown = st.id;
        const ms = (st.crashAt || now()) - st.startAt; if (ms > 0) plot(ms, st.crash);
        $r('#sky').classList.add('is-gone');
        if (st.my && !st.my.cashout) { sound('lose'); haptic('error'); toast(t('crash.lost', { x: fx(st.crash) }), 'lose'); }
        else if (!st.my) sound('open');
      }
      if (st.phase === 'bet' && S.queued && !st.my && !busy) { const q = S.queued; S.queued = null; placeBet(q.amount, q.auto); }
      drawList(); drawHist(); drawBet();
    }
    async function poll(once) {
      if (!alive) return;
      clearTimeout(pollT);
      if (!document.hidden) { try { apply(await api.crashState()); } catch (e) { /* сеть моргнула */ } }
      if (alive) pollT = setTimeout(poll, st?.phase === 'fly' ? 350 : 900);
    }
    function openFair() {
      sound();
      sheet(`<p class="howto__sub">${t('crash.fairT')}</p>
        <button class="copyrow" id="fH"><small>hash (sha256)</small><span>${esc(st?.hash || '—')}</span>${icon.copy}</button>
        ${st?.seed ? `<button class="copyrow" id="fS"><small>seed · ${fx(st.crash)}</small><span>${esc(st.seed)}</span>${icon.copy}</button>` : ''}
        <p class="note">x = max(1, (1 − ${st?.edge ?? 0.04}) / (1 − u)), u = sha256(seed:${st?.id ?? 'id'}) → 0…1</p>`, { title: t('pvp.fair') });
      document.querySelector('#fH')?.addEventListener('click', () => copyText(st?.hash || ''));
      document.querySelector('#fS')?.addEventListener('click', () => copyText(st?.seed || ''));
    }

    poll(); raf = requestAnimationFrame(frame);
    return () => { alive = false; clearTimeout(pollT); cancelAnimationFrame(raf); if (api.live) api.refresh().catch(() => {}); else balanceChanged(); };
  }
  return { render };
})();

// ======================= экран: Кейсы =======================
const cases = (() => {
  const S = { open: null, fast: false, busy: false };
  const CW = 92;                        // ширина карточки в ленте вместе с отступом
  const COLORS = {
    blue: ['#8fb0ff', '#3d6bff', '#1a2fd9'], violet: ['#d8b4fe', '#a855f7', '#5b21b6'],
    pink: ['#ff9ec0', '#ff3d7f', '#b3124d'], gold: ['#fff1b0', '#ffc94a', '#d97706'],
  };
  const tier = (v, price) => { const k = v / price; return k >= 8 ? 'gold' : k >= 3 ? 'pink' : k >= 1.2 ? 'violet' : k >= 0.6 ? 'blue' : 'grey'; };
  const pct = (x) => (x >= 0.1 ? `${(x * 100).toFixed(0)}%` : x >= 0.01 ? `${(x * 100).toFixed(1)}%` : `${(x * 100).toFixed(2)}%`);

  // Сундук: цвета кейса, золотая окантовка, блик
  function chest(color, cls = '') {
    const [a, b, c] = COLORS[color] || COLORS.blue, id = `ch${color}${Math.random().toString(36).slice(2, 6)}`;
    return `<svg class="chest ${cls}" viewBox="0 0 120 110" aria-hidden="true">
      <defs>
        <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
        <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
        <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff6c9"/><stop offset=".5" stop-color="#ffc94a"/><stop offset="1" stop-color="#b86b00"/></linearGradient>
      </defs>
      <ellipse cx="60" cy="102" rx="44" ry="6" fill="#000" opacity=".35"/>
      <rect x="14" y="46" width="92" height="54" rx="10" fill="url(#${id}b)"/>
      <path d="M14 50c0-22 18-36 46-36s46 14 46 36v6H14z" fill="url(#${id}l)"/>
      <path d="M22 30c8-9 21-13 38-13" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round" fill="none"/>
      <rect x="14" y="52" width="92" height="9" fill="url(#${id}g)"/>
      <rect x="51" y="14" width="18" height="86" fill="url(#${id}g)"/>
      <rect x="47" y="50" width="26" height="28" rx="6" fill="url(#${id}g)" stroke="#7a4200" stroke-width="1.4"/>
      <path d="M60 57l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.7-4.9 2.7 1.1-5.3-4-3.7 5.4-.6z" fill="#fff" opacity=".95"/>
      <rect x="18" y="84" width="84" height="5" rx="2.5" fill="#000" opacity=".18"/>
    </svg>`;
  }
  const prizeArt = (it, price) => (it.kind === 'nft' && it.gift ? `<span class="cprize__img">${giftImg(it.gift)}</span>`
    : it.kind === 'nft' ? `<span class="cprize__ico cprize__ico--gift">${icon.gift}</span>` : `<span class="cprize__ico">${icon.star}</span>`);
  const prizeCard = (it, price, cls = '') => `
    <div class="cprize t-${tier(it.value, price)} ${cls}">
      ${prizeArt(it, price)}
      <b>${it.kind === 'nft' ? (it.gift ? esc(String(it.gift.name).split(' #')[0]) : 'NFT') : fmt(it.value)}</b>
      <small>${it.kind === 'nft' ? `≈${fmt(it.value)}` : 'Stars'}</small>
    </div>`;

  function render(root) {
    let alive = true, list = [], raf = 0;
    const $r = (q) => root.querySelector(q);

    function drawList() {
      root.innerHTML = `
        ${pageHead(t('cases.title'), 'kHelp')}
        <p class="cases__sub">${t('cases.sub')}</p>
        <section class="cgrid">${list.map((c) => `
          <button class="ccard ccard--${c.color}" data-case="${c.id}">
            <span class="ccard__glow"></span>${chest(c.color, 'ccard__art')}
            <b class="ccard__name">${esc(c.name)}</b>
            <span class="ccard__top">${t('cases.upTo')} ${star()}${fmt(c.top)}</span>
            <span class="ccard__price">${star()}${fmt(c.price)}</span>
          </button>`).join('') || `<div class="ggrid__empty">${emptyBox('…', icon.gift)}</div>`}</section>`;
      wireBack(root);
      $r('#kHelp').addEventListener('click', () => { sound(); openHelp(); });
      root.querySelectorAll('[data-case]').forEach((b) => b.addEventListener('click', () => { sound(); haptic(); S.open = b.dataset.case; drawCase(); }));
    }
    function openHelp() {
      sheet(`<ol class="steps">${['h1', 'h2', 'h3'].map((k, i) => `<li><span>${i + 1}</span>${t('cases.' + k, { r: Math.round(api.cfg('caseRtp', 0.88) * 100) })}</li>`).join('')}</ol>`, { title: t('cases.helpTitle') });
    }

    function drawCase() {
      const c = list.find((x) => x.id === S.open); if (!c) return drawList();
      root.innerHTML = `
        <div class="page-h"><button class="icon-btn" id="kBack" aria-label="back">${icon.back}</button><h1>${esc(c.name)}</h1><span class="icon-btn is-ghost"></span></div>
        <section class="cstage ccard--${c.color}">
          <span class="cstage__rays"></span>
          <div class="cstage__art" id="kArt">${chest(c.color)}</div>
          <div class="cstrip" id="kStrip" hidden><div class="cstrip__track" id="kTrack"></div><i class="cstrip__ptr"></i></div>
        </section>
        <div class="crow">
          <button class="btn btn--xl btn--primary grow" id="kGo">${t('cases.open', { n: `${star()}${fmt(c.price)}` })}</button>
          <button class="cfast ${S.fast ? 'is-on' : ''}" id="kFast">${icon.bolt}<small>${t('cases.fast')}</small></button>
        </div>
        <section class="panel"><div class="panel__h"><h3>${t('cases.inside')}</h3><span class="pvp-fee">${t('cases.rtp', { r: Math.round(api.cfg('caseRtp', 0.88) * 100) })}</span></div>
          <div class="cprizes">${[...c.items].sort((a, b) => b.value - a.value).map((it) => `<div class="cprizes__i">${prizeCard(it, c.price)}<em>${pct(it.chance)}</em></div>`).join('')}</div>
        </section>`;
      $r('#kBack').addEventListener('click', () => { if (S.busy) return; sound(); S.open = null; drawList(); });
      $r('#kFast').addEventListener('click', (e) => { S.fast = !S.fast; e.currentTarget.classList.toggle('is-on', S.fast); sound('tick'); haptic('select'); });
      $r('#kGo').addEventListener('click', () => openCase(c));
    }

    async function openCase(c) {
      if (S.busy) return;
      if (c.price > api.state.balance.stars) { sound('lose'); openPay('dep'); return toast(t('toast.noStars'), 'error'); }
      S.busy = true; const go = $r('#kGo'); go.disabled = true; go.classList.add('is-loading'); haptic('heavy');
      let res;
      try { res = await api.caseOpen(c.id); } catch (e) { S.busy = false; go.disabled = false; go.classList.remove('is-loading'); return errToast(e); }
      balanceChanged(); go.classList.remove('is-loading');
      const win = c.items.find((x) => x.i === res.prize.i) || c.items[0];
      const shown = { ...win, kind: res.prize.kind, value: res.prize.value, gift: res.prize.gift || win.gift };
      // лента: случайные призы по их шансам, победный — на позиции 46
      const pick = () => { let r = Math.random(), a = 0; for (const x of c.items) { a += x.chance; if (r < a) return x; } return c.items[0]; };
      const items = Array.from({ length: 54 }, (_, k) => (k === 46 ? shown : pick()));
      const track = $r('#kTrack'), strip = $r('#kStrip');
      $r('#kArt').classList.add('is-open');
      strip.hidden = false;
      track.innerHTML = items.map((it, k) => prizeCard(it, c.price, k === 46 ? 'is-win' : '')).join('');
      const center = strip.clientWidth / 2, to = 46 * CW + CW / 2 - center + (Math.random() - 0.5) * (CW * 0.6);
      const dur = S.fast || reduce() ? 0 : 5600, t0 = performance.now();
      let last = -1;
      await new Promise((done) => {
        const step = (now) => {
          if (!alive) return done();
          const x = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - Math.pow(1 - x, 4), pos = to * e;
          track.style.transform = `translateX(${-pos}px)`;
          const idx = Math.floor((pos + center) / CW);
          if (idx !== last) { last = idx; if (dur) { sound('tick'); if (x > 0.75) haptic('select'); } }
          if (x < 1) raf = requestAnimationFrame(step); else done();
        };
        raf = requestAnimationFrame(step);
      });
      if (!alive) return;
      strip.classList.add('is-done');
      const good = res.prize.value >= c.price;
      if (res.prize.kind === 'nft') winReveal(res.prize.gift);
      else { sound(good ? 'win' : 'open'); haptic(good ? 'success' : 'light'); if (good) confetti({ y: 0.3, count: res.prize.value >= c.price * 3 ? 140 : 70 }); toast(t('cases.got', { n: fmt(res.prize.value) }), good ? 'win' : 'info'); }
      setTimeout(() => { if (!alive) return; S.busy = false; const g = $r('#kGo'); if (g) g.disabled = false; }, 600);
    }

    api.cases().then((l) => { list = l; if (alive) (S.open ? drawCase() : drawList()); }).catch((e) => { errToast(e); });
    drawList();
    return () => { alive = false; cancelAnimationFrame(raf); S.busy = false; if (api.live) api.refresh().catch(() => {}); };
  }
  return { render };
})();
