// Слой данных. В Telegram — реальный бэкенд (CONFIG.API_BASE), в обычном браузере — демо-режим на моках.
import { CONFIG } from './config.js';

const tg = window.Telegram?.WebApp;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class ApiError extends Error {
  constructor(code) { super(code); this.code = code; }
}

// ---------- Каталог (такой же, как в backend/catalog.py) ----------
const GIFTS = [
  ['pepe', 'Plush Pepe', 4999], ['gift-126', 'NFT #126', 3500], ['gift-128', 'NFT #128', 2400], ['gift-127', 'NFT #127', 1800],
  ['gift-129', 'NFT #129', 1500], ['gift-004', 'NFT #004', 1200], ['gift-074', 'NFT #074', 999], ['gift-090', 'NFT #090', 850],
  ['gift-020', 'NFT #020', 700], ['gift-065', 'NFT #065', 560], ['gift-023', 'NFT #023', 450], ['gift-047', 'NFT #047', 350],
  ['gift-132', 'NFT #132', 280], ['gift-103', 'NFT #103', 200], ['gift-120', 'NFT #120', 150],
];
const DEMO_CATALOG = GIFTS.map(([id, name, price]) => ({ id, name, price, img: `assets/img/nft/${id}.png` }));

// Аватар-заглушка: буква на цветном круге
export function letterAvatar(name = '?', id = 0) {
  const colors = ['#30a1f5', '#ff4d6d', '#a855f7', '#18c832', '#ff9f1a', '#0033ff'];
  const ch = (String(name).trim()[0] || '?').toUpperCase().replace(/[<&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${colors[Math.abs(id) % colors.length]}"/><text x="32" y="42" font-family="Arial" font-size="30" font-weight="700" fill="#fff" text-anchor="middle">${ch}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ---------- Демо-игроки (только для режима без бэкенда) ----------
const DEMO_PLAYERS = ['durov', 'pepe_hunter', 'void_king', 'starboy', 'nft_lady', 'lucky7', 'gift_master', 'moonwalker', 'tonfan', 'rich_kid']
  .map((u, i) => ({ id: 1000 + i, username: u, name: u.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }));

const state = {
  user: { id: 0, name: 'Игрок', username: '', photo: '', avatar: '' },
  balance: { stars: 250 },
  rates: { tonToStars: 120, usdToStars: 50 },
  subscribed: false,
  wallet: null,
  inventory: [],
  transactions: [],
  referrals: { count: 0, earned: 0, list: [], level: 1, perFriend: 10, percent: 5, refDeposits: 0 },
  tasks: [],
  packs: [{ stars: 100, bonus: 0 }, { stars: 500, bonus: 0 }, { stars: 1000, bonus: 0 }],
  levels: null,
  config: {},
};

function applyState(st) {
  Object.assign(state, {
    user: st.user, balance: st.balance, subscribed: st.subscribed, wallet: st.wallet,
    inventory: st.inventory, transactions: st.transactions, referrals: st.referrals, tasks: st.tasks,
    packs: st.packs || state.packs, levels: st.levels, rates: st.rates || state.rates, config: st.config || {},
  });
  if (st.catalog?.length) api.catalog = st.catalog;
}

async function request(path, body, method = body === undefined ? 'GET' : 'POST') {
  const res = await fetch(CONFIG.API_BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Init-Data': tg?.initData || '' },
    body: method === 'POST' ? JSON.stringify(body || {}) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch (e) { /* ignore */ }
  if (!res.ok || data.ok === false) throw new ApiError(data.error || `http_${res.status}`);
  return data;
}

function demoTx(type, amount, extra = {}) {
  state.transactions.unshift({ type, amount, currency: 'STARS', date: Date.now(), ...extra });
}

export const api = {
  state,
  live: false,
  catalog: DEMO_CATALOG,

  // Вход: в Telegram — /api/auth с подписью initData; иначе демо
  async init() {
    const u = tg?.initDataUnsafe?.user;
    if (tg?.initData) {
      try {
        applyState(await request('/api/auth', {}));
        this.live = true;
        return true;
      } catch (e) {
        console.warn('[api] бэкенд недоступен, демо-режим:', e.code || e);
      }
    }
    // демо
    if (u) state.user = { id: u.id, name: [u.first_name, u.last_name].filter(Boolean).join(' '), username: u.username || '', photo: u.photo_url || '' };
    else state.user = { id: 1, name: 'Игрок', username: 'username', photo: '' };
    try { state.subscribed = localStorage.getItem('vp_subscribed') === '1'; } catch (e) { /* ignore */ }
    state.inventory = [DEMO_CATALOG[14], DEMO_CATALOG[12], DEMO_CATALOG[9]].map((g, i) => ({ ...g, uid: 'd' + i }));
    state.transactions = [
      { type: 'fee', game: 'Апгрейдер', item: 'nft', amount: 390, nft: DEMO_CATALOG[10].img, date: Date.now() - 3600e3 },
      { type: 'win', game: 'Апгрейдер', item: 'nft', amount: 560, nft: DEMO_CATALOG[9].img, date: Date.now() - 7200e3 },
      { type: 'dep', currency: 'STARS', amount: 500, date: Date.now() - 86400e3 },
    ];
    state.referrals.list = DEMO_PLAYERS.slice(0, 2).map((p, i) => ({ ...p, earned: [25, 10][i] }));
    state.referrals.count = 2; state.referrals.earned = 35;
    state.tasks = [
      { id: 'bets5', title: 'Сделай 5 ставок', text: 'Сыграй 5 раз в апгрейдере', reward: 10, progress: 2, goal: 5, endsIn: 864e5 * 5 },
      { id: 'sub', title: 'Подписка', text: 'Подпишись на канал Void Play', reward: 5, progress: 1, goal: 1, endsIn: 864e5 * 5 },
      { id: 'ref3', title: 'Пригласи друзей', text: 'Пригласи 3 друзей по своей ссылке', reward: 50, progress: 2, goal: 3, endsIn: 864e5 * 5 },
    ];
    return false;
  },

  async refresh() {
    if (!this.live) return;
    applyState(await request('/api/auth', {}));
    document.dispatchEvent(new Event('balance'));
  },

  cfg(key, fallback) { return state.config?.[key] ?? fallback; },

  // ---------- игроки ----------
  avatarUrl(u) {
    if (!u) return letterAvatar('?');
    if (u.photo) return u.photo;
    if (this.live && u.avatar) return CONFIG.API_BASE + u.avatar;
    return letterAvatar(u.name || u.username, u.id || 0);
  },
  refLink() {
    const bot = this.cfg('botUsername', '') || CONFIG.BOT_USERNAME;
    return `https://t.me/${bot}?start=ref_${state.user.id || 0}`;
  },

  // ---------- бонусы ----------
  async claimDaily() {
    if (this.live) { const r = await request('/api/daily', {}); state.balance.stars = r.balance; return r.reward; }
    const today = new Date().toDateString();
    let last = ''; try { last = localStorage.getItem('vp_daily'); } catch (e) { /* ignore */ }
    if (last === today) throw new ApiError('already');
    try { localStorage.setItem('vp_daily', today); } catch (e) { /* ignore */ }
    state.balance.stars += 5; demoTx('bonus', 5); return 5;
  },

  async checkSubscription() {
    if (this.live) {
      const r = await request('/api/subscribe/check', {});
      state.subscribed = true; state.balance.stars = r.balance;
      return { ok: true, reward: r.reward };
    }
    await wait(1200);
    state.subscribed = true;
    try { localStorage.setItem('vp_subscribed', '1'); } catch (e) { /* ignore */ }
    const n = CONFIG.SUBSCRIBE_REWARD; state.balance.stars += n; demoTx('bonus', n);
    return { ok: true, reward: n };
  },

  async activatePromo(code) {
    if (this.live) { const r = await request('/api/promo', { code }); state.balance.stars = r.balance; return r.reward; }
    await wait(400);
    if (code.trim().toUpperCase() !== 'VOID') throw new ApiError('not_found');
    state.balance.stars += 25; demoTx('bonus', 25); return 25;
  },

  async claimTask(id) {
    if (this.live) { const r = await request('/api/tasks/claim', { id }); state.balance.stars = r.balance; state.tasks = r.tasks; return r.reward; }
    const t = state.tasks.find((x) => x.id === id);
    if (!t || t.claimed || t.progress < t.goal) throw new ApiError('not_ready');
    t.claimed = true; state.balance.stars += t.reward; demoTx('bonus', t.reward); return t.reward;
  },

  // ---------- апгрейдер ----------
  chance(stake, price) {
    if (!stake || !price) return 0;
    const edge = this.cfg('houseEdge', 0.1), max = this.cfg('maxChance', 0.75);
    return Math.max(0.0001, Math.min(max, (stake / price) * (1 - edge)));
  },
  async upgrade({ stakeStars = 0, stakeGift = null, target }) {
    if (this.live) {
      const r = await request('/api/upgrade', { target: target.id, stake: stakeStars, gift: stakeGift?.uid || null });
      state.balance.stars = r.balance; state.inventory = r.inventory;
      this.refresh().catch(() => {});
      return { ok: true, win: r.win, chance: r.chance };
    }
    const value = stakeGift ? stakeGift.price : stakeStars;
    if (!stakeGift && value > state.balance.stars) throw new ApiError('no_stars');
    const chance = this.chance(value, target.price);
    const win = Math.random() < chance;
    if (stakeGift) state.inventory = state.inventory.filter((g) => g.uid !== stakeGift.uid);
    else state.balance.stars -= value;
    demoTx('fee', value, { game: 'Апгрейдер', item: stakeGift ? 'nft' : 'stars', nft: stakeGift?.img });
    if (win) { state.inventory.unshift({ ...target, uid: 'd' + Date.now() }); demoTx('win', target.price, { game: 'Апгрейдер', item: 'nft', nft: target.img }); }
    return { ok: true, win, chance };
  },

  // ---------- пополнение Stars (1 ⭐ = 1 Telegram Star) ----------
  async deposit(stars) {
    if (this.live) {
      const { link } = await request('/api/invoice', { stars });
      const status = await new Promise((resolve) => {
        if (tg?.openInvoice) tg.openInvoice(link, resolve); else { window.open(link, '_blank'); resolve('pending'); }
      });
      if (status !== 'paid') return { ok: false, status };
      // ждём, пока бот получит successful_payment и зачислит
      const before = state.balance.stars;
      for (let i = 0; i < 8 && state.balance.stars === before; i++) { await wait(1000); await this.refresh().catch(() => {}); }
      return { ok: true, status, credited: state.balance.stars - before };
    }
    await wait(500);
    const pack = state.packs.find((p) => p.stars === stars);
    const total = stars + (pack?.bonus || 0);
    state.balance.stars += total; demoTx('dep', total);
    return { ok: true, status: 'paid', credited: total };
  },

  async withdraw(stars, method = 'stars') {
    if (this.live) { const r = await request('/api/withdraw', { stars, method }); state.balance.stars = r.balance; this.refresh().catch(() => {}); return r; }
    if (stars < this.cfg('minWithdraw', 100)) throw new ApiError('bad_amount');
    if (stars > state.balance.stars) throw new ApiError('no_stars');
    state.balance.stars -= stars; demoTx('wd', stars, { status: 'pending', currency: method.toUpperCase() });
    return { ok: true };
  },

  // ---------- лента и лидеры ----------
  async feed() {
    if (this.live) return (await request('/api/feed')).items;
    return Array.from({ length: 10 }, () => this.demoWin());
  },
  demoWin() {
    const g = this.catalog[Math.floor(Math.random() * this.catalog.length)];
    const p = DEMO_PLAYERS[Math.floor(Math.random() * DEMO_PLAYERS.length)];
    return { id: Math.random().toString(36).slice(2), price: g.price, gift: g, user: p, date: Date.now() };
  },

  async leaders() {
    if (this.live) return request('/api/leaders');
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    return {
      season: now.getMonth() + 1, end, players: 248,
      top: DEMO_PLAYERS.map((p, i) => ({ ...p, value: 12000 - i * 1150, nft: this.catalog[i % this.catalog.length] })),
    };
  },
};
