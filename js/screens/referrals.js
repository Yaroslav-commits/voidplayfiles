// Друзья / реферальная система (Figma: referals + Frame 496)
import { api } from '../api.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, fmt, img, sound, starIco } from '../ui.js';
import { copyRef, openLevels, LEVELS, levelCard } from '../sheets.js';

export function render(root) {
  const r = api.state.referrals;
  const L = LEVELS[Math.max(0, r.level - 1)];
  root.innerHTML = `
    <section class="rcard">
      <span class="blob" style="left:168px;top:57px;width:206px;height:122px;background:#677df9"></span>
      <span class="blob" style="left:209px;top:75px;width:165px;height:92px;background:#0022ff"></span>
      ${img('assets/img/deco/deco-0311.png', 'rcard__art', '', true)}
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
      ${levelCard({ ...L, g1: '#67baf9', g2: '#b8e0ff' }, 'assets/img/levels/current.png')}
      <button class="rmore" id="lvlMore"><span>${t('ref.moreLevels')}</span><span class="ico">${icon.chevronRight}</span></button>
    </section>

    <section class="rcard">
      <div class="rlist__h"><div class="rcard__h"><span class="ico">${icon.people}</span>${t('ref.all')}</div><span>${t('ref.total', { n: r.count })}</span></div>
      ${r.list.length
        ? r.list.map((f) => `<div class="rrow"><span class="rrow__u"><i></i>${esc(f.name)}</span><span class="rrow__v">${starIco()}${fmt(f.earned)}</span></div>`).join('')
        : `<div class="rrow rrow--empty">${t('ref.none')}</div>`}
    </section>`;

  root.querySelector('#copyLink').addEventListener('click', () => { sound(); copyRef(); });
  root.querySelector('#lvlMore').addEventListener('click', () => { sound(); openLevels(); });
}
