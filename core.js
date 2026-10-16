'use strict';
// Void Play — ядро: настройки, тексты, иконки, данные (API), общие UI-хелперы, эффекты

// ======================= config.js =======================
// Настройки фронтенда
const CONFIG = {
  // Адрес бэкенда (бот + API). Пустая строка — тот же домен, откуда открыт сайт.
  // Если фронт лежит на GitHub Pages, а бот на bothost — оставь полный адрес.
  API_BASE: window.VOIDPLAY_API ?? (location.hostname.endsWith('bothost.tech') ? '' : 'https://voidplay.bothost.tech'),

  // Запасные значения — реальные приходят с сервера (/api/auth → config)
  CHANNEL_URL: 'https://t.me/voidplay',
  SUBSCRIBE_REWARD: 15,
  SUPPORT_URL: 'https://t.me/voidplay_support',
  GIFTS_ACCOUNT: '@voidplay',
  BOT_USERNAME: 'voidplay_bot',
  TERMS_URL: 'https://telegra.ph/',

  // Интервалы (мс)
  BONUS_INTERVAL: 30000,
  TOAST_MS: 3000,
  MODAL_CLOSE_DELAY: 3000,
  FEED_POLL: 5000,
};

// ======================= i18n.js =======================
// Локализация RU / EN. Ключи используются через t('key', {vars})
const dict = {
  ru: {
    'loader.welcome': 'Welcome 2 Void Play',
    'nav.home': 'Главная', 'nav.leaders': 'Лидеры', 'nav.profile': 'Профиль',
    'common.connect': 'Connect', 'common.soon': 'Скоро...', 'common.soonToast': 'Скоро будет доступно',
    'common.showMore': 'Показать ещё ({n})', 'common.showAll': 'Показать все', 'common.empty': 'Пусто',
    'common.copied': 'Скопировано!', 'common.error': 'Ошибка!',

    // Баннеры ежедневных бонусов
    'bonus.daily.title': 'ЕЖЕДНЕВНЫЙ БОНУС', 'bonus.daily.text': 'Заходи в игру каждый день и забирай бесплатный бонус', 'bonus.daily.btn': 'Забрать', 'bonus.daily.taken': 'Бонус уже получен — приходи завтра',
    'bonus.invite.title': 'ПРИГЛАШЕНИЕ ДРУГА', 'bonus.invite.text': 'Пригласи друга по своей ссылке. Ты получаешь награду за игру друга', 'bonus.invite.btn': 'Получить',
    'bonus.wallet.title': 'ПРИВЯЖИ КОШЕЛЁК', 'bonus.wallet.text': 'Подключи свой TON-кошелёк к аккаунту и получи бонус для ставок', 'bonus.wallet.btn': 'Привязать',
    'bonus.deposit.title': 'ПЕРВЫЙ ДЕПОЗИТ', 'bonus.deposit.text': 'Внеси первые Stars или TON на счёт и казино удвоит сумму (до 1000 Stars)', 'bonus.deposit.btn': 'Пополнить',
    'bonus.spins.title': 'СЕРИЯ СПИНОВ', 'bonus.spins.text': 'Сделай 5 ставок в любой игре и получи бонус за активность', 'bonus.spins.btn': 'Получить',
    'bonus.firstwin.title': 'ПЕРВАЯ ПОБЕДА', 'bonus.firstwin.text': 'Выиграй свой первый раунд в дуэли — VOID PLAY поощряет победителей', 'bonus.firstwin.btn': 'Забрать',
    'bonus.friendpay.title': 'ДРУГ ПОПОЛНИЛ', 'bonus.friendpay.text': 'Твой приглашённый друг внёс депозит, ты получаешь процент', 'bonus.friendpay.btn': 'Забрать',
    'bonus.week.title': 'ИГРОК НЕДЕЛИ', 'bonus.week.text': 'Сыграй 20 раундов за неделю (любые игры) — получи эксклюзивный бонус в конце недели', 'bonus.week.btn': 'Получить',

    'promo.title': 'АКТИВИРУЙ ПРОМОКОД', 'promo.text': 'Получайте промокоды в нашем Telegram канале.', 'promo.btn': 'Активировать',
    'promo.sheetTitle': 'Промокод', 'promo.placeholder': 'Введите промокод', 'promo.invalid': 'Промокод не найден',

    'game.mines': 'Мины', 'game.lottery': 'Розыгрыши', 'game.cases': 'Кейсы', 'game.crash': 'Самолётик',
    'game.upgrade': 'Апгрейдер', 'game.waterball': 'Шарик с водой', 'game.ball': 'Шарик', 'game.hockey': 'Хоккей',

    // Подписка
    'sub.title': 'Забирай {n} Stars!',
    'sub.s1': 'Нажмите кнопку ниже и подпишись на наш Telegram-канал',
    'sub.s2': 'Немного подожди и снова зайди в приложение VoidPlay',
    'sub.s3': 'Вуаля! Твои заслуженные звезды уже на балансе',
    'sub.btn': 'Забрать', 'sub.checking': 'Проверяем подписку…', 'sub.notYet': 'Подписка не найдена',

    // Тосты
    'toast.noStars': 'Недостаточно stars!', 'toast.lose': 'Вы проиграли!', 'toast.win': 'Вы выиграли!',
    'toast.gotStars': 'Получено {n} Stars!', 'toast.gotSpins': 'Получено {n} фри-спина в кейсах',
    'toast.pickTarget': 'Выберите цель апгрейда', 'toast.pickStake': 'Введите ставку',

    // Апгрейдер
    'up.stake': 'Ставка', 'up.win': 'Выигрыш', 'up.go': 'ПРОКАЧАТЬ', 'up.tabStars': 'Звёзды', 'up.tabGifts': 'Подарки',
    'up.enterBet': 'Введите сумму ставки', 'up.giftForBet': 'Подарок для ставки', 'up.noGifts': 'У вас нет подарков...',
    'up.topUpGifts': 'Пополнить подарки', 'up.target': 'Цель апгрейда', 'up.search': 'Поиск подарка',
    'up.pickStake': 'Выберите ставку', 'up.pickTarget': 'Выберите цель',

    'gift.title': 'Добавить подарок', 'gift.warnTitle': 'Не отправляйте подарки с маркетплейсов',
    'gift.warnText': 'Зачисляются только подарки, отправленные напрямую с вашего аккаунта.',
    'gift.s1': 'Откройте чат с {acc}', 'gift.s2': 'Напишите любое сообщение', 'gift.s3': 'Отправьте подарок', 'gift.s4': 'Проверьте ваш инвентарь',

    // Пополнение / вывод
    'pay.depTitle': 'Пополнение баланса', 'pay.wdTitle': 'Вывод баланса', 'pay.dep': 'Пополнение', 'pay.wd': 'Вывод',
    'pay.balance': 'БАЛАНС', 'pay.depAmount': 'Введите сумму пополнения', 'pay.wdAmount': 'Введите сумму вывода',
    'pay.sum': 'Сумма', 'pay.packs': 'Выгодные пакеты', 'pay.min': 'Введите сумму',

    // Настройки
    'set.title': 'Настройки', 'set.sounds': 'Звуки', 'set.volume': 'Громкость', 'set.lang': 'Язык',
    'set.terms': 'Пользовательское соглашение', 'set.support': 'Служба поддержки',

    // Профиль
    'prof.status': 'Nobody', 'prof.statusHint': 'Статус растёт вместе с оборотом ставок',
    'prof.wallet': 'Кошелёк', 'prof.connect': 'Подключить', 'prof.connected': 'Подключён',
    'prof.inventory': 'Ваш инвентарь', 'prof.invite': 'Приглашай друзей и получай STARS с каждой комиссии, что они приносят',
    'prof.inviteBtn': 'Пригласить друзей', 'prof.more': 'Подробнее', 'prof.history': 'История транзакций',
    'prof.historyEmpty': 'Транзакций пока нет', 'prof.earn': 'Получай звёзды', 'prof.earnBtn': 'За выполнения заданий',
    'prof.shareText': 'Залетай в Void Play — играй и забирай подарки!',

    'tx.fee': 'Оплата участия', 'tx.win': 'Выигрыш', 'tx.dep': 'Пополнение', 'tx.wd': 'Вывод',

    // Рефералы
    'ref.system': 'Реферальная система', 'ref.systemText': 'Приглашайте друзей для бонусов!',
    'ref.perFriend': '{n} Stars за каждого', 'ref.perDeposit': '{n}% с депозитов',
    'ref.count': 'Рефералов', 'ref.earned': 'Заработано', 'ref.link': 'Реферальная ссылка', 'ref.linkText': 'Скопируйте и пришлите друзьям!',
    'ref.level': 'Ваш текущий уровень', 'ref.levelN': 'Уровень {n}', 'ref.percent': '{n}% от чистого дохода',
    'ref.from': 'От {n} Stars депозитов рефералов', 'ref.moreLevels': 'Больше об уровнях реф. системы',
    'ref.all': 'Все рефералы', 'ref.total': '{n} всего', 'ref.none': 'Рефералов пока нет', 'ref.levels': 'Реферальные уровни',

    // Задания
    'task.title': 'Задания', 'task.text': 'Выполняйте задания и получайте в награду - звёзды!',
    'task.reward': 'Награда {n}', 'task.progress': 'Ваш прогресс: {a}/{b}', 'task.inProgress': 'В процессе', 'task.done': 'Сделано', 'task.claim': 'Забрать',

    // Лидеры
    'lead.season': 'СЕЗОН {n}', 'lead.active': 'активный', 'lead.members': '{n} участников', 'lead.until': 'до {d}',
    'lead.d': 'ДН', 'lead.h': 'Ч', 'lead.m': 'МИН', 'lead.s': 'СЕК', 'lead.how': 'Как это работает', 'lead.howText': 'Призы, оборот, сроки сезона',
    'lead.update': 'Обновление рейтинга',
    // API / новое
    'err.already': 'Уже получено', 'err.notFound': 'Не найдено', 'err.notReady': 'Задание ещё не выполнено',
    'err.badAmount': 'Неверная сумма', 'err.checkFailed': 'Не удалось проверить подписку, попробуй позже',
    'err.auth': 'Открой приложение через бота', 'err.banned': 'Аккаунт заблокирован',
    'tx.bonus': 'Бонус', 'tx.ref': 'Реферальный бонус',
    'player.dm': 'Написать в ЛС', 'player.won': 'выиграл(а)', 'player.noUser': 'У игрока нет юзернейма',
    'pay.paid': 'Оплата прошла!', 'pay.wdSent': 'Заявка на вывод отправлена', 'pay.minWd': 'Минимум для вывода: {n}',
    'pay.starsOnly': 'Пока доступна оплата только звёздами',
    'demo': 'Демо-режим: бэкенд не подключён',
    'lead.empty': 'В этом сезоне ещё никто не играл', 'feed.empty': 'Здесь появятся выигрыши игроков',
    'up.back': 'Назад', 'nft.name': 'Nft name',
    'mines.count': 'Количество мин', 'mines.of': 'звёзд: {n}', 'mines.play': 'ИГРАТЬ', 'mines.cash': 'ЗАБРАТЬ {n}',
    'mines.mult': 'Множитель', 'mines.next': 'Следующий', 'mines.win': 'Выигрыш',
    'mines.helpTitle': 'Как играть в Мины', 'mines.h1': 'Введите ставку и выберите, сколько мин спрятать',
    'mines.h2': 'Открывайте клетки — каждая звезда увеличивает множитель', 'mines.h3': 'Забирайте выигрыш в любой момент',
    'mines.h4': 'Попали на мину — ставка сгорает', 'mines.boom': 'Бум! Это была мина', 'mines.won': 'Вы забрали {n} Stars!',
    'how.title': 'Как это работает', 'how.sub': 'Делай ставки, поднимайся в топ, забирай призы',
    'how.turnH': 'Что такое оборот', 'how.turn1': 'Сумма всех твоих ставок в STARS за сезон',
    'how.turn2': 'Считаются ставки во всех играх: апгрейдер, мины и другие', 'how.prizesH': 'Призы из ТОП-3',
    'how.prizesNote': 'Призы выдаются после завершения сезона. Звёзды начисляются победителям на баланс автоматически, NFT выдаются отдельно.',
    'how.datesH': 'Сроки сезона', 'how.dur': 'Длительность:', 'how.durV': '1 месяц', 'how.end': 'Окончание:',
    'how.reset': 'После завершения оборот обнуляется и стартует новый забег с чистого листа.', 'how.warnH': 'Предупреждение',
    'how.warn': 'Абуз, мультиаккаунты, накрутки, использование багов и любые злоупотребления механиками турнира будут наказываться. Очки могут быть списаны, место аннулировано, а приз не выдан.',
    'how.ok': 'Понятно', 'lead.updateIn': 'через {n} {d}', 'days': 'день|дня|дней',
  },
  en: {
    'loader.welcome': 'Welcome 2 Void Play',
    'nav.home': 'Home', 'nav.leaders': 'Leaders', 'nav.profile': 'Profile',
    'common.connect': 'Connect', 'common.soon': 'Soon...', 'common.soonToast': 'Coming soon',
    'common.showMore': 'Show more ({n})', 'common.showAll': 'Show all', 'common.empty': 'Empty',
    'common.copied': 'Copied!', 'common.error': 'Error!',

    'bonus.daily.title': 'DAILY BONUS', 'bonus.daily.text': 'Come back every day and claim a free bonus', 'bonus.daily.btn': 'Claim', 'bonus.daily.taken': 'Already claimed — come back tomorrow',
    'bonus.invite.title': 'INVITE A FRIEND', 'bonus.invite.text': 'Invite a friend with your link and get rewarded for their games', 'bonus.invite.btn': 'Get',
    'bonus.wallet.title': 'LINK YOUR WALLET', 'bonus.wallet.text': 'Connect your TON wallet and get a betting bonus', 'bonus.wallet.btn': 'Connect',
    'bonus.deposit.title': 'FIRST DEPOSIT', 'bonus.deposit.text': 'Make your first Stars or TON deposit and we double it (up to 1000 Stars)', 'bonus.deposit.btn': 'Deposit',
    'bonus.spins.title': 'SPIN STREAK', 'bonus.spins.text': 'Place 5 bets in any game and get an activity bonus', 'bonus.spins.btn': 'Get',
    'bonus.firstwin.title': 'FIRST WIN', 'bonus.firstwin.text': 'Win your first duel round — VOID PLAY rewards winners', 'bonus.firstwin.btn': 'Claim',
    'bonus.friendpay.title': 'FRIEND DEPOSITED', 'bonus.friendpay.text': 'Your invited friend made a deposit — you get a percentage', 'bonus.friendpay.btn': 'Claim',
    'bonus.week.title': 'PLAYER OF THE WEEK', 'bonus.week.text': 'Play 20 rounds this week (any games) and get an exclusive bonus', 'bonus.week.btn': 'Get',

    'promo.title': 'ACTIVATE PROMO CODE', 'promo.text': 'Get promo codes in our Telegram channel.', 'promo.btn': 'Activate',
    'promo.sheetTitle': 'Promo code', 'promo.placeholder': 'Enter promo code', 'promo.invalid': 'Promo code not found',

    'game.mines': 'Mines', 'game.lottery': 'Giveaways', 'game.cases': 'Cases', 'game.crash': 'Plane',
    'game.upgrade': 'Upgrader', 'game.waterball': 'Water ball', 'game.ball': 'Ball', 'game.hockey': 'Hockey',

    'sub.title': 'Grab {n} Stars!',
    'sub.s1': 'Tap the button below and subscribe to our Telegram channel',
    'sub.s2': 'Wait a moment and reopen the VoidPlay app',
    'sub.s3': 'Voilà! Your stars are already on the balance',
    'sub.btn': 'Claim', 'sub.checking': 'Checking subscription…', 'sub.notYet': 'Subscription not found',

    'toast.noStars': 'Not enough stars!', 'toast.lose': 'You lost!', 'toast.win': 'You won!',
    'toast.gotStars': 'Received {n} Stars!', 'toast.gotSpins': 'Received {n} free spins in cases',
    'toast.pickTarget': 'Pick an upgrade target', 'toast.pickStake': 'Enter a bet',

    'up.stake': 'Bet', 'up.win': 'Win', 'up.go': 'UPGRADE', 'up.tabStars': 'Stars', 'up.tabGifts': 'Gifts',
    'up.enterBet': 'Enter bet amount', 'up.giftForBet': 'Gift to bet', 'up.noGifts': "You don't have gifts...",
    'up.topUpGifts': 'Add gifts', 'up.target': 'Upgrade target', 'up.search': 'Search gift',
    'up.pickStake': 'Pick a bet', 'up.pickTarget': 'Pick a target',

    'gift.title': 'Add a gift', 'gift.warnTitle': "Don't send gifts from marketplaces",
    'gift.warnText': 'Only gifts sent directly from your account are credited.',
    'gift.s1': 'Open a chat with {acc}', 'gift.s2': 'Send any message', 'gift.s3': 'Send the gift', 'gift.s4': 'Check your inventory',

    'pay.depTitle': 'Top up balance', 'pay.wdTitle': 'Withdraw', 'pay.dep': 'Top up', 'pay.wd': 'Withdraw',
    'pay.balance': 'BALANCE', 'pay.depAmount': 'Enter top up amount', 'pay.wdAmount': 'Enter withdrawal amount',
    'pay.sum': 'Amount', 'pay.packs': 'Best packs', 'pay.min': 'Enter an amount',

    'set.title': 'Settings', 'set.sounds': 'Sounds', 'set.volume': 'Volume', 'set.lang': 'Language',
    'set.terms': 'Terms of use', 'set.support': 'Support',

    'prof.status': 'Nobody', 'prof.statusHint': 'Your status grows with your betting turnover',
    'prof.wallet': 'Wallet', 'prof.connect': 'Connect', 'prof.connected': 'Connected',
    'prof.inventory': 'Your inventory', 'prof.invite': 'Invite friends and earn STARS from every fee they bring',
    'prof.inviteBtn': 'Invite friends', 'prof.more': 'Learn more', 'prof.history': 'Transaction history',
    'prof.historyEmpty': 'No transactions yet', 'prof.earn': 'Earn stars', 'prof.earnBtn': 'By completing tasks',
    'prof.shareText': 'Join Void Play — play and win gifts!',

    'tx.fee': 'Entry fee', 'tx.win': 'Win', 'tx.dep': 'Deposit', 'tx.wd': 'Withdrawal',

    'ref.system': 'Referral system', 'ref.systemText': 'Invite friends for bonuses!',
    'ref.perFriend': '{n} Stars per friend', 'ref.perDeposit': '{n}% of deposits',
    'ref.count': 'Referrals', 'ref.earned': 'Earned', 'ref.link': 'Referral link', 'ref.linkText': 'Copy and send it to friends!',
    'ref.level': 'Your current level', 'ref.levelN': 'Level {n}', 'ref.percent': '{n}% of net revenue',
    'ref.from': 'From {n} Stars of referral deposits', 'ref.moreLevels': 'More about referral levels',
    'ref.all': 'All referrals', 'ref.total': '{n} total', 'ref.none': 'No referrals yet', 'ref.levels': 'Referral levels',

    'task.title': 'Tasks', 'task.text': 'Complete tasks and get stars as a reward!',
    'task.reward': 'Reward {n}', 'task.progress': 'Your progress: {a}/{b}', 'task.inProgress': 'In progress', 'task.done': 'Done', 'task.claim': 'Claim',

    'lead.season': 'SEASON {n}', 'lead.active': 'active', 'lead.members': '{n} players', 'lead.until': 'until {d}',
    'lead.d': 'D', 'lead.h': 'H', 'lead.m': 'MIN', 'lead.s': 'SEC', 'lead.how': 'How it works', 'lead.howText': 'Prizes, turnover, season dates',
    'lead.update': 'Rating update',
    'err.already': 'Already claimed', 'err.notFound': 'Not found', 'err.notReady': 'Task is not completed yet',
    'err.badAmount': 'Invalid amount', 'err.checkFailed': 'Could not check subscription, try later',
    'err.auth': 'Open the app via the bot', 'err.banned': 'Account banned',
    'tx.bonus': 'Bonus', 'tx.ref': 'Referral bonus',
    'player.dm': 'Message', 'player.won': 'won', 'player.noUser': 'This player has no username',
    'pay.paid': 'Payment received!', 'pay.wdSent': 'Withdrawal request sent', 'pay.minWd': 'Minimum withdrawal: {n}',
    'pay.starsOnly': 'Only Stars payments are available for now',
    'demo': 'Demo mode: backend is not connected',
    'lead.empty': 'Nobody has played this season yet', 'feed.empty': 'Players\' wins will appear here',
    'up.back': 'Back', 'nft.name': 'Nft name',
    'mines.count': 'Mines', 'mines.of': 'stars: {n}', 'mines.play': 'PLAY', 'mines.cash': 'CASH OUT {n}',
    'mines.mult': 'Multiplier', 'mines.next': 'Next', 'mines.win': 'Win',
    'mines.helpTitle': 'How to play Mines', 'mines.h1': 'Enter a bet and choose how many mines to hide',
    'mines.h2': 'Open tiles — every star raises the multiplier', 'mines.h3': 'Cash out any time',
    'mines.h4': 'Hit a mine — the bet is lost', 'mines.boom': 'Boom! That was a mine', 'mines.won': 'You cashed out {n} Stars!',
    'how.title': 'How it works', 'how.sub': 'Place bets, climb the top, grab prizes',
    'how.turnH': 'What is turnover', 'how.turn1': 'The sum of all your STARS bets this season',
    'how.turn2': 'Bets in all games count: upgrader, mines and others', 'how.prizesH': 'Top-3 prizes',
    'how.prizesNote': 'Prizes are given after the season ends. Stars are credited automatically, NFTs are sent separately.',
    'how.datesH': 'Season dates', 'how.dur': 'Duration:', 'how.durV': '1 month', 'how.end': 'Ends:',
    'how.reset': 'After the season, turnover resets and a new race starts from scratch.', 'how.warnH': 'Warning',
    'how.warn': 'Abuse, multi-accounts, boosting, bug exploits and any misuse of tournament mechanics will be punished. Points may be removed, place cancelled and the prize withheld.',
    'how.ok': 'Got it', 'lead.updateIn': 'in {n} {d}', 'days': 'day|days|days',
  },
};

