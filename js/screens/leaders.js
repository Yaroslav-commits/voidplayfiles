// Лидеры (Figma: leaders) — сезон, таймер, пьедестал, таблица. Данные — моки
import { api } from '../api.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, fmt, img, soonToast, sound, starIco } from '../ui.js';

export function render(root) {
  const end = Date.now() + 864e5 * 12 + 36e5 * 5;
  const top = Array.from({ length: 7 }, (_, i) => ({ nick: `player${i + 1}`, value: 12000 - i * 1450, nft: api.catalog[i] }));
  const pod = (p, n) => `
    <div class="pod pod--${n}">
      <div class="pod__n">${n}</div><span class="pod__ava"></span><div class="pod__u">${esc(p.nick)}</div>
      <div class="pod__v">${fmt(p.value)}${starIco()}</div>${img(p.nft.img)}<div class="pod__nft">${esc(p.nft.name)}</div>
    </div>`;
  root.innerHTML = `
    <section class="season">
      <span class="season__glow"></span>
      <div class="season__top"><span class="chip"><span class="ico">${icon.star}</span>${t('lead.season', { n: 1 })}</span><span class="chip"><i></i>${t('lead.active')}</span></div>
      <div class="season__nfts">${img(api.catalog[1].img)}${img(api.catalog[0].img)}${img(api.catalog[2].img)}</div>
      <div class="season__row"><div><span class="ico">${icon.people}</span>${t('lead.members', { n: 248 })}</div><div><span class="ico">${icon.clock}</span>${t('lead.until', { d: new Date(end).toLocaleDateString('ru-RU') })}</div></div>
      <div class="timer" id="timer"></div>
    </section>
    <button class="how" id="how"><span class="how__ico">${icon.question}</span><span><b>${t('lead.how')}</b><span>${t('lead.howText')}</span></span><span class="ico">${icon.chevronRight}</span></button>
    <section class="podium">${pod(top[1], 2)}${pod(top[0], 1)}${pod(top[2], 3)}</section>
    <div class="lead-note"><span class="ico">${icon.clock}</span>${t('lead.update', { n: 3 })}</div>
    <section class="lead-list">${top.slice(3).map((p, i) => `
      <div class="lrow"><span class="lrow__n">${i + 4}</span><span class="lrow__ava"></span><span class="lrow__nick">${esc(p.nick)}</span>
        <span class="lrow__v"><span class="ico">${icon.star}</span>${fmt(p.value)}${img(p.nft.img)}</span></div>`).join('')}</section>`;

  const tick = () => {
    const ms = Math.max(0, end - Date.now());
    const v = [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60];
    root.querySelector('#timer').innerHTML = v.map((n, i) => `<div><b>${n}</b><span>${t(['lead.d', 'lead.h', 'lead.m', 'lead.s'][i])}</span></div>`).join('');
  };
  tick(); const iv = setInterval(tick, 1000);
  root.querySelector('#how').addEventListener('click', () => { sound(); soonToast(); });
  return () => clearInterval(iv);
}
