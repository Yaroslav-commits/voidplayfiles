// Простой hash-роутер: #/home, #/upgrader, #/profile, #/referrals, #/tasks, #/leaders
import * as home from './screens/home.js';
import * as upgrader from './screens/upgrader.js';
import * as profile from './screens/profile.js';
import * as referrals from './screens/referrals.js';
import * as tasks from './screens/tasks.js';
import * as leaders from './screens/leaders.js';

const ROUTES = { home, upgrader, profile, referrals, tasks, leaders };
// к какому пункту нижнего меню относится экран
export const NAV_OF = { home: 'home', upgrader: 'home', leaders: 'leaders', profile: 'profile', referrals: 'profile', tasks: 'profile' };

let cleanup = null;
let onChange = () => {};
export const current = () => (location.hash.replace(/^#\/?/, '') || 'home').split('?')[0];
export const go = (name) => { if (current() === name) render(); else location.hash = `#/${name}`; };
export const onRoute = (fn) => { onChange = fn; };

export function render() {
  let name = current();
  if (!ROUTES[name]) name = 'home';
  if (typeof cleanup === 'function') cleanup();
  const root = document.getElementById('screen');
  root.style.animation = 'none'; void root.offsetWidth; root.style.animation = '';
  cleanup = ROUTES[name].render(root);
  window.scrollTo(0, 0);
  onChange(name);
}

export function startRouter() {
  window.addEventListener('hashchange', render);
  render();
}
