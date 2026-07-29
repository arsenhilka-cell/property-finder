const pageSize = 50;
let listings = [];
let page = 1;
let activeSearch = null;
const form = document.querySelector('#search-form');
const cards = document.querySelector('#cards');
const summary = document.querySelector('#summary');
const counts = document.querySelector('#source-counts');
const notice = document.querySelector('#notice');
const pagination = document.querySelector('#pagination');
const sort = document.querySelector('#sort');
const submit = form.querySelector('button');
const stopSearch = document.querySelector('#stop-search');
const progress = document.querySelector('#search-progress');
const cityQuery = document.querySelector('#city-query');
const cityId = document.querySelector('#city-id');
const cityOptions = document.querySelector('#city-options');
const citySelected = document.querySelector('#city-selected');
const sendDialog = document.querySelector('#send-dialog');
const sendForm = document.querySelector('#send-form');
const sendTitle = document.querySelector('#send-title');
const sendSubmit = document.querySelector('#send-submit');
let selectedListing = null;
let sendMode = null;
let activeSheetsButton = null;

const sourceLabel = { olx: 'OLX', dimria: 'DIM.RIA', rieltor: 'RIELTOR' };
let cityCatalog = [];
const number = value => value === undefined ? '—' : new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(value);
const dateValue = value => { const parsed = value ? Date.parse(value) : NaN; return Number.isNaN(parsed) ? 0 : parsed; };

function sorted() {
  const output = [...listings];
  const missingLast = (a, b, direction) => (a === undefined ? 1 : b === undefined ? -1 : direction * (a - b));
  output.sort((a, b) => {
    if (sort.value === 'newest') return dateValue(b.publishedAt) - dateValue(a.publishedAt);
    if (sort.value === 'price-asc') return missingLast(a.price, b.price, 1);
    if (sort.value === 'price-desc') return missingLast(a.price, b.price, -1);
    if (sort.value === 'area-asc') return missingLast(a.area, b.area, 1);
    return missingLast(a.area, b.area, -1);
  });
  return output;
}

function render() {
  const output = sorted();
  const totalPages = Math.ceil(output.length / pageSize);
  page = Math.min(Math.max(page, 1), totalPages || 1);
  const visible = output.slice((page - 1) * pageSize, page * pageSize);
  cards.replaceChildren();
  if (!visible.length) { cards.innerHTML = '<div class="empty">По этим параметрам объявлений не найдено.</div>'; }
  for (const listing of visible) {
    const node = document.querySelector('#card-template').content.cloneNode(true);
    const image = node.querySelector('.photo');
    const photoPlaceholder = node.querySelector('.photo-placeholder');
    image.alt = listing.title;
    if (listing.imageUrl) {
      image.src = listing.imageUrl;
      image.onerror = () => { image.hidden = true; photoPlaceholder.hidden = false; };
    } else {
      image.hidden = true;
      photoPlaceholder.hidden = false;
    }
    node.querySelector('.source').textContent = sourceLabel[listing.source];
    node.querySelector('h3').textContent = listing.title;
    node.querySelector('.location').textContent = listing.location || listing.city || 'Локация не указана';
    node.querySelector('.published').textContent = listing.publishedAt ? `Опубликовано: ${listing.publishedAt}` : '';
    node.querySelector('.price').textContent = listing.price === undefined ? 'Цена не указана' : `${number(listing.price)} ${listing.currency || ''}`;
    node.querySelector('.area').textContent = listing.area === undefined ? 'Площадь не указана' : `${number(listing.area)} м²`;
    node.querySelector('.ppm').textContent = listing.pricePerM2 === undefined ? '' : `${number(listing.pricePerM2)} ${listing.currency || ''}/м²`;
    node.querySelector('.telegram').onclick = () => openSendDialog(listing, 'telegram');
    node.querySelector('.sheets').onclick = event => openSendDialog(listing, 'sheets', event.currentTarget);
    node.querySelector('.open').href = listing.listingUrl;
    cards.append(node);
  }
  pagination.replaceChildren();
  for (let item = 1; item <= totalPages; item++) { const button = document.createElement('button'); button.textContent = item; button.className = item === page ? 'active' : ''; button.onclick = () => { page = item; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }; pagination.append(button); }
}