let lang = 'ru';
const setLang = (l) => { lang = dict[l] ? l : 'ru'; document.documentElement.lang = lang; };
const getLang = () => lang;
// 1 день, 2 дня, 5 дней
function plural(n, key) {
  const [one, few, many] = t(key).split('|');
  const a = Math.abs(n) % 100, b = a % 10;
  if (lang === 'en') return n === 1 ? one : few;
  return a > 10 && a < 20 ? many : b === 1 ? one : b >= 2 && b <= 4 ? few : many;
}
function t(key, vars = {}) {
  let s = dict[lang][key] ?? dict.ru[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

// ======================= icons.js =======================
// Иконки интерфейса (inline SVG, цвет через currentColor)
const s = (body, vb = '0 0 24 24', extra = '') =>
  `<svg viewBox="${vb}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" ${extra}>${body}</svg>`;

const icon = {
  coin: s('<path fill="#fff" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" d="M12 3.6l2.5 5.1 5.6.8-4.05 3.95.95 5.55L12 16.4 6.99 19l.96-5.55L3.9 9.5l5.6-.8z"/><path fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" d="M6.6 14.6c2.3-1.2 4.9-1.7 8.4-1.9"/>'),
  star: s('<path fill="currentColor" d="M12 2.2l2.95 6.2 6.8.82-5.02 4.68 1.3 6.73L12 17.3l-6.03 3.33 1.3-6.73L2.25 9.22l6.8-.82L12 2.2z"/>'),
  starLine: s('<path stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" d="M12 3.2l2.6 5.5 6 .73-4.43 4.13 1.15 5.94L12 16.56l-5.32 2.94 1.15-5.94L3.4 9.43l6-.73L12 3.2z"/>'),
  gear: s('<path d="M12.00 2.85 L12.47 2.94 L12.93 3.19 L13.33 3.59 L13.68 4.10 L13.97 4.66 L14.20 5.23 L14.40 5.76 L14.58 6.20 L14.78 6.54 L15.03 6.76 L15.34 6.86 L15.73 6.87 L16.21 6.80 L16.76 6.71 L17.37 6.63 L18.00 6.59 L18.61 6.64 L19.16 6.80 L19.61 7.06 L19.92 7.43 L20.09 7.88 L20.09 8.40 L19.95 8.95 L19.68 9.50 L19.34 10.03 L18.97 10.52 L18.61 10.95 L18.31 11.34 L18.12 11.68 L18.05 12.00 L18.12 12.32 L18.31 12.66 L18.61 13.05 L18.97 13.48 L19.34 13.97 L19.68 14.50 L19.95 15.05 L20.09 15.60 L20.09 16.12 L19.92 16.57 L19.61 16.94 L19.16 17.20 L18.61 17.36 L18.00 17.41 L17.37 17.37 L16.76 17.29 L16.21 17.20 L15.73 17.13 L15.34 17.14 L15.03 17.24 L14.78 17.46 L14.58 17.80 L14.40 18.24 L14.20 18.77 L13.97 19.34 L13.68 19.90 L13.33 20.41 L12.93 20.81 L12.47 21.06 L12.00 21.15 L11.53 21.06 L11.07 20.81 L10.67 20.41 L10.32 19.90 L10.03 19.34 L9.80 18.77 L9.60 18.24 L9.42 17.80 L9.22 17.46 L8.98 17.24 L8.66 17.14 L8.27 17.13 L7.79 17.20 L7.24 17.29 L6.63 17.37 L6.00 17.41 L5.39 17.36 L4.84 17.20 L4.39 16.94 L4.08 16.57 L3.91 16.12 L3.91 15.60 L4.05 15.05 L4.32 14.50 L4.66 13.97 L5.03 13.48 L5.39 13.05 L5.69 12.66 L5.88 12.32 L5.95 12.00 L5.88 11.68 L5.69 11.34 L5.39 10.95 L5.03 10.52 L4.66 10.03 L4.32 9.50 L4.05 8.95 L3.91 8.40 L3.91 7.88 L4.08 7.42 L4.39 7.06 L4.84 6.80 L5.39 6.64 L6.00 6.59 L6.63 6.63 L7.24 6.71 L7.79 6.80 L8.27 6.87 L8.66 6.86 L8.97 6.76 L9.22 6.54 L9.42 6.20 L9.60 5.76 L9.80 5.23 L10.03 4.66 L10.32 4.10 L10.67 3.59 L11.07 3.19 L11.53 2.94 L12.00 2.85Z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.9" stroke="currentColor" stroke-width="2.2"/>'),
  home: s('<path fill="currentColor" fill-rule="evenodd" d="M10.9 3.3a1.8 1.8 0 0 1 2.2 0l6.6 5.3c.5.4.8 1 .8 1.6V19a2 2 0 0 1-2 2h-3.4v-6.6a.9.9 0 0 0-.9-.9H9.8a.9.9 0 0 0-.9.9V21H5.5a2 2 0 0 1-2-2v-8.8c0-.6.3-1.2.8-1.6z"/>'),
  leaders: s('<path stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M3.5 20.5v-6h5v-5h7v8h5v3zM8.5 14.5v6M15.5 17.5v3"/><path fill="currentColor" d="M11.6 2.2h1.5v5.3h-1.6V4l-1 .5-.5-1.2z"/>'),
  profile: s('<circle cx="12" cy="7" r="3.6" stroke="currentColor" stroke-width="1.9"/><path stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M5.5 19.2a6.5 6.5 0 0 1 13 0v.3c0 .6-.4 1-1 1h-11c-.6 0-1-.4-1-1z"/>'),
  close: s('<path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M7 7l10 10M17 7L7 17"/>'),
  question: s('<path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M9 9.2a3 3 0 115.2 2c-.9.9-2.2 1.4-2.2 3"/><circle cx="12" cy="18.2" r="1.3" fill="currentColor"/>'),
  plusCircle: s('<circle cx="12" cy="12" r="10" fill="currentColor"/><path stroke="#ff6a86" stroke-width="2.4" stroke-linecap="round" d="M12 7.5v9M7.5 12h9"/>'),
  share: s('<circle cx="18" cy="5.5" r="3" fill="currentColor"/><circle cx="6" cy="12" r="3" fill="currentColor"/><circle cx="18" cy="18.5" r="3" fill="currentColor"/><path stroke="currentColor" stroke-width="2" d="M8.6 10.6l6.8-3.7M8.6 13.4l6.8 3.7"/>'),
  arrowRight: s('<path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h13M13 6l6 6-6 6"/>'),
  chevronRight: s('<path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>'),
  chevronUp: s('<path fill="currentColor" d="M12 6l8 10H4l8-10z"/>'),
  search: s('<circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="2.4"/><path stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M15.5 15.5L20 20"/>'),
  copy: s('<rect x="8" y="8" width="12" height="12" rx="2.5" fill="currentColor" stroke="currentColor" stroke-width="1.6"/><path stroke="currentColor" stroke-width="1.6" d="M16 5.5V5a1.5 1.5 0 00-1.5-1.5H5A1.5 1.5 0 003.5 5v9.5A1.5 1.5 0 005 16h.5"/>'),
  clock: s('<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 7v5l3 2"/>'),
  sound: s('<path fill="currentColor" d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M15.5 9a4.2 4.2 0 010 6M18 6.5a7.8 7.8 0 010 11"/>'),
  lang: s('<path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3.5 5.5h9M8 3.5v2M6 5.5c.8 3 2.8 5.2 5.5 6.5M10.5 5.5c-.7 3-2.6 5.6-6 7.2M12.5 20.5l3.8-9 3.8 9M13.8 17.5h5"/>'),
  doc: s('<path stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M6 3h8.5L19 7.5V20a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8.5 12h7M8.5 15.5h7M8.5 8.5h3"/>'),
  wallet: s('<path fill="currentColor" fill-rule="evenodd" d="M4 5.5A2.5 2.5 0 016.5 3h11A2.5 2.5 0 0120 5.5V7H6.5a.75.75 0 000 1.5H20v10A2.5 2.5 0 0117.5 21h-11A2.5 2.5 0 014 18.5v-13zM16.5 12.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>'),
  ton: s('<path fill="currentColor" d="M5.6 4h12.8c1.7 0 2.8 1.9 1.9 3.4l-7.2 12.3a1.3 1.3 0 01-2.2 0L3.7 7.4C2.8 5.9 3.9 4 5.6 4zm5.5 2.2H6.3c-.4 0-.6.4-.4.8l5.2 9.1V6.2zm1.8 0v9.9l5.2-9.1c.2-.4 0-.8-.4-.8h-4.8z"/>'),
  diamond: s('<path fill="currentColor" d="M7 3.5h10l4.5 5.5L12 21 2.5 9 7 3.5zm.9 2L5.7 8.2h3.6l1.2-2.7H7.9zm4.1 0l-1.2 2.7h2.4L12 5.5zm1.5 0l1.2 2.7h3.6l-2.2-2.7h-2.6zM5.9 10l4.8 6.2L9 10H5.9zm4.9 0L12 15l1.2-5h-2.4zm4.2 0l-1.7 6.2 4.8-6.2H15z"/>'),
  dollar: s('<path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M12 3v18M16.5 7.5c-.6-1.4-2.3-2.3-4.5-2.3-2.6 0-4.3 1.3-4.3 3.2 0 4.5 9 2.3 9 7 0 2-1.9 3.4-4.7 3.4-2.4 0-4.2-1-4.8-2.6"/>'),
  cardIn: s('<rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path stroke="currentColor" stroke-width="1.8" d="M2.5 9.5h19"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M6 15h4"/><path d="M17 12.5v5M14.5 15h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'),
  cardOut: s('<rect x="2.5" y="5" width="19" height="14" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path stroke="currentColor" stroke-width="1.8" d="M2.5 9.5h19"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M6 15h4M14.5 15h5"/>'),
  people: s('<circle cx="9" cy="8" r="3.5" fill="currentColor"/><path fill="currentColor" d="M2.5 19c.4-3.6 3-6 6.5-6s6.1 2.4 6.5 6h-13z"/><circle cx="16.5" cy="8.5" r="2.8" fill="currentColor" opacity=".75"/><path fill="currentColor" opacity=".75" d="M16 13c3 0 5.2 2.1 5.5 5.2h-4.8c-.2-2-1-3.8-2.4-5 .5-.1 1.1-.2 1.7-.2z"/>'),
  link: s('<path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M10 14a4.2 4.2 0 006 0l3-3a4.2 4.2 0 00-6-6l-1.2 1.2M14 10a4.2 4.2 0 00-6 0l-3 3a4.2 4.2 0 006 6l1.2-1.2"/>'),
  levels: s('<path fill="currentColor" d="M4 14h4v7H4zM10 9h4v12h-4zM16 3h4v18h-4z"/>'),
  live: s('<path fill="currentColor" d="M3 3l8 5-8 5V3z"/>', '0 0 12 16'),
  arrowLeft: s('<path stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" d="M19 12H5.5M11 5.5L4.5 12l6.5 6.5"/>'),
  helpCircle: s('<circle cx="12" cy="12" r="9.6" stroke="currentColor" stroke-width="1.8"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M9.4 9.6a2.7 2.7 0 1 1 3.9 2.4c-.8.4-1.3 1-1.3 1.9v.4"/><circle cx="12" cy="17.2" r="1.15" fill="currentColor"/>'),
  swirl: s('<g stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><ellipse cx="12.2" cy="11.6" rx="4.6" ry="6.5" transform="rotate(52 12.2 11.6)"/><path d="M6.6 6C3.9 9 3.1 14 5.6 16.7c1.5 1.8 4 2 5.3 1.5M15 5c4 .5 5.8 4 5 7.5-.3 1.8-1.2 3.5-2.5 5"/></g><circle cx="11.9" cy="11.5" r="1.4" fill="currentColor"/>'),
  calendar: s('<rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="currentColor" stroke-width="1.8"/><path stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M3.5 10h17M8 3v4M16 3v4"/>'),
  users: s('<circle cx="9" cy="8.5" r="3.3" stroke="currentColor" stroke-width="1.7"/><path stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M3 19c.5-3.2 2.9-5.2 6-5.2s5.5 2 6 5.2"/><path stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M15.5 5.6a3 3 0 0 1 0 5.8M17.8 14.2c1.8.7 3 2.4 3.2 4.6"/>'),
  refresh: s('<path stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4.5h-4.5"/><path stroke="currentColor" stroke-width="1.9" stroke-linecap="round" d="M12 8v4.3l2.6 1.6"/>'),
  check: s('<path stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="M4 12.5l5 5L20 6.5"/>'),
  info: s('<circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M12 11v6"/><circle cx="12" cy="7.6" r="1.3" fill="currentColor"/>'),
  bomb: s('<circle cx="11" cy="14" r="7.2" fill="currentColor"/><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M15.6 9.4l2.2-2.2"/><path stroke="#ffce00" stroke-width="1.8" stroke-linecap="round" d="M18.6 4.2l.6-1.4M20.6 6.2l1.4-.6M19.9 4.9l1-1"/><circle cx="8.6" cy="11.6" r="1.6" fill="#fff" opacity=".55"/>'),
  play: s('<path fill="currentColor" d="M8 5.5v13c0 .8.9 1.3 1.6.8l9.6-6.5a1 1 0 0 0 0-1.6L9.6 4.7C8.9 4.2 8 4.7 8 5.5z"/>'),
  support: s('<path stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M4 12a8 8 0 1116 0v4.5a2 2 0 01-2 2h-1.5V12H20M4 12h3.5v6.5H6a2 2 0 01-2-2V12z"/>'),
};

// ======================= decor.js =======================
// Декоративные элементы, перенесённые из Figma координатами
// Россыпь звёзд (Figma: "Frame 174", 376×379): x, y, w, h, rotation
const STARS = [[12,0,21,20,-34],[73,6,30,29,15],[149,27,17,17,-39],[190,7,20,20,-42],[221,28,17,16,31],[274,48,25,24,-39],[294,5,20,20,-39],[320,44,20,20,39],[362,71,12,11,-30],[338,90,40,39,-30],[290,132,16,15,-37],[333,166,16,15,34],[275,208,47,45,34],[363,209,16,15,-35],[360,262,16,15,-71],[286,256,17,16,-116],[275,299,39,37,-17],[351,314,21,20,-17],[342,351,19,18,-34],[220,337,31,30,-34],[175,361,11,11,-34],[125,349,18,17,31],[192,313,12,12,-51],[207,279,19,18,32],[220,212,25,24,-56],[163,239,14,14,-56],[108,280,30,28,16],[74,313,14,13,-33],[40,346,19,18,-33],[28,323,16,15,-127],[52,280,20,19,-127],[75,233,20,19,-23],[9,213,20,19,29],[60,145,47,45,-32],[14,132,18,17,47],[21,83,18,17,-32],[77,78,36,34,-32],[120,133,23,22,-32],[149,113,12,12,-32],[172,74,38,37,28],[114,42,25,24,-25],[53,21,35,33,-66],[133,192,27,26,38],[200,134,24,22,-25],[248,175,18,17,24],[233,118,23,22,51],[364,9,12,12,-27]];

const STAR_PATH = 'M12 2.2l2.95 6.2 6.8.82-5.02 4.68 1.3 6.73L12 17.3l-6.03 3.33 1.3-6.73L2.25 9.22l6.8-.82L12 2.2z';
let cached;
function starsBg(cls = '') {
  if (!cached) {
    const items = STARS.map(([x, y, w, h, r]) =>
      `<path d="${STAR_PATH}" transform="translate(${x} ${y}) rotate(${-r}) scale(${w / 24} ${h / 24})"/>`).join('');
    cached = `<svg viewBox="0 0 376 379" fill="currentColor">${items}</svg>`;
  }
  return `<div class="stars-bg ${cls}" aria-hidden="true">${cached}</div>`;
}

// Карточки «Ставка/Выигрыш» 114×110 с неглубоким вырезом под кольцо (Figma: "выборы" → Exclude)
function choiceShape() {
  const d = 'M14 .5H101C109 .5 113.3 4 113 11A170 170 0 0 0 113 99C113.3 106 109 109.5 101 109.5H14A13.5 13.5 0 0 1 .5 96V14A13.5 13.5 0 0 1 14 .5Z';
  return `<svg class="choice__bg" viewBox="0 0 114 110" preserveAspectRatio="none"><path d="${d}"/></svg>`;
}

const starIcon = icon.star;

// Кубок для «Как это работает» — запасной рисунок, если нет img/trophy.png
const TROPHY_SVG = `<svg viewBox="0 0 54 76" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="tg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a3"/><stop offset=".45" stop-color="#f2b822"/><stop offset="1" stop-color="#a86a06"/></linearGradient><radialGradient id="tg2" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#bfe3ff"/><stop offset=".5" stop-color="#2f8cf0"/><stop offset="1" stop-color="#0b3f9e"/></radialGradient></defs><path d="M9 6c4 9 6 22 18 30 12-8 14-21 18-30" fill="none" stroke="url(#tg1)" stroke-width="5" stroke-linecap="round"/><path d="M14 4c2 10 5 20 13 26 8-6 11-16 13-26" fill="none" stroke="url(#tg1)" stroke-width="3.5" stroke-linecap="round"/><circle cx="27" cy="22" r="11" fill="url(#tg2)" stroke="#f7d36a" stroke-width="2"/><text x="27" y="25.5" font-family="Arial" font-weight="900" font-size="9" fill="#fff" text-anchor="middle">TOP</text><path d="M24 36h6l2 14h-10z" fill="url(#tg1)"/><path d="M15 52h24l3 9H12z" fill="url(#tg1)"/><rect x="9" y="61" width="36" height="9" rx="2.5" fill="#7a4a07"/><rect x="11" y="63" width="32" height="5" rx="1.5" fill="url(#tg1)"/></svg>`;

// ======================= api.js =======================
// Слой данных. В Telegram — реальный бэкенд (CONFIG.API_BASE), в обычном браузере — демо-режим на моках.
const tg = window.Telegram?.WebApp;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

class ApiError extends Error {
  constructor(code) { super(code); this.code = code; }
}

// ---------- Каталог (такой же, как в backend/catalog.py) ----------
const GIFTS = [
  ['pepe', 'Plush Pepe', 4999], ['gift-126', 'NFT #126', 3500], ['gift-128', 'NFT #128', 2400], ['gift-127', 'NFT #127', 1800],
  ['gift-129', 'NFT #129', 1500], ['gift-004', 'NFT #004', 1200], ['gift-074', 'NFT #074', 999], ['gift-090', 'NFT #090', 850],
  ['gift-020', 'NFT #020', 700], ['gift-065', 'NFT #065', 560], ['gift-023', 'NFT #023', 450], ['gift-047', 'NFT #047', 350],
  ['gift-132', 'NFT #132', 280], ['gift-103', 'NFT #103', 200], ['gift-120', 'NFT #120', 150],
];
const DEMO_CATALOG = GIFTS.map(([id, name, price]) => ({ id, name, price, img: `img/${id}.png` }));

// Аватар-заглушка: буква на цветном круге
function letterAvatar(name = '?', id = 0) {
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
  mines: null,
  prizes: null,
  config: {},
};

function applyState(st) {
  Object.assign(state, {
    user: st.user, balance: st.balance, subscribed: st.subscribed, wallet: st.wallet,
    inventory: st.inventory, transactions: st.transactions, referrals: st.referrals, tasks: st.tasks,
    packs: st.packs || state.packs, levels: st.levels, rates: st.rates || state.rates, config: st.config || {},
    mines: st.mines || null, prizes: st.prizes || null,
  });
  if (st.catalog?.length) api.catalog = st.catalog;
}

async function request(path, body, method = body === undefined ? 'GET' : 'POST', timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(CONFIG.API_BASE + path, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Init-Data': tg?.initData || '' },
      body: method === 'POST' ? JSON.stringify(body || {}) : undefined,
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new ApiError(e.name === 'AbortError' ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
  }
  let data = {};
  try { data = await res.json(); } catch (e) { /* ignore */ }
  if (!res.ok || data.ok === false) throw new ApiError(data.error || `http_${res.status}`);
  return data;
}

function demoTx(type, amount, extra = {}) {
  state.transactions.unshift({ type, amount, currency: 'STARS', date: Date.now(), ...extra });
}

const api = {
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
    await wait(120);
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
      // тестовый режим на сервере (FREE_DEPOSIT): звёзды зачислены сразу, без оплаты
      if (r.credited !== undefined) { state.balance.stars = r.balance; this.refresh().catch(() => {}); return { ok: true, status: 'paid', credited: r.credited }; }
      const { link } = r;
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
      season: now.getMonth() + 1, end, players: 248, prizes: ['gift-126', 'gift-128', 'gift-127'].map((id) => this.catalog.find((g) => g.id === id)),
      top: DEMO_PLAYERS.map((p, i) => ({ ...p, value: 12000 - i * 1150, nft: this.catalog[i % this.catalog.length] })),
    };
  },
};

// ======================= ui.js =======================
// заглушка для картинки подарка, пока нет файла
const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#30a1f5"/><stop offset="1" stop-color="#0033ff"/></linearGradient></defs><rect x="10" y="26" width="44" height="30" rx="5" fill="url(#b)"/><rect x="7" y="18" width="50" height="11" rx="4" fill="#5fb6ff"/><rect x="29" y="18" width="6" height="38" fill="#ff4d6d"/><path d="M32 18c-4-9-15-10-15-4 0 4 8 4 15 4zm0 0c4-9 15-10 15-4 0 4-8 4-15 4z" fill="none" stroke="#ff4d6d" stroke-width="4" stroke-linejoin="round"/></svg>');
// Общие UI-хелперы: тосты, шторки, модалки, звук, хаптика, Telegram
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
const starIco = (cls = '') => `<span class="ico ico-star ${cls}">${icon.star}</span>`;

// Картинка с запасным вариантом, если файла ещё нет в assets
// deco=true — декоративная картинка: если файла нет, просто убираем её
const img = (src, cls = '', alt = '', deco = false) =>
  `<img class="${cls}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" onerror="${deco ? 'this.remove()' : "if(!this.dataset.f){this.dataset.f=1;this.src=PLACEHOLDER}else{this.classList.add('img-missing')}"}" />`;

// ---------- Настройки (звук/громкость/язык) ----------
const prefs = (() => {
  let p = { sound: true, volume: 100, lang: 'ru' };
  try { p = { ...p, ...JSON.parse(localStorage.getItem('vp_prefs') || '{}') }; } catch (e) { /* ignore */ }
  return {
    get: (k) => p[k],
    set: (k, v) => { p[k] = v; try { localStorage.setItem('vp_prefs', JSON.stringify(p)); } catch (e) { /* ignore */ } },
  };
})();

// ---------- Звук (простые синтезированные клики, без файлов) ----------
let actx;
function sound(type = 'tap') {
  if (!prefs.get('sound')) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const vol = (prefs.get('volume') / 100) * 0.15;
    const o = actx.createOscillator(); const g = actx.createGain();
    const now = actx.currentTime;
    const map = { tap: [520, 0.05], win: [880, 0.25], lose: [180, 0.3], tick: [1200, 0.02] };
    const [f, d] = map[type] || map.tap;
    o.type = type === 'lose' ? 'sawtooth' : 'sine';
    o.frequency.setValueAtTime(f, now);
    if (type === 'win') o.frequency.exponentialRampToValueAtTime(f * 1.6, now + d);
    if (type === 'lose') o.frequency.exponentialRampToValueAtTime(f * 0.5, now + d);
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + d);
    o.connect(g).connect(actx.destination); o.start(now); o.stop(now + d);
  } catch (e) { /* ignore */ }
}

