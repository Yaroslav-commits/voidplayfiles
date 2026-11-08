'use strict';
// Ядро: настройки, тексты, иконки, связь с API, общие UI-хелперы, эффекты

// ======================= настройки =======================
const USER_CFG = window.VOIDPLAY_CONFIG || {};
const qs = new URLSearchParams(location.search);

// ?api=https://... в адресе — временно сменить адрес API (запоминается на этом устройстве)
(() => {
  const a = qs.get('api');
  try {
    if (a === 'reset') localStorage.removeItem('vp_api');
    else if (a) localStorage.setItem('vp_api', a.replace(/\/+$/, ''));
  } catch (e) { /* ignore */ }
})();
const storedApi = (() => { try { return localStorage.getItem('vp_api'); } catch (e) { return null; } })();

const CONFIG = {
  API_BASE: String(storedApi ?? USER_CFG.API_BASE ?? '').replace(/\/+$/, ''),
  APP_NAME: USER_CFG.APP_NAME || 'Void Play',
  BOT_USERNAME: USER_CFG.BOT_USERNAME || 'voidplay_bot',
  CHANNEL_URL: USER_CFG.CHANNEL_URL || 'https://t.me/voidplay',
  SUPPORT_URL: USER_CFG.SUPPORT_URL || 'https://t.me/voidplay_support',
  TERMS_URL: USER_CFG.TERMS_URL || 'https://telegra.ph/',
  GIFTS_ACCOUNT: USER_CFG.GIFTS_ACCOUNT || '@voidplay',
  SUBSCRIBE_REWARD: 15,
  // ?dev=42 — локальная проверка с бэкендом в DEV_MODE (без Telegram)
  DEV_USER: qs.get('dev') || '',
  TOAST_MS: 3000,
  FEED_POLL: 5000,
  BONUS_INTERVAL: 6000,
  MODAL_CLOSE_DELAY: 3000,
};

