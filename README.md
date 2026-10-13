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

## Картинки из Figma (вручную — без лимитов)

Автоматическая выгрузка через Figma API на бесплатном плане почти сразу упирается в лимит (≈20 запросов в месяц), поэтому экспортируем руками:

1. Открой файл в Figma. На холсте, зажав **Shift**, кликни по названиям фреймов:
   `main`, `Section 1`, `Section 3`, `load`, `upgrader update`, `profile`, `referals`, `Frame 496`, `leaders`, `Frame 523`.
2. Справа внизу блок **Export** → **+** → выбери **3x** и **PNG**.
3. Нажми **Export** — скачается zip.
4. Скинь zip в чат — картинки будут нарезаны и разложены по `assets/img/`.

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
