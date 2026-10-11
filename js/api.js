// Слой данных. Сейчас всё на моках — потом каждую функцию заменишь
// на fetch(`${CONFIG.API_BASE}/...`) к бэкенду на aiogram (+ aiohttp/FastAPI).
import { CONFIG } from './config.js';

const NFT_IMG = 'assets/img/nft/pepe.png';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Каталог NFT (цели апгрейда). Цены условные — потом придут с бэка
const CATALOG = [
  { id: 'plush-pepe', name: 'Plush Pepe', price: 5000 },
  { id: 'durov-cap', name: "Durov's Cap", price: 3200 },
  { id: 'precious-peach', name: 'Precious Peach', price: 2100 },
  { id: 'heart-locket', name: 'Heart Locket', price: 1800 },
  { id: 'loot-bag', name: 'Loot Bag', price: 1250 },
  { id: 'astral-shard', name: 'Astral Shard', price: 980 },
  { id: 'ion-gem', name: 'Ion Gem', price: 760 },
  { id: 'mini-oscar', name: 'Mini Oscar', price: 640 },
  { id: 'scared-cat', name: 'Scared Cat', price: 520 },
  { id: 'signet-ring', name: 'Signet Ring', price: 430 },
  { id: 'genie-lamp', name: 'Genie Lamp', price: 390 },
  { id: 'swiss-watch', name: 'Swiss Watch', price: 310 },
].map((n) => ({ ...n, img: NFT_IMG }));

const state = {
  user: { id: 0, name: 'Name', username: 'username', photo: '' },
  balance: { stars: 250 },
  rates: { tonToStars: 120, usdToStars: 50 }, // ваш курс: 1 TON = N Stars, $1 = N Stars
  subscribed: false,
  wallet: null,
  inventory: [
    { uid: 'g1', ...CATALOG[10] },
    { uid: 'g2', ...CATALOG[8] },
    { uid: 'g3', ...CATALOG[11] },
  ],
  transactions: [
    { type: 'fee', game: 'Апгрейдер', item: 'nft', amount: 390, nft: NFT_IMG, date: Date.now() - 3600e3 },
    { type: 'win', game: 'Апгрейдер', item: 'nft', amount: 120, date: Date.now() - 7200e3 },
    { type: 'dep', currency: 'STARS', amount: 500, date: Date.now() - 86400e3 },
  ],
  referrals: { count: 0, earned: 0, list: [], level: 1, perFriend: 10, percent: 5 },
  tasks: [
    { id: 't1', title: 'Первая ставка', text: 'Сделайте 1 ставку в любой игре', reward: 10, progress: 0, goal: 1, endsIn: 86400e3 * 2 },
    { id: 't2', title: 'Пригласи друга', text: 'Пригласите 3 друзей по своей ссылке', reward: 50, progress: 1, goal: 3, endsIn: 86400e3 * 5 },
    { id: 't3', title: 'Подписка', text: 'Подпишитесь на канал Void Play', reward: 15, progress: 1, goal: 1, endsIn: 86400e3 * 7, claimed: false },
  ],
};

// Подтягиваем реального юзера из Telegram, если открыто внутри WebApp
export function initUser() {
  const u = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (u) {
    state.user = {
      id: u.id,
      name: [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Name',
      username: u.username || '',
      photo: u.photo_url || '',
    };
  }
  try { state.subscribed = localStorage.getItem('vp_subscribed') === '1'; } catch (e) { /* ignore */ }
  return state.user;
}

export const api = {
  state,
  catalog: CATALOG,

  async getBalance() { return state.balance; },

  // Проверка подписки — на бэке: bot.get_chat_member(channel_id, user_id)
  async checkSubscription() {
    await wait(1200);
    state.subscribed = true; // мок: считаем, что подписался
    try { localStorage.setItem('vp_subscribed', '1'); } catch (e) { /* ignore */ }
    state.balance.stars += CONFIG.SUBSCRIBE_REWARD;
    state.transactions.unshift({ type: 'dep', currency: 'STARS', amount: CONFIG.SUBSCRIBE_REWARD, date: Date.now() });
    return { ok: true, reward: CONFIG.SUBSCRIBE_REWARD };
  },

  async claimDailyBonus() { await wait(300); state.balance.stars += 5; return { ok: true, reward: 5 }; },

  async activatePromo(code) {
    await wait(500);
    if (code.trim().toUpperCase() === 'VOID') { state.balance.stars += 25; return { ok: true, reward: 25 }; }
    return { ok: false };
  },

  // Апгрейд. На бэке шанс и результат считаются только на сервере!
  // Здесь мок: шанс = ставка / цена цели * (1 - комиссия), максимум 75%
  chance(stakeValue, targetValue) {
    if (!stakeValue || !targetValue) return 0;
    return Math.max(0.01, Math.min(0.75, (stakeValue / targetValue) * 0.9));
  },
  async upgrade({ stakeStars = 0, stakeGift = null, target }) {
    const value = stakeGift ? stakeGift.price : stakeStars;
    if (!stakeGift && stakeStars > state.balance.stars) return { ok: false, error: 'noStars' };
    const chance = this.chance(value, target.price);
    const win = Math.random() < chance;
    if (stakeGift) state.inventory = state.inventory.filter((g) => g.uid !== stakeGift.uid);
    else state.balance.stars -= stakeStars;
    state.transactions.unshift({ type: 'fee', game: 'Апгрейдер', item: stakeGift ? 'nft' : 'stars', amount: value, nft: stakeGift?.img, date: Date.now() });
    if (win) {
      state.inventory.unshift({ uid: 'g' + Date.now(), ...target });
      state.transactions.unshift({ type: 'win', game: 'Апгрейдер', item: 'nft', amount: target.price, nft: target.img, date: Date.now() });
    }
    return { ok: true, win, chance };
  },

  // Пополнение: Stars — через invoice бота (createInvoiceLink, currency XTR),
  // TON — через TON Center (проверка входящей транзакции с комментом), $ — через CryptoBot
  async deposit({ method, stars }) { await wait(400); return { ok: true, method, stars }; },
  async withdraw({ method, stars }) {
    await wait(400);
    if (stars > state.balance.stars) return { ok: false, error: 'noStars' };
    return { ok: true, method, stars };
  },

  // Живая лента выигрышей
  randomWin() {
    const n = CATALOG[Math.floor(Math.random() * CATALOG.length)];
    return { ...n, uid: 'w' + Math.random().toString(36).slice(2) };
  },

  refLink() { return `https://t.me/${CONFIG.BOT_USERNAME}?startapp=ref_${state.user.id || 0}`; },
};