function showNotice(text, type = '') { notice.textContent = text; notice.className = text ? `notice ${type}` : ''; }

function cityMatches(city, query) {
  const value = query.trim().toLowerCase().replace(/ё/g, 'е').replace(/[ʼ’`´]/g, "'");
  return !value || [city.labelRu, city.labelUk, city.id, ...city.aliases].some(alias => alias.toLowerCase().replace(/ё/g, 'е').replace(/[ʼ’`´]/g, "'").includes(value));
}

function renderCityOptions() {
  const matches = cityCatalog.filter(city => cityMatches(city, cityQuery.value)).slice(0, 80);
  cityOptions.replaceChildren(...matches.map(city => {
    const option = document.createElement('button');
    option.type = 'button'; option.className = 'city-option'; option.role = 'option'; option.textContent = city.labelRu;
    option.onclick = () => selectCity(city);
    return option;
  }));
  cityOptions.hidden = matches.length === 0;
  cityQuery.setAttribute('aria-expanded', String(!cityOptions.hidden));
}

function selectCity(city) {
  cityId.value = city.id;
  cityQuery.value = city.labelRu;
  citySelected.textContent = `Выбран город: ${city.labelRu}`;
  cityOptions.hidden = true;
  cityQuery.setAttribute('aria-expanded', 'false');
}

async function loadCities() {
  try {
    const response = await fetch('/api/cities');
    const result = await readJsonResponse(response);
    cityCatalog = result.cities || [];
    const defaultCity = cityCatalog.find(city => city.id === 'odesa');
    if (defaultCity) selectCity(defaultCity);
    cityQuery.addEventListener('focus', renderCityOptions);
    cityQuery.addEventListener('input', () => { cityId.value = ''; citySelected.textContent = 'Выберите город из списка'; renderCityOptions(); });
    cityQuery.addEventListener('blur', () => setTimeout(() => { cityOptions.hidden = true; cityQuery.setAttribute('aria-expanded', 'false'); }, 120));
  } catch (error) {
    citySelected.textContent = `Не удалось загрузить города: ${error.message}`;
    cityQuery.disabled = true;
  }
}

async function readJsonResponse(response) {
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; }
  catch { throw new Error(`HTTP ${response.status}: ${text.slice(0, 180) || 'сервер вернул не-JSON ответ'}`); }
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${body.error || body.message || 'ошибка запроса'}`);
  return body;
}

function listingKey(listing) { return `${listing.source}:${listing.sourceId || listing.listingUrl}`; }

function renderProgress(state) {
  progress.replaceChildren(...Object.entries(state.sources).map(([source, item]) => {
    const row = document.createElement('div');
    const status = item.error ? `ошибка: ${item.error}` : item.warning ? `предупреждение: ${item.warning}` : item.done ? 'готово' : 'загружаем...';
    row.className = `progress-item ${item.error ? 'error' : item.done ? 'done' : 'loading'}`;
    row.textContent = `${sourceLabel[source]}: ${item.count} найдено, ${status}`;
    return row;
  }));
  counts.replaceChildren(...Object.entries(state.sources).map(([source, item]) => { const tag = document.createElement('span'); tag.className = 'count'; tag.textContent = `${sourceLabel[source]} ${item.count}`; return tag; }));
  summary.textContent = `Найдено: ${listings.length}`;
}

async function loadSource(source, payload, state, listingMap) {
  const item = state.sources[source];
  while (!state.stopped && item.hasMore) {
    try {
      const response = await fetch(`/api/search/${source}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...payload, sourcePage: item.nextPage, sourcePageSize: 3 }) });
      const result = await readJsonResponse(response);
      for (const listing of result.listings || []) listingMap.set(listingKey(listing), listing);
      listings = [...listingMap.values()];
      item.count = [...listingMap.values()].filter(listing => listing.source === source).length;
      item.nextPage = result.nextPage;
      item.hasMore = result.hasMore;
      if (result.warnings?.length) item.warning = result.warnings.join(' ');
      if (!item.hasMore) item.done = true;
      page = 1;
      renderProgress(state); render();
    } catch (error) {
      item.error = error.message;
      item.done = true;
      item.hasMore = false;
      renderProgress(state);
      showNotice(`Часть источников недоступна. ${sourceLabel[source]}: ${error.message}`, 'warning');
    }
  }
  if (state.stopped && !item.done) { item.done = true; item.warning = 'поиск остановлен'; renderProgress(state); }
}

