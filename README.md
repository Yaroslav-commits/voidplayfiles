# Void Play — Web App (сайт)

Это то, что открывается внутри Telegram по кнопке «Играть». Чистый HTML/CSS/JS, ничего собирать не нужно.

## Как выложить на GitHub Pages

1. Залей содержимое этой папки в репозиторий (например `voidplay-webapp`):
   ```bash
   git init -b main
   git add .
   git commit -m "Void Play web app"
   git remote add origin https://github.com/<ник>/voidplay-webapp.git
   git push -u origin main
   ```
2. На GitHub: **Settings → Pages → Deploy from a branch → main, папка `/ (root)`** → Save.
3. Через минуту сайт: `https://<ник>.github.io/voidplay-webapp/` — этот адрес нужен бэкенду (`WEBAPP_URL`).

## Картинки из Figma (один раз)

1. Figma → аватарка → **Settings → Security → Personal access tokens** → создать токен (права *File content: Read*).
2. В папке репозитория:
   ```bash
   python tools/figma_export.py ТВОЙ_ТОКЕН
   ```
3. Картинки появятся в `assets/img/` → `git add . && git commit -m "images" && git push`.

## Связь с бэкендом

Адрес API — в `js/config.js`, строка `API_BASE` (сейчас `https://voidplay.bothost.tech`). Если бэкенд переедет — поменяй там.

Если открыть сайт просто в браузере (не в Telegram), включится демо-режим с тестовыми данными — удобно смотреть вёрстку.

## Что где

```
index.html            каркас и экран загрузки
css/style.css         все стили
js/config.js          адрес API, ссылки, интервалы
js/api.js             запросы к бэкенду (+ демо-режим)
js/i18n.js            тексты RU / EN
js/screens/*.js       экраны: главная, апгрейдер, профиль, рефералы, задания, лидеры
js/sheets.js          шторки и модалки: пополнение, настройки, подписка, карточка игрока…
assets/img/           картинки (заполняет tools/figma_export.py)
```