function haptic(kind = 'light') {
  const h = tg?.HapticFeedback; if (!h) return;
  if (kind === 'success' || kind === 'error' || kind === 'warning') h.notificationOccurred(kind);
  else h.impactOccurred(kind);
}

function openLink(url) {
  if (!url) return;
  if (/^https:\/\/t\.me\//.test(url) && tg?.openTelegramLink) tg.openTelegramLink(url);
  else if (tg?.openLink) tg.openLink(url);
  else window.open(url, '_blank');
}

// ---------- Тосты (справа сверху, полоска убывает за 3 c, улетает вправо) ----------
function toast(text, kind = 'info') {
  const wrap = $('#toasts');
  const el = document.createElement('div');
  el.className = `toast toast--${kind}`;
  el.innerHTML = `<span class="toast__text">${esc(text)}</span><span class="toast__bar" style="animation-duration:${CONFIG.TOAST_MS}ms"></span>`;
  wrap.prepend(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  if (kind === 'win' || kind === 'success') haptic('success');
  if (kind === 'lose' || kind === 'error') haptic('error');
  setTimeout(() => {
    el.classList.remove('is-in'); el.classList.add('is-out');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 600);
  }, CONFIG.TOAST_MS);
}

// ---------- Шторки снизу и модалки ----------
const stack = [];
function syncOverlay() {
  const ov = $('#overlay');
  ov.hidden = stack.length === 0;
  document.body.classList.toggle('is-locked', stack.length > 0);
  if (tg?.BackButton) stack.length ? tg.BackButton.show() : tg.BackButton.hide();
}

function closeTop() {
  const top = stack[stack.length - 1];
  if (top && top.closable()) top.close();
}

function sheet(html, { onClose, cls = '', onMount } = {}) {
  const el = document.createElement('div');
  el.className = `sheet ${cls}`;
  el.innerHTML = `<div class="sheet__handle"></div>${html}`;
  document.body.appendChild(el);
  const entry = {
    el, closable: () => true,
    close() {
      const i = stack.indexOf(entry); if (i >= 0) stack.splice(i, 1);
      el.classList.remove('is-open');
      setTimeout(() => el.remove(), 300);
      syncOverlay(); onClose && onClose();
    },
  };
  stack.push(entry); syncOverlay();
  requestAnimationFrame(() => el.classList.add('is-open'));
  // свайп вниз за ручку
  let y0 = null, dy = 0;
  const handle = el.querySelector('.sheet__handle');
  el.addEventListener('touchstart', (e) => { if (e.target === handle || el.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
  el.addEventListener('touchmove', (e) => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); el.style.transform = `translateY(${dy}px)`; }, { passive: true });
  el.addEventListener('touchend', () => { if (y0 === null) return; el.style.transform = ''; if (dy > 90) entry.close(); y0 = null; });
  onMount && onMount(el, entry);
  return entry;
}

// Модалка по центру. closeDelay — крестик заполняется N мс и только потом закрывает
function modal(html, { closeDelay = 0, onClose, cls = '', onMount } = {}) {
  const el = document.createElement('div');
  el.className = `modal ${cls}`;
  const R = 17, C = 2 * Math.PI * R;
  el.innerHTML = `
    <button class="modal__close ${closeDelay ? 'is-locked' : ''}" aria-label="close">
      <svg class="modal__ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="${R}" style="stroke-dasharray:${C};stroke-dashoffset:${closeDelay ? C : 0};transition-duration:${closeDelay}ms"/></svg>
      ${icon.close}
    </button>
    <div class="modal__card">${html}</div>`;
  document.body.appendChild(el);
  let unlocked = !closeDelay;
  const entry = {
    el, closable: () => unlocked,
    close() {
      const i = stack.indexOf(entry); if (i >= 0) stack.splice(i, 1);
      el.classList.remove('is-open'); setTimeout(() => el.remove(), 300);
      syncOverlay(); onClose && onClose();
    },
  };
  stack.push(entry); syncOverlay();
  requestAnimationFrame(() => {
    el.classList.add('is-open');
    if (closeDelay) {
      requestAnimationFrame(() => { el.querySelector('.modal__ring circle').style.strokeDashoffset = 0; });
      setTimeout(() => { unlocked = true; el.querySelector('.modal__close').classList.remove('is-locked'); }, closeDelay);
    }
  });
  el.querySelector('.modal__close').addEventListener('click', () => { if (unlocked) { sound(); entry.close(); } });
  el.addEventListener('click', (e) => { if (e.target === el && unlocked) entry.close(); });
  onMount && onMount(el, entry);
  return entry;
}

function closeAll() {
  while (stack.length) stack[stack.length - 1].close();
}

function initLayers() {
  $('#overlay').addEventListener('click', closeTop);
  tg?.BackButton?.onClick(() => closeTop());
}

const soonToast = () => toast(t('common.soonToast'));

// ---------- Игроки: аватар и переход в ЛС ----------
// Любой элемент с data-tg="username" по тапу открывает личку игрока в Telegram
const tgAttr = (u) => (u?.username ? `data-tg="${esc(u.username)}"` : '');
function avatarHtml(u, src, cls = '') {
  return `<img class="ava ${cls}" src="${esc(src)}" alt="" loading="lazy" ${tgAttr(u)} onerror="this.onerror=null;this.src=window.__letterAvatar?window.__letterAvatar(${JSON.stringify(String(u?.name || u?.username || '?')).replace(/"/g, '&quot;')},${Number(u?.id) || 0}):''" />`;
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

// ---------- Ошибки API → понятный тост ----------
function errToast(e) {
  const map = {
    no_stars: 'toast.noStars', already: 'err.already', not_found: 'err.notFound', not_ready: 'err.notReady',
    bad_amount: 'err.badAmount', not_subscribed: 'sub.notYet', check_failed: 'err.checkFailed', auth: 'err.auth', banned: 'err.banned',
  };
  toast(t(map[e?.code] || 'common.error'), 'error');
}

// ======================= fx.js =======================
// Эффекты: конфетти, «счётчик» баланса, окно выигрыша
const reduce = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ---------- Конфетти (canvas, без библиотек) ----------
function confetti({ x = 0.5, y = 0.45, count = 140, colors = ['#30a1f5', '#0033ff', '#ffce00', '#ff4d6d', '#ffffff', '#18c832'] } = {}) {
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
    return {
      x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6,
      w: 5 + Math.random() * 6, h: 8 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .4,
      c: colors[Math.floor(Math.random() * colors.length)], star: Math.random() < .25, life: 0,
    };
  });
  let raf;
  const star = (s) => { ctx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? s / 2.4 : s; const a = (i * Math.PI) / 5 - Math.PI / 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); };
  const frame = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = 0;
    for (const p of parts) {
      p.life++; p.vy += 0.32; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      if (p.y > innerHeight + 30) continue;
      alive++;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - p.life / 160); ctx.fillStyle = p.c;
      if (p.star) star(p.w); else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life / 6)));
      ctx.restore();
    }
    if (alive && parts[0].life < 170) raf = requestAnimationFrame(frame); else c.remove();
  };
  raf = requestAnimationFrame(frame);
  setTimeout(() => { cancelAnimationFrame(raf); c.remove(); }, 4000);
}