// ======================= тексты RU / EN =======================
const dict = {
  ru: {
    'nav.home': 'Игры', 'nav.leaders': 'Топ', 'nav.bonus': 'Бонусы', 'nav.profile': 'Профиль',
    'common.soon': 'Скоро', 'common.soonToast': 'Скоро будет доступно', 'common.showMore': 'Показать ещё {n}',
    'common.showAll': 'Все', 'common.empty': 'Пока пусто', 'common.copied': 'Скопировано!', 'common.error': 'Что-то пошло не так',
    'common.back': 'Назад', 'common.play': 'Играть', 'common.close': 'Закрыть', 'common.retry': 'Повторить',

    'conn.loading': 'Подключаемся…', 'conn.offTitle': 'Нет связи с сервером', 'conn.offText': 'Сервер игры не отвечает. Проверь интернет или попробуй чуть позже — мы переподключимся сами.',
    'conn.lost': 'Связь потеряна — переподключаемся…', 'conn.back': 'Связь восстановлена', 'conn.demo': 'Демо-режим — открой через бота, чтобы играть по-настоящему',
    'conn.details': 'Подробнее',

    'home.live': 'Живая лента', 'home.games': 'Игры', 'home.bonuses': 'Бонусы', 'home.heroTag': 'Хит',
    'home.heroTitle': 'Апгрейдер', 'home.heroText': 'Поставь звёзды или подарок — и забери NFT дороже до x100',
    'home.online': 'Работает', 'feed.empty': 'Здесь появятся выигрыши игроков',

    'bonus.daily.title': 'Ежедневный бонус', 'bonus.daily.text': 'Заходи каждый день и забирай звёзды бесплатно', 'bonus.daily.btn': 'Забрать', 'bonus.daily.taken': 'Уже получено — приходи завтра',
    'bonus.invite.title': 'Пригласи друга', 'bonus.invite.text': 'Получай процент с каждого пополнения друзей', 'bonus.invite.btn': 'Пригласить',
    'bonus.deposit.title': 'Пополни баланс', 'bonus.deposit.text': 'Пополняй через Telegram Stars — моментально', 'bonus.deposit.btn': 'Пополнить',
    'bonus.tasks.title': 'Задания', 'bonus.tasks.text': 'Выполняй задания и получай награды звёздами', 'bonus.tasks.btn': 'Открыть',

    'promo.title': 'Промокод', 'promo.text': 'Свежие коды — в нашем Telegram-канале', 'promo.btn': 'Активировать',
    'promo.placeholder': 'Введите код', 'promo.invalid': 'Промокод не найден',

    'game.mines': 'Мины', 'game.lottery': 'Розыгрыши', 'game.cases': 'Кейсы', 'game.crash': 'Самолётик',
    'game.upgrade': 'Апгрейдер', 'game.waterball': 'Шарик с водой', 'game.ball': 'Шарик', 'game.hockey': 'Хоккей',
    'game.mines.d': 'Открывай клетки — не попадись', 'game.upgrade.d': 'Прокачай до NFT',

    'sub.title': 'Забирай {n} Stars!', 'sub.text': 'Подпишись на наш канал и получи звёзды на баланс',
    'sub.s1': 'Жми кнопку и подпишись на канал', 'sub.s2': 'Вернись в приложение', 'sub.s3': 'Звёзды уже на балансе',
    'sub.btn': 'Подписаться и забрать', 'sub.checking': 'Проверяем подписку…', 'sub.notYet': 'Подписка не найдена',

    'toast.noStars': 'Недостаточно звёзд', 'toast.lose': 'Не повезло', 'toast.win': 'Победа!',
    'toast.gotStars': '+{n} Stars на баланс', 'toast.pickTarget': 'Выбери цель апгрейда', 'toast.pickStake': 'Введи ставку',

    'up.title': 'Апгрейдер', 'up.stake': 'Ставка', 'up.win': 'Цель', 'up.go': 'Прокачать', 'up.tabStars': 'Звёзды', 'up.tabGifts': 'Подарки',
    'up.enterBet': 'Сумма ставки', 'up.giftForBet': 'Подарок для ставки', 'up.noGifts': 'У тебя пока нет подарков',
    'up.topUpGifts': 'Добавить подарок', 'up.target': 'Цель апгрейда', 'up.search': 'Поиск', 'up.chance': 'шанс',
    'up.pickStake': 'Выбери ставку', 'up.pickTarget': 'Выбери цель', 'up.auto': 'Авто-цель',

    'gift.title': 'Как добавить подарок', 'gift.warnTitle': 'Не отправляйте подарки с маркетплейсов',
    'gift.warnText': 'Зачисляются только подарки, отправленные напрямую с вашего аккаунта.',
    'gift.s1': 'Открой чат с {acc}', 'gift.s2': 'Напиши любое сообщение', 'gift.s3': 'Отправь подарок', 'gift.s4': 'Он появится в инвентаре',

    'pay.title': 'Кошелёк', 'pay.dep': 'Пополнить', 'pay.wd': 'Вывести', 'pay.balance': 'Баланс',
    'pay.amount': 'Сумма', 'pay.packs': 'Быстрый выбор', 'pay.min': 'Введи сумму', 'pay.payStars': 'Оплатить {n} ⭐',
    'pay.wdStars': 'Вывести {n} ⭐', 'pay.via': 'Оплата через Telegram Stars', 'pay.wdNote': 'Заявка уходит администратору, вывод — подарком или звёздами',
    'pay.paid': 'Оплата прошла!', 'pay.wdSent': 'Заявка на вывод отправлена', 'pay.minWd': 'Минимум для вывода: {n}',

    'set.title': 'Настройки', 'set.sounds': 'Звуки', 'set.volume': 'Громкость', 'set.lang': 'Язык',
    'set.terms': 'Пользовательское соглашение', 'set.support': 'Поддержка', 'set.server': 'Сервер',

    'prof.inventory': 'Инвентарь', 'prof.invite': 'Приглашай друзей — получай % с их пополнений',
    'prof.inviteBtn': 'Пригласить', 'prof.more': 'Реферальная программа', 'prof.history': 'История',
    'prof.historyEmpty': 'Транзакций пока нет', 'prof.shareText': 'Залетай — играй и забирай подарки!',
    'prof.balance': 'Баланс', 'prof.items': 'Подарков', 'prof.friends': 'Друзей', 'prof.settings': 'Настройки',

    'tx.fee': 'Ставка', 'tx.win': 'Выигрыш', 'tx.dep': 'Пополнение', 'tx.wd': 'Вывод', 'tx.bonus': 'Бонус', 'tx.ref': 'Реферальный бонус',

    'ref.title': 'Друзья', 'ref.systemText': 'Зови друзей и зарабатывай вместе с ними',
    'ref.perFriend': '+{n} ⭐ за друга', 'ref.perDeposit': '{n}% с пополнений',
    'ref.count': 'Друзей', 'ref.earned': 'Заработано', 'ref.link': 'Твоя ссылка', 'ref.copy': 'Копировать', 'ref.share': 'Поделиться',
    'ref.level': 'Твой уровень', 'ref.levelN': 'Уровень {n}', 'ref.percent': '{n}% с депозитов',
    'ref.from': 'от {n} ⭐ депозитов друзей', 'ref.moreLevels': 'Все уровни',
    'ref.all': 'Приглашённые', 'ref.none': 'Пока никого — отправь ссылку другу', 'ref.levels': 'Реферальные уровни',

    'task.title': 'Бонусы', 'task.text': 'Забирай звёзды за активность',
    'task.reward': '+{n}', 'task.inProgress': 'В процессе', 'task.done': 'Получено', 'task.claim': 'Забрать', 'task.list': 'Задания',
    'task.left': 'осталось {t}',

    'lead.season': 'Сезон {n}', 'lead.active': 'идёт', 'lead.members': '{n} участников', 'lead.until': 'до {d}',
    'lead.d': 'дн', 'lead.h': 'ч', 'lead.m': 'мин', 'lead.s': 'сек', 'lead.how': 'Как это работает', 'lead.prizes': 'Призы сезона',
    'lead.empty': 'В этом сезоне ещё никто не играл', 'lead.rating': 'Рейтинг по обороту',

    'err.already': 'Уже получено', 'err.notFound': 'Не найдено', 'err.notReady': 'Ещё не выполнено',
    'err.badAmount': 'Неверная сумма', 'err.checkFailed': 'Не удалось проверить подписку, попробуй позже',
    'err.auth': 'Открой приложение через бота', 'err.banned': 'Аккаунт заблокирован', 'err.network': 'Нет связи с сервером', 'err.timeout': 'Сервер долго отвечает',

    'player.dm': 'Написать в ЛС', 'player.won': 'выиграл(а)', 'player.noUser': 'У игрока нет юзернейма',

    'mines.title': 'Мины', 'mines.count': 'Мин на поле', 'mines.play': 'Играть', 'mines.cash': 'Забрать {n}',
    'mines.mult': 'Множитель', 'mines.next': 'Следующий', 'mines.win': 'Выигрыш',
    'mines.helpTitle': 'Как играть в Мины', 'mines.h1': 'Введи ставку и выбери, сколько мин спрятать',
    'mines.h2': 'Открывай клетки — каждая звезда увеличивает множитель', 'mines.h3': 'Забирай выигрыш в любой момент',
    'mines.h4': 'Попал на мину — ставка сгорает', 'mines.boom': 'Бум! Это была мина', 'mines.won': 'Ты забрал {n} Stars!',

    'how.title': 'Как это работает', 'how.sub': 'Делай ставки, поднимайся в топ, забирай призы',
    'how.turnH': 'Оборот', 'how.turn1': 'Сумма всех твоих ставок за сезон во всех играх',
    'how.prizesH': 'Призы ТОП-3', 'how.prizesNote': 'Призы выдаются после завершения сезона.',
    'how.datesH': 'Сроки', 'how.dur': 'Сезон длится 1 месяц, окончание — {d}. После этого оборот обнуляется.',
    'how.warnH': 'Честная игра', 'how.warn': 'Мультиаккаунты, накрутки и использование багов наказываются: место аннулируется, приз не выдаётся.',
    'how.ok': 'Понятно',
    'win.title': 'Поздравляем!', 'win.btn': 'Забрать',
  },
  en: {
    'nav.home': 'Games', 'nav.leaders': 'Top', 'nav.bonus': 'Bonuses', 'nav.profile': 'Profile',
    'common.soon': 'Soon', 'common.soonToast': 'Coming soon', 'common.showMore': 'Show {n} more',
    'common.showAll': 'All', 'common.empty': 'Nothing here yet', 'common.copied': 'Copied!', 'common.error': 'Something went wrong',
    'common.back': 'Back', 'common.play': 'Play', 'common.close': 'Close', 'common.retry': 'Retry',

    'conn.loading': 'Connecting…', 'conn.offTitle': 'No connection', 'conn.offText': 'The game server is not responding. Check your internet or try again a bit later — we will reconnect automatically.',
    'conn.lost': 'Connection lost — reconnecting…', 'conn.back': 'Connection restored', 'conn.demo': 'Demo mode — open via the bot to play for real',
    'conn.details': 'Details',

    'home.live': 'Live wins', 'home.games': 'Games', 'home.bonuses': 'Bonuses', 'home.heroTag': 'Hot',
    'home.heroTitle': 'Upgrader', 'home.heroText': 'Bet stars or a gift and grab an NFT worth up to x100',
    'home.online': 'Live', 'feed.empty': 'Players\' wins will appear here',

    'bonus.daily.title': 'Daily bonus', 'bonus.daily.text': 'Come back every day and grab free stars', 'bonus.daily.btn': 'Claim', 'bonus.daily.taken': 'Already claimed — come back tomorrow',
    'bonus.invite.title': 'Invite a friend', 'bonus.invite.text': 'Earn a share of every deposit your friends make', 'bonus.invite.btn': 'Invite',
    'bonus.deposit.title': 'Top up', 'bonus.deposit.text': 'Top up instantly with Telegram Stars', 'bonus.deposit.btn': 'Top up',
    'bonus.tasks.title': 'Tasks', 'bonus.tasks.text': 'Complete tasks and earn stars', 'bonus.tasks.btn': 'Open',

    'promo.title': 'Promo code', 'promo.text': 'Fresh codes are posted in our Telegram channel', 'promo.btn': 'Activate',
    'promo.placeholder': 'Enter code', 'promo.invalid': 'Promo code not found',

    'game.mines': 'Mines', 'game.lottery': 'Giveaways', 'game.cases': 'Cases', 'game.crash': 'Plane',
    'game.upgrade': 'Upgrader', 'game.waterball': 'Water ball', 'game.ball': 'Ball', 'game.hockey': 'Hockey',
    'game.mines.d': 'Open tiles, avoid the bombs', 'game.upgrade.d': 'Upgrade to an NFT',

    'sub.title': 'Grab {n} Stars!', 'sub.text': 'Subscribe to our channel and get stars on your balance',
    'sub.s1': 'Tap the button and subscribe', 'sub.s2': 'Come back to the app', 'sub.s3': 'Stars are on your balance',
    'sub.btn': 'Subscribe & claim', 'sub.checking': 'Checking subscription…', 'sub.notYet': 'Subscription not found',

    'toast.noStars': 'Not enough stars', 'toast.lose': 'No luck this time', 'toast.win': 'You won!',
    'toast.gotStars': '+{n} Stars added', 'toast.pickTarget': 'Pick an upgrade target', 'toast.pickStake': 'Enter a bet',

    'up.title': 'Upgrader', 'up.stake': 'Bet', 'up.win': 'Target', 'up.go': 'Upgrade', 'up.tabStars': 'Stars', 'up.tabGifts': 'Gifts',
    'up.enterBet': 'Bet amount', 'up.giftForBet': 'Gift to bet', 'up.noGifts': "You don't have gifts yet",
    'up.topUpGifts': 'Add a gift', 'up.target': 'Upgrade target', 'up.search': 'Search', 'up.chance': 'chance',
    'up.pickStake': 'Pick a bet', 'up.pickTarget': 'Pick a target', 'up.auto': 'Auto target',

    'gift.title': 'How to add a gift', 'gift.warnTitle': "Don't send gifts from marketplaces",
    'gift.warnText': 'Only gifts sent directly from your account are credited.',
    'gift.s1': 'Open a chat with {acc}', 'gift.s2': 'Send any message', 'gift.s3': 'Send the gift', 'gift.s4': 'It appears in your inventory',

    'pay.title': 'Wallet', 'pay.dep': 'Top up', 'pay.wd': 'Withdraw', 'pay.balance': 'Balance',
    'pay.amount': 'Amount', 'pay.packs': 'Quick pick', 'pay.min': 'Enter an amount', 'pay.payStars': 'Pay {n} ⭐',
    'pay.wdStars': 'Withdraw {n} ⭐', 'pay.via': 'Paid with Telegram Stars', 'pay.wdNote': 'The request goes to an admin; payout as a gift or stars',
    'pay.paid': 'Payment received!', 'pay.wdSent': 'Withdrawal request sent', 'pay.minWd': 'Minimum withdrawal: {n}',

    'set.title': 'Settings', 'set.sounds': 'Sounds', 'set.volume': 'Volume', 'set.lang': 'Language',
    'set.terms': 'Terms of use', 'set.support': 'Support', 'set.server': 'Server',

    'prof.inventory': 'Inventory', 'prof.invite': 'Invite friends — earn % of their deposits',
    'prof.inviteBtn': 'Invite', 'prof.more': 'Referral program', 'prof.history': 'History',
    'prof.historyEmpty': 'No transactions yet', 'prof.shareText': 'Join in — play and win gifts!',
    'prof.balance': 'Balance', 'prof.items': 'Gifts', 'prof.friends': 'Friends', 'prof.settings': 'Settings',

    'tx.fee': 'Bet', 'tx.win': 'Win', 'tx.dep': 'Deposit', 'tx.wd': 'Withdrawal', 'tx.bonus': 'Bonus', 'tx.ref': 'Referral bonus',

    'ref.title': 'Friends', 'ref.systemText': 'Invite friends and earn together',
    'ref.perFriend': '+{n} ⭐ per friend', 'ref.perDeposit': '{n}% of deposits',
    'ref.count': 'Friends', 'ref.earned': 'Earned', 'ref.link': 'Your link', 'ref.copy': 'Copy', 'ref.share': 'Share',
    'ref.level': 'Your level', 'ref.levelN': 'Level {n}', 'ref.percent': '{n}% of deposits',
    'ref.from': 'from {n} ⭐ of friends\' deposits', 'ref.moreLevels': 'All levels',
    'ref.all': 'Invited', 'ref.none': 'Nobody yet — send your link to a friend', 'ref.levels': 'Referral levels',

    'task.title': 'Bonuses', 'task.text': 'Earn stars for being active',
    'task.reward': '+{n}', 'task.inProgress': 'In progress', 'task.done': 'Claimed', 'task.claim': 'Claim', 'task.list': 'Tasks',
    'task.left': '{t} left',

    'lead.season': 'Season {n}', 'lead.active': 'live', 'lead.members': '{n} players', 'lead.until': 'until {d}',
    'lead.d': 'd', 'lead.h': 'h', 'lead.m': 'min', 'lead.s': 'sec', 'lead.how': 'How it works', 'lead.prizes': 'Season prizes',
    'lead.empty': 'Nobody has played this season yet', 'lead.rating': 'Turnover ranking',

    'err.already': 'Already claimed', 'err.notFound': 'Not found', 'err.notReady': 'Not completed yet',
    'err.badAmount': 'Invalid amount', 'err.checkFailed': 'Could not check subscription, try later',
    'err.auth': 'Open the app via the bot', 'err.banned': 'Account banned', 'err.network': 'No connection to server', 'err.timeout': 'Server is slow to respond',

    'player.dm': 'Message', 'player.won': 'won', 'player.noUser': 'This player has no username',

    'mines.title': 'Mines', 'mines.count': 'Mines on board', 'mines.play': 'Play', 'mines.cash': 'Cash out {n}',
    'mines.mult': 'Multiplier', 'mines.next': 'Next', 'mines.win': 'Win',
    'mines.helpTitle': 'How to play Mines', 'mines.h1': 'Enter a bet and choose how many mines to hide',
    'mines.h2': 'Open tiles — every star raises the multiplier', 'mines.h3': 'Cash out any time',
    'mines.h4': 'Hit a mine — the bet is lost', 'mines.boom': 'Boom! That was a mine', 'mines.won': 'You cashed out {n} Stars!',

    'how.title': 'How it works', 'how.sub': 'Place bets, climb the top, grab prizes',
    'how.turnH': 'Turnover', 'how.turn1': 'The sum of all your bets this season in all games',
    'how.prizesH': 'Top-3 prizes', 'how.prizesNote': 'Prizes are given after the season ends.',
    'how.datesH': 'Dates', 'how.dur': 'A season lasts 1 month and ends on {d}. Turnover then resets.',
    'how.warnH': 'Fair play', 'how.warn': 'Multi-accounts, boosting and bug abuse are punished: the place is cancelled and the prize withheld.',
    'how.ok': 'Got it',
    'win.title': 'Congrats!', 'win.btn': 'Claim',
  },
};

