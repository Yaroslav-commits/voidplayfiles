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

## Картинки из Figma — кнопкой на GitHub (один раз)

1. Figma → аватарка → **Settings → Security → Personal access tokens** → создать токен (права *File content: Read only*), скопировать.
2. В репозитории на GitHub: **Settings → Secrets and variables → Actions → New repository secret**
   Name: `FIGMA_TOKEN`, Secret: вставить токен → Add secret.
3. Вкладка **Actions** → слева «Картинки из Figma» → **Run workflow**.
4. Через минуту в репозитории появится коммит «Картинки из Figma», GitHub Pages обновится сам.

Поменял картинки в Figma — снова нажми Run workflow.
(Можно и с компа: `python tools/figma_export.py ТОКЕН`.)

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