function openSendDialog(listing, mode, sheetsButton = null) {
  selectedListing = listing;
  sendMode = mode;
  activeSheetsButton = sheetsButton;
  sendForm.reset();
  sendTitle.textContent = mode === 'telegram' ? 'Отправить в Telegram' : 'Добавить в таблицу';
  sendSubmit.textContent = mode === 'telegram' ? 'Отправить' : 'Добавить';
  sendDialog.showModal();
  sendForm.elements.comment.focus();
}

function closeSendDialog() {
  sendDialog.close();
  selectedListing = null;
  sendMode = null;
  activeSheetsButton = null;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const payload = Object.fromEntries(['cityId', 'operation', 'minPrice', 'maxPrice', 'minArea', 'maxArea'].map(key => [key, data.get(key) || undefined]));
  const selected = data.getAll('sources');
  if (!payload.cityId) { showNotice('Выберите город из списка', 'error'); cityQuery.focus(); return; }
  if (!selected.length) { showNotice('Выберите хотя бы один источник', 'error'); return; }
  const state = { stopped: false, sources: Object.fromEntries(selected.map(source => [source, { count: 0, nextPage: 1, hasMore: true, done: false }])) };
  activeSearch = state; listings = []; page = 1; cards.replaceChildren(); pagination.replaceChildren();
  submit.disabled = true; stopSearch.disabled = false; showNotice('Ищем объявления...', 'loading'); renderProgress(state);
  const listingMap = new Map();
  Promise.all(selected.map(source => loadSource(source, payload, state, listingMap))).then(() => {
    if (activeSearch !== state) return;
    submit.disabled = false; stopSearch.disabled = true;
    if (!state.stopped) showNotice('Поиск завершён');
  });
});
stopSearch.addEventListener('click', () => { if (activeSearch) { activeSearch.stopped = true; stopSearch.disabled = true; showNotice('Останавливаем поиск после текущих пакетов...', 'warning'); } });
sort.addEventListener('change', () => { page = 1; render(); });
sendDialog.querySelector('[data-cancel]').addEventListener('click', closeSendDialog);
sendDialog.querySelector('.icon-close').addEventListener('click', closeSendDialog);
sendForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!selectedListing || !sendMode) return;
  sendSubmit.disabled = true;
  try {
    const endpoint = sendMode === 'telegram' ? '/api/telegram' : '/api/sheets';
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ listing: selectedListing, comment: sendForm.elements.comment.value }) });
    const result = await readJsonResponse(response);
    if (!result.ok) throw new Error(result.error || 'Сервис не принял запрос');
    const mode = sendMode;
    const sheetsButton = activeSheetsButton;
    closeSendDialog();
    if (mode === 'telegram') showNotice('Отправлено в Telegram');
    else if (result.status === 'added') {
      if (sheetsButton) { sheetsButton.textContent = '✓ В таблице'; sheetsButton.disabled = true; sheetsButton.classList.add('in-sheet'); }
      showNotice('✓ Добавлено в таблицу');
    } else if (result.status === 'already_exists') showNotice('Уже есть в таблице');
    else throw new Error('Google Sheets вернул неизвестный статус');
  } catch (error) { showNotice(`Не удалось отправить: ${error.message}`, 'error'); }
  finally { sendSubmit.disabled = false; }
});
loadCities();
