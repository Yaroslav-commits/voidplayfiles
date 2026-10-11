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
    'lead.update': 'Обновление рейтинга через {n} дня',
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
    'lead.update': 'Rating updates in {n} days',
  },
};

let lang = 'ru';
export const setLang = (l) => { lang = dict[l] ? l : 'ru'; document.documentElement.lang = lang; };
export const getLang = () => lang;
export function t(key, vars = {}) {
  let s = dict[lang][key] ?? dict.ru[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}