let lang = 'ru';
const setLang = (l) => { lang = dict[l] ? l : 'ru'; document.documentElement.lang = lang; };
const getLang = () => lang;
function t(key, vars = {}) {
  let s = dict[lang][key] ?? dict.ru[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

// ======================= иконки (inline SVG) =======================
const svg = (body, vb = '0 0 24 24') => `<svg viewBox="${vb}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
const SW = 'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const icon = {
  star: svg('<path fill="currentColor" d="M12 2.2l2.95 6.2 6.8.82-5.02 4.68 1.3 6.73L12 17.3l-6.03 3.33 1.3-6.73L2.25 9.22l6.8-.82L12 2.2z"/>'),
  games: svg(`<rect x="3" y="3" width="8" height="8" rx="2.5" fill="currentColor"/><rect x="13" y="3" width="8" height="8" rx="2.5" ${SW}/><rect x="3" y="13" width="8" height="8" rx="2.5" ${SW}/><rect x="13" y="13" width="8" height="8" rx="2.5" fill="currentColor"/>`),
  trophy: svg(`<path ${SW} d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v3M8 21h8M9.5 17h5l.5 4h-6z"/>`),
  gift: svg(`<rect x="3.5" y="8" width="17" height="4.5" rx="1.2" ${SW}/><path ${SW} d="M5 12.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7.5M12 8v13M12 8c-1.5-3.5-6-4.5-6-1.8C6 8 9 8 12 8zm0 0c1.5-3.5 6-4.5 6-1.8C18 8 15 8 12 8z"/>`),
  user: svg(`<circle cx="12" cy="8" r="4" ${SW}/><path ${SW} d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>`),
  plus: svg(`<path ${SW} stroke-width="2.6" d="M12 5v14M5 12h14"/>`),
  close: svg(`<path ${SW} stroke-width="2.4" d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>`),
  back: svg(`<path ${SW} stroke-width="2.4" d="M15 5l-7 7 7 7"/>`),
  chevron: svg(`<path ${SW} stroke-width="2.4" d="M9 5l7 7-7 7"/>`),
  arrowUp: svg(`<path ${SW} stroke-width="2.6" d="M12 19V5M5.5 11.5L12 5l6.5 6.5"/>`),
  arrowRight: svg(`<path ${SW} stroke-width="2.4" d="M5 12h14M13 6l6 6-6 6"/>`),
  help: svg(`<circle cx="12" cy="12" r="9.5" ${SW}/><path ${SW} d="M9.3 9.5a2.8 2.8 0 1 1 4 2.5c-.8.4-1.3 1-1.3 1.9v.3"/><circle cx="12" cy="17.3" r="1.2" fill="currentColor"/>`),
  gear: svg(`<circle cx="12" cy="12" r="3" ${SW}/><path ${SW} d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>`),
  search: svg(`<circle cx="11" cy="11" r="6.5" ${SW} stroke-width="2.3"/><path ${SW} stroke-width="2.3" d="M16 16l4.5 4.5"/>`),
  copy: svg(`<rect x="8.5" y="8.5" width="12" height="12" rx="3" ${SW}/><path ${SW} d="M15.5 5.5A2 2 0 0 0 13.5 3.5h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2"/>`),
  share: svg(`<path ${SW} d="M12 15V3.5M7.5 8L12 3.5 16.5 8M5 12.5v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>`),
  clock: svg(`<circle cx="12" cy="12" r="9" ${SW}/><path ${SW} d="M12 7.5V12l3 2"/>`),
  sound: svg(`<path fill="currentColor" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path ${SW} d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11"/>`),
  globe: svg(`<circle cx="12" cy="12" r="9" ${SW}/><path ${SW} d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>`),
  doc: svg(`<path ${SW} d="M6 3h8.5L19 7.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8.5 12h7M8.5 15.5h7M8.5 8.5h3"/>`),
  support: svg(`<path ${SW} d="M4 13v-1a8 8 0 1 1 16 0v1M4 13h3v6H5.5A1.5 1.5 0 0 1 4 17.5zM20 13h-3v6h1.5a1.5 1.5 0 0 0 1.5-1.5z"/>`),
  server: svg(`<rect x="3.5" y="4" width="17" height="7" rx="2" ${SW}/><rect x="3.5" y="13" width="17" height="7" rx="2" ${SW}/><circle cx="7.5" cy="7.5" r="1" fill="currentColor"/><circle cx="7.5" cy="16.5" r="1" fill="currentColor"/>`),
  wallet: svg(`<path ${SW} d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a1 1 0 0 1 1 1v2.5M4 7.5V18a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3M4 7.5A2.5 2.5 0 0 0 6.5 10H20v6h-4a3 3 0 0 1 0-6"/>`),
  down: svg(`<path ${SW} stroke-width="2.4" d="M12 4v14M6 12.5l6 6 6-6"/>`),
  up: svg(`<path ${SW} stroke-width="2.4" d="M12 20V6M6 11.5l6-6 6 6"/>`),
  people: svg(`<circle cx="9" cy="8.5" r="3.3" ${SW}/><path ${SW} d="M3 19.5c.5-3.2 2.9-5.2 6-5.2s5.5 2 6 5.2M15.5 5.6a3 3 0 0 1 0 5.8M17.8 14.2c1.8.7 3 2.4 3.2 4.6"/>`),
  calendar: svg(`<rect x="3.5" y="5" width="17" height="15.5" rx="3" ${SW}/><path ${SW} d="M3.5 10h17M8 3v4M16 3v4"/>`),
  check: svg(`<path ${SW} stroke-width="2.8" d="M4.5 12.5l4.5 4.5L19.5 7"/>`),
  lock: svg(`<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor"/><path ${SW} stroke-width="2.4" d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>`),
  bolt: svg('<path fill="currentColor" d="M13.5 2L4.5 13.5H11L9.5 22l9-11.5H12z"/>'),
  play: svg('<path fill="currentColor" d="M8 5.5v13c0 .8.9 1.3 1.6.8l9.6-6.5a1 1 0 0 0 0-1.6L9.6 4.7C8.9 4.2 8 4.7 8 5.5z"/>'),
  bomb: svg('<circle cx="11" cy="14" r="7.2" fill="currentColor"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M15.6 9.4l2.2-2.2"/><path stroke="#ffc94a" stroke-width="1.8" stroke-linecap="round" d="M18.6 4.2l.6-1.4M20.6 6.2l1.4-.6M19.9 4.9l1-1"/><circle cx="8.6" cy="11.6" r="1.6" fill="#fff" opacity=".55"/>'),
  ticket: svg(`<path ${SW} d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z"/><path stroke="currentColor" stroke-width="2" stroke-dasharray="2 2.5" d="M14.5 6.5v11"/>`),
  wifiOff: svg(`<path ${SW} d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 4.2-2.4M19 12.5a10 10 0 0 0-3-2M2 8.8A15 15 0 0 1 7 6M22 8.8a15 15 0 0 0-10-3.8"/><circle cx="12" cy="20" r="1.2" fill="currentColor"/>`),
  fire: svg('<path fill="currentColor" d="M12 2.5c.5 3-1.3 4.6-2.8 6.2C7.6 10.4 6 12.2 6 15a6 6 0 0 0 12 0c0-2.6-1.3-4.3-2.3-5.4-.2 1.6-.9 2.6-1.9 3.1.4-3.8-.7-7.6-1.8-10.2z"/>'),
};
const star = (cls = '') => `<span class="star ${cls}">${icon.star}</span>`;

// ======================= картинки =======================
// Какие картинки подарков реально лежат на сайте (img/gifts/<id>.webp)
const GIFT_FILES = new Set(['pepe', 'gift-004', 'gift-020', 'gift-023', 'gift-065', 'gift-074', 'gift-090', 'gift-126', 'gift-127', 'gift-128', 'gift-129']);
// Заглушка для подарка без картинки: коробка своего цвета (цвет зависит от id)
function giftPlaceholder(id = '') {
  let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 360;
  const a = `hsl(${h},90%,62%)`, b = `hsl(${(h + 40) % 360},90%,45%)`;
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect x="11" y="27" width="42" height="28" rx="6" fill="url(#g)"/><rect x="8" y="19" width="48" height="11" rx="4" fill="${a}"/><rect x="29" y="19" width="6" height="36" fill="#fff" opacity=".85"/><path d="M32 19c-4-9-14-10-14-4 0 4 7 4 14 4zm0 0c4-9 14-10 14-4 0 4-7 4-14 4z" fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round" opacity=".9"/></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(s);
}
const giftSrc = (g) => {
  if (!g) return giftPlaceholder('?');
  if (GIFT_FILES.has(g.id)) return `img/gifts/${g.id}.webp`;
  if (typeof g === 'string') { const m = g.match(/([\w-]+)\.(png|webp)$/); return m && GIFT_FILES.has(m[1]) ? `img/gifts/${m[1]}.webp` : giftPlaceholder(g); }
  return giftPlaceholder(g.id);
};
// Редкость по цене — цвет свечения карточки
function rarity(price = 0) {
  if (price >= 3000) return 'gold';
  if (price >= 1200) return 'violet';
  if (price >= 600) return 'pink';
  if (price >= 250) return 'blue';
  return 'gray';
}

// ======================= связь с API =======================
const tg = window.Telegram?.WebApp;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

class ApiError extends Error {
  constructor(code, status = 0) { super(code); this.code = code; this.status = status; }
  get isNetwork() { return this.code === 'network' || this.code === 'timeout' || this.status >= 500 || this.status === 0 && this.code.startsWith('http_'); }
}

const GIFTS = [
  ['pepe', 'Plush Pepe', 4999], ['gift-126', 'NFT #126', 3500], ['gift-128', 'NFT #128', 2400], ['gift-127', 'NFT #127', 1800],
  ['gift-129', 'NFT #129', 1500], ['gift-004', 'NFT #004', 1200], ['gift-074', 'NFT #074', 999], ['gift-090', 'NFT #090', 850],
  ['gift-020', 'NFT #020', 700], ['gift-065', 'NFT #065', 560], ['gift-023', 'NFT #023', 450], ['gift-047', 'NFT #047', 350],
  ['gift-132', 'NFT #132', 280], ['gift-103', 'NFT #103', 200], ['gift-120', 'NFT #120', 150],
];
const DEMO_CATALOG = GIFTS.map(([id, name, price]) => ({ id, name, price, img: `img/gifts/${id}.webp` }));

function letterAvatar(name = '?', id = 0) {
  const colors = [['#3d6bff', '#1b2fd6'], ['#ff3d7f', '#c3195a'], ['#a855f7', '#6d28d9'], ['#22c55e', '#15803d'], ['#ff9f1a', '#d9480f']];
  const [a, b] = colors[Math.abs(id) % colors.length];
  const ch = (String(name).trim()[0] || '?').toUpperCase().replace(/[<&"'\\]/g, '');
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="64" height="64" fill="url(#a)"/><text x="32" y="42" font-family="Arial" font-size="28" font-weight="700" fill="#fff" text-anchor="middle">${ch}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(s)}`;
}
window.__letterAvatar = letterAvatar;

const DEMO_PLAYERS = ['durov', 'pepe_hunter', 'void_king', 'starboy', 'nft_lady', 'lucky7', 'gift_master', 'moonwalker', 'tonfan', 'rich_kid']
  .map((u, i) => ({ id: 1000 + i, username: u, name: u.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }));

const state = {
  user: { id: 0, name: 'Игрок', username: '', photo: '', avatar: '' },
  balance: { stars: 0 },
  rates: { tonToStars: 120, usdToStars: 50 },
  subscribed: false, wallet: null, inventory: [], transactions: [],
  referrals: { count: 0, earned: 0, list: [], level: 1, perFriend: 10, percent: 5, refDeposits: 0 },
  tasks: [], packs: [{ stars: 100, bonus: 0 }, { stars: 500, bonus: 0 }, { stars: 1000, bonus: 0 }],
  levels: null, mines: null, config: {},
};

function applyState(st) {
  Object.assign(state, {
    user: st.user, balance: st.balance, subscribed: st.subscribed, wallet: st.wallet,
    inventory: st.inventory || [], transactions: st.transactions || [], referrals: st.referrals || state.referrals, tasks: st.tasks || [],
    packs: st.packs?.length ? st.packs : state.packs, levels: st.levels, rates: st.rates || state.rates, config: st.config || {},
    mines: st.mines || null,
  });
  if (st.catalog?.length) api.catalog = st.catalog;
  if (st.config?.appName) CONFIG.APP_NAME = st.config.appName;
}

// Один запрос к API. idempotent=true — можно безопасно повторить при сбое сети
async function request(path, body, { method = body === undefined ? 'GET' : 'POST', timeout = 12000, retries = 0 } = {}) {
  let last;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt) await wait(Math.min(4000, 600 * 2 ** (attempt - 1)));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (tg?.initData) headers['X-Init-Data'] = tg.initData;
      else if (CONFIG.DEV_USER) headers['X-Dev-User'] = CONFIG.DEV_USER;
      const res = await fetch(CONFIG.API_BASE + path, {
        method, headers, body: method === 'POST' ? JSON.stringify(body || {}) : undefined, signal: ctrl.signal, cache: 'no-store',
      });
      let data = {};
      try { data = await res.json(); } catch (e) { /* не JSON */ }
      if (!res.ok || data.ok === false) {
        const err = new ApiError(data.error || `http_${res.status}`, res.status);
        if (res.status >= 500 || res.status === 404 && !data.error) { last = err; continue; }
        throw err;
      }
      conn.set('online');
      return data;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      last = new ApiError(e.name === 'AbortError' ? 'timeout' : 'network');
    } finally { clearTimeout(timer); }
  }
  if (last?.isNetwork) conn.set('offline');
  throw last;
}

// Состояние соединения: online | offline | demo. Пока offline — пингуем /api/health
const conn = {
  status: 'online', listeners: [], timer: null,
  set(s) {
    if (this.status === s) return;
    const prev = this.status; this.status = s;
    this.listeners.forEach((fn) => fn(s, prev));
    if (s === 'offline') this.watch();
  },
  on(fn) { this.listeners.push(fn); },
  watch() {
    clearTimeout(this.timer);
    this.timer = setTimeout(async () => {
      if (this.status !== 'offline') return;
      try { await request('/api/health', undefined, { timeout: 6000 }); await api.refresh(); } catch (e) { this.watch(); }
    }, 4000);
  },
};

function demoTx(type, amount, extra = {}) {
  state.transactions.unshift({ type, amount, currency: 'STARS', date: Date.now(), ...extra });
}

const api = {
  state,
  live: false,
  catalog: DEMO_CATALOG,
  lastError: null,

  // В Telegram (или с ?dev=) — настоящий сервер; в обычном браузере — демо
  canGoLive: () => !!(tg?.initData || CONFIG.DEV_USER),

  async init() {
    if (this.canGoLive()) {
      applyState(await request('/api/auth', {}, { retries: 2 }));
      this.live = true;
      return true;
    }
    conn.status = 'demo';
    const u = tg?.initDataUnsafe?.user;
    state.user = u ? { id: u.id, name: [u.first_name, u.last_name].filter(Boolean).join(' '), username: u.username || '', photo: u.photo_url || '' }
      : { id: 7, name: 'Гость', username: 'guest', photo: '' };
    state.balance.stars = 250;
    try { state.subscribed = localStorage.getItem('vp_subscribed') === '1'; } catch (e) { /* ignore */ }
    state.inventory = [DEMO_CATALOG[9], DEMO_CATALOG[10], DEMO_CATALOG[7]].map((g, i) => ({ ...g, uid: 'd' + i }));
    state.transactions = [
      { type: 'fee', game: 'Апгрейдер', item: 'nft', amount: 390, nft: DEMO_CATALOG[10].img, date: Date.now() - 3600e3 },
      { type: 'win', game: 'Апгрейдер', item: 'nft', amount: 560, nft: DEMO_CATALOG[9].img, date: Date.now() - 7200e3 },
      { type: 'dep', currency: 'STARS', amount: 500, date: Date.now() - 86400e3 },
    ];
    state.referrals = { ...state.referrals, list: DEMO_PLAYERS.slice(0, 2).map((p, i) => ({ ...p, earned: [25, 10][i] })), count: 2, earned: 35 };
    state.tasks = [
      { id: 'bets5', title: 'Сделай 5 ставок', text: 'Сыграй 5 раз в любой игре', reward: 10, progress: 2, goal: 5, endsIn: 864e5 * 5 },
      { id: 'sub', title: 'Подписка', text: 'Подпишись на канал', reward: 5, progress: 1, goal: 1, endsIn: 864e5 * 5 },
      { id: 'dep1', title: 'Первое пополнение', text: 'Пополни баланс на любую сумму', reward: 20, progress: 1, goal: 1, claimed: true, endsIn: 864e5 * 5 },
      { id: 'ref3', title: 'Пригласи друзей', text: 'Пригласи 3 друзей по своей ссылке', reward: 50, progress: 2, goal: 3, endsIn: 864e5 * 5 },
    ];
    return false;
  },

  async refresh() {
    if (!this.live) return;
    applyState(await request('/api/auth', {}, { retries: 1 }));
    document.dispatchEvent(new Event('balance'));
    document.dispatchEvent(new Event('state'));
  },

  cfg(key, fallback) { return state.config?.[key] ?? fallback; },

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
    await wait(1000);
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
    const x = state.tasks.find((k) => k.id === id);
    if (!x || x.claimed || x.progress < x.goal) throw new ApiError('not_ready');
    x.claimed = true; state.balance.stars += x.reward; demoTx('bonus', x.reward); return x.reward;
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

  // ---------- мины ----------
  minesMult(mines, opened) {
    if (opened <= 0) return 1;
    let m = 1;
    for (let i = 0; i < opened; i++) m *= (25 - i) / (25 - mines - i);
    return Math.round(m * (1 - this.cfg('minesEdge', 0.03)) * 100) / 100;
  },
  _minesView(g) {
    const k = g.opened.length;
    return { stake: g.stake, mines: g.mines, opened: [...g.opened], mult: this.minesMult(g.mines, k), next: k < 25 - g.mines ? this.minesMult(g.mines, k + 1) : null };
  },
  async minesStart(stake, mines) {
    if (this.live) { const r = await request('/api/mines/start', { stake, mines }); state.balance.stars = r.balance; state.mines = r.game; return r.game; }
    if (stake < 1) throw new ApiError('bad_amount');
    if (stake > state.balance.stars) throw new ApiError('no_stars');
    const cells = [...Array(25).keys()];
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    this._demoMines = { stake, mines, board: cells.slice(0, mines), opened: [] };
    state.balance.stars -= stake; demoTx('fee', stake, { game: 'Мины', item: 'stars' });
    state.mines = this._minesView(this._demoMines);
    return state.mines;
  },
  _demoFinish(g) {
    const mult = this.minesMult(g.mines, g.opened.length), win = Math.floor(g.stake * mult);
    state.balance.stars += win; demoTx('win', win, { game: 'Мины', item: 'stars' });
    this._demoMines = null; state.mines = null;
    return { win, mult, board: g.board, game: null };
  },
  async minesOpen(cell) {
    if (this.live) { const r = await request('/api/mines/open', { cell }); state.balance.stars = r.balance; state.mines = r.game; return r; }
    const g = this._demoMines; if (!g) throw new ApiError('not_found');
    await wait(90);
    if (g.board.includes(cell)) { this._demoMines = null; state.mines = null; return { boom: true, cell, board: g.board, game: null }; }
    if (!g.opened.includes(cell)) g.opened.push(cell);
    if (g.opened.length >= 25 - g.mines) return { boom: false, cell, ...this._demoFinish(g) };
    state.mines = this._minesView(g);
    return { boom: false, cell, game: state.mines };
  },
  async minesCashout() {
    if (this.live) { const r = await request('/api/mines/cashout', {}); state.balance.stars = r.balance; state.mines = null; return r; }
    const g = this._demoMines; if (!g) throw new ApiError('not_found');
    if (!g.opened.length) throw new ApiError('not_ready');
    return this._demoFinish(g);
  },

  // ---------- пополнение Stars (1 ⭐ = 1 Telegram Star) ----------
  async deposit(stars) {
    if (this.live) {
      const r = await request('/api/invoice', { stars });
      if (r.credited !== undefined) { state.balance.stars = r.balance; return { ok: true, status: 'paid', credited: r.credited }; }
      const status = await new Promise((resolve) => {
        if (tg?.openInvoice) tg.openInvoice(r.link, resolve); else { window.open(r.link, '_blank'); resolve('pending'); }
      });
      if (status !== 'paid') return { ok: false, status };
      // ждём, пока бот получит successful_payment и зачислит
      const before = state.balance.stars;
      for (let i = 0; i < 10 && state.balance.stars === before; i++) { await wait(1000); await this.refresh().catch(() => {}); }
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
    if (this.live) return (await request('/api/feed', undefined, { retries: 1 })).items;
    return Array.from({ length: 12 }, () => this.demoWin());
  },
  demoWin() {
    const g = this.catalog[Math.floor(Math.random() * this.catalog.length)];
    const p = DEMO_PLAYERS[Math.floor(Math.random() * DEMO_PLAYERS.length)];
    if (Math.random() < 0.25) return { id: Math.random().toString(36).slice(2), price: 50 + Math.floor(Math.random() * 400), game: 'Мины', gift: null, user: p, date: Date.now() };
    return { id: Math.random().toString(36).slice(2), price: g.price, gift: g, game: 'Апгрейдер', user: p, date: Date.now() };
  },
  async leaders() {
    if (this.live) return request('/api/leaders', undefined, { retries: 1 });
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    return {
      season: now.getMonth() + 1, end, players: 248,
      top: DEMO_PLAYERS.map((p, i) => ({ ...p, value: 12000 - i * 1150, nft: this.catalog[i % this.catalog.length] })),
    };
  },
};

// ======================= UI-хелперы =======================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/\s/g, ' ');

// Картинка подарка с запасным вариантом
const giftImg = (g, cls = '') => {
  const ph = giftPlaceholder(g?.id || g);
  return `<img class="${cls}" src="${esc(giftSrc(g))}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${ph}'" />`;
};
const deco = (name, cls = '', style = '') => `<img class="${cls}" src="img/deco/${name}.webp" alt="" loading="lazy" decoding="async" style="${style}" onerror="this.remove()" />`;

const prefs = (() => {
  let p = { sound: true, volume: 70, lang: '' };
  try { p = { ...p, ...JSON.parse(localStorage.getItem('vp_prefs') || '{}') }; } catch (e) { /* ignore */ }
  return {
    get: (k) => p[k],
    set: (k, v) => { p[k] = v; try { localStorage.setItem('vp_prefs', JSON.stringify(p)); } catch (e) { /* ignore */ } },
  };
})();

// ---------- звук (синтез, без файлов) ----------
let actx;
function sound(type = 'tap') {
  if (!prefs.get('sound')) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const vol = (prefs.get('volume') / 100) * 0.14;
    const o = actx.createOscillator(); const g = actx.createGain();
    const now = actx.currentTime;
    const map = { tap: [560, 0.05], win: [660, 0.35], lose: [200, 0.3], tick: [1300, 0.018], open: [900, 0.08] };
    const [f, d] = map[type] || map.tap;
    o.type = type === 'lose' ? 'triangle' : 'sine';
    o.frequency.setValueAtTime(f, now);
    if (type === 'win') o.frequency.exponentialRampToValueAtTime(f * 2, now + d);
    if (type === 'open') o.frequency.exponentialRampToValueAtTime(f * 1.4, now + d);
    if (type === 'lose') o.frequency.exponentialRampToValueAtTime(f * 0.45, now + d);
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + d);
    o.connect(g).connect(actx.destination); o.start(now); o.stop(now + d);
  } catch (e) { /* ignore */ }
}
function haptic(kind = 'light') {
  const h = tg?.HapticFeedback; if (!h) return;
  try {
    if (kind === 'success' || kind === 'error' || kind === 'warning') h.notificationOccurred(kind);
    else if (kind === 'select') h.selectionChanged();
    else h.impactOccurred(kind);
  } catch (e) { /* ignore */ }
}
function openLink(url) {
  if (!url) return;
  if (/^https:\/\/t\.me\//.test(url) && tg?.openTelegramLink) tg.openTelegramLink(url);
  else if (tg?.openLink) tg.openLink(url);
  else window.open(url, '_blank');
}

// ---------- тосты ----------
function toast(text, kind = 'info') {
  const wrap = $('#toasts');
  const el = document.createElement('div');
  el.className = `toast toast--${kind}`;
  const ic = { success: icon.check, win: icon.star, error: icon.close, lose: icon.close, info: icon.bolt }[kind] || icon.bolt;
  el.innerHTML = `<span class="toast__ico">${ic}</span><span class="toast__text">${esc(text)}</span>`;
  wrap.prepend(el);
  while (wrap.children.length > 3) wrap.lastElementChild.remove();
  requestAnimationFrame(() => el.classList.add('is-in'));
  if (kind === 'win' || kind === 'success') haptic('success');
  if (kind === 'lose' || kind === 'error') haptic('error');
  setTimeout(() => { el.classList.remove('is-in'); el.classList.add('is-out'); setTimeout(() => el.remove(), 400); }, CONFIG.TOAST_MS);
}
function errToast(e) {
  const map = {
    no_stars: 'toast.noStars', already: 'err.already', not_found: 'err.notFound', not_ready: 'err.notReady',
    bad_amount: 'err.badAmount', not_subscribed: 'sub.notYet', check_failed: 'err.checkFailed', auth: 'err.auth', banned: 'err.banned',
    network: 'err.network', timeout: 'err.timeout',
  };
  toast(t(map[e?.code] || 'common.error'), 'error');
}
const soonToast = () => toast(t('common.soonToast'));

// ---------- шторки и модалки ----------
const stack = [];
function syncOverlay() {
  const ov = $('#overlay');
  ov.classList.toggle('is-on', stack.length > 0);
  document.body.classList.toggle('is-locked', stack.length > 0);
  // кнопка «Назад» Telegram: открыта шторка или вложенный экран (апгрейдер, мины, друзья)
  const sub = typeof current === 'function' && ['upgrader', 'mines', 'referrals'].includes(current());
  if (tg?.BackButton) { try { stack.length || sub ? tg.BackButton.show() : tg.BackButton.hide(); } catch (e) { /* ignore */ } }
}
function closeTop() { const top = stack[stack.length - 1]; if (top && top.closable()) { top.close(); return true; } return false; }

function sheet(html, { onClose, cls = '', title = '' } = {}) {
  const el = document.createElement('div');
  el.className = `sheet ${cls}`;
  el.innerHTML = `<div class="sheet__grab"></div>${title ? `<div class="sheet__head"><h3>${title}</h3><button class="icon-btn sheet__x" aria-label="close">${icon.close}</button></div>` : ''}<div class="sheet__body">${html}</div>`;
  document.body.appendChild(el);
  const entry = {
    el, closable: () => true,
    close() {
      const i = stack.indexOf(entry); if (i < 0) return; stack.splice(i, 1);
      el.classList.remove('is-open'); setTimeout(() => el.remove(), 320);
      syncOverlay(); onClose && onClose();
    },
    set(htmlNew) { el.querySelector('.sheet__body').innerHTML = htmlNew; },
  };
  stack.push(entry); syncOverlay();
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
  el.querySelector('.sheet__x')?.addEventListener('click', () => { sound(); entry.close(); });
  // свайп вниз
  let y0 = null, dy = 0;
  el.addEventListener('touchstart', (e) => { if (el.scrollTop <= 0 && !e.target.closest('input,.hscroll')) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
  el.addEventListener('touchmove', (e) => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); if (dy > 4) el.style.transform = `translateY(${dy}px)`; }, { passive: true });
  el.addEventListener('touchend', () => { if (y0 === null) return; el.style.transform = ''; if (dy > 100) entry.close(); y0 = null; });
  return entry;
}

function modal(html, { closeDelay = 0, onClose, cls = '' } = {}) {
  const el = document.createElement('div');
  el.className = `modal ${cls}`;
  const R = 15, C = 2 * Math.PI * R;
  el.innerHTML = `<div class="modal__card">
      <button class="modal__close ${closeDelay ? 'is-locked' : ''}" aria-label="close">
        <svg class="modal__ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="${R}" style="stroke-dasharray:${C};stroke-dashoffset:${closeDelay ? C : 0};transition-duration:${closeDelay}ms"/></svg>${icon.close}
      </button>${html}</div>`;
  document.body.appendChild(el);
  let unlocked = !closeDelay;
  const entry = {
    el, closable: () => unlocked,
    close() {
      const i = stack.indexOf(entry); if (i < 0) return; stack.splice(i, 1);
      el.classList.remove('is-open'); setTimeout(() => el.remove(), 320);
      syncOverlay(); onClose && onClose();
    },
  };
  stack.push(entry); syncOverlay();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.classList.add('is-open');
    if (closeDelay) {
      el.querySelector('.modal__ring circle').style.strokeDashoffset = 0;
      setTimeout(() => { unlocked = true; el.querySelector('.modal__close').classList.remove('is-locked'); }, closeDelay);
    }
  }));
  el.querySelector('.modal__close').addEventListener('click', () => { if (unlocked) { sound(); entry.close(); } });
  el.addEventListener('click', (e) => { if (e.target === el && unlocked) entry.close(); });
  return entry;
}
function closeAll() { while (stack.length) stack[stack.length - 1].close(); }

// ---------- игроки ----------
const tgAttr = (u) => (u?.username ? `data-tg="${esc(u.username)}"` : '');
function avatarHtml(u, cls = '') {
  const fb = letterAvatar(u?.name || u?.username || '?', Number(u?.id) || 0);
  return `<img class="ava ${cls}" src="${esc(api.avatarUrl(u))}" alt="" loading="lazy" ${tgAttr(u)} onerror="this.onerror=null;this.src='${fb}'" />`;
}
function openUser(username) {
  if (!username) return;
  sound(); haptic();
  openLink(`https://t.me/${String(username).replace(/^@/, '')}`);
}
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-tg]');
  if (el) { e.stopPropagation(); openUser(el.dataset.tg); }
}, true);

