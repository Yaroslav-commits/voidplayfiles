// Лидеры: сезон (месяц), таймер до конца, пьедестал и таблица. Тап по игроку — его ЛС
import { api } from '../api.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, fmt, img, soonToast, sound, starIco, avatarHtml, tgAttr } from '../ui.js';
import { current } from '../router.js';

export function render(root) {
  let iv;
  const draw = (L) => {
    const top = L.top || [];
    const nftOf = (p) => p.nft || api.catalog[0];
    const pod = (p, n) => (p ? `
      <div class="pod pod--${n}">
        <div class="pod__n">${n}</div>${avatarHtml(p, api.avatarUrl(p), 'pod__ava')}
        <div class="pod__u" ${tgAttr(p)}>${esc(p.username ? '@' + p.username : p.name)}</div>
        <div class="pod__v">${fmt(p.value)}${starIco()}</div>${img(nftOf(p).img)}<div class="pod__nft">${esc(nftOf(p).name)}</div>
      </div>` : `<div class="pod pod--${n} pod--empty"><div class="pod__n">${n}</div></div>`);
    const showcase = top.length >= 3 ? [nftOf(top[1]), nftOf(top[0]), nftOf(top[2])] : [api.catalog[1], api.catalog[0], api.catalog[2]];
    root.innerHTML = `
      <section class="season">
        <span class="season__glow"></span>
        <div class="season__top"><span class="chip"><span class="ico">${icon.star}</span>${t('lead.season', { n: L.season || 1 })}</span><span class="chip"><i></i>${t('lead.active')}</span></div>
        <div class="season__nfts">${showcase.map((g) => img(g.img)).join('')}</div>
        <div class="season__row"><div><span class="ico">${icon.people}</span>${t('lead.members', { n: fmt(L.players || 0) })}</div><div><span class="ico">${icon.clock}</span>${t('lead.until', { d: new Date(L.end).toLocaleDateString('ru-RU') })}</div></div>
        <div class="timer" id="timer"></div>
      </section>
      <button class="how" id="how"><span class="how__ico">${icon.question}</span><span><b>${t('lead.how')}</b><span>${t('lead.howText')}</span></span><span class="ico">${icon.chevronRight}</span></button>
      ${top.length ? `<section class="podium">${pod(top[1], 2)}${pod(top[0], 1)}${pod(top[2], 3)}</section>` : `<div class="lead-empty">${t('lead.empty')}</div>`}
      <div class="lead-note"><span class="ico">${icon.clock}</span>${t('lead.update', { n: Math.max(1, Math.ceil((L.end - Date.now()) / 864e5)) })}</div>
      <section class="lead-list">${top.slice(3).map((p, i) => `
        <div class="lrow"><span class="lrow__n">${i + 4}</span>${avatarHtml(p, api.avatarUrl(p), 'lrow__ava')}
          <span class="lrow__nick" ${tgAttr(p)}>${esc(p.username ? '@' + p.username : p.name)}</span>
          <span class="lrow__v"><span class="ico">${icon.star}</span>${fmt(p.value)}${img(nftOf(p).img)}</span></div>`).join('')}</section>`;
    const tick = () => {
      const el = root.querySelector('#timer'); if (!el) return;
      const ms = Math.max(0, L.end - Date.now());
      const v = [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60];
      el.innerHTML = v.map((n, i) => `<div><b>${n}</b><span>${t(['lead.d', 'lead.h', 'lead.m', 'lead.s'][i])}</span></div>`).join('');
    };
    tick(); clearInterval(iv); iv = setInterval(tick, 1000);
    root.querySelector('#how').addEventListener('click', () => { sound(); soonToast(); });
  };

  root.innerHTML = `<div class="lead-empty">…</div>`;
  api.leaders().then((L) => { if (current() === 'leaders') draw(L); }).catch(() => {
    if (current() === 'leaders') draw({ top: [], end: Date.now() + 864e5 * 30, players: 0, season: 1 });
  });
  return () => clearInterval(iv);
}
