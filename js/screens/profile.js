// Профиль: аватар, статус, кошелёк, инвентарь, рефералка, история, задания
import { api } from '../api.js';
import { CONFIG } from '../config.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { starsBg } from '../decor.js';
import { esc, fmt, img, sound, toast, haptic, openLink } from '../ui.js';
import { openAddGift, openInventory, shareRef, connectWallet } from '../sheets.js';
import { go, current } from '../router.js';

// фон карточки — россыпь слова статуса (Figma: Frame 145, opacity 4%)
function words(word) {
  let seed = 7; const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: 38 }, () =>
    `<span style="left:${(rnd() * 110 - 15).toFixed(1)}%;top:${(rnd() * 105 - 5).toFixed(1)}%;font-size:${(10 + rnd() * 9).toFixed(0)}px">${esc(word)}</span>`).join('');
}

const pad = (n) => String(n).padStart(2, '0');
const dt = (ts) => { const d = new Date(ts); return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const curIco = (c) => (c === 'TON' ? icon.ton : c === 'USD' ? icon.dollar : icon.starLine);

export function txRow(x) {
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

export function render(root, fresh = false) {
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
      <div class="invite__clip"><img class="invite__bear" src="assets/img/deco/bear.png" alt="" onerror="this.remove()" /></div>
      <div class="invite__head"><img src="assets/img/deco/bear.png" alt="" onerror="this.remove()" /></div>
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
      <img class="earn__img" src="assets/img/deco/star-char.png" alt="" style="left:292px;top:69px;width:52px;height:46px;opacity:.5" onerror="this.remove()" />
      <img class="earn__img" src="assets/img/deco/star-char.png" alt="" style="left:253px;top:41px;width:65px;height:58px;opacity:.7" onerror="this.remove()" />
      <img class="earn__img" src="assets/img/deco/star-char.png" alt="" style="left:177px;top:-4px;width:109px;height:97px" onerror="this.remove()" />
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