// Поле суммы растёт вместе с числом (звезда стоит рядом с цифрами)
function fitAmount(inp) { if (inp) inp.style.width = `${Math.max(1, (inp.value || inp.placeholder || '0').length) + 0.6}ch`; }
document.addEventListener('input', (e) => { if (e.target.matches?.('.amount__in input')) fitAmount(e.target); }, true);
const fitAmounts = (root = document) => root.querySelectorAll('.amount__in input').forEach(fitAmount);

// ======================= эффекты =======================
const reduce = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function confetti({ x = 0.5, y = 0.45, count = 140, colors = ['#3d6bff', '#7aa2ff', '#ffc94a', '#ff3d7f', '#ffffff', '#a855f7'] } = {}) {
  if (reduce()) return;
  const c = document.createElement('canvas');
  c.className = 'fx-confetti';
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  const ox = innerWidth * x, oy = innerHeight * y;
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2, v = 5 + Math.random() * 9;
    return { x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, w: 5 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
      c: colors[Math.floor(Math.random() * colors.length)], star: Math.random() < 0.3, life: 0 };
  });
  let raf;
  const drawStar = (s) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? s / 2.4 : s; const a = (i * Math.PI) / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
  const frame = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    for (const p of parts) {
      p.life++; p.vy += 0.32; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      if (p.y > innerHeight + 30) continue;
      alive++;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - p.life / 160); ctx.fillStyle = p.c;
      if (p.star) drawStar(p.w); else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life / 6)));
      ctx.restore();
    }
    if (alive && parts[0].life < 170) raf = requestAnimationFrame(frame); else c.remove();
  };
  raf = requestAnimationFrame(frame);
  setTimeout(() => { cancelAnimationFrame(raf); c.remove(); }, 4000);
}

