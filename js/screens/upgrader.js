// Апгрейдер: ставка (звёзды или подарок) → цель (NFT) → кольцо шанса
import { api } from '../api.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { starsBg, choiceShape } from '../decor.js';
import { esc, fmt, img, sound, toast, haptic, starIco } from '../ui.js';
import { openAddGift, openNftPicker } from '../sheets.js';

const S = { tab: 'stars', stake: 0, gift: null, target: null, q: '', spinning: false, rot: 0 };

const gcard = (n, sel, glass = false) => `
  <button class="gcard ${glass ? 'gcard--glass' : ''} ${sel ? 'is-sel' : ''}" data-id="${esc(n.uid || n.id)}">
    ${img(n.img)}<span class="gcard__name">${esc(n.name)}</span>
    <span class="gcard__val">${starIco()}${fmt(n.price)}</span>
  </button>`;

export function render(root) {
  const st = api.state;
  S.spinning = false; S.rot = 0;
  if (S.gift && !st.inventory.some((g) => g.uid === S.gift.uid)) S.gift = null;
  root.innerHTML = `
    <div class="up">
      <button class="up__help" id="upHelp" aria-label="help">${icon.question}</button>
      <div class="up__stage">
        <div class="up__label up__label--l">${t('up.stake')}</div>
        <div class="up__label up__label--r">${t('up.win')}</div>
        <div class="choice choice--l" id="chL"></div>
        <div class="choice choice--r" id="chR"></div>
        <div class="ring" id="ring">
          <div class="ring__outer"></div>
          <div class="ring__dim" id="ringDim"></div>
          <div class="ring__inner"><span class="ring__pct" id="ringPct">0%</span><span class="ring__mul" id="ringMul">x0</span></div>
          <div class="ring__spin" id="ringSpin"><svg class="ring__arrow" viewBox="0 0 24 22"><path fill="currentColor" d="M12 1.5c.6 0 1.1.3 1.4.8l9.4 16.4c.6 1.1-.2 2.3-1.4 2.3H2.6c-1.2 0-2-1.2-1.4-2.3L10.6 2.3c.3-.5.8-.8 1.4-.8z"/></svg></div>
        </div>
        <button class="up__go" id="upGo"><span class="ico">${icon.chevronUp}</span>${t('up.go')}</button>
      </div>

      <section class="bet">
        <div class="bet__tabs">
          <button class="bet__tab" data-tab="stars">${starsBg()}<span style="position:relative">${t('up.tabStars')}</span></button>
          <button class="bet__tab" data-tab="gifts">${starsBg()}<span style="position:relative">${t('up.tabGifts')}</span></button>
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
      L.innerHTML = `${choiceShape('l')}<span class="choice__name">${esc(S.gift.name)}</span>${img(S.gift.img, 'choice__img')}<span class="choice__val">${fmt(S.gift.price)}${starIco()}</span>`;
    } else if (S.tab === 'stars' && v > 0) {
      L.className = 'choice choice--l';
      L.innerHTML = `${choiceShape('l')}<span class="choice__name">Stars</span><span class="choice__img" style="display:grid;place-items:center;color:#ffce00;font-size:44px">${icon.star}</span><span class="choice__val">${fmt(v)}${starIco()}</span>`;
    } else {
      L.className = 'choice choice--l is-empty';
      L.innerHTML = `${choiceShape('l')}<span></span><span class="choice__hint">${t('up.pickStake')}</span><span></span>`;
    }
    if (S.target) {
      R.className = 'choice choice--r';
      R.innerHTML = `${choiceShape('r')}<span class="choice__name">${esc(S.target.name)}</span>${img(S.target.img, 'choice__img')}<span class="choice__val">${fmt(S.target.price)}${starIco()}</span>`;
    } else {
      R.className = 'choice choice--r is-empty';
      R.innerHTML = `${choiceShape('r')}<span></span><span class="choice__hint">${t('up.pickTarget')}</span><span></span>`;
    }
    const ch = api.chance(v, S.target?.price);
    $('#ringPct').textContent = `${(ch * 100).toFixed(ch < 0.1 ? 2 : 1).replace(/\.0+$/, '')}%`;
    $('#ringMul').textContent = v && S.target ? `x${(S.target.price / v).toFixed(2)}` : 'x0';
    $('#ringDim').style.setProperty('--deg', `${ch * 360}deg`);
    $('#upGo').disabled = !(v > 0 && S.target) || S.spinning;
  }

  function drawBet() {
    root.querySelectorAll('.bet__tab').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === S.tab));
    const body = $('#betBody');
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
    const ring = $('#ring'); ring.classList.remove('is-win', 'is-lose');
    const res = await api.upgrade({ stakeStars: S.tab === 'stars' ? v : 0, stakeGift: S.tab === 'gifts' ? S.gift : null, target: S.target });
    if (!res.ok) { S.spinning = false; drawChoices(); return toast(t('toast.noStars'), 'error'); }
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
      ring.classList.add(res.win ? 'is-win' : 'is-lose');
      sound(res.win ? 'win' : 'lose');
      toast(t(res.win ? 'toast.win' : 'toast.lose'), res.win ? 'win' : 'lose');
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
  $('#upGo').addEventListener('click', spin);

  drawBet(); drawTargets(); drawChoices();
  // При каждом входе в апгрейдер показываем, как добавить подарок
  const tm = setTimeout(openAddGift, 350);
  return () => clearTimeout(tm);
}