// ---------- Плавный счётчик чисел ----------
function countUp(el, to, ms = 650) {
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
  el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add(to > from ? 'is-bump' : 'is-drop');
  setTimeout(() => el.classList.remove('is-bump', 'is-drop'), 700);
}

// ---------- Окно выигрыша NFT ----------
function winReveal(gift, { onClose } = {}) {
  const el = document.createElement('div');
  el.className = 'win-reveal';
  el.innerHTML = `
    <div class="win-reveal__rays"></div>
    <div class="win-reveal__card">
      <div class="win-reveal__glow"></div>
      ${img(gift.img, 'win-reveal__img')}
      <div class="win-reveal__label">${t('toast.win')}</div>
      <div class="win-reveal__name">${esc(gift.name)}</div>
      <div class="win-reveal__price">${fmt(gift.price)}${starIco()}</div>
      <button class="win-reveal__btn">${t('sub.btn')}</button>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-open'));
  haptic('success'); sound('win');
  setTimeout(() => confetti({ y: 0.4 }), 250);
  const close = () => {
    el.classList.remove('is-open'); setTimeout(() => el.remove(), 350);
    onClose && onClose();
  };
  el.querySelector('.win-reveal__btn').addEventListener('click', () => { sound(); close(); });
  el.addEventListener('click', (e) => { if (e.target === el) close(); });
}