function countUp(el, to, ms = 700) {
  if (!el) return;
  const from = Number(el.dataset.v ?? String(el.textContent).replace(/\D/g, '')) || 0;
  el.dataset.v = to;
  if (from === to || reduce()) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  const host = el.closest('.bal') || el;
  host.classList.remove('is-up', 'is-down'); void host.offsetWidth; host.classList.add(to > from ? 'is-up' : 'is-down');
}

function winReveal(gift, { onClose } = {}) {
  const el = document.createElement('div');
  el.className = `reveal rar-${rarity(gift.price)}`;
  el.innerHTML = `
    <div class="reveal__rays"></div>
    <div class="reveal__card">
      <div class="reveal__label">${t('win.title')}</div>
      <div class="reveal__stage"><span class="reveal__glow"></span>${giftImg(gift, 'reveal__img')}</div>
      <div class="reveal__name">${esc(gift.name)}</div>
      <div class="reveal__price">${star()}${fmt(gift.price)}</div>
      <button class="btn btn--primary btn--lg reveal__btn">${t('win.btn')}</button>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
  haptic('success'); sound('win');
  setTimeout(() => confetti({ y: 0.4 }), 250);
  const close = () => { el.classList.remove('is-open'); setTimeout(() => el.remove(), 350); onClose && onClose(); };
  el.querySelector('.reveal__btn').addEventListener('click', () => { sound(); close(); });
  el.addEventListener('click', (e) => { if (e.target === el) close(); });
}
