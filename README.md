# Property Finder Ukraine MVP

Минимальный веб-агрегатор объявлений коммерческой недвижимости Украины. Проект ищет объекты на OLX, DIM.RIA и RIELTOR, показывает результаты в браузере и позволяет отправить выбранное объявление в Telegram или Google Sheets.

## Стек

- Node.js 22+ и TypeScript
- Встроенные `node:http` и `fetch` — без backend-фреймворка
- Vanilla HTML, CSS и JavaScript — без frontend-фреймворка
- Telegram Bot API
- Google Apps Script Web App для Google Sheets

## Возможности

- Поиск коммерческой недвижимости по городу, операции, цене и площади.
- Источники: OLX, DIM.RIA, RIELTOR.
- Нормализация объявлений, дедупликация в рамках источника и частичные результаты при сбое одного из сайтов.
- Сортировка и клиентская пагинация по 50 карточек.
- Отправка карточки с комментарием в Telegram: `sendPhoto` с автоматическим fallback на `sendMessage`.
- Добавление карточки с комментарием в Google Sheets через Apps Script с защитой от дублей.

## Структура проекта

```text
src/
  server.ts             HTTP-сервер и API endpoints
  search-listings.ts    единый сервис поиска
  sources/              адаптеры OLX, DIM.RIA и RIELTOR
  utils/http.ts         HTTP-клиент, таймауты и задержки
  types.ts              общие TypeScript-типы
public/
  index.html            страница поиска
  app.js                клиентская логика
  styles.css            стили
.env.example            шаблон переменных окружения
```

## Установка

```bash
git clone <your-repository-url>
cd new-chat
cp .env.example .env
npm install
```

У проекта нет npm-зависимостей, но `npm install` можно выполнить для стандартного рабочего процесса.

## Настройка окружения

Заполните локальный файл `.env`:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
GOOGLE_APPS_SCRIPT_URL=
GOOGLE_APPS_SCRIPT_SECRET=
PORT=3000
```

`.env` исключён из Git. Не добавляйте реальные токены или секреты в репозиторий.

## Запуск

```bash
npm start
```

Откройте [http://localhost:3000](http://localhost:3000).

Полезные исследовательские команды:

```bash
npm run test:olx
npm run test:dimria
npm run test:rieltor
npm run search:test
```

## Скриншоты

<!-- Add screenshots here before publishing. Suggested paths:
docs/screenshots/search-results.png
docs/screenshots/send-to-telegram.png
docs/screenshots/add-to-sheets.png
-->

_Место для скриншотов интерфейса поиска, отправки в Telegram и добавления в таблицу._

## Лицензия

Проект распространяется по лицензии [MIT](LICENSE).
