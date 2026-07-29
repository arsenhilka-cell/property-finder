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
- Пакетный поиск: frontend параллельно запрашивает источники, а каждый API-вызов обходит до 5 страниц (по умолчанию 3). Это не даёт serverless-функции Vercel превысить лимит времени.
- Нормализация объявлений, дедупликация в рамках источника и частичные результаты при сбое одного из сайтов.
- Сортировка и клиентская пагинация по 50 карточек.
- Отправка карточки с комментарием в Telegram: `sendPhoto` с автоматическим fallback на `sendMessage`.
- Добавление карточки с комментарием в Google Sheets через Apps Script с защитой от дублей.

## Структура проекта

```text
api/
  search/               физические Vercel Functions для поиска по источникам
    olx.ts
    dimria.ts
    rieltor.ts
  [...path].ts          catch-all только для Telegram и Google Sheets
  _source-search.ts     общая реализация source search routes
  _app.ts               Telegram и Google Sheets API routes
  _search.ts            пакетный поиск и общий сервис для CLI
  _olx.ts               адаптер OLX
  _dimria.ts            адаптер DIM.RIA
  _rieltor.ts           адаптер RIELTOR
scripts/
  local-server.ts       локальный Node HTTP adapter для API и public/
public/
  index.html            страница поиска
  app.js                клиентская логика
  styles.css            стили
.env.example            шаблон переменных окружения
```

## Установка

```bash
git clone <your-repository-url>
cd property-finder
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

## Деплой на Vercel

Vercel автоматически обнаруживает отдельные функции `api/search/olx.ts`, `api/search/dimria.ts` и `api/search/rieltor.ts`; поэтому поисковые URL существуют как физические serverless routes. `api/[...path].ts` остаётся catch-all только для Telegram и Google Sheets. Локальный `node:http` сервер находится в `scripts/local-server.ts` и не является частью serverless deployment. Статические файлы из `public/` Vercel отдаёт без дополнительной конфигурации.

Поиск использует три endpoint'а: `POST /api/search/olx`, `POST /api/search/dimria` и `POST /api/search/rieltor`. В body передаются обычные фильтры плюс `sourcePage` и `sourcePageSize`; последний по умолчанию равен 3 и ограничен 5. Каждый ответ возвращает только лёгкие поля карточек, `fetchedPages`, `nextPage`, `hasMore`, `warnings` и, когда источник сообщает его, `reportedTotal`.

Город выбирается только из централизованного справочника `api/_cities.ts`. Клиент получает публичный список через `GET /api/cities`, а поиск принимает `cityId` (например, `odesa`), а не свободный текст. У каждого города хранятся отдельные mappings для OLX, DIM.RIA и RIELTOR; если у конкретного источника mapping отсутствует, API возвращает предупреждение и не подменяет город. Проверить алиасы можно командой `npm run test:cities`.

В настройках проекта Vercel добавьте те же Environment Variables, что перечислены в `.env.example`. Значения секретов не должны попадать в Git.

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
