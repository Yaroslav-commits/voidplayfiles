// Настройки фронтенда
export const CONFIG = {
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
