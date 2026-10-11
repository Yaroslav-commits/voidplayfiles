// Задания (Figma: tasks + Frame 525/526). Список заданий потом придёт с бэка
import { api } from '../api.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, sound, toast, haptic, starIco } from '../ui.js';

const left = (ms) => { const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5); return `${d}д ${h}ч`; };

export function render(root) {
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
    root.querySelectorAll('[data-claim]').forEach((b) => b.addEventListener('click', () => {
      const task = api.state.tasks.find((x) => x.id === b.dataset.claim);
      task.claimed = true; api.state.balance.stars += task.reward;
      sound('win'); haptic('success');
      document.dispatchEvent(new Event('balance'));
      toast(t('toast.gotStars', { n: task.reward }), 'success'); draw();
    }));
  };
  draw();
}
